import { getTableFilters } from '../config/tableFilters';

export type GlobalFilterValues = Record<string, string | string[]>;

/**
 * The minimal filter shape used by the table views system and server-side filter parsing.
 */
export interface ServerTableFilter {
  field: string;
  operator: string;
  value: any;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function toStringArray(v: string | string[]): string[] {
  const arr = Array.isArray(v) ? v : [v];
  return arr.map((x) => String(x)).map((x) => x.trim()).filter(Boolean);
}

/**
 * Convert DataTable "quick filter" values (from `onGlobalFiltersChange`) into server-compatible filters.
 *
 * Behavior:
 * - string filters -> `contains`
 * - select/autocomplete -> `equals`
 * - multiselect -> `in` with array value
 * - date -> `dateEquals`
 * - daterange -> splits "from|to" into `dateAfter` + `dateBefore`
 * - boolean -> `isTrue` / `isFalse`
 * - number -> `equals` (number when parseable)
 *
 * Notes:
 * - For best results, pass a `tableId` that exists in `TABLE_FILTER_REGISTRY` so types are known.
 * - Unknown keys fall back to:
 *   - array => `in`
 *   - string => `contains`
 */
export function globalFilterValuesToServerFilters(args: {
  tableId?: string;
  values: GlobalFilterValues;
}): ServerTableFilter[] {
  const { tableId, values } = args;
  const defs = tableId ? getTableFilters(tableId) : [];
  const defByKey = new Map(defs.map((d) => [d.columnKey, d]));

  const out: ServerTableFilter[] = [];

  for (const [columnKey, raw] of Object.entries(values || {})) {
    if (raw === '' || (Array.isArray(raw) && raw.length === 0)) continue;

    const def = defByKey.get(columnKey);
    const t = def?.filterType;

    // daterange: "from|to" -> two filters (both optional)
    if (t === 'daterange' && isNonEmptyString(raw)) {
      const [fromStr, toStr] = raw.split('|');
      const from = (fromStr || '').trim();
      const to = (toStr || '').trim();
      if (from) out.push({ field: columnKey, operator: 'dateAfter', value: from });
      if (to) out.push({ field: columnKey, operator: 'dateBefore', value: to });
      continue;
    }

    // boolean: UI stores 'true'/'false' strings
    if (t === 'boolean') {
      const s = Array.isArray(raw) ? String(raw[0] ?? '').trim() : String(raw).trim();
      if (s === 'true') out.push({ field: columnKey, operator: 'isTrue', value: '' });
      else if (s === 'false') out.push({ field: columnKey, operator: 'isFalse', value: '' });
      continue;
    }

    if (t === 'multiselect') {
      const arr = toStringArray(raw);
      if (arr.length) out.push({ field: columnKey, operator: 'in', value: arr });
      continue;
    }

    if (t === 'select' || t === 'autocomplete') {
      const s = Array.isArray(raw) ? String(raw[0] ?? '').trim() : String(raw).trim();
      if (s) out.push({ field: columnKey, operator: 'equals', value: s });
      continue;
    }

    if (t === 'date') {
      const s = Array.isArray(raw) ? String(raw[0] ?? '').trim() : String(raw).trim();
      if (s) out.push({ field: columnKey, operator: 'dateEquals', value: s });
      continue;
    }

    if (t === 'number') {
      const s = Array.isArray(raw) ? String(raw[0] ?? '').trim() : String(raw).trim();
      if (!s) continue;
      const n = Number(s);
      out.push({ field: columnKey, operator: 'equals', value: Number.isFinite(n) ? n : s });
      continue;
    }

    // default: string or unknown types
    if (Array.isArray(raw)) {
      const arr = toStringArray(raw);
      if (arr.length) out.push({ field: columnKey, operator: 'in', value: arr });
      continue;
    }

    const s = String(raw).trim();
    if (!s) continue;
    out.push({ field: columnKey, operator: (t === 'string' ? 'contains' : 'contains'), value: s });
  }

  return out;
}

/**
 * Merge server/view filters with quick filters.
 *
 * Rules:
 * - Quick filters override view filters on the same field
 * - If any quick filters exist, use AND semantics ('all') for predictability
 */
export function mergeViewAndQuickServerFilters(args: {
  viewFilters: ServerTableFilter[];
  viewFilterMode: 'all' | 'any';
  quickFilters: ServerTableFilter[];
}): { filters: ServerTableFilter[]; filterMode: 'all' | 'any' } {
  const { viewFilters, viewFilterMode, quickFilters } = args;

  if (!quickFilters.length) {
    return { filters: viewFilters, filterMode: viewFilterMode };
  }

  const quickFields = new Set(quickFilters.map((f) => f.field));
  const base = (viewFilters || []).filter((f) => !quickFields.has(f.field));
  return { filters: [...base, ...quickFilters], filterMode: 'all' };
}

