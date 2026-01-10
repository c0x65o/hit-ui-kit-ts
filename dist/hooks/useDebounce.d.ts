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
export declare function useDebounce<T>(value: T, delay: number): T;
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
export declare function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delay: number): T;
//# sourceMappingURL=useDebounce.d.ts.map