import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Tag,
  Palette,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { PositionOption } from '../types/position';
import { DEFAULT_POSITIONS, POSITION_COLOR_PRESETS } from '../constants/positions';
import { genId } from '../utils/math';
import { TableData } from '../types/table';

interface PositionConfigModalProps {
  isOpen: boolean;
  positions: PositionOption[];
  tables: TableData[];
  onClose: () => void;
  onSavePositions: (newPositions: PositionOption[]) => void;
}

export const PositionConfigModal: React.FC<PositionConfigModalProps> = ({
  isOpen,
  positions,
  tables,
  onClose,
  onSavePositions,
}) => {
  const [list, setList] = useState<PositionOption[]>(positions);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(POSITION_COLOR_PRESETS[0].color);
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [colorPickerOpenFor, setColorPickerOpenFor] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state whenever modal opens with latest positions
  React.useEffect(() => {
    if (isOpen) {
      setList(positions);
      setEditingId(null);
      setErrorMessage('');
      setColorPickerOpenFor(null);
    }
  }, [isOpen, positions]);

  if (!isOpen) return null;

  // Calculate usage counts across all tables
  const usageMap = new Map<string, number>();
  for (const tb of tables) {
    for (const item of tb.items) {
      if (item.position) {
        usageMap.set(item.position, (usageMap.get(item.position) || 0) + 1);
      }
    }
  }

  const handleAddPosition = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      setErrorMessage('请输入标签名称');
      return;
    }

    if (list.some((p) => p.label === trimmed)) {
      setErrorMessage(`标签名称【${trimmed}】已存在`);
      return;
    }

    const newId = `custom_${genId().slice(0, 8)}`;
    const newItem: PositionOption = {
      id: newId,
      value: newId,
      label: trimmed,
      color: newColor,
      description: newDesc.trim() || undefined,
      isPreset: false,
    };

    const updated = [...list, newItem];
    setList(updated);
    setNewLabel('');
    setNewDesc('');
    setErrorMessage('');
    // Cycle to next color for convenience
    const nextColorIdx = (POSITION_COLOR_PRESETS.findIndex((c) => c.color === newColor) + 1) % POSITION_COLOR_PRESETS.length;
    setNewColor(POSITION_COLOR_PRESETS[nextColorIdx].color);
  };

  const handleStartEdit = (p: PositionOption) => {
    setEditingId(p.id);
    setEditingLabel(p.label);
    setEditingColor(p.color || '#64748b');
    setEditingDesc(p.description || '');
    setErrorMessage('');
  };

  const handleConfirmEdit = () => {
    if (!editingId) return;
    const trimmed = editingLabel.trim();
    if (!trimmed) {
      setErrorMessage('标签名称不能为空');
      return;
    }

    // Check duplicate label with other items
    if (list.some((p) => p.id !== editingId && p.label === trimmed)) {
      setErrorMessage(`标签名称【${trimmed}】与其他项重复`);
      return;
    }

    setList((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
              ...p,
              label: trimmed,
              color: editingColor,
              description: editingDesc.trim() || undefined,
            }
          : p
      )
    );
    setEditingId(null);
    setErrorMessage('');
  };

  const handleDeletePosition = (id: string) => {
    if (id === '') {
      setErrorMessage('默认【未设置】项不可删除');
      return;
    }
    const usage = usageMap.get(id) || 0;
    if (usage > 0) {
      const ok = window.confirm(`该位置标签正在被 ${usage} 条切点记录使用，删除后这些记录的位置将被置空，是否确认删除？`);
      if (!ok) return;
    }
    setList((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    // Preserve the first item '' (未设置) at index 0 if it's there
    if (index === 0 && list[0].id === '') return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx <= 0 && list[0].id === '') return;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setList(next);
  };

  const handleResetDefaults = () => {
    const ok = window.confirm('是否重置为系统默认预设位置列表？已添加的自定义标签将被清除。');
    if (!ok) return;
    setList(DEFAULT_POSITIONS);
    setEditingId(null);
    setErrorMessage('');
  };

  const handleSaveAndClose = () => {
    onSavePositions(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1f2933] border border-[#3e4c59] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#323f4b] flex items-center justify-between bg-[#161e26]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#3aad42]/15 text-[#5ec864] border border-[#3aad42]/30">
              <Tag size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#f5f7fa] flex items-center gap-2">
                下拉列表与特征标签配置
              </h2>
              <p className="text-[11px] text-[#7b8794]">
                自定义切点位置、工序特征分类及复制选项（支持调整排序、标签颜色及增删）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9aa5b1] hover:text-[#f5f7fa] hover:bg-[#323f4b] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Add New Tag Section */}
          <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-[#cbd2d9] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Plus size={14} className="text-[#5ec864]" />
                新增自定义位置/特征标签
              </span>
              <span className="text-[10px] text-[#7b8794]">将实时出现在下拉菜单中</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-4">
                <label className="block text-[10px] text-[#7b8794] mb-1 font-medium">标签名称</label>
                <input
                  type="text"
                  placeholder="如: 倒角、退刀槽、键槽"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPosition();
                  }}
                  className="w-full bg-[#1f2933] border border-[#3e4c59] focus:border-[#3aad42] rounded-lg px-2.5 py-1.5 text-xs text-[#f5f7fa] outline-none"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[10px] text-[#7b8794] mb-1 font-medium">特征提示 (选填)</label>
                <input
                  type="text"
                  placeholder="如: C角交点、粗精车过度"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPosition();
                  }}
                  className="w-full bg-[#1f2933] border border-[#3e4c59] focus:border-[#3aad42] rounded-lg px-2.5 py-1.5 text-xs text-[#f5f7fa] outline-none"
                />
              </div>

              <div className="sm:col-span-3 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="w-full h-8 flex items-center justify-center gap-1 bg-[#3aad42] hover:bg-[#5ec864] text-[#0a150c] text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  <span>添加标签</span>
                </button>
              </div>
            </div>

            {/* Color Palette Selection for New Tag */}
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-[#7b8794] flex items-center gap-1 shrink-0">
                <Palette size={12} />
                标签颜色:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {POSITION_COLOR_PRESETS.map((cp) => (
                  <button
                    key={cp.color}
                    type="button"
                    onClick={() => setNewColor(cp.color)}
                    style={{ backgroundColor: cp.color }}
                    title={cp.name}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      newColor === cp.color
                        ? 'ring-2 ring-white scale-110 shadow-md'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Existing Options List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#7b8794] px-1">
              <span>当前下拉列表选项 ({list.length})</span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1 text-[11px] text-[#9aa5b1] hover:text-[#f5f7fa] transition-colors"
                title="恢复系统出厂预设配置"
              >
                <RotateCcw size={12} />
                <span>恢复默认预设</span>
              </button>
            </div>

            <div className="border border-[#323f4b] rounded-xl overflow-hidden divide-y divide-[#26313c] bg-[#161e26] max-h-72 overflow-y-auto">
              {list.map((item, idx) => {
                const isEditing = editingId === item.id;
                const usage = usageMap.get(item.id) || 0;
                const isFirstItem = idx === 0 && item.id === '';

                if (isEditing) {
                  return (
                    <div key={item.id} className="p-2.5 bg-[#1f2933] space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          placeholder="标签显示文本"
                          autoFocus
                          className="bg-[#161e26] border border-[#3e4c59] rounded px-2.5 py-1 text-xs text-[#f5f7fa] outline-none"
                        />
                        <input
                          type="text"
                          value={editingDesc}
                          onChange={(e) => setEditingDesc(e.target.value)}
                          placeholder="描述提示"
                          className="bg-[#161e26] border border-[#3e4c59] rounded px-2.5 py-1 text-xs text-[#cbd2d9] outline-none"
                        />
                      </div>

                      {/* Color Picker in edit mode */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {POSITION_COLOR_PRESETS.map((cp) => (
                            <button
                              key={cp.color}
                              type="button"
                              onClick={() => setEditingColor(cp.color)}
                              style={{ backgroundColor: cp.color }}
                              className={`w-4 h-4 rounded-full transition-transform ${
                                editingColor === cp.color
                                  ? 'ring-2 ring-white scale-125'
                                  : 'opacity-75 hover:opacity-100'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleConfirmEdit}
                            className="px-2.5 py-1 bg-[#3aad42] text-[#0a150c] text-xs font-bold rounded hover:bg-[#5ec864] flex items-center gap-1"
                          >
                            <Check size={12} />
                            <span>保存</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-[#323f4b] text-[#cbd2d9] text-xs rounded hover:bg-[#3e4c59]"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id || 'none'}
                    className="flex items-center justify-between px-3 py-2 hover:bg-[#1f2933]/60 transition-colors group"
                  >
                    {/* Left: Tag label & color dot */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Color dot */}
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color || '#64748b' }}
                      />

                      {/* Label */}
                      <span className="text-xs font-medium text-[#f5f7fa] truncate">
                        {item.label}
                      </span>

                      {/* Description or hint */}
                      {item.description && (
                        <span className="hidden sm:inline-block text-[11px] text-[#616e7c] truncate max-w-[140px]">
                          {item.description}
                        </span>
                      )}

                      {/* Preset badge */}
                      {item.isPreset ? (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#26313c] text-[#7b8794] border border-[#3e4c59] shrink-0 select-none">
                          预设
                        </span>
                      ) : (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#3aad42]/15 text-[#5ec864] border border-[#3aad42]/30 shrink-0 select-none">
                          自定义
                        </span>
                      )}

                      {/* Usage tag */}
                      {usage > 0 && (
                        <span
                          className="text-[10px] text-[#9aa5b1] font-mono shrink-0"
                          title={`在表格中已被使用 ${usage} 次`}
                        >
                          ({usage}行)
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={isFirstItem || idx <= 1}
                        onClick={() => handleMove(idx, 'up')}
                        className={`p-1 rounded text-[#7b8794] hover:text-[#cbd2d9] hover:bg-[#323f4b] transition-colors ${
                          isFirstItem || idx <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="上移此选项"
                      >
                        <ArrowUp size={13} />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={isFirstItem || idx === list.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className={`p-1 rounded text-[#7b8794] hover:text-[#cbd2d9] hover:bg-[#323f4b] transition-colors ${
                          isFirstItem || idx === list.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="下移此选项"
                      >
                        <ArrowDown size={13} />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1 rounded text-[#7b8794] hover:text-[#cbd2d9] hover:bg-[#323f4b] transition-colors"
                        title="编辑名称与颜色"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete */}
                      {!isFirstItem && (
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(item.id)}
                          className="p-1 rounded text-[#7b8794] hover:text-[#ef4444] hover:bg-red-500/10 transition-colors"
                          title="删除此选项"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Preview of Dropdown */}
          <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3 space-y-1.5">
            <span className="text-[11px] font-bold text-[#7b8794] block">下拉菜单效果预览</span>
            <div className="flex items-center gap-2">
              <select
                className="bg-[#1f2933] border border-[#3e4c59] rounded-lg px-3 py-1.5 text-xs text-[#f5f7fa] outline-none cursor-pointer"
                defaultValue={list[1]?.value || ''}
              >
                {list.map((opt) => (
                  <option key={opt.id || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#616e7c]">
                共 {list.length} 个选项，已即时生效
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#323f4b] bg-[#161e26] flex items-center justify-between">
          <span className="text-xs text-[#7b8794]">修改后将自动保存至本地缓存</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#cbd2d9] hover:bg-[#323f4b] rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 text-xs font-bold text-[#0a150c] bg-[#3aad42] hover:bg-[#5ec864] rounded-lg transition-colors shadow-sm"
            >
              应用并保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
