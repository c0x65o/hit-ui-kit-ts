'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Filter, X, Search, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Button } from './Button';
import { Autocomplete } from './Autocomplete';
import type { GlobalFilterConfig, FilterOperator } from '../types';

export interface FilterDropdownProps {
  /** Table ID for localStorage persistence */
  tableId?: string;
  /** Filter configurations */
  filters: GlobalFilterConfig[];
  /** Current filter values */
  values: Record<string, string | string[]>;
  /** Called when filter values change */
  onChange: (values: Record<string, string | string[]>) => void;
  /** Column definitions for label/type resolution */
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
 * FilterDropdown - A button + popover component for managing table filters
 * 
 * Features:
 * - Button shows "Filters" with badge when filters are active
 * - Clicking opens a popover with all available filters
 * - Add/remove active filters
 * - Persists filter state to localStorage per tableId
 * - Supports all filter types: string, number, date, daterange, boolean, select, multiselect, autocomplete
 */
export function FilterDropdown({ tableId, filters, values, onChange, columns }: FilterDropdownProps) {
  const { colors, radius, spacing, textStyles: ts, shadows } = useThemeTokens();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Track which filters are currently enabled/visible
  const [enabledFilters, setEnabledFilters] = useState<Set<string>>(new Set());
  const [localValues, setLocalValues] = useState<Record<string, string | string[]>>(values);

  // Load from localStorage on mount
  useEffect(() => {
    if (!tableId) return;
    try {
      const stored = localStorage.getItem(`hit:table-filters:${tableId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.enabledFilters && Array.isArray(parsed.enabledFilters)) {
          setEnabledFilters(new Set(parsed.enabledFilters));
        }
        if (parsed.values && typeof parsed.values === 'object') {
          setLocalValues(parsed.values);
          onChange(parsed.values);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [tableId]);

  // Save to localStorage when values or enabled filters change
  useEffect(() => {
    if (!tableId) return;
    try {
      localStorage.setItem(`hit:table-filters:${tableId}`, JSON.stringify({
        enabledFilters: Array.from(enabledFilters),
        values: localValues,
        updatedAt: new Date().toISOString(),
      }));
    } catch {
      // Ignore localStorage errors
    }
  }, [tableId, enabledFilters, localValues]);

  // Sync external values
  useEffect(() => {
    setLocalValues(values);
    // Auto-enable filters that have values
    const newEnabled = new Set(enabledFilters);
    let changed = false;
    for (const key of Object.keys(values)) {
      if (values[key] && !newEnabled.has(key)) {
        newEnabled.add(key);
        changed = true;
      }
    }
    if (changed) {
      setEnabledFilters(newEnabled);
    }
  }, [values]);

  // Calculate dropdown position
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 380;
      const spacingValue = 8;
      
      let left: number | undefined = rect.left;
      let right: number | undefined;
      
      // Ensure dropdown doesn't go off-screen
      if (left + dropdownWidth > window.innerWidth) {
        right = window.innerWidth - rect.right;
        left = undefined;
      }
      
      setPosition({
        top: rect.bottom + spacingValue,
        ...(right !== undefined ? { right } : { left }),
      });
    } else {
      setPosition(null);
    }
  }, [open]);

  const getColumnConfig = (filter: GlobalFilterConfig) => {
    const col = columns.find((c) => c.key === filter.columnKey);
    return {
      label: filter.label || col?.label || filter.columnKey,
      filterType: filter.filterType || col?.filterType || 'string',
      filterOptions: filter.filterOptions || col?.filterOptions || [],
      onSearch: filter.onSearch || col?.onSearch,
      resolveValue: filter.resolveValue || col?.resolveValue,
      showOperator: filter.showOperator ?? false,
      defaultOperator: filter.defaultOperator,
    };
  };

  // Helper to parse operator:value format
  const parseOperatorValue = (value: string | undefined, defaultOp: FilterOperator): { operator: FilterOperator; value: string } => {
    if (!value) return { operator: defaultOp, value: '' };
    const colonIdx = value.indexOf(':');
    if (colonIdx > 0) {
      const op = value.substring(0, colonIdx) as FilterOperator;
      const validOps: FilterOperator[] = ['equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'endsWith', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'];
      if (validOps.includes(op)) {
        return { operator: op, value: value.substring(colonIdx + 1) };
      }
    }
    return { operator: defaultOp, value: value };
  };

  // Helper to format operator:value
  const formatOperatorValue = (operator: FilterOperator, value: string): string => {
    if (!value) return '';
    return `${operator}:${value}`;
  };

  // Operator options for string filters
  const stringOperatorOptions: Array<{ value: FilterOperator; label: string }> = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notContains', label: 'Does not contain' },
    { value: 'notEquals', label: 'Not equals' },
  ];

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

  const toggleFilterEnabled = (columnKey: string) => {
    const newEnabled = new Set(enabledFilters);
    if (newEnabled.has(columnKey)) {
      newEnabled.delete(columnKey);
      // Also clear the value when removing filter
      const next = { ...localValues };
      delete next[columnKey];
      setLocalValues(next);
      onChange(next);
    } else {
      newEnabled.add(columnKey);
    }
    setEnabledFilters(newEnabled);
  };

  const clearAllFilters = () => {
    setLocalValues({});
    setEnabledFilters(new Set());
    onChange({});
  };

  // Count active filters (filters with actual values)
  const activeFilterCount = Object.keys(localValues).filter(
    (key) => {
      const val = localValues[key];
      return val && (typeof val === 'string' ? val.length > 0 : val.length > 0);
    }
  ).length;

  // Compact input styling
  const inputStyle = styles({
    height: '32px',
    padding: `0 ${spacing.sm}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border.default}`,
    borderRadius: radius.sm,
    color: colors.text.primary,
    fontSize: ts.bodySmall.fontSize,
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  });

  const labelStyle = styles({
    display: 'block',
    fontSize: '11px',
    fontWeight: '500',
    color: colors.text.muted,
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  });

  const renderFilterControl = (filter: GlobalFilterConfig) => {
    const config = getColumnConfig(filter);
    const currentValue = localValues[filter.columnKey];
    const key = filter.columnKey;

    // String filter with optional operator support
    if (config.filterType === 'string') {
      const defaultOp: FilterOperator = config.defaultOperator || 'contains';
      
      // Check if operator mode is enabled for this filter
      if (config.showOperator) {
        const parsed = parseOperatorValue(typeof currentValue === 'string' ? currentValue : undefined, defaultOp);
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <select
              value={parsed.operator}
              onChange={(e) => {
                const newOp = e.target.value as FilterOperator;
                if (parsed.value) {
                  updateFilter(key, formatOperatorValue(newOp, parsed.value));
                }
              }}
              style={{ ...inputStyle, height: '28px', fontSize: '11px' }}
            >
              {stringOperatorOptions.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            <div style={{ position: 'relative' }}>
              <Search 
                size={12} 
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.text.muted,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={parsed.value}
                onChange={(e) => {
                  const newVal = e.target.value;
                  if (newVal) {
                    updateFilter(key, formatOperatorValue(parsed.operator, newVal));
                  } else {
                    updateFilter(key, '');
                  }
                }}
                placeholder="Search..."
                style={{
                  ...inputStyle,
                  paddingLeft: '28px',
                }}
              />
            </div>
          </div>
        );
      }
      
      // Simple string filter without operator (default behavior)
      return (
        <div style={{ position: 'relative' }}>
          <Search 
            size={12} 
            style={{
              position: 'absolute',
              left: '8px',
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
              paddingLeft: '28px',
            }}
          />
        </div>
      );
    }

    // Number filter
    if (config.filterType === 'number') {
      return (
        <input
          type="number"
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={(e) => updateFilter(key, e.target.value)}
          placeholder="0"
          style={inputStyle}
        />
      );
    }

    // Date filter (single)
    if (config.filterType === 'date') {
      return (
        <input
          type="date"
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={(e) => updateFilter(key, e.target.value)}
          style={inputStyle}
        />
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
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <input
            type="date"
            value={fromDate || ''}
            onChange={(e) => updateRange(e.target.value, toDate || '')}
            style={{ ...inputStyle, flex: 1 }}
          />
          <span style={{ color: colors.text.muted, fontSize: '11px' }}>to</span>
          <input
            type="date"
            value={toDate || ''}
            onChange={(e) => updateRange(fromDate || '', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      );
    }

    // Boolean filter
    if (config.filterType === 'boolean') {
      return (
        <select
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={(e) => updateFilter(key, e.target.value)}
          style={inputStyle}
        >
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    // Select filter
    if (config.filterType === 'select') {
      return (
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
      );
    }

    // Multiselect filter
    if (config.filterType === 'multiselect') {
      const selectedValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
      return (
        <div>
          {selectedValues.length > 0 && (
            <div style={styles({ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '4px' })}>
              {selectedValues.map((val) => {
                const opt = config.filterOptions.find((o) => o.value === val);
                return (
                  <span
                    key={val}
                    style={styles({
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 6px',
                      backgroundColor: colors.primary.default,
                      color: '#fff',
                      borderRadius: radius.full,
                      fontSize: '10px',
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
            <option value="">Add...</option>
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
        );
      }
      return (
        <Autocomplete
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={(value) => updateFilter(key, value)}
          onSearch={config.onSearch}
          resolveValue={config.resolveValue}
          placeholder={`Search...`}
          clearable
        />
      );
    }

    return null;
  };

  if (!filters || filters.length === 0) {
    return null;
  }

  // Get enabled filters that exist in filters array
  const visibleFilters = filters.filter((f) => enabledFilters.has(f.columnKey));
  const availableFilters = filters.filter((f) => !enabledFilters.has(f.columnKey));

  return (
    <div style={{ position: 'relative' }}>
      <div ref={triggerRef}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(!open)}
          style={{
            position: 'relative',
          }}
        >
          <Filter size={16} style={{ marginRight: spacing.xs }} />
          Filters
          {activeFilterCount > 0 && (
            <span
              style={styles({
                marginLeft: spacing.xs,
                backgroundColor: colors.primary.default,
                color: '#fff',
                fontSize: '10px',
                fontWeight: '600',
                padding: '1px 6px',
                borderRadius: radius.full,
                minWidth: '18px',
                textAlign: 'center',
              })}
            >
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {open && position && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={styles({
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            })}
          />
          {/* Dropdown panel */}
          <div
            ref={dropdownRef}
            style={styles({
              position: 'fixed',
              zIndex: 50,
              top: `${position.top}px`,
              ...(position.right !== undefined ? { right: `${position.right}px` } : { left: `${position.left}px` }),
              width: '380px',
              maxHeight: '80vh',
              overflowY: 'auto',
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: radius.lg,
              boxShadow: shadows.xl,
            })}
          >
            {/* Header */}
            <div
              style={styles({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing.sm} ${spacing.md}`,
                borderBottom: `1px solid ${colors.border.subtle}`,
              })}
            >
              <span style={{ fontSize: ts.body.fontSize, fontWeight: '600', color: colors.text.primary }}>
                Filters
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  style={styles({
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: colors.text.muted,
                    fontSize: ts.bodySmall.fontSize,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  })}
                >
                  <Trash2 size={12} />
                  Clear all
                </button>
              )}
            </div>

            {/* Active filters */}
            {visibleFilters.length > 0 && (
              <div style={styles({ padding: spacing.md, borderBottom: `1px solid ${colors.border.subtle}` })}>
                <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm })}>
                  {visibleFilters.map((filter) => {
                    const config = getColumnConfig(filter);
                    return (
                      <div
                        key={filter.columnKey}
                        style={styles({
                          backgroundColor: colors.bg.elevated,
                          borderRadius: radius.md,
                          padding: spacing.sm,
                        })}
                      >
                        <div style={styles({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' })}>
                          <label style={labelStyle}>{config.label}</label>
                          <button
                            onClick={() => toggleFilterEnabled(filter.columnKey)}
                            style={styles({
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: colors.text.muted,
                              display: 'flex',
                              alignItems: 'center',
                            })}
                            title="Remove filter"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {renderFilterControl(filter)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add filter section */}
            {availableFilters.length > 0 && (
              <div style={styles({ padding: spacing.md })}>
                <div style={styles({ marginBottom: spacing.xs })}>
                  <span style={{ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, fontWeight: '500' }}>
                    Add filter
                  </span>
                </div>
                <div style={styles({ display: 'flex', flexWrap: 'wrap', gap: '6px' })}>
                  {availableFilters.map((filter) => {
                    const config = getColumnConfig(filter);
                    return (
                      <button
                        key={filter.columnKey}
                        onClick={() => toggleFilterEnabled(filter.columnKey)}
                        style={styles({
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          backgroundColor: colors.bg.elevated,
                          border: `1px solid ${colors.border.default}`,
                          borderRadius: radius.full,
                          cursor: 'pointer',
                          fontSize: ts.bodySmall.fontSize,
                          color: colors.text.secondary,
                          transition: 'all 150ms ease',
                        })}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bg.surface;
                          e.currentTarget.style.borderColor = colors.primary.default;
                          e.currentTarget.style.color = colors.primary.default;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bg.elevated;
                          e.currentTarget.style.borderColor = colors.border.default;
                          e.currentTarget.style.color = colors.text.secondary;
                        }}
                      >
                        <Plus size={12} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {visibleFilters.length === 0 && availableFilters.length === 0 && (
              <div style={styles({ padding: spacing.lg, textAlign: 'center', color: colors.text.muted })}>
                No filters available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
