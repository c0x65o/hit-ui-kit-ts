import React from 'react';
interface TabItem {
    id?: string;
    value?: string;
    label: string;
    content?: React.ReactNode;
}
interface ExtendedTabsProps {
    tabs: TabItem[];
    activeTab?: string;
    onChange?: (tabId: string) => void;
    defaultTab?: string;
    onTabChange?: (tabId: string) => void;
    value?: string;
    onValueChange?: (tabId: string) => void;
}
export declare function Tabs({ tabs, activeTab, onChange, defaultTab, onTabChange, value, onValueChange }: ExtendedTabsProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Tabs.d.ts.map