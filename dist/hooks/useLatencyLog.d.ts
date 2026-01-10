import type { ReactNode } from 'react';
/**
 * Type of operation being tracked
 */
export type LatencySource = 'db' | 'module' | 'api' | 'other';
/**
 * Logged latency entry with full context
 */
export interface LatencyLogEntry {
    /** Unique ID for the entry */
    id: string;
    /** Timestamp when the request started */
    timestamp: Date;
    /** User email if available */
    userEmail?: string;
    /** Page/URL where request originated */
    pageUrl: string;
    /** HTTP status code (0 for network errors, undefined for internal ops) */
    status?: number;
    /** Duration in milliseconds */
    durationMs: number;
    /** Whether this is considered "slow" */
    isSlow: boolean;
    /** API endpoint or operation name */
    endpoint: string;
    /** HTTP method or operation type */
    method?: string;
    /** Source of the latency (db, module, api) */
    source: LatencySource;
    /** Target module name (for module calls) */
    moduleName?: string;
    /** Database query type (for db calls) */
    queryType?: string;
    /** Table/collection name (for db calls) */
    tableName?: string;
    /** Request payload summary */
    payload?: unknown;
    /** Response size in bytes */
    responseSize?: number;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Latency log state
 */
export interface LatencyLogState {
    /** All logged entries (most recent first) */
    entries: LatencyLogEntry[];
    /** Whether logging is enabled */
    enabled: boolean;
    /** Maximum number of entries to keep */
    maxEntries: number;
    /** Threshold in ms for "slow" classification */
    slowThresholdMs: number;
}
/**
 * Latency log actions
 */
export interface LatencyLogActions {
    /** Log a new latency entry */
    logLatency: (entry: Omit<LatencyLogEntry, 'id' | 'timestamp' | 'isSlow'> & {
        isSlow?: boolean;
    }) => void;
    /** Clear all entries */
    clearEntries: () => void;
    /** Clear a specific entry by ID */
    clearEntry: (id: string) => void;
    /** Toggle logging on/off */
    setEnabled: (enabled: boolean) => void;
    /** Set slow threshold */
    setSlowThreshold: (ms: number) => void;
    /** Export entries as JSON */
    exportEntries: () => string;
}
/**
 * Provider for global latency logging.
 */
export declare function LatencyLogProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access the global latency log.
 */
export declare function useLatencyLog(): LatencyLogState & LatencyLogActions;
/**
 * Get current page URL safely
 */
export declare function getCurrentPageUrl(): string;
/**
 * Format duration for display
 */
export declare function formatDuration(ms: number): string;
/**
 * Classify latency by severity
 */
export declare function getLatencySeverity(ms: number, threshold: number): 'fast' | 'normal' | 'slow' | 'critical';
//# sourceMappingURL=useLatencyLog.d.ts.map