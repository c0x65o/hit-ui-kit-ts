# DataTable Component Usage

The `DataTable` component is a powerful, feature-rich data table built on [TanStack Table v8](https://tanstack.com/table/latest). It provides sorting, filtering, column visibility, export, and pagination out of the box.

## Installation

First, install the required dependency in your application:

```bash
npm install @tanstack/react-table
```

## Basic Usage

```tsx
import { DataTable } from '@hit/ui-kit';

const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'role',
    label: 'Role',
    render: (value) => <Badge>{value}</Badge>,
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
  },
];

const data = [
  { name: 'John Doe', email: 'john@example.com', role: 'admin', createdAt: '2024-01-01' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'user', createdAt: '2024-01-02' },
];

function MyComponent() {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchable
      exportable
      showColumnVisibility
    />
  );
}
```

## Features

### Sorting
Click column headers to sort. Click again to reverse, third click to clear.

```tsx
const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true, // Enable sorting (default: true)
  },
];
```

### Search/Filtering
Enable global search with the `searchable` prop:

```tsx
<DataTable
  columns={columns}
  data={data}
  searchable={true} // Shows search input
/>
```

### Column Visibility
Allow users to show/hide columns:

```tsx
<DataTable
  columns={columns}
  data={data}
  showColumnVisibility={true} // Shows column visibility dropdown
/>
```

To prevent a column from being hidden:

```tsx
const columns = [
  {
    key: 'id',
    label: 'ID',
    hideable: false, // Cannot be hidden
  },
];
```

### Export to CSV
Enable CSV export:

```tsx
<DataTable
  columns={columns}
  data={data}
  exportable={true} // Shows export button
/>
```

The export includes:
- Only visible columns
- Filtered data (respects search/filters)
- Proper CSV formatting with quotes

### Pagination
Pagination is automatic. Control page size:

```tsx
<DataTable
  columns={columns}
  data={data}
  pageSize={25} // Default: 10
/>
```

### Initial State
Set initial sorting and column visibility:

```tsx
<DataTable
  columns={columns}
  data={data}
  initialSorting={[
    { id: 'name', desc: false }, // Sort by name ascending
  ]}
  initialColumnVisibility={{
    email: false, // Hide email column initially
  }}
/>
```

### Row Click Handler
Handle row clicks:

```tsx
<DataTable
  columns={columns}
  data={data}
  onRowClick={(row, index) => {
    console.log('Clicked row:', row);
    // Navigate to detail page, open modal, etc.
  }}
/>
```

### Custom Rendering
Use the `render` function for custom cell content:

```tsx
const columns = [
  {
    key: 'status',
    label: 'Status',
    render: (value, row, index) => {
      return (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value}
        </Badge>
      );
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (value, row, index) => {
      return (
        <div>
          <Button size="sm" onClick={() => handleEdit(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Delete</Button>
        </div>
      );
    },
  },
];
```

### Loading State
Show loading indicator:

```tsx
<DataTable
  columns={columns}
  data={data}
  loading={isLoading}
/>
```

### Empty State
Customize empty message:

```tsx
<DataTable
  columns={columns}
  data={[]}
  emptyMessage="No users found. Try adjusting your filters."
/>
```

## Column Configuration

### Column Props

```tsx
interface DataTableColumn {
  key: string;              // Required: unique key
  label: string;            // Required: column header
  render?: (value, row, index) => React.ReactNode; // Optional: custom render
  width?: string;           // Optional: column width (e.g., '100px', '20%')
  align?: 'left' | 'center' | 'right'; // Optional: text alignment
  sortable?: boolean;       // Optional: enable sorting (default: true)
  hideable?: boolean;       // Optional: allow hiding (default: true)
}
```

## Complete Example

```tsx
import { DataTable, Badge, Button } from '@hit/ui-kit';
import { useUsers } from '../hooks/useUsers';

function UsersTable() {
  const { data: users, loading } = useUsers();

  const columns = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <Badge variant={value === 'admin' ? 'info' : 'default'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <Badge variant={row.locked ? 'warning' : 'success'}>
          {row.locked ? 'Locked' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      hideable: false,
      render: (value, row) => (
        <Button size="sm" onClick={() => handleView(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users || []}
      loading={loading}
      searchable
      exportable
      showColumnVisibility
      pageSize={25}
      onRowClick={(row) => navigate(`/users/${row.email}`)}
      emptyMessage="No users found"
    />
  );
}
```

## Migration from Table Component

The `DataTable` is a drop-in replacement for the basic `Table` component with enhanced features:

**Before:**
```tsx
<Table columns={columns} data={data} />
```

**After:**
```tsx
<DataTable columns={columns} data={data} />
```

All existing `Table` props work with `DataTable`, plus you get the new features!

## Global Filters

Enable a filter bar above the table that automatically shows filter controls for columns with filtering configured.

### Basic Usage

Add `showGlobalFilters` and configure columns with `filterType` and `filterOptions`:

```tsx
<DataTable
  showGlobalFilters
  columns={[
    {
      key: 'status',
      label: 'Status',
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      filterType: 'multiselect',
      filterOptions: [
        { value: 'project', label: 'Project' },
        { value: 'task', label: 'Task' },
      ],
    },
  ]}
  data={data}
/>
```

### Autocomplete Filters

For entity lookups (users, companies, etc.), use `filterType: 'autocomplete'`:

```tsx
<DataTable
  showGlobalFilters
  columns={[
    {
      key: 'assignedUserId',
      label: 'Assigned User',
      filterType: 'autocomplete',
      onSearch: async (query, limit) => {
        const res = await fetch(`/api/users?search=${query}&limit=${limit}`);
        const users = await res.json();
        return users.map(u => ({ value: u.id, label: u.name }));
      },
      resolveValue: async (value) => {
        const res = await fetch(`/api/users/${value}`);
        const user = await res.json();
        return { value: user.id, label: user.name };
      },
    },
  ]}
  data={data}
/>
```

### Filter Types

| Type | Description | Required Props |
|------|-------------|----------------|
| `string` | Text input with contains matching | - |
| `number` | Number input with exact matching | - |
| `boolean` | Yes/No dropdown | - |
| `date` | Date picker | - |
| `select` | Single-select dropdown | `filterOptions` |
| `multiselect` | Multi-select with chips | `filterOptions` |
| `autocomplete` | Search-as-you-type | `onSearch`, optionally `resolveValue` |

### Advanced: Override Auto-generated Filters

Use `globalFilters` prop to customize or disable specific filters:

```tsx
<DataTable
  showGlobalFilters
  columns={columns}
  data={data}
  globalFilters={[
    { 
      columnKey: 'status', 
      label: 'Filter by Status',  // Override label
      defaultValue: 'active',     // Set default value
    },
    { 
      columnKey: 'createdAt', 
      enabled: false,             // Exclude from auto-generated filters
    },
  ]}
  onGlobalFiltersChange={(filters) => {
    // filters = { status: 'active', assignedUserId: 'user123' }
    console.log('Active filters:', filters);
  }}
/>
```

## Styling

The DataTable uses your theme tokens automatically. It respects:
- Colors (from `useThemeTokens()`)
- Spacing
- Typography
- Border radius

No additional styling needed - it matches your app's design system.
