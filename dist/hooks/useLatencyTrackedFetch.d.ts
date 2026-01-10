import { type LatencySource, type LatencyLogEntry } from './useLatencyLog';
/**
 * Options for latency-tracked fetch
 */
export interface LatencyTrackedFetchOptions extends RequestInit {
    /** Skip logging for this request */
    skipLogging?: boolean;
    /** Force log even if not slow */
    forceLog?: boolean;
    /** Override the source classification */
    source?: LatencySource;
    /** Module name (for module calls) */
    moduleName?: string;
    /** Table name (for db queries) */
    tableName?: string;
    /** Query type (for db queries) */
    queryType?: string;
    /** Additional metadata to log */
    metadata?: Record<string, unknown>;
}
/**
 * Configuration for the latency tracker
 */
export interface LatencyTrackerConfig {
    /** Only log requests slower than this threshold (default: true) */
    slowOnly?: boolean;
    /** Custom threshold in ms (uses global threshold if not set) */
    thresholdMs?: number;
    /** User email for attribution */
    userEmail?: string;
}
/**
 * Hook that provides a fetch wrapper that tracks latency for slow requests.
 *
 * By default, only logs requests that exceed the slow threshold to minimize storage usage.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackedFetch } = useLatencyTrackedFetch();
 *
 *   const loadData = async () => {
 *     // Automatically tracks latency, only logs if slow
 *     const res = await trackedFetch('/api/metrics/query', {
 *       method: 'POST',
 *       body: JSON.stringify({ ... }),
 *     });
 *   };
 * }
 * ```
 */
export declare function useLatencyTrackedFetch(config?: LatencyTrackerConfig): {
    trackedFetch: (input: RequestInfo | URL, init?: LatencyTrackedFetchOptions) => Promise<Response>;
};
/**
 * Create a standalone latency-tracked fetch function (not a hook).
 * Useful for non-React contexts or when you need a global instance.
 *
 * @example
 * ```ts
 * const latencyFetch = createLatencyTrackedFetch({
 *   getLogLatency: () => window.__HIT_LOG_LATENCY__,
 *   slowOnly: true,
 * });
 *
 * const res = await latencyFetch('/api/data');
 * ```
 */
export declare function createLatencyTrackedFetch(options: {
    getLogLatency: () => ((entry: Omit<LatencyLogEntry, 'id' | 'timestamp' | 'isSlow'>) => void) | undefined;
    getSlowThreshold: () => number;
    getUserEmail?: () => string | undefined;
    slowOnly?: boolean;
}): (input: RequestInfo | URL, init?: LatencyTrackedFetchOptions) => Promise<Response>;
//# sourceMappingURL=useLatencyTrackedFetch.d.ts.map