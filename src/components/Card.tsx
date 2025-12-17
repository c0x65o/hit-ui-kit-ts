'use client';

import React from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import type { CardProps } from '../types';

export function Card({ title, description, footer, children, className }: CardProps) {
  const { colors, radius, componentSpacing, textStyles: ts, spacing } = useThemeTokens();

  return (
    <div className={className} style={styles({
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radius.lg,
      overflow: 'hidden',
    })}>
      {(title || description) && (
        <div style={styles({
          padding: componentSpacing.card.padding,
          borderBottom: `1px solid ${colors.border.subtle}`,
        })}>
          {title && (
            <h2 style={styles({
              fontSize: ts.heading2.fontSize,
              fontWeight: ts.heading2.fontWeight,
              color: colors.text.primary,
              margin: 0,
            })}>
              {title}
            </h2>
          )}
          {description && (
            <p style={styles({
              marginTop: spacing.xs,
              fontSize: ts.body.fontSize,
              color: colors.text.secondary,
              margin: title ? `${spacing.xs} 0 0 0` : 0,
            })}>
              {description}
            </p>
          )}
        </div>
      )}
      <div style={styles({ padding: componentSpacing.card.padding })}>
        {children}
      </div>
      {footer && (
        <div style={styles({
          padding: componentSpacing.card.padding,
          backgroundColor: colors.bg.muted,
          borderTop: `1px solid ${colors.border.subtle}`,
        })}>
          {footer}
        </div>
      )}
    </div>
  );
}

