'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Star, Filter, Trash, Eye, EyeOff, Columns, Layers, Share2, Users, X, ArrowUpDown, Check } from 'lucide-react';
import { useTableView, type TableView, type TableViewFilter, type TableViewShare } from '../hooks/useTableView';
import { useThemeTokens } from '../theme/index.js';
import { useAlertDialog } from '../hooks/useAlertDialog.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { AlertDialog } from './AlertDialog.js';
import { Input } from './Input.js';
import { Select } from './Select.js';
import { Checkbox } from './Checkbox.js';
import { TableViewSharingPanel, type TableViewShareRecipient } from './TableViewSharingPanel.js';
import { styles } from './utils.js';
import { Autocomplete } from './Autocomplete.js';
import { getTableFilters, type TableFilterDefinition } from '../config/tableFilters.js';
import type { Principal, PrincipalType } from '../types/acl.js';

/**
 * Filter operators for table views
 */
export const FILTER_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  GREATER_THAN: 'greaterThan',
  LESS_THAN: 'lessThan',
  GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL: 'lessThanOrEqual',
  DATE_EQUALS: 'dateEquals',
  DATE_BEFORE: 'dateBefore',
  DATE_AFTER: 'dateAfter',
  DATE_BETWEEN: 'dateBetween',
  IS_NULL: 'isNull',
  IS_NOT_NULL: 'isNotNull',
  IS_TRUE: 'isTrue',
  IS_FALSE: 'isFalse',
} as const;

/**
 * Column definition for ViewSelector
 * Supports various field types with options for select fields
 */
export interface ViewColumnDefinition {
  key: string;
  label: string;
  /** Field type: 'string' | 'number' | 'date' | 'daterange' | 'boolean' | 'select' | 'multiselect' | 'autocomplete' */
  type?: 'string' | 'number' | 'date' | 'datetime' | 'daterange' | 'boolean' | 'select' | 'multiselect' | 'autocomplete';
  /** Options for select/multiselect fields (with optional sortOrder for grouping) */
  options?: Array<{ value: string; label: string; sortOrder?: number }>;
  /** Whether this column can be hidden (default: true) */
  hideable?: boolean;
  /** For autocomplete: search endpoint (appends ?search=query&pageSize=limit) */
  searchEndpoint?: string;
  /** For autocomplete: resolve endpoint (appends /{id} or ?id=value) */
  resolveEndpoint?: string;
  /** For autocomplete: items path in response (e.g., 'items') */
  itemsPath?: string;
  /** For autocomplete: field to use as value (default: 'id') */
  valueField?: string;
  /** For autocomplete: field to use as label (default: 'name') */
  labelField?: string;
}

interface ViewSelectorProps {
  tableId: string;
  onViewChange?: (view: TableView | null) => void;
  /** Called when view system is ready (views loaded and initial view applied) */
  onReady?: (ready: boolean) => void;
  /** Column definitions with type info and options for select fields */
  availableColumns?: ViewColumnDefinition[];
  /** Optional custom principal fetcher. If not provided, uses global fetcher from UI Kit. */
  fetchPrincipals?: (type: PrincipalType, search?: string) => Promise<Principal[]>;
}

/**
 * ViewSelector - Dropdown for selecting and managing table views
 * 
 * Provides a dropdown menu showing:
 * - Default (system) views
 * - User's custom views  
 * - Option to create new views
 * 
 * Requires the table-views feature pack for the API backend.
 * If not installed, the component will not render.
 * 
 * @example
 * ```tsx
 * <ViewSelector
 *   tableId="projects"
 *   availableColumns={columns}
 *   onViewChange={(view) => applyFilters(view?.filters || [])}
 * />
 * ```
 */
export function ViewSelector({ tableId, onViewChange, onReady, availableColumns = [], fetchPrincipals }: ViewSelectorProps) {
  const { colors, radius, spacing, textStyles: ts, shadows } = useThemeTokens();
  const { views, currentView, loading, available, viewReady, selectView, deleteView, createView, updateView, getShares, addShare, removeShare } = useTableView({
    tableId,
    onViewChange,
  });
  const alertDialog = useAlertDialog();

  // Cache dynamic select options for view builder (optionsEndpoint from TABLE_FILTER_REGISTRY)
  const [registryOptionsCache, setRegistryOptionsCache] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [registryOptionsLoading, setRegistryOptionsLoading] = useState(false);
  
  // Use ref for onReady to avoid infinite loops when parent passes new function reference
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  
  // SINGLE SOURCE OF TRUTH: Merge registry filters with passed-in columns
  // Registry takes priority, then fall back to passed-in columns
  const effectiveColumns = useMemo<ViewColumnDefinition[]>(() => {
    const registryFilters = getTableFilters(tableId);
    
    // Build a map of registry filters by columnKey
    const registryMap = new Map<string, ViewColumnDefinition>();
    for (const filter of registryFilters) {
      const cachedOptions = registryOptionsCache[filter.columnKey];
      // Convert TableFilterDefinition to ViewColumnDefinition
      // Keep 'autocomplete' type so we can render the right component
      registryMap.set(filter.columnKey, {
        key: filter.columnKey,
        label: filter.label,
        type: filter.filterType as any,
        // For select/multiselect, prefer staticOptions, else use fetched options.
        options: filter.staticOptions || cachedOptions,
        // Preserve autocomplete endpoints
        searchEndpoint: filter.searchEndpoint,
        resolveEndpoint: filter.resolveEndpoint,
        itemsPath: filter.itemsPath,
        valueField: filter.valueField,
        labelField: filter.labelField,
      });
    }
    
    // If registry has filters, use them as base and merge with passed columns
    if (registryMap.size > 0) {
      // Start with registry columns
      const merged = new Map<string, ViewColumnDefinition>(registryMap);
      
      // Add any passed columns that aren't in registry (e.g., columns without filter config)
      for (const col of availableColumns) {
        if (!merged.has(col.key)) {
          merged.set(col.key, col);
        } else {
          // Merge options from passed columns into registry columns
          const existing = merged.get(col.key)!;
          if (col.options && !existing.options) {
            existing.options = col.options;
          }
          if (col.hideable !== undefined && existing.hideable === undefined) {
            existing.hideable = col.hideable;
          }
        }
      }
      
      return Array.from(merged.values());
    }
    
    // No registry, use passed columns
    return availableColumns;
  }, [tableId, availableColumns, registryOptionsCache]);

  // Fetch dynamic options for select/multiselect fields used in view builder.
  // Without this, view filters fall back to a free-text input even when quick-filters show a dropdown.
  useEffect(() => {
    const registryFilters = getTableFilters(tableId);
    const dynamicSelects = registryFilters.filter(
      (f) => (f.filterType === 'select' || f.filterType === 'multiselect') && !!f.optionsEndpoint
    );
    if (dynamicSelects.length === 0) return;

    let cancelled = false;
    setRegistryOptionsLoading(true);

    const fetchOptions = async (f: TableFilterDefinition) => {
      try {
        // Be generous on pageSize so we can build a complete dropdown for view builder.
        const url = f.optionsEndpoint!.includes('?')
          ? `${f.optionsEndpoint}&pageSize=500`
          : `${f.optionsEndpoint}?pageSize=500`;
        const res = await fetch(url);
        if (!res.ok) return { key: f.columnKey, options: [] as Array<{ value: string; label: string }> };
        const json = await res.json();

        // Extract items from response
        const itemsPath = f.itemsPath;
        let items = json;
        if (itemsPath) {
          for (const part of itemsPath.split('.')) {
            items = items?.[part];
          }
        }
        if (!Array.isArray(items)) items = [];

        const valueField = f.valueField || 'id';
        const labelField = f.labelField || 'name';
        const options = items
          .map((item: any) => {
            const value = String(item?.[valueField] ?? item?.id ?? '');
            const label = String(item?.[labelField] ?? item?.name ?? value);
            return value ? { value, label } : null;
          })
          .filter(Boolean) as Array<{ value: string; label: string }>;

        return { key: f.columnKey, options };
      } catch {
        return { key: f.columnKey, options: [] as Array<{ value: string; label: string }> };
      }
    };

    Promise.all(dynamicSelects.map(fetchOptions))
      .then((results) => {
        if (cancelled) return;
        setRegistryOptionsCache((prev) => {
          const next = { ...prev };
          for (const r of results) next[r.key] = r.options;
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setRegistryOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tableId]);
  
  // Notify parent when view system is ready
  useEffect(() => {
    // If views API isn't available (feature pack not installed), treat as "ready"
    // so tables don't get stuck in Loading state waiting for a view that can't load.
    onReadyRef.current?.(available ? viewReady : true);
  }, [available, viewReady]);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingView, setEditingView] = useState<TableView | null>(null);
  const [activeTab, setActiveTab] = useState<'filters' | 'columns' | 'grouping' | 'sorting' | 'sharing'>('filters');
  
  // Builder form state
  const [builderName, setBuilderName] = useState('');
  const [builderFilters, setBuilderFilters] = useState<TableViewFilter[]>([]);
  const [builderFilterMode, setBuilderFilterMode] = useState<'all' | 'any'>('all');
  const [builderColumnVisibility, setBuilderColumnVisibility] = useState<Record<string, boolean>>({});
  const [builderGroupByField, setBuilderGroupByField] = useState<string>('');
  const [builderSorting, setBuilderSorting] = useState<Array<{ id: string; desc: boolean }>>([]);
  const [builderSaving, setBuilderSaving] = useState(false);
  
  // Share state
  const [shares, setShares] = useState<TableViewShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  // When creating a new view (no id yet), queue up share recipients and apply after creation
  const [pendingShareRecipients, setPendingShareRecipients] = useState<TableViewShareRecipient[]>([]);

  // Categorize views
  const systemViews = views.filter((v) => v._category === 'system' || v.isSystem);
  const customViews = views.filter((v) => v._category === 'user' || (!v.isSystem && v._category !== 'shared'));
  const sharedViews = views.filter((v) => v._category === 'shared');

  // Human label for "All <table>" (derived from tableId)
  const tableLabel = String(tableId)
    .split('.')
    .slice(-1)[0]
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const allLabel = `All ${tableLabel}`;

  // Get hideable columns (all columns are hideable by default unless specified)
  const hideableColumns = effectiveColumns.filter((col) => col.hideable !== false);

  // Reset builder when opening
  useEffect(() => {
    if (showBuilder) {
      if (editingView) {
        setBuilderName(editingView.name);
        setBuilderFilters(editingView.filters || []);
        const modeRaw = (editingView.metadata as any)?.filterMode;
        setBuilderFilterMode(modeRaw === 'any' ? 'any' : 'all');
        setBuilderColumnVisibility(editingView.columnVisibility || {});
        setBuilderGroupByField(editingView.groupBy?.field || '');
        setBuilderSorting((editingView.sorting as any) || []);
        // Load shares when editing
        setSharesLoading(true);
        getShares(editingView.id)
          .then(setShares)
          .catch(() => setShares([]))
          .finally(() => setSharesLoading(false));
      } else {
        setBuilderName('');
        setBuilderFilters([]);
        setBuilderFilterMode('all');
        // Default: all columns visible
        setBuilderColumnVisibility({});
        setBuilderGroupByField('');
        setBuilderSorting([]);
        setShares([]);
        setPendingShareRecipients([]);
      }
      setActiveTab('filters');
    }
  }, [showBuilder, editingView, getShares]);

  // If API not available (feature pack not installed), don't render
  if (!available) {
    return null;
  }

  const handleDelete = async (view: TableView, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await alertDialog.showConfirm(
      `Are you sure you want to delete "${view.name}"?`,
      {
        title: 'Delete View',
        variant: 'warning',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    );
    if (confirmed) {
      try {
        await deleteView(view.id);
      } catch (error: any) {
        await alertDialog.showAlert(error?.message || 'Failed to delete view', {
          variant: 'error',
          title: 'Error',
        });
      }
    }
  };

  const handleEdit = (view: TableView, e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    setEditingView(view);
    setShowBuilder(true);
  };

  const handleCreateNew = () => {
    setDropdownOpen(false);
    setEditingView(null);
    setShowBuilder(true);
  };

  const handleAddFilter = () => {
    const firstColumn = effectiveColumns[0];
    setBuilderFilters([
      ...builderFilters,
      {
        field: firstColumn?.key || 'status',
        operator: FILTER_OPERATORS.EQUALS,
        value: '',
        sortOrder: builderFilters.length,
      },
    ]);
  };

  const handleRemoveFilter = (index: number) => {
    setBuilderFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, field: string, value: any) => {
    setBuilderFilters((prev) => {
      const newFilters = [...prev];
      newFilters[index] = { ...newFilters[index], [field]: value };
      return newFilters;
    });
  };

  // Update multiple filter fields at once (avoids stale closure issues)
  const handleFilterFieldChange = (index: number, newField: string) => {
    const newCol = effectiveColumns.find((c) => c.key === newField);
    const defaultOp = getOperatorOptions(newCol?.type)[0]?.value || 'equals';
    setBuilderFilters((prev) => {
      const newFilters = [...prev];
      newFilters[index] = {
        ...newFilters[index],
        field: newField,
        operator: defaultOp,
        value: '',
      };
      return newFilters;
    });
  };

  const handleAddSort = () => {
    const firstColumn = effectiveColumns[0];
    const nextId = String(firstColumn?.key || 'name');
    setBuilderSorting((prev) => [...prev, { id: nextId, desc: false }]);
  };

  const handleRemoveSort = (index: number) => {
    setBuilderSorting((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSortChange = (index: number, patch: Partial<{ id: string; desc: boolean }>) => {
    setBuilderSorting((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleSaveView = async () => {
    if (!builderName.trim()) {
      await alertDialog.showAlert('Please enter a view name', {
        variant: 'warning',
        title: 'Validation Error',
      });
      return;
    }

    setBuilderSaving(true);
    try {
      // Only include columnVisibility if there are hidden columns
      const hasHiddenColumns = Object.values(builderColumnVisibility).some((v) => v === false);
      
      // Build groupBy config (canonical: no persisted sort order; ordering should be derived from data)
      let groupByConfig: { field: string } | undefined;
      if (builderGroupByField) {
        groupByConfig = { field: builderGroupByField };
      }

      const baseMetadata =
        editingView?.metadata && typeof editingView.metadata === 'object'
          ? (editingView.metadata as Record<string, unknown>)
          : {};
      
      const viewData = {
        name: builderName.trim(),
        filters: builderFilters.filter((f) => f.field && f.operator),
        columnVisibility: hasHiddenColumns ? builderColumnVisibility : undefined,
        groupBy: groupByConfig,
        sorting: builderSorting.length > 0 ? builderSorting : undefined,
        metadata: { ...baseMetadata, filterMode: builderFilterMode },
      };

      if (editingView) {
        await updateView(editingView.id, viewData);
      } else {
        const newView = await createView(viewData);
        // Apply any queued shares now that we have a view id
        if (pendingShareRecipients.length > 0) {
          const failures: string[] = [];
          for (const recipient of pendingShareRecipients) {
            try {
              await addShare(newView.id, recipient.principalType, recipient.principalId);
            } catch (err: any) {
              failures.push(`${recipient.principalId}${err?.message ? ` (${err.message})` : ''}`);
            }
          }
          if (failures.length > 0) {
            await alertDialog.showAlert(
              `View created, but some shares failed:\n${failures.join('\n')}`,
              { variant: 'warning', title: 'Sharing partially failed' }
            );
          }
        }
        selectView(newView);
      }
      setShowBuilder(false);
      setEditingView(null);
    } catch (error: any) {
      await alertDialog.showAlert(error?.message || 'Failed to save view', {
        variant: 'error',
        title: 'Error',
      });
    } finally {
      setBuilderSaving(false);
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnKey: string) => {
    setBuilderColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: prev[columnKey] === false ? true : false,
    }));
  };

  // Check if column is visible (default true if not specified)
  const isColumnVisible = (columnKey: string) => {
    return builderColumnVisibility[columnKey] !== false;
  };

  // Get operator options based on field type
  const getOperatorOptions = (fieldType?: string) => {
    switch (fieldType) {
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'notEquals', label: 'Not Equals' },
          { value: 'greaterThan', label: 'Greater Than' },
          { value: 'lessThan', label: 'Less Than' },
          { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
          { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
        ];
      case 'date':
      case 'datetime':
      case 'daterange':
        return [
          { value: 'dateBetween', label: 'Between' },
          { value: 'dateEquals', label: 'Equals' },
          { value: 'dateBefore', label: 'Before' },
          { value: 'dateAfter', label: 'After' },
          { value: 'isNull', label: 'Is Empty' },
          { value: 'isNotNull', label: 'Is Not Empty' },
        ];
      case 'boolean':
        return [
          { value: 'isTrue', label: 'Is True' },
          { value: 'isFalse', label: 'Is False' },
        ];
      case 'select':
      case 'multiselect':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'notEquals', label: 'Not Equals' },
          { value: 'isNull', label: 'Is Empty' },
          { value: 'isNotNull', label: 'Is Not Empty' },
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'notEquals', label: 'Not Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'startsWith', label: 'Starts With' },
          { value: 'endsWith', label: 'Ends With' },
          { value: 'isNull', label: 'Is Empty' },
          { value: 'isNotNull', label: 'Is Not Empty' },
        ];
    }
  };

  // Render the appropriate value input based on column type
  const renderValueInput = (filter: TableViewFilter, index: number, column?: ViewColumnDefinition) => {
    const fieldType = column?.type || 'string';
    const operator = filter.operator;

    // No value input needed for null checks or boolean operators
    if (['isNull', 'isNotNull', 'isTrue', 'isFalse'].includes(operator)) {
      return (
        <div style={styles({ 
          flex: 1, 
          padding: spacing.sm, 
          color: colors.text.muted,
          fontSize: ts.bodySmall.fontSize,
          fontStyle: 'italic',
        })}>
          No value needed
        </div>
      );
    }

    // Select/Multiselect with options
    if ((fieldType === 'select' || fieldType === 'multiselect') && column?.options) {
      return (
        <div style={{ flex: 1 }}>
          <Select
            value={filter.value?.toString() || ''}
            onChange={(value) => handleFilterChange(index, 'value', value)}
            options={column.options}
            placeholder="Select value..."
          />
        </div>
      );
    }

    // Boolean field
    if (fieldType === 'boolean') {
      return (
        <div style={{ flex: 1 }}>
          <Select
            value={filter.value?.toString() || ''}
            onChange={(value) => handleFilterChange(index, 'value', value === 'true')}
            options={[
              { value: 'true', label: 'Yes / True' },
              { value: 'false', label: 'No / False' },
            ]}
            placeholder="Select..."
          />
        </div>
      );
    }

    // Date field
    if (fieldType === 'date' || fieldType === 'datetime' || fieldType === 'daterange') {
      // dateBetween stores a JSON string value: {"from":"...","to":"..."}
      if (operator === 'dateBetween') {
        let from = '';
        let to = '';
        const raw = filter.value?.toString() || '';
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              from = String((parsed as any).from || (parsed as any).start || '');
              to = String((parsed as any).to || (parsed as any).end || '');
            }
          } catch {
            // Support legacy "a..b" or "a,b"
            const sep = raw.includes('..') ? '..' : (raw.includes(',') ? ',' : null);
            if (sep) {
              const parts = raw.split(sep).map((s) => s.trim());
              from = parts[0] || '';
              to = parts[1] || '';
            }
          }
        }

        const inputType = fieldType === 'datetime' ? 'datetime-local' : 'date';

        const setRange = (patch: { from?: string; to?: string }) => {
          const nextFrom = patch.from !== undefined ? patch.from : from;
          const nextTo = patch.to !== undefined ? patch.to : to;
          if (!nextFrom && !nextTo) {
            handleFilterChange(index, 'value', '');
            return;
          }
          handleFilterChange(index, 'value', JSON.stringify({ from: nextFrom || '', to: nextTo || '' }));
        };

        return (
          <div style={{ flex: 1, display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <Input
              type={inputType as any}
              value={from}
              onChange={(value) => setRange({ from: value })}
              placeholder="Start..."
            />
            <span style={styles({ color: colors.text.muted, fontSize: ts.bodySmall.fontSize })}>to</span>
            <Input
              type={inputType as any}
              value={to}
              onChange={(value) => setRange({ to: value })}
              placeholder="End..."
            />
          </div>
        );
      }

      return (
        <div style={{ flex: 1 }}>
          <Input
            type={(fieldType === 'datetime' ? 'datetime-local' : 'date') as any}
            value={filter.value?.toString() || ''}
            onChange={(value) => handleFilterChange(index, 'value', value)}
          />
        </div>
      );
    }

    // Number field
    if (fieldType === 'number') {
      return (
        <div style={{ flex: 1 }}>
          <Input
            type="number"
            value={filter.value?.toString() || ''}
            onChange={(value) => handleFilterChange(index, 'value', value ? Number(value) : '')}
            placeholder="Enter number..."
          />
        </div>
      );
    }

    // Autocomplete field
    if (fieldType === 'autocomplete' && column?.searchEndpoint) {
      const searchEndpoint = column.searchEndpoint;
      const resolveEndpoint = column.resolveEndpoint || searchEndpoint;
      const itemsPath = column.itemsPath; // May be undefined for auth directory
      const valueField = column.valueField || 'id';
      const labelField = column.labelField || 'name';
      const isAuthDirectory = searchEndpoint?.includes('/directory/users');

      const onSearch = async (query: string, limit: number) => {
        try {
          // Auth directory uses ?limit= instead of ?pageSize=
          const url = `${searchEndpoint}?search=${encodeURIComponent(query)}&pageSize=${limit}&limit=${limit}`;
          const res = await fetch(url);
          if (!res.ok) return [];
          const json = await res.json();
          
          let items = json;
          // If itemsPath is defined, extract items from response
          if (itemsPath) {
            for (const part of itemsPath.split('.')) {
              items = items?.[part];
            }
          }
          // If response is not an array (and we have itemsPath), something went wrong
          if (!Array.isArray(items)) items = [];

          return items.map((item: any) => {
            const value = String(item[valueField] || item.id || '');
            let label = String(item[labelField] || item.name || item[valueField] || '');
            // Special handling for user objects with profile_fields
            if (item.profile_fields) {
              const pf = item.profile_fields as { first_name?: string; last_name?: string };
              const displayName = [pf.first_name, pf.last_name].filter(Boolean).join(' ').trim();
              if (displayName) label = displayName;
            }
            return { value, label };
          });
        } catch {
          return [];
        }
      };

      const resolveValue = async (value: string) => {
        if (!value) return null;
        try {
          let url: string;
          if (isAuthDirectory) {
            // Auth directory uses ?search= to find users
            url = `${resolveEndpoint}?search=${encodeURIComponent(value)}&limit=10`;
          } else if (value.includes('@') || value.includes('/')) {
            // Email-based IDs use query param
            url = `${resolveEndpoint}?id=${encodeURIComponent(value)}`;
          } else {
            // UUID-based IDs use path
            url = `${resolveEndpoint}/${encodeURIComponent(value)}`;
          }
          
          const res = await fetch(url);
          if (!res.ok) return null;
          const json = await res.json();
          
          // Handle auth directory (plain array) or standard responses
          let item: any;
          if (Array.isArray(json)) {
            // Auth directory returns plain array - find exact match
            item = json.find((u: any) => u[valueField] === value) || json[0];
          } else if (itemsPath) {
            let items = json;
            for (const part of itemsPath.split('.')) {
              items = items?.[part];
            }
            item = Array.isArray(items) ? items[0] : items;
          } else {
            item = json.items?.[0] || json;
          }
          
          if (!item) return null;
          
          const val = String(item[valueField] || item.id || '');
          let label = String(item[labelField] || item.name || val);
          if (item.profile_fields) {
            const pf = item.profile_fields as { first_name?: string; last_name?: string };
            const displayName = [pf.first_name, pf.last_name].filter(Boolean).join(' ').trim();
            if (displayName) label = displayName;
          }
          
          return { value: val, label };
        } catch {
          return null;
        }
      };

      return (
        <div style={{ flex: 1 }}>
          <Autocomplete
            value={filter.value?.toString() || ''}
            onChange={(value) => handleFilterChange(index, 'value', value)}
            onSearch={onSearch}
            resolveValue={resolveValue}
            placeholder={`Search ${column.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    // Default: text input
    return (
      <div style={{ flex: 1 }}>
        <Input
          value={filter.value?.toString() || ''}
          onChange={(value) => handleFilterChange(index, 'value', value)}
          placeholder="Enter value..."
        />
      </div>
    );
  };

  // Inline styles
  const dropdownStyles = {
    container: styles({
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 50,
      marginTop: spacing.xs,
      minWidth: '360px',
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radius.lg,
      boxShadow: shadows.xl,
      overflow: 'hidden',
    }),
    sectionHeader: styles({
      padding: `${spacing.xs} ${spacing.md}`,
      fontSize: ts.bodySmall.fontSize,
      fontWeight: ts.label.fontWeight,
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: `1px solid ${colors.border.subtle}`,
      backgroundColor: colors.bg.elevated,
    }),
    viewItem: styles({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: ts.body.fontSize,
      textAlign: 'left',
      color: colors.text.secondary,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 150ms ease',
    }),
    iconButton: styles({
      padding: spacing.xs,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: colors.text.muted,
      display: 'flex',
      alignItems: 'center',
      borderRadius: radius.sm,
    }),
  };

  return (
    <div style={{ position: 'relative' }}>
      <Button variant="secondary" size="sm" disabled={loading} onClick={() => setDropdownOpen(!dropdownOpen)}>
        <Filter size={14} style={{ marginRight: spacing.xs }} />
        {currentView?.name || allLabel}
        <ChevronDown size={14} style={{ marginLeft: spacing.xs }} />
      </Button>

      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDropdownOpen(false)}
            style={styles({ position: 'fixed', inset: 0, zIndex: 40 })}
          />

          {/* Dropdown */}
          <div style={dropdownStyles.container}>
            {/* Always show "All Items" option to allow deselecting views */}
            <button
              onClick={() => {
                selectView(null);
                setDropdownOpen(false);
              }}
              style={styles({
                ...dropdownStyles.viewItem,
                backgroundColor: currentView === null ? colors.bg.elevated : 'transparent',
                fontWeight: currentView === null ? ts.label.fontWeight : 'normal',
              })}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.elevated;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = currentView === null ? colors.bg.elevated : 'transparent';
              }}
            >
              {currentView === null && <Check size={14} style={{ color: colors.primary.default }} />}
              <span style={{ flex: 1 }}>{allLabel}</span>
            </button>

            {/* Show message when no views exist */}
            {views.length === 0 && !loading && (
              <div style={styles({
                padding: spacing.md,
                textAlign: 'center',
                color: colors.text.muted,
                fontSize: ts.bodySmall.fontSize,
                borderTop: `1px solid ${colors.border.subtle}`,
              })}>
                No views yet. Create your first view to save filters and column preferences.
              </div>
            )}
            
            {/* System/Default Views */}
            {systemViews.length > 0 && (
              <>
                <div style={dropdownStyles.sectionHeader}>Default Views</div>
                {systemViews.map((view) => {
                  const isSelected = currentView?.id === view.id;
                  return (
                    <button
                      key={view.id}
                      onClick={() => {
                        selectView(view);
                        setDropdownOpen(false);
                      }}
                      style={styles({
                        ...dropdownStyles.viewItem,
                        backgroundColor: isSelected ? colors.bg.elevated : 'transparent',
                        fontWeight: isSelected ? ts.label.fontWeight : 'normal',
                      })}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          isSelected ? colors.bg.elevated : 'transparent';
                      }}
                    >
                      {isSelected ? (
                        <Check size={14} style={{ color: colors.primary.default }} />
                      ) : view.isDefault ? (
                        <Star size={14} style={{ color: colors.primary.default }} />
                      ) : (
                        <span style={{ width: 14 }} />
                      )}
                      <span style={{ flex: 1 }}>{view.name}</span>
                      {view.filters?.length > 0 && (
                        <span style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted })}>
                          {view.filters.length} filter{view.filters.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {/* Custom Views */}
            {customViews.length > 0 && (
              <>
                <div style={styles({
                  ...dropdownStyles.sectionHeader,
                  borderTop: systemViews.length > 0 ? `1px solid ${colors.border.subtle}` : undefined,
                })}>
                  My Views
                </div>
                {customViews.map((view) => {
                  const isSelected = currentView?.id === view.id;
                  return (
                    <div
                      key={view.id}
                      style={styles({
                        display: 'flex',
                        alignItems: 'center',
                        padding: `${spacing.xs} ${spacing.sm} ${spacing.xs} ${spacing.md}`,
                        backgroundColor: isSelected ? colors.bg.elevated : 'transparent',
                        transition: 'background-color 150ms ease',
                      })}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          isSelected ? colors.bg.elevated : 'transparent';
                      }}
                    >
                      {isSelected ? (
                        <Check size={14} style={{ color: colors.primary.default, marginRight: spacing.xs }} />
                      ) : (
                        <span style={{ width: 14, marginRight: spacing.xs }} />
                      )}
                      <button
                        onClick={() => {
                          selectView(view);
                          setDropdownOpen(false);
                        }}
                        style={styles({
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          padding: `${spacing.xs} 0`,
                          fontSize: ts.body.fontSize,
                          fontWeight: isSelected ? ts.label.fontWeight : 'normal',
                          textAlign: 'left',
                          color: colors.text.secondary,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        })}
                      >
                        <span style={{ flex: 1 }}>{view.name}</span>
                        {view.filters?.length > 0 && (
                          <span style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted })}>
                            {view.filters.length} filter{view.filters.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleEdit(view, e)}
                        style={dropdownStyles.iconButton}
                        title="Edit view"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(view, e)}
                        style={styles({ ...dropdownStyles.iconButton, color: colors.error?.default || '#ef4444' })}
                        title="Delete view"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* Shared with me */}
            {sharedViews.length > 0 && (
              <>
                <div style={styles({
                  ...dropdownStyles.sectionHeader,
                  borderTop: `1px solid ${colors.border.subtle}`,
                })}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Users size={12} />
                    Shared with me
                  </span>
                </div>
                {sharedViews.map((view) => {
                  const isSelected = currentView?.id === view.id;
                  return (
                    <button
                      key={view.id}
                      onClick={() => {
                        selectView(view);
                        setDropdownOpen(false);
                      }}
                      style={styles({
                        ...dropdownStyles.viewItem,
                        backgroundColor: isSelected ? colors.bg.elevated : 'transparent',
                        fontWeight: isSelected ? ts.label.fontWeight : 'normal',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: spacing.xs,
                      })}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          isSelected ? colors.bg.elevated : 'transparent';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, width: '100%' }}>
                        {isSelected && <Check size={14} style={{ color: colors.primary.default }} />}
                        <span style={{ flex: 1 }}>{view.name}</span>
                        {view.filters?.length > 0 && (
                          <span style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted })}>
                            {view.filters.length} filter{view.filters.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                      <span style={styles({
                        fontSize: '11px',
                        color: colors.text.muted,
                        marginLeft: isSelected ? 22 : 0,
                      })}>
                        Shared by {view._sharedByName || view._sharedBy || 'someone'}
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {/* Add New View */}
            <div style={styles({ borderTop: `1px solid ${colors.border.subtle}`, padding: spacing.xs })}>
              <button
                onClick={handleCreateNew}
                style={styles({
                  ...dropdownStyles.viewItem,
                  borderRadius: radius.md,
                  color: colors.primary.default,
                })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.elevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus size={14} />
                <span>Create New View</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Builder Modal */}
      {showBuilder && (
        <Modal
          open={showBuilder}
          onClose={() => {
            setShowBuilder(false);
            setEditingView(null);
          }}
          title={editingView ? 'Edit View' : 'Create New View'}
          size="2xl"
        >
          <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.lg, padding: spacing.lg })}>
            {/* Name */}
            <Input
              label="View Name"
              value={builderName}
              onChange={setBuilderName}
              placeholder="e.g., Active Projects, High Priority"
              required
            />

            {/* Tabs */}
            <div style={styles({ display: 'flex', gap: spacing.xs, borderBottom: `1px solid ${colors.border.subtle}` })}>
              <button
                onClick={() => setActiveTab('filters')}
                style={styles({
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: ts.body.fontSize,
                  fontWeight: activeTab === 'filters' ? ts.label.fontWeight : 'normal',
                  color: activeTab === 'filters' ? colors.primary.default : colors.text.muted,
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'filters' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                })}
              >
                <Filter size={14} />
                Filters
                {builderFilters.length > 0 && (
                  <span style={styles({
                    backgroundColor: colors.primary.default,
                    color: '#fff',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: radius.full,
                    fontWeight: '600',
                  })}>
                    {builderFilters.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('columns')}
                style={styles({
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: ts.body.fontSize,
                  fontWeight: activeTab === 'columns' ? ts.label.fontWeight : 'normal',
                  color: activeTab === 'columns' ? colors.primary.default : colors.text.muted,
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'columns' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                })}
              >
                <Columns size={14} />
                Columns
                {Object.values(builderColumnVisibility).some((v) => v === false) && (
                  <span style={styles({
                    backgroundColor: colors.warning?.default || '#f59e0b',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: radius.full,
                    fontWeight: '600',
                  })}>
                    {Object.values(builderColumnVisibility).filter((v) => v === false).length} hidden
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('grouping')}
                style={styles({
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: ts.body.fontSize,
                  fontWeight: activeTab === 'grouping' ? ts.label.fontWeight : 'normal',
                  color: activeTab === 'grouping' ? colors.primary.default : colors.text.muted,
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'grouping' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                })}
              >
                <Layers size={14} />
                Grouping
                {builderGroupByField && (
                  <span style={styles({
                    backgroundColor: colors.info?.default || '#3b82f6',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: radius.full,
                    fontWeight: '600',
                  })}>
                    1
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sorting')}
                style={styles({
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: ts.body.fontSize,
                  fontWeight: activeTab === 'sorting' ? ts.label.fontWeight : 'normal',
                  color: activeTab === 'sorting' ? colors.primary.default : colors.text.muted,
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'sorting' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                })}
              >
                <ArrowUpDown size={14} />
                Sorting
                {builderSorting.length > 0 && (
                  <span style={styles({
                    backgroundColor: colors.info?.default || '#3b82f6',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: radius.full,
                    fontWeight: '600',
                  })}>
                    {builderSorting.length}
                  </span>
                )}
              </button>
              {/* Sharing tab - only show when editing (not creating) */}
              {(
                <button
                  onClick={() => setActiveTab('sharing')}
                  style={styles({
                    padding: `${spacing.sm} ${spacing.md}`,
                    fontSize: ts.body.fontSize,
                    fontWeight: activeTab === 'sharing' ? ts.label.fontWeight : 'normal',
                    color: activeTab === 'sharing' ? colors.primary.default : colors.text.muted,
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'sharing' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                    marginBottom: '-1px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  })}
                >
                  <Share2 size={14} />
                  Sharing
                  {((editingView ? shares.length : pendingShareRecipients.length) > 0) && (
                    <span style={styles({
                      backgroundColor: colors.success?.default || '#22c55e',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: radius.full,
                      fontWeight: '600',
                    })}>
                      {editingView ? shares.length : pendingShareRecipients.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.md })}>
                <div style={styles({ display: 'flex', gap: spacing.md, alignItems: 'flex-end' })}>
                  <div style={{ maxWidth: 280 }}>
                    <Select
                      label="Match"
                      value={builderFilterMode}
                      onChange={(v) => setBuilderFilterMode(v === 'any' ? 'any' : 'all')}
                      options={[
                        { value: 'all', label: 'All filters (AND)' },
                        { value: 'any', label: 'Any filter (OR)' },
                      ]}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleAddFilter}>
                    <Plus size={14} style={{ marginRight: spacing.xs }} />
                    Add Filter
                  </Button>
                </div>

                {builderFilters.length === 0 ? (
                  <div
                    style={styles({
                      padding: spacing.xl,
                      textAlign: 'center',
                      color: colors.text.muted,
                      fontSize: ts.body.fontSize,
                      border: `1px dashed ${colors.border.subtle}`,
                      borderRadius: radius.md,
                    })}
                  >
                    No filters. Add filters to narrow down your view.
                  </div>
                ) : (
                  <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm })}>

                    {builderFilters.map((filter, index) => {
                      const col = effectiveColumns.find((c) => c.key === filter.field);
                      return (
                        <div
                          key={index}
                          style={styles({
                            display: 'flex',
                            gap: spacing.sm,
                            alignItems: 'center',
                            padding: spacing.md,
                            backgroundColor: colors.bg.elevated,
                            borderRadius: radius.md,
                            border: `1px solid ${colors.border.subtle}`,
                          })}
                        >
                          <Select
                            value={filter.field}
                            onChange={(value) => handleFilterFieldChange(index, value)}
                            options={effectiveColumns.length > 0 
                              ? effectiveColumns.map((c) => ({ value: c.key, label: c.label }))
                              : [{ value: 'status', label: 'Status' }]
                            }
                            placeholder="Field"
                          />
                          <Select
                            value={filter.operator}
                            onChange={(value) => handleFilterChange(index, 'operator', value)}
                            options={getOperatorOptions(col?.type)}
                            placeholder="Operator"
                          />
                          {renderValueInput(filter, index, col)}
                          <button
                            onClick={() => handleRemoveFilter(index)}
                            style={styles({
                              padding: spacing.sm,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: colors.error?.default || '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                            })}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Columns Tab */}
            {activeTab === 'columns' && (
              <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.md })}>
                <p style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 })}>
                  Select which columns to show in this view. Hidden columns will not appear in the table.
                </p>

                {hideableColumns.length === 0 ? (
                  <div
                    style={styles({
                      padding: spacing.xl,
                      textAlign: 'center',
                      color: colors.text.muted,
                      fontSize: ts.body.fontSize,
                      border: `1px dashed ${colors.border.subtle}`,
                      borderRadius: radius.md,
                    })}
                  >
                    No columns available to configure.
                  </div>
                ) : (
                  <div style={styles({ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: spacing.sm,
                  })}>
                    {hideableColumns.map((col) => {
                      const visible = isColumnVisible(col.key);
                      return (
                        <button
                          key={col.key}
                          onClick={() => toggleColumnVisibility(col.key)}
                          style={styles({
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm,
                            padding: spacing.md,
                            backgroundColor: visible ? colors.bg.surface : colors.bg.elevated,
                            border: `1px solid ${visible ? colors.border.subtle : colors.border.default}`,
                            borderRadius: radius.md,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 150ms ease',
                            opacity: visible ? 1 : 0.6,
                          })}
                        >
                          {visible ? (
                            <Eye size={16} style={{ color: colors.success?.default || '#22c55e' }} />
                          ) : (
                            <EyeOff size={16} style={{ color: colors.text.muted }} />
                          )}
                          <span style={styles({
                            flex: 1,
                            fontSize: ts.body.fontSize,
                            color: visible ? colors.text.primary : colors.text.muted,
                            textDecoration: visible ? 'none' : 'line-through',
                          })}>
                            {col.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quick actions */}
                <div style={styles({ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' })}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // Show all columns
                      setBuilderColumnVisibility({});
                    }}
                  >
                    Show All
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // Hide all columns (except first one)
                      const hidden: Record<string, boolean> = {};
                      hideableColumns.forEach((col, i) => {
                        if (i > 0) hidden[col.key] = false;
                      });
                      setBuilderColumnVisibility(hidden);
                    }}
                  >
                    Hide All
                  </Button>
                </div>
              </div>
            )}

            {/* Grouping Tab */}
            {activeTab === 'grouping' && (
              <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.md })}>
                <p style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 })}>
                  Group rows by a field. Group order is derived from data when available (e.g. a corresponding <code>*SortOrder</code> field); otherwise it falls back to alphabetical.
                </p>

                <div style={styles({ 
                  padding: spacing.md,
                  backgroundColor: colors.bg.elevated,
                  borderRadius: radius.md,
                  border: `1px solid ${colors.border.subtle}`,
                })}>
                  <Select
                    label="Group By Field"
                    value={builderGroupByField}
                    onChange={setBuilderGroupByField}
                    options={[
                      { value: '', label: 'No grouping' },
                      ...effectiveColumns.map((c) => ({ 
                        value: c.key, 
                        label: c.label + (c.type === 'select' && c.options?.some((o) => o.sortOrder !== undefined) ? ' (has sort order)' : ''),
                      })),
                    ]}
                    placeholder="Select field to group by..."
                  />
                </div>

                {builderGroupByField && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setBuilderGroupByField('')}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Clear Grouping
                  </Button>
                )}
              </div>
            )}

            {/* Sorting Tab */}
            {activeTab === 'sorting' && (
              <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.md })}>
                <p style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 })}>
                  Set the default sorting for this view. This affects the initial query/order when the view is selected.
                </p>

                <div style={styles({ display: 'flex', justifyContent: 'flex-end' })}>
                  <Button variant="secondary" size="sm" onClick={handleAddSort}>
                    <Plus size={14} style={{ marginRight: spacing.xs }} />
                    Add Sort
                  </Button>
                </div>

                {builderSorting.length === 0 ? (
                  <div
                    style={styles({
                      padding: spacing.xl,
                      textAlign: 'center',
                      color: colors.text.muted,
                      fontSize: ts.body.fontSize,
                      border: `1px dashed ${colors.border.subtle}`,
                      borderRadius: radius.md,
                    })}
                  >
                    No sorting rules. The table default sorting will be used.
                  </div>
                ) : (
                  <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm, overflowY: 'auto', maxHeight: '38vh' })}>
                    {builderSorting.map((sort, index) => (
                      <div
                        key={`${sort.id}-${index}`}
                        style={styles({
                          display: 'flex',
                          gap: spacing.sm,
                          alignItems: 'center',
                          padding: spacing.md,
                          backgroundColor: colors.bg.elevated,
                          borderRadius: radius.md,
                          border: `1px solid ${colors.border.subtle}`,
                        })}
                      >
                        <Select
                          value={sort.id}
                          onChange={(value) => handleSortChange(index, { id: value })}
                          options={effectiveColumns.map((c) => ({ value: c.key, label: c.label }))}
                          placeholder="Field"
                        />
                        <Select
                          value={sort.desc ? 'desc' : 'asc'}
                          onChange={(value) => handleSortChange(index, { desc: value === 'desc' })}
                          options={[
                            { value: 'asc', label: 'Ascending' },
                            { value: 'desc', label: 'Descending' },
                          ]}
                          placeholder="Direction"
                        />
                        <button
                          onClick={() => handleRemoveSort(index)}
                          style={styles({
                            padding: spacing.sm,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: colors.error?.default || '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                          })}
                          title="Remove sort"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sharing Tab */}
            {activeTab === 'sharing' && (
              <TableViewSharingPanel
                viewId={editingView?.id || null}
                shares={shares}
                setShares={setShares}
                sharesLoading={sharesLoading}
                pendingRecipients={pendingShareRecipients}
                setPendingRecipients={setPendingShareRecipients}
                addShare={addShare}
                removeShare={removeShare}
                fetchPrincipals={fetchPrincipals}
              />
            )}

            {/* Actions */}
            <div
              style={styles({
                display: 'flex',
                gap: spacing.md,
                justifyContent: 'flex-end',
                paddingTop: spacing.lg,
                borderTop: `1px solid ${colors.border.subtle}`,
              })}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  setShowBuilder(false);
                  setEditingView(null);
                }}
                disabled={builderSaving}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveView} disabled={builderSaving || !builderName.trim()}>
                {builderSaving ? 'Saving...' : editingView ? 'Update View' : 'Create View'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Alert Dialog */}
      <AlertDialog {...alertDialog.props} />
    </div>
  );
}

