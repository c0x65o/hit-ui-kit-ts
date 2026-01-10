/**
 * Design Tokens: Colors
 *
 * Single source of truth for all colors in the design system.
 * These are semantic color tokens that map to theme values.
 */
export interface ColorTokens {
    bg: {
        page: string;
        surface: string;
        elevated: string;
        muted: string;
    };
    border: {
        subtle: string;
        default: string;
        strong: string;
    };
    text: {
        primary: string;
        secondary: string;
        muted: string;
        inverse: string;
    };
    primary: {
        default: string;
        hover: string;
        light: string;
        dark: string;
    };
    secondary: {
        default: string;
        hover: string;
    };
    accent: {
        default: string;
        hover: string;
    };
    success: {
        default: string;
        light: string;
        dark: string;
    };
    warning: {
        default: string;
        light: string;
        dark: string;
    };
    error: {
        default: string;
        light: string;
        dark: string;
    };
    info: {
        default: string;
        light: string;
        dark: string;
    };
}
/**
 * Dark theme color palette
 */
export declare const darkColors: ColorTokens;
/**
 * Light theme color palette
 */
export declare const lightColors: ColorTokens;
//# sourceMappingURL=colors.d.ts.map