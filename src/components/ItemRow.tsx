import React from 'react';
import { Star, Plus, X } from 'lucide-react';
import { InputMode, PositionType, TableItem } from '../types/table';
import { POSITIONS } from '../constants/positions';

interface ItemRowProps {
  item: TableItem;
  inputMode: InputMode;
  onToggleStar: (id: string) => void;
  onPositionChange: (id: string, position: PositionType) => void;
  onValueChange: (id: string, value: string) => void;
  onOpenCalculator: (item: TableItem) => void;
  onAddAfter: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  inputMode,
  onToggleStar,
  onPositionChange,
  onValueChange,
  onOpenCalculator,
  onAddAfter,
  onDeleteItem,
}) => {
  const isReadOnly = inputMode !== 'normal' || Boolean(item.source);

  const handleInputClick = () => {
    if (isReadOnly) {
      onOpenCalculator(item);
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors group ${
        item.starred
          ? 'bg-[#5ec864]/10 shadow-[inset_0_0_0_1px_rgba(94,200,100,0.3)]'
          : 'hover:bg-[#3e4c59]/30'
      }`}
    >
      {/* Star button */}
      <button
        type="button"
        onClick={() => onToggleStar(item.id)}
        className={`p-1 rounded transition-colors shrink-0 ${
          item.starred ? 'text-[#5ec864]' : 'text-[#52606d] hover:text-[#9aa5b1]'
        }`}
        title={item.starred ? '取消标记' : '标记该行'}
      >
        <Star size={15} fill={item.starred ? 'currentColor' : 'none'} />
      </button>

      {/* Sequential Number Label */}
      <span className="w-6 text-center text-xs font-mono font-bold text-[#7b8794] shrink-0">
        {item.label}
      </span>

      {/* Position Dropdown */}
      <select
        value={item.position || ''}
        onChange={(e) => onPositionChange(item.id, e.target.value as PositionType)}
        className="w-20 shrink-0 bg-[#161e26] border border-[#3e4c59] hover:border-[#52606d] focus:border-[#3aad42] rounded-md px-1.5 py-1 text-xs text-[#cbd2d9] outline-none cursor-pointer"
      >
        {POSITIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Value Input Box */}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          readOnly={isReadOnly}
          value={item.value}
          onChange={(e) => onValueChange(item.id, e.target.value)}
          onClick={handleInputClick}
          placeholder={isReadOnly ? '点击编辑数值' : '0'}
          className={`w-full bg-[#161e26] border rounded-md px-2.5 py-1 text-xs text-[#f5f7fa] font-mono outline-none transition-colors ${
            isReadOnly
              ? 'cursor-pointer border-[#3e4c59] hover:border-[#5ec864]/60 placeholder:text-[#52606d]'
              : 'border-[#3e4c59] focus:border-[#3aad42]'
          }`}
        />

        {/* Free Tolerance Grade or Source Badge */}
        {item.toleranceInput?.freeGrade && (
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.2 rounded bg-[#3aad42]/20 text-[#5ec864] border border-[#3aad42]/40 font-mono pointer-events-none"
            title={`自由公差等级: GB/T 1804-${item.toleranceInput.freeGrade}`}
          >
            {item.toleranceInput.freeGrade}级
          </span>
        )}
      </div>

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
  );
};
