'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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
// CONTEXT
// =============================================================================

const ErrorLogContext = createContext<(ErrorLogState & ErrorLogActions) | null>(null);

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEY = 'hit_error_log';
const ENABLED_KEY = 'hit_error_log_enabled';
const MAX_ENTRIES = 500;

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
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [enabled, setEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const entries = parsed.map((e: ErrorLogEntry) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
        setErrors(entries);
      }
      const enabledStored = sessionStorage.getItem(ENABLED_KEY);
      if (enabledStored !== null) {
        setEnabledState(enabledStored === 'true');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist to sessionStorage on change
  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
    } catch {
      // Ignore storage errors
    }
  }, [errors, mounted]);

  const generateId = useCallback(() => {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  const logError = useCallback(
    (entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>) => {
      if (!enabled) return;

      const newEntry: ErrorLogEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date(),
        // Truncate large payloads
        payload: entry.payload ? truncatePayload(entry.payload) : undefined,
      };

      setErrors((prev) => {
        const updated = [newEntry, ...prev];
        // Keep only max entries
        return updated.slice(0, MAX_ENTRIES);
      });
    },
    [enabled, generateId]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      sessionStorage.setItem(ENABLED_KEY, String(value));
    } catch {
      // Ignore
    }
  }, []);

  const exportErrors = useCallback(() => {
    return JSON.stringify(errors, null, 2);
  }, [errors]);

  const value = useMemo(
    () => ({
      errors,
      enabled,
      maxEntries: MAX_ENTRIES,
      logError,
      clearErrors,
      clearError,
      setEnabled,
      exportErrors,
    }),
    [errors, enabled, logError, clearErrors, clearError, setEnabled, exportErrors]
  );

  return <ErrorLogContext.Provider value={value}>{children}</ErrorLogContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the global error log.
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
  const context = useContext(ErrorLogContext);
  if (!context) {
    // Return a no-op version if not wrapped in provider
    // This allows the hook to work without strict provider requirements
    return {
      errors: [],
      enabled: false,
      maxEntries: 0,
      logError: () => {},
      clearErrors: () => {},
      clearError: () => {},
      setEnabled: () => {},
      exportErrors: () => '[]',
    };
  }
  return context;
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
