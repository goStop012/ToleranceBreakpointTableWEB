import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertLength,
  parseNumberOrFraction,
  formatLengthValue,
  convertTableItemsWithConfig,
  recalculateTableItem,
} from './unit';
import { TableItem } from '../types/table';
import { UnitConfig } from '../types/unit';
import { getItemBadges } from './badge';

const mmToMm: UnitConfig = {
  mode: 'mm_to_mm',
  inputUnit: 'mm',
  displayUnit: 'mm',
  mmDecimals: 3,
  inchDecimals: 4,
};

const inToMm: UnitConfig = {
  mode: 'in_to_mm',
  inputUnit: 'inch',
  displayUnit: 'mm',
  mmDecimals: 3,
  inchDecimals: 4,
};

const inToIn: UnitConfig = {
  mode: 'in_to_in',
  inputUnit: 'inch',
  displayUnit: 'inch',
  mmDecimals: 3,
  inchDecimals: 4,
};

const mmToIn: UnitConfig = {
  mode: 'mm_to_in',
  inputUnit: 'mm',
  displayUnit: 'inch',
  mmDecimals: 3,
  inchDecimals: 4,
};

describe('单位换算与模式切换测试套件 (Unit Conversion & Mode Switching)', () => {
  describe('1. 基础物理换算精度 (convertLength)', () => {
    it('1 英寸严格等于 25.4 毫米', () => {
      assert.equal(convertLength(1, 'inch', 'mm'), 25.4);
      assert.equal(convertLength(25.4, 'mm', 'inch'), 1);
    });

    it('0 和负数以及异常值安全转换', () => {
      assert.equal(convertLength(0, 'mm', 'inch'), 0);
      assert.equal(convertLength(-25.4, 'mm', 'inch'), -1);
      assert.equal(convertLength(NaN, 'mm', 'inch'), 0);
    });

    it('分数解析支持简单分数与带分数', () => {
      assert.equal(parseNumberOrFraction('1/2'), 0.5);
      assert.equal(parseNumberOrFraction('3/8'), 0.375);
      assert.equal(parseNumberOrFraction('1 1/4'), 1.25);
      assert.equal(parseNumberOrFraction('1-1/2'), 1.5);
    });
  });

  describe('2. 普通切点值在单位切换下的行为', () => {
    it('从 mm_to_mm 切换到 in_to_in (保持物理尺寸 convert_display)', () => {
      const items: TableItem[] = [
        { id: '1', label: '1', value: '25.400', rawInput: '25.400', rawUnit: 'mm' },
      ];

      const converted = convertTableItemsWithConfig(items, mmToMm, inToIn, 'convert_display');
      assert.equal(converted[0].value, '1');
      assert.equal(converted[0].rawInput, '1');
      assert.equal(converted[0].rawUnit, 'inch');
    });

    it('从 in_to_in 切换到 in_to_mm (输入英制，显示公制)', () => {
      const items: TableItem[] = [
        { id: '1', label: '1', value: '2', rawInput: '2', rawUnit: 'inch' },
      ];

      const converted = convertTableItemsWithConfig(items, inToIn, inToMm, 'convert_display');
      assert.equal(converted[0].value, '50.8', '2英寸应换算为 50.8 毫米显示');
      assert.equal(converted[0].rawInput, '2', '输入单位未变，原始输入 2 英寸应保持');
      assert.equal(converted[0].rawUnit, 'inch');

      // 验证徽标：跨单位显示 "原: 2″"
      const badges = getItemBadges(converted[0], inToMm);
      const rawBadge = badges.find((b) => b.type === 'raw');
      assert.ok(rawBadge);
      assert.equal(rawBadge.label, '原: 2″');
    });

    it('keep_raw 策略：数值不换算，直接保持字面值', () => {
      const items: TableItem[] = [
        { id: '1', label: '1', value: '25.400', rawInput: '25.400', rawUnit: 'mm' },
      ];

      const kept = convertTableItemsWithConfig(items, mmToMm, inToIn, 'keep_raw');
      assert.equal(kept[0].value, '25.400');
    });
  });

  describe('3. 公差项在单位切换下的行为', () => {
    it('mm_to_mm 切换到 in_to_in：名义值与公差偏差正确换算为英制，中值正确', () => {
      // 25.4 +0.254/-0.254 mm -> 中值 25.4 mm -> 英制 1.0", 偏差 0.01"
      const item: TableItem = {
        id: 'tol-1',
        label: '1',
        value: '25.4',
        source: 'tolerance',
        rawInput: '25.4',
        rawUnit: 'mm',
        toleranceInput: {
          nominal: '25.4',
          upper: '0.254',
          lower: '-0.254',
          selected: 'middle',
        },
      };

      const result = recalculateTableItem(item, mmToMm, inToIn, 'convert_display');
      // 25.4mm = 1", 0.254mm = 0.01"
      assert.equal(result.value, '1');
      assert.equal(result.toleranceInput?.nominal, '1');
      assert.equal(result.toleranceInput?.upper, '0.01');
      assert.equal(result.toleranceInput?.lower, '-0.01');
      assert.equal(result.rawUnit, 'inch');
    });

    it('in_to_in 切换到 in_to_mm：名义值与偏差保持英制，显示值自动换算为毫米', () => {
      const item: TableItem = {
        id: 'tol-2',
        label: '1',
        value: '1',
        source: 'tolerance',
        rawInput: '1',
        rawUnit: 'inch',
        toleranceInput: {
          nominal: '1',
          upper: '0.01',
          lower: '-0.01',
          selected: 'middle',
        },
      };

      const result = recalculateTableItem(item, inToIn, inToMm, 'convert_display');
      assert.equal(result.value, '25.4', '显示值应为 25.4 mm');
      assert.equal(result.toleranceInput?.nominal, '1', '输入单位未变，名义值仍为 1 inch');
      assert.equal(result.toleranceInput?.upper, '0.01');
      assert.equal(result.toleranceInput?.lower, '-0.01');
    });
  });

  describe('4. 表达式算式在单位切换下的行为', () => {
    it('in_to_in 切换到 in_to_mm：表达式保持，显示值换算为毫米', () => {
      const item: TableItem = {
        id: 'expr-1',
        label: '1',
        value: '18',
        source: 'expression',
        expression: '12+6',
        expressionUnit: 'inch',
        rawInput: '18',
        rawUnit: 'inch',
      };

      const result = recalculateTableItem(item, inToIn, inToMm, 'convert_display');
      assert.equal(result.value, '457.2', '18英寸求值应转为 457.2 毫米');
      assert.equal(result.expression, '12+6');
      assert.equal(result.rawInput, '18');
      assert.equal(result.expressionUnit, 'inch', '物理量纲锚点应保持为 inch');

      // 验证徽标：显示公式 12+6 和 原: 18″
      const badges = getItemBadges(result, inToMm);
      assert.equal(badges.find((b) => b.type === 'expression')?.label, '12+6');
      assert.equal(badges.find((b) => b.type === 'raw')?.label, '原: 18″');
    });

    it('连续往返切换 (in_to_in -> mm_to_mm -> mm_to_in -> in_to_in)：量纲锚定保持物理尺寸绝对恒定，绝不缩水或漂移', () => {
      const item: TableItem = {
        id: 'expr-anchor-roundtrip',
        label: '1',
        value: '18',
        source: 'expression',
        expression: '12+6',
        expressionUnit: 'inch',
        rawInput: '18',
        rawUnit: 'inch',
      };

      // 第1次切换：英制 -> 公制 (mm_to_mm)
      const step1 = recalculateTableItem(item, inToIn, mmToMm, 'convert_display');
      assert.equal(step1.value, '457.2', '转为公制显示应为 457.2 毫米');
      assert.equal(step1.expression, '12+6');
      assert.equal(step1.expressionUnit, 'inch', '锚点保持 inch');
      assert.equal(step1.rawInput, '18', '原始求值保持 18');
      assert.equal(step1.rawUnit, 'inch', '原始单位保持 inch');

      // 验证第1步徽标：机床看457.2mm，徽标写公式12+6且原值18″
      const badges1 = getItemBadges(step1, mmToMm);
      assert.equal(badges1.find((b) => b.type === 'expression')?.label, '12+6');
      assert.equal(badges1.find((b) => b.type === 'raw')?.label, '原: 18″');

      // 第2次切换：公制输入公制显示 -> 公制输入英制显示 (mm_to_in)
      const step2 = recalculateTableItem(step1, mmToMm, mmToIn, 'convert_display');
      assert.equal(step2.value, '18', '转回英制显示应为 18 英寸，绝对不应缩水为 0.7087 英寸');
      assert.equal(step2.expressionUnit, 'inch');

      // 验证第2步徽标：英制显示下，与原始英制同制式，原值徽标自动隐藏
      const badges2 = getItemBadges(step2, mmToIn);
      assert.equal(badges2.find((b) => b.type === 'expression')?.label, '12+6');
      assert.equal(badges2.find((b) => b.type === 'raw'), undefined, '同制式下无需原值徽标');

      // 第3次切换：转回纯英制 (in_to_in)
      const step3 = recalculateTableItem(step2, mmToIn, inToIn, 'convert_display');
      assert.equal(step3.value, '18', '转回纯英制仍为 18 英寸');
      assert.equal(step3.expression, '12+6');
      assert.equal(step3.expressionUnit, 'inch');
    });

    it('公制表达式切换为英制再切回 (mm_to_mm -> in_to_in -> mm_to_mm)：无损换算', () => {
      const item: TableItem = {
        id: 'expr-metric',
        label: '2',
        value: '70',
        source: 'expression',
        expression: '50+20',
        expressionUnit: 'mm',
        rawInput: '70',
        rawUnit: 'mm',
      };

      // 切到英制
      const step1 = recalculateTableItem(item, mmToMm, inToIn, 'convert_display');
      assert.equal(step1.value, '2.7559', '70mm / 25.4 应约为 2.7559 英寸');
      assert.equal(step1.rawInput, '70');
      assert.equal(step1.rawUnit, 'mm');

      const badges1 = getItemBadges(step1, inToIn);
      assert.equal(badges1.find((b) => b.type === 'raw')?.label, '原: 70mm');

      // 切回公制
      const step2 = recalculateTableItem(step1, inToIn, mmToMm, 'convert_display');
      assert.equal(step2.value, '70', '切回公制恢复 70 毫米');
      assert.equal(step2.expression, '50+20');
      assert.equal(step2.expressionUnit, 'mm');
    });

    it('keep_raw 策略：字面值保持，原记录完全不受单位切换影响', () => {
      const item: TableItem = {
        id: 'expr-keep-raw',
        label: '3',
        value: '18',
        source: 'expression',
        expression: '12+6',
        expressionUnit: 'inch',
        rawInput: '18',
        rawUnit: 'inch',
      };

      const result = recalculateTableItem(item, inToIn, mmToMm, 'keep_raw');
      assert.equal(result.value, '18', 'keep_raw 下数值保持不变');
      assert.equal(result.expressionUnit, 'inch', 'keep_raw 下量纲锚点保持原样');
    });
  });
});
