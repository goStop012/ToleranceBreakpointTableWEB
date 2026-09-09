import React, { useState, useEffect } from 'react';
import { Star, Plus, X } from 'lucide-react';
import { InputMode, PositionType, TableItem } from '../types/table';
import { UnitConfig } from '../types/unit';
import { PositionOption } from '../types/position';
import { POSITIONS } from '../constants/positions';
import { processInputWithUnit } from '../utils/unit';

interface ItemRowProps {
  item: TableItem;
  inputMode: InputMode;
  unitConfig: UnitConfig;
  positions?: PositionOption[];
  onToggleStar: (id: string) => void;
  onPositionChange: (id: string, position: PositionType) => void;
  onValueChange: (id: string, value: string, rawInput?: string, rawUnit?: 'mm' | 'inch') => void;
  onOpenCalculator: (item: TableItem) => void;
  onAddAfter: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  inputMode,
  unitConfig,
  positions,
  onToggleStar,
  onPositionChange,
  onValueChange,
  onOpenCalculator,
  onAddAfter,
  onDeleteItem,
}) => {
  const isReadOnly = inputMode !== 'normal' || Boolean(item.source);
  const [localValue, setLocalValue] = useState(item.value);

  const availablePositions = positions || POSITIONS;
  const currentPos = availablePositions.find((p) => p.value === (item.position || ''));
  const hasUnknownPosition = Boolean(item.position && !currentPos);

  // Sync when outside item changes or unit configuration updates
  useEffect(() => {
    setLocalValue(item.value);
  }, [item.value, unitConfig.displayUnit, unitConfig.mode]);

  const handleInputClick = () => {
    if (isReadOnly) {
      onOpenCalculator(item);
    }
  };

  const handleCommitChange = (rawInputText: string) => {
    const trimmed = rawInputText.trim();
    if (!trimmed) {
      onValueChange(item.id, '', undefined, undefined);
      return;
    }

    // If unit conversion is needed (e.g. in -> mm or mm -> in) or fraction was entered
    if (unitConfig.inputUnit !== unitConfig.displayUnit) {
      const decimals = unitConfig.displayUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;
      const res = processInputWithUnit(trimmed, unitConfig.inputUnit, unitConfig.displayUnit, decimals);
      if (res) {
        onValueChange(item.id, res.display, trimmed, unitConfig.inputUnit);
        setLocalValue(res.display);
        return;
      }
    } else {
      // Same unit, but support fractions like 1/2 in inch mode
      const decimals = unitConfig.displayUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;
      const res = processInputWithUnit(trimmed, unitConfig.inputUnit, unitConfig.displayUnit, decimals);
      if (res && trimmed.includes('/')) {
        onValueChange(item.id, res.display, trimmed, unitConfig.inputUnit);
        setLocalValue(res.display);
        return;
      }
    }

    // Default fallback commit
    onValueChange(item.id, trimmed);
    setLocalValue(trimmed);
  };

  const displayUnitLabel = unitConfig.displayUnit === 'inch' ? '″' : 'mm';
  const hasRawInput = Boolean(item.rawInput && unitConfig.inputUnit !== unitConfig.displayUnit);
  const hasFreeGrade = Boolean(item.toleranceInput?.freeGrade);
  const hasFitCode = Boolean(item.toleranceInput?.fitCode);
  const hasBadges = hasRawInput || hasFreeGrade || hasFitCode;

  return (
    <div
      className={`px-1.5 sm:px-2 py-1 rounded-lg transition-colors group ${
        item.starred
          ? 'bg-[#5ec864]/10 shadow-[inset_0_0_0_1px_rgba(94,200,100,0.3)]'
          : 'hover:bg-[#3e4c59]/30'
      }`}
    >
      {/* Primary Row: Controls & Input Box - zero horizontal overflow */}
      <div className="flex items-center gap-1 sm:gap-1.5 w-full">
        {/* Star button */}
        <button
          type="button"
          onClick={() => onToggleStar(item.id)}
          className={`p-1 rounded transition-colors shrink-0 ${
            item.starred ? 'text-[#5ec864]' : 'text-[#52606d] hover:text-[#9aa5b1]'
          }`}
          title={item.starred ? '取消标记' : '标记该行'}
        >
          <Star size={14} fill={item.starred ? 'currentColor' : 'none'} />
        </button>

        {/* Sequential Number Label */}
        <span className="w-5 sm:w-6 text-center text-xs font-mono font-bold text-[#7b8794] shrink-0">
          {item.label}
        </span>

        {/* Position Dropdown with color indicator */}
        <select
          value={item.position || ''}
          onChange={(e) => onPositionChange(item.id, e.target.value as PositionType)}
          style={{
            borderLeftColor: currentPos?.color && item.position ? currentPos.color : undefined,
            borderLeftWidth: currentPos?.color && item.position ? '3px' : undefined,
          }}
          className="w-[72px] sm:w-20 shrink-0 bg-[#161e26] border border-[#3e4c59] hover:border-[#52606d] focus:border-[#3aad42] rounded-md px-1 py-1 text-xs text-[#cbd2d9] outline-none cursor-pointer truncate"
        >
          {availablePositions.map((p) => (
            <option key={p.id || p.value || 'none'} value={p.value}>
              {p.label}
            </option>
          ))}
          {hasUnknownPosition && (
            <option value={item.position}>{item.position}</option>
          )}
        </select>

        {/* Value Input Box */}
        <div className="relative flex-1 min-w-[60px]">
          <input
            type="text"
            readOnly={isReadOnly}
            value={isReadOnly ? item.value : localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
              if (!isReadOnly) handleCommitChange(localValue);
            }}
            onKeyDown={(e) => {
              if (!isReadOnly && e.key === 'Enter') {
                handleCommitChange(localValue);
                (e.target as HTMLInputElement).blur();
              }
            }}
            onClick={handleInputClick}
            title={
              item.source === 'tolerance' && item.toleranceInput
                ? `名义值: ${item.toleranceInput.nominal} | 偏差: +${item.toleranceInput.upper} / -${item.toleranceInput.lower} | 取: ${
                    item.toleranceInput.selected === 'upper'
                      ? '上偏差'
                      : item.toleranceInput.selected === 'lower'
                      ? '下偏差'
                      : '中间值'
                  }${item.toleranceInput.fitCode ? ` (配合: ${item.toleranceInput.fitCode})` : ''}${
                    item.toleranceInput.freeGrade ? ` (GB/T 1804-${item.toleranceInput.freeGrade})` : ''
                  }`
                : item.source === 'expression' && item.expression
                ? `计算公式: ${item.expression}`
                : undefined
            }
            placeholder={
              isReadOnly
                ? '点击编辑'
                : unitConfig.inputUnit !== unitConfig.displayUnit
                ? `转${unitConfig.displayUnit}`
                : `0 (${displayUnitLabel})`
            }
            className={`w-full bg-[#161e26] border rounded-md pl-2 pr-7 py-1 text-xs text-[#f5f7fa] font-mono outline-none transition-colors ${
              isReadOnly
                ? 'cursor-pointer border-[#3e4c59] hover:border-[#5ec864]/60 placeholder:text-[#52606d]'
                : 'border-[#3e4c59] focus:border-[#3aad42]'
            }`}
          />

          {/* Clean right-side unit badge inside input (fixed pr-7, no overlap) */}
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7b8794] font-mono font-medium pointer-events-none select-none">
            {displayUnitLabel}
          </span>
        </div>

        {/* Desktop-only In-line Status Badges */}
        {hasBadges && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {hasRawInput && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#26313c] text-[#9aa5b1] font-mono border border-[#3e4c59] whitespace-nowrap select-none"
                title={`原始输入尺寸: ${item.rawInput} ${item.rawUnit || unitConfig.inputUnit}`}
              >
                {item.rawInput}{item.rawUnit === 'inch' ? '″' : ''}
              </span>
            )}

            {hasFitCode && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30 font-mono font-bold whitespace-nowrap select-none"
                title={`配合公差代号: ISO 286 / GB 1800 ${item.toleranceInput?.fitCode}`}
              >
                {item.toleranceInput?.fitCode}
              </span>
            )}

            {hasFreeGrade && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#3aad42]/15 text-[#5ec864] border border-[#3aad42]/30 font-mono font-medium whitespace-nowrap select-none"
                title={`自由公差等级: GB/T 1804-${item.toleranceInput?.freeGrade}`}
              >
                {item.toleranceInput?.freeGrade}级
              </span>
            )}
          </div>
        )}

        {/* Add Row After button */}
        <button
          type="button"
          onClick={() => onAddAfter(item.id)}
          className="p-1 rounded text-[#7b8794] hover:text-[#5ec864] hover:bg-[#3aad42]/15 transition-colors shrink-0"
          title="在下方插入新行"
        >
          <Plus size={14} />
        </button>

        {/* Delete Row button */}
        <button
          type="button"
          onClick={() => onDeleteItem(item.id)}
          className="p-1 rounded text-[#7b8794] hover:text-[#ef4444] hover:bg-red-500/15 transition-colors shrink-0"
          title="删除此行"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mobile Sub-line (only rendered on narrow screens when metadata tags exist) */}
      {hasBadges && (
        <div className="sm:hidden flex items-center gap-1.5 pl-6 pt-1 text-[10px]">
          <span className="text-[#52606d] font-mono">↳</span>
          {hasRawInput && (
            <span
              className="px-1.5 py-0.5 rounded bg-[#26313c] text-[#cbd2d9] font-mono border border-[#3e4c59] select-none"
              title={`原始输入尺寸: ${item.rawInput}`}
            >
              原: {item.rawInput}{item.rawUnit === 'inch' ? '″' : ''}
            </span>
          )}
          {hasFitCode && (
            <span
              className="px-1.5 py-0.5 rounded bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30 font-mono font-bold select-none"
              title={`配合公差代号: ${item.toleranceInput?.fitCode}`}
            >
              配合 {item.toleranceInput?.fitCode}
            </span>
          )}
          {hasFreeGrade && (
            <span
              className="px-1.5 py-0.5 rounded bg-[#3aad42]/15 text-[#5ec864] border border-[#3aad42]/30 font-mono font-medium select-none"
              title={`自由公差等级: GB/T 1804-${item.toleranceInput?.freeGrade}`}
            >
              GB/T 1804-{item.toleranceInput?.freeGrade}级
            </span>
          )}
        </div>
      )}
    </div>
  );
};
