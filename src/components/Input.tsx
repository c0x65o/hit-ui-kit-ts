'use client';

import React from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import type { InputProps } from '../types';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, type = 'text', value, onChange, error, required, ...inputProps },
  ref
) {
  const { colors, radius, componentSpacing, textStyles: ts, spacing } = useThemeTokens();

  return (
    <div style={styles({ marginBottom: spacing.md })}>
      {label && (
        <label style={styles({
          display: 'block',
          fontSize: ts.label.fontSize,
          fontWeight: ts.label.fontWeight,
          color: colors.text.primary,
          marginBottom: spacing.xs,
        })}>
          {label}
          {required && <span style={{ color: colors.error.default, marginLeft: spacing.xs }}>*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error) || undefined}
        {...inputProps}
        style={styles({
          width: '100%',
          height: componentSpacing.input.height,
          padding: `0 ${componentSpacing.input.paddingX}`,
          backgroundColor: colors.bg.elevated,
          border: `1px solid ${error ? colors.error.default : colors.border.default}`,
          borderRadius: radius.md,
          color: colors.text.primary,
          fontSize: ts.body.fontSize,
          outline: 'none',
          opacity: inputProps.disabled ? 0.5 : 1,
          cursor: inputProps.disabled ? 'not-allowed' : 'text',
          boxSizing: 'border-box',
        })}
      />
      {error && (
        <p style={styles({
          marginTop: spacing.xs,
          fontSize: ts.bodySmall.fontSize,
          color: colors.error.default,
        })}>
          {error}
        </p>
      )}
    </div>
  );
});

