import React from 'react';
import { ItemBadgeInfo, BadgeTheme } from '../types/badge';

interface ItemBadgesProps {
  badges: ItemBadgeInfo[];
  variant: 'inline' | 'subline';
  onBadgeClick?: (badge: ItemBadgeInfo) => void;
}

const THEME_CLASSES: Record<BadgeTheme, string> = {
  blue: 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30 hover:bg-[#3b82f6]/25',
  green: 'bg-[#3aad42]/15 text-[#5ec864] border-[#3aad42]/30 hover:bg-[#3aad42]/25',
  cyan: 'bg-[#06b6d4]/15 text-[#22d3ee] border-[#06b6d4]/30 hover:bg-[#06b6d4]/25',
  purple: 'bg-[#8b5cf6]/15 text-[#c084fc] border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/25',
  gray: 'bg-[#26313c] text-[#cbd2d9] border-[#3e4c59] hover:bg-[#323f4b]',
};

export const ItemBadges: React.FC<ItemBadgesProps> = ({ badges, variant, onBadgeClick }) => {
  if (!badges || badges.length === 0) return null;

  if (variant === 'inline') {
    return (
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {badges.map((b) => (
          <span
            key={b.id}
            onClick={(e) => {
              if (onBadgeClick) {
                e.stopPropagation();
                onBadgeClick(b);
              }
            }}
            className={`text-[10px] px-1.5 py-0.5 rounded border font-mono whitespace-nowrap select-none transition-colors ${
              onBadgeClick ? 'cursor-pointer' : ''
            } ${THEME_CLASSES[b.theme]}`}
            title={b.tooltip}
          >
            {b.label}
          </span>
        ))}
      </div>
    );
  }

  // Mobile Subline view
  return (
    <div className="sm:hidden flex items-center gap-1.5 pl-6 pt-1 text-[10px] flex-wrap">
      <span className="text-[#52606d] font-mono select-none">↳</span>
      {badges.map((b) => (
        <span
          key={b.id}
          onClick={(e) => {
            if (onBadgeClick) {
              e.stopPropagation();
              onBadgeClick(b);
            }
          }}
          className={`px-1.5 py-0.5 rounded border font-mono select-none transition-colors ${
            onBadgeClick ? 'cursor-pointer' : ''
          } ${THEME_CLASSES[b.theme]}`}
          title={b.tooltip}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
};
