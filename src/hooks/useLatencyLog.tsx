'use client';

import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

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
  logLatency: (entry: Omit<LatencyLogEntry, 'id' | 'timestamp' | 'isSlow'> & { isSlow?: boolean }) => void;
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

// =============================================================================
// GLOBAL STORE (bypasses React Context for cross-module compatibility)
// =============================================================================

const STORE_KEY = '__HIT_LATENCY_LOG_STORE__';
const STORAGE_KEY = 'hit_latency_log';
const ENABLED_KEY = 'hit_latency_log_enabled';
const THRESHOLD_KEY = 'hit_latency_slow_threshold';
const MAX_ENTRIES = 1000;
const DEFAULT_SLOW_THRESHOLD_MS = 500;

interface LatencyLogStore {
  entries: LatencyLogEntry[];
  enabled: boolean;
  slowThresholdMs: number;
  listeners: Set<() => void>;
  isProviderMounted: boolean;
}

function getStore(): LatencyLogStore {
  if (typeof window === 'undefined') {
    return {
      entries: [],
      enabled: true,
      slowThresholdMs: DEFAULT_SLOW_THRESHOLD_MS,
      listeners: new Set(),
      isProviderMounted: false,
    };
  }

  const win = window as unknown as Record<string, unknown>;
  if (!win[STORE_KEY]) {
    let entries: LatencyLogEntry[] = [];
    let enabled = true;
    let slowThresholdMs = DEFAULT_SLOW_THRESHOLD_MS;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        entries = parsed.map((e: LatencyLogEntry) => ({
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
    } catch {
      // Ignore storage errors
    }

    win[STORE_KEY] = {
      entries,
      enabled,
      slowThresholdMs,
      listeners: new Set<() => void>(),
      isProviderMounted: false,
    };
  }

  return win[STORE_KEY] as LatencyLogStore;
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

function getSnapshot(): LatencyLogStore {
  return getStore();
}

function getServerSnapshot(): LatencyLogStore {
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

function generateId(): string {
  return `lat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function storeLogLatency(entry: Omit<LatencyLogEntry, 'id' | 'timestamp' | 'isSlow'> & { isSlow?: boolean }): void {
  const store = getStore();
  if (!store.enabled) return;

  const isSlow = entry.isSlow ?? entry.durationMs >= store.slowThresholdMs;

  const newEntry: LatencyLogEntry = {
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
  } catch {
    // Ignore
  }

  notifyListeners();
}

function storeClearEntries(): void {
  const store = getStore();
  store.entries = [];
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  notifyListeners();
}

function storeClearEntry(id: string): void {
  const store = getStore();
  store.entries = store.entries.filter((e) => e.id !== id);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.entries));
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

function storeSetSlowThreshold(ms: number): void {
  const store = getStore();
  store.slowThresholdMs = ms;
  try {
    sessionStorage.setItem(THRESHOLD_KEY, String(ms));
  } catch {
    // Ignore
  }
  notifyListeners();
}

function storeExportEntries(): string {
  const store = getStore();
  return JSON.stringify(store.entries, null, 2);
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
 * Provider for global latency logging.
 */
export function LatencyLogProvider({ children }: { children: ReactNode }) {
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
 * Hook to access the global latency log.
 */
export function useLatencyLog(): LatencyLogState & LatencyLogActions {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => ({
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
    }),
    [store.entries, store.enabled, store.slowThresholdMs, store.isProviderMounted]
  );
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
 * Get current page URL safely
 */
export function getCurrentPageUrl(): string {
  if (typeof window === 'undefined') return 'unknown';
  return window.location.pathname + window.location.search;
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Classify latency by severity
 */
export function getLatencySeverity(ms: number, threshold: number): 'fast' | 'normal' | 'slow' | 'critical' {
  if (ms < threshold * 0.5) return 'fast';
  if (ms < threshold) return 'normal';
  if (ms < threshold * 3) return 'slow';
  return 'critical';
}
