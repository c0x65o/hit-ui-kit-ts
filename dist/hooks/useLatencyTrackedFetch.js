'use client';
import { useCallback, useRef } from 'react';
import { useLatencyLog, getCurrentPageUrl } from './useLatencyLog';
/**
 * Classify a URL into a latency source type
 */
function classifySource(url) {
    const path = url.toLowerCase();
    // Module calls (proxy routes to backend modules)
    if (path.includes('/api/proxy/') || path.includes('/hit/')) {
        return 'module';
    }
    // Database-heavy endpoints (heuristic based on common patterns)
    if (path.includes('/query') ||
        path.includes('/batch') ||
        path.includes('/entries') ||
        path.includes('/drilldown') ||
        path.includes('/catalog') ||
        path.includes('/definitions')) {
        return 'db';
    }
    // Default to API
    return 'api';
}
/**
 * Extract module name from URL if it's a module call
 */
function extractModuleName(url) {
    // Pattern: /api/proxy/{module}/... or /hit/{module}/...
    const proxyMatch = url.match(/\/api\/proxy\/([^\/]+)/);
    if (proxyMatch)
        return proxyMatch[1];
    const hitMatch = url.match(/\/hit\/([^\/]+)/);
    if (hitMatch)
        return hitMatch[1];
    return undefined;
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
export function useLatencyTrackedFetch(config = {}) {
    const { slowOnly = true, thresholdMs, userEmail } = config;
    const { logLatency, slowThresholdMs } = useLatencyLog();
    const startTimeRef = useRef(new Map());
    const effectiveThreshold = thresholdMs ?? slowThresholdMs;
    const trackedFetch = useCallback(async (input, init) => {
        const { skipLogging, forceLog, source: sourceOverride, moduleName: moduleNameOverride, tableName, queryType, metadata, ...fetchInit } = init || {};
        const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const startTime = Date.now();
        startTimeRef.current.set(requestId, startTime);
        // Extract URL and method for logging
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = fetchInit?.method || 'GET';
        try {
            const response = await fetch(input, fetchInit);
            const durationMs = Date.now() - (startTimeRef.current.get(requestId) || startTime);
            startTimeRef.current.delete(requestId);
            const isSlow = durationMs >= effectiveThreshold;
            // Only log if: not skipped AND (force OR (slow when slowOnly mode) OR (not slowOnly mode))
            const shouldLog = !skipLogging && (forceLog || (slowOnly ? isSlow : true));
            if (shouldLog) {
                const source = sourceOverride || classifySource(url);
                const moduleName = moduleNameOverride || extractModuleName(url);
                logLatency({
                    userEmail,
                    pageUrl: getCurrentPageUrl(),
                    status: response.status,
                    durationMs,
                    endpoint: url,
                    method,
                    source,
                    moduleName,
                    tableName,
                    queryType,
                    metadata,
                    responseSize: parseInt(response.headers.get('content-length') || '0', 10) || undefined,
                });
            }
            return response;
        }
        catch (error) {
            const durationMs = Date.now() - (startTimeRef.current.get(requestId) || startTime);
            startTimeRef.current.delete(requestId);
            const isSlow = durationMs >= effectiveThreshold;
            // Log errors (network failures are always notable)
            if (!skipLogging) {
                const source = sourceOverride || classifySource(url);
                const moduleName = moduleNameOverride || extractModuleName(url);
                logLatency({
                    userEmail,
                    pageUrl: getCurrentPageUrl(),
                    status: 0,
                    durationMs,
                    endpoint: url,
                    method,
                    source,
                    moduleName,
                    tableName,
                    queryType,
                    metadata: {
                        ...metadata,
                        error: error instanceof Error ? error.message : String(error),
                    },
                });
            }
            throw error;
        }
    }, [logLatency, slowOnly, effectiveThreshold, userEmail]);
    return { trackedFetch };
}
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
export function createLatencyTrackedFetch(options) {
    const { getLogLatency, getSlowThreshold, getUserEmail, slowOnly = true } = options;
    return async function latencyTrackedFetch(input, init) {
        const { skipLogging, forceLog, source: sourceOverride, moduleName: moduleNameOverride, tableName, queryType, metadata, ...fetchInit } = init || {};
        const startTime = Date.now();
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = fetchInit?.method || 'GET';
        try {
            const response = await fetch(input, fetchInit);
            const durationMs = Date.now() - startTime;
            const threshold = getSlowThreshold();
            const isSlow = durationMs >= threshold;
            const shouldLog = !skipLogging && (forceLog || (slowOnly ? isSlow : true));
            if (shouldLog) {
                const logLatency = getLogLatency();
                if (logLatency) {
                    const source = sourceOverride || classifySource(url);
                    const moduleName = moduleNameOverride || extractModuleName(url);
                    logLatency({
                        userEmail: getUserEmail?.(),
                        pageUrl: getCurrentPageUrl(),
                        status: response.status,
                        durationMs,
                        endpoint: url,
                        method,
                        source,
                        moduleName,
                        tableName,
                        queryType,
                        metadata,
                        responseSize: parseInt(response.headers.get('content-length') || '0', 10) || undefined,
                    });
                }
            }
            return response;
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            if (!skipLogging) {
                const logLatency = getLogLatency();
                if (logLatency) {
                    const source = sourceOverride || classifySource(url);
                    const moduleName = moduleNameOverride || extractModuleName(url);
                    logLatency({
                        userEmail: getUserEmail?.(),
                        pageUrl: getCurrentPageUrl(),
                        status: 0,
                        durationMs,
                        endpoint: url,
                        method,
                        source,
                        moduleName,
                        tableName,
                        queryType,
                        metadata: {
                            ...metadata,
                            error: error instanceof Error ? error.message : String(error),
                        },
                    });
                }
            }
            throw error;
        }
    };
}
//# sourceMappingURL=useLatencyTrackedFetch.js.map