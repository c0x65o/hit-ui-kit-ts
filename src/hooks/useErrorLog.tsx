'use client';

import React, { useState, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Logged error entry with full context
 */
export interface ErrorLogEntry {
  /** Unique ID for the error entry */
  id: string;
  /** Timestamp when the error occurred */
  timestamp: Date;
  /** User email if available */
  userEmail?: string;
  /** Page/URL where error occurred */
  pageUrl: string;
  /** HTTP status code (0 for network errors) */
  status: number;
  /** Human-readable error message */
  message: string;
  /** API endpoint that failed */
  endpoint?: string;
  /** HTTP method */
  method?: string;
  /** Request payload (truncated for large payloads) */
  payload?: unknown;
  /** Response time in ms (if available) */
  responseTimeMs?: number;
  /** Raw error details for debugging */
  rawError?: unknown;
  /** Field-level errors if validation error */
  fieldErrors?: Record<string, string>;
  /** Source of the error (form, fetch, etc.) */
  source: 'form' | 'fetch' | 'manual';
}

/**
 * Error log state
 */
export interface ErrorLogState {
  /** All logged errors (most recent first) */
  errors: ErrorLogEntry[];
  /** Whether error logging is enabled */
  enabled: boolean;
  /** Maximum number of errors to keep */
  maxEntries: number;
  /** Whether the provider context is available (false = fallback/no-op mode) */
  isProviderAvailable: boolean;
}

/**
 * Error log actions
 */
export interface ErrorLogActions {
  /** Log a new error */
  logError: (entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear a specific error by ID */
  clearError: (id: string) => void;
  /** Toggle logging on/off */
  setEnabled: (enabled: boolean) => void;
  /** Export errors as JSON */
  exportErrors: () => string;
}

// =============================================================================
// GLOBAL STORE (bypasses React Context for cross-module compatibility)
// =============================================================================

const STORE_KEY = '__HIT_ERROR_LOG_STORE__';
const STORAGE_KEY = 'hit_error_log';
const ENABLED_KEY = 'hit_error_log_enabled';
const MAX_ENTRIES = 500;

interface ErrorLogStore {
  errors: ErrorLogEntry[];
  enabled: boolean;
  listeners: Set<() => void>;
  isProviderMounted: boolean;
}

function getStore(): ErrorLogStore {
  if (typeof window === 'undefined') {
    // SSR: return empty store
    return {
      errors: [],
      enabled: true,
      listeners: new Set(),
      isProviderMounted: false,
    };
  }

  const win = window as unknown as Record<string, unknown>;
  if (!win[STORE_KEY]) {
    // Initialize store with data from sessionStorage
    let errors: ErrorLogEntry[] = [];
    let enabled = true;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        errors = parsed.map((e: ErrorLogEntry) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }
      const enabledStored = sessionStorage.getItem(ENABLED_KEY);
      if (enabledStored !== null) {
        enabled = enabledStored === 'true';
      }
    } catch {
      // Ignore storage errors
    }

    win[STORE_KEY] = {
      errors,
      enabled,
      listeners: new Set<() => void>(),
      isProviderMounted: false,
    };
  }

  return win[STORE_KEY] as ErrorLogStore;
}

function notifyListeners() {
  const store = getStore();
  store.listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function getSnapshot(): ErrorLogStore {
  return getStore();
}

function getServerSnapshot(): ErrorLogStore {
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

function generateId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function storeLogError(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>): void {
  const store = getStore();
  if (!store.enabled) return;

  const newEntry: ErrorLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date(),
    payload: entry.payload ? truncatePayload(entry.payload) : undefined,
  };

  store.errors = [newEntry, ...store.errors].slice(0, MAX_ENTRIES);

  // Persist to sessionStorage
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.errors));
  } catch {
    // Ignore
  }

  notifyListeners();
}

function storeClearErrors(): void {
  const store = getStore();
  store.errors = [];
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  notifyListeners();
}

function storeClearError(id: string): void {
  const store = getStore();
  store.errors = store.errors.filter((e) => e.id !== id);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.errors));
  } catch {
    // Ignore
  }
  notifyListeners();
}

function storeSetEnabled(enabled: boolean): void {
  const store = getStore();
  store.enabled = enabled;
  try {
    sessionStorage.setItem(ENABLED_KEY, String(enabled));
  } catch {
    // Ignore
  }
  notifyListeners();
}

function storeExportErrors(): string {
  const store = getStore();
  return JSON.stringify(store.errors, null, 2);
}

function storeSetProviderMounted(mounted: boolean): void {
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
export function ErrorLogProvider({ children }: { children: ReactNode }) {
  // Mark provider as mounted
  useEffect(() => {
    storeSetProviderMounted(true);
    return () => {
      storeSetProviderMounted(false);
    };
  }, []);

  return <>{children}</>;
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
export function useErrorLog(): ErrorLogState & ErrorLogActions {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => ({
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
    }),
    [store.errors, store.enabled, store.isProviderMounted]
  );
}

/**
 * Hook to get current user email for error logging.
 * Reads from localStorage/cookie token.
 */
export function useCurrentUserEmail(): string | undefined {
  const [email, setEmail] = useState<string>();

  useEffect(() => {
    const getEmail = () => {
      if (typeof window === 'undefined') return undefined;

      // Try to get token from cookie or localStorage
      let token: string | null = null;

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

      if (!token) return undefined;

      try {
        const parts = token.split('.');
        if (parts.length !== 3) return undefined;
        const payload = JSON.parse(atob(parts[1]));
        return payload.email || payload.sub;
      } catch {
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
function truncatePayload(payload: unknown, maxLength = 2000): unknown {
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
  } catch {
    return { _error: 'Could not serialize payload' };
  }
}

/**
 * Get the current page URL safely
 */
export function getCurrentPageUrl(): string {
  if (typeof window === 'undefined') return 'unknown';
  return window.location.pathname + window.location.search;
}
