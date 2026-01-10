import type { ReactNode } from 'react';
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
export declare function ErrorLogProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
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
export declare function useErrorLog(): ErrorLogState & ErrorLogActions;
/**
 * Hook to get current user email for error logging.
 * Reads from localStorage/cookie token.
 */
export declare function useCurrentUserEmail(): string | undefined;
/**
 * Get the current page URL safely
 */
export declare function getCurrentPageUrl(): string;
//# sourceMappingURL=useErrorLog.d.ts.map