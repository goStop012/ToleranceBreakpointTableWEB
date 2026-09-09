import { StandardFitPreset } from '../types/fitTolerance';

// ISO 286 / GB/T 1800 尺寸分段 (mm)
export interface SizeStep {
  min: number; // 开区间 (除第一段外)
  max: number; // 闭区间
  label: string;
}

export const SIZE_STEPS: SizeStep[] = [
  { min: 0, max: 3, label: '≤ 3' },
  { min: 3, max: 6, label: '> 3 ~ 6' },
  { min: 6, max: 10, label: '> 6 ~ 10' },
  { min: 10, max: 18, label: '> 10 ~ 18' },
  { min: 18, max: 30, label: '> 18 ~ 30' },
  { min: 30, max: 50, label: '> 30 ~ 50' },
  { min: 50, max: 80, label: '> 50 ~ 80' },
  { min: 80, max: 120, label: '> 80 ~ 120' },
  { min: 120, max: 180, label: '> 120 ~ 180' },
  { min: 180, max: 250, label: '> 180 ~ 250' },
  { min: 250, max: 315, label: '> 250 ~ 315' },
  { min: 315, max: 400, label: '> 315 ~ 400' },
  { min: 400, max: 500, label: '> 400 ~ 500' },
];

// 标准公差值 IT (微米 μm)
export const IT_TABLE: Record<number, number[]> = {
  5: [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
  6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
  7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
  8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
  9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
  10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
  11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
  12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
};

// 轴基础偏差 (es 或 ei，单位: μm)
// 负数代表上偏差 es，正数代表下偏差 ei
export const SHAFT_DEVIATION_TABLE: Record<string, { type: 'es' | 'ei'; values: number[] }> = {
  h: { type: 'es', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  g: { type: 'es', values: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20] },
  f: { type: 'es', values: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68] },
  e: { type: 'es', values: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135] },
  d: { type: 'es', values: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230] },
  c: { type: 'es', values: [-60, -70, -80, -95, -110, -130, -150, -180, -200, -220, -240, -260, -280] },
  k: { type: 'ei', values: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 4] },
  m: { type: 'ei', values: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23] },
  n: { type: 'ei', values: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40] },
  p: { type: 'ei', values: [6, 12, 15, 18, 22, 26, 32, 37, 43, 51, 56, 62, 67] },
  r: { type: 'ei', values: [10, 15, 19, 23, 28, 34, 41, 48, 56, 66, 73, 80, 87] },
  s: { type: 'ei', values: [14, 19, 23, 28, 35, 43, 53, 64, 77, 93, 105, 117, 129] },
  u: { type: 'ei', values: [18, 23, 28, 33, 42, 53, 68, 87, 111, 140, 164, 188, 212] },
};

// 常见特定孔公差带精确值（ISO 286-2 / GB 1800-2 官方表值，单位: μm）
// 格式: [ES, EI]
export const EXACT_HOLE_TABLE: Record<string, [number, number][]> = {
  H6: [
    [6, 0], [8, 0], [9, 0], [11, 0], [13, 0], [16, 0], [19, 0], [22, 0], [25, 0], [29, 0], [32, 0], [36, 0], [40, 0]
  ],
  H7: [
    [10, 0], [12, 0], [15, 0], [18, 0], [21, 0], [25, 0], [30, 0], [35, 0], [40, 0], [46, 0], [52, 0], [57, 0], [63, 0]
  ],
  H8: [
    [14, 0], [18, 0], [22, 0], [27, 0], [33, 0], [39, 0], [46, 0], [54, 0], [63, 0], [72, 0], [81, 0], [89, 0], [97, 0]
  ],
  H9: [
    [25, 0], [30, 0], [36, 0], [43, 0], [52, 0], [62, 0], [74, 0], [87, 0], [100, 0], [115, 0], [130, 0], [140, 0], [155, 0]
  ],
  H11: [
    [60, 0], [75, 0], [90, 0], [110, 0], [130, 0], [160, 0], [190, 0], [220, 0], [250, 0], [290, 0], [320, 0], [360, 0], [400, 0]
  ],
  F7: [
    [16, 6], [22, 10], [28, 13], [34, 16], [41, 20], [50, 25], [60, 30], [71, 36], [83, 43], [96, 50], [108, 56], [119, 62], [131, 68]
  ],
  F8: [
    [20, 6], [28, 10], [35, 13], [43, 16], [53, 20], [64, 25], [76, 30], [90, 36], [106, 43], [122, 50], [137, 56], [151, 62], [165, 68]
  ],
  G7: [
    [12, 2], [16, 4], [20, 5], [24, 6], [28, 7], [34, 9], [40, 10], [47, 12], [54, 14], [61, 15], [69, 17], [75, 18], [83, 20]
  ],
  JS6: [
    [3, -3], [4, -4], [4.5, -4.5], [5.5, -5.5], [6.5, -6.5], [8, -8], [9.5, -9.5], [11, -11], [12.5, -12.5], [14.5, -14.5], [16, -16], [18, -18], [20, -20]
  ],
  JS7: [
    [5, -5], [6, -6], [7.5, -7.5], [9, -9], [10.5, -10.5], [12.5, -12.5], [15, -15], [17.5, -17.5], [20, -20], [23, -23], [26, -26], [28.5, -28.5], [31.5, -31.5]
  ],
  K7: [
    [0, -10], [3, -9], [5, -10], [6, -12], [6, -15], [7, -18], [9, -21], [10, -25], [12, -28], [13, -33], [16, -36], [17, -40], [18, -45]
  ],
  M7: [
    [-2, -12], [-4, -16], [-6, -21], [-7, -25], [-8, -29], [-9, -34], [-11, -41], [-13, -48], [-15, -55], [-17, -63], [-20, -72], [-21, -78], [-23, -86]
  ],
  N7: [
    [-4, -14], [-8, -20], [-10, -25], [-12, -30], [-15, -36], [-17, -42], [-20, -50], [-23, -58], [-27, -67], [-31, -77], [-34, -86], [-37, -94], [-40, -103]
  ],
  P7: [
    [-6, -16], [-12, -24], [-15, -30], [-18, -36], [-22, -43], [-26, -51], [-32, -62], [-37, -72], [-43, -83], [-51, -97], [-56, -108], [-62, -119], [-67, -130]
  ],
  D9: [
    [45, 20], [60, 30], [76, 40], [93, 50], [117, 65], [142, 80], [174, 100], [207, 120], [245, 145], [285, 170], [320, 190], [350, 210], [385, 230]
  ],
  E8: [
    [28, 14], [38, 20], [47, 25], [59, 32], [73, 40], [89, 50], [106, 60], [126, 72], [148, 85], [172, 100], [191, 110], [214, 125], [232, 135]
  ],
};

// 常用推荐孔公差代号列表
export const COMMON_HOLE_CODES = [
  'H6', 'H7', 'H8', 'H9', 'H11',
  'F7', 'F8', 'G7',
  'JS6', 'JS7',
  'K7', 'M7', 'N7', 'P7',
  'D9', 'E8'
];

// 常用推荐轴公差代号列表
export const COMMON_SHAFT_CODES = [
  'h5', 'h6', 'h7', 'h8', 'h9', 'h11',
  'g5', 'g6',
  'f6', 'f7', 'f8',
  'e7', 'e8', 'e9',
  'd8', 'd9',
  'c11',
  'js5', 'js6', 'js7',
  'k5', 'k6',
  'm5', 'm6',
  'n6',
  'p6', 'r6', 's6', 't6', 'u6'
];

// 经典工业标准配合推荐预设 (GB/T 1801 优先配合及工程典型案例)
export const STANDARD_FIT_PRESETS: StandardFitPreset[] = [
  // 间隙配合 (基孔制)
  {
    id: 'H7_h6',
    name: 'H7/h6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'h6',
    fitType: 'clearance',
    fitTypeNameZh: '间隙配合',
    category: '间隙',
    shortDesc: '定位滑动配合',
    applicationDesc: '零件自由装拆、导向与精确滑动。适用于导向套、离合器轮毂、紧密对中定位销、机床滑座。',
  },
  {
    id: 'H7_g6',
    name: 'H7/g6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'g6',
    fitType: 'clearance',
    fitTypeNameZh: '间隙配合',
    category: '间隙',
    shortDesc: '精密滑动配合',
    applicationDesc: '工作中有连续油膜润滑、极小间隙的自由滑动或转动。适用于精密主轴衬套、柱塞套、连杆销套。',
  },
  {
    id: 'H7_f7',
    name: 'H7/f7',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'f7',
    fitType: 'clearance',
    fitTypeNameZh: '间隙配合',
    category: '间隙',
    shortDesc: '中速旋转配合',
    applicationDesc: '中速中载的转动配合，有一定温升补偿能力。适用于齿轮箱轴颈、水泵轴承衬套、滑动轴承。',
  },
  {
    id: 'H8_f7',
    name: 'H8/f7',
    system: 'hole',
    holeCode: 'H8',
    shaftCode: 'f7',
    fitType: 'clearance',
    fitTypeNameZh: '间隙配合',
    category: '间隙',
    shortDesc: '一般转动配合',
    applicationDesc: '多支承长轴、中载转动。适用于一般减速器轴颈、农机回转套。',
  },
  {
    id: 'H8_h7',
    name: 'H8/h7',
    system: 'hole',
    holeCode: 'H8',
    shaftCode: 'h7',
    fitType: 'clearance',
    fitTypeNameZh: '间隙配合',
    category: '间隙',
    shortDesc: '普通定位配合',
    applicationDesc: '装配后无相对运动，仅供精确定位，易于用手推入装拆。适用于端盖止口、定位套、紧固法兰。',
  },
  {
    id: 'H9_d9',
    name: 'H9/d9',
    system: 'hole',
    holeCode: 'H9',
    shaftCode: 'd9',
    fitType: 'clearance',
    fitTypeNameZh: '间隙配合',
    category: '间隙',
    shortDesc: '大间隙松动配合',
    applicationDesc: '粗糙配合或多轴同轴度偏差较大、温差显著环境。适用于链轮衬套、粗加工杠杆铰链、皮带轮滑套。',
  },

  // 过渡配合 (基孔制)
  {
    id: 'H7_js6',
    name: 'H7/js6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'js6',
    fitType: 'transition',
    fitTypeNameZh: '过渡配合',
    category: '过渡',
    shortDesc: '对称轻敲定位配合',
    applicationDesc: '公差带完全对称，装拆极其方便且能保持较好同轴度。用木槌即可装入，适用于带平键齿轮、皮带轮、连轴器。',
  },
  {
    id: 'H7_k6',
    name: 'H7/k6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'k6',
    fitType: 'transition',
    fitTypeNameZh: '过渡配合',
    category: '过渡',
    shortDesc: '轻度敲入定位配合',
    applicationDesc: '定位精确，承受振动不易松脱，用铜棒或木槌敲击装配。适用于精密减速机齿轮轴承定位、联轴节、刚性套管。',
  },
  {
    id: 'H7_m6',
    name: 'H7/m6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'm6',
    fitType: 'transition',
    fitTypeNameZh: '过渡配合',
    category: '过渡',
    shortDesc: '中度敲入紧凑配合',
    applicationDesc: '平均有微小过盈，定位牢固，需用手锤或小型冲床压入装拆。适用于固定销轴、轴承内圈中载定位。',
  },
  {
    id: 'H7_n6',
    name: 'H7/n6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'n6',
    fitType: 'transition',
    fitTypeNameZh: '过渡配合',
    category: '过渡',
    shortDesc: '紧固过渡配合',
    applicationDesc: '过盈概率较大，能承受中等冲击与交变载荷。装拆需专用拉马工具。适用于重载轮毂定位、重载衬套。',
  },

  // 过盈配合 (基孔制)
  {
    id: 'H7_p6',
    name: 'H7/p6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'p6',
    fitType: 'interference',
    fitTypeNameZh: '过盈配合',
    category: '过盈',
    shortDesc: '压入轻过盈配合',
    applicationDesc: '需用压力机压入或冷缩温差法装配，可承受小扭矩且无需键连接。适用于青铜轴承衬套、阀座套圈。',
  },
  {
    id: 'H7_r6',
    name: 'H7/r6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 'r6',
    fitType: 'interference',
    fitTypeNameZh: '过盈配合',
    category: '过盈',
    shortDesc: '中等过盈配合',
    applicationDesc: '不可拆卸或极少拆卸，靠过盈结合面摩擦力传递较大扭矩。适用于齿轮镶圈、铸铁轮箍。',
  },
  {
    id: 'H7_s6',
    name: 'H7/s6',
    system: 'hole',
    holeCode: 'H7',
    shaftCode: 's6',
    fitType: 'interference',
    fitTypeNameZh: '过盈配合',
    category: '过盈',
    shortDesc: '重载永久过盈配合',
    applicationDesc: '永久性紧固连接，需感应加热或液氮冷装，承受极大转矩与重负荷。适用于钢制法兰轮圈、高压轴套。',
  },

  // 基轴制常用配合 (Shaft Basis)
  {
    id: 'F8_h6',
    name: 'F8/h6',
    system: 'shaft',
    holeCode: 'F8',
    shaftCode: 'h6',
    fitType: 'clearance',
    fitTypeNameZh: '间隙配合',
    category: '间隙',
    shortDesc: '基轴制转动配合',
    applicationDesc: '利用标准冷拉圆钢做通轴时，在其上装配旋转衬套。适用于长轴多支承结构。',
  },
  {
    id: 'K7_h6',
    name: 'K7/h6',
    system: 'shaft',
    holeCode: 'K7',
    shaftCode: 'h6',
    fitType: 'transition',
    fitTypeNameZh: '过渡配合',
    category: '过渡',
    shortDesc: '基轴制定位配合',
    applicationDesc: '在标准冷拉光轴或外圆磨削光轴上精确定位安装齿轮或链轮。',
  },
  {
    id: 'P7_h6',
    name: 'P7/h6',
    system: 'shaft',
    holeCode: 'P7',
    shaftCode: 'h6',
    fitType: 'interference',
    fitTypeNameZh: '过盈配合',
    category: '过盈',
    shortDesc: '基轴制过盈装配',
    applicationDesc: '在同一光轴上压装无需键连接的轮毂或套圈。',
  },
];
