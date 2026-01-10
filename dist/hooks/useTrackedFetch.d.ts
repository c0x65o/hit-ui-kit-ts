import { useErrorLog } from './useErrorLog';
import type { LatencyLogEntry } from './useLatencyLog';
/**
 * Options for tracked fetch
 */
export interface TrackedFetchOptions extends RequestInit {
    /** Skip logging for this request */
    skipLogging?: boolean;
}
/**
 * Hook that provides a fetch wrapper that automatically logs errors to the global error log.
 *
 * Use this for non-form API calls that should still be tracked in the error log.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackedFetch } = useTrackedFetch();
 *
 *   const loadData = async () => {
 *     const res = await trackedFetch('/api/data');
 *     if (res.ok) {
 *       const data = await res.json();
 *       // ...
 *     }
 *   };
 * }
 * ```
 */
export declare function useTrackedFetch(): {
    trackedFetch: (input: RequestInfo | URL, init?: TrackedFetchOptions) => Promise<Response>;
};
/**
 * Create a global fetch interceptor.
 *
 * Call this once at app initialization to intercept ALL fetch calls globally.
 * This handles both error logging and latency tracking (for slow requests).
 *
 * @example
 * ```tsx
 * // In your app initialization
 * import { installGlobalFetchInterceptor } from '@hit/ui-kit';
 *
 * installGlobalFetchInterceptor({
 *   getLogError: () => window.__HIT_LOG_ERROR__,
 *   getLogLatency: () => window.__HIT_LOG_LATENCY__,
 *   getSlowThreshold: () => 500,
 *   getUserEmail: () => window.__HIT_USER_EMAIL__,
 * });
 * ```
 */
export declare function installGlobalFetchInterceptor(options: {
    getLogError: () => ((entry: Parameters<ReturnType<typeof useErrorLog>['logError']>[0]) => void) | undefined;
    getUserEmail: () => string | undefined;
    shouldIntercept?: (url: string, init?: RequestInit) => boolean;
    /** Latency logging (optional) - only logs slow requests */
    getLogLatency?: () => ((entry: Omit<LatencyLogEntry, 'id' | 'timestamp' | 'isSlow'>) => void) | undefined;
    /** Get slow threshold in ms (default: 500) */
    getSlowThreshold?: () => number;
    /** Only log slow requests for latency (default: true) */
    latencySlowOnly?: boolean;
}): (() => void) | undefined;
//# sourceMappingURL=useTrackedFetch.d.ts.map