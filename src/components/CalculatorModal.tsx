import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRightLeft, BookOpen, Check, AlertCircle, RefreshCw, Scale } from 'lucide-react';
import { TableItem, ToleranceInputState, ToleranceSelection } from '../types/table';
import { FreeToleranceGrade } from '../types/freeTolerance';
import { UnitConfig } from '../types/unit';
import { FREE_TOLERANCE_GRADES, LINEAR_TOLERANCE_TABLE, lookupFreeTolerance } from '../constants/freeTolerance';
import { lookupToleranceZone, formatSignedDeviation } from '../utils/fitTolerance';
import { evaluateExpression } from '../utils/expression';
import { trimN } from '../utils/math';
import { convertLength, formatLengthValue, parseNumberOrFraction } from '../utils/unit';

interface CalculatorModalProps {
  isOpen: boolean;
  item: TableItem | null;
  initialMode: 'tolerance' | 'expression';
  unitConfig: UnitConfig;
  onClose: () => void;
  onConfirm: (result: {
    value: string;
    source: 'tolerance' | 'expression';
    toleranceInput?: ToleranceInputState;
    expression?: string;
    rawInput?: string;
    rawUnit?: 'mm' | 'inch';
  }) => void;
  onClearValue: () => void;
  onOpenFitModal?: (nominalSize?: string) => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  item,
  initialMode,
  unitConfig,
  onClose,
  onConfirm,
  onClearValue,
  onOpenFitModal,
}) => {
  const [mode, setMode] = useState<'tolerance' | 'expression'>(initialMode);

  // Tolerance state
  const [nominal, setNominal] = useState('0');
  const [upper, setUpper] = useState('0');
  const [lower, setLower] = useState('0');
  const [selectedPreset, setSelectedPreset] = useState<ToleranceSelection>('middle');
  const [freeGrade, setFreeGrade] = useState<FreeToleranceGrade | ''>('');
  const [fitCode, setFitCode] = useState<string>('');
  const [toleranceStandardMode, setToleranceStandardMode] = useState<'fit' | 'free'>('fit');
  const [showToleranceStandardTable, setShowToleranceStandardTable] = useState(false);

  // Expression state
  const [expression, setExpression] = useState('');

  // Track if tabs have been visited
  const [hasVisitedExpression, setHasVisitedExpression] = useState(false);

  // Initialize from item when opened
  useEffect(() => {
    if (!isOpen || !item) return;

    setMode(initialMode);
    setHasVisitedExpression(initialMode === 'expression');

    const ti = item.toleranceInput;
    if (ti) {
      setNominal(ti.nominal || item.value || '0');
      setUpper(ti.upper || '0');
      setLower(ti.lower || '0');
      setSelectedPreset(ti.selected || 'middle');
      setFreeGrade(ti.freeGrade || '');
      setFitCode(ti.fitCode || '');
      if (ti.fitCode) {
        setToleranceStandardMode('fit');
      } else if (ti.freeGrade) {
        setToleranceStandardMode('free');
      }
    } else {
      setNominal(item.value || '0');
      setUpper('0');
      setLower('0');
      setSelectedPreset('middle');
      setFreeGrade('');
      setFitCode('');
    }

    if (item.expression != null) {
      setExpression(item.expression);
    } else if (initialMode === 'expression') {
      setExpression(item.value || '');
    } else {
      setExpression('');
    }
  }, [isOpen, item, initialMode]);

  const displayDecimals = unitConfig.displayUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;
  const inputDecimals = unitConfig.inputUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;

  // Handle Fit Tolerance (ISO 286 / GB 1800)
  const fitToleranceInfo = useMemo(() => {
    if (!fitCode) return null;
    const nomParsed = parseNumberOrFraction(nominal);
    if (nomParsed === null || nomParsed <= 0) return null;
    const nomInMm = unitConfig.inputUnit === 'inch' ? nomParsed * 25.4 : nomParsed;
    const res = lookupToleranceZone(nomInMm, fitCode);
    if (!res) return null;

    const upperInInput = unitConfig.inputUnit === 'inch' ? res.upperDevMm / 25.4 : res.upperDevMm;
    const lowerInInput = unitConfig.inputUnit === 'inch' ? res.lowerDevMm / 25.4 : res.lowerDevMm;

    return {
      code: res.code,
      isHole: res.isHole,
      rangeLabel: res.rangeLabel,
      itGrade: res.itGrade,
      itValueUm: res.itValueUm,
      upperDevUm: res.upperDevUm,
      lowerDevUm: res.lowerDevUm,
      upperDevMm: res.upperDevMm,
      lowerDevMm: res.lowerDevMm,
      upperInInput: trimN(upperInInput, unitConfig.inputUnit === 'inch' ? 5 : 4),
      lowerInInput: trimN(lowerInInput, unitConfig.inputUnit === 'inch' ? 5 : 4),
      nomInMm: trimN(nomInMm, 2),
    };
  }, [nominal, fitCode, unitConfig.inputUnit]);

  const applyFitTolerance = (code: string) => {
    setFitCode(code);
    if (!code) return;
    setFreeGrade(''); // mutual exclusion

    const nomParsed = parseNumberOrFraction(nominal);
    if (nomParsed === null || nomParsed <= 0) return;

    const nomInMm = unitConfig.inputUnit === 'inch' ? nomParsed * 25.4 : nomParsed;
    const res = lookupToleranceZone(nomInMm, code);
    if (res) {
      const u = unitConfig.inputUnit === 'inch' ? trimN(res.upperDevMm / 25.4, 5) : formatSignedDeviation(res.upperDevMm, 4);
      const l = unitConfig.inputUnit === 'inch' ? trimN(res.lowerDevMm / 25.4, 5) : formatSignedDeviation(res.lowerDevMm, 4);
      setUpper(u);
      setLower(l);
    }
  };

  // Handle Free Tolerance Grade change or Nominal change (GB/T 1804 standard is defined in mm)
  const freeToleranceInfo = useMemo(() => {
    if (!freeGrade) return null;
    const nomParsed = parseNumberOrFraction(nominal);
    if (nomParsed === null) return null;

    // GB/T 1804 nominal size range is in mm
    const nomInMm = unitConfig.inputUnit === 'inch' ? nomParsed * 25.4 : nomParsed;
    const lookup = lookupFreeTolerance(nomInMm, freeGrade);
    if (!lookup) return null;

    const devInInputUnit = unitConfig.inputUnit === 'inch' ? lookup.deviation / 25.4 : lookup.deviation;

    return {
      rangeLabel: lookup.rangeLabel,
      deviationMm: lookup.deviation,
      deviationInInput: trimN(devInInputUnit, unitConfig.inputUnit === 'inch' ? 4 : 3),
      nomInMm: trimN(nomInMm, 2),
    };
  }, [nominal, freeGrade, unitConfig.inputUnit]);

  const applyFreeTolerance = (grade: FreeToleranceGrade | '') => {
    setFreeGrade(grade);
    if (!grade) return;
    setFitCode(''); // mutual exclusion

    const nomParsed = parseNumberOrFraction(nominal);
    if (nomParsed === null) return;

    const nomInMm = unitConfig.inputUnit === 'inch' ? nomParsed * 25.4 : nomParsed;
    const res = lookupFreeTolerance(nomInMm, grade);
    if (res) {
      const dev = unitConfig.inputUnit === 'inch' ? trimN(res.deviation / 25.4, 4) : String(res.deviation);
      setUpper(dev);
      setLower(String(-parseFloat(dev)));
    }
  };

  const handleNominalChange = (val: string) => {
    setNominal(val);
    const nomParsed = parseNumberOrFraction(val);
    if (nomParsed !== null && nomParsed > 0) {
      const nomInMm = unitConfig.inputUnit === 'inch' ? nomParsed * 25.4 : nomParsed;
      if (fitCode) {
        const res = lookupToleranceZone(nomInMm, fitCode);
        if (res) {
          const u = unitConfig.inputUnit === 'inch' ? trimN(res.upperDevMm / 25.4, 5) : formatSignedDeviation(res.upperDevMm, 4);
          const l = unitConfig.inputUnit === 'inch' ? trimN(res.lowerDevMm / 25.4, 5) : formatSignedDeviation(res.lowerDevMm, 4);
          setUpper(u);
          setLower(l);
        }
      } else if (freeGrade) {
        const res = lookupFreeTolerance(nomInMm, freeGrade);
        if (res) {
          const dev = unitConfig.inputUnit === 'inch' ? trimN(res.deviation / 25.4, 4) : String(res.deviation);
          setUpper(dev);
          setLower(String(-parseFloat(dev)));
        }
      }
    }
  };

  // Tolerance values calculation (calculating both input unit and target display unit)
  const toleranceResults = useMemo(() => {
    const n = parseNumberOrFraction(nominal) ?? 0;
    const u = parseNumberOrFraction(upper) ?? 0;
    const l = parseNumberOrFraction(lower) ?? 0;

    const inUpper = n + u;
    const inMiddle = n + (u + l) / 2;
    const inLower = n + l;

    const dispUpper = convertLength(inUpper, unitConfig.inputUnit, unitConfig.displayUnit);
    const dispMiddle = convertLength(inMiddle, unitConfig.inputUnit, unitConfig.displayUnit);
    const dispLower = convertLength(inLower, unitConfig.inputUnit, unitConfig.displayUnit);

    return {
      input: {
        upper: trimN(inUpper, inputDecimals),
        middle: trimN(inMiddle, inputDecimals),
        lower: trimN(inLower, inputDecimals),
      },
      display: {
        upper: formatLengthValue(dispUpper, unitConfig.displayUnit, displayDecimals),
        middle: formatLengthValue(dispMiddle, unitConfig.displayUnit, displayDecimals),
        lower: formatLengthValue(dispLower, unitConfig.displayUnit, displayDecimals),
      },
      isConverted: unitConfig.inputUnit !== unitConfig.displayUnit,
    };
  }, [nominal, upper, lower, unitConfig, inputDecimals, displayDecimals]);

  // Expression evaluation
  const expressionResult = useMemo(() => {
    const ev = evaluateExpression(expression);
    if (ev.error) {
      return { error: true, inputDisplay: 'Error', display: 'Error', isConverted: false };
    }
    if (ev.value === 0 && expression.trim() === '') {
      return { error: false, inputDisplay: '0', display: '0', isConverted: false };
    }

    const valInInput = ev.value;
    const targetVal = convertLength(valInInput, unitConfig.inputUnit, unitConfig.displayUnit);

    return {
      error: false,
      inputDisplay: trimN(valInInput, inputDecimals),
      display: formatLengthValue(targetVal, unitConfig.displayUnit, displayDecimals),
      isConverted: unitConfig.inputUnit !== unitConfig.displayUnit,
    };
  }, [expression, unitConfig, inputDecimals, displayDecimals]);

  if (!isOpen) return null;

  // Switch Tab
  const handleSwitchTab = (nextMode: 'tolerance' | 'expression') => {
    if (nextMode === mode) return;

    if (nextMode === 'expression') {
      if (!hasVisitedExpression && expression === '' && (!item || item.expression == null)) {
        setExpression(toleranceResults.input[selectedPreset]);
      }
      setHasVisitedExpression(true);
    } else {
      if (!item?.toleranceInput && !expressionResult.error && expression.trim() !== '') {
        setNominal(expressionResult.inputDisplay);
        setUpper('0');
        setLower('0');
        setFreeGrade('');
      }
    }
    setMode(nextMode);
  };

  // Reuse value handlers
  const handleReuseExpressionInTolerance = () => {
    if (expressionResult.error) return;
    const val = expressionResult.inputDisplay || '0';
    setNominal(val);
    setUpper('0');
    setLower('0');
    setFreeGrade('');
  };

  const handleReuseToleranceInExpression = () => {
    const val = toleranceResults.input[selectedPreset];
    setExpression(val);
  };

  // Expression keypad input
  const handleAppendOperator = (op: string) => {
    setExpression((prev) => prev + op);
  };

  // Apply Confirm
  const handleConfirm = () => {
    if (mode === 'tolerance') {
      const chosenValue = toleranceResults.display[selectedPreset];
      onConfirm({
        value: chosenValue,
        source: 'tolerance',
        toleranceInput: {
          nominal,
          upper,
          lower,
          selected: selectedPreset,
          freeGrade: freeGrade || undefined,
          fitCode: fitCode || undefined,
        },
        expression: hasVisitedExpression && expression ? expression : undefined,
        rawInput: nominal,
        rawUnit: unitConfig.inputUnit,
      });
    } else {
      if (expressionResult.error) return;
      onConfirm({
        value: expressionResult.display,
        source: 'expression',
        expression,
        rawInput: expression,
        rawUnit: unitConfig.inputUnit,
        toleranceInput: {
          nominal,
          upper,
          lower,
          selected: selectedPreset,
          freeGrade: freeGrade || undefined,
        },
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1f2933] border border-[#52606d] rounded-2xl w-full max-w-lg max-h-[94vh] flex flex-col shadow-2xl text-[#cbd2d9] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3e4c59] bg-[#323f4b]/50">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#f5f7fa]">
              {mode === 'tolerance' ? '公差计算器' : '表达式计算器'}
            </h3>
            {item && (
              <span className="text-xs px-2 py-0.5 rounded bg-[#161e26] text-[#9aa5b1] font-mono border border-[#3e4c59]">
                序号 #{item.label}
              </span>
            )}
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#161e26] text-[#5ec864] font-mono border border-[#3aad42]/30 flex items-center gap-1">
              <span>{unitConfig.inputUnit}</span>
              <span className="text-[#9aa5b1]">➔</span>
              <span className="font-bold">{unitConfig.displayUnit}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9aa5b1] hover:text-white p-1 rounded-lg hover:bg-[#3e4c59] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 px-5 pt-3 bg-[#1f2933]">
          <button
            onClick={() => handleSwitchTab('tolerance')}
            className={`flex-1 py-2 rounded-t-xl text-xs font-bold transition-all ${
              mode === 'tolerance'
                ? 'bg-[#26313c] text-[#5ec864] border-t border-x border-[#3e4c59]'
                : 'text-[#9aa5b1] hover:text-[#e4e7eb] hover:bg-[#26313c]/50'
            }`}
          >
            公差与自由公差
          </button>
          <button
            onClick={() => handleSwitchTab('expression')}
            className={`flex-1 py-2 rounded-t-xl text-xs font-bold transition-all ${
              mode === 'expression'
                ? 'bg-[#26313c] text-[#5ec864] border-t border-x border-[#3e4c59]'
                : 'text-[#9aa5b1] hover:text-[#e4e7eb] hover:bg-[#26313c]/50'
            }`}
          >
            数学表达式
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 bg-[#26313c] overflow-y-auto flex-1 border-t border-[#3e4c59]">
          {mode === 'tolerance' ? (
            <div className="space-y-4">
              {/* Nominal Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-[#cbd2d9] flex items-center gap-1.5">
                    <span>名义值 / 基本尺寸 ({unitConfig.inputUnit === 'inch' ? 'inch 英寸' : 'mm 毫米'})</span>
                    <span className="text-[10px] text-[#7b8794]">
                      {unitConfig.inputUnit === 'inch' ? '支持分数如 1/4, 1 1/2' : '理论基本尺寸'}
                    </span>
                  </label>
                  <button
                    onClick={handleReuseExpressionInTolerance}
                    disabled={expressionResult.error || !expression}
                    className="text-[11px] text-[#5ec864] hover:underline disabled:opacity-30 disabled:no-underline flex items-center gap-1"
                    title="将表达式计算的结果作为名义值"
                  >
                    <ArrowRightLeft size={11} />
                    复用表达式值
                  </button>
                </div>
                <input
                  type="text"
                  value={nominal}
                  onChange={(e) => handleNominalChange(e.target.value)}
                  placeholder={unitConfig.inputUnit === 'inch' ? '例如: 1.0 或 1/2' : '0'}
                  className="w-full bg-[#1f2933] border border-[#52606d] focus:border-[#3aad42] rounded-lg px-3 py-2 text-sm text-[#f5f7fa] font-mono outline-none transition-colors"
                />
              </div>

              {/* Tolerance Standards Selector: Fit Tolerance (ISO 286) vs Free Tolerance (GB/T 1804) */}
              <div className="bg-[#1f2933] border border-[#3e4c59] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#323f4b] pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setToleranceStandardMode('fit')}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                        toleranceStandardMode === 'fit'
                          ? 'bg-[#3b82f6] text-white'
                          : 'text-[#9aa5b1] hover:text-[#f5f7fa]'
                      }`}
                      title="ISO 286 / GB 1800 配合公差"
                    >
                      <Scale size={13} />
                      配合公差
                    </button>
                    <button
                      type="button"
                      onClick={() => setToleranceStandardMode('free')}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                        toleranceStandardMode === 'free'
                          ? 'bg-[#3aad42] text-[#0a150c]'
                          : 'text-[#9aa5b1] hover:text-[#f5f7fa]'
                      }`}
                      title="GB/T 1804 自由公差"
                    >
                      <BookOpen size={13} />
                      自由公差
                    </button>
                  </div>

                  {onOpenFitModal && (
                    <button
                      type="button"
                      onClick={() => onOpenFitModal(nominal)}
                      className="text-[11px] text-[#f59e0b] hover:text-[#fbbf24] flex items-center gap-1 font-medium transition-colors"
                      title="打开完整孔轴配合计算与公差带图解"
                    >
                      <span>配合计算</span>
                      <ArrowRightLeft size={11} />
                    </button>
                  )}
                </div>

                {/* Fit Tolerance Panel */}
                {toleranceStandardMode === 'fit' && (
                  <div className="space-y-2.5">
                    {/* Common Hole & Shaft quick chips */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-[#60a5fa] w-12 shrink-0">孔公差:</span>
                        {['H6', 'H7', 'H8', 'H9', 'F8', 'JS7', 'P7'].map((code) => {
                          const active = fitCode === code;
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => applyFitTolerance(code)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                                active
                                  ? 'bg-[#3b82f6] text-white shadow-sm'
                                  : 'bg-[#161e26] text-[#9aa5b1] hover:text-[#f5f7fa] border border-[#3e4c59]'
                              }`}
                            >
                              {code}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-[#fbbf24] w-12 shrink-0">轴公差:</span>
                        {['h6', 'h7', 'g6', 'f7', 'js6', 'k6', 'm6', 'p6'].map((code) => {
                          const active = fitCode === code;
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => applyFitTolerance(code)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                                active
                                  ? 'bg-[#f59e0b] text-[#0a150c] shadow-sm'
                                  : 'bg-[#161e26] text-[#9aa5b1] hover:text-[#f5f7fa] border border-[#3e4c59]'
                              }`}
                            >
                              {code}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom input or clear */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#323f4b]/60">
                      <span className="text-[11px] text-[#7b8794]">自定义:</span>
                      <input
                        type="text"
                        value={fitCode}
                        onChange={(e) => applyFitTolerance(e.target.value)}
                        placeholder="如 H7, g6"
                        className="w-24 bg-[#161e26] border border-[#3e4c59] focus:border-[#3b82f6] rounded px-2 py-1 text-xs text-[#f5f7fa] font-mono font-bold uppercase outline-none"
                      />
                      {fitCode && (
                        <button
                          type="button"
                          onClick={() => applyFitTolerance('')}
                          className="text-[10px] text-[#7b8794] hover:text-red-400"
                        >
                          清除
                        </button>
                      )}
                    </div>

                    {/* Matched Fit Tolerance Info Badge */}
                    {fitCode && (
                      <div className="text-[11px] flex items-center gap-1.5 p-2 rounded-lg bg-[#161e26] border border-[#3e4c59] text-[#cbd2d9]">
                        <Check size={13} className="shrink-0 text-[#60a5fa]" />
                        {fitToleranceInfo ? (
                          <span>
                            已匹配 <strong>{fitToleranceInfo.code}</strong> (尺寸段 {fitToleranceInfo.rangeLabel} mm)：
                            上偏差 <strong>{fitToleranceInfo.upperInInput}</strong>，
                            下偏差 <strong>{fitToleranceInfo.lowerInInput}</strong> ({unitConfig.inputUnit})
                          </span>
                        ) : (
                          <span className="text-[#fbbf24]">
                            未找到代号 "{fitCode}" 在尺寸 {nominal} 下的标准公差，请手动输入。
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Free Tolerance Panel */}
                {toleranceStandardMode === 'free' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#9aa5b1]">自由公差等级 (GB/T 1804):</span>
                      <button
                        type="button"
                        onClick={() => setShowToleranceStandardTable(!showToleranceStandardTable)}
                        className="text-[11px] text-[#60a5fa] hover:underline flex items-center gap-1"
                      >
                        <BookOpen size={12} />
                        {showToleranceStandardTable ? '收起标准表' : '查看标准表'}
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyFreeTolerance('')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          freeGrade === ''
                            ? 'bg-[#323f4b] text-[#f5f7fa] border-[#616e7c]'
                            : 'bg-[#161e26] text-[#7b8794] border-[#3e4c59] hover:text-[#cbd2d9]'
                        }`}
                      >
                        无 / 手动
                      </button>
                      {FREE_TOLERANCE_GRADES.map((g) => {
                        const active = freeGrade === g.grade;
                        return (
                          <button
                            key={g.grade}
                            type="button"
                            onClick={() => applyFreeTolerance(g.grade)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all flex flex-col items-center ${
                              active
                                ? 'bg-[#3aad42] text-[#0a150c] border-[#3aad42] shadow-sm'
                                : 'bg-[#161e26] text-[#9aa5b1] border-[#3e4c59] hover:border-[#52606d] hover:text-[#e4e7eb]'
                            }`}
                          >
                            <span>{g.grade} 级</span>
                            <span className={`text-[9px] ${active ? 'text-[#0a150c]/80' : 'text-[#7b8794]'}`}>
                              {g.nameZh}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {freeGrade && (
                      <div className="text-[11px] flex items-center gap-1.5 pt-1 text-[#5ec864] bg-[#161e26] p-2 rounded-lg border border-[#3e4c59]">
                        <Check size={13} className="shrink-0" />
                        {freeToleranceInfo ? (
                          <span>
                            已匹配 <strong>GB/T 1804-{freeGrade}</strong>
                            {unitConfig.inputUnit === 'inch' && (
                              <span className="text-[#cbd2d9]"> (折合 {freeToleranceInfo.nomInMm} mm)</span>
                            )}
                            ：偏差 <strong>±{freeToleranceInfo.deviationInInput} {unitConfig.inputUnit}</strong>
                            {unitConfig.inputUnit === 'inch' && (
                              <span className="text-[#9aa5b1]"> (标准值 ±{freeToleranceInfo.deviationMm} mm)</span>
                            )}
                            ，已自动换算填入。
                          </span>
                        ) : (
                          <span className="text-[#fbbf24]">
                            名义尺寸 {nominal} 超出 GB/T 1804 标准分段范围 (0.5 ~ 4000 mm)，请手动输入公差。
                          </span>
                        )}
                      </div>
                    )}

                    {showToleranceStandardTable && (
                      <div className="mt-2 text-[11px] bg-[#161e26] border border-[#3e4c59] rounded-lg p-2.5 overflow-x-auto">
                        <div className="font-bold text-[#e4e7eb] mb-1.5">
                          GB/T 1804-2000 线性尺寸极限偏差数值表 (±mm)
                        </div>
                        <table className="w-full text-center border-collapse">
                          <thead>
                            <tr className="border-b border-[#3e4c59] text-[#9aa5b1]">
                              <th className="py-1 px-1 text-left">基本尺寸 (mm)</th>
                              <th className="py-1 px-1">f (精密)</th>
                              <th className="py-1 px-1 text-[#5ec864]">m (中等)</th>
                              <th className="py-1 px-1">c (粗糙)</th>
                              <th className="py-1 px-1">v (最粗)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#3e4c59]/50 font-mono">
                            {LINEAR_TOLERANCE_TABLE.map((row) => (
                              <tr key={row.rangeLabel} className="hover:bg-[#1f2933]">
                                <td className="py-1 px-1 text-left text-[#cbd2d9]">{row.rangeLabel}</td>
                                <td className="py-1 px-1 text-[#9aa5b1]">±{row.deviations.f ?? '-'}</td>
                                <td className="py-1 px-1 text-[#5ec864] font-semibold">±{row.deviations.m ?? '-'}</td>
                                <td className="py-1 px-1 text-[#9aa5b1]">±{row.deviations.c ?? '-'}</td>
                                <td className="py-1 px-1 text-[#9aa5b1]">±{row.deviations.v ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upper & Lower Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#cbd2d9] mb-1.5">
                    上偏差 ({unitConfig.inputUnit})
                  </label>
                  <input
                    type="text"
                    value={upper}
                    onChange={(e) => {
                      setUpper(e.target.value);
                      setFreeGrade(''); // manual override clears free auto tag
                    }}
                    placeholder="+0.00"
                    className="w-full bg-[#1f2933] border border-[#52606d] focus:border-[#3aad42] rounded-lg px-3 py-2 text-sm text-[#f5f7fa] font-mono outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#cbd2d9] mb-1.5">
                    下偏差 ({unitConfig.inputUnit})
                  </label>
                  <input
                    type="text"
                    value={lower}
                    onChange={(e) => {
                      setLower(e.target.value);
                      setFreeGrade(''); // manual override clears free auto tag
                    }}
                    placeholder="-0.00"
                    className="w-full bg-[#1f2933] border border-[#52606d] focus:border-[#3aad42] rounded-lg px-3 py-2 text-sm text-[#f5f7fa] font-mono outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Presets Cards (Upper, Middle, Lower) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9aa5b1]">选择切点计入值 (编程坐标)</span>
                  {toleranceResults.isConverted && (
                    <span className="text-[11px] text-[#5ec864] font-mono flex items-center gap-1">
                      <RefreshCw size={11} />
                      按设置自动换算为 {unitConfig.displayUnit}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Upper preset */}
                  <button
                    type="button"
                    onClick={() => setSelectedPreset('upper')}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      selectedPreset === 'upper'
                        ? 'bg-[#1f2933] border-[#ef4444] shadow-sm'
                        : 'bg-[#1f2933]/60 border-[#3e4c59] hover:border-[#52606d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#ef4444]">上限 (Upper)</span>
                      {selectedPreset === 'upper' && <Check size={13} className="text-[#ef4444]" />}
                    </div>
                    <div className="text-sm font-bold font-mono text-[#f5f7fa]">
                      {toleranceResults.display.upper}
                      <span className="text-[11px] ml-1 font-normal text-[#9aa5b1]">{unitConfig.displayUnit}</span>
                    </div>
                    {toleranceResults.isConverted && (
                      <div className="text-[10px] text-[#7b8794] font-mono pt-1">
                        原值: {toleranceResults.input.upper} {unitConfig.inputUnit}
                      </div>
                    )}
                  </button>

                  {/* Middle preset */}
                  <button
                    type="button"
                    onClick={() => setSelectedPreset('middle')}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      selectedPreset === 'middle'
                        ? 'bg-[#1f2933] border-[#10b981] shadow-sm'
                        : 'bg-[#1f2933]/60 border-[#3e4c59] hover:border-[#52606d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#10b981]">中限 (Middle 推荐)</span>
                      {selectedPreset === 'middle' && <Check size={13} className="text-[#10b981]" />}
                    </div>
                    <div className="text-sm font-bold font-mono text-[#f5f7fa]">
                      {toleranceResults.display.middle}
                      <span className="text-[11px] ml-1 font-normal text-[#9aa5b1]">{unitConfig.displayUnit}</span>
                    </div>
                    {toleranceResults.isConverted && (
                      <div className="text-[10px] text-[#7b8794] font-mono pt-1">
                        原值: {toleranceResults.input.middle} {unitConfig.inputUnit}
                      </div>
                    )}
                  </button>

                  {/* Lower preset */}
                  <button
                    type="button"
                    onClick={() => setSelectedPreset('lower')}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      selectedPreset === 'lower'
                        ? 'bg-[#1f2933] border-[#60a5fa] shadow-sm'
                        : 'bg-[#1f2933]/60 border-[#3e4c59] hover:border-[#52606d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#60a5fa]">下限 (Lower)</span>
                      {selectedPreset === 'lower' && <Check size={13} className="text-[#60a5fa]" />}
                    </div>
                    <div className="text-sm font-bold font-mono text-[#f5f7fa]">
                      {toleranceResults.display.lower}
                      <span className="text-[11px] ml-1 font-normal text-[#9aa5b1]">{unitConfig.displayUnit}</span>
                    </div>
                    {toleranceResults.isConverted && (
                      <div className="text-[10px] text-[#7b8794] font-mono pt-1">
                        原值: {toleranceResults.input.lower} {unitConfig.inputUnit}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Expression Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-[#cbd2d9]">
                    数学表达式 ({unitConfig.inputUnit === 'inch' ? 'inch 英寸' : 'mm 毫米'})
                  </label>
                  <button
                    onClick={handleReuseToleranceInExpression}
                    className="text-[11px] text-[#5ec864] hover:underline flex items-center gap-1"
                  >
                    <ArrowRightLeft size={11} />
                    复用公差值 ({toleranceResults.input[selectedPreset]})
                  </button>
                </div>
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder={unitConfig.inputUnit === 'inch' ? '例如: 1/4 + 1/8 或 1.25 * 2' : '例如: 25.4 + 1.25 * 2'}
                  className="w-full bg-[#1f2933] border border-[#52606d] focus:border-[#3aad42] rounded-lg px-3 py-2 text-sm text-[#f5f7fa] font-mono outline-none transition-colors"
                />
              </div>

              {/* Evaluation Result */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  expressionResult.error
                    ? 'bg-red-950/30 border-red-500/40 text-red-400'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                }`}
              >
                <div>
                  <span className="text-[11px] text-[#9aa5b1] block">
                    计算结果 ({unitConfig.displayUnit === 'inch' ? 'inch 英寸' : 'mm 毫米'})
                  </span>
                  <div className="text-xl font-bold font-mono">
                    {expressionResult.display} {unitConfig.displayUnit}
                  </div>
                  {expressionResult.isConverted && !expressionResult.error && (
                    <div className="text-xs text-[#9aa5b1] font-mono mt-0.5">
                      输入原值: {expressionResult.inputDisplay} {unitConfig.inputUnit}
                    </div>
                  )}
                </div>
                {expressionResult.error && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle size={15} />
                    表达式语法错误
                  </div>
                )}
              </div>

              {/* Keypad */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] text-[#7b8794]">快捷运算符</span>
                <div className="grid grid-cols-6 gap-2">
                  {['+', '-', '*', '/', '(', ')'].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => handleAppendOperator(op)}
                      className="py-2.5 rounded-lg bg-[#1f2933] hover:bg-[#323f4b] border border-[#52606d] text-[#e4e7eb] font-mono font-bold text-base transition-colors"
                    >
                      {op}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setExpression('')}
                  className="w-full py-1.5 rounded-lg bg-[#1f2933] hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-[#52606d] text-xs font-semibold transition-colors mt-2"
                >
                  清空表达式
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#3e4c59] bg-[#1f2933] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#26313c] hover:bg-[#323f4b] border border-[#52606d] text-[#cbd2d9] text-xs font-semibold transition-colors"
          >
            取消
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClearValue();
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
            >
              清空数值
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={mode === 'expression' && expressionResult.error}
              className="px-5 py-2 rounded-lg bg-[#3aad42] hover:bg-[#5ec864] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a150c] font-bold text-xs transition-colors shadow"
            >
              确定填入 ({unitConfig.displayUnit})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
