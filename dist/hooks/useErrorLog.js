'use client';
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
// =============================================================================
// GLOBAL STORE (bypasses React Context for cross-module compatibility)
// =============================================================================
const STORE_KEY = '__HIT_ERROR_LOG_STORE__';
const STORAGE_KEY = 'hit_error_log';
const ENABLED_KEY = 'hit_error_log_enabled';
const MAX_ENTRIES = 500;
function getStore() {
    if (typeof window === 'undefined') {
        // SSR: return empty store
        return {
            errors: [],
            enabled: true,
            listeners: new Set(),
            isProviderMounted: false,
        };
    }
    const win = window;
    if (!win[STORE_KEY]) {
        // Initialize store with data from sessionStorage
        let errors = [];
        let enabled = true;
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                errors = parsed.map((e) => ({
                    ...e,
                    timestamp: new Date(e.timestamp),
                }));
            }
            const enabledStored = sessionStorage.getItem(ENABLED_KEY);
            if (enabledStored !== null) {
                enabled = enabledStored === 'true';
            }
        }
        catch {
            // Ignore storage errors
        }
        win[STORE_KEY] = {
            errors,
            enabled,
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
        errors: [],
        enabled: true,
        listeners: new Set(),
        isProviderMounted: false,
    };
}
// =============================================================================
// STORE ACTIONS
// =============================================================================
function generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function storeLogError(entry) {
    const store = getStore();
    if (!store.enabled)
        return;
    const newEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date(),
        payload: entry.payload ? truncatePayload(entry.payload) : undefined,
    };
    store.errors = [newEntry, ...store.errors].slice(0, MAX_ENTRIES);
    // Persist to sessionStorage
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.errors));
    }
    catch {
        // Ignore
    }
    notifyListeners();
}
function storeClearErrors() {
    const store = getStore();
    store.errors = [];
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    }
    catch {
        // Ignore
    }
    notifyListeners();
}
function storeClearError(id) {
    const store = getStore();
    store.errors = store.errors.filter((e) => e.id !== id);
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.errors));
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
function storeExportErrors() {
    const store = getStore();
    return JSON.stringify(store.errors, null, 2);
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
 * Provider for global error logging.
 *
 * Wrap your app with this to enable error logging.
 *
 * @example
 * ```tsx
 * <ErrorLogProvider>
 *   <App />
 * </ErrorLogProvider>
 * ```
 */
export function ErrorLogProvider({ children }) {
    // Mark provider as mounted
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
 * Hook to access the global error log.
 *
 * Uses a global store pattern that works across module boundaries in monorepos.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { errors, logError, clearErrors } = useErrorLog();
 *
 *   const handleClick = async () => {
 *     try {
 *       await fetch('/api/data');
 *     } catch (e) {
 *       logError({
 *         status: 0,
 *         message: 'Network error',
 *         pageUrl: window.location.pathname,
 *         source: 'fetch',
 *       });
 *     }
 *   };
 * }
 * ```
 */
export function useErrorLog() {
    const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return useMemo(() => ({
        errors: store.errors,
        enabled: store.enabled,
        maxEntries: MAX_ENTRIES,
        // With the global-store implementation, ErrorLogProvider is optional.
        // We keep the field for callers/UI, but always report available on client.
        isProviderAvailable: typeof window !== 'undefined',
        logError: storeLogError,
        clearErrors: storeClearErrors,
        clearError: storeClearError,
        setEnabled: storeSetEnabled,
        exportErrors: storeExportErrors,
    }), [store.errors, store.enabled, store.isProviderMounted]);
}
/**
 * Hook to get current user email for error logging.
 * Reads from localStorage/cookie token.
 */
export function useCurrentUserEmail() {
    const [email, setEmail] = useState();
    useEffect(() => {
        const getEmail = () => {
            if (typeof window === 'undefined')
                return undefined;
            // Try to get token from cookie or localStorage
            let token = null;
            // Check cookie
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'hit_token' && value) {
                    token = value;
                    break;
                }
            }
            // Fall back to localStorage
            if (!token) {
                token = localStorage.getItem('hit_token');
            }
            if (!token)
                return undefined;
            try {
                const parts = token.split('.');
                if (parts.length !== 3)
                    return undefined;
                const payload = JSON.parse(atob(parts[1]));
                return payload.email || payload.sub;
            }
            catch {
                return undefined;
            }
        };
        setEmail(getEmail());
    }, []);
    return email;
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
        // Return truncated string representation
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
 * Get the current page URL safely
 */
export function getCurrentPageUrl() {
    if (typeof window === 'undefined')
        return 'unknown';
    return window.location.pathname + window.location.search;
}
//# sourceMappingURL=useErrorLog.js.map