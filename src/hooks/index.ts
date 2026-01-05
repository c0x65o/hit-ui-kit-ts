/**
 * UI Kit Hooks
 * 
 * This module exports all UI Kit hooks for targeted imports.
 * Use `import { useAlertDialog } from '@hit/ui-kit/hooks'` for smaller bundles.
 */

export { useAlertDialog } from './useAlertDialog';
export type { AlertDialogOptions, AlertDialogState } from './useAlertDialog';

export { useTableView } from './useTableView';
export type { TableView, TableViewFilter, TableViewShare } from './useTableView';

export { useFormSubmit, parseError, parseResponseError } from './useFormSubmit';
export type {
  ParsedFormError,
  FormSubmitState,
  FormSubmitActions,
  UseFormSubmitOptions,
} from './useFormSubmit';

export {
  ErrorLogProvider,
  useErrorLog,
  useCurrentUserEmail,
  getCurrentPageUrl,
} from './useErrorLog';
export type { ErrorLogEntry, ErrorLogState, ErrorLogActions } from './useErrorLog';

export { useTrackedFetch, installGlobalFetchInterceptor } from './useTrackedFetch';
export type { TrackedFetchOptions } from './useTrackedFetch';

export {
  LatencyLogProvider,
  useLatencyLog,
  getCurrentPageUrl as getLatencyPageUrl,
  formatDuration,
  getLatencySeverity,
} from './useLatencyLog';
export type {
  LatencyLogEntry,
  LatencyLogState,
  LatencyLogActions,
  LatencySource,
} from './useLatencyLog';

export { useLatencyTrackedFetch, createLatencyTrackedFetch } from './useLatencyTrackedFetch';
export type { LatencyTrackedFetchOptions, LatencyTrackerConfig } from './useLatencyTrackedFetch';
