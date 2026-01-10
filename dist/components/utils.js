/**
 * Utility functions for components
 */
/**
 * Combine class names, filtering out falsy values
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
/**
 * Create inline styles from theme tokens
 */
export function styles(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}
//# sourceMappingURL=utils.js.map