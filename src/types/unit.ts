export type LengthUnit = 'mm' | 'inch';

export type UnitMode =
  | 'in_to_mm' // 1. 输入为英寸显示为毫米
  | 'mm_to_mm' // 2. 输入为毫米显示为毫米
  | 'in_to_in' // 3. 输入为英寸显示为英寸
  | 'mm_to_in'; // 4. 输入为毫米显示为英寸 (完备扩展)

export type ExistingValueConversionStrategy =
  | 'convert_display' // 按显示单位物理等值换算 (例如 mm ➔ inch 或 inch ➔ mm，保持实际尺寸一致)
  | 'recalc_from_input' // 视作新输入单位并重新计算为显示单位 (例如已有数值按新输入单位折算)
  | 'keep_raw'; // 保持当前数值字面量不变

export interface UnitConfig {
  mode: UnitMode;
  inputUnit: LengthUnit;
  displayUnit: LengthUnit;
  mmDecimals: number;
  inchDecimals: number;
}

