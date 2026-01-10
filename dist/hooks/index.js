/**
 * UI Kit Hooks
 *
 * This module exports all UI Kit hooks for targeted imports.
 * Use `import { useAlertDialog } from '@hit/ui-kit/hooks'` for smaller bundles.
 */
export { useAlertDialog } from './useAlertDialog';
export { useTableView } from './useTableView';
export { useFormSubmit, parseError, parseResponseError } from './useFormSubmit';
export { ErrorLogProvider, useErrorLog, useCurrentUserEmail, getCurrentPageUrl, } from './useErrorLog';
export { useTrackedFetch, installGlobalFetchInterceptor } from './useTrackedFetch';
export { LatencyLogProvider, useLatencyLog, getCurrentPageUrl as getLatencyPageUrl, formatDuration, getLatencySeverity, } from './useLatencyLog';
export { useLatencyTrackedFetch, createLatencyTrackedFetch } from './useLatencyTrackedFetch';
export { useTableFilters } from './useTableFilters';
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useEntityResolver } from './useEntityResolver';
// Server-driven DataTable helpers
export { useServerDataTableState } from './useServerDataTableState';
//# sourceMappingURL=index.js.map