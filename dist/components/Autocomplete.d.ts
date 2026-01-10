export interface AutocompleteOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}
export interface AutocompleteProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    minQueryLength?: number;
    debounceMs?: number;
    limit?: number;
    onSearch: (query: string, limit: number) => Promise<AutocompleteOption[]>;
    resolveValue?: (value: string) => Promise<AutocompleteOption | null>;
    emptyMessage?: string;
    searchingMessage?: string;
    clearable?: boolean;
}
export declare function Autocomplete({ label, placeholder, value, onChange, disabled, required, minQueryLength, debounceMs, limit, onSearch, resolveValue, emptyMessage, searchingMessage, clearable, }: AutocompleteProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Autocomplete.d.ts.map