'use client';
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useSyncExternalStore } from 'react';
// =============================================================================
// GLOBAL STORE (bypasses React Context for cross-module compatibility)
// =============================================================================
const STORE_KEY = '__HIT_LATENCY_LOG_STORE__';
const STORAGE_KEY = 'hit_latency_log';
const ENABLED_KEY = 'hit_latency_log_enabled';
const THRESHOLD_KEY = 'hit_latency_slow_threshold';
const MAX_ENTRIES = 1000;
const DEFAULT_SLOW_THRESHOLD_MS = 500;
function getStore() {
    if (typeof window === 'undefined') {
        return {
            entries: [],
            enabled: true,
            slowThresholdMs: DEFAULT_SLOW_THRESHOLD_MS,
            listeners: new Set(),
            isProviderMounted: false,
        };
    }
    const win = window;
    if (!win[STORE_KEY]) {
        let entries = [];
        let enabled = true;
        let slowThresholdMs = DEFAULT_SLOW_THRESHOLD_MS;
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                entries = parsed.map((e) => ({
                    ...e,
                    timestamp: new Date(e.timestamp),
                }));
            }
            const enabledStored = sessionStorage.getItem(ENABLED_KEY);
            if (enabledStored !== null) {
                enabled = enabledStored === 'true';
            }
            const thresholdStored = sessionStorage.getItem(THRESHOLD_KEY);
            if (thresholdStored !== null) {
                slowThresholdMs = parseInt(thresholdStored, 10) || DEFAULT_SLOW_THRESHOLD_MS;
            }
        }
        catch {
            // Ignore storage errors
        }
        win[STORE_KEY] = {
            entries,
            enabled,
            slowThresholdMs,
            listeners: new Set(),
            isProviderMounted: false,
        };
    }
    return win[STORE_KEY];
}
function notifyListeners() {
    const store = getStore();
    store.listeners.forEach((listener) => listener());
}
function subscribe(listener) {
    const store = getStore();
    store.listeners.add(listener);
    return () => {
        store.listeners.delete(listener);
    };
}
function getSnapshot() {
    return getStore();
}
function getServerSnapshot() {
    return {
        entries: [],
        enabled: true,
        slowThresholdMs: DEFAULT_SLOW_THRESHOLD_MS,
        listeners: new Set(),
        isProviderMounted: false,
    };
}
// =============================================================================
// STORE ACTIONS
// =============================================================================
function generateId() {
    return `lat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function storeLogLatency(entry) {
    const store = getStore();
    if (!store.enabled)
        return;
    const isSlow = entry.isSlow ?? entry.durationMs >= store.slowThresholdMs;
    const newEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date(),
        isSlow,
        payload: entry.payload ? truncatePayload(entry.payload) : undefined,
    };
    store.entries = [newEntry, ...store.entries].slice(0, MAX_ENTRIES);
    // Persist to sessionStorage
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.entries));
    }
    catch {
        // Ignore
    }
    notifyListeners();
}
function storeClearEntries() {
    const store = getStore();
    store.entries = [];
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    }
    catch {
        // Ignore
    }
    notifyListeners();
}
function storeClearEntry(id) {
    const store = getStore();
    store.entries = store.entries.filter((e) => e.id !== id);
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.entries));
    }
    catch {
        // Ignore
    }
    notifyListeners();
}
function storeSetEnabled(enabled) {
    const store = getStore();
    store.enabled = enabled;
    try {
        sessionStorage.setItem(ENABLED_KEY, String(enabled));
    }
    catch {
        // Ignore
    }
    notifyListeners();
}
function storeSetSlowThreshold(ms) {
    const store = getStore();
    store.slowThresholdMs = ms;
    try {
        sessionStorage.setItem(THRESHOLD_KEY, String(ms));
    }
    catch {
        // Ignore
    }
    notifyListeners();
}
function storeExportEntries() {
    const store = getStore();
    return JSON.stringify(store.entries, null, 2);
}
function storeSetProviderMounted(mounted) {
    const store = getStore();
    store.isProviderMounted = mounted;
    notifyListeners();
}
// =============================================================================
// PROVIDER
// =============================================================================
/**
 * Provider for global latency logging.
 */
export function LatencyLogProvider({ children }) {
    useEffect(() => {
        storeSetProviderMounted(true);
        return () => {
            storeSetProviderMounted(false);
        };
    }, []);
    return _jsx(_Fragment, { children: children });
}
// =============================================================================
// HOOKS
// =============================================================================
/**
 * Hook to access the global latency log.
 */
export function useLatencyLog() {
    const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return useMemo(() => ({
        entries: store.entries,
        enabled: store.enabled,
        maxEntries: MAX_ENTRIES,
        slowThresholdMs: store.slowThresholdMs,
        logLatency: storeLogLatency,
        clearEntries: storeClearEntries,
        clearEntry: storeClearEntry,
        setEnabled: storeSetEnabled,
        setSlowThreshold: storeSetSlowThreshold,
        exportEntries: storeExportEntries,
    }), [store.entries, store.enabled, store.slowThresholdMs, store.isProviderMounted]);
}
// =============================================================================
// HELPERS
// =============================================================================
/**
 * Truncate large payloads for storage
 */
function truncatePayload(payload, maxLength = 2000) {
    try {
        const str = JSON.stringify(payload);
        if (str.length <= maxLength) {
            return payload;
        }
        return {
            _truncated: true,
            _originalLength: str.length,
            preview: str.slice(0, maxLength) + '...',
        };
    }
    catch {
        return { _error: 'Could not serialize payload' };
    }
}
/**
 * Get current page URL safely
 */
export function getCurrentPageUrl() {
    if (typeof window === 'undefined')
        return 'unknown';
    return window.location.pathname + window.location.search;
}
/**
 * Format duration for display
 */
export function formatDuration(ms) {
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
}
/**
 * Classify latency by severity
 */
export function getLatencySeverity(ms, threshold) {
    if (ms < threshold * 0.5)
        return 'fast';
    if (ms < threshold)
        return 'normal';
    if (ms < threshold * 3)
        return 'slow';
    return 'critical';
}
//# sourceMappingURL=useLatencyLog.js.map