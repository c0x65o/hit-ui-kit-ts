'use client';

import { useCallback, useRef } from 'react';
import { useErrorLog, useCurrentUserEmail, getCurrentPageUrl } from './useErrorLog';

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
export function useTrackedFetch() {
  const { logError } = useErrorLog();
  const userEmail = useCurrentUserEmail();
  const startTimeRef = useRef<Map<string, number>>(new Map());

  const trackedFetch = useCallback(
    async (
      input: RequestInfo | URL,
      init?: TrackedFetchOptions
    ): Promise<Response> => {
      const { skipLogging, ...fetchInit } = init || {};
      const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const startTime = Date.now();
      startTimeRef.current.set(requestId, startTime);

      // Extract URL and method for logging
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = fetchInit?.method || 'GET';

      try {
        const response = await fetch(input, fetchInit);
        const responseTimeMs = Date.now() - (startTimeRef.current.get(requestId) || startTime);
        startTimeRef.current.delete(requestId);

        // Log non-2xx responses
        if (!response.ok && !skipLogging) {
          // Clone response to read body without consuming it
          const clonedResponse = response.clone();
          let message = `Request failed with status ${response.status}`;
          let rawError: unknown = undefined;

          try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const errorData = await clonedResponse.json();
              message = extractErrorMessage(errorData) || message;
              rawError = errorData;
            } else {
              const text = await clonedResponse.text();
              if (text) {
                message = text.slice(0, 500);
                rawError = { text };
              }
            }
          } catch {
            // Ignore body parsing errors
          }

          logError({
            userEmail,
            pageUrl: getCurrentPageUrl(),
            status: response.status,
            message,
            endpoint: url,
            method,
            payload: extractPayload(fetchInit?.body),
            responseTimeMs,
            rawError,
            source: 'fetch',
          });
        }

        return response;
      } catch (error) {
        const responseTimeMs = Date.now() - (startTimeRef.current.get(requestId) || startTime);
        startTimeRef.current.delete(requestId);

        // Log network errors (status 0)
        if (!skipLogging) {
          logError({
            userEmail,
            pageUrl: getCurrentPageUrl(),
            status: 0,
            message: error instanceof Error ? error.message : 'Network error',
            endpoint: url,
            method,
            payload: extractPayload(fetchInit?.body),
            responseTimeMs,
            rawError: error instanceof Error ? { name: error.name, message: error.message } : error,
            source: 'fetch',
          });
        }

        throw error;
      }
    },
    [logError, userEmail]
  );

  return { trackedFetch };
}

/**
 * Extract error message from various API response formats
 */
function extractErrorMessage(data: unknown): string | null {
  if (typeof data === 'string') return data;
  if (typeof data !== 'object' || data === null) return null;

  const obj = data as Record<string, unknown>;

  // Common error message fields
  if (typeof obj.error === 'string') return obj.error;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.detail === 'string') return obj.detail;

  // Pydantic validation errors
  if (Array.isArray(obj.detail)) {
    const messages = obj.detail
      .map((err: unknown) => {
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err !== null) {
          const e = err as Record<string, unknown>;
          return e.msg || e.message || null;
        }
        return null;
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join('; ');
  }

  return null;
}

/**
 * Extract and truncate request payload for logging
 */
function extractPayload(body: BodyInit | null | undefined): unknown {
  if (!body) return undefined;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body.length > 500 ? body.slice(0, 500) + '...' : body;
    }
  }

  if (body instanceof FormData) {
    const obj: Record<string, unknown> = {};
    body.forEach((value, key) => {
      obj[key] = value instanceof File ? `[File: ${value.name}]` : value;
    });
    return obj;
  }

  if (body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries());
  }

  return { _type: body.constructor?.name || 'unknown' };
}

/**
 * Create a global fetch interceptor.
 * 
 * Call this once at app initialization to intercept ALL fetch calls globally.
 * This is optional - use useTrackedFetch for more control.
 * 
 * @example
 * ```tsx
 * // In your app initialization
 * import { installGlobalFetchInterceptor } from '@hit/ui-kit';
 * 
 * installGlobalFetchInterceptor({
 *   getLogError: () => window.__HIT_LOG_ERROR__,
 *   getUserEmail: () => window.__HIT_USER_EMAIL__,
 * });
 * ```
 */
export function installGlobalFetchInterceptor(options: {
  getLogError: () => ((entry: Parameters<ReturnType<typeof useErrorLog>['logError']>[0]) => void) | undefined;
  getUserEmail: () => string | undefined;
  shouldIntercept?: (url: string, init?: RequestInit) => boolean;
}) {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    
    // Check if we should intercept this request
    if (options.shouldIntercept && !options.shouldIntercept(url, init)) {
      return originalFetch(input, init);
    }

    const method = init?.method || 'GET';
    const startTime = Date.now();

    try {
      const response = await originalFetch(input, init);
      const responseTimeMs = Date.now() - startTime;

      // Log non-2xx responses
      if (!response.ok) {
        const logError = options.getLogError();
        if (logError) {
          // Clone response to read body without consuming it
          const clonedResponse = response.clone();
          let message = `Request failed with status ${response.status}`;
          let rawError: unknown = undefined;

          try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const errorData = await clonedResponse.json();
              message = extractErrorMessage(errorData) || message;
              rawError = errorData;
            }
          } catch {
            // Ignore body parsing errors
          }

          logError({
            userEmail: options.getUserEmail(),
            pageUrl: getCurrentPageUrl(),
            status: response.status,
            message,
            endpoint: url,
            method,
            payload: extractPayload(init?.body),
            responseTimeMs,
            rawError,
            source: 'fetch',
          });
        }
      }

      return response;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const logError = options.getLogError();

      if (logError) {
        logError({
          userEmail: options.getUserEmail(),
          pageUrl: getCurrentPageUrl(),
          status: 0,
          message: error instanceof Error ? error.message : 'Network error',
          endpoint: url,
          method,
          payload: extractPayload(init?.body),
          responseTimeMs,
          rawError: error instanceof Error ? { name: error.name, message: error.message } : error,
          source: 'fetch',
        });
      }

      throw error;
    }
  };

  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
  };
}
