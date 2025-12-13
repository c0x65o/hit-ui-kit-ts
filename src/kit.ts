'use client';

/**
 * Default UI Kit Implementation
 * 
 * Creates a UiKit from the themed components.
 */

import type { UiKit } from './types';
import { Page } from './components/Page';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { TextArea } from './components/TextArea';
import { Select } from './components/Select';
import { Checkbox } from './components/Checkbox';
import { Table } from './components/Table';
import { DataTable } from './components/DataTable';
import { Badge } from './components/Badge';
import { Avatar } from './components/Avatar';
import { Alert } from './components/Alert';
import { Modal } from './components/Modal';
import { AlertDialog } from './components/AlertDialog';
import { Spinner } from './components/Spinner';
import { EmptyState } from './components/EmptyState';
import { Tabs } from './components/Tabs';
import { Dropdown } from './components/Dropdown';

/**
 * Default UI Kit using themed components.
 * 
 * Usage:
 * ```tsx
 * import { defaultKit, UiKitProvider, ThemeProvider } from '@hit/ui-kit';
 * 
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <UiKitProvider kit={defaultKit}>
 *         <YourApp />
 *       </UiKitProvider>
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export const defaultKit: UiKit = {
  Page,
  Card,
  Button,
  Input,
  TextArea,
  Select,
  Checkbox,
  Table,
  DataTable,
  Badge,
  Avatar,
  Alert,
  Modal,
  AlertDialog,
  Spinner,
  EmptyState,
  Tabs,
  Dropdown,
};

