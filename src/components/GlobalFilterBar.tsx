'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Input } from './Input';
import { Select } from './Select';
import { Autocomplete } from './Autocomplete';
import type { GlobalFilterConfig } from '../types';

export interface GlobalFilterBarProps {
  filters: GlobalFilterConfig[];
  values: Record<string, string | string[]>;
  onChange: (values: Record<string, string | string[]>) => void;
  columns: Array<{
    key: string;
    label: string;
    filterType?: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'autocomplete';
    filterOptions?: Array<{ value: string; label: string; sortOrder?: number }>;
    onSearch?: (query: string, limit: number) => Promise<Array<{ value: string; label: string; description?: string }>>;
    resolveValue?: (value: string) => Promise<{ value: string; label: string; description?: string } | null>;
  }>;
}

/**
 * GlobalFilterBar - Renders a horizontal bar of filter controls
 * 
 * Supports multiple filter types:
 * - string: text input
 * - number: number input
 * - date: date input
 * - select: single select dropdown
 * - multiselect: multi-select dropdown
 * - autocomplete: autocomplete with search
 * - boolean: yes/no select
 */
export function GlobalFilterBar({ filters, values, onChange, columns }: GlobalFilterBarProps) {
  const { colors, spacing, radius, textStyles: ts } = useThemeTokens();
  const [localValues, setLocalValues] = useState<Record<string, string | string[]>>(values);

  // Sync external values
  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const updateFilter = (columnKey: string, value: string | string[]) => {
    const next = { ...localValues };
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      delete next[columnKey];
    } else {
      next[columnKey] = value;
    }
    setLocalValues(next);
    onChange(next);
  };

  const getColumnConfig = (filter: GlobalFilterConfig) => {
    const col = columns.find((c) => c.key === filter.columnKey);
    return {
      label: filter.label || col?.label || filter.columnKey,
      filterType: filter.filterType || col?.filterType || 'string',
      filterOptions: filter.filterOptions || col?.filterOptions || [],
      onSearch: filter.onSearch || col?.onSearch,
      resolveValue: filter.resolveValue || col?.resolveValue,
    };
  };

  const renderFilter = (filter: GlobalFilterConfig) => {
    const config = getColumnConfig(filter);
    const currentValue = localValues[filter.columnKey];
    const key = filter.columnKey;

    // String filter
    if (config.filterType === 'string') {
      return (
        <div key={key} style={{ minWidth: '200px', maxWidth: '300px' }}>
          <Input
            label={config.label}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => updateFilter(key, value)}
            placeholder={`Filter by ${config.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    // Number filter
    if (config.filterType === 'number') {
      return (
        <div key={key} style={{ minWidth: '150px', maxWidth: '200px' }}>
          <Input
            label={config.label}
            type="number"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => updateFilter(key, value)}
            placeholder={`Filter by ${config.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    // Date filter
    if (config.filterType === 'date') {
      return (
        <div key={key} style={{ minWidth: '150px', maxWidth: '200px' }}>
          <Input
            label={config.label}
            type="date"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => updateFilter(key, value)}
          />
        </div>
      );
    }

    // Boolean filter
    if (config.filterType === 'boolean') {
      return (
        <div key={key} style={{ minWidth: '150px', maxWidth: '200px' }}>
          <Select
            label={config.label}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => updateFilter(key, value)}
            options={[
              { value: '', label: 'All' },
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            placeholder="Select..."
          />
        </div>
      );
    }

    // Select filter
    if (config.filterType === 'select') {
      const options = [
        { value: '', label: 'All' },
        ...config.filterOptions.map((opt) => ({
          value: opt.value,
          label: opt.label,
        })),
      ];
      return (
        <div key={key} style={{ minWidth: '180px', maxWidth: '250px' }}>
          <Select
            label={config.label}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => updateFilter(key, value)}
            options={options}
            placeholder={`Select ${config.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    // Multiselect filter
    if (config.filterType === 'multiselect') {
      const selectedValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
      return (
        <div key={key} style={{ minWidth: '200px', maxWidth: '300px' }}>
          <div style={{ marginBottom: spacing.xs }}>
            <label
              style={styles({
                display: 'block',
                fontSize: ts.label.fontSize,
                fontWeight: ts.label.fontWeight,
                color: colors.text.primary,
                marginBottom: spacing.xs,
              })}
            >
              {config.label}
            </label>
            {selectedValues.length > 0 && (
              <div style={styles({ display: 'flex', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs })}>
                {selectedValues.map((val) => {
                  const opt = config.filterOptions.find((o) => o.value === val);
                  return (
                    <div
                      key={val}
                      style={styles({
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.bg.muted,
                        borderRadius: radius.sm,
                        fontSize: ts.bodySmall.fontSize,
                      })}
                    >
                      <span>{opt?.label || val}</span>
                      <button
                        onClick={() => {
                          const next = selectedValues.filter((v) => v !== val);
                          updateFilter(key, next);
                        }}
                        style={styles({
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          color: colors.text.muted,
                        })}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Select
            value=""
            onChange={(value) => {
              if (value && !selectedValues.includes(value)) {
                updateFilter(key, [...selectedValues, value]);
              }
            }}
            options={config.filterOptions
              .filter((opt) => !selectedValues.includes(opt.value))
              .map((opt) => ({ value: opt.value, label: opt.label }))}
            placeholder={`Add ${config.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    // Autocomplete filter
    if (config.filterType === 'autocomplete') {
      if (!config.onSearch) {
        // Fallback to select if no search function provided
        return (
          <div key={key} style={{ minWidth: '200px', maxWidth: '300px' }}>
            <Select
              label={config.label}
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(value) => updateFilter(key, value)}
              options={[
                { value: '', label: 'All' },
                ...config.filterOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
              placeholder={`Select ${config.label.toLowerCase()}...`}
            />
          </div>
        );
      }
      return (
        <div key={key} style={{ minWidth: '200px', maxWidth: '300px' }}>
          <Autocomplete
            label={config.label}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => updateFilter(key, value)}
            onSearch={config.onSearch}
            resolveValue={config.resolveValue}
            placeholder={`Search ${config.label.toLowerCase()}...`}
            clearable
          />
        </div>
      );
    }

    return null;
  };

  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <div
      style={styles({
        display: 'flex',
        gap: spacing.md,
        alignItems: 'flex-start',
        padding: spacing.md,
        backgroundColor: colors.bg.elevated,
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: radius.md,
        flexWrap: 'wrap',
      })}
    >
      {filters.map((filter) => renderFilter(filter))}
      {Object.keys(localValues).length > 0 && (
        <div style={styles({ display: 'flex', alignItems: 'flex-end', paddingBottom: spacing.xs })}>
          <button
            onClick={() => {
              setLocalValues({});
              onChange({});
            }}
            style={styles({
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              borderRadius: radius.sm,
              color: colors.text.secondary,
              cursor: 'pointer',
              fontSize: ts.bodySmall.fontSize,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            })}
          >
            <X size={14} />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
