'use client';

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
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
    filterType?: 'string' | 'number' | 'boolean' | 'date' | 'daterange' | 'select' | 'multiselect' | 'autocomplete';
    filterOptions?: Array<{ value: string; label: string; sortOrder?: number }>;
    onSearch?: (query: string, limit: number) => Promise<Array<{ value: string; label: string; description?: string }>>;
    resolveValue?: (value: string) => Promise<{ value: string; label: string; description?: string } | null>;
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
export function GlobalFilterBar({ filters, values, onChange, columns }: GlobalFilterBarProps) {
  const { colors, spacing, radius, textStyles: ts, componentSpacing } = useThemeTokens();
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

  // Compact input styling
  const inputStyle = styles({
    height: '36px',
    padding: `0 ${spacing.sm}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border.default}`,
    borderRadius: radius.sm,
    color: colors.text.primary,
    fontSize: ts.body.fontSize,
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  });

  const labelStyle = styles({
    display: 'block',
    fontSize: '11px',
    fontWeight: '500',
    color: colors.text.muted,
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  });

  const renderFilter = (filter: GlobalFilterConfig) => {
    const config = getColumnConfig(filter);
    const currentValue = localValues[filter.columnKey];
    const key = filter.columnKey;

    // String filter with search icon
    if (config.filterType === 'string') {
      return (
        <div key={key} style={{ minWidth: '160px', flex: '1 1 160px', maxWidth: '220px' }}>
          <label style={labelStyle}>{config.label}</label>
          <div style={{ position: 'relative' }}>
            <Search 
              size={14} 
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.text.muted,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e) => updateFilter(key, e.target.value)}
              placeholder={`Search...`}
              style={{
                ...inputStyle,
                paddingLeft: '32px',
              }}
            />
          </div>
        </div>
      );
    }

    // Number filter
    if (config.filterType === 'number') {
      return (
        <div key={key} style={{ minWidth: '100px', flex: '0 1 120px' }}>
          <label style={labelStyle}>{config.label}</label>
          <input
            type="number"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => updateFilter(key, e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </div>
      );
    }

    // Date filter (single)
    if (config.filterType === 'date') {
      return (
        <div key={key} style={{ minWidth: '140px', flex: '0 1 160px' }}>
          <label style={labelStyle}>{config.label}</label>
          <input
            type="date"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => updateFilter(key, e.target.value)}
            style={inputStyle}
          />
        </div>
      );
    }

    // Date range filter (from/to)
    if (config.filterType === 'daterange') {
      const rangeValue = typeof currentValue === 'string' ? currentValue : '';
      const [fromDate, toDate] = rangeValue.split('|');
      
      const updateRange = (from: string, to: string) => {
        if (!from && !to) {
          updateFilter(key, '');
        } else {
          updateFilter(key, `${from || ''}|${to || ''}`);
        }
      };

      return (
        <div key={key} style={{ display: 'flex', gap: spacing.xs, alignItems: 'flex-end' }}>
          <div style={{ minWidth: '130px', flex: '0 1 140px' }}>
            <label style={labelStyle}>{config.label} From</label>
            <input
              type="date"
              value={fromDate || ''}
              onChange={(e) => updateRange(e.target.value, toDate || '')}
              style={inputStyle}
            />
          </div>
          <div style={{ minWidth: '130px', flex: '0 1 140px' }}>
            <label style={labelStyle}>{config.label} To</label>
            <input
              type="date"
              value={toDate || ''}
              onChange={(e) => updateRange(fromDate || '', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      );
    }

    // Boolean filter
    if (config.filterType === 'boolean') {
      return (
        <div key={key} style={{ minWidth: '100px', flex: '0 1 120px' }}>
          <label style={labelStyle}>{config.label}</label>
          <select
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => updateFilter(key, e.target.value)}
            style={inputStyle}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      );
    }

    // Select filter
    if (config.filterType === 'select') {
      return (
        <div key={key} style={{ minWidth: '140px', flex: '0 1 180px' }}>
          <label style={labelStyle}>{config.label}</label>
          <select
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => updateFilter(key, e.target.value)}
            style={inputStyle}
          >
            <option value="">All</option>
            {config.filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    // Multiselect filter
    if (config.filterType === 'multiselect') {
      const selectedValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
      return (
        <div key={key} style={{ minWidth: '180px', flex: '1 1 200px', maxWidth: '280px' }}>
          <label style={labelStyle}>{config.label}</label>
          {selectedValues.length > 0 && (
            <div style={styles({ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' })}>
              {selectedValues.map((val) => {
                const opt = config.filterOptions.find((o) => o.value === val);
                return (
                  <span
                    key={val}
                    style={styles({
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      backgroundColor: colors.primary.default,
                      color: '#fff',
                      borderRadius: radius.full,
                      fontSize: '11px',
                      fontWeight: '500',
                    })}
                  >
                    {opt?.label || val}
                    <button
                      onClick={() => updateFilter(key, selectedValues.filter((v) => v !== val))}
                      style={styles({
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'rgba(255,255,255,0.8)',
                      })}
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !selectedValues.includes(e.target.value)) {
                updateFilter(key, [...selectedValues, e.target.value]);
              }
            }}
            style={inputStyle}
          >
            <option value="">Add {config.label.toLowerCase()}...</option>
            {config.filterOptions
              .filter((opt) => !selectedValues.includes(opt.value))
              .map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
          </select>
        </div>
      );
    }

    // Autocomplete filter
    if (config.filterType === 'autocomplete') {
      if (!config.onSearch) {
        // Fallback to select if no search function provided
        return (
          <div key={key} style={{ minWidth: '160px', flex: '1 1 180px', maxWidth: '240px' }}>
            <label style={labelStyle}>{config.label}</label>
            <select
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e) => updateFilter(key, e.target.value)}
              style={inputStyle}
            >
              <option value="">All</option>
              {config.filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      }
      return (
        <div key={key} style={{ minWidth: '180px', flex: '1 1 200px', maxWidth: '280px' }}>
          <label style={labelStyle}>{config.label}</label>
          <Autocomplete
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

  const hasActiveFilters = Object.keys(localValues).length > 0;

  return (
    <div
      style={styles({
        display: 'flex',
        gap: spacing.md,
        alignItems: 'flex-end',
        padding: `${spacing.sm} ${spacing.md}`,
        backgroundColor: colors.bg.elevated,
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: radius.md,
        flexWrap: 'wrap',
      })}
    >
      {filters.map((filter) => renderFilter(filter))}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setLocalValues({});
            onChange({});
          }}
          style={styles({
            height: '36px',
            padding: `0 ${spacing.md}`,
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.sm,
            color: colors.text.muted,
            cursor: 'pointer',
            fontSize: ts.bodySmall.fontSize,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            whiteSpace: 'nowrap',
          })}
        >
          <X size={14} />
          Clear all
        </button>
      )}
    </div>
  );
}
