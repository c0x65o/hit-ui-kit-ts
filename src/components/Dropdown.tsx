'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import type { DropdownProps } from '../types';

export function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; right?: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { colors, radius, textStyles: ts, spacing, shadows } = useThemeTokens();

  // Calculate dropdown position when opened
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 224; // 14rem = 224px
      
      // Parse spacing.sm (could be "8px" or number)
      const spacingValue = typeof spacing.sm === 'string' 
        ? parseFloat(spacing.sm.replace('px', '')) || 8
        : spacing.sm || 8;
      
      let left = rect.left;
      let right: number | undefined;
      
      if (align === 'right') {
        right = window.innerWidth - rect.right;
        left = undefined as any;
      }
      
      // Ensure dropdown doesn't go off-screen
      if (align === 'left' && left + dropdownWidth > window.innerWidth) {
        // Flip to right side if it would overflow
        right = window.innerWidth - rect.right;
        left = undefined as any;
      }
      
      setPosition({
        top: rect.bottom + spacingValue,
        ...(right !== undefined ? { right } : { left }),
      });
    } else {
      setPosition(null);
    }
  }, [open, align, spacing.sm]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={triggerRef} onClick={() => setOpen(!open)}>{trigger}</div>
      {open && position && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={styles({
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            })}
          />
          <div style={styles({
            position: 'fixed',
            zIndex: 50,
            top: `${position.top}px`,
            ...(position.right !== undefined ? { right: `${position.right}px` } : { left: `${position.left}px` }),
            width: '14rem',
            maxHeight: '80vh',
            overflowY: 'auto',
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.lg,
            boxShadow: shadows.xl,
          })}>
            <div style={styles({ padding: spacing.xs })}>
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  disabled={item.disabled}
                  style={styles({
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: `${spacing.sm} ${spacing.md}`,
                    fontSize: ts.body.fontSize,
                    textAlign: 'left',
                    color: item.danger ? colors.error.default : colors.text.secondary,
                    background: 'none',
                    border: 'none',
                    borderRadius: radius.md,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    opacity: item.disabled ? 0.5 : 1,
                    transition: 'background-color 150ms ease',
                  })}
                  onMouseEnter={(e) => {
                    if (!item.disabled) {
                      e.currentTarget.style.backgroundColor = colors.bg.elevated;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

