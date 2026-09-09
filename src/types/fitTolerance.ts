export type FitType = 'clearance' | 'transition' | 'interference';

export interface ToleranceZoneResult {
  code: string; // e.g. "H7", "g6"
  isHole: boolean; // true = Hole (孔), false = Shaft (轴)
  basicSizeMm: number; // 基本尺寸 (mm)
  rangeLabel: string; // 尺寸段如 "> 18 ~ 30"
  itGrade: number; // IT等级如 7, 6
  itValueUm: number; // 标准公差值 (微米)
  fundamentalDeviationCode: string; // 基础偏差代号如 "H", "g"
  upperDevUm: number; // 上偏差 ES 或 es (微米)
  lowerDevUm: number; // 下偏差 EI 或 ei (微米)
  upperDevMm: number; // 上偏差 (mm)
  lowerDevMm: number; // 下偏差 (mm)
  upperLimitMm: number; // 最大极限尺寸 (mm)
  lowerLimitMm: number; // 最小极限尺寸 (mm)
  middleMm: number; // 中间值 (mm)
  toleranceMm: number; // 公差值 (mm)
}

export interface FitCalculationResult {
  basicSizeMm: number;
  basicSizeInput: number;
  inputUnit: 'mm' | 'inch';
  hole: ToleranceZoneResult;
  shaft: ToleranceZoneResult;
  fitType: FitType; // 配合性质: 间隙 / 过渡 / 过盈
  fitTypeNameZh: string; // "间隙配合" | "过渡配合" | "过盈配合"
  
  // 间隙或过盈特征值 (微米)
  maxClearanceUm?: number; // 最大间隙 Xmax = ES - ei
  minClearanceUm?: number; // 最小间隙 Xmin = EI - es
  maxInterferenceUm?: number; // 最大过盈 Ymax = |EI - es| (当 es > EI)
  minInterferenceUm?: number; // 最小过盈 Ymin = |ES - ei| (当 ei > ES)
  
  // 间隙或过盈特征值 (mm)
  maxClearanceMm?: number;
  minClearanceMm?: number;
  maxInterferenceMm?: number;
  minInterferenceMm?: number;
  
  fitToleranceUm: number; // 配合公差 Tf = Th + Ts (微米)
  fitToleranceMm: number; // 配合公差 Tf (mm)
}

export interface StandardFitPreset {
  id: string;
  name: string; // e.g. "H7/g6"
  system: 'hole' | 'shaft'; // 基孔制 / 基轴制
  holeCode: string; // "H7"
  shaftCode: string; // "g6"
  fitType: FitType;
  fitTypeNameZh: string;
  category: '间隙' | '过渡' | '过盈';
  shortDesc: string; // "精密滑动配合"
  applicationDesc: string; // 适用场景
}
