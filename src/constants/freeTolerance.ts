import { FreeToleranceGrade, FreeToleranceGradeInfo, FreeToleranceInterval } from '../types/freeTolerance';

export const FREE_TOLERANCE_GRADES: FreeToleranceGradeInfo[] = [
  {
    grade: 'f',
    name: 'f (精密级)',
    nameZh: '精密级',
    description: '适用于精密机械加工、高精度配合及仪表零件',
    tag: 'GB/T 1804-f',
  },
  {
    grade: 'm',
    name: 'm (中等级)',
    nameZh: '中等级',
    description: '最常用机械加工标准，大部分零件图纸默认执行',
    tag: 'GB/T 1804-m',
  },
  {
    grade: 'c',
    name: 'c (粗糙级)',
    nameZh: '粗糙级',
    description: '适用于粗加工、普通板金冲压或焊接构件',
    tag: 'GB/T 1804-c',
  },
  {
    grade: 'v',
    name: 'v (最粗级)',
    nameZh: '最粗级',
    description: '适用于铸件毛坯、粗割件或无配合要求的非加工表面',
    tag: 'GB/T 1804-v',
  },
];

/**
 * GB/T 1804-2000 / ISO 2768-1
 * 线性尺寸的极限偏差数值 (单位: mm)
 */
export const LINEAR_TOLERANCE_TABLE: FreeToleranceInterval[] = [
  {
    min: 0.5,
    max: 3,
    rangeLabel: '0.5 ~ 3',
    deviations: { f: 0.05, m: 0.1, c: 0.2, v: 0.5 },
  },
  {
    min: 3,
    max: 6,
    rangeLabel: '>3 ~ 6',
    deviations: { f: 0.05, m: 0.1, c: 0.3, v: 0.5 },
  },
  {
    min: 6,
    max: 30,
    rangeLabel: '>6 ~ 30',
    deviations: { f: 0.1, m: 0.2, c: 0.5, v: 1.0 },
  },
  {
    min: 30,
    max: 120,
    rangeLabel: '>30 ~ 120',
    deviations: { f: 0.15, m: 0.3, c: 0.8, v: 1.5 },
  },
  {
    min: 120,
    max: 400,
    rangeLabel: '>120 ~ 400',
    deviations: { f: 0.2, m: 0.5, c: 1.2, v: 2.5 },
  },
  {
    min: 400,
    max: 1000,
    rangeLabel: '>400 ~ 1000',
    deviations: { f: 0.3, m: 0.8, c: 2.0, v: 4.0 },
  },
  {
    min: 1000,
    max: 2000,
    rangeLabel: '>1000 ~ 2000',
    deviations: { f: 0.5, m: 1.2, c: 3.0, v: 6.0 },
  },
  {
    min: 2000,
    max: 4000,
    rangeLabel: '>2000 ~ 4000',
    deviations: { f: 2.0, m: 2.0, c: 4.0, v: 8.0 },
  },
];

export interface FreeToleranceResult {
  grade: FreeToleranceGrade;
  deviation: number;
  rangeLabel: string;
  upper: number;
  lower: number;
}

/**
 * 根据名义尺寸与自由公差等级查找对应的公差偏差
 */
export function lookupFreeTolerance(
  nominalValue: number,
  grade: FreeToleranceGrade
): FreeToleranceResult | null {
  const absVal = Math.abs(nominalValue);
  if (isNaN(absVal) || absVal < 0.5 || absVal > 4000) {
    return null;
  }

  for (const interval of LINEAR_TOLERANCE_TABLE) {
    const inRange =
      interval.min === 0.5
        ? absVal >= interval.min && absVal <= interval.max
        : absVal > interval.min && absVal <= interval.max;

    if (inRange) {
      const dev = interval.deviations[grade];
      if (dev !== null && dev !== undefined) {
        return {
          grade,
          deviation: dev,
          rangeLabel: interval.rangeLabel,
          upper: dev,
          lower: -dev,
        };
      }
    }
  }

  return null;
}
