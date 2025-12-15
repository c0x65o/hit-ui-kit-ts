'use client';

import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import type { AlertProps } from '../types';

export function Alert({ variant, title, onClose, children, ...rest }: AlertProps) {
  const { colors, radius, textStyles: ts, spacing } = useThemeTokens();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: `${colors.success.default}15`,
          border: `${colors.success.default}40`,
          icon: <CheckCircle size={20} style={{ color: colors.success.default }} />,
          title: colors.success.default,
        };
      case 'warning':
        return {
          bg: `${colors.warning.default}15`,
          border: `${colors.warning.default}40`,
          icon: <AlertTriangle size={20} style={{ color: colors.warning.default }} />,
          title: colors.warning.default,
        };
      case 'error':
        return {
          bg: `${colors.error.default}15`,
          border: `${colors.error.default}40`,
          icon: <AlertCircle size={20} style={{ color: colors.error.default }} />,
          title: colors.error.default,
        };
      case 'info':
      default:
        return {
          bg: `${colors.info.default}15`,
          border: `${colors.info.default}40`,
          icon: <Info size={20} style={{ color: colors.info.default }} />,
          title: colors.info.default,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div {...rest} style={styles({
      backgroundColor: variantStyles.bg,
      border: `1px solid ${variantStyles.border}`,
      borderRadius: radius.lg,
      padding: spacing.lg,
    })}>
      <div style={styles({ display: 'flex', gap: spacing.md })}>
        <div style={{ flexShrink: 0 }}>{variantStyles.icon}</div>
        <div style={{ flex: 1 }}>
          {title && (
            <h3 style={styles({
              fontSize: ts.body.fontSize,
              fontWeight: ts.label.fontWeight,
              color: variantStyles.title,
              margin: 0,
            })}>
              {title}
            </h3>
          )}
          <div style={styles({
            fontSize: ts.body.fontSize,
            color: colors.text.secondary,
            marginTop: title ? spacing.xs : 0,
          })}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={styles({
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: colors.text.muted,
            })}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

