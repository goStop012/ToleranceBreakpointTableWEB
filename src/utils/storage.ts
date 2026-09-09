import { InputMode, TableData, TableItem } from '../types/table';
import { UnitConfig } from '../types/unit';
import { DEFAULT_UNIT_CONFIG } from '../constants/units';
import { PositionOption } from '../types/position';
import { DEFAULT_POSITIONS } from '../constants/positions';
import { genId } from './math';

export { genId };

export const LS_TABLES_KEY = 'tol_breakpoint_tables';
export const LS_MODE_KEY = 'tol_breakpoint_input_mode';
export const LS_UNIT_CONFIG_KEY = 'tol_breakpoint_unit_config';
export const LS_POSITIONS_KEY = 'tol_breakpoint_custom_positions';

export function createDefaultTable(name: string = '默认表', groupName: string = '默认分组'): TableData {
  const gid = genId();
  return {
    id: genId(),
    name,
    groups: [{ id: gid, name: groupName }],
    items: [{ id: genId(), label: '1', value: '', groupId: gid }],
  };
}

export function renumberItems(items: TableItem[]): TableItem[] {
  return items.map((item, idx) => ({
    ...item,
    label: String(idx + 1),
  }));
}

export function normalizeTables(raw: unknown): TableData[] {
  if (!Array.isArray(raw)) return [];

  const tables: TableData[] = [];

  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;

    const itemGroups = Array.isArray((t as Record<string, unknown>).groups)
      ? ((t as Record<string, unknown>).groups as unknown[])
          .filter((g): g is { id: string; name: string } => {
            return (
              Boolean(g) &&
              typeof (g as Record<string, unknown>).id === 'string' &&
              typeof (g as Record<string, unknown>).name === 'string'
            );
          })
          .map((g) => ({ id: g.id, name: g.name }))
      : undefined;

    const collapsed = Array.isArray((t as Record<string, unknown>).collapsedGroups)
      ? ((t as Record<string, unknown>).collapsedGroups as unknown[]).filter(
          (x): x is string => typeof x === 'string'
        )
      : undefined;

    const itemsRaw = Array.isArray((t as Record<string, unknown>).items)
      ? ((t as Record<string, unknown>).items as unknown[])
      : [];

    const items: TableItem[] = [];
    for (const it of itemsRaw) {
      if (!it || typeof it !== 'object') continue;
      const rec = it as Record<string, unknown>;
      // 支持所有非空的位置特征标签（包括内置与用户自定义）
      const positionValid =
        typeof rec.position === 'string' && rec.position.trim() !== '';

      items.push({
        id: typeof rec.id === 'string' ? rec.id : genId(),
        label: typeof rec.label === 'string' ? rec.label : '',
        value: typeof rec.value === 'string' ? rec.value : '',
        position: positionValid ? (rec.position as TableItem['position']) : undefined,
        groupId: typeof rec.groupId === 'string' ? rec.groupId : undefined,
        source: rec.source === 'tolerance' || rec.source === 'expression' ? rec.source : undefined,
        expression: typeof rec.expression === 'string' ? rec.expression : undefined,
        toleranceInput:
          rec.toleranceInput && typeof rec.toleranceInput === 'object'
            ? (rec.toleranceInput as TableItem['toleranceInput'])
            : undefined,
        starred: rec.starred === true ? true : undefined,
        rawInput: typeof rec.rawInput === 'string' ? rec.rawInput : undefined,
        rawUnit: rec.rawUnit === 'mm' || rec.rawUnit === 'inch' ? rec.rawUnit : undefined,
      });
    }

    tables.push({
      id: typeof (t as Record<string, unknown>).id === 'string' ? (t as Record<string, unknown>).id as string : genId(),
      name:
        typeof (t as Record<string, unknown>).name === 'string'
          ? (t as Record<string, unknown>).name as string
          : '未命名表',
      groups: itemGroups,
      collapsedGroups: collapsed,
      items: renumberItems(items.length ? items : [{ id: genId(), label: '1', value: '' }]),
    });
  }

  return tables;
}

export function loadUnitConfig(): UnitConfig {
  try {
    const raw = localStorage.getItem(LS_UNIT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        (parsed.mode === 'in_to_mm' ||
          parsed.mode === 'mm_to_mm' ||
          parsed.mode === 'in_to_in' ||
          parsed.mode === 'mm_to_in')
      ) {
        return {
          mode: parsed.mode,
          inputUnit: parsed.inputUnit || (parsed.mode.startsWith('in') ? 'inch' : 'mm'),
          displayUnit: parsed.displayUnit || (parsed.mode.endsWith('mm') ? 'mm' : 'inch'),
          mmDecimals: typeof parsed.mmDecimals === 'number' ? parsed.mmDecimals : 4,
          inchDecimals: typeof parsed.inchDecimals === 'number' ? parsed.inchDecimals : 4,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load unit config from localStorage', err);
  }
  return DEFAULT_UNIT_CONFIG;
}

export function saveUnitConfigToStorage(config: UnitConfig) {
  try {
    localStorage.setItem(LS_UNIT_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving unit config to localStorage', err);
  }
}

export function loadPositionsConfig(): PositionOption[] {
  try {
    const raw = localStorage.getItem(LS_POSITIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure every item has id, value, and label
        return parsed
          .filter((p) => p && typeof p.label === 'string')
          .map((p) => ({
            id: typeof p.id === 'string' ? p.id : (typeof p.value === 'string' ? p.value : genId()),
            value: typeof p.value === 'string' ? p.value : (typeof p.id === 'string' ? p.id : ''),
            label: p.label,
            color: typeof p.color === 'string' ? p.color : undefined,
            isPreset: p.isPreset === true,
            description: typeof p.description === 'string' ? p.description : undefined,
          }));
      }
    }
  } catch (err) {
    console.warn('Failed to load positions config from localStorage', err);
  }
  return DEFAULT_POSITIONS;
}

export function savePositionsConfig(positions: PositionOption[]) {
  try {
    localStorage.setItem(LS_POSITIONS_KEY, JSON.stringify(positions));
  } catch (err) {
    console.error('Error saving positions config to localStorage', err);
  }
}

export function loadInitialState(): {
  tables: TableData[];
  activeTableId: string;
  mode: InputMode;
  unitConfig: UnitConfig;
  positions: PositionOption[];
} {
  let tables: TableData[] = [];
  let mode: InputMode = 'normal';
  const unitConfig = loadUnitConfig();
  const positions = loadPositionsConfig();

  try {
    const raw = localStorage.getItem(LS_TABLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      tables = normalizeTables(parsed);
    }
  } catch (err) {
    console.warn('Failed to load tables from localStorage', err);
  }

  try {
    const m = localStorage.getItem(LS_MODE_KEY);
    if (m === 'tolerance' || m === 'expression') {
      mode = m;
    }
  } catch (err) {
    console.warn('Failed to load mode from localStorage', err);
  }

  if (!tables.length) {
    const def = createDefaultTable('默认表', '默认分组');
    tables = [def];
  }

  return {
    tables,
    activeTableId: tables[0].id,
    mode,
    unitConfig,
    positions,
  };
}

export function saveTablesToStorage(tables: TableData[]) {
  try {
    localStorage.setItem(LS_TABLES_KEY, JSON.stringify(tables));
  } catch (err) {
    console.error('Error saving tables to localStorage', err);
  }
}

export function saveModeToStorage(mode: InputMode) {
  try {
    localStorage.setItem(LS_MODE_KEY, mode);
  } catch (err) {
    console.error('Error saving mode to localStorage', err);
  }
}

export function exportTableAsJson(table: TableData) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  const jsonStr = JSON.stringify(table, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${table.name}_${ts}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}
