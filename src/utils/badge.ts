import { TableItem } from '../types/table';
import { LengthUnit, UnitConfig } from '../types/unit';
import { ItemBadgeInfo } from '../types/badge';
import { evaluateExpression } from './expression';
import { formatLengthValue } from './unit';

/**
 * 格式化偏差字符串，自动补齐正负号 (如 "0.1" -> "+0.1", "0" -> "0")
 */
function formatDeviation(val: string | undefined, defaultSign: '+' | '-'): string {
  if (!val) return '0';
  const trimmed = val.trim();
  if (!trimmed || trimmed === '0') return '0';
  if (trimmed.startsWith('+') || trimmed.startsWith('-')) return trimmed;
  return `${defaultSign}${trimmed}`;
}

/**
 * 依据 TableItem 的工程来源（配合、自由公差、常规公差、表达式、原始单位换算）
 * 解析生成所有生效的徽标元数据。支持同时呈现基准尺寸与公差数值（如 "20 +0.1/-0.1"、"20 H7"）。
 */
export function getItemBadges(item: TableItem, unitConfig: UnitConfig): ItemBadgeInfo[] {
  const badges: ItemBadgeInfo[] = [];

  // =========================================================================
  // 1. 表达式来源 (计算公式/算式)：优先判定，且与公差互斥，绝不串出公差徽标
  // =========================================================================
  const isExpression = item.source === 'expression' || (Boolean(item.expression) && item.source !== 'tolerance');
  const isTolerance = !isExpression && (item.source === 'tolerance' || Boolean(item.toleranceInput));

  if (isExpression) {
    const rawExpr = item.expression || item.rawInput || '';
    const cleanExpr = rawExpr.startsWith('=') ? rawExpr.slice(1).trim() : rawExpr.trim();
    const shortExpr = cleanExpr.length > 14 ? `${cleanExpr.slice(0, 12)}…` : cleanExpr;
    const exprUnit: LengthUnit =
      item.expressionUnit ||
      (item.rawUnit === 'inch' || item.rawUnit === 'mm' ? (item.rawUnit as LengthUnit) : unitConfig.inputUnit);

    badges.push({
      id: `expr-${item.id}`,
      type: 'expression',
      label: shortExpr || cleanExpr || rawExpr,
      shortLabel: shortExpr || cleanExpr || rawExpr,
      tooltip: `计算算式: ${rawExpr || item.value} (${exprUnit === 'inch' ? '英制 inch' : '公制 mm'})`,
      theme: 'purple',
    });
  }

  // =========================================================================
  // 2. 公差来源：仅在非表达式场景下生效 (配合代号 / 自由公差 / 常规上下偏差)
  // =========================================================================
  else if (item.source === 'tolerance' || item.toleranceInput) {
    // 2.1 配合公差代号徽标 (ISO 286 / GB 1800，如 "20 H7")
    if (item.toleranceInput?.fitCode) {
      const ti = item.toleranceInput;
      const nominal = ti.nominal?.trim() || item.rawInput?.trim() || '';
      const label = nominal ? `${nominal} ${ti.fitCode}` : ti.fitCode;
      const devPart =
        ti.upper || ti.lower
          ? ` (+${ti.upper || '0'}/-${ti.lower || '0'})`
          : '';

      badges.push({
        id: `fit-${item.id}`,
        type: 'fit',
        label,
        shortLabel: label,
        tooltip: `配合公差: ISO 286 / GB 1800 ${label}${devPart} (基准: ${ti.nominal}, 上偏差 +${ti.upper} / 下偏差 -${ti.lower})`,
        theme: 'blue',
      });
    }

    // 2.2 自由公差等级徽标 (GB/T 1804，如 "20 ±0.2 (m级)")
    else if (item.toleranceInput?.freeGrade) {
      const ti = item.toleranceInput;
      const nominal = ti.nominal?.trim() || item.rawInput?.trim() || '';
      const devNum = ti.upper ? ti.upper.replace(/^[+-]/, '') : '';
      const devText = devNum ? `±${devNum}` : '';

      const label = nominal
        ? devText
          ? `${nominal} ${devText} (${ti.freeGrade}级)`
          : `${nominal} ${ti.freeGrade}级`
        : devText
        ? `${ti.freeGrade}级 (${devText})`
        : `${ti.freeGrade}级`;

      badges.push({
        id: `free-${item.id}`,
        type: 'free',
        label,
        shortLabel: nominal ? `${nominal} ${ti.freeGrade}级` : `${ti.freeGrade}级`,
        tooltip: `自由公差: GB/T 1804-${ti.freeGrade} (基准: ${ti.nominal}, 偏差 ${devText || `±${ti.upper}`})`,
        theme: 'green',
      });
    }

    // 2.3 常规/手动公差徽标 (基准尺寸 + 上下偏差，如 "20 +0.1/-0.1")
    else if (item.toleranceInput) {
      const ti = item.toleranceInput;
      const nominal = ti?.nominal?.trim() || (item.rawInput !== item.value ? item.rawInput?.trim() : '') || '';
      const uNum = parseFloat(ti.upper || '0');
      const lNum = parseFloat(ti.lower || '0');

      // 仅当确实有公差数值或明确设定了基准名义值时展示
      if (!isNaN(uNum) && !isNaN(lNum) && (uNum !== 0 || lNum !== 0 || nominal)) {
        const uText = formatDeviation(ti.upper, '+');
        const lText = formatDeviation(ti.lower, '-');
        const devStr = `${uText}/${lText}`;
        const tolLabel = nominal ? `${nominal} ${devStr}` : devStr;

        const modeText =
          ti?.selected === 'upper' ? '上偏差' : ti?.selected === 'lower' ? '下偏差' : '中间值';
        const tooltipText = `公差中值计算 | 基准: ${ti.nominal || nominal} | 上偏差: +${ti.upper}, 下偏差: -${ti.lower} | 取: ${modeText} (当前切点值: ${item.value})`;

        badges.push({
          id: `tol-${item.id}`,
          type: 'tolerance',
          label: tolLabel,
          shortLabel: tolLabel,
          tooltip: tooltipText,
          theme: 'cyan',
        });
      }
    }
  }

  // =========================================================================
  // 3. 原始工程尺寸徽标 (跨单位换算如英转公，或分数输入)
  // =========================================================================
  // 核心判定准则：
  // 1. 公差项（toleranceInput）已在公差徽标中完整呈现基准尺寸与偏差（如 "20 +0.1/-0.1"），
  //    中值计算产生的偏差是正常工程运算，在同单位（mm->mm 或 inch->inch）下绝不重复显示 "原:"。
  // 2. 算式项（expression）公式已在表达式徽标中呈现，也不显示 "原:"。
  // 3. 仅在以下两种合理场景下显示 "原:" 徽标：
  //    a) 发生了实际跨单位换算（如输入为英制，当前显示为公制，反之亦然）
  //    b) 同单位下录入了分数尺寸（如 "1/2"、"3/8"）
  const itemEffectiveRawUnit: LengthUnit =
    item.expressionUnit ||
    (item.rawUnit === 'inch' || item.rawUnit === 'mm' ? (item.rawUnit as LengthUnit) : unitConfig.inputUnit);
  const isCrossUnitConverted = Boolean(
    item.rawInput && itemEffectiveRawUnit !== unitConfig.displayUnit
  );
  const isFractionInput = Boolean(item.rawInput && item.rawInput.includes('/'));

  if (isCrossUnitConverted || (!isExpression && !isTolerance && isFractionInput)) {
    const unitSymbol = itemEffectiveRawUnit === 'inch' ? '″' : itemEffectiveRawUnit === 'mm' ? 'mm' : '';
    let rawVal = item.rawInput ? item.rawInput.trim() : '';

    // 若当前为算式来源且 rawInput 仍是未求值的公式字符串（如 "12+6" 或 "=12+6"），求出并在徽标展示其数值结果（如 "18"）
    if (isExpression && rawVal) {
      const cleanRaw = rawVal.startsWith('=') ? rawVal.slice(1).trim() : rawVal;
      const ev = evaluateExpression(cleanRaw);
      if (!ev.error && isFinite(ev.value)) {
        const inDecimals = itemEffectiveRawUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;
        rawVal = formatLengthValue(ev.value, itemEffectiveRawUnit, inDecimals);
      }
    }

    const rawText = rawVal ? `${rawVal}${unitSymbol}` : '';

    if (rawText && rawText !== item.value && rawText !== item.expression) {
      badges.push({
        id: `raw-${item.id}`,
        type: 'raw',
        label: `原: ${rawText}`,
        shortLabel: rawText,
        tooltip: `图纸原始输入: ${rawVal} ${itemEffectiveRawUnit}`,
        theme: 'gray',
      });
    }
  }

  return badges;
}
