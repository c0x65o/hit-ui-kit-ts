'use client';
import { useState, useCallback, useRef } from 'react';
import { useErrorLog, useCurrentUserEmail, getCurrentPageUrl } from './useErrorLog';
/**
 * Parse an error response from an API call.
 * Handles various error formats from different API frameworks.
 */
function parseError(error) {
    // Handle Error objects
    if (error instanceof Error) {
        return { message: error.message };
    }
    // Handle response-like objects (from fetch)
    if (typeof error === 'object' && error !== null) {
        const errObj = error;
        // Check for status code
        const status = typeof errObj.status === 'number'
            ? errObj.status
            : typeof errObj.statusCode === 'number'
                ? errObj.statusCode
                : undefined;
        // Check for error message in various formats
        let message = 'An error occurred';
        let fieldErrors;
        // Handle { error: string } format
        if (typeof errObj.error === 'string') {
            message = errObj.error;
        }
        // Handle { message: string } format
        else if (typeof errObj.message === 'string') {
            message = errObj.message;
        }
        // Handle { detail: string } format (FastAPI)
        else if (typeof errObj.detail === 'string') {
            message = errObj.detail;
        }
        // Handle Pydantic validation errors { detail: Array<{loc, msg, type}> }
        else if (Array.isArray(errObj.detail)) {
            const errors = errObj.detail;
            fieldErrors = {};
            const messages = [];
            for (const err of errors) {
                const msg = err.msg || err.message || 'Invalid value';
                if (Array.isArray(err.loc) && err.loc.length > 1) {
                    // Field-specific error (skip 'body' prefix)
                    const fieldPath = err.loc.slice(1).join('.');
                    fieldErrors[fieldPath] = msg;
                }
                else {
                    messages.push(msg);
                }
            }
            message = messages.length > 0 ? messages.join('. ') : 'Validation failed';
        }
        // Handle { errors: Record<string, string> } format
        else if (typeof errObj.errors === 'object' && errObj.errors !== null) {
            fieldErrors = errObj.errors;
            message = 'Please fix the errors below';
        }
        return { message, fieldErrors, status };
    }
    // Handle string errors
    if (typeof error === 'string') {
        return { message: error };
    }
    return { message: 'An unexpected error occurred' };
}
/**
 * Parse an error from a fetch Response.
 */
async function parseResponseError(response) {
    const status = response.status;
    try {
        const data = await response.json();
        const parsed = parseError(data);
        return { ...parsed, status };
    }
    catch {
        // JSON parse failed, use status text
        return {
            message: response.statusText || `Request failed with status ${status}`,
            status,
        };
    }
}
/**
 * Hook for handling form submissions with proper error handling.
 *
 * Provides loading state, error parsing, and field-level error support.
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { Alert, Button, Input } = useUi();
 *   const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();
 *
 *   const [name, setName] = useState('');
 *
 *   const validate = () => {
 *     const errors: Record<string, string> = {};
 *     if (!name.trim()) errors.name = 'Name is required';
 *     setFieldErrors(errors);
 *     return Object.keys(errors).length === 0;
 *   };
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     if (!validate()) return;
 *
 *     await submit(async () => {
 *       const res = await fetch('/api/items', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ name }),
 *       });
 *       if (!res.ok) throw res;
 *       return res.json();
 *     });
 *
 *     // Navigate on success
 *     navigate('/items');
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && (
 *         <Alert variant="error" title="Error" onDismiss={clearError}>
 *           {error.message}
 *         </Alert>
 *       )}
 *
 *       <Input
 *         label="Name"
 *         value={name}
 *         onChange={(v) => { setName(v); clearFieldError('name'); }}
 *         error={fieldErrors.name}
 *       />
 *
 *       <Button type="submit" disabled={submitting}>
 *         {submitting ? 'Saving...' : 'Save'}
 *       </Button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useFormSubmit(options = {}) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setErrorState] = useState(null);
    const [fieldErrors, setFieldErrorsState] = useState({});
    // Global error logging
    const { logError } = useErrorLog();
    const userEmail = useCurrentUserEmail();
    const clearError = useCallback(() => {
        setErrorState(null);
    }, []);
    const setError = useCallback((err) => {
        if (typeof err === 'string') {
            setErrorState({ message: err });
        }
        else {
            setErrorState(err);
            if (err.fieldErrors) {
                setFieldErrorsState((prev) => ({ ...prev, ...err.fieldErrors }));
            }
        }
    }, []);
    const setFieldErrors = useCallback((errors) => {
        setFieldErrorsState(errors);
    }, []);
    const clearFieldError = useCallback((field) => {
        setFieldErrorsState((prev) => {
            if (!(field in prev))
                return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);
    // Track timing for requests
    const startTimeRef = useRef(0);
    const submit = useCallback(async (fn) => {
        setSubmitting(true);
        setErrorState(null);
        startTimeRef.current = Date.now();
        try {
            const result = await fn();
            options.onSuccess?.();
            return result;
        }
        catch (err) {
            const responseTimeMs = Date.now() - startTimeRef.current;
            let parsed;
            let endpoint;
            let method;
            // Handle fetch Response objects
            if (err instanceof Response) {
                parsed = await parseResponseError(err);
                endpoint = err.url;
                // Try to get method from response (not directly available, but we can infer)
            }
            else {
                parsed = parseError(err);
                // Try to extract endpoint from error object
                if (typeof err === 'object' && err !== null) {
                    const errObj = err;
                    endpoint = typeof errObj.url === 'string' ? errObj.url : undefined;
                    method = typeof errObj.method === 'string' ? errObj.method : undefined;
                }
            }
            // Log error to global store
            logError({
                userEmail,
                pageUrl: getCurrentPageUrl(),
                status: parsed.status || 0,
                message: parsed.message,
                endpoint,
                method,
                responseTimeMs,
                fieldErrors: parsed.fieldErrors,
                rawError: err instanceof Error ? { name: err.name, message: err.message } : err,
                source: 'form',
            });
            // Merge any field errors from the API
            if (parsed.fieldErrors) {
                setFieldErrorsState((prev) => ({ ...prev, ...parsed.fieldErrors }));
            }
            setErrorState(parsed);
            options.onError?.(parsed);
            return undefined;
        }
        finally {
            setSubmitting(false);
        }
    }, [options, logError, userEmail]);
    return {
        submitting,
        error,
        fieldErrors,
        submit,
        clearError,
        setError,
        setFieldErrors,
        clearFieldError,
    };
}
export { parseError, parseResponseError };
//# sourceMappingURL=useFormSubmit.js.map