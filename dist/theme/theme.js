'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { darkColors, lightColors } from '../tokens/colors';
import { spacing, componentSpacing } from '../tokens/spacing';
import { typography, textStyles } from '../tokens/typography';
import { radius } from '../tokens/radius';
import { shadows, darkShadows } from '../tokens/shadows';
/**
 * Dark theme
 */
export const darkTheme = {
    name: 'dark',
    colors: darkColors,
    spacing,
    componentSpacing,
    typography,
    textStyles,
    radius,
    shadows: darkShadows,
};
/**
 * Light theme
 */
export const lightTheme = {
    name: 'light',
    colors: lightColors,
    spacing,
    componentSpacing,
    typography,
    textStyles,
    radius,
    shadows,
};
const ThemeContext = createContext(null);
/**
 * Hook to access the current theme
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
/**
 * Hook to get just the theme object (shorthand)
 */
export function useThemeTokens() {
    return useTheme().theme;
}
/**
 * Theme Provider Component
 */
export function ThemeProvider({ children, defaultTheme = 'dark', storageKey = 'hit-ui-theme', }) {
    // Initialize from DOM first (set by blocking script in layout.tsx) to prevent flash.
    // Falls back to localStorage, then defaultTheme.
    const [themeName, setThemeName] = useState(() => {
        // On client, read what the blocking script already set to avoid flash
        if (typeof document !== 'undefined') {
            const domTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            return domTheme;
        }
        // SSR fallback: check localStorage if available (it won't be on server)
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(storageKey);
            if (stored === 'dark' || stored === 'light') {
                return stored;
            }
        }
        return defaultTheme;
    });
    // Sync with localStorage on mount (in case DOM and localStorage are out of sync)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(storageKey);
            if (stored === 'dark' || stored === 'light') {
                // Only update if different from current state
                if (stored !== themeName) {
                    setThemeName(stored);
                }
            }
        }
    }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps
    // Update document attributes when theme changes (skip initial if already correct)
    const isInitialMount = React.useRef(true);
    useEffect(() => {
        if (typeof document !== 'undefined') {
            // Skip on initial mount if DOM already has correct theme (set by blocking script)
            const currentDomTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            if (isInitialMount.current && currentDomTheme === themeName) {
                isInitialMount.current = false;
                return;
            }
            isInitialMount.current = false;
            document.documentElement.setAttribute('data-theme', themeName);
            if (themeName === 'dark') {
                document.documentElement.classList.add('dark');
            }
            else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [themeName]);
    const setTheme = useCallback((name) => {
        setThemeName(name);
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, name);
        }
    }, [storageKey]);
    const toggleTheme = useCallback(() => {
        setTheme(themeName === 'dark' ? 'light' : 'dark');
    }, [themeName, setTheme]);
    const theme = themeName === 'dark' ? darkTheme : lightTheme;
    const value = {
        theme,
        setTheme,
        toggleTheme,
    };
    return React.createElement(ThemeContext.Provider, { value }, children);
}
//# sourceMappingURL=theme.js.map