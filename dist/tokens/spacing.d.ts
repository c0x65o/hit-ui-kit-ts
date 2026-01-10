/**
 * Design Tokens: Spacing
 *
 * Consistent spacing scale for margins, padding, and gaps.
 * Based on a 4px base unit.
 */
export interface SpacingTokens {
    /** 0px */
    none: string;
    /** 2px */
    px: string;
    /** 4px - 0.25rem */
    xs: string;
    /** 8px - 0.5rem */
    sm: string;
    /** 12px - 0.75rem */
    md: string;
    /** 16px - 1rem */
    lg: string;
    /** 20px - 1.25rem */
    xl: string;
    /** 24px - 1.5rem */
    '2xl': string;
    /** 32px - 2rem */
    '3xl': string;
    /** 40px - 2.5rem */
    '4xl': string;
    /** 48px - 3rem */
    '5xl': string;
    /** 64px - 4rem */
    '6xl': string;
}
export declare const spacing: SpacingTokens;
/**
 * Component-specific spacing presets
 */
export interface ComponentSpacing {
    card: {
        padding: string;
        gap: string;
    };
    input: {
        paddingX: string;
        paddingY: string;
        height: string;
        heightSm: string;
    };
    button: {
        paddingX: string;
        paddingY: string;
        height: string;
        heightSm: string;
        gap: string;
    };
    modal: {
        padding: string;
    };
    page: {
        padding: string;
        gap: string;
        maxWidth: string;
    };
}
export declare const componentSpacing: ComponentSpacing;
//# sourceMappingURL=spacing.d.ts.map