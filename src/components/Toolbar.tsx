import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Download, Upload, FileText, Check } from 'lucide-react';
import { InputMode, PositionType, TableData } from '../types/table';
import { POSITIONS } from '../constants/positions';

interface ToolbarProps {
  inputMode: InputMode;
  onSetInputMode: (mode: InputMode) => void;
  tables: TableData[];
  activeTable: TableData;
  onSelectTable: (id: string) => void;
  onOpenNewTableModal: () => void;
  onOpenRenameTableModal: () => void;
  onRequestDeleteTable: () => void;
  onExportTable: () => void;
  onImportTable: (file: File) => void;
  onCopyRow: (rowNo: number, targetPosition: PositionType) => void;
  copyFeedback: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  inputMode,
  onSetInputMode,
  tables,
  activeTable,
  onSelectTable,
  onOpenNewTableModal,
  onOpenRenameTableModal,
  onRequestDeleteTable,
  onExportTable,
  onImportTable,
  onCopyRow,
  copyFeedback,
}) => {
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [copyNo, setCopyNo] = useState('');
  const [copyPos, setCopyPos] = useState<PositionType>('outer');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTableMenuOpen(false);
      }
    };
    if (tableMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tableMenuOpen]);

  const handleTriggerCopy = () => {
    const n = parseInt(copyNo, 10);
    if (isNaN(n) || n <= 0) return;
    onCopyRow(n, copyPos);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportTable(file);
      e.target.value = '';
      setTableMenuOpen(false);
    }
  };

  return (
    <div className="bg-[#1f2933] border border-[#3e4c59] rounded-xl mx-3.5 my-2.5 p-3 flex flex-col gap-2.5 shadow-md">
      {/* Top row: Input Mode and Table Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-center">
        {/* Input Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#9aa5b1] shrink-0">输入模式</span>
          <div className="flex gap-1 flex-1 bg-[#161e26] p-1 rounded-lg border border-[#323f4b]">
            {[
              { key: 'normal', label: '正常' },
              { key: 'tolerance', label: '公差' },
              { key: 'expression', label: '表达式' },
            ].map((m) => {
              const active = inputMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => onSetInputMode(m.key as InputMode)}
                  className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#3aad42] text-[#0a150c] shadow-sm'
                      : 'text-[#7b8794] hover:text-[#cbd2d9] hover:bg-[#26313c]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#9aa5b1] shrink-0">表格</span>
          <div className="relative flex-1" ref={menuRef}>
            <button
              onClick={() => setTableMenuOpen(!tableMenuOpen)}
              className="w-full flex items-center justify-between bg-[#161e26] hover:border-[#52606d] border border-[#3e4c59] rounded-lg px-3 py-1.5 text-xs text-[#f5f7fa] font-medium transition-colors"
            >
              <span className="truncate pr-2">{activeTable.name}</span>
              <ChevronDown size={14} className="text-[#7b8794] shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {tableMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#1f2933] border border-[#52606d] rounded-xl shadow-2xl overflow-hidden">
                {/* Tables list */}
                <div className="max-h-48 overflow-y-auto py-1 divide-y divide-[#323f4b]">
                  {tables.map((t) => {
                    const isCur = t.id === activeTable.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTable(t.id);
                          setTableMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                          isCur
                            ? 'bg-[#3aad42]/15 text-[#5ec864] font-bold'
                            : 'text-[#cbd2d9] hover:bg-[#323f4b]'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        {isCur && <Check size={14} className="text-[#5ec864] shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Table action buttons */}
                <div className="p-2 border-t border-[#3e4c59] bg-[#161e26] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onOpenRenameTableModal();
                        setTableMenuOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-[#9aa5b1] hover:text-[#f5f7fa] hover:bg-[#323f4b] transition-colors"
                      title="重命名表格"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        onOpenNewTableModal();
                        setTableMenuOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-[#9aa5b1] hover:text-[#f5f7fa] hover:bg-[#323f4b] transition-colors"
                      title="新建表格"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => {
                        onRequestDeleteTable();
                        setTableMenuOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-[#9aa5b1] hover:text-[#ef4444] hover:bg-red-500/10 transition-colors"
                      title="删除当前表格"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        onExportTable();
                        setTableMenuOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-[#9aa5b1] hover:text-[#f5f7fa] hover:bg-[#323f4b] transition-colors"
                      title="导出 JSON"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-[#9aa5b1] hover:text-[#f5f7fa] hover:bg-[#323f4b] transition-colors"
                      title="导入 JSON"
                    >
                      <Upload size={13} />
                    </button>
                  </div>
                  <span className="text-[10px] text-[#7b8794]">管理表格</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Quick Row Copy */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#323f4b]">
        <span className="text-xs font-bold text-[#9aa5b1] shrink-0">复制记录</span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="number"
            min="1"
            placeholder="输入序号"
            value={copyNo}
            onChange={(e) => setCopyNo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTriggerCopy();
            }}
            className="w-20 bg-[#161e26] border border-[#3e4c59] focus:border-[#3aad42] rounded-lg px-2.5 py-1 text-xs text-[#f5f7fa] font-mono outline-none"
          />

          <select
            value={copyPos}
            onChange={(e) => setCopyPos(e.target.value as PositionType)}
            className="bg-[#161e26] border border-[#3e4c59] focus:border-[#3aad42] rounded-lg px-2 py-1 text-xs text-[#cbd2d9] outline-none cursor-pointer"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleTriggerCopy}
            className="px-3 py-1 rounded-lg bg-[#3aad42] hover:bg-[#5ec864] text-[#0a150c] text-xs font-bold transition-colors shrink-0"
          >
            复制
          </button>

          {copyFeedback && (
            <span className="text-xs text-[#5ec864] font-medium animate-fade-in shrink-0">
              {copyFeedback}
            </span>
          )}
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
