export type BadgeType = 'fit' | 'free' | 'tolerance' | 'expression' | 'raw';

export type BadgeTheme = 'blue' | 'green' | 'cyan' | 'purple' | 'gray';

export interface ItemBadgeInfo {
  id: string;
  type: BadgeType;
  label: string;
  shortLabel?: string;
  tooltip: string;
  theme: BadgeTheme;
}
