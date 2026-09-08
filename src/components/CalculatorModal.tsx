import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRightLeft, BookOpen, Check, AlertCircle } from 'lucide-react';
import { TableItem, ToleranceInputState, ToleranceSelection } from '../types/table';
import { FreeToleranceGrade } from '../types/freeTolerance';
import { FREE_TOLERANCE_GRADES, LINEAR_TOLERANCE_TABLE, lookupFreeTolerance } from '../constants/freeTolerance';
import { evaluateExpression } from '../utils/expression';
import { trimN } from '../utils/math';

interface CalculatorModalProps {
  isOpen: boolean;
  item: TableItem | null;
  initialMode: 'tolerance' | 'expression';
  onClose: () => void;
  onConfirm: (result: {
    value: string;
    source: 'tolerance' | 'expression';
    toleranceInput?: ToleranceInputState;
    expression?: string;
  }) => void;
  onClearValue: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  item,
  initialMode,
  onClose,
  onConfirm,
  onClearValue,
}) => {
  const [mode, setMode] = useState<'tolerance' | 'expression'>(initialMode);

  // Tolerance state
  const [nominal, setNominal] = useState('0');
  const [upper, setUpper] = useState('0');
  const [lower, setLower] = useState('0');
  const [selectedPreset, setSelectedPreset] = useState<ToleranceSelection>('middle');
  const [freeGrade, setFreeGrade] = useState<FreeToleranceGrade | ''>('');
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
    } else {
      setNominal(item.value || '0');
      setUpper('0');
      setLower('0');
      setSelectedPreset('middle');
      setFreeGrade('');
    }

    if (item.expression != null) {
      setExpression(item.expression);
    } else if (initialMode === 'expression') {
      setExpression(item.value || '');
    } else {
      setExpression('');
    }
  }, [isOpen, item, initialMode]);

  // Handle Free Tolerance Grade change or Nominal change
  const freeToleranceInfo = useMemo(() => {
    if (!freeGrade) return null;
    const nom = parseFloat(nominal);
    if (isNaN(nom)) return null;
    return lookupFreeTolerance(nom, freeGrade);
  }, [nominal, freeGrade]);

  const applyFreeTolerance = (grade: FreeToleranceGrade | '') => {
    setFreeGrade(grade);
    if (!grade) return;

    const nom = parseFloat(nominal);
    if (isNaN(nom)) return;

    const res = lookupFreeTolerance(nom, grade);
    if (res) {
      setUpper(String(res.deviation));
      setLower(String(-res.deviation));
    }
  };

  const handleNominalChange = (val: string) => {
    setNominal(val);
    if (freeGrade) {
      const nom = parseFloat(val);
      if (!isNaN(nom)) {
        const res = lookupFreeTolerance(nom, freeGrade);
        if (res) {
          setUpper(String(res.deviation));
          setLower(String(-res.deviation));
        }
      }
    }
  };

  // Tolerance values calculation
  const toleranceResults = useMemo(() => {
    const n = parseFloat(nominal) || 0;
    const u = parseFloat(upper) || 0;
    const l = parseFloat(lower) || 0;

    return {
      upper: trimN(n + u, 4),
      middle: trimN(n + (u + l) / 2, 4),
      lower: trimN(n + l, 4),
    };
  }, [nominal, upper, lower]);

  // Expression evaluation
  const expressionResult = useMemo(() => {
    const ev = evaluateExpression(expression);
    if (ev.error) {
      return { error: true, display: 'Error' };
    }
    if (ev.value === 0 && expression.trim() === '') {
      return { error: false, display: '0' };
    }
    return {
      error: false,
      display: String(parseFloat(ev.value.toFixed(6))),
    };
  }, [expression]);

  if (!isOpen) return null;

  // Switch Tab
  const handleSwitchTab = (nextMode: 'tolerance' | 'expression') => {
    if (nextMode === mode) return;

    if (nextMode === 'expression') {
      if (!hasVisitedExpression && expression === '' && (!item || item.expression == null)) {
        setExpression(toleranceResults[selectedPreset]);
      }
      setHasVisitedExpression(true);
    } else {
      if (!item?.toleranceInput && !expressionResult.error && expression.trim() !== '') {
        setNominal(expressionResult.display);
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
    const val = expressionResult.display || '0';
    setNominal(val);
    setUpper('0');
    setLower('0');
    setFreeGrade('');
  };

  const handleReuseToleranceInExpression = () => {
    const val = toleranceResults[selectedPreset];
    setExpression(val);
  };

  // Expression keypad input
  const handleAppendOperator = (op: string) => {
    setExpression((prev) => prev + op);
  };

  // Apply Confirm
  const handleConfirm = () => {
    if (mode === 'tolerance') {
      const chosenValue = toleranceResults[selectedPreset];
      onConfirm({
        value: chosenValue,
        source: 'tolerance',
        toleranceInput: {
          nominal,
          upper,
          lower,
          selected: selectedPreset,
          freeGrade: freeGrade || undefined,
        },
        expression: hasVisitedExpression && expression ? expression : undefined,
      });
    } else {
      if (expressionResult.error) return;
      onConfirm({
        value: expressionResult.display,
        source: 'expression',
        expression,
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
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#f5f7fa]">
              {mode === 'tolerance' ? '公差计算器' : '表达式计算器'}
            </h3>
            {item && (
              <span className="text-xs px-2 py-0.5 rounded bg-[#161e26] text-[#9aa5b1] font-mono border border-[#3e4c59]">
                序号 #{item.label}
              </span>
            )}
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
            公差输入与自由公差
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
                    <span>名义值 (Nominal mm)</span>
                    <span className="text-[10px] text-[#7b8794]">零件理论基本尺寸</span>
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
                  type="number"
                  step="any"
                  value={nominal}
                  onChange={(e) => handleNominalChange(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#1f2933] border border-[#52606d] focus:border-[#3aad42] rounded-lg px-3 py-2 text-sm text-[#f5f7fa] font-mono outline-none transition-colors"
                />
              </div>

              {/* Feature 1: Free Tolerance Grade (自由公差等级) selector */}
              <div className="bg-[#1f2933] border border-[#3e4c59] rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#e4e7eb]">自由公差等级 (GB/T 1804)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#323f4b] text-[#9aa5b1]">
                      自动填入上下限
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowToleranceStandardTable(!showToleranceStandardTable)}
                    className="text-[11px] text-[#60a5fa] hover:underline flex items-center gap-1"
                  >
                    <BookOpen size={12} />
                    {showToleranceStandardTable ? '收起标准表' : '查看标准表'}
                  </button>
                </div>

                {/* Free Tolerance Buttons */}
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

                {/* Informative helper badge */}
                {freeGrade && (
                  <div className="text-[11px] flex items-center gap-1.5 pt-1 text-[#5ec864] bg-[#161e26] p-2 rounded-lg border border-[#3e4c59]">
                    <Check size={13} className="shrink-0" />
                    {freeToleranceInfo ? (
                      <span>
                        已匹配 <strong>GB/T 1804-{freeGrade}</strong> (尺寸分段 {freeToleranceInfo.rangeLabel} mm)：
                        偏差 <strong>±{freeToleranceInfo.deviation} mm</strong>，已自动填入上、下公差。
                      </span>
                    ) : (
                      <span className="text-[#fbbf24]">
                        名义尺寸 {nominal} 超出 GB/T 1804 标准分段范围 (0.5 ~ 4000 mm)，请手动输入公差。
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsible reference table for GB/T 1804 */}
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

              {/* Upper & Lower Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#cbd2d9] mb-1.5">上公差 (Upper mm)</label>
                  <input
                    type="number"
                    step="any"
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
                  <label className="block text-xs font-medium text-[#cbd2d9] mb-1.5">下公差 (Lower mm)</label>
                  <input
                    type="number"
                    step="any"
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
                <span className="text-xs font-semibold text-[#9aa5b1] block">选择切点计入值 (编程坐标)</span>
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
                    <div className="text-sm font-bold font-mono text-[#f5f7fa]">{toleranceResults.upper}</div>
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
                    <div className="text-sm font-bold font-mono text-[#f5f7fa]">{toleranceResults.middle}</div>
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
                    <div className="text-sm font-bold font-mono text-[#f5f7fa]">{toleranceResults.lower}</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Expression Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-[#cbd2d9]">数学表达式</label>
                  <button
                    onClick={handleReuseToleranceInExpression}
                    className="text-[11px] text-[#5ec864] hover:underline flex items-center gap-1"
                  >
                    <ArrowRightLeft size={11} />
                    复用公差值 ({toleranceResults[selectedPreset]})
                  </button>
                </div>
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="例如: 25.4 + 1.25 * 2"
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
                  <span className="text-[11px] text-[#9aa5b1] block">计算结果</span>
                  <div className="text-xl font-bold font-mono">
                    {expressionResult.display}
                  </div>
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
              确定填入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
