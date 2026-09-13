import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getItemBadges } from './badge';
import { TableItem } from '../types/table';
import { UnitConfig } from '../types/unit';

const defaultMmConfig: UnitConfig = {
  mode: 'mm_to_mm',
  inputUnit: 'mm',
  displayUnit: 'mm',
  mmDecimals: 3,
  inchDecimals: 4,
};

const crossUnitConfigInchToMm: UnitConfig = {
  mode: 'in_to_mm',
  inputUnit: 'inch',
  displayUnit: 'mm',
  mmDecimals: 3,
  inchDecimals: 4,
};

describe('getItemBadges - 徽标逻辑测试规范', () => {
  it('1. 常规对称公差 (毫米->毫米)：显示基准与偏差，且绝对不显示 "原:" 徽标', () => {
    const item: TableItem = {
      id: 'item-1',
      label: '1',
      value: '20.000',
      source: 'tolerance',
      rawInput: '20',
      rawUnit: 'mm',
      toleranceInput: {
        nominal: '20',
        upper: '0.1',
        lower: '0.1',
        selected: 'middle',
      },
    };

    const badges = getItemBadges(item, defaultMmConfig);
    assert.equal(badges.length, 1, '同单位公差计算应仅输出1个公差徽标');
    assert.equal(badges[0].type, 'tolerance');
    assert.equal(badges[0].label, '20 +0.1/-0.1');
    assert.equal(badges[0].theme, 'cyan');

    // 严禁存在 'raw' (原:) 徽标
    const rawBadge = badges.find((b) => b.type === 'raw');
    assert.equal(rawBadge, undefined, '毫米到毫米同单位公差绝不应显示 "原:"');
  });

  it('2. 非对称公差：正确格式化正负号及零偏差', () => {
    const item: TableItem = {
      id: 'item-2',
      label: '2',
      value: '20.025',
      source: 'tolerance',
      rawInput: '20',
      rawUnit: 'mm',
      toleranceInput: {
        nominal: '20',
        upper: '0.05',
        lower: '0',
        selected: 'middle',
      },
    };

    const badges = getItemBadges(item, defaultMmConfig);
    assert.equal(badges.length, 1);
    assert.equal(badges[0].type, 'tolerance');
    assert.equal(badges[0].label, '20 +0.05/0');
    assert.equal(badges[0].theme, 'cyan');
  });

  it('3. 配合公差 (ISO 286 / GB 1800)：显示基准尺寸与配合代号', () => {
    const item: TableItem = {
      id: 'item-3',
      label: '3',
      value: '20.010',
      source: 'tolerance',
      rawInput: '20',
      rawUnit: 'mm',
      toleranceInput: {
        nominal: '20',
        fitCode: 'H7',
        upper: '0.021',
        lower: '0',
        selected: 'middle',
      },
    };

    const badges = getItemBadges(item, defaultMmConfig);
    assert.equal(badges.length, 1);
    assert.equal(badges[0].type, 'fit');
    assert.equal(badges[0].label, '20 H7');
    assert.equal(badges[0].theme, 'blue');
    assert.equal(badges.find((b) => b.type === 'raw'), undefined);
  });

  it('4. 自由公差 (GB/T 1804)：显示基准尺寸、公差值与等级', () => {
    const item: TableItem = {
      id: 'item-4',
      label: '4',
      value: '20.000',
      source: 'tolerance',
      rawInput: '20',
      rawUnit: 'mm',
      toleranceInput: {
        nominal: '20',
        freeGrade: 'm',
        upper: '0.2',
        lower: '0.2',
        selected: 'middle',
      },
    };

    const badges = getItemBadges(item, defaultMmConfig);
    assert.equal(badges.length, 1);
    assert.equal(badges[0].type, 'free');
    assert.equal(badges[0].label, '20 ±0.2 (m级)');
    assert.equal(badges[0].theme, 'green');
    assert.equal(badges.find((b) => b.type === 'raw'), undefined);
  });

  it('5. 表达式算式：直接展示公式本身（无 fx 前缀），且与公差徽标互斥', () => {
    const item: TableItem = {
      id: 'item-5',
      label: '5',
      value: '20.000',
      source: 'expression',
      expression: '=10+5*2',
      rawInput: '=10+5*2',
      rawUnit: 'mm',
    };

    const badges = getItemBadges(item, defaultMmConfig);
    assert.equal(badges.length, 1);
    assert.equal(badges[0].type, 'expression');
    assert.equal(badges[0].label, '10+5*2', '应直接显示算式，不带 fx 前缀');
    assert.equal(badges[0].theme, 'purple');

    // 严禁存在公差徽标
    assert.equal(badges.find((b) => b.type === 'tolerance'), undefined);
    assert.equal(badges.find((b) => b.type === 'raw'), undefined);
  });

  it('6. 跨单位换算 (英制录入 -> 公制显示)：正确显示 "原:" 徽标', () => {
    const item: TableItem = {
      id: 'item-6',
      label: '6',
      value: '25.400',
      rawInput: '1',
      rawUnit: 'inch',
    };

    const badges = getItemBadges(item, crossUnitConfigInchToMm);
    assert.equal(badges.length, 1);
    assert.equal(badges[0].type, 'raw');
    assert.equal(badges[0].label, '原: 1″');
    assert.equal(badges[0].theme, 'gray');
  });

  it('7. 同单位分数输入 (1/2 -> 0.5)：正确显示 "原:" 徽标', () => {
    const inchConfig: UnitConfig = {
      mode: 'in_to_in',
      inputUnit: 'inch',
      displayUnit: 'inch',
      mmDecimals: 3,
      inchDecimals: 4,
    };

    const item: TableItem = {
      id: 'item-7',
      label: '7',
      value: '0.5000',
      rawInput: '1/2',
      rawUnit: 'inch',
    };

    const badges = getItemBadges(item, inchConfig);
    assert.equal(badges.length, 1);
    assert.equal(badges[0].type, 'raw');
    assert.equal(badges[0].label, '原: 1/2″');
  });

  it('8. 普通输入 (无公差、无换算、无算式)：不显示任何徽标', () => {
    const item: TableItem = {
      id: 'item-8',
      label: '8',
      value: '20.000',
      rawInput: '20.000',
      rawUnit: 'mm',
    };

    const badges = getItemBadges(item, defaultMmConfig);
    assert.equal(badges.length, 0, '常规普通录入不应存在冗余徽标');
  });

  it('9. 表达式跨单位换算 (英寸输入 12+6 -> 毫米显示 457.2)：显示公式 12+6，且原值徽标显示计算最终数值 18″，绝不显示 12+6″', () => {
    const item: TableItem = {
      id: 'item-9',
      label: '9',
      value: '457.200',
      source: 'expression',
      expression: '12+6',
      rawInput: '18',
      rawUnit: 'inch',
    };

    const badges = getItemBadges(item, crossUnitConfigInchToMm);
    assert.equal(badges.length, 2, '跨单位算式应有公式徽标与原值换算徽标');

    const exprBadge = badges.find((b) => b.type === 'expression');
    assert.ok(exprBadge, '必须存在表达式徽标');
    assert.equal(exprBadge.label, '12+6');

    const rawBadge = badges.find((b) => b.type === 'raw');
    assert.ok(rawBadge, '必须存在跨单位原值徽标');
    assert.equal(rawBadge.label, '原: 18″', '原值必须为计算后的尺寸数值 18″，而非 12+6″');
  });

  it('10. 容错测试：若历史数据 rawInput 仍为未求值的算式字符串，徽标层应动态求值显示 18″', () => {
    const item: TableItem = {
      id: 'item-10',
      label: '10',
      value: '457.200',
      source: 'expression',
      expression: '12+6',
      rawInput: '12+6',
      rawUnit: 'inch',
    };

    const badges = getItemBadges(item, crossUnitConfigInchToMm);
    const rawBadge = badges.find((b) => b.type === 'raw');
    assert.ok(rawBadge);
    assert.equal(rawBadge.label, '原: 18″', '容错兜底：即使 rawInput 存的是 12+6，徽标也应求值显示 18″');
  });
});
