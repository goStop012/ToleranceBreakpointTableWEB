export type FreeToleranceGrade = 'f' | 'm' | 'c' | 'v';

export interface FreeToleranceGradeInfo {
  grade: FreeToleranceGrade;
  name: string;
  nameZh: string;
  description: string;
  tag: string;
}

export interface FreeToleranceInterval {
  min: number; // > min (or >= for base)
  max: number; // <= max
  rangeLabel: string;
  deviations: Record<FreeToleranceGrade, number | null>;
}
