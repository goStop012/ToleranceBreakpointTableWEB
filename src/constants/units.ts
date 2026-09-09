import { UnitConfig, UnitMode } from '../types/unit';

export interface UnitModeOption {
  mode: UnitMode;
  title: string;
  label: string;
  dropdownLabel: string;
  shortLabel: string;
  inputUnit: 'mm' | 'inch';
  displayUnit: 'mm' | 'inch';
  inputUnitName: string;
  displayUnitName: string;
  description: string;
  example: string;
}

export const UNIT_MODE_OPTIONS: UnitModeOption[] = [
  {
    mode: 'mm_to_mm',
    title: '输入为毫米，显示为毫米',
    label: '输入毫米 ➔ 显示毫米',
    dropdownLabel: '毫米 -> 毫米',
    shortLabel: 'mm ➔ mm',
    inputUnit: 'mm',
    displayUnit: 'mm',
    inputUnitName: '毫米 (mm)',
    displayUnitName: '毫米 (mm)',
    description: '标准公制加工，输入与表格显示单位保持一致，无需换算。',
    example: '如输入 25.4 保持显示为 25.4 mm',
  },
  {
    mode: 'in_to_mm',
    title: '输入为英寸，显示为毫米',
    label: '输入英寸 ➔ 显示毫米',
    dropdownLabel: '英寸 -> 毫米',
    shortLabel: 'in ➔ mm',
    inputUnit: 'inch',
    displayUnit: 'mm',
    inputUnitName: '英寸 (inch)',
    displayUnitName: '毫米 (mm)',
    description: '图纸使用英制尺寸，机床或切点表按公制记录，系统自动按 1 inch = 25.4 mm 进行实时换算。',
    example: '如输入 1″ 自动换算并显示为 25.4 mm',
  },
  {
    mode: 'in_to_in',
    title: '输入为英寸，显示为英寸',
    label: '输入英寸 ➔ 显示英寸',
    dropdownLabel: '英寸 -> 英寸',
    shortLabel: 'in ➔ in',
    inputUnit: 'inch',
    displayUnit: 'inch',
    inputUnitName: '英寸 (inch)',
    displayUnitName: '英寸 (inch)',
    description: '标准英制加工，输入与表格显示均为英寸单位，支持小数与英制分数输入。',
    example: '如输入 0.5″ 保持显示为 0.5000″',
  },
  {
    mode: 'mm_to_in',
    title: '输入为毫米，显示为英寸',
    label: '输入毫米 ➔ 显示英寸',
    dropdownLabel: '毫米 -> 英寸',
    shortLabel: 'mm ➔ in',
    inputUnit: 'mm',
    displayUnit: 'inch',
    inputUnitName: '毫米 (mm)',
    displayUnitName: '英寸 (inch)',
    description: '图纸为公制毫米，输出英制英寸，系统自动按 1 mm ≈ 0.03937 inch 进行换算。',
    example: '如输入 25.4 mm 自动换算并显示为 1.0000″',
  },
];

export const DEFAULT_UNIT_CONFIG: UnitConfig = {
  mode: 'mm_to_mm',
  inputUnit: 'mm',
  displayUnit: 'mm',
  mmDecimals: 4,
  inchDecimals: 4,
};
