import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Plus } from 'lucide-react';
import { TableData } from '../types/table';

interface TableNameModalProps {
  isOpen: boolean;
  kind: 'new' | 'rename';
  currentName?: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export const TableNameModal: React.FC<TableNameModalProps> = ({
  isOpen,
  kind,
  currentName = '',
  onClose,
  onConfirm,
}) => {
  const [val, setVal] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVal(kind === 'new' ? '' : currentName);
    }
  }, [isOpen, kind, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onConfirm(val.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1f2933] border border-[#52606d] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-[#cbd2d9]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e4c59] bg-[#323f4b]/50">
          <div className="flex items-center gap-2">
            {kind === 'new' ? (
              <Plus size={16} className="text-[#5ec864]" />
            ) : (
              <Edit2 size={16} className="text-[#5ec864]" />
            )}
            <h3 className="text-sm font-bold text-[#f5f7fa]">
              {kind === 'new' ? '新建表格' : '重命名表格'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#9aa5b1] hover:text-white p-1 rounded hover:bg-[#3e4c59]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <input
            type="text"
            placeholder="输入表格名称"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
            className="w-full bg-[#161e26] border border-[#52606d] focus:border-[#3aad42] rounded-lg px-3 py-2 text-sm text-[#f5f7fa] outline-none"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#323f4b] hover:bg-[#3e4c59] text-xs text-[#cbd2d9]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!val.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#3aad42] hover:bg-[#5ec864] disabled:opacity-40 text-[#0a150c] font-bold text-xs"
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  targetTable: TableData | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  targetTable,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !targetTable) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1f2933] border border-[#52606d] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-[#cbd2d9]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e4c59] bg-[#323f4b]/50">
          <div className="flex items-center gap-2 text-[#ef4444]">
            <Trash2 size={16} />
            <h3 className="text-sm font-bold text-[#ef4444]">删除表格</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#9aa5b1] hover:text-white p-1 rounded hover:bg-[#3e4c59]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-[#cbd2d9] leading-relaxed">
            确定要删除表格「<strong className="text-[#f5f7fa]">{targetTable.name}</strong>」吗？此操作将清除该表格下的所有切点记录且不可恢复。
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#323f4b] hover:bg-[#3e4c59] text-xs text-[#cbd2d9]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-[#ef4444] hover:bg-red-400 text-white font-bold text-xs"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
