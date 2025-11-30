# Day 2 - Morning: Data Fetching & Filters (1.5-2h)

## Goals
- Replace fake data with real API calls
- Implement loading and error states
- Add filtering UI

---

## Data Fetching Pattern

### Basic Fetch Hook

```tsx
import { useState, useEffect } from 'react';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useData<T>(url: string): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}
```

### Using the Hook

```tsx
function ExperimentList() {
  const { data: experiments, loading, error } = useData<Experiment[]>(
    'http://localhost:8000/experiments'
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!experiments) return null;

  return (
    <ul>
      {experiments.map(exp => (
        <ExperimentCard key={exp.id} experiment={exp} />
      ))}
    </ul>
  );
}
```

---

## Loading & Error States

### Loading Component

```tsx
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

// CSS
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Error Component

```tsx
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-container">
      <p className="error-message">Error: {message}</p>
      {onRetry && (
        <button onClick={onRetry}>Retry</button>
      )}
    </div>
  );
}
```

### Empty State

```tsx
function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  );
}
```

---

## Filter Implementation

### Filter Types

```tsx
interface ExperimentFilters {
  name: string;
  status: string;
  owner: string;
}
```

### FilterBar Component

```tsx
interface FilterBarProps {
  filters: ExperimentFilters;
  onFilterChange: (filters: ExperimentFilters) => void;
}

function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const handleChange = (field: keyof ExperimentFilters, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="filter-bar">
      {/* Text filter for name */}
      <input
        type="text"
        placeholder="Search by name..."
        value={filters.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />

      {/* Dropdown for status */}
      <select
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="running">Running</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>

      {/* Text filter for owner */}
      <input
        type="text"
        placeholder="Filter by owner..."
        value={filters.owner}
        onChange={(e) => handleChange('owner', e.target.value)}
      />
    </div>
  );
}
```

### Filtering Logic

```tsx
function ExperimentDashboard() {
  const { data: experiments, loading, error, refetch } = useData<Experiment[]>(
    'http://localhost:8000/experiments'
  );

  const [filters, setFilters] = useState<ExperimentFilters>({
    name: '',
    status: '',
    owner: ''
  });

  // Filter experiments based on current filters
  const filteredExperiments = useMemo(() => {
    if (!experiments) return [];

    return experiments.filter(exp => {
      const matchesName = exp.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesStatus = !filters.status || exp.status === filters.status;
      const matchesOwner = exp.owner.toLowerCase().includes(filters.owner.toLowerCase());

      return matchesName && matchesStatus && matchesOwner;
    });
  }, [experiments, filters]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="dashboard">
      <h1>Experiments</h1>

      <FilterBar filters={filters} onFilterChange={setFilters} />

      {filteredExperiments.length === 0 ? (
        <EmptyState message="No experiments match your filters" />
      ) : (
        <ExperimentList experiments={filteredExperiments} />
      )}
    </div>
  );
}
```

---

## Server-Side vs Client-Side Filtering

### Client-Side (Current Approach)
```tsx
// Fetch all, filter in browser
const filteredExperiments = experiments.filter(exp => ...);
```

**Pros**: Fast subsequent filters, no network requests
**Cons**: Initial load can be large, not scalable

### Server-Side Filtering
```tsx
// Send filters as query params
const url = `/experiments?status=${filters.status}&owner=${filters.owner}`;
const { data } = useData<Experiment[]>(url);
```

**Pros**: Only fetch needed data, scalable
**Cons**: Network request for each filter change

### Hybrid Approach (Debouncing)
```tsx
import { useDeferredValue } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedFilters = useDebounce(filters, 300);
const url = buildUrl(debouncedFilters);
const { data } = useData<Experiment[]>(url);
```

---

## Complete Example: Dashboard with Filters

```tsx
// App.tsx
import { useState, useMemo } from 'react';
import { Experiment, ExperimentFilters } from './types';
import { useData } from './hooks/useData';
import { FilterBar } from './components/FilterBar';
import { ExperimentList } from './components/ExperimentList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';

function App() {
  const { data: experiments, loading, error, refetch } = useData<Experiment[]>(
    'http://localhost:8000/experiments'
  );

  const [filters, setFilters] = useState<ExperimentFilters>({
    name: '',
    status: '',
    owner: ''
  });

  const filteredExperiments = useMemo(() => {
    if (!experiments) return [];

    return experiments.filter(exp => {
      const matchesName = exp.name
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchesStatus = !filters.status || exp.status === filters.status;
      const matchesOwner = exp.owner
        .toLowerCase()
        .includes(filters.owner.toLowerCase());

      return matchesName && matchesStatus && matchesOwner;
    });
  }, [experiments, filters]);

  return (
    <div className="app">
      <header>
        <h1>Experiment Tracker</h1>
      </header>

      <main>
        <FilterBar filters={filters} onFilterChange={setFilters} />

        {loading && <LoadingSpinner />}

        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {!loading && !error && (
          <ExperimentList experiments={filteredExperiments} />
        )}
      </main>
    </div>
  );
}

export default App;
```

---

## Checkpoint Questions

Be ready to explain:
- [ ] How do you handle loading and error states?
- [ ] Why use useMemo for filtering?
- [ ] Client-side vs server-side filtering trade-offs?
- [ ] What is debouncing and when would you use it?
- [ ] How would you handle pagination?
