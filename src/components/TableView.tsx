import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus, Check, X } from 'lucide-react';
import { InputMode, PositionType, TableData, TableItem } from '../types/table';
import { ItemRow } from './ItemRow';

interface TableViewProps {
  table: TableData;
  inputMode: InputMode;
  onToggleStar: (id: string) => void;
  onPositionChange: (id: string, position: PositionType) => void;
  onValueChange: (id: string, value: string) => void;
  onOpenCalculator: (item: TableItem) => void;
  onAddAfter: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddItemToGroup: (groupId?: string) => void;
  onAddNewGroup: (groupName: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  table,
  inputMode,
  onToggleStar,
  onPositionChange,
  onValueChange,
  onOpenCalculator,
  onAddAfter,
  onDeleteItem,
  onToggleGroupCollapse,
  onRenameGroup,
  onDeleteGroup,
  onAddItemToGroup,
  onAddNewGroup,
}) => {
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const groups = table.groups || [];
  const collapsedGroups = table.collapsedGroups || [];
  const items = table.items;

  // Handle group renaming
  const handleStartRename = (groupId: string, currentName: string) => {
    setRenamingGroupId(groupId);
    setRenamingValue(currentName);
  };

  const handleConfirmRename = () => {
    if (renamingGroupId && renamingValue.trim()) {
      onRenameGroup(renamingGroupId, renamingValue.trim());
    }
    setRenamingGroupId(null);
    setRenamingValue('');
  };

  const handleCancelRename = () => {
    setRenamingGroupId(null);
    setRenamingValue('');
  };

  // Handle new group creation
  const handleConfirmNewGroup = () => {
    if (newGroupName.trim()) {
      onAddNewGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  const handleCancelNewGroup = () => {
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  // Ungrouped items
  const ungroupedItems = items.filter((it) => !it.groupId);

  return (
    <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-4">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Render grouped sections */}
        {groups.map((group) => {
          const groupItems = items.filter((it) => it.groupId === group.id);
          const isCollapsed = collapsedGroups.includes(group.id);
          const isRenaming = renamingGroupId === group.id;

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header */}
              {isRenaming ? (
                <div className="flex items-center gap-2 p-1 bg-[#1f2933] rounded-lg border border-[#52606d]">
                  <input
                    type="text"
                    value={renamingValue}
                    onChange={(e) => setRenamingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    autoFocus
                    className="flex-1 bg-[#161e26] border border-[#3e4c59] rounded px-2 py-1 text-xs text-[#f5f7fa] outline-none"
                  />
                  <button
                    onClick={handleConfirmRename}
                    className="p-1 text-[#0a150c] bg-[#3aad42] rounded hover:bg-[#5ec864]"
                    title="确定"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={handleCancelRename}
                    className="p-1 text-[#9aa5b1] bg-[#323f4b] rounded hover:bg-[#3e4c59]"
                    title="取消"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => onToggleGroupCollapse(group.id)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1f2933] cursor-pointer group transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#7b8794]">
                      {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    </span>
                    <span className="text-xs font-bold text-[#cbd2d9]">{group.name}</span>
                    <span className="text-[11px] text-[#616e7c]">({groupItems.length})</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleStartRename(group.id, group.name)}
                      className="p-1 text-[#7b8794] hover:text-[#cbd2d9] rounded hover:bg-[#323f4b]"
                      title="重命名群组"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteGroup(group.id)}
                      className="p-1 text-[#7b8794] hover:text-[#ef4444] rounded hover:bg-red-500/10"
                      title="删除群组"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      onClick={() => onAddItemToGroup(group.id)}
                      className="p-1 text-[#7b8794] hover:text-[#5ec864] rounded hover:bg-[#3aad42]/15"
                      title="在群组中添加记录"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Group Items list */}
              {!isCollapsed && (
                <div className="space-y-0.5 pl-2 sm:pl-3 border-l-2 border-[#323f4b]/60">
                  {groupItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      inputMode={inputMode}
                      onToggleStar={onToggleStar}
                      onPositionChange={onPositionChange}
                      onValueChange={onValueChange}
                      onOpenCalculator={onOpenCalculator}
                      onAddAfter={onAddAfter}
                      onDeleteItem={onDeleteItem}
                    />
                  ))}
                  {groupItems.length === 0 && (
                    <div className="py-2 text-center text-xs text-[#52606d] italic">群组暂无记录，点击右上角 + 添加</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Ungrouped section */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7b8794] tracking-wider uppercase">未分组</span>
              <span className="text-[11px] text-[#616e7c]">({ungroupedItems.length})</span>
            </div>
            <button
              onClick={() => onAddItemToGroup(undefined)}
              className="p-1 text-[#7b8794] hover:text-[#5ec864] rounded hover:bg-[#3aad42]/15 transition-colors"
              title="添加未分组记录"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {ungroupedItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                inputMode={inputMode}
                onToggleStar={onToggleStar}
                onPositionChange={onPositionChange}
                onValueChange={onValueChange}
                onOpenCalculator={onOpenCalculator}
                onAddAfter={onAddAfter}
                onDeleteItem={onDeleteItem}
              />
            ))}
          </div>
        </div>

        {/* New Group Button / Inline Form */}
        <div className="pt-2">
          {isCreatingGroup ? (
            <div className="flex items-center gap-2 p-1.5 bg-[#1f2933] rounded-lg border border-[#52606d]">
              <input
                type="text"
                placeholder="输入群组名称"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNewGroup();
                  if (e.key === 'Escape') handleCancelNewGroup();
                }}
                autoFocus
                className="flex-1 bg-[#161e26] border border-[#3e4c59] rounded px-2.5 py-1 text-xs text-[#f5f7fa] outline-none"
              />
              <button
                onClick={handleConfirmNewGroup}
                className="px-3 py-1 text-xs font-bold text-[#0a150c] bg-[#3aad42] rounded hover:bg-[#5ec864]"
              >
                确定
              </button>
              <button
                onClick={handleCancelNewGroup}
                className="px-2.5 py-1 text-xs text-[#9aa5b1] bg-[#323f4b] rounded hover:bg-[#3e4c59]"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="w-full py-2 flex items-center justify-center gap-1.5 border border-dashed border-[#3e4c59] hover:border-[#5ec864] text-[#7b8794] hover:text-[#5ec864] rounded-xl text-xs font-medium transition-all"
            >
              <Plus size={14} />
              <span>新建群组</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
