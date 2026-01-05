'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import type { SelectProps } from '../types';

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  style,
}: SelectProps) {
  const { colors, radius, componentSpacing, textStyles: ts, spacing, shadows } = useThemeTokens();
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : (placeholder || '');

  // Calculate dropdown position when opening
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Open dropdown and set position
  const openDropdown = useCallback(() => {
    if (disabled) return;
    updatePosition();
    setOpen(true);
    // Set highlighted index to current value
    const currentIndex = options.findIndex((opt) => opt.value === value);
    setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [disabled, updatePosition, options, value]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, []);

  // Handle option selection
  const selectOption = useCallback((optValue: string) => {
    onChange(optValue);
    closeDropdown();
    buttonRef.current?.focus();
  }, [onChange, closeDropdown]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        closeDropdown();
      }
    }

    function handleScroll() {
      updatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, closeDropdown, updatePosition]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open && highlightedIndex >= 0) {
          const opt = options[highlightedIndex];
          if (opt && !opt.disabled) {
            selectOption(opt.value);
          }
        } else {
          openDropdown();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          openDropdown();
        } else {
          setHighlightedIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next]?.disabled) next++;
            return next < options.length ? next : prev;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) {
          setHighlightedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next]?.disabled) next--;
            return next >= 0 ? next : prev;
          });
        }
        break;
      case 'Tab':
        if (open) {
          closeDropdown();
        }
        break;
    }
  }, [disabled, open, highlightedIndex, options, openDropdown, closeDropdown, selectOption]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (open && highlightedIndex >= 0 && dropdownRef.current) {
      const option = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (option) {
        option.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [open, highlightedIndex]);

  const dropdownContent = open && !disabled && typeof document !== 'undefined' ? createPortal(
    <div
      ref={dropdownRef}
      role="listbox"
      style={styles({
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 99999,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: radius.md,
        boxShadow: shadows.xl,
        maxHeight: '400px',
        overflowY: 'auto',
        outline: 'none',
      })}
    >
      {options.map((opt, index) => {
        const isSelected = opt.value === value;
        const isHighlighted = index === highlightedIndex;
        return (
          <div
            key={opt.value}
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              if (!opt.disabled) {
                selectOption(opt.value);
              }
            }}
            onMouseEnter={() => {
              if (!opt.disabled) {
                setHighlightedIndex(index);
              }
            }}
            style={styles({
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              width: '100%',
              padding: `${spacing.sm} ${componentSpacing.input.paddingX}`,
              fontSize: ts.body.fontSize,
              textAlign: 'left',
              color: opt.disabled ? colors.text.muted : (isSelected ? colors.primary.default : colors.text.primary),
              backgroundColor: isHighlighted ? colors.bg.elevated : 'transparent',
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
              opacity: opt.disabled ? 0.5 : 1,
              transition: 'background-color 100ms ease',
            })}
          >
            <span style={{ flex: 1 }}>{opt.label}</span>
            {isSelected && <Check size={14} style={{ color: colors.primary.default }} />}
          </div>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} style={styles({ marginBottom: spacing.md, ...style })}>
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
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => open ? closeDropdown() : openDropdown()}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={styles({
          width: '100%',
          height: componentSpacing.input.height,
          padding: `0 ${componentSpacing.input.paddingX}`,
          paddingRight: spacing.md,
          backgroundColor: colors.bg.elevated,
          border: `1px solid ${error ? colors.error.default : (open ? colors.primary.default : colors.border.default)}`,
          borderRadius: radius.md,
          color: selectedOption ? colors.text.primary : colors.text.muted,
          fontSize: ts.body.fontSize,
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          transition: 'border-color 150ms ease',
        })}
      >
        <span>{displayValue}</span>
        <ChevronDown size={16} style={{ 
          color: colors.text.muted,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 150ms ease',
        }} />
      </button>
      {dropdownContent}
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
}
