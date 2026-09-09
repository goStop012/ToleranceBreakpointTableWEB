import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  ArrowRightLeft,
  Check,
  Info,
  Sliders,
  Copy,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { UnitConfig } from '../types/unit';
import {
  COMMON_HOLE_CODES,
  COMMON_SHAFT_CODES,
  STANDARD_FIT_PRESETS,
  SIZE_STEPS,
} from '../constants/fitTolerance';
import {
  calculateFitPair,
  lookupToleranceZone,
  formatSignedDeviation,
  findSizeStepIndex,
} from '../utils/fitTolerance';
import { trimN } from '../utils/math';
import { parseNumberOrFraction } from '../utils/unit';

interface FitToleranceModalProps {
  isOpen: boolean;
  unitConfig: UnitConfig;
  initialSize?: string;
  onClose: () => void;
  onApplyTolerance?: (result: {
    nominal: string;
    upper: string;
    lower: string;
    fitCode: string;
  }) => void;
}

export const FitToleranceModal: React.FC<FitToleranceModalProps> = ({
  isOpen,
  unitConfig,
  initialSize,
  onClose,
  onApplyTolerance,
}) => {
  const [basicSizeStr, setBasicSizeStr] = useState<string>('20');
  const [holeCode, setHoleCode] = useState<string>('H7');
  const [shaftCode, setShaftCode] = useState<string>('g6');
  const [categoryFilter, setCategoryFilter] = useState<'全部' | '间隙' | '过渡' | '过盈' | '基轴制'>('全部');
  const [activePresetId, setActivePresetId] = useState<string>('H7_g6');
  const [copyNotification, setCopyNotification] = useState<string>('');

  // Sync initial size if provided
  React.useEffect(() => {
    if (isOpen) {
      if (initialSize && !isNaN(parseFloat(initialSize)) && parseFloat(initialSize) > 0) {
        setBasicSizeStr(initialSize);
      }
    }
  }, [isOpen, initialSize]);

  // Convert input size to mm for calculation (GB/ISO standards define sizes in mm)
  const basicSizeParsed = useMemo(() => {
    const val = parseNumberOrFraction(basicSizeStr);
    return val !== null && val > 0 ? val : null;
  }, [basicSizeStr]);

  const basicSizeMm = useMemo(() => {
    if (basicSizeParsed === null) return 20;
    return unitConfig.inputUnit === 'inch' ? basicSizeParsed * 25.4 : basicSizeParsed;
  }, [basicSizeParsed, unitConfig.inputUnit]);

  // Step index
  const stepIdx = useMemo(() => findSizeStepIndex(basicSizeMm), [basicSizeMm]);
  const isOutOfRange = stepIdx === -1;

  // Calculation result
  const fitResult = useMemo(() => {
    if (isOutOfRange) return null;
    return calculateFitPair(basicSizeMm, holeCode, shaftCode, unitConfig.inputUnit);
  }, [basicSizeMm, holeCode, shaftCode, unitConfig.inputUnit, isOutOfRange]);

  // Active preset details
  const activePreset = useMemo(() => {
    return STANDARD_FIT_PRESETS.find((p) => p.holeCode === holeCode && p.shaftCode === shaftCode);
  }, [holeCode, shaftCode]);

  // Filter presets
  const filteredPresets = useMemo(() => {
    if (categoryFilter === '全部') return STANDARD_FIT_PRESETS;
    if (categoryFilter === '基轴制') return STANDARD_FIT_PRESETS.filter((p) => p.system === 'shaft');
    return STANDARD_FIT_PRESETS.filter((p) => p.category === categoryFilter && p.system === 'hole');
  }, [categoryFilter]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const found = STANDARD_FIT_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setActivePresetId(presetId);
      setHoleCode(found.holeCode);
      setShaftCode(found.shaftCode);
    }
  };

  const handleApplyHole = () => {
    if (!fitResult || !onApplyTolerance) return;
    const es = unitConfig.inputUnit === 'inch' ? trimN(fitResult.hole.upperDevMm / 25.4, 5) : trimN(fitResult.hole.upperDevMm, 4);
    const ei = unitConfig.inputUnit === 'inch' ? trimN(fitResult.hole.lowerDevMm / 25.4, 5) : trimN(fitResult.hole.lowerDevMm, 4);

    onApplyTolerance({
      nominal: basicSizeStr,
      upper: es,
      lower: ei,
      fitCode: fitResult.hole.code,
    });
    onClose();
  };

  const handleApplyShaft = () => {
    if (!fitResult || !onApplyTolerance) return;
    const es = unitConfig.inputUnit === 'inch' ? trimN(fitResult.shaft.upperDevMm / 25.4, 5) : trimN(fitResult.shaft.upperDevMm, 4);
    const ei = unitConfig.inputUnit === 'inch' ? trimN(fitResult.shaft.lowerDevMm / 25.4, 5) : trimN(fitResult.shaft.lowerDevMm, 4);

    onApplyTolerance({
      nominal: basicSizeStr,
      upper: es,
      lower: ei,
      fitCode: fitResult.shaft.code,
    });
    onClose();
  };

  const handleCopyReport = () => {
    if (!fitResult) return;
    const h = fitResult.hole;
    const s = fitResult.shaft;
    const text = [
      `【ISO 286 / GB 1800 配合计算报告】`,
      `基本尺寸: Φ${basicSizeStr} ${unitConfig.inputUnit} (${trimN(basicSizeMm, 2)} mm)`,
      `配合代号: Φ${basicSizeStr} ${h.code}/${s.code} (${fitResult.fitTypeNameZh})`,
      `---------------------------------`,
      `孔公差带 ${h.code}:`,
      `  偏差: ES=${formatSignedDeviation(h.upperDevMm)} mm, EI=${formatSignedDeviation(h.lowerDevMm)} mm (IT=${h.itValueUm}μm)`,
      `  极限尺寸: Φ${trimN(h.lowerLimitMm, 3)} ~ Φ${trimN(h.upperLimitMm, 3)} mm`,
      `轴公差带 ${s.code}:`,
      `  偏差: es=${formatSignedDeviation(s.upperDevMm)} mm, ei=${formatSignedDeviation(s.lowerDevMm)} mm (IT=${s.itValueUm}μm)`,
      `  极限尺寸: Φ${trimN(s.lowerLimitMm, 3)} ~ Φ${trimN(s.upperLimitMm, 3)} mm`,
      `配合特征:`,
      fitResult.fitType === 'clearance'
        ? `  最大间隙 Xmax = +${fitResult.maxClearanceUm} μm (+${trimN(fitResult.maxClearanceMm || 0, 3)} mm)\n  最小间隙 Xmin = +${fitResult.minClearanceUm} μm (+${trimN(fitResult.minClearanceMm || 0, 3)} mm)`
        : fitResult.fitType === 'interference'
        ? `  最大过盈 Ymax = -${fitResult.maxInterferenceUm} μm (-${trimN(fitResult.maxInterferenceMm || 0, 3)} mm)\n  最小过盈 Ymin = -${fitResult.minInterferenceUm} μm (-${trimN(fitResult.minInterferenceMm || 0, 3)} mm)`
        : `  最大间隙 Xmax = +${fitResult.maxClearanceUm} μm (+${trimN(fitResult.maxClearanceMm || 0, 3)} mm)\n  最大过盈 Ymax = -${fitResult.maxInterferenceUm} μm (-${trimN(fitResult.maxInterferenceMm || 0, 3)} mm)`,
      `  配合公差 Tf = ${fitResult.fitToleranceUm} μm (${trimN(fitResult.fitToleranceMm, 3)} mm)`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopyNotification('配合计算数据已复制至剪贴板');
      setTimeout(() => setCopyNotification(''), 2000);
    });
  };

  // Quick size presets
  const quickSizes = [6, 10, 12, 16, 20, 25, 30, 40, 50, 60, 80, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1f2933] border border-[#3e4c59] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#323f4b] flex items-center justify-between bg-[#161e26]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#f5f7fa] flex items-center gap-2">
                常用配合公差代号速查与自动换算
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#323f4b] text-[#9aa5b1] border border-[#3e4c59]">
                  ISO 286 / GB/T 1800 / GB/T 1801
                </span>
              </h2>
              <p className="text-[11px] text-[#7b8794]">
                支持孔轴配合（间隙/过渡/过盈）自动极限尺寸换算、公差带图解与工程工况推荐
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
          {/* Top Controls: Basic Size & Tolerance Classes */}
          <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Basic size */}
              <div className="sm:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#cbd2d9] flex items-center gap-1">
                    基本尺寸 (公称直径 Φ)
                  </label>
                  <span className="text-[10px] text-[#7b8794]">
                    {unitConfig.inputUnit.toUpperCase()}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={basicSizeStr}
                    onChange={(e) => setBasicSizeStr(e.target.value)}
                    placeholder="输入直径尺寸如 20"
                    className="w-full bg-[#1f2933] border border-[#3e4c59] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-sm text-[#f5f7fa] font-mono outline-none"
                  />
                  {unitConfig.inputUnit === 'inch' && basicSizeParsed && (
                    <span className="absolute right-2.5 top-2.5 text-[11px] text-[#7b8794] font-mono">
                      ≈ {trimN(basicSizeMm, 2)} mm
                    </span>
                  )}
                </div>
              </div>

              {/* Hole code selector */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-[#60a5fa] mb-1">
                  孔公差代号 (Hole / 键入或选择)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={holeCode}
                    onChange={(e) => setHoleCode(e.target.value.toUpperCase())}
                    className="w-20 bg-[#1f2933] border border-[#3e4c59] focus:border-[#3b82f6] rounded-lg px-2.5 py-2 text-sm text-[#f5f7fa] font-mono text-center font-bold outline-none"
                    placeholder="H7"
                  />
                  <select
                    value={holeCode}
                    onChange={(e) => setHoleCode(e.target.value)}
                    className="flex-1 bg-[#1f2933] border border-[#3e4c59] hover:border-[#52606d] rounded-lg px-2 py-2 text-xs text-[#cbd2d9] outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      常用孔公差...
                    </option>
                    {COMMON_HOLE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shaft code selector */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-[#f59e0b] mb-1">
                  轴公差代号 (Shaft / 键入或选择)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={shaftCode}
                    onChange={(e) => setShaftCode(e.target.value.toLowerCase())}
                    className="w-20 bg-[#1f2933] border border-[#3e4c59] focus:border-[#f59e0b] rounded-lg px-2.5 py-2 text-sm text-[#f5f7fa] font-mono text-center font-bold outline-none"
                    placeholder="g6"
                  />
                  <select
                    value={shaftCode}
                    onChange={(e) => setShaftCode(e.target.value)}
                    className="flex-1 bg-[#1f2933] border border-[#3e4c59] hover:border-[#52606d] rounded-lg px-2 py-2 text-xs text-[#cbd2d9] outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      常用轴公差...
                    </option>
                    {COMMON_SHAFT_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick basic size buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-[#7b8794]">
              <span className="shrink-0">常用直径:</span>
              {quickSizes.map((qs) => (
                <button
                  key={qs}
                  type="button"
                  onClick={() => setBasicSizeStr(String(qs))}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    parseFloat(basicSizeStr) === qs
                      ? 'bg-[#3b82f6] text-white font-bold'
                      : 'bg-[#1f2933] text-[#9aa5b1] hover:bg-[#323f4b] hover:text-[#f5f7fa] border border-[#3e4c59]'
                  }`}
                >
                  Φ{qs}
                </button>
              ))}
              {stepIdx !== -1 && (
                <span className="ml-auto text-[11px] text-[#9aa5b1]">
                  标准尺寸段: <strong>{SIZE_STEPS[stepIdx].label} mm</strong>
                </span>
              )}
            </div>
          </div>

          {/* Out of range alert */}
          {isOutOfRange && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
              <Info size={16} className="shrink-0" />
              <span>
                ISO 286 标准尺寸适用范围为 0 ~ 500 mm。当前输入尺寸超出标准范围，请检查输入值。
              </span>
            </div>
          )}

          {/* Fit Calculation Result Card */}
          {fitResult && (
            <div className="space-y-3">
              {/* Fit Type & Combined Result Banner */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  fitResult.fitType === 'clearance'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : fitResult.fitType === 'interference'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base sm:text-lg font-black font-mono tracking-wide text-white">
                      Φ{basicSizeStr} {fitResult.hole.code}/{fitResult.shaft.code}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        fitResult.fitType === 'clearance'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : fitResult.fitType === 'interference'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      }`}
                    >
                      {fitResult.fitTypeNameZh}
                    </span>
                    {activePreset && (
                      <span className="text-xs text-[#cbd2d9] font-medium hidden sm:inline">
                        — {activePreset.shortDesc}
                      </span>
                    )}
                  </div>
                  {activePreset && (
                    <p className="text-xs text-[#9aa5b1] max-w-xl">
                      {activePreset.applicationDesc}
                    </p>
                  )}
                </div>

                {/* Right: Clearance or Interference stats */}
                <div className="flex items-center gap-3 shrink-0 text-xs bg-[#161e26]/80 p-2.5 rounded-lg border border-[#3e4c59]">
                  {fitResult.fitType === 'clearance' && (
                    <>
                      <div>
                        <div className="text-[10px] text-[#7b8794]">最大间隙 Xmax</div>
                        <div className="font-mono font-bold text-emerald-400">
                          +{fitResult.maxClearanceUm} μm
                        </div>
                      </div>
                      <div className="h-6 w-px bg-[#323f4b]" />
                      <div>
                        <div className="text-[10px] text-[#7b8794]">最小间隙 Xmin</div>
                        <div className="font-mono font-bold text-emerald-400">
                          +{fitResult.minClearanceUm} μm
                        </div>
                      </div>
                    </>
                  )}

                  {fitResult.fitType === 'interference' && (
                    <>
                      <div>
                        <div className="text-[10px] text-[#7b8794]">最大过盈 Ymax</div>
                        <div className="font-mono font-bold text-rose-400">
                          -{fitResult.maxInterferenceUm} μm
                        </div>
                      </div>
                      <div className="h-6 w-px bg-[#323f4b]" />
                      <div>
                        <div className="text-[10px] text-[#7b8794]">最小过盈 Ymin</div>
                        <div className="font-mono font-bold text-rose-400">
                          -{fitResult.minInterferenceUm} μm
                        </div>
                      </div>
                    </>
                  )}

                  {fitResult.fitType === 'transition' && (
                    <>
                      <div>
                        <div className="text-[10px] text-[#7b8794]">最大间隙 Xmax</div>
                        <div className="font-mono font-bold text-emerald-400">
                          +{fitResult.maxClearanceUm} μm
                        </div>
                      </div>
                      <div className="h-6 w-px bg-[#323f4b]" />
                      <div>
                        <div className="text-[10px] text-[#7b8794]">最大过盈 Ymax</div>
                        <div className="font-mono font-bold text-rose-400">
                          -{fitResult.maxInterferenceUm} μm
                        </div>
                      </div>
                    </>
                  )}

                  <div className="h-6 w-px bg-[#323f4b]" />
                  <div>
                    <div className="text-[10px] text-[#7b8794]">配合公差 Tf</div>
                    <div className="font-mono font-bold text-[#cbd2d9]">
                      {fitResult.fitToleranceUm} μm
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown: Hole & Shaft Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Hole details */}
                <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#26313c] pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                      <span className="text-xs font-bold text-[#f5f7fa]">
                        孔公差带 ({fitResult.hole.code})
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7b8794] font-mono">
                      标准公差 IT{fitResult.hole.itGrade} = {fitResult.hole.itValueUm} μm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#1f2933] p-2 rounded-lg">
                      <span className="text-[10px] text-[#7b8794] block">上偏差 ES</span>
                      <span className="font-mono font-bold text-[#60a5fa] text-sm">
                        {formatSignedDeviation(fitResult.hole.upperDevMm, 3)} mm
                      </span>
                      <span className="text-[10px] text-[#616e7c] block">
                        ({formatSignedDeviation(fitResult.hole.upperDevUm, 1)} μm)
                      </span>
                    </div>
                    <div className="bg-[#1f2933] p-2 rounded-lg">
                      <span className="text-[10px] text-[#7b8794] block">下偏差 EI</span>
                      <span className="font-mono font-bold text-[#60a5fa] text-sm">
                        {formatSignedDeviation(fitResult.hole.lowerDevMm, 3)} mm
                      </span>
                      <span className="text-[10px] text-[#616e7c] block">
                        ({formatSignedDeviation(fitResult.hole.lowerDevUm, 1)} μm)
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#1f2933] p-2.5 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#7b8794]">最大极限尺寸 (Dmax):</span>
                      <span className="font-mono text-[#f5f7fa] font-bold">
                        Φ{trimN(fitResult.hole.upperLimitMm, 4)} mm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7b8794]">最小极限尺寸 (Dmin):</span>
                      <span className="font-mono text-[#f5f7fa] font-bold">
                        Φ{trimN(fitResult.hole.lowerLimitMm, 4)} mm
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#323f4b]/60">
                      <span className="text-[#7b8794]">中间值 (Dmid):</span>
                      <span className="font-mono text-[#5ec864] font-bold">
                        Φ{trimN(fitResult.hole.middleMm, 4)} mm
                      </span>
                    </div>
                  </div>

                  {onApplyTolerance && (
                    <button
                      type="button"
                      onClick={handleApplyHole}
                      className="w-full py-1.5 bg-[#3b82f6]/20 hover:bg-[#3b82f6] text-[#60a5fa] hover:text-[#0a150c] text-xs font-bold rounded-lg border border-[#3b82f6]/40 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={13} />
                      <span>填入孔公差 ({fitResult.hole.code}) 到当前表格行</span>
                    </button>
                  )}
                </div>

                {/* Shaft details */}
                <div className="bg-[#161e26] border border-[#323f4b] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#26313c] pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                      <span className="text-xs font-bold text-[#f5f7fa]">
                        轴公差带 ({fitResult.shaft.code})
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7b8794] font-mono">
                      标准公差 IT{fitResult.shaft.itGrade} = {fitResult.shaft.itValueUm} μm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#1f2933] p-2 rounded-lg">
                      <span className="text-[10px] text-[#7b8794] block">上偏差 es</span>
                      <span className="font-mono font-bold text-[#fbbf24] text-sm">
                        {formatSignedDeviation(fitResult.shaft.upperDevMm, 3)} mm
                      </span>
                      <span className="text-[10px] text-[#616e7c] block">
                        ({formatSignedDeviation(fitResult.shaft.upperDevUm, 1)} μm)
                      </span>
                    </div>
                    <div className="bg-[#1f2933] p-2 rounded-lg">
                      <span className="text-[10px] text-[#7b8794] block">下偏差 ei</span>
                      <span className="font-mono font-bold text-[#fbbf24] text-sm">
                        {formatSignedDeviation(fitResult.shaft.lowerDevMm, 3)} mm
                      </span>
                      <span className="text-[10px] text-[#616e7c] block">
                        ({formatSignedDeviation(fitResult.shaft.lowerDevUm, 1)} μm)
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#1f2933] p-2.5 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#7b8794]">最大极限尺寸 (dmax):</span>
                      <span className="font-mono text-[#f5f7fa] font-bold">
                        Φ{trimN(fitResult.shaft.upperLimitMm, 4)} mm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7b8794]">最小极限尺寸 (dmin):</span>
                      <span className="font-mono text-[#f5f7fa] font-bold">
                        Φ{trimN(fitResult.shaft.lowerLimitMm, 4)} mm
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#323f4b]/60">
                      <span className="text-[#7b8794]">中间值 (dmid):</span>
                      <span className="font-mono text-[#5ec864] font-bold">
                        Φ{trimN(fitResult.shaft.middleMm, 4)} mm
                      </span>
                    </div>
                  </div>

                  {onApplyTolerance && (
                    <button
                      type="button"
                      onClick={handleApplyShaft}
                      className="w-full py-1.5 bg-[#f59e0b]/20 hover:bg-[#f59e0b] text-[#fbbf24] hover:text-[#0a150c] text-xs font-bold rounded-lg border border-[#f59e0b]/40 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={13} />
                      <span>填入轴公差 ({fitResult.shaft.code}) 到当前表格行</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommended Standard Fit Presets Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders size={14} className="text-[#5ec864]" />
                <span className="text-xs font-bold text-[#cbd2d9]">
                  GB/T 1801 优先与常用配合推荐
                </span>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-[#161e26] p-1 rounded-lg border border-[#323f4b]">
                {(['全部', '间隙', '过渡', '过盈', '基轴制'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#3aad42] text-[#0a150c] font-bold'
                        : 'text-[#9aa5b1] hover:text-[#f5f7fa]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = holeCode === preset.holeCode && shaftCode === preset.shaftCode;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-[#26313c] border-[#3b82f6] shadow-sm'
                        : 'bg-[#161e26] border-[#323f4b] hover:border-[#52606d] hover:bg-[#1f2933]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#f5f7fa] flex items-center gap-1.5">
                        {preset.name}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                        )}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          preset.fitType === 'clearance'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : preset.fitType === 'interference'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {preset.fitTypeNameZh}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-[#cbd2d9] mb-0.5">
                      {preset.shortDesc}
                    </div>
                    <div className="text-[10px] text-[#7b8794] line-clamp-2 leading-relaxed">
                      {preset.applicationDesc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#323f4b] bg-[#161e26] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2933] hover:bg-[#26313c] text-xs text-[#cbd2d9] hover:text-[#f5f7fa] border border-[#3e4c59] transition-colors"
            >
              <Copy size={13} />
              <span>复制计算报告</span>
            </button>
            {copyNotification && (
              <span className="text-xs text-[#5ec864] flex items-center gap-1 animate-fade-in">
                <Check size={13} />
                {copyNotification}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-[#0a150c] bg-[#3aad42] hover:bg-[#5ec864] rounded-lg transition-colors shadow-sm"
          >
            完成速查
          </button>
        </div>
      </div>
    </div>
  );
};
