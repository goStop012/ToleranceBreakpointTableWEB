import { PositionType } from '../types/table';

export interface PositionOption {
  value: PositionType;
  label: string;
}

export const POSITIONS: PositionOption[] = [
  { value: '', label: '未设置' },
  { value: 'outer', label: '外径' },
  { value: 'inner', label: '内径' },
  { value: 'face', label: '端面' },
  { value: 'side', label: '侧面' },
  { value: 'verify', label: '验证' },
  { value: 'length', label: '长度' },
];
