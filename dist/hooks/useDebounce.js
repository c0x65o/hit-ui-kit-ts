'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
/**
 * Debounces a value - returns the value after it stops changing for `delay` ms.
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // Only fires when searchTerm stops changing for 300ms
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);
    return debouncedValue;
}
/**
 * Returns a debounced version of a callback function.
 * The callback will only execute after `delay` ms of inactivity.
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback((value: string) => {
 *   saveToServer(value);
 * }, 500);
 *
 * <input onChange={(e) => debouncedSave(e.target.value)} />
 * ```
 */
export function useDebouncedCallback(callback, delay) {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);
    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);
    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return debouncedCallback;
}
//# sourceMappingURL=useDebounce.js.map