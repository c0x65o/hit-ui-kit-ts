import React from 'react';
import type { ColorTokens } from '../tokens/colors';
import { spacing, componentSpacing } from '../tokens/spacing';
import { typography, textStyles } from '../tokens/typography';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
/**
 * Complete theme object with all design tokens
 */
export interface Theme {
    name: 'dark' | 'light';
    colors: ColorTokens;
    spacing: typeof spacing;
    componentSpacing: typeof componentSpacing;
    typography: typeof typography;
    textStyles: typeof textStyles;
    radius: typeof radius;
    shadows: typeof shadows;
}
/**
 * Dark theme
 */
export declare const darkTheme: Theme;
/**
 * Light theme
 */
export declare const lightTheme: Theme;
/**
 * Theme context
 */
interface ThemeContextValue {
    theme: Theme;
    setTheme: (name: 'dark' | 'light') => void;
    toggleTheme: () => void;
}
/**
 * Check if we're inside a ThemeProvider (without throwing)
 */
export declare function useThemeContext(): ThemeContextValue | null;
/**
 * Hook to access the current theme
 */
export declare function useTheme(): ThemeContextValue;
/**
 * Hook to get just the theme object (shorthand)
 */
export declare function useThemeTokens(): Theme;
/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: 'dark' | 'light';
    /** Storage key for persisting theme preference */
    storageKey?: string;
}
/**
 * Get the default theme from config or DOM
 * Used for SSR-safe theme initialization
 */
export declare function getConfiguredTheme(): 'light' | 'dark';
/**
 * Theme Provider Component
 */
export declare function ThemeProvider({ children, defaultTheme, storageKey, }: ThemeProviderProps): React.ReactElement;
/**
 * Conditional Theme Provider
 *
 * Only wraps with ThemeProvider if there's no parent ThemeProvider.
 * This prevents SSR hydration mismatches when used inside an app that
 * already provides theme context.
 *
 * Use this in feature pack components that need to work both:
 * - Standalone (provides its own theme)
 * - Inside an app with an existing ThemeProvider (uses parent theme)
 */
interface ConditionalThemeProviderProps {
    children: React.ReactNode;
    /** Fallback theme if no parent provider and can't detect from DOM/config */
    fallbackTheme?: 'dark' | 'light';
}
export declare function ConditionalThemeProvider({ children, fallbackTheme, }: ConditionalThemeProviderProps): React.ReactElement;
export {};
//# sourceMappingURL=theme.d.ts.map