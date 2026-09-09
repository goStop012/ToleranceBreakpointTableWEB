import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, Settings2, RefreshCw, Calculator, Info } from 'lucide-react';
import { UnitConfig, UnitMode, ExistingValueConversionStrategy } from '../types/unit';
import { UNIT_MODE_OPTIONS } from '../constants/units';
import { convertLength, formatLengthValue, parseNumberOrFraction, getUnitsFromMode } from '../utils/unit';

interface UnitSettingsModalProps {
  isOpen: boolean;
  config: UnitConfig;
  onClose: () => void;
  onSaveConfig: (newConfig: UnitConfig, strategy: ExistingValueConversionStrategy) => void;
  onBatchConvertCurrentTable?: (from: 'mm' | 'inch', to: 'mm' | 'inch') => void;
}

export const UnitSettingsModal: React.FC<UnitSettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSaveConfig,
  onBatchConvertCurrentTable,
}) => {
  const [selectedMode, setSelectedMode] = useState<UnitMode>(config.mode);
  const [mmDecimals, setMmDecimals] = useState<number>(config.mmDecimals);
  const [inchDecimals, setInchDecimals] = useState<number>(config.inchDecimals);
  const [strategy, setStrategy] = useState<ExistingValueConversionStrategy>('convert_display');

  // 同步外部传入的最新配置
  useEffect(() => {
    if (isOpen) {
      setSelectedMode(config.mode);
      setMmDecimals(config.mmDecimals);
      setInchDecimals(config.inchDecimals);
    }
  }, [isOpen, config]);

  // 快捷换算试算器状态
  const [calcInput, setCalcInput] = useState('1');
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentOption = UNIT_MODE_OPTIONS.find((opt) => opt.mode === selectedMode) || UNIT_MODE_OPTIONS[0];

  const handleSave = () => {
    const { inputUnit, displayUnit } = getUnitsFromMode(selectedMode);
    onSaveConfig(
      {
        mode: selectedMode,
        inputUnit,
        displayUnit,
        mmDecimals,
        inchDecimals,
      },
      strategy
    );
    onClose();
  };

  // 试算器计算
  const testNumber = parseNumberOrFraction(calcInput);
  const testConverted = testNumber !== null
    ? convertLength(testNumber, currentOption.inputUnit, currentOption.displayUnit)
    : null;

  const handleBatchConvert = () => {
    if (!onBatchConvertCurrentTable) return;
    onBatchConvertCurrentTable(currentOption.inputUnit, currentOption.displayUnit);
    setBatchSuccessMsg('当前表格数值已成功换算并更新！');
    setTimeout(() => setBatchSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-[#1f2933] border border-[#3e4c59] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#323f4b] bg-[#161e26] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="text-[#5ec864]" size={18} />
            <h2 className="text-sm font-bold text-[#f5f7fa]">公制 / 英制单位设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9aa5b1] hover:text-[#f5f7fa] hover:bg-[#323f4b] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Section 1: Mode Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#cbd2d9] tracking-wide flex items-center gap-1.5">
                <span>选择单位换算模式</span>
                <span className="text-[10px] text-[#7b8794] font-normal">(支持输入与显示单位解耦)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {UNIT_MODE_OPTIONS.map((opt) => {
                const active = selectedMode === opt.mode;
                return (
                  <div
                    key={opt.mode}
                    onClick={() => setSelectedMode(opt.mode)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      active
                        ? 'bg-[#3aad42]/15 border-[#5ec864] shadow-[0_0_0_1px_rgba(94,200,100,0.3)]'
                        : 'bg-[#161e26] border-[#323f4b] hover:border-[#52606d] hover:bg-[#26313c]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className={`text-xs font-bold ${active ? 'text-[#5ec864]' : 'text-[#f5f7fa]'}`}>
                          {opt.title}
                        </span>
                        {active && <Check size={14} className="text-[#5ec864] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#7b8794] leading-relaxed line-clamp-2">
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#323f4b]/60 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#9aa5b1] bg-[#1f2933] px-1.5 py-0.5 rounded border border-[#3e4c59]">
                        输入: {opt.inputUnitName}
                      </span>
                      <ArrowRight size={11} className="text-[#5ec864]" />
                      <span className="text-[#5ec864] bg-[#1f2933] px-1.5 py-0.5 rounded border border-[#3aad42]/40 font-bold">
                        显示: {opt.displayUnitName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Precision Settings */}
          <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3 space-y-2">
            <h3 className="text-xs font-bold text-[#cbd2d9] flex items-center gap-1.5">
              <span>数值小数位精度控制</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between bg-[#1f2933] px-3 py-1.5 rounded-lg border border-[#3e4c59]">
                <span className="text-xs text-[#9aa5b1]">毫米 (mm) 小数位:</span>
                <select
                  value={mmDecimals}
                  onChange={(e) => setMmDecimals(Number(e.target.value))}
                  className="bg-[#161e26] border border-[#52606d] text-xs text-[#f5f7fa] font-mono rounded px-2 py-1 outline-none"
                >
                  <option value={2}>2 位 (0.01)</option>
                  <option value={3}>3 位 (0.001 丝级)</option>
                  <option value={4}>4 位 (0.0001 常用)</option>
                  <option value={5}>5 位 (0.00001)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-[#1f2933] px-3 py-1.5 rounded-lg border border-[#3e4c59]">
                <span className="text-xs text-[#9aa5b1]">英寸 (inch) 小数位:</span>
                <select
                  value={inchDecimals}
                  onChange={(e) => setInchDecimals(Number(e.target.value))}
                  className="bg-[#161e26] border border-[#52606d] text-xs text-[#f5f7fa] font-mono rounded px-2 py-1 outline-none"
                >
                  <option value={3}>3 位 (0.001″)</option>
                  <option value={4}>4 位 (0.0001″ 常用)</option>
                  <option value={5}>5 位 (0.00001″)</option>
                  <option value={6}>6 位 (0.000001″)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Existing Values Conversion Strategy */}
          <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#cbd2d9] flex items-center gap-1.5">
                <RefreshCw size={13} className="text-[#5ec864]" />
                <span>表格已有数值同步换算策略</span>
              </h3>
              <span className="text-[10px] text-[#5ec864] bg-[#3aad42]/15 px-1.5 py-0.5 rounded border border-[#3aad42]/30">保存时自动执行</span>
            </div>

            <div className="space-y-1.5">
              {[
                {
                  key: 'convert_display',
                  title: '自动等值物理换算 (推荐)',
                  desc: '保持实际物理尺寸不变。若显示单位改变（如 mm ↔ inch），数值自动换算并应用对应精度。',
                },
                {
                  key: 'recalc_from_input',
                  title: `视作【${currentOption.inputUnitName}】重新换算`,
                  desc: `将现有数值视作以【${currentOption.inputUnitName}】输入，重新换算为显示单位【${currentOption.displayUnitName}】。`,
                },
                {
                  key: 'keep_raw',
                  title: '保持当前数值不变',
                  desc: '仅更新单位模式与后续输入规则，表格中现有数值字面量保持原状。',
                },
              ].map((item) => {
                const isSelected = strategy === item.key;
                return (
                  <label
                    key={item.key}
                    onClick={() => setStrategy(item.key as ExistingValueConversionStrategy)}
                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1f2933] border-[#5ec864] text-[#f5f7fa]'
                        : 'bg-[#161e26] border-[#323f4b] text-[#9aa5b1] hover:bg-[#1f2933]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conversion_strategy"
                      checked={isSelected}
                      onChange={() => setStrategy(item.key as ExistingValueConversionStrategy)}
                      className="mt-0.5 text-[#3aad42] focus:ring-0 accent-[#3aad42]"
                    />
                    <div className="text-[11px] leading-tight">
                      <div className={`font-bold ${isSelected ? 'text-[#5ec864]' : 'text-[#cbd2d9]'}`}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#7b8794] mt-0.5">{item.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Live Conversion Test Tool */}
          <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#cbd2d9] flex items-center gap-1.5">
                <Calculator size={13} className="text-[#5ec864]" />
                <span>实时单位换算试算器</span>
              </h3>
              <span className="text-[10px] text-[#7b8794]">1 inch = 25.4 mm</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                  placeholder={`输入${currentOption.inputUnitName}`}
                  className="w-full bg-[#1f2933] border border-[#3e4c59] focus:border-[#3aad42] rounded-lg px-3 py-1 text-xs text-[#f5f7fa] font-mono outline-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7b8794] font-mono">
                  {currentOption.inputUnit}
                </span>
              </div>

              <ArrowRight size={14} className="text-[#5ec864] shrink-0" />

              <div className="flex-1 bg-[#1f2933] border border-[#3aad42]/40 rounded-lg px-3 py-1 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#5ec864]">
                  {testConverted !== null
                    ? formatLengthValue(
                        testConverted,
                        currentOption.displayUnit,
                        currentOption.displayUnit === 'mm' ? mmDecimals : inchDecimals
                      )
                    : '--'}
                </span>
                <span className="text-[10px] text-[#7b8794] font-mono">
                  {currentOption.displayUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Batch convert existing table items manually if needed */}
          {onBatchConvertCurrentTable && currentOption.inputUnit !== currentOption.displayUnit && (
            <div className="bg-[#161e26]/60 border border-[#323f4b] rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-[#9aa5b1] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#9aa5b1]">
                  <p className="font-semibold text-[#cbd2d9]">立即换算当前表格</p>
                  <p className="text-[10px] text-[#7b8794]">
                    一键从【{currentOption.inputUnit}】换算为【{currentOption.displayUnit}】
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBatchConvert}
                className="px-2.5 py-1 rounded-lg bg-[#323f4b] hover:bg-[#3e4c59] text-xs text-[#cbd2d9] font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <RefreshCw size={11} />
                <span>立即换算</span>
              </button>
            </div>
          )}

          {batchSuccessMsg && (
            <div className="text-center text-xs text-[#5ec864] font-medium animate-fade-in bg-[#3aad42]/10 py-1.5 rounded-lg border border-[#3aad42]/30">
              {batchSuccessMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#323f4b] bg-[#161e26] flex items-center justify-between">
          <div className="text-[11px] text-[#7b8794]">
            当前模式：<span className="text-[#5ec864] font-mono">{currentOption.shortLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-[#9aa5b1] hover:text-[#f5f7fa] hover:bg-[#323f4b] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#3aad42] hover:bg-[#5ec864] text-[#0a150c] text-xs font-bold transition-all shadow-sm"
            >
              保存并应用换算
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

