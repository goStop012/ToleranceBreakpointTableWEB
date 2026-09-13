import React, { useState, useEffect, useMemo } from 'react';
import { Star, Plus, X } from 'lucide-react';
import { InputMode, PositionType, TableItem, ToleranceInputState } from '../types/table';
import { UnitConfig } from '../types/unit';
import { PositionOption } from '../types/position';
import { POSITIONS } from '../constants/positions';
import { processInputWithUnit, convertLength, formatLengthValue } from '../utils/unit';
import { evaluateExpression } from '../utils/expression';
import { getItemBadges } from '../utils/badge';
import { ItemBadges } from './ItemBadges';
import { ItemBadgeInfo } from '../types/badge';

interface ItemRowProps {
  item: TableItem;
  inputMode: InputMode;
  unitConfig: UnitConfig;
  positions?: PositionOption[];
  onToggleStar: (id: string) => void;
  onPositionChange: (id: string, position: PositionType) => void;
  onValueChange: (
    id: string,
    value: string,
    rawInput?: string,
    rawUnit?: 'mm' | 'inch',
    extra?: {
      source?: 'tolerance' | 'expression';
      expression?: string;
      expressionUnit?: 'mm' | 'inch';
      toleranceInput?: ToleranceInputState;
    }
  ) => void;
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

  // Parse all active badges for this item
  const badges = useMemo(() => getItemBadges(item, unitConfig), [item, unitConfig]);

  // Sync when outside item changes or unit configuration updates
  useEffect(() => {
    setLocalValue(item.value);
  }, [item.value, unitConfig.displayUnit, unitConfig.mode]);

  const handleInputClick = () => {
    if (isReadOnly) {
      onOpenCalculator(item);
    }
  };

  const handleBadgeClick = (badge: ItemBadgeInfo) => {
    if (badge.type === 'expression') {
      onOpenCalculator({ ...item, source: 'expression' });
    } else if (badge.type === 'tolerance' || badge.type === 'fit' || badge.type === 'free') {
      onOpenCalculator({ ...item, source: 'tolerance' });
    } else {
      onOpenCalculator(item);
    }
  };

  const handleCommitChange = (rawInputText: string) => {
    const trimmed = rawInputText.trim();
    if (!trimmed) {
      onValueChange(item.id, '', undefined, undefined);
      return;
    }

    // 1. Direct mathematical expression evaluation (e.g. "=10+5*2" or "25.4*2+5")
    const isExplicitExpr = trimmed.startsWith('=');
    const exprText = isExplicitExpr ? trimmed.slice(1).trim() : trimmed;
    const hasMathOp = /[+\-*/]/.test(exprText) && !/^[+-]?\d+(\.\d+)?$/.test(exprText);

    if (isExplicitExpr || hasMathOp) {
      const evalRes = evaluateExpression(exprText);
      if (!evalRes.error && isFinite(evalRes.value)) {
        const converted = convertLength(evalRes.value, unitConfig.inputUnit, unitConfig.displayUnit);
        const displayDecimals = unitConfig.displayUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;
        const formattedDisplay = formatLengthValue(converted, unitConfig.displayUnit, displayDecimals);

        const inputDecimals = unitConfig.inputUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;
        const rawEvaluated = formatLengthValue(evalRes.value, unitConfig.inputUnit, inputDecimals);

        onValueChange(item.id, formattedDisplay, rawEvaluated, unitConfig.inputUnit, {
          source: 'expression',
          expression: trimmed,
          expressionUnit: unitConfig.inputUnit,
        });
        setLocalValue(formattedDisplay);
        return;
      }
    }

    // 2. If unit conversion is needed (e.g. in -> mm or mm -> in) or fraction was entered
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

    // 3. Default fallback commit
    onValueChange(item.id, trimmed);
    setLocalValue(trimmed);
  };

  const displayUnitLabel = unitConfig.displayUnit === 'inch' ? '″' : 'mm';
  const inputTooltip = badges.length > 0 ? badges.map((b) => b.tooltip).join(' | ') : undefined;

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
            title={inputTooltip}
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
        <ItemBadges badges={badges} variant="inline" onBadgeClick={handleBadgeClick} />

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

      {/* Mobile Sub-line view */}
      <ItemBadges badges={badges} variant="subline" onBadgeClick={handleBadgeClick} />
    </div>
  );
};
