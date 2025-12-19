'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Star, Filter, Trash, Eye, EyeOff, Columns, Layers, Share2, Users, X } from 'lucide-react';
import { useTableView, type TableView, type TableViewFilter, type TableViewShare } from '../hooks/useTableView.js';
import { useThemeTokens } from '../theme/index.js';
import { useAlertDialog } from '../hooks/useAlertDialog.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { AlertDialog } from './AlertDialog.js';
import { Input } from './Input.js';
import { TextArea } from './TextArea.js';
import { Select } from './Select.js';
import { Checkbox } from './Checkbox.js';
import { styles } from './utils.js';

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
  /** Field type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' */
  type?: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  /** Options for select/multiselect fields (with optional sortOrder for grouping) */
  options?: Array<{ value: string; label: string; sortOrder?: number }>;
  /** Whether this column can be hidden (default: true) */
  hideable?: boolean;
}

interface ViewSelectorProps {
  tableId: string;
  onViewChange?: (view: TableView | null) => void;
  /** Column definitions with type info and options for select fields */
  availableColumns?: ViewColumnDefinition[];
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
export function ViewSelector({ tableId, onViewChange, availableColumns = [] }: ViewSelectorProps) {
  const { colors, radius, spacing, textStyles: ts, shadows } = useThemeTokens();
  const { views, currentView, loading, available, selectView, deleteView, createView, updateView, getShares, addShare, removeShare } = useTableView({
    tableId,
    onViewChange,
  });
  const alertDialog = useAlertDialog();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingView, setEditingView] = useState<TableView | null>(null);
  const [activeTab, setActiveTab] = useState<'filters' | 'columns' | 'grouping' | 'sharing'>('filters');
  
  // Builder form state
  const [builderName, setBuilderName] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderFilters, setBuilderFilters] = useState<TableViewFilter[]>([]);
  const [builderColumnVisibility, setBuilderColumnVisibility] = useState<Record<string, boolean>>({});
  const [builderGroupByField, setBuilderGroupByField] = useState<string>('');
  const [builderSaving, setBuilderSaving] = useState(false);
  
  // Share state
  const [shares, setShares] = useState<TableViewShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState<string | null>(null);

  // Categorize views
  const systemViews = views.filter((v) => v._category === 'system' || v.isSystem);
  const customViews = views.filter((v) => v._category === 'user' || (!v.isSystem && v._category !== 'shared'));
  const sharedViews = views.filter((v) => v._category === 'shared');

  // Get hideable columns (all columns are hideable by default unless specified)
  const hideableColumns = availableColumns.filter((col) => col.hideable !== false);

  // Reset builder when opening
  useEffect(() => {
    if (showBuilder) {
      if (editingView) {
        setBuilderName(editingView.name);
        setBuilderDescription(editingView.description || '');
        setBuilderFilters(editingView.filters || []);
        setBuilderColumnVisibility(editingView.columnVisibility || {});
        setBuilderGroupByField(editingView.groupBy?.field || '');
        // Load shares when editing
        setSharesLoading(true);
        getShares(editingView.id)
          .then(setShares)
          .catch(() => setShares([]))
          .finally(() => setSharesLoading(false));
      } else {
        setBuilderName('');
        setBuilderDescription('');
        setBuilderFilters([]);
        // Default: all columns visible
        setBuilderColumnVisibility({});
        setBuilderGroupByField('');
        setShares([]);
      }
      setActiveTab('filters');
      setShareEmail('');
      setShareError(null);
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
    const firstColumn = availableColumns[0];
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
    setBuilderFilters(builderFilters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, field: string, value: any) => {
    const newFilters = [...builderFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setBuilderFilters(newFilters);
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
      
      const viewData = {
        name: builderName.trim(),
        description: builderDescription.trim() || undefined,
        filters: builderFilters.filter((f) => f.field && f.operator),
        columnVisibility: hasHiddenColumns ? builderColumnVisibility : undefined,
        groupBy: groupByConfig,
      };

      if (editingView) {
        await updateView(editingView.id, viewData);
      } else {
        const newView = await createView(viewData);
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
        return [
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
    if (fieldType === 'date') {
      return (
        <div style={{ flex: 1 }}>
          <Input
            type="date"
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
        {currentView?.name || 'All Items'}
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
            {/* Show message when no views exist */}
            {views.length === 0 && !loading && (
              <div style={styles({
                padding: spacing.md,
                textAlign: 'center',
                color: colors.text.muted,
                fontSize: ts.bodySmall.fontSize,
              })}>
                No views yet. Create your first view to save filters and column preferences.
              </div>
            )}
            
            {/* System/Default Views */}
            {systemViews.length > 0 && (
              <>
                <div style={dropdownStyles.sectionHeader}>Default Views</div>
                {systemViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      selectView(view);
                      setDropdownOpen(false);
                    }}
                    style={styles({
                      ...dropdownStyles.viewItem,
                      backgroundColor: currentView?.id === view.id ? colors.bg.elevated : 'transparent',
                    })}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bg.elevated;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        currentView?.id === view.id ? colors.bg.elevated : 'transparent';
                    }}
                  >
                    {view.isDefault && <Star size={14} style={{ color: colors.primary.default }} />}
                    <span style={{ flex: 1 }}>{view.name}</span>
                    {view.filters?.length > 0 && (
                      <span style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted })}>
                        {view.filters.length} filter{view.filters.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                ))}
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
                {customViews.map((view) => (
                  <div
                    key={view.id}
                    style={styles({
                      display: 'flex',
                      alignItems: 'center',
                      padding: `${spacing.xs} ${spacing.sm} ${spacing.xs} ${spacing.md}`,
                      backgroundColor: currentView?.id === view.id ? colors.bg.elevated : 'transparent',
                      transition: 'background-color 150ms ease',
                    })}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bg.elevated;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        currentView?.id === view.id ? colors.bg.elevated : 'transparent';
                    }}
                  >
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
                ))}
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
                {sharedViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      selectView(view);
                      setDropdownOpen(false);
                    }}
                    style={styles({
                      ...dropdownStyles.viewItem,
                      backgroundColor: currentView?.id === view.id ? colors.bg.elevated : 'transparent',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: spacing.xs,
                    })}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bg.elevated;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        currentView?.id === view.id ? colors.bg.elevated : 'transparent';
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, width: '100%' }}>
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
                    })}>
                      Shared by {view._sharedByName || view._sharedBy || 'someone'}
                    </span>
                  </button>
                ))}
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
          size="lg"
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

            {/* Description */}
            <TextArea
              label="Description (optional)"
              value={builderDescription}
              onChange={setBuilderDescription}
              placeholder="Describe what this view shows"
              rows={2}
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
              {/* Sharing tab - only show when editing (not creating) */}
              {editingView && (
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
                  {shares.length > 0 && (
                    <span style={styles({
                      backgroundColor: colors.success?.default || '#22c55e',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: radius.full,
                      fontWeight: '600',
                    })}>
                      {shares.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.md })}>
                <div style={styles({ display: 'flex', justifyContent: 'flex-end' })}>
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
                      const col = availableColumns.find((c) => c.key === filter.field);
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
                            onChange={(value) => {
                              // Reset operator and value when field changes
                              const newCol = availableColumns.find((c) => c.key === value);
                              const defaultOp = getOperatorOptions(newCol?.type)[0]?.value || 'equals';
                              handleFilterChange(index, 'field', value);
                              handleFilterChange(index, 'operator', defaultOp);
                              handleFilterChange(index, 'value', '');
                            }}
                            options={availableColumns.length > 0 
                              ? availableColumns.map((c) => ({ value: c.key, label: c.label }))
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
                      ...availableColumns.map((c) => ({ 
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

            {/* Sharing Tab */}
            {activeTab === 'sharing' && editingView && (
              <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.md })}>
                <p style={styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 })}>
                  Share this view with other users. They will see it in their "Shared with me" section.
                </p>

                {/* Add share form */}
                <div style={styles({
                  display: 'flex',
                  gap: spacing.sm,
                  alignItems: 'flex-end',
                })}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Share with user (email)"
                      value={shareEmail}
                      onChange={(val) => {
                        setShareEmail(val);
                        setShareError(null);
                      }}
                      placeholder="user@example.com"
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!shareEmail.trim()}
                    onClick={async () => {
                      if (!shareEmail.trim() || !editingView) return;
                      try {
                        setShareError(null);
                        const newShare = await addShare(editingView.id, 'user', shareEmail.trim());
                        setShares((prev) => [...prev, newShare]);
                        setShareEmail('');
                      } catch (err: any) {
                        setShareError(err?.message || 'Failed to share');
                      }
                    }}
                  >
                    <Plus size={14} style={{ marginRight: spacing.xs }} />
                    Share
                  </Button>
                </div>

                {shareError && (
                  <div style={styles({
                    padding: spacing.sm,
                    backgroundColor: '#fef2f2',
                    color: colors.error?.default || '#ef4444',
                    borderRadius: radius.md,
                    fontSize: ts.bodySmall.fontSize,
                  })}>
                    {shareError}
                  </div>
                )}

                {/* Current shares list */}
                {sharesLoading ? (
                  <div style={styles({
                    padding: spacing.xl,
                    textAlign: 'center',
                    color: colors.text.muted,
                  })}>
                    Loading shares...
                  </div>
                ) : shares.length === 0 ? (
                  <div style={styles({
                    padding: spacing.xl,
                    textAlign: 'center',
                    color: colors.text.muted,
                    fontSize: ts.body.fontSize,
                    border: `1px dashed ${colors.border.subtle}`,
                    borderRadius: radius.md,
                  })}>
                    This view is not shared with anyone yet.
                  </div>
                ) : (
                  <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm })}>
                    <div style={styles({
                      fontSize: ts.bodySmall.fontSize,
                      fontWeight: ts.label.fontWeight,
                      color: colors.text.secondary,
                    })}>
                      Shared with {shares.length} {shares.length === 1 ? 'user' : 'people'}
                    </div>
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        style={styles({
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          padding: spacing.md,
                          backgroundColor: colors.bg.elevated,
                          borderRadius: radius.md,
                          border: `1px solid ${colors.border.subtle}`,
                        })}
                      >
                        <Users size={16} style={{ color: colors.text.muted }} />
                        <div style={{ flex: 1 }}>
                          <div style={styles({ fontSize: ts.body.fontSize, color: colors.text.primary })}>
                            {share.principalId}
                          </div>
                          <div style={styles({ fontSize: '11px', color: colors.text.muted })}>
                            {share.principalType === 'user' ? 'User' : share.principalType === 'group' ? 'Group' : 'Role'}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await removeShare(editingView.id, share.principalType, share.principalId);
                              setShares((prev) => prev.filter((s) => s.id !== share.id));
                            } catch (err: any) {
                              setShareError(err?.message || 'Failed to remove share');
                            }
                          }}
                          style={styles({
                            padding: spacing.xs,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: colors.error?.default || '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                          })}
                          title="Remove share"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

