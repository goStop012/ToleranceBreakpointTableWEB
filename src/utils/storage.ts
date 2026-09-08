import { InputMode, TableData, TableItem } from '../types/table';
import { genId } from './math';

export { genId };

export const LS_TABLES_KEY = 'tol_breakpoint_tables';
export const LS_MODE_KEY = 'tol_breakpoint_input_mode';

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
      const positionValid =
        rec.position === 'outer' ||
        rec.position === 'inner' ||
        rec.position === 'face' ||
        rec.position === 'side' ||
        rec.position === 'verify' ||
        rec.position === 'length';

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

export function loadInitialState(): { tables: TableData[]; activeTableId: string; mode: InputMode } {
  let tables: TableData[] = [];
  let mode: InputMode = 'normal';

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
