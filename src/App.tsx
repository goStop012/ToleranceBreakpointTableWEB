/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  InputMode,
  PositionType,
  TableData,
  TableItem,
  ToleranceInputState,
} from './types/table';
import { UnitConfig, ExistingValueConversionStrategy, UnitMode } from './types/unit';
import { PositionOption } from './types/position';
import {
  createDefaultTable,
  exportTableAsJson,
  genId,
  loadInitialState,
  normalizeTables,
  renumberItems,
  saveModeToStorage,
  saveTablesToStorage,
  saveUnitConfigToStorage,
  savePositionsConfig,
} from './utils/storage';
import { convertLength, formatLengthValue, parseNumberOrFraction, convertAllTablesUnit, getUnitsFromMode } from './utils/unit';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { TableView } from './components/TableView';
import { CalculatorModal } from './components/CalculatorModal';
import { GdtSymbolsModal } from './components/GdtSymbolsModal';
import { UnitSettingsModal } from './components/UnitSettingsModal';
import { PositionConfigModal } from './components/PositionConfigModal';
import { TableNameModal, DeleteConfirmModal } from './components/TableManageModals';
import { FitToleranceModal } from './components/FitToleranceModal';

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [tables, setTables] = useState<TableData[]>(initial.tables);
  const [activeTableId, setActiveTableId] = useState<string>(initial.activeTableId);
  const [inputMode, setInputMode] = useState<InputMode>(initial.mode);
  const [unitConfig, setUnitConfig] = useState<UnitConfig>(initial.unitConfig);
  const [positions, setPositions] = useState<PositionOption[]>(initial.positions);

  // Modals state
  const [gdtModalOpen, setGdtModalOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [fitModal, setFitModal] = useState<{
    isOpen: boolean;
    initialSize?: string;
    targetItemId?: string;
  }>({
    isOpen: false,
  });
  const [calcModal, setCalcModal] = useState<{
    isOpen: boolean;
    item: TableItem | null;
    initialMode: 'tolerance' | 'expression';
  }>({
    isOpen: false,
    item: null,
    initialMode: 'tolerance',
  });

  const [tableNameModal, setTableNameModal] = useState<{
    isOpen: boolean;
    kind: 'new' | 'rename';
  }>({
    isOpen: false,
    kind: 'new',
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    targetTable: TableData | null;
  }>({
    isOpen: false,
    targetTable: null,
  });

  const [copyFeedback, setCopyFeedback] = useState('');

  // Active table reference
  const activeTable = useMemo(() => {
    return tables.find((t) => t.id === activeTableId) || tables[0] || createDefaultTable();
  }, [tables, activeTableId]);

  // Persist tables on changes
  useEffect(() => {
    saveTablesToStorage(tables);
  }, [tables]);

  // Persist input mode on changes
  useEffect(() => {
    saveModeToStorage(inputMode);
  }, [inputMode]);

  // Persist unit configuration on changes
  useEffect(() => {
    saveUnitConfigToStorage(unitConfig);
  }, [unitConfig]);

  // Handle applying new unit configuration with conversion strategy
  const handleApplyUnitConfig = (
    newConfig: UnitConfig,
    strategy: ExistingValueConversionStrategy
  ) => {
    const prevConfig = unitConfig;
    setUnitConfig(newConfig);

    // Apply conversion to table items across all tables
    setTables((prevTables) => {
      return convertAllTablesUnit(prevTables, prevConfig, newConfig, strategy);
    });

    const isDisplayUnitChanged = prevConfig.displayUnit !== newConfig.displayUnit;
    if (isDisplayUnitChanged && strategy === 'convert_display') {
      setCopyFeedback(`单位已切换为【${newConfig.displayUnit === 'mm' ? '毫米(mm)' : '英寸(inch)'}】，表格数值已自动换算！`);
    } else if (strategy === 'recalc_from_input') {
      setCopyFeedback(`已按新输入单位【${newConfig.inputUnit === 'mm' ? '毫米' : '英寸'}】重新换算表格数值！`);
    } else {
      setCopyFeedback(`单位设置已保存！`);
    }
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  // Quick unit mode change from Header dropdown
  const handleQuickSwitchUnitMode = (mode: UnitMode) => {
    const { inputUnit, displayUnit } = getUnitsFromMode(mode);
    const newConfig: UnitConfig = {
      ...unitConfig,
      mode,
      inputUnit,
      displayUnit,
    };
    handleApplyUnitConfig(newConfig, 'convert_display');
  };

  // Batch convert values of current active table
  const handleBatchConvertCurrentTable = (fromUnit: 'mm' | 'inch', toUnit: 'mm' | 'inch') => {
    if (fromUnit === toUnit) return;
    const targetDecimals = toUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;

    updateActiveTable((tb) => ({
      ...tb,
      items: tb.items.map((item) => {
        if (!item.value) return item;
        const num = parseNumberOrFraction(item.value);
        if (num === null) return item;

        const converted = convertLength(num, fromUnit, toUnit);
        const formatted = formatLengthValue(converted, toUnit, targetDecimals);

        return {
          ...item,
          value: formatted,
          rawInput: item.rawInput || item.value,
          rawUnit: fromUnit,
        };
      }),
    }));

    setCopyFeedback(`当前表数值已从【${fromUnit}】换算为【${toUnit}】！`);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  // Save positions configuration
  const handleSavePositions = (newPositions: PositionOption[]) => {
    setPositions(newPositions);
    savePositionsConfig(newPositions);
    setCopyFeedback('位置标签下拉配置已更新！');
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  // Helper to mutate active table
  const updateActiveTable = useCallback(
    (updater: (tb: TableData) => TableData) => {
      setTables((prev) =>
        prev.map((t) => (t.id === activeTableId ? updater(t) : t))
      );
    },
    [activeTableId]
  );

  // Handlers for Row items
  const handleToggleStar = (id: string) => {
    updateActiveTable((tb) => ({
      ...tb,
      items: tb.items.map((it) =>
        it.id === id ? { ...it, starred: !it.starred } : it
      ),
    }));
  };

  const handlePositionChange = (id: string, position: PositionType) => {
    updateActiveTable((tb) => ({
      ...tb,
      items: tb.items.map((it) =>
        it.id === id ? { ...it, position: position || undefined } : it
      ),
    }));
  };

  const handleValueChange = (
    id: string,
    value: string,
    rawInput?: string,
    rawUnit?: 'mm' | 'inch'
  ) => {
    updateActiveTable((tb) => ({
      ...tb,
      items: tb.items.map((it) =>
        it.id === id
          ? {
              ...it,
              value,
              rawInput: rawInput ?? value,
              rawUnit: rawUnit ?? unitConfig.inputUnit,
              source: undefined,
              expression: undefined,
              toleranceInput: undefined,
            }
          : it
      ),
    }));
  };

  const handleOpenCalculator = (item: TableItem) => {
    const mode = item.source || (inputMode === 'expression' ? 'expression' : 'tolerance');
    setCalcModal({
      isOpen: true,
      item,
      initialMode: mode,
    });
  };

  const handleConfirmCalculator = (result: {
    value: string;
    source: 'tolerance' | 'expression';
    toleranceInput?: ToleranceInputState;
    expression?: string;
    rawInput?: string;
    rawUnit?: 'mm' | 'inch';
  }) => {
    if (!calcModal.item) return;
    const itemId = calcModal.item.id;

    updateActiveTable((tb) => ({
      ...tb,
      items: tb.items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              value: result.value,
              source: result.source,
              toleranceInput: result.toleranceInput,
              expression: result.expression,
              rawInput: result.rawInput,
              rawUnit: result.rawUnit,
            }
          : it
      ),
    }));
  };

  const handleClearValue = () => {
    if (!calcModal.item) return;
    const itemId = calcModal.item.id;

    updateActiveTable((tb) => ({
      ...tb,
      items: tb.items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              value: '',
              source: undefined,
              expression: undefined,
              toleranceInput: undefined,
            }
          : it
      ),
    }));
  };

  const handleAddAfter = (id: string) => {
    updateActiveTable((tb) => {
      const idx = tb.items.findIndex((it) => it.id === id);
      if (idx === -1) return tb;
      const ref = tb.items[idx];
      const newItems = [...tb.items];
      newItems.splice(idx + 1, 0, {
        id: genId(),
        label: '',
        value: '',
        groupId: ref.groupId,
      });
      return {
        ...tb,
        items: renumberItems(newItems),
      };
    });
  };

  const handleDeleteItem = (id: string) => {
    updateActiveTable((tb) => {
      let newItems = tb.items.filter((it) => it.id !== id);
      if (!newItems.length) {
        newItems = [{ id: genId(), label: '1', value: '' }];
      }
      return {
        ...tb,
        items: renumberItems(newItems),
      };
    });
  };

  // Group handlers
  const handleToggleGroupCollapse = (groupId: string) => {
    updateActiveTable((tb) => {
      const coll = tb.collapsedGroups || [];
      const isColl = coll.includes(groupId);
      return {
        ...tb,
        collapsedGroups: isColl ? coll.filter((x) => x !== groupId) : [...coll, groupId],
      };
    });
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    updateActiveTable((tb) => ({
      ...tb,
      groups: (tb.groups || []).map((g) => (g.id === groupId ? { ...g, name: newName } : g)),
    }));
  };

  const handleDeleteGroup = (groupId: string) => {
    updateActiveTable((tb) => ({
      ...tb,
      groups: (tb.groups || []).filter((g) => g.id !== groupId),
      collapsedGroups: (tb.collapsedGroups || []).filter((x) => x !== groupId),
      items: tb.items.map((it) => (it.groupId === groupId ? { ...it, groupId: undefined } : it)),
    }));
  };

  const handleAddItemToGroup = (groupId?: string) => {
    updateActiveTable((tb) => ({
      ...tb,
      items: renumberItems([
        ...tb.items,
        {
          id: genId(),
          label: '',
          value: '',
          groupId,
        },
      ]),
    }));
  };

  const handleAddNewGroup = (groupName: string) => {
    updateActiveTable((tb) => ({
      ...tb,
      groups: [...(tb.groups || []), { id: genId(), name: groupName }],
    }));
  };

  // Table management handlers
  const handleCreateNewTable = (name: string) => {
    const newTb = createDefaultTable(name, '默认分组');
    setTables((prev) => [...prev, newTb]);
    setActiveTableId(newTb.id);
  };

  const handleRenameTable = (name: string) => {
    updateActiveTable((tb) => ({
      ...tb,
      name,
    }));
  };

  const handleDeleteTable = () => {
    if (!deleteModal.targetTable) return;
    const targetId = deleteModal.targetTable.id;

    setTables((prev) => {
      const next = prev.filter((t) => t.id !== targetId);
      if (!next.length) {
        const fallback = createDefaultTable('默认表', '默认分组');
        setActiveTableId(fallback.id);
        return [fallback];
      }
      if (activeTableId === targetId) {
        setActiveTableId(next[0].id);
      }
      return next;
    });

    setDeleteModal({ isOpen: false, targetTable: null });
  };

  const handleExportTable = () => {
    exportTableAsJson(activeTable);
  };

  const handleImportTable = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const normalized = normalizeTables([parsed]);
        if (normalized.length > 0) {
          const imported = normalized[0];
          setTables((prev) => [...prev, imported]);
          setActiveTableId(imported.id);
        } else {
          alert('导入失败：表格数据格式不符合规范');
        }
      } catch (err) {
        alert('导入失败：无法解析 JSON 文件');
      }
    };
    reader.readAsText(file);
  };

  // Copy row handler
  const handleCopyRow = (rowNo: number, targetPos: PositionType) => {
    const src = activeTable.items.find((it) => it.label === String(rowNo));
    if (!src) {
      setCopyFeedback(`未找到编号 ${rowNo}`);
      setTimeout(() => setCopyFeedback(''), 2500);
      return;
    }

    updateActiveTable((tb) => ({
      ...tb,
      items: renumberItems([
        ...tb.items,
        {
          id: genId(),
          label: '',
          value: src.value,
          position: targetPos,
          groupId: src.groupId,
          source: src.source,
          expression: src.expression,
          toleranceInput: src.toleranceInput,
          starred: src.starred,
        },
      ]),
    }));

    setCopyFeedback('已复制');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  // Apply fit tolerance calculated result
  const handleApplyFitTolerance = (result: {
    nominal: string;
    upper: string;
    lower: string;
    fitCode: string;
  }) => {
    const nom = parseFloat(result.nominal) || 0;
    const u = parseFloat(result.upper) || 0;
    const l = parseFloat(result.lower) || 0;
    const midVal = nom + (u + l) / 2;
    const targetItemId = fitModal.targetItemId || activeTable.items[0]?.id;

    if (!targetItemId) return;

    const displayDecimals = unitConfig.displayUnit === 'mm' ? unitConfig.mmDecimals : unitConfig.inchDecimals;
    const convertedMid = convertLength(midVal, unitConfig.inputUnit, unitConfig.displayUnit);
    const finalVal = formatLengthValue(convertedMid, unitConfig.displayUnit, displayDecimals);

    updateActiveTable((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === targetItemId
          ? {
              ...it,
              value: finalVal,
              source: 'tolerance',
              toleranceInput: {
                nominal: result.nominal,
                upper: result.upper,
                lower: result.lower,
                selected: 'middle',
                fitCode: result.fitCode,
              },
              rawInput: result.nominal,
              rawUnit: unitConfig.inputUnit,
            }
          : it
      ),
    }));

    setCopyFeedback(`已将 ${result.fitCode} 公差应用至切点表！`);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  // Mode and unit footer tip
  const footerHint = useMemo(() => {
    let modeText = '';
    switch (inputMode) {
      case 'normal':
        modeText = '正常模式：直接在输入框中键入数值';
        break;
      case 'tolerance':
        modeText = '公差模式：点击输入框调出公差计算器，支持自由公差等级 (GB/T 1804)';
        break;
      case 'expression':
        modeText = '表达式模式：点击输入框调出表达式计算器进行四则运算';
        break;
    }

    const unitRuleText =
      unitConfig.inputUnit === unitConfig.displayUnit
        ? `当前单位：输入与显示均为 ${unitConfig.inputUnit}`
        : `当前单位：输入 ${unitConfig.inputUnit} ➔ 显示 ${unitConfig.displayUnit} (自动换算)`;

    return `${modeText} ｜ ${unitRuleText}`;
  }, [inputMode, unitConfig]);

  return (
    <div className="flex flex-col h-screen bg-[#161e26] text-[#cbd2d9] font-sans antialiased overflow-hidden select-none">
      {/* Container wrapper constrained to industrial standard max width */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
        {/* App Header with GD&T launcher, Unit Settings, Position Dropdown Config, and Fit Tolerances */}
        <Header
          onOpenGdtModal={() => setGdtModalOpen(true)}
          unitConfig={unitConfig}
          onOpenUnitModal={() => setUnitModalOpen(true)}
          onSelectUnitMode={handleQuickSwitchUnitMode}
          onOpenPositionModal={() => setPositionModalOpen(true)}
          onOpenFitModal={() =>
            setFitModal({
              isOpen: true,
              initialSize: activeTable.items[0]?.toleranceInput?.nominal || activeTable.items[0]?.value || '20',
            })
          }
        />

        {/* Toolbar: mode switcher, table selector, position config and quick copy */}
        <Toolbar
          inputMode={inputMode}
          onSetInputMode={setInputMode}
          tables={tables}
          activeTable={activeTable}
          onSelectTable={setActiveTableId}
          onOpenNewTableModal={() => setTableNameModal({ isOpen: true, kind: 'new' })}
          onOpenRenameTableModal={() => setTableNameModal({ isOpen: true, kind: 'rename' })}
          onRequestDeleteTable={() => setDeleteModal({ isOpen: true, targetTable: activeTable })}
          onExportTable={handleExportTable}
          onImportTable={handleImportTable}
          onCopyRow={handleCopyRow}
          copyFeedback={copyFeedback}
          positions={positions}
          onOpenPositionModal={() => setPositionModalOpen(true)}
        />

        {/* Table & Groups content */}
        <TableView
          table={activeTable}
          inputMode={inputMode}
          unitConfig={unitConfig}
          positions={positions}
          onToggleStar={handleToggleStar}
          onPositionChange={handlePositionChange}
          onValueChange={handleValueChange}
          onOpenCalculator={handleOpenCalculator}
          onAddAfter={handleAddAfter}
          onDeleteItem={handleDeleteItem}
          onToggleGroupCollapse={handleToggleGroupCollapse}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddItemToGroup={handleAddItemToGroup}
          onAddNewGroup={handleAddNewGroup}
        />

        {/* Bottom hint bar */}
        <footer className="px-4 py-2 border-t border-[#323f4b] bg-[#1f2933] text-center text-[11px] text-[#7b8794]">
          {footerHint}
        </footer>
      </div>

      {/* Feature 1 Modal: Tolerance and Expression Calculator with Free & Fit Tolerance */}
      <CalculatorModal
        isOpen={calcModal.isOpen}
        item={calcModal.item}
        initialMode={calcModal.initialMode}
        unitConfig={unitConfig}
        onClose={() => setCalcModal({ isOpen: false, item: null, initialMode: 'tolerance' })}
        onConfirm={handleConfirmCalculator}
        onClearValue={handleClearValue}
        onOpenFitModal={(nom) =>
          setFitModal({
            isOpen: true,
            initialSize: nom || calcModal.item?.toleranceInput?.nominal || calcModal.item?.value || '20',
            targetItemId: calcModal.item?.id,
          })
        }
      />

      {/* Feature 2 Modal: GD&T Shape and Position Tolerances Viewer */}
      <GdtSymbolsModal
        isOpen={gdtModalOpen}
        onClose={() => setGdtModalOpen(false)}
      />

      {/* Feature 4 Modal: ISO 286 / GB 1800 Fit Tolerance (孔轴配合公差) Calculator */}
      <FitToleranceModal
        isOpen={fitModal.isOpen}
        unitConfig={unitConfig}
        initialSize={fitModal.initialSize}
        onClose={() => setFitModal({ isOpen: false })}
        onApplyTolerance={handleApplyFitTolerance}
      />

      {/* Feature 3 Modal: Metric & Imperial Unit Settings & Converter */}
      <UnitSettingsModal
        isOpen={unitModalOpen}
        config={unitConfig}
        onClose={() => setUnitModalOpen(false)}
        onSaveConfig={handleApplyUnitConfig}
        onBatchConvertCurrentTable={handleBatchConvertCurrentTable}
      />

      {/* Table Name (New / Rename) Modal */}
      <TableNameModal
        isOpen={tableNameModal.isOpen}
        kind={tableNameModal.kind}
        currentName={activeTable.name}
        onClose={() => setTableNameModal({ isOpen: false, kind: 'new' })}
        onConfirm={(name) => {
          if (tableNameModal.kind === 'new') {
            handleCreateNewTable(name);
          } else {
            handleRenameTable(name);
          }
        }}
      />

      {/* Table Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        targetTable={deleteModal.targetTable}
        onClose={() => setDeleteModal({ isOpen: false, targetTable: null })}
        onConfirm={handleDeleteTable}
      />

      {/* Position & Feature Tags Configuration Modal */}
      <PositionConfigModal
        isOpen={positionModalOpen}
        positions={positions}
        tables={tables}
        onClose={() => setPositionModalOpen(false)}
        onSavePositions={handleSavePositions}
      />
    </div>
  );
}
