/**
 * Datetime formatting helpers for UI rendering.
 *
 * Goal:
 * - If a cell value looks like an ISO timestamp (e.g. "2026-01-06T14:20:00Z"),
 *   do NOT render the raw UTC string.
 * - Instead, format in the app's reporting timezone if available (hit.yaml -> HIT_CONFIG),
 *   otherwise fall back to browser-local time.
 *
 * This is intentionally lightweight and client-safe.
 */
function getHitConfig() {
    if (typeof window === 'undefined')
        return undefined;
    const w = window;
    return w.__HIT_CONFIG;
}
export function getReportingTimezone() {
    const tz = getHitConfig()?.reporting?.timezone;
    if (typeof tz !== 'string')
        return undefined;
    const trimmed = tz.trim();
    // Very light validation: IANA tz usually contains "/" (e.g. America/Chicago).
    if (!trimmed || !trimmed.includes('/'))
        return undefined;
    return trimmed;
}
function isLikelyIsoDateTimeString(v) {
    // Require a time component and either a Z or offset.
    // Examples: 2026-01-06T08:20:00Z, 2026-01-06T08:20:00.123+00:00
    return /^\d{4}-\d{2}-\d{2}T/.test(v) && (/[zZ]$/.test(v) || /[+-]\d{2}:\d{2}$/.test(v));
}
function isLikelyDateOnlyString(v) {
    // YYYY-MM-DD
    return /^\d{4}-\d{2}-\d{2}$/.test(v);
}
function parseDateOnlyToSafeDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m)
        return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d))
        return null;
    if (mo < 1 || mo > 12)
        return null;
    if (d < 1 || d > 31)
        return null;
    // Use noon UTC so formatting in any timeZone is extremely unlikely to roll the day.
    // (Avoids the classic "midnight UTC shows previous day in US timezones".)
    const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
    return Number.isNaN(dt.getTime()) ? null : dt;
}
function toDate(value) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : { date: value, kind: 'datetime' };
    }
    if (typeof value === 'string') {
        const s = value.trim();
        if (!s)
            return null;
        if (isLikelyIsoDateTimeString(s)) {
            const d = new Date(s);
            return Number.isNaN(d.getTime()) ? null : { date: d, kind: 'datetime' };
        }
        if (isLikelyDateOnlyString(s)) {
            const d = parseDateOnlyToSafeDate(s);
            return d ? { date: d, kind: 'date' } : null;
        }
        return null;
    }
    if (typeof value === 'number') {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : { date: d, kind: 'datetime' };
    }
    return null;
}
export function isDateTimeLikeColumnKey(columnKey) {
    // Keep this narrow to avoid surprising formatting on arbitrary string columns.
    // We only auto-format when the column name strongly suggests time.
    return /(?:At|_at|Timestamp|_timestamp|DateTime|_datetime|Date|_date)$/i.test(columnKey);
}
export function formatDateTimeValue(value, opts) {
    const parsed = toDate(value);
    if (!parsed)
        return null;
    const d = parsed.date;
    const tz = getReportingTimezone();
    // Default behavior:
    // - datetime values: include time
    // - date-only values: date only
    const includeTime = opts?.includeTime !== undefined ? opts.includeTime : parsed.kind === 'datetime';
    const formatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime
            ? {
                hour: '2-digit',
                minute: '2-digit',
            }
            : {}),
    };
    if (tz)
        formatOptions.timeZone = tz;
    return includeTime ? d.toLocaleString(undefined, formatOptions) : d.toLocaleDateString(undefined, formatOptions);
}
/**
 * Best-effort: if the value looks like an ISO datetime and the column key looks datetime-ish,
 * return a formatted string; otherwise return null so the caller can fall back to default rendering.
 */
export function formatDateTimeCellIfApplicable(columnKey, value) {
    if (!isDateTimeLikeColumnKey(columnKey))
        return null;
    if (typeof value === 'string') {
        const s = value.trim();
        if (!isLikelyIsoDateTimeString(s) && !isLikelyDateOnlyString(s))
            return null;
        // Let the parser decide whether to include time (date-only stays date-only).
        return formatDateTimeValue(s);
    }
    if (value instanceof Date || typeof value === 'number') {
        return formatDateTimeValue(value, { includeTime: true });
    }
    return null;
}
//# sourceMappingURL=datetime.js.map