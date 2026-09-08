export type GDTCategory = 'form' | 'profile' | 'orientation' | 'location' | 'runout';

export interface GDTSymbolItem {
  id: string;
  nameZh: string;
  nameEn: string;
  category: GDTCategory;
  categoryZh: string;
  symbol: string;
  datumRequirement: '无需基准' | '必须有基准' | '有或无基准(可选)';
  toleranceZone: string;
  definition: string;
  application: string;
  iconPath: string; // SVG path or rendering info
}
