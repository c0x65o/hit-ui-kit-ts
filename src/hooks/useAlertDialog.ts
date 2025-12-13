'use client';

import React, { useState, useCallback } from 'react';
import type { AlertDialogProps } from '../types';

export interface AlertDialogOptions {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface AlertDialogState extends AlertDialogOptions {
  open: boolean;
  message: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Hook for programmatically showing alert dialogs.
 * 
 * Returns state and props that can be used with AlertDialog component from useUi().
 * 
 * @example
 * ```tsx
 * const { AlertDialog } = useUi();
 * const alertDialog = useAlertDialog();
 * 
 * // Simple alert
 * await alertDialog.showAlert('Operation completed successfully!', { variant: 'success' });
 * 
 * // Confirmation dialog
 * const confirmed = await alertDialog.showConfirm('Are you sure you want to delete this?');
 * if (confirmed) {
 *   // User confirmed
 * }
 * 
 * // Render the dialog
 * <AlertDialog {...alertDialog.props} />
 * ```
 */
export function useAlertDialog() {
  const [state, setState] = useState<AlertDialogState>({
    open: false,
    message: '',
  });

  const showAlert = useCallback((
    message: React.ReactNode,
    options?: AlertDialogOptions
  ): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        variant: options?.variant || 'info',
        title: options?.title,
        confirmText: options?.confirmText || 'OK',
        size: options?.size || 'sm',
        onConfirm: () => {
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback((
    message: React.ReactNode,
    options?: AlertDialogOptions
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        variant: options?.variant || 'warning',
        title: options?.title,
        confirmText: options?.confirmText || 'OK',
        cancelText: options?.cancelText || 'Cancel',
        size: options?.size || 'sm',
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      open: false,
      onConfirm: undefined,
      onCancel: undefined,
    }));
  }, []);

  const props: AlertDialogProps = {
    open: state.open,
    onClose: close,
    variant: state.variant,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    onConfirm: state.onConfirm,
    onCancel: state.onCancel,
    size: state.size,
  };

  return {
    showAlert,
    showConfirm,
    close,
    props,
  };
}
