/**
 * Error parsing result from API responses.
 */
export interface ParsedFormError {
    /** General form-level error message */
    message: string;
    /** Field-specific errors keyed by field name */
    fieldErrors?: Record<string, string>;
    /** HTTP status code if available */
    status?: number;
}
/**
 * State returned by the useFormSubmit hook.
 */
export interface FormSubmitState {
    /** Whether a submission is in progress */
    submitting: boolean;
    /** The current form error (null if no error) */
    error: ParsedFormError | null;
    /** Field-specific errors for convenience */
    fieldErrors: Record<string, string>;
}
/**
 * Actions returned by the useFormSubmit hook.
 */
export interface FormSubmitActions<T = unknown> {
    /** Submit the form with the provided async function */
    submit: (fn: () => Promise<T>) => Promise<T | undefined>;
    /** Clear the current error */
    clearError: () => void;
    /** Set a custom error */
    setError: (error: ParsedFormError | string) => void;
    /** Set field-specific errors */
    setFieldErrors: (errors: Record<string, string>) => void;
    /** Clear a specific field error */
    clearFieldError: (field: string) => void;
}
/**
 * Options for useFormSubmit hook.
 */
export interface UseFormSubmitOptions {
    /** Callback when submission succeeds */
    onSuccess?: () => void;
    /** Callback when submission fails */
    onError?: (error: ParsedFormError) => void;
}
/**
 * Parse an error response from an API call.
 * Handles various error formats from different API frameworks.
 */
declare function parseError(error: unknown): ParsedFormError;
/**
 * Parse an error from a fetch Response.
 */
declare function parseResponseError(response: Response): Promise<ParsedFormError>;
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
export declare function useFormSubmit<T = unknown>(options?: UseFormSubmitOptions): FormSubmitState & FormSubmitActions<T>;
export { parseError, parseResponseError };
//# sourceMappingURL=useFormSubmit.d.ts.map