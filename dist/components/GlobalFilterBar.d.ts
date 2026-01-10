import type { GlobalFilterConfig } from '../types';
export interface GlobalFilterBarProps {
    filters: GlobalFilterConfig[];
    values: Record<string, string | string[]>;
    onChange: (values: Record<string, string | string[]>) => void;
    columns: Array<{
        key: string;
        label: string;
        filterType?: 'string' | 'number' | 'boolean' | 'date' | 'daterange' | 'select' | 'multiselect' | 'autocomplete';
        filterOptions?: Array<{
            value: string;
            label: string;
            sortOrder?: number;
        }>;
        onSearch?: (query: string, limit: number) => Promise<Array<{
            value: string;
            label: string;
            description?: string;
        }>>;
        resolveValue?: (value: string) => Promise<{
            value: string;
            label: string;
            description?: string;
        } | null>;
    }>;
}
/**
 * GlobalFilterBar - Renders a horizontal bar of filter controls
 *
 * Supports multiple filter types:
 * - string: text input with search icon
 * - number: number input
 * - date: single date picker
 * - daterange: from/to date pickers
 * - select: single select dropdown
 * - multiselect: multi-select dropdown
 * - autocomplete: autocomplete with search
 * - boolean: yes/no select
 */
export declare function GlobalFilterBar({ filters, values, onChange, columns }: GlobalFilterBarProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=GlobalFilterBar.d.ts.map