export interface PositionOption {
  id: string; // 唯一标识符，如 'outer', 'inner', 'chamfer', 'custom_123'
  value: string; // 与 id 相同，便于兼容原生 <select> value
  label: string; // 显示名称，如 '外径', '倒角', '槽宽'
  color?: string; // 颜色标识（十六进制色值，用于行内标签点缀色）
  isPreset?: boolean; // 是否为系统内置预设
  description?: string; // 特征描述或加工提示说明
}

export type PositionType = string;
