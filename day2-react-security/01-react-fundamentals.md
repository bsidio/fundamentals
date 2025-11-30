# Day 2 - Morning: React Fundamentals (1-1.5h)

## Goals
- Build a small dashboard-like UI
- Understand state, props, and data fetching
- Learn React's rendering model and optimization patterns
- Master essential hooks and component patterns

---

## React Mental Model

### How React Works

```
State Change → Reconciliation → DOM Update
     │              │               │
     │              │               └─ Minimal DOM mutations
     │              └─ Virtual DOM diff
     └─ Triggers re-render
```

**Key Concepts:**
1. **Declarative**: Describe what UI should look like, React figures out how
2. **Component-Based**: Build encapsulated components that manage their own state
3. **Unidirectional Data Flow**: Data flows down (props), events flow up (callbacks)

### The Render Cycle

```tsx
// 1. Initial render: Component called with initial state
function Counter() {
  const [count, setCount] = useState(0);  // Initialize state

  // 2. Return JSX describing what to render
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// 3. On click: setCount(1) schedules a re-render
// 4. Re-render: Component called again with new state (count = 1)
// 5. React diffs old vs new JSX
// 6. Only changed parts update in real DOM
```

### Why Re-renders Happen

| Trigger | Example |
|---------|---------|
| State change | `setState(newValue)` |
| Props change | Parent passes new props |
| Context change | Context provider value changes |
| Parent re-render | Parent component re-renders |

---

## Project Setup

```bash
# Create React app with TypeScript
npm create vite@latest experiment-dashboard -- --template react-ts
cd experiment-dashboard
npm install
npm run dev
```

---

## Core Concepts

### Components

```tsx
// Functional component (modern React)
function RunCard({ run }: { run: Run }) {
  return (
    <div className="run-card">
      <h3>Run: {run.id}</h3>
      <p>Status: {run.status}</p>
    </div>
  );
}
```

### Props vs State

| Aspect | Props | State |
|--------|-------|-------|
| Owner | Parent component | Component itself |
| Mutability | Read-only | Mutable via setState |
| Purpose | Pass data down | Internal component data |
| Updates | Parent re-renders | Causes re-render |

```tsx
// Props: passed from parent
function RunList({ runs }: { runs: Run[] }) {
  return (
    <ul>
      {runs.map(run => <RunCard key={run.id} run={run} />)}
    </ul>
  );
}

// State: internal to component
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## Key Hooks

### useState

```tsx
// Simple state
const [count, setCount] = useState(0);

// Object state
const [filters, setFilters] = useState({ status: '', owner: '' });

// Update object state (spread to preserve other fields)
setFilters(prev => ({ ...prev, status: 'completed' }));
```

### useEffect

```tsx
// Run on mount (empty deps)
useEffect(() => {
  fetchData();
}, []);

// Run when dependency changes
useEffect(() => {
  fetchExperiment(experimentId);
}, [experimentId]);

// Cleanup (return function)
useEffect(() => {
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);  // Cleanup on unmount
}, []);
```

### useMemo

```tsx
// Memoize expensive computation
const sortedRuns = useMemo(() => {
  return [...runs].sort((a, b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}, [runs]);  // Only recalculate when runs changes
```

---

## Exercise: RunList Component

Create a component that renders a static list of runs.

### Types (`types.ts`)

```tsx
export interface Run {
  id: string;
  experimentId: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'completed' | 'failed';
  seed?: number;
}

export interface Experiment {
  id: string;
  name: string;
  owner: string;
  description?: string;
  status: string;
  createdAt: string;
}
```

### Mock Data (`mockData.ts`)

```tsx
import { Run, Experiment } from './types';

export const mockExperiments: Experiment[] = [
  {
    id: '1',
    name: 'Hyperparameter Search v1',
    owner: 'alice',
    description: 'Testing learning rates',
    status: 'running',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Model Architecture Test',
    owner: 'bob',
    status: 'completed',
    createdAt: '2024-01-14T08:00:00Z'
  }
];

export const mockRuns: Run[] = [
  { id: 'r1', experimentId: '1', startedAt: '2024-01-15T10:05:00Z', status: 'running', seed: 42 },
  { id: 'r2', experimentId: '1', startedAt: '2024-01-15T09:00:00Z', endedAt: '2024-01-15T09:30:00Z', status: 'completed', seed: 43 },
  { id: 'r3', experimentId: '2', startedAt: '2024-01-14T08:05:00Z', endedAt: '2024-01-14T08:45:00Z', status: 'completed', seed: 100 },
  { id: 'r4', experimentId: '2', startedAt: '2024-01-14T09:00:00Z', endedAt: '2024-01-14T09:10:00Z', status: 'failed', seed: 101 }
];
```

### RunList Component (`components/RunList.tsx`)

```tsx
import { Run } from '../types';

interface RunListProps {
  runs: Run[];
}

function StatusBadge({ status }: { status: Run['status'] }) {
  const colors = {
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 rounded text-sm ${colors[status]}`}>
      {status}
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export function RunList({ runs }: RunListProps) {
  if (runs.length === 0) {
    return <p>No runs found.</p>;
  }

  return (
    <div className="run-list">
      <table>
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Started</th>
            <th>Status</th>
            <th>Seed</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr key={run.id}>
              <td>{run.id}</td>
              <td>{formatDate(run.startedAt)}</td>
              <td><StatusBadge status={run.status} /></td>
              <td>{run.seed ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### App Component (`App.tsx`)

```tsx
import { useState } from 'react';
import { RunList } from './components/RunList';
import { mockRuns } from './mockData';

function App() {
  const [runs] = useState(mockRuns);

  return (
    <div className="app">
      <h1>Experiment Tracker</h1>
      <RunList runs={runs} />
    </div>
  );
}

export default App;
```

---

---

## useCallback - Memoizing Functions

```tsx
// Without useCallback: new function created every render
function Parent() {
  const [count, setCount] = useState(0);

  // This function is recreated every render
  const handleClick = () => console.log('clicked');

  return <Child onClick={handleClick} />;  // Child re-renders every time!
}

// With useCallback: function reference is stable
function Parent() {
  const [count, setCount] = useState(0);

  // Same function reference unless dependencies change
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);  // Empty deps = never changes

  return <Child onClick={handleClick} />;  // Child doesn't re-render unnecessarily
}
```

### When to Use useCallback

```tsx
// Use when passing callbacks to memoized children
const MemoizedChild = React.memo(Child);

function Parent() {
  const handleSubmit = useCallback((data: FormData) => {
    api.submit(data);
  }, []);  // Stable reference

  return <MemoizedChild onSubmit={handleSubmit} />;
}

// Use when callback is a dependency of other hooks
function SearchComponent() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback((q: string) => {
    api.search(q);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, debouncedSearch]);  // Safe because debouncedSearch is stable
}
```

---

## useRef - Persistent Mutable Values

```tsx
// Ref for DOM access
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus Input</button>
    </>
  );
}

// Ref for mutable values that don't trigger re-render
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <>
      <p>Count: {count}</p>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </>
  );
}
```

---

## Context API - Global State

```tsx
// 1. Create context
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Create provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: Credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create custom hook
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// 4. Use in components
function ProfileButton() {
  const { user, logout } = useAuth();

  if (!user) return <LoginButton />;

  return (
    <div>
      <span>{user.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// 5. Wrap app
function App() {
  return (
    <AuthProvider>
      <Header />
      <Main />
    </AuthProvider>
  );
}
```

---

## Custom Hooks - Reusable Logic

```tsx
// useFetch hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Request failed');
        const json = await response.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;  // Prevent state updates after unmount
    };
  }, [url]);

  return { data, loading, error };
}

// Usage
function ExperimentList() {
  const { data: experiments, loading, error } = useFetch<Experiment[]>('/api/experiments');

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <List items={experiments} />;
}
```

```tsx
// useLocalStorage hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// Usage
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

---

## Performance Optimization

### React.memo - Prevent Unnecessary Re-renders

```tsx
// Without memo: re-renders when parent re-renders
function ExpensiveComponent({ data }: { data: Data }) {
  return <div>{/* expensive rendering */}</div>;
}

// With memo: only re-renders when props change
const MemoizedExpensive = React.memo(ExpensiveComponent);

// Custom comparison function
const MemoizedWithCompare = React.memo(ExpensiveComponent, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;  // Return true to skip re-render
});
```

### Optimizing Lists

```tsx
// BAD: Index as key (causes issues with reordering)
{items.map((item, index) => <Item key={index} item={item} />)}

// GOOD: Unique stable ID as key
{items.map(item => <Item key={item.id} item={item} />)}

// Virtualization for large lists
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }: { items: Run[] }) {
  return (
    <FixedSizeList
      height={400}
      width={600}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          <RunRow run={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Code Splitting

```tsx
// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Error Boundaries

```tsx
// Class component (required for error boundaries)
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ExperimentDashboard />
    </ErrorBoundary>
  );
}
```

---

## Component Patterns

### Compound Components

```tsx
// Flexible component composition
const Tabs = ({ children }: { children: React.ReactNode }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.List = ({ children }: { children: React.ReactNode }) => (
  <div className="tabs-list">{children}</div>
);

Tabs.Tab = ({ index, children }: { index: number; children: React.ReactNode }) => {
  const { activeIndex, setActiveIndex } = useContext(TabsContext);
  return (
    <button
      className={activeIndex === index ? 'active' : ''}
      onClick={() => setActiveIndex(index)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = ({ index, children }: { index: number; children: React.ReactNode }) => {
  const { activeIndex } = useContext(TabsContext);
  if (activeIndex !== index) return null;
  return <div className="tabs-panel">{children}</div>;
};

// Usage - flexible and readable
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Runs</Tabs.Tab>
    <Tabs.Tab index={1}>Metrics</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel index={0}><RunList /></Tabs.Panel>
  <Tabs.Panel index={1}><MetricsChart /></Tabs.Panel>
</Tabs>
```

### Render Props

```tsx
// Component that provides data through render prop
function DataFetcher<T>({
  url,
  render,
}: {
  url: string;
  render: (data: T | null, loading: boolean) => React.ReactNode;
}) {
  const { data, loading } = useFetch<T>(url);
  return <>{render(data, loading)}</>;
}

// Usage
<DataFetcher<Experiment[]>
  url="/api/experiments"
  render={(experiments, loading) =>
    loading ? <Spinner /> : <ExperimentList experiments={experiments!} />
  }
/>
```

---

## Checkpoint Questions

Be ready to explain:

- [ ] **Difference between props vs state?**
  > Props are read-only data passed from parent to child. State is internal data managed by the component itself that can change. Props flow down, events/callbacks flow up.

- [ ] **When does useEffect run?**
  > After render, on mount (empty deps), on dependency change (deps array), and cleanup runs before next effect or unmount. Effects are async and don't block paint.

- [ ] **What is the key prop and why is it important?**
  > Key helps React identify which items changed in lists. It should be unique and stable (not index). Wrong keys cause performance issues and state bugs when reordering.

- [ ] **When would you use useMemo vs useCallback?**
  > useMemo memoizes computed values (expensive calculations). useCallback memoizes functions (for stable references passed to memoized children or as hook dependencies).

- [ ] **What causes unnecessary re-renders?**
  > New object/array references in props, unstable callback references, context changes, parent re-renders without memo. Use React DevTools Profiler to diagnose.

- [ ] **How do you handle global state?**
  > Context API for simple cases, state management libraries (Redux, Zustand) for complex state with many updates. Context triggers re-renders in all consumers, so split contexts or use selectors.

- [ ] **What is an error boundary?**
  > Class component that catches JavaScript errors in child components, logs them, and shows fallback UI instead of crashing. Only catches rendering errors, not event handlers or async code.
