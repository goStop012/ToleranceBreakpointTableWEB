import type { PositionOption } from '../types/position';
export type { PositionOption };

export const DEFAULT_POSITIONS: PositionOption[] = [
  { id: '', value: '', label: '未设置', color: '#64748b', isPreset: true, description: '不指定位置' },
  { id: 'outer', value: 'outer', label: '外径', color: '#3b82f6', isPreset: true, description: '外圆/外表面切点' },
  { id: 'inner', value: 'inner', label: '内径', color: '#06b6d4', isPreset: true, description: '内孔/内表面切点' },
  { id: 'face', value: 'face', label: '端面', color: '#10b981', isPreset: true, description: '零件轴向端面基准' },
  { id: 'side', value: 'side', label: '侧面', color: '#8b5cf6', isPreset: true, description: '台阶侧壁/侧面' },
  { id: 'chamfer', value: 'chamfer', label: '倒角', color: '#f59e0b', isPreset: true, description: 'C角/倒角交点' },
  { id: 'fillet', value: 'fillet', label: '圆角', color: '#ec4899', isPreset: true, description: 'R角过渡切点' },
  { id: 'groove', value: 'groove', label: '槽宽/槽深', color: '#14b8a6', isPreset: true, description: '退刀槽/密封槽' },
  { id: 'thread', value: 'thread', label: '螺纹', color: '#f97316', isPreset: true, description: '螺纹大径/中径/小径' },
  { id: 'step', value: 'step', label: '台阶', color: '#6366f1', isPreset: true, description: '轴径台阶过渡面' },
  { id: 'depth', value: 'depth', label: '深度', color: '#0ea5e9', isPreset: true, description: '盲孔/沉孔/型腔深度' },
  { id: 'verify', value: 'verify', label: '验证', color: '#eab308', isPreset: true, description: '首件/关键尺寸复核' },
  { id: 'length', value: 'length', label: '长度', color: '#a855f7', isPreset: true, description: '总长/分段轴向长度' },
];

// 兼容别名导出
export const POSITIONS = DEFAULT_POSITIONS;

// 推荐的颜色调色板（机械/工业风格配色）
export const POSITION_COLOR_PRESETS: { color: string; name: string }[] = [
  { color: '#3b82f6', name: '钴蓝' },
  { color: '#06b6d4', name: '青绿' },
  { color: '#10b981', name: '翠绿' },
  { color: '#8b5cf6', name: '紫罗兰' },
  { color: '#f59e0b', name: '琥珀' },
  { color: '#ec4899', name: '粉红' },
  { color: '#14b8a6', name: '松石绿' },
  { color: '#f97316', name: '橙红' },
  { color: '#6366f1', name: '靛蓝' },
  { color: '#0ea5e9', name: '天蓝' },
  { color: '#eab308', name: '金黄' },
  { color: '#ef4444', name: '警示红' },
  { color: '#a855f7', name: '洋紫' },
  { color: '#64748b', name: '铁灰' },
];
