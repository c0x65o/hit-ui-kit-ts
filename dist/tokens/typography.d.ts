/**
 * Design Tokens: Typography
 *
 * Font families, sizes, weights, and line heights.
 */
export interface TypographyTokens {
    fontFamily: {
        sans: string;
        mono: string;
    };
    fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
    };
    fontWeight: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
    };
    lineHeight: {
        tight: string;
        normal: string;
        relaxed: string;
    };
    letterSpacing: {
        tight: string;
        normal: string;
        wide: string;
    };
}
export declare const typography: TypographyTokens;
/**
 * Preset text styles for common use cases
 */
export interface TextStyles {
    heading1: {
        fontSize: string;
        fontWeight: number;
        lineHeight: string;
        letterSpacing: string;
    };
    heading2: {
        fontSize: string;
        fontWeight: number;
        lineHeight: string;
    };
    heading3: {
        fontSize: string;
        fontWeight: number;
        lineHeight: string;
    };
    body: {
        fontSize: string;
        fontWeight: number;
        lineHeight: string;
    };
    bodySmall: {
        fontSize: string;
        fontWeight: number;
        lineHeight: string;
    };
    caption: {
        fontSize: string;
        fontWeight: number;
        lineHeight: string;
    };
    label: {
        fontSize: string;
        fontWeight: number;
        lineHeight: string;
    };
}
export declare const textStyles: TextStyles;
//# sourceMappingURL=typography.d.ts.map