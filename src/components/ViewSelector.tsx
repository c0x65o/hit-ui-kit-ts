'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Star, Filter, Trash } from 'lucide-react';
import { useTableView, type TableView, type TableViewFilter } from '../hooks/useTableView.js';
import { useThemeTokens } from '../theme/index.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { Input } from './Input.js';
import { TextArea } from './TextArea.js';
import { Select } from './Select.js';
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
} as const;

interface ViewSelectorProps {
  tableId: string;
  onViewChange?: (view: TableView | null) => void;
  availableColumns?: Array<{ key: string; label: string; type?: string }>;
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
  const { views, currentView, loading, available, selectView, deleteView, createView, updateView } = useTableView({
    tableId,
    onViewChange,
  });
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingView, setEditingView] = useState<TableView | null>(null);
  
  // Builder form state
  const [builderName, setBuilderName] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderFilters, setBuilderFilters] = useState<TableViewFilter[]>([]);
  const [builderSaving, setBuilderSaving] = useState(false);

  const systemViews = views.filter((v) => v.isSystem);
  const customViews = views.filter((v) => !v.isSystem);

  // If API not available (feature pack not installed), don't render
  if (!available) {
    return null;
  }

  // Reset builder when opening
  useEffect(() => {
    if (showBuilder) {
      if (editingView) {
        setBuilderName(editingView.name);
        setBuilderDescription(editingView.description || '');
        setBuilderFilters(editingView.filters || []);
      } else {
        setBuilderName('');
        setBuilderDescription('');
        setBuilderFilters([]);
      }
    }
  }, [showBuilder, editingView]);

  const handleDelete = async (view: TableView, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${view.name}"?`)) {
      try {
        await deleteView(view.id);
      } catch (error: any) {
        alert(error?.message || 'Failed to delete view');
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
      alert('Please enter a view name');
      return;
    }

    setBuilderSaving(true);
    try {
      const viewData = {
        name: builderName.trim(),
        description: builderDescription.trim() || undefined,
        filters: builderFilters.filter((f) => f.field && f.operator),
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
      alert(error?.message || 'Failed to save view');
    } finally {
      setBuilderSaving(false);
    }
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
        ];
      case 'date':
        return [
          { value: 'dateEquals', label: 'Equals' },
          { value: 'dateBefore', label: 'Before' },
          { value: 'dateAfter', label: 'After' },
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'notEquals', label: 'Not Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'startsWith', label: 'Starts With' },
        ];
    }
  };

  // Inline styles
  const dropdownStyles = {
    container: styles({
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 50,
      marginTop: spacing.xs,
      minWidth: '280px',
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

            {/* Filters */}
            <div style={styles({ display: 'flex', flexDirection: 'column', gap: spacing.md })}>
              <div style={styles({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <label style={styles({ fontSize: ts.body.fontSize, fontWeight: ts.label.fontWeight })}>Filters</label>
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
                          onChange={(value) => handleFilterChange(index, 'field', value)}
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
                        <div style={{ flex: 1 }}>
                          <Input
                            value={filter.value?.toString() || ''}
                            onChange={(value) => handleFilterChange(index, 'value', value)}
                            placeholder="Value"
                          />
                        </div>
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
    </div>
  );
}

