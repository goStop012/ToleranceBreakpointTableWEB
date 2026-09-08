import React, { useState, useMemo } from 'react';
import { Search, X, ShieldAlert, Sparkles, Copy, Check } from 'lucide-react';
import { GDT_SYMBOLS } from '../constants/gdtSymbols';
import { GDTCategory, GDTSymbolItem } from '../types/gdt';
import { GdtIcon } from './GdtIcon';

interface GdtSymbolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_TABS: { key: 'all' | GDTCategory; label: string; count: number }[] = [
  { key: 'all', label: '全部', count: 14 },
  { key: 'form', label: '形状公差', count: 4 },
  { key: 'profile', label: '轮廓公差', count: 2 },
  { key: 'orientation', label: '定向公差', count: 3 },
  { key: 'location', label: '定位公差', count: 3 },
  { key: 'runout', label: '跳动公差', count: 2 },
];

export const GdtSymbolsModal: React.FC<GdtSymbolsModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | GDTCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSymbols = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return GDT_SYMBOLS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCat) return false;
      if (!query) return true;

      return (
        item.nameZh.toLowerCase().includes(query) ||
        item.nameEn.toLowerCase().includes(query) ||
        item.categoryZh.toLowerCase().includes(query) ||
        item.definition.toLowerCase().includes(query) ||
        item.application.toLowerCase().includes(query) ||
        item.symbol.includes(query)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleCopySymbol = (item: GDTSymbolItem) => {
    navigator.clipboard?.writeText(item.symbol);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1f2933] border border-[#52606d] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#cbd2d9]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3e4c59] bg-[#323f4b]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3aad42]/20 border border-[#3aad42]/40 flex items-center justify-center text-[#5ec864]">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#f5f7fa]">形状和位置公差符号速查</h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#1f2933] text-[#9aa5b1] border border-[#3e4c59]">
                  GB/T 1182 / ISO 1101
                </span>
              </div>
              <p className="text-[11px] text-[#7b8794]">共 14 项标准形位公差特征：形状、轮廓、定向、定位及跳动</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9aa5b1] hover:text-white p-1.5 rounded-lg hover:bg-[#3e4c59] transition-colors"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-[#3e4c59] bg-[#26313c] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#1f2933] rounded-xl border border-[#3e4c59]">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#3aad42] text-[#0a150c] shadow-sm'
                      : 'text-[#9aa5b1] hover:text-[#e4e7eb] hover:bg-[#323f4b]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? 'bg-[#0a150c]/20 text-[#0a150c]' : 'bg-[#323f4b] text-[#7b8794]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8794]" />
            <input
              type="text"
              placeholder="搜索符号或公差名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f2933] border border-[#52606d] focus:border-[#3aad42] rounded-lg pl-9 pr-8 py-1.5 text-xs text-[#e4e7eb] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7b8794] hover:text-[#cbd2d9]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[calc(92vh-150px)]">
          {filteredSymbols.length === 0 ? (
            <div className="text-center py-16 text-[#7b8794] text-sm">
              <ShieldAlert className="mx-auto mb-2 opacity-50" size={32} />
              没有找到匹配的形位公差符号
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSymbols.map((item) => {
                const isForm = item.category === 'form';
                const isProfile = item.category === 'profile';
                const isOrientation = item.category === 'orientation';
                const isLocation = item.category === 'location';
                const isRunout = item.category === 'runout';

                const categoryColor = isForm
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : isProfile
                  ? 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10'
                  : isOrientation
                  ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                  : isLocation
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  : 'border-purple-500/30 text-purple-400 bg-purple-500/10';

                const datumBadgeColor =
                  item.datumRequirement === '无需基准'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : item.datumRequirement === '必须有基准'
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30';

                return (
                  <div
                    key={item.id}
                    className="group bg-[#26313c] hover:bg-[#2c3946] border border-[#3e4c59] hover:border-[#52606d] rounded-xl p-4 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3">
                          {/* Symbol Icon Box */}
                          <div className="w-12 h-12 rounded-lg bg-[#1f2933] border border-[#52606d] flex items-center justify-center text-[#5ec864] shrink-0 shadow-inner group-hover:border-[#3aad42]/60 transition-colors">
                            <GdtIcon id={item.iconPath} size={28} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-[#e4e7eb]">{item.nameZh}</h4>
                              <span className="text-lg font-mono text-[#5ec864] font-semibold">
                                {item.symbol}
                              </span>
                            </div>
                            <span className="text-xs text-[#9aa5b1] font-mono">{item.nameEn}</span>
                          </div>
                        </div>

                        {/* Category & Datum Badges */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColor} font-medium`}>
                            {item.categoryZh}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${datumBadgeColor}`}>
                            {item.datumRequirement}
                          </span>
                        </div>
                      </div>

                      {/* Definition and Tolerance zone */}
                      <div className="space-y-1.5 text-xs mt-3">
                        <div className="bg-[#1f2933]/70 rounded-lg p-2.5 border border-[#3e4c59]">
                          <span className="text-[#9aa5b1] font-medium block mb-1">标准定义：</span>
                          <p className="text-[#cbd2d9] leading-relaxed">{item.definition}</p>
                        </div>

                        <div className="px-1 py-1 text-[11px] text-[#9aa5b1]">
                          <span className="text-[#7b8794]">公差带特征：</span>
                          <span className="text-[#cbd2d9]">{item.toleranceZone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Application */}
                    <div className="mt-3 pt-2.5 border-t border-[#3e4c59] flex items-center justify-between text-[11px]">
                      <div className="text-[#7b8794] truncate pr-2" title={item.application}>
                        <span className="text-[#9aa5b1]">应用：</span>
                        {item.application}
                      </div>

                      <button
                        onClick={() => handleCopySymbol(item)}
                        className="shrink-0 flex items-center gap-1 text-[#9aa5b1] hover:text-[#5ec864] bg-[#1f2933] hover:bg-[#323f4b] border border-[#3e4c59] px-2 py-1 rounded transition-colors"
                        title="复制公差符号到剪贴板"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check size={11} className="text-[#5ec864]" />
                            <span className="text-[10px] text-[#5ec864]">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span className="text-[10px]">复制符号</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with quick standard note */}
        <div className="px-5 py-2.5 border-t border-[#3e4c59] bg-[#1f2933] flex items-center justify-between text-xs text-[#7b8794]">
          <span>依据 GB/T 1182-2008《产品几何技术规范(GPS) 几何公差 形状、方向、位置和跳动公差标注》</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#323f4b] hover:bg-[#3e4c59] text-[#e4e7eb] font-semibold text-xs transition-colors"
          >
            完成查看
          </button>
        </div>
      </div>
    </div>
  );
};
