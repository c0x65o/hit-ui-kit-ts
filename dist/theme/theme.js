'use client';
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { darkColors, lightColors } from '../tokens/colors';
import { spacing, componentSpacing } from '../tokens/spacing';
import { typography, textStyles } from '../tokens/typography';
import { radius } from '../tokens/radius';
import { shadows, darkShadows } from '../tokens/shadows';
// =============================================================================
// COLOR HELPERS (PRIMARY COLOR DERIVATION)
// =============================================================================
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function normalizeHex(hex) {
    const raw = hex.trim();
    if (!raw)
        return null;
    const h = raw.startsWith('#') ? raw.slice(1) : raw;
    if (/^[0-9a-fA-F]{3}$/.test(h)) {
        const r = h[0];
        const g = h[1];
        const b = h[2];
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (/^[0-9a-fA-F]{6}$/.test(h))
        return `#${h}`.toLowerCase();
    return null;
}
function hexToRgb(hex) {
    const n = normalizeHex(hex);
    if (!n)
        return null;
    const v = n.slice(1);
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    return { r, g, b };
}
function rgbToHex({ r, g, b }) {
    const to = (x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
}
function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));
        switch (max) {
            case rn:
                h = ((gn - bn) / d) % 6;
                break;
            case gn:
                h = (bn - rn) / d + 2;
                break;
            case bn:
                h = (rn - gn) / d + 4;
                break;
        }
        h *= 60;
        if (h < 0)
            h += 360;
    }
    return { h, s, l };
}
function hslToRgb({ h, s, l }) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rp = 0;
    let gp = 0;
    let bp = 0;
    if (h >= 0 && h < 60) {
        rp = c;
        gp = x;
        bp = 0;
    }
    else if (h >= 60 && h < 120) {
        rp = x;
        gp = c;
        bp = 0;
    }
    else if (h >= 120 && h < 180) {
        rp = 0;
        gp = c;
        bp = x;
    }
    else if (h >= 180 && h < 240) {
        rp = 0;
        gp = x;
        bp = c;
    }
    else if (h >= 240 && h < 300) {
        rp = x;
        gp = 0;
        bp = c;
    }
    else {
        rp = c;
        gp = 0;
        bp = x;
    }
    return {
        r: (rp + m) * 255,
        g: (gp + m) * 255,
        b: (bp + m) * 255,
    };
}
function lighten(hex, amount) {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return hex;
    const hsl = rgbToHsl(rgb);
    const next = { ...hsl, l: clamp(hsl.l + amount, 0, 1) };
    return rgbToHex(hslToRgb(next));
}
function darken(hex, amount) {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return hex;
    const hsl = rgbToHsl(rgb);
    const next = { ...hsl, l: clamp(hsl.l - amount, 0, 1) };
    return rgbToHex(hslToRgb(next));
}
function computePrimaryFromBase(baseHex) {
    const normalized = normalizeHex(baseHex);
    if (!normalized)
        return null;
    return {
        default: normalized,
        hover: darken(normalized, 0.10),
        dark: darken(normalized, 0.20),
        light: lighten(normalized, 0.42),
    };
}
function primaryOverrideFromHex(primaryColor) {
    if (!primaryColor)
        return undefined;
    const primary = computePrimaryFromBase(primaryColor);
    if (!primary)
        return undefined;
    return { primary };
}
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
 * Check if we're inside a ThemeProvider (without throwing)
 */
export function useThemeContext() {
    return useContext(ThemeContext);
}
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
 * Merge color overrides into base colors
 */
function mergeColors(base, overrides) {
    if (!overrides)
        return base;
    return {
        bg: { ...base.bg, ...overrides.bg },
        border: { ...base.border, ...overrides.border },
        text: { ...base.text, ...overrides.text },
        primary: { ...base.primary, ...overrides.primary },
        secondary: { ...base.secondary, ...overrides.secondary },
        accent: { ...base.accent, ...overrides.accent },
        success: { ...base.success, ...overrides.success },
        warning: { ...base.warning, ...overrides.warning },
        error: { ...base.error, ...overrides.error },
        info: { ...base.info, ...overrides.info },
    };
}
/**
 * Get the default theme from config or DOM
 * Used for SSR-safe theme initialization
 */
export function getConfiguredTheme() {
    // First check DOM (set by blocking script) - most reliable
    if (typeof document !== 'undefined') {
        if (document.documentElement.classList.contains('dark'))
            return 'dark';
        if (document.documentElement.getAttribute('data-theme') === 'dark')
            return 'dark';
        if (document.documentElement.getAttribute('data-theme') === 'light')
            return 'light';
    }
    // Then check window config
    if (typeof window !== 'undefined') {
        const win = window;
        const theme = win.__HIT_CONFIG?.branding?.defaultTheme;
        if (theme === 'dark')
            return 'dark';
        if (theme === 'light')
            return 'light';
        // Handle 'system' - check OS preference
        if (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    }
    // Default to light (safer for SSR - matches most apps)
    return 'light';
}
/**
 * Theme Provider Component
 */
export function ThemeProvider({ children, defaultTheme = 'dark', storageKey = 'hit-ui-theme', colorOverrides, darkColorOverrides, lightColorOverrides, }) {
    // HIT config-driven primary color.
    // HitProvider may populate window.__HIT_CONFIG after initial render, so we re-check on mount.
    const [configuredPrimaryColor, setConfiguredPrimaryColor] = useState(() => {
        if (typeof window === 'undefined')
            return null;
        const win = window;
        return win.__HIT_CONFIG?.branding?.primaryColor || null;
    });
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        let cancelled = false;
        let attempts = 0;
        const poll = () => {
            if (cancelled)
                return;
            const win = window;
            const next = win.__HIT_CONFIG?.branding?.primaryColor || null;
            setConfiguredPrimaryColor((prev) => (prev === next ? prev : next));
            // If config isn't ready yet, retry briefly.
            if (!next && attempts < 30) {
                attempts += 1;
                setTimeout(poll, 50);
            }
        };
        poll();
        return () => { cancelled = true; };
    }, []);
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
    // Build theme with color overrides
    const theme = React.useMemo(() => {
        const baseTheme = themeName === 'dark' ? darkTheme : lightTheme;
        const themeSpecificOverrides = themeName === 'dark' ? darkColorOverrides : lightColorOverrides;
        const configPrimaryOverride = primaryOverrideFromHex(configuredPrimaryColor);
        // Merge: base colors -> config primary -> global overrides -> theme-specific overrides
        const mergedColors = mergeColors(mergeColors(mergeColors(baseTheme.colors, configPrimaryOverride), colorOverrides), themeSpecificOverrides);
        return {
            ...baseTheme,
            colors: mergedColors,
        };
    }, [themeName, configuredPrimaryColor, colorOverrides, darkColorOverrides, lightColorOverrides]);
    const value = {
        theme,
        setTheme,
        toggleTheme,
    };
    return React.createElement(ThemeContext.Provider, { value }, children);
}
export function ConditionalThemeProvider({ children, fallbackTheme = 'light', }) {
    const parentTheme = useThemeContext();
    // If we're already inside a ThemeProvider, just render children
    if (parentTheme) {
        return _jsx(_Fragment, { children: children });
    }
    // No parent provider - wrap with our own, using smart defaults
    const detectedTheme = getConfiguredTheme();
    return (_jsx(ThemeProvider, { defaultTheme: detectedTheme || fallbackTheme, children: children }));
}
//# sourceMappingURL=theme.js.map