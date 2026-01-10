/**
 * UiKit Context
 *
 * Provides the UiKit context without importing any components.
 * Use this for lazy loading the kit.
 */
import React from 'react';
import type { UiKit } from './types';
/**
 * Hook to access UI Kit components.
 * Must be used within a UiKitProvider.
 */
export declare function useUi(): UiKit;
/**
 * Provider for UI Kit components.
 */
export declare function UiKitProvider({ kit, children, }: {
    kit: UiKit;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Creates a complete UiKit from a partial implementation.
 * Missing components will throw errors when used.
 */
export declare function createKit(partial: Partial<UiKit>): UiKit;
//# sourceMappingURL=context.d.ts.map