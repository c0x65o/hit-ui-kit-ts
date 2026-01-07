'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import type { TableProps } from '../types';
import { formatDateTimeCellIfApplicable } from '../utils/datetime';

export function Table({ columns, data, onRowClick, emptyMessage, loading }: TableProps) {
  const { colors, textStyles: ts, spacing } = useThemeTokens();

  if (loading) {
    return (
      <div style={styles({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['5xl'],
      })}>
        <Loader2 size={32} style={{ color: colors.text.muted, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={styles({
        textAlign: 'center',
        padding: spacing['5xl'],
        color: colors.text.muted,
        fontSize: ts.body.fontSize,
      })}>
        {emptyMessage || 'No data available'}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={styles({
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: col.align || 'left',
                  fontSize: ts.bodySmall.fontSize,
                  fontWeight: ts.label.fontWeight,
                  color: colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: col.width,
                })}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row, rowIndex)}
              style={styles({
                borderBottom: `1px solid ${colors.border.subtle}`,
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 150ms ease',
              })}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = colors.bg.elevated;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={styles({
                    padding: `${spacing.md} ${spacing.lg}`,
                    textAlign: col.align || 'left',
                    fontSize: ts.body.fontSize,
                    color: colors.text.secondary,
                  })}
                >
                  {col.render
                    ? col.render(row[col.key], row, rowIndex)
                    : (formatDateTimeCellIfApplicable(col.key, row[col.key]) ?? (row[col.key] as React.ReactNode))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

