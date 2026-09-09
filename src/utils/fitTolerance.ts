import { ToleranceZoneResult, FitCalculationResult, FitType } from '../types/fitTolerance';
import {
  SIZE_STEPS,
  IT_TABLE,
  SHAFT_DEVIATION_TABLE,
  EXACT_HOLE_TABLE,
} from '../constants/fitTolerance';
import { trimN } from './math';

/**
 * 查找基本尺寸所对应的 ISO 286 / GB 1800 尺寸段索引
 * @param sizeMm 基本尺寸 (mm)
 */
export function findSizeStepIndex(sizeMm: number): number {
  if (sizeMm <= 0 || sizeMm > 500) {
    return -1;
  }
  for (let i = 0; i < SIZE_STEPS.length; i++) {
    const step = SIZE_STEPS[i];
    if (i === 0) {
      if (sizeMm > 0 && sizeMm <= step.max) return i;
    } else {
      if (sizeMm > step.min && sizeMm <= step.max) return i;
    }
  }
  return -1;
}

/**
 * 解析并查询单个孔或轴的公差带极限偏差 (ISO 286 / GB/T 1800)
 * @param basicSizeMm 基本尺寸 (mm)
 * @param code 公差代号，如 "H7", "g6", "js6", "P7"
 */
export function lookupToleranceZone(basicSizeMm: number, code: string): ToleranceZoneResult | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const stepIdx = findSizeStepIndex(basicSizeMm);
  if (stepIdx === -1) return null;

  // 正则匹配: 字母部分 + 数字等级部分
  const match = trimmed.match(/^([a-zA-Z]+)(\d+)$/);
  if (!match) return null;

  const letterPart = match[1];
  const gradeNum = parseInt(match[2], 10);

  // 区分孔与轴:
  // 首字母大写为孔 (Hole)，小写为轴 (Shaft)
  const isHole = letterPart[0] === letterPart[0].toUpperCase();
  const normalizedLetter = letterPart;

  // 查询标准公差值 IT (μm)
  const itRow = IT_TABLE[gradeNum];
  const itValueUm = itRow ? itRow[stepIdx] : 10; // 缺省或超出暂退回基准值

  let upperDevUm = 0;
  let lowerDevUm = 0;

  if (isHole) {
    const holeKey = `${normalizedLetter.toUpperCase()}${gradeNum}`;
    // 优先检查官方标准表中精确收录的常用孔公差带
    if (EXACT_HOLE_TABLE[holeKey]) {
      const [es, ei] = EXACT_HOLE_TABLE[holeKey][stepIdx];
      upperDevUm = es;
      lowerDevUm = ei;
    } else if (normalizedLetter.toUpperCase() === 'H') {
      // 基准孔 H: EI = 0, ES = +IT
      lowerDevUm = 0;
      upperDevUm = itValueUm;
    } else if (normalizedLetter.toUpperCase() === 'JS') {
      // 对称孔 JS: ES = +IT/2, EI = -IT/2
      upperDevUm = Math.round((itValueUm / 2) * 10) / 10;
      lowerDevUm = -upperDevUm;
    } else {
      // 算法推导通用孔公差:
      const lowerLetter = normalizedLetter.toLowerCase();
      const shaftDev = SHAFT_DEVIATION_TABLE[lowerLetter];
      if (shaftDev) {
        if (shaftDev.type === 'es') {
          // 孔 EI = -轴 es
          lowerDevUm = -shaftDev.values[stepIdx];
          upperDevUm = lowerDevUm + itValueUm;
        } else {
          // 孔 ES = -轴 ei
          upperDevUm = -shaftDev.values[stepIdx];
          lowerDevUm = upperDevUm - itValueUm;
        }
      } else {
        // 默认基准孔
        lowerDevUm = 0;
        upperDevUm = itValueUm;
      }
    }
  } else {
    // 轴 (Shaft) 计算
    const lowerLetter = normalizedLetter.toLowerCase();
    if (lowerLetter === 'h') {
      // 基准轴 h: es = 0, ei = -IT
      upperDevUm = 0;
      lowerDevUm = -itValueUm;
    } else if (lowerLetter === 'js') {
      // 对称轴 js: es = +IT/2, ei = -IT/2
      upperDevUm = Math.round((itValueUm / 2) * 10) / 10;
      lowerDevUm = -upperDevUm;
    } else {
      const shaftDev = SHAFT_DEVIATION_TABLE[lowerLetter];
      if (shaftDev) {
        if (shaftDev.type === 'es') {
          upperDevUm = shaftDev.values[stepIdx];
          lowerDevUm = upperDevUm - itValueUm;
        } else {
          lowerDevUm = shaftDev.values[stepIdx];
          upperDevUm = lowerDevUm + itValueUm;
        }
      } else {
        // 默认基准轴
        upperDevUm = 0;
        lowerDevUm = -itValueUm;
      }
    }
  }

  const upperDevMm = upperDevUm / 1000;
  const lowerDevMm = lowerDevUm / 1000;
  const upperLimitMm = basicSizeMm + upperDevMm;
  const lowerLimitMm = basicSizeMm + lowerDevMm;
  const middleMm = (upperLimitMm + lowerLimitMm) / 2;
  const toleranceMm = upperLimitMm - lowerLimitMm;

  return {
    code: isHole ? `${letterPart.toUpperCase()}${gradeNum}` : `${letterPart.toLowerCase()}${gradeNum}`,
    isHole,
    basicSizeMm,
    rangeLabel: SIZE_STEPS[stepIdx].label,
    itGrade: gradeNum,
    itValueUm,
    fundamentalDeviationCode: isHole ? letterPart.toUpperCase() : letterPart.toLowerCase(),
    upperDevUm,
    lowerDevUm,
    upperDevMm,
    lowerDevMm,
    upperLimitMm,
    lowerLimitMm,
    middleMm,
    toleranceMm,
  };
}

/**
 * 完整孔轴配合计算与性质判定 (间隙 / 过渡 / 过盈)
 */
export function calculateFitPair(
  basicSizeMm: number,
  holeCode: string,
  shaftCode: string,
  inputUnit: 'mm' | 'inch' = 'mm'
): FitCalculationResult | null {
  const hole = lookupToleranceZone(basicSizeMm, holeCode);
  const shaft = lookupToleranceZone(basicSizeMm, shaftCode);

  if (!hole || !shaft) return null;

  const ES = hole.upperDevUm;
  const EI = hole.lowerDevUm;
  const es = shaft.upperDevUm;
  const ei = shaft.lowerDevUm;

  let fitType: FitType = 'clearance';
  let fitTypeNameZh = '间隙配合';

  let maxClearanceUm: number | undefined;
  let minClearanceUm: number | undefined;
  let maxInterferenceUm: number | undefined;
  let minInterferenceUm: number | undefined;

  // 配合类型判定:
  // 1. EI >= es -> 始终有间隙 -> 间隙配合 (Clearance)
  if (EI >= es) {
    fitType = 'clearance';
    fitTypeNameZh = '间隙配合';
    maxClearanceUm = ES - ei; // Xmax
    minClearanceUm = EI - es; // Xmin
  }
  // 2. ES <= ei -> 始终有过盈 -> 过盈配合 (Interference)
  else if (ES <= ei) {
    fitType = 'interference';
    fitTypeNameZh = '过盈配合';
    maxInterferenceUm = es - EI; // Ymax
    minInterferenceUm = ei - ES; // Ymin
  }
  // 3. 既可能出现间隙也可能出现过盈 -> 过渡配合 (Transition)
  else {
    fitType = 'transition';
    fitTypeNameZh = '过渡配合';
    maxClearanceUm = ES - ei; // 最大间隙 Xmax
    maxInterferenceUm = es - EI; // 最大过盈 Ymax
  }

  const fitToleranceUm = hole.itValueUm + shaft.itValueUm;

  const basicSizeInput = inputUnit === 'inch' ? basicSizeMm / 25.4 : basicSizeMm;

  return {
    basicSizeMm,
    basicSizeInput,
    inputUnit,
    hole,
    shaft,
    fitType,
    fitTypeNameZh,
    maxClearanceUm,
    minClearanceUm,
    maxInterferenceUm,
    minInterferenceUm,
    maxClearanceMm: maxClearanceUm !== undefined ? maxClearanceUm / 1000 : undefined,
    minClearanceMm: minClearanceUm !== undefined ? minClearanceUm / 1000 : undefined,
    maxInterferenceMm: maxInterferenceUm !== undefined ? maxInterferenceUm / 1000 : undefined,
    minInterferenceMm: minInterferenceUm !== undefined ? minInterferenceUm / 1000 : undefined,
    fitToleranceUm,
    fitToleranceMm: fitToleranceUm / 1000,
  };
}

/**
 * 格式化带符号的偏差值 (如 +0.021, -0.009, 0)
 */
export function formatSignedDeviation(valMm: number, decimals: number = 3): string {
  const rounded = Number(valMm.toFixed(decimals));
  if (rounded === 0) return '0';
  if (rounded > 0) return `+${trimN(rounded, decimals)}`;
  return trimN(rounded, decimals);
}
