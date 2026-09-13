import { PositionType } from './position';
import { LengthUnit } from './unit';

export type { PositionType };
export type { PositionOption } from './position';

export type InputMode = 'normal' | 'tolerance' | 'expression';

export type ToleranceSelection = 'upper' | 'middle' | 'lower';

export interface ToleranceInputState {
  nominal: string;
  upper: string;
  lower: string;
  selected: ToleranceSelection;
  freeGrade?: 'f' | 'm' | 'c' | 'v' | '';
  fitCode?: string;
}

export interface TableItem {
  id: string;
  label: string;
  value: string;
  position?: PositionType;
  groupId?: string;
  source?: 'tolerance' | 'expression';
  expression?: string;
  /** 算式创建时的物理量纲锚点，防止跨单位切换时发生量纲漂移 */
  expressionUnit?: LengthUnit;
  toleranceInput?: ToleranceInputState;
  starred?: boolean;
  rawInput?: string;
  rawUnit?: LengthUnit | string;
}

export interface TableGroup {
  id: string;
  name: string;
}

export interface TableData {
  id: string;
  name: string;
  groups?: TableGroup[];
  collapsedGroups?: string[];
  items: TableItem[];
}
