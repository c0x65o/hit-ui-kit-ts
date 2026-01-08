'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUi } from '../index';
import type { AclPickerProps, AclEntry, Principal, PrincipalType } from '../types/acl';

// Note: Feature packs can provide their own fetchPrincipals prop to avoid this dependency
// Removed hard dependency on @hit/feature-pack-auth-core to avoid circular imports and module bloat
// import { usePrincipals } from '@hit/feature-pack-auth-core';

/**
 * AclPicker - Main ACL picker component
 * 
 * Provides a reusable interface for managing access control lists.
 * Supports both hierarchical and granular permission modes.
 */
export function AclPicker({
  config,
  entries,
  loading: externalLoading = false,
  onAdd,
  onRemove,
  onUpdate,
  filterPrincipals,
  validateEntry,
  fetchPrincipals,
  disabled = false,
  confirmRemove = true,
  confirmRemoveMessage,
  error: externalError = null,
}: AclPickerProps) {
  const { Button, Alert, Spinner, Select, Badge, Checkbox, fetchPrincipals: globalFetchPrincipals } = useUi();
  
  // Use prop if provided, otherwise use global fetcher from UI Kit context
  const effectiveFetchPrincipals = fetchPrincipals || globalFetchPrincipals;

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPrincipalType, setSelectedPrincipalType] = useState<PrincipalType>('user');
  const [selectedPrincipalId, setSelectedPrincipalId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedHierarchicalLevel, setSelectedHierarchicalLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which principal types are enabled
  const enabledPrincipals = useMemo(() => {
    const users = config.principals.users === true || (typeof config.principals.users === 'object' && config.principals.users.enabled);
    const groups = config.principals.groups === true || (typeof config.principals.groups === 'object' && config.principals.groups.enabled);
    const roles = config.principals.roles === true || (typeof config.principals.roles === 'object' && config.principals.roles.enabled);
    return { users: !!users, groups: !!groups, roles: !!roles };
  }, [config.principals]);

  // Use custom fetcher if provided, otherwise use hook (which is now injected via prop or provided by caller)
  // Note: We removed the hard dependency on @hit/feature-pack-auth-core to avoid circular imports.
  // Callers should provide fetchPrincipals or we will show an error if it's missing.
  const hookPrincipals: Principal[] = [];
  const principalsLoading = false;

  const [customPrincipals, setCustomPrincipals] = useState<Principal[]>([]);
  const [customPrincipalsLoading, setCustomPrincipalsLoading] = useState(false);
  // Cache of all principals for display name lookups (fetched on mount)
  const [allPrincipalsCache, setAllPrincipalsCache] = useState<Principal[]>([]);

  // Fetch all principals on mount for display name lookups
  useEffect(() => {
    if (effectiveFetchPrincipals) {
      const fetchAll = async () => {
        const allPrincipals: Principal[] = [];
        try {
          if (enabledPrincipals.users) {
            const users = await effectiveFetchPrincipals('user');
            allPrincipals.push(...users);
          }
          if (enabledPrincipals.groups) {
            const groups = await effectiveFetchPrincipals('group');
            allPrincipals.push(...groups);
          }
          if (enabledPrincipals.roles) {
            const roles = await effectiveFetchPrincipals('role');
            allPrincipals.push(...roles);
          }
          setAllPrincipalsCache(allPrincipals);
        } catch (err) {
          console.error('Failed to fetch principals for cache:', err);
        }
      };
      fetchAll();
    }
  }, [effectiveFetchPrincipals, enabledPrincipals.users, enabledPrincipals.groups, enabledPrincipals.roles]);

  // Fetch principals using custom fetcher if provided (for the add form dropdown)
  useEffect(() => {
    if (effectiveFetchPrincipals && showAddForm) {
      setCustomPrincipalsLoading(true);
      effectiveFetchPrincipals(selectedPrincipalType)
        .then(setCustomPrincipals)
        .catch((err) => {
          console.error('Failed to fetch principals:', err);
          setCustomPrincipals([]);
        })
        .finally(() => setCustomPrincipalsLoading(false));
    }
  }, [effectiveFetchPrincipals, selectedPrincipalType, showAddForm]);

  const principals = effectiveFetchPrincipals ? customPrincipals : hookPrincipals;
  const principalsLoadingState = effectiveFetchPrincipals ? customPrincipalsLoading : principalsLoading;
  const principalsErrorState: Error | null =
    !effectiveFetchPrincipals && showAddForm
      ? new Error('AclPicker requires fetchPrincipals to load principal options')
      : null;

  // Filter principals
  const filteredPrincipals = useMemo(() => {
    let filtered = principals;
    if (filterPrincipals) {
      filtered = filtered.filter(filterPrincipals);
    }
    // Filter by selected type
    filtered = filtered.filter((p: Principal) => p.type === selectedPrincipalType);
    return filtered;
  }, [principals, filterPrincipals, selectedPrincipalType]);

  // Get principal options for select
  const principalOptions = useMemo(() => {
    return filteredPrincipals.map((p: Principal) => ({
      value: p.id,
      label: p.displayName,
    }));
  }, [filteredPrincipals]);

  // Reset form when principal type changes
  useEffect(() => {
    setSelectedPrincipalId('');
    setSelectedPermissions([]);
    setSelectedHierarchicalLevel('');
  }, [selectedPrincipalType]);

  // If there's only one permission option, auto-select it to reduce clicks
  useEffect(() => {
    if (!showAddForm) return;
    if (config.mode === 'hierarchical' && config.hierarchicalPermissions && config.hierarchicalPermissions.length === 1) {
      setSelectedHierarchicalLevel(config.hierarchicalPermissions[0].key);
    }
    if (config.mode === 'granular' && config.granularPermissions && config.granularPermissions.length === 1) {
      setSelectedPermissions([config.granularPermissions[0].key]);
    }
  }, [showAddForm, config.mode, config.hierarchicalPermissions, config.granularPermissions]);

  // Get available principal types
  const availablePrincipalTypes = useMemo(() => {
    const types: Array<{ value: PrincipalType; label: string }> = [];
    if (enabledPrincipals.users) {
      const label = typeof config.principals.users === 'object' && config.principals.users.label
        ? config.principals.users.label
        : 'User';
      types.push({ value: 'user', label });
    }
    if (enabledPrincipals.groups) {
      const label = typeof config.principals.groups === 'object' && config.principals.groups.label
        ? config.principals.groups.label
        : 'Group';
      types.push({ value: 'group', label });
    }
    if (enabledPrincipals.roles) {
      const label = typeof config.principals.roles === 'object' && config.principals.roles.label
        ? config.principals.roles.label
        : 'Role';
      types.push({ value: 'role', label });
    }
    return types;
  }, [enabledPrincipals, config.principals]);

  // Set default principal type if only one is available
  useEffect(() => {
    if (availablePrincipalTypes.length === 1) {
      setSelectedPrincipalType(availablePrincipalTypes[0].value);
    }
  }, [availablePrincipalTypes]);

  async function handleAdd() {
    setError(null);

    // Validation
    if (!selectedPrincipalId.trim()) {
      setError('Please select a principal');
      return;
    }

    let permissions: string[] = [];
    if (config.mode === 'hierarchical') {
      const onlyLevelKey =
        config.hierarchicalPermissions && config.hierarchicalPermissions.length === 1
          ? config.hierarchicalPermissions[0].key
          : '';
      const levelKey = selectedHierarchicalLevel || onlyLevelKey;
      if (!levelKey) {
        setError('Please select a permission level');
        return;
      }
      // Find the hierarchical permission and get its includes or use the key
      const level = config.hierarchicalPermissions?.find(p => p.key === levelKey);
      if (level?.includes && level.includes.length > 0) {
        permissions = level.includes;
      } else {
        permissions = [levelKey];
      }
    } else {
      const onlyPermKey =
        config.granularPermissions && config.granularPermissions.length === 1
          ? config.granularPermissions[0].key
          : '';
      const perms = selectedPermissions.length > 0 ? selectedPermissions : (onlyPermKey ? [onlyPermKey] : []);
      if (perms.length === 0) {
        setError('Please select at least one permission');
        return;
      }
      permissions = perms;
    }

    const newEntry: Omit<AclEntry, 'id'> = {
      principalType: selectedPrincipalType,
      principalId: selectedPrincipalId.trim(),
      permissions,
    };

    // Custom validation
    if (validateEntry) {
      const validationError = validateEntry(newEntry);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      setSaving(true);
      await onAdd(newEntry);
      
      // Reset form
      setSelectedPrincipalId('');
      setSelectedPermissions([]);
      setSelectedHierarchicalLevel('');
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add access');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(entry: AclEntry) {
    if (confirmRemove) {
      const msg = confirmRemoveMessage || 'Are you sure you want to remove this access?';
      if (!confirm(msg)) return;
    }

    try {
      setSaving(true);
      await onRemove(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove access');
    } finally {
      setSaving(false);
    }
  }

  function getPrincipalDisplayName(principalType: PrincipalType, principalId: string): string {
    // Check current principals first (for add form), then fall back to cache
    const principal = principals.find((p: Principal) => p.type === principalType && p.id === principalId)
      || allPrincipalsCache.find((p: Principal) => p.type === principalType && p.id === principalId)
      || (effectiveFetchPrincipals ? null : hookPrincipals.find((p: Principal) => p.type === principalType && p.id === principalId));
    return principal?.displayName || principalId;
  }

  function getPermissionLabel(permissionKey: string): string {
    if (config.mode === 'hierarchical') {
      const level = config.hierarchicalPermissions?.find(p => p.key === permissionKey);
      return level?.label || permissionKey;
    } else {
      const perm = config.granularPermissions?.find(p => p.key === permissionKey);
      return perm?.label || permissionKey;
    }
  }

  const title = config.labels?.title || 'Access Control';
  const addButtonLabel = config.labels?.addButton || 'Add Access';
  const removeButtonLabel = config.labels?.removeButton || 'Remove';
  const emptyMessage = config.labels?.emptyMessage || 'No access permissions set';

  const displayError = externalError || error || (principalsErrorState ? principalsErrorState.message : null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {displayError && (
        <Alert variant="error" title="Error">
          {displayError}
        </Alert>
      )}

      {externalLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
            {!disabled && (
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="secondary"
                size="sm"
              >
                {showAddForm ? 'Cancel' : addButtonLabel}
              </Button>
            )}
          </div>

          {showAddForm && !disabled && (
            <div style={{
              border: '1px solid var(--border-default, #e5e7eb)',
              borderRadius: '0.5rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-muted, #f9fafb)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <h4 style={{ fontWeight: 500 }}>Add New Access</h4>
              
              {availablePrincipalTypes.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Principal Type
                  </label>
                  <Select
                    value={selectedPrincipalType}
                    onChange={(value: string) => setSelectedPrincipalType(value as PrincipalType)}
                    options={availablePrincipalTypes}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {availablePrincipalTypes.find(t => t.value === selectedPrincipalType)?.label || 'Principal'}
                </label>
                {principalsLoadingState ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Spinner size="sm" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>Loading options...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedPrincipalId}
                    onChange={(value: string) => setSelectedPrincipalId(value)}
                    options={principalOptions}
                    placeholder={`Select ${availablePrincipalTypes.find(t => t.value === selectedPrincipalType)?.label || 'principal'}`}
                  />
                )}
              </div>

              {config.mode === 'hierarchical' && config.hierarchicalPermissions && config.hierarchicalPermissions.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Permissions
                  </label>
                  <Select
                    value={selectedHierarchicalLevel}
                    onChange={(value: string) => setSelectedHierarchicalLevel(value)}
                    options={config.hierarchicalPermissions.map(p => ({
                      value: p.key,
                      label: p.description ? `${p.label} - ${p.description}` : p.label,
                    }))}
                    placeholder="Select permission level"
                  />
                </div>
              )}

              {config.mode === 'granular' && config.granularPermissions && config.granularPermissions.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Permissions
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {config.granularPermissions.map(perm => (
                      <Checkbox
                        key={perm.key}
                        label={perm.description ? `${perm.label} - ${perm.description}` : perm.label}
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={(checked: boolean) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, perm.key]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== perm.key));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedPrincipalId('');
                    setSelectedPermissions([]);
                    setSelectedHierarchicalLevel('');
                    setError(null);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={saving || !selectedPrincipalId.trim() || 
                    (config.mode === 'hierarchical' && (config.hierarchicalPermissions?.length || 0) > 1 && !selectedHierarchicalLevel) ||
                    (config.mode === 'granular' && (config.granularPermissions?.length || 0) > 1 && selectedPermissions.length === 0)}
                  size="sm"
                >
                  {saving ? 'Adding...' : addButtonLabel}
                </Button>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #6b7280)' }}>
              {emptyMessage}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {entries.map(entry => (
                <div
                  key={entry.id || `${entry.principalType}-${entry.principalId}`}
                  style={{
                    border: '1px solid var(--border-default, #e5e7eb)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Badge variant="default">{entry.principalType}</Badge>
                      <span style={{ fontWeight: 500 }}>
                        {getPrincipalDisplayName(entry.principalType, entry.principalId)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {Array.isArray(entry.permissions) && entry.permissions.map(perm => (
                        <Badge key={perm} variant="info" style={{ fontSize: '0.75rem' }}>
                          {getPermissionLabel(perm)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {!disabled && (
                    <Button
                      onClick={() => handleRemove(entry)}
                      variant="ghost"
                      size="sm"
                      disabled={saving}
                    >
                      {removeButtonLabel}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

