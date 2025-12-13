'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Modal } from './Modal';
import { Button } from './Button';
import type { AlertDialogProps } from '../types';

export function AlertDialog({
  open,
  onClose,
  variant = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  size = 'sm',
}: AlertDialogProps) {
  const { colors, spacing } = useThemeTokens();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle size={24} style={{ color: colors.success.default }} />,
          iconColor: colors.success.default,
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} style={{ color: colors.warning.default }} />,
          iconColor: colors.warning.default,
        };
      case 'error':
        return {
          icon: <AlertCircle size={24} style={{ color: colors.error.default }} />,
          iconColor: colors.error.default,
        };
      case 'info':
      default:
        return {
          icon: <Info size={24} style={{ color: colors.info.default }} />,
          iconColor: colors.info.default,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isConfirmation = !!cancelText || !!onCancel;
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
    >
      <div style={styles({
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      })}>
        {/* Icon and Message */}
        <div style={styles({
          display: 'flex',
          gap: spacing.md,
          alignItems: 'flex-start',
        })}>
          <div style={{ flexShrink: 0 }}>
            {variantStyles.icon}
          </div>
          <div style={styles({
            flex: 1,
            fontSize: '14px',
            lineHeight: '1.5',
            color: colors.text.secondary,
          })}>
            {message}
          </div>
        </div>

        {/* Buttons */}
        <div style={styles({
          display: 'flex',
          gap: spacing.md,
          justifyContent: 'flex-end',
        })}>
          {isConfirmation && (
            <Button
              variant="secondary"
              onClick={handleCancel}
            >
              {cancelText || 'Cancel'}
            </Button>
          )}
          <Button
            variant={variant === 'error' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
