import React from 'react';
import { Layers, Sparkles, SlidersHorizontal, Tag, Scale } from 'lucide-react';
import { UnitConfig, UnitMode } from '../types/unit';
import { UNIT_MODE_OPTIONS } from '../constants/units';

interface HeaderProps {
  onOpenGdtModal: () => void;
  unitConfig: UnitConfig;
  onOpenUnitModal: () => void;
  onSelectUnitMode?: (mode: UnitMode) => void;
  onOpenPositionModal?: () => void;
  onOpenFitModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGdtModal,
  unitConfig,
  onOpenUnitModal,
  onSelectUnitMode,
  onOpenPositionModal,
  onOpenFitModal,
}) => {
  const currentOption = UNIT_MODE_OPTIONS.find((o) => o.mode === unitConfig.mode) || UNIT_MODE_OPTIONS[0];

  return (
    <header className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#323f4b] bg-[#161e26]">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-base sm:text-lg font-bold text-[#f5f7fa] tracking-tight flex items-center gap-2">
          <Layers className="text-[#5ec864]" size={18} />
          公差切点表
        </h1>
        <span className="hidden sm:inline-block text-xs text-[#7b8794]">
          多表管理 · 公英制换算 · GB/T 1804自由公差 · 形位公差
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Unit Switcher & Settings */}
        <div className="flex items-center bg-[#1f2933] border border-[#3e4c59] rounded-lg p-0.5 text-xs shadow-sm">
          {onSelectUnitMode ? (
            <select
              value={unitConfig.mode}
              onChange={(e) => onSelectUnitMode(e.target.value as UnitMode)}
              className="bg-transparent text-xs font-bold text-[#5ec864] pl-2 pr-1 py-1 outline-none cursor-pointer hover:text-[#76db7c] transition-colors"
              title="快速切换公/英制换算模式"
            >
              {UNIT_MODE_OPTIONS.map((opt) => (
                <option key={opt.mode} value={opt.mode} className="bg-[#1f2933] text-[#cbd2d9]">
                  {opt.dropdownLabel}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-bold text-[#5ec864] px-2 py-1">
              {currentOption.dropdownLabel}
            </span>
          )}

          <button
            type="button"
            onClick={onOpenUnitModal}
            className="p-1.5 text-[#9aa5b1] hover:text-[#5ec864] hover:bg-[#26313c] rounded-md transition-colors"
            title="单位换算规则与精度详细设置"
          >
            <SlidersHorizontal size={13} />
          </button>
        </div>

        {/* Feature: 下拉列表/位置标签配置 */}
        {onOpenPositionModal && (
          <button
            type="button"
            onClick={onOpenPositionModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1f2933] hover:bg-[#26313c] text-[#cbd2d9] hover:text-[#f5f7fa] border border-[#3e4c59] text-xs font-medium transition-all shadow-sm active:scale-95"
            title="配置切点位置与工序特征下拉选项"
          >
            <Tag size={13} className="text-[#3b82f6]" />
            <span className="hidden sm:inline">下拉配置</span>
          </button>
        )}

        {/* Feature: 配合公差速查 (ISO 286 / GB 1800) */}
        {onOpenFitModal && (
          <button
            type="button"
            onClick={onOpenFitModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1f2933] hover:bg-[#26313c] text-[#cbd2d9] hover:text-[#f5f7fa] border border-[#3e4c59] text-xs font-medium transition-all shadow-sm active:scale-95"
            title="常用配合公差代号速查与自动换算 (ISO 286 / GB 1800)"
          >
            <Scale size={13} className="text-[#f59e0b]" />
            <span className="hidden sm:inline">配合公差</span>
          </button>
        )}

        {/* Feature 2: 形位公差符号 */}
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

