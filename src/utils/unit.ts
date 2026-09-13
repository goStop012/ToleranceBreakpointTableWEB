import { LengthUnit, UnitConfig, UnitMode, ExistingValueConversionStrategy } from '../types/unit';
import { TableData, TableItem } from '../types/table';
import { trimN } from './math';
import { evaluateExpression } from './expression';

export const MM_PER_INCH = 25.4;

/**
 * 解析可能包含英制分数的字符串，如 "1/2", "3/8", "1 1/4", "1-1/4", "0.5"
 */
export function parseNumberOrFraction(input: string): number | null {
  const clean = input.trim();
  if (!clean) return null;

  // 1. 标准带分数格式，如 "1 1/4" 或 "1-1/4"
  const mixedMatch = clean.match(/^([+-]?\d+)\s+([+-]?\d+)\/(\d+)$/) || clean.match(/^([+-]?\d+)-([+-]?\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (den !== 0) {
      const sign = whole < 0 ? -1 : 1;
      return whole + sign * (num / den);
    }
  }

  // 2. 简单分数格式，如 "3/8", "1/2"
  const fractionMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    if (den !== 0) {
      return num / den;
    }
  }

  // 3. 常规浮点数
  const num = parseFloat(clean);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }

  return null;
}

/**
 * 单位换算核心函数
 */
export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  if (from === to) return value;

  if (from === 'inch' && to === 'mm') {
    return value * MM_PER_INCH;
  }
  if (from === 'mm' && to === 'inch') {
    return value / MM_PER_INCH;
  }
  return value;
}

/**
 * 格式化数值字符串，支持指定小数位或自适应去除多余后缀0
 */
export function formatLengthValue(value: number, unit: LengthUnit, customDecimals?: number): string {
  const decimals = customDecimals ?? (unit === 'mm' ? 3 : 4);
  return trimN(value, decimals);
}

/**
 * 将用户输入的字符串根据从 from 到 to 的单位换算为目标字符串
 */
export function processInputWithUnit(
  input: string,
  from: LengthUnit,
  to: LengthUnit,
  customDecimals?: number
): { display: string; numValue: number; convertedValue: number } | null {
  const num = parseNumberOrFraction(input);
  if (num === null) return null;

  const converted = convertLength(num, from, to);
  return {
    display: formatLengthValue(converted, to, customDecimals),
    numValue: num,
    convertedValue: converted,
  };
}

/**
 * 根据 UnitMode 获得对应的输入单位与显示单位
 */
export function getUnitsFromMode(mode: UnitMode): { inputUnit: LengthUnit; displayUnit: LengthUnit } {
  switch (mode) {
    case 'in_to_mm':
      return { inputUnit: 'inch', displayUnit: 'mm' };
    case 'mm_to_mm':
      return { inputUnit: 'mm', displayUnit: 'mm' };
    case 'in_to_in':
      return { inputUnit: 'inch', displayUnit: 'inch' };
    case 'mm_to_in':
      return { inputUnit: 'mm', displayUnit: 'inch' };
  }
}

/**
 * 核心：计算或换算单个条目在目标单位模式下的所有属性（value, toleranceInput, rawInput, rawUnit）
 */
export function recalculateTableItem(
  it: TableItem,
  prevConfig: UnitConfig,
  nextConfig: UnitConfig,
  strategy: ExistingValueConversionStrategy = 'convert_display'
): TableItem {
  if (strategy === 'keep_raw') {
    return it;
  }

  const targetDecimals = nextConfig.displayUnit === 'mm' ? nextConfig.mmDecimals : nextConfig.inchDecimals;
  const inputDecimals = nextConfig.inputUnit === 'mm' ? nextConfig.mmDecimals : nextConfig.inchDecimals;

  // 1. 公差计算生成的记录 (source === 'tolerance')
  if (it.source === 'tolerance' && it.toleranceInput) {
    const ti = it.toleranceInput;
    let nomNum = parseNumberOrFraction(ti.nominal) ?? 0;
    let upperNum = parseNumberOrFraction(ti.upper) ?? 0;
    let lowerNum = parseNumberOrFraction(ti.lower) ?? 0;
    const selected = ti.selected || 'middle';

    let updatedTi = { ...ti };
    let updatedRawInput = it.rawInput;
    let updatedRawUnit = nextConfig.inputUnit;

    if (strategy === 'convert_display') {
      // 保持物理尺寸不变：若输入单位变更（如 inch <-> mm），将名义值和公差偏差转换至新输入单位
      if (prevConfig.inputUnit !== nextConfig.inputUnit) {
        nomNum = convertLength(nomNum, prevConfig.inputUnit, nextConfig.inputUnit);
        upperNum = convertLength(upperNum, prevConfig.inputUnit, nextConfig.inputUnit);
        lowerNum = convertLength(lowerNum, prevConfig.inputUnit, nextConfig.inputUnit);

        const newNomStr = formatLengthValue(nomNum, nextConfig.inputUnit, inputDecimals);
        const newUpperStr = formatLengthValue(upperNum, nextConfig.inputUnit, inputDecimals);
        const newLowerStr = formatLengthValue(lowerNum, nextConfig.inputUnit, inputDecimals);

        updatedTi = {
          ...updatedTi,
          nominal: newNomStr,
          upper: newUpperStr,
          lower: newLowerStr,
        };
        updatedRawInput = newNomStr;
      }
    }

    // 在新模式下计算选定基准的输入值与目标显示值（与 CalculatorModal 实时算法完全一致）
    let inVal = nomNum;
    if (selected === 'upper') {
      inVal = nomNum + upperNum;
    } else if (selected === 'lower') {
      inVal = nomNum + lowerNum;
    } else {
      inVal = nomNum + (upperNum + lowerNum) / 2;
    }

    const dispVal = convertLength(inVal, nextConfig.inputUnit, nextConfig.displayUnit);
    const formatted = formatLengthValue(dispVal, nextConfig.displayUnit, targetDecimals);

    return {
      ...it,
      value: formatted,
      toleranceInput: updatedTi,
      rawInput: updatedRawInput,
      rawUnit: updatedRawUnit,
    };
  }

  // 2. 表达式计算生成的记录 (source === 'expression')
  if (it.source === 'expression' && it.expression && it.expression.trim() !== '') {
    const ev = evaluateExpression(it.expression);
    if (!ev.error) {
      // 物理量纲锚点：优先使用记录自身的 expressionUnit，其次 rawUnit，最后回退至切换前的 inputUnit
      const originUnit: LengthUnit =
        it.expressionUnit ||
        (it.rawUnit === 'inch' || it.rawUnit === 'mm' ? (it.rawUnit as LengthUnit) : prevConfig.inputUnit);

      const valInOrigin = ev.value;
      const dispVal = convertLength(valInOrigin, originUnit, nextConfig.displayUnit);
      const formatted = formatLengthValue(dispVal, nextConfig.displayUnit, targetDecimals);

      const originDecimals = originUnit === 'mm' ? nextConfig.mmDecimals : nextConfig.inchDecimals;
      const rawEvaluated = formatLengthValue(valInOrigin, originUnit, originDecimals);

      return {
        ...it,
        value: formatted,
        expressionUnit: originUnit,
        rawInput: rawEvaluated,
        rawUnit: originUnit,
      };
    }
  }

  // 3. 普通输入且存有 rawInput（例如分数字符串或带单位换算的原始输入）
  if (it.rawInput && it.rawInput.trim() !== '') {
    const parsed = parseNumberOrFraction(it.rawInput);
    if (parsed !== null) {
      let valInInput = parsed;
      let rawInputStr = it.rawInput;

      if (strategy === 'convert_display' && prevConfig.inputUnit !== nextConfig.inputUnit) {
        valInInput = convertLength(valInInput, prevConfig.inputUnit, nextConfig.inputUnit);
        rawInputStr = formatLengthValue(valInInput, nextConfig.inputUnit, inputDecimals);
      }

      const dispVal = convertLength(valInInput, nextConfig.inputUnit, nextConfig.displayUnit);
      const formatted = formatLengthValue(dispVal, nextConfig.displayUnit, targetDecimals);
      return {
        ...it,
        value: formatted,
        rawInput: rawInputStr,
        rawUnit: nextConfig.inputUnit,
      };
    }
  }

  // 4. 普通纯数值记录（无 rawInput）
  if (it.value && it.value.trim() !== '') {
    const parsed = parseNumberOrFraction(it.value);
    if (parsed !== null) {
      let converted = parsed;
      if (strategy === 'convert_display') {
        if (prevConfig.displayUnit !== nextConfig.displayUnit) {
          converted = convertLength(parsed, prevConfig.displayUnit, nextConfig.displayUnit);
        }
      } else if (strategy === 'recalc_from_input') {
        converted = convertLength(parsed, nextConfig.inputUnit, nextConfig.displayUnit);
      }
      const formatted = formatLengthValue(converted, nextConfig.displayUnit, targetDecimals);
      return {
        ...it,
        value: formatted,
        rawInput: it.rawInput || formatted,
        rawUnit: nextConfig.inputUnit,
      };
    }
  }

  return it;
}

/**
 * 核心：根据单位模式切换策略，将单行或整个列表的数值进行相应换算
 */
export function convertTableItemsWithConfig(
  items: TableItem[],
  prevConfig: UnitConfig,
  nextConfig: UnitConfig,
  strategy: ExistingValueConversionStrategy = 'convert_display'
): TableItem[] {
  if (strategy === 'keep_raw') {
    return items;
  }

  return items.map((it) => recalculateTableItem(it, prevConfig, nextConfig, strategy));
}

/**
 * 转换所有表格的数据
 */
export function convertAllTablesUnit(
  tables: TableData[],
  prevConfig: UnitConfig,
  nextConfig: UnitConfig,
  strategy: ExistingValueConversionStrategy = 'convert_display'
): TableData[] {
  return tables.map((table) => ({
    ...table,
    items: convertTableItemsWithConfig(table.items, prevConfig, nextConfig, strategy),
  }));
}

/**
 * 批量将表格数据进行单位换算（旧兼容方法）
 */
export function convertTableItemsUnit(
  items: TableItem[],
  from: LengthUnit,
  to: LengthUnit,
  decimals?: number
): TableItem[] {
  if (from === to) return items;

  return items.map((it) => {
    if (!it.value || !it.value.trim()) return it;

    const num = parseFloat(it.value);
    if (isNaN(num)) return it;

    const convertedVal = convertLength(num, from, to);
    const formatted = formatLengthValue(convertedVal, to, decimals);

    let updatedTolerance = it.toleranceInput;
    if (updatedTolerance) {
      const nom = parseFloat(updatedTolerance.nominal);
      const u = parseFloat(updatedTolerance.upper);
      const l = parseFloat(updatedTolerance.lower);

      updatedTolerance = {
        ...updatedTolerance,
        nominal: !isNaN(nom) ? formatLengthValue(convertLength(nom, from, to), to, decimals) : updatedTolerance.nominal,
        upper: !isNaN(u) ? formatLengthValue(convertLength(u, from, to), to, decimals) : updatedTolerance.upper,
        lower: !isNaN(l) ? formatLengthValue(convertLength(l, from, to), to, decimals) : updatedTolerance.lower,
      };
    }

    return {
      ...it,
      value: formatted,
      toleranceInput: updatedTolerance,
    };
  });
}

