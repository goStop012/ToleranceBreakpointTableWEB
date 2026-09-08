import React from 'react';

interface GdtIconProps {
  id: string;
  className?: string;
  size?: number;
}

export const GdtIcon: React.FC<GdtIconProps> = ({ id, className = '', size = 24 }) => {
  const strokeWidth = 2.2;

  switch (id) {
    case 'straightness': // 直线度 ━
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'flatness': // 平面度 ⏢
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon
            points="10,8 28,8 22,24 4,24"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'circularity': // 圆度 ○
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
        </svg>
      );

    case 'cylindricity': // 圆柱度 ⌭
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth={strokeWidth} />
          <line x1="5" y1="27" x2="19" y2="5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="13" y1="27" x2="27" y2="5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'profile_line': // 线轮廓度 ⌒
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <path
            d="M 5,22 A 11,11 0 0,1 27,22"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case 'profile_surface': // 面轮廓度 ⌓
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <path
            d="M 5,22 A 11,11 0 0,1 27,22 Z"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.25"
          />
        </svg>
      );

    case 'parallelism': // 平行度 ∥
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <line x1="9" y1="26" x2="19" y2="6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="15" y1="26" x2="25" y2="6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'perpendicularity': // 垂直度 ⊥
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <line x1="5" y1="24" x2="27" y2="24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="16" y1="6" x2="16" y2="24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'angularity': // 倾斜度 ∠
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <line x1="6" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="6" y1="24" x2="23" y2="8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'position': // 位置度 ⌖
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth={strokeWidth} />
          <line x1="3" y1="16" x2="29" y2="16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="16" y1="3" x2="16" y2="29" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'coaxiality': // 同轴度 ◎
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth={strokeWidth} />
          <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth={strokeWidth} />
        </svg>
      );

    case 'symmetry': // 对称度 ⌯
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="5" y1="16" x2="27" y2="16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="10" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'circular_runout': // 圆跳动 ↗
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <line x1="8" y1="25" x2="23" y2="8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <polyline points="14,8 24,8 24,18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'total_runout': // 全跳动 ⇗
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <line x1="7" y1="25" x2="18" y2="9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <polyline points="12,9 19,9 19,16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="14" y1="25" x2="25" y2="9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <polyline points="19,9 26,9 26,16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" y1="25" x2="26" y2="25" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
};
