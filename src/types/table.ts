export type PositionType = '' | 'outer' | 'inner' | 'face' | 'side' | 'verify' | 'length';

export type InputMode = 'normal' | 'tolerance' | 'expression';

export type ToleranceSelection = 'upper' | 'middle' | 'lower';

export interface ToleranceInputState {
  nominal: string;
  upper: string;
  lower: string;
  selected: ToleranceSelection;
  freeGrade?: 'f' | 'm' | 'c' | 'v' | '';
}

export interface TableItem {
  id: string;
  label: string;
  value: string;
  position?: PositionType;
  groupId?: string;
  source?: 'tolerance' | 'expression';
  expression?: string;
  toleranceInput?: ToleranceInputState;
  starred?: boolean;
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
