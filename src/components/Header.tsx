import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenGdtModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGdtModal }) => {
  return (
    <header className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#323f4b] bg-[#161e26]">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-base sm:text-lg font-bold text-[#f5f7fa] tracking-tight flex items-center gap-2">
          <Layers className="text-[#5ec864]" size={18} />
          公差切点表
        </h1>
        <span className="hidden sm:inline-block text-xs text-[#7b8794]">
          多表管理 · 自由公差(GB/T 1804)自动填入 · 形位公差速查
        </span>
      </div>

      {/* Action button for Feature 2: 形位公差符号 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenGdtModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3aad42]/15 hover:bg-[#3aad42]/25 text-[#5ec864] border border-[#3aad42]/40 text-xs font-bold transition-all shadow-sm active:scale-95"
          title="查看形状和位置公差符号标准定义与控制特征"
        >
          <Sparkles size={14} className="text-[#5ec864]" />
          <span>形位公差符号</span>
        </button>
      </div>
    </header>
  );
};
