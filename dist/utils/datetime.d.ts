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
export declare function getReportingTimezone(): string | undefined;
export declare function isDateTimeLikeColumnKey(columnKey: string): boolean;
export declare function formatDateTimeValue(value: unknown, opts?: {
    includeTime?: boolean;
}): string | null;
/**
 * Best-effort: if the value looks like an ISO datetime and the column key looks datetime-ish,
 * return a formatted string; otherwise return null so the caller can fall back to default rendering.
 */
export declare function formatDateTimeCellIfApplicable(columnKey: string, value: unknown): string | null;
//# sourceMappingURL=datetime.d.ts.map