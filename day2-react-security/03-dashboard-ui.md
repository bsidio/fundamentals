# Day 2 - Afternoon: Dashboard UI (2h)

## Goals
- Build an "interview-worthy" experiment details view
- Implement status badges, formatted timestamps, run lists

---

## Experiment Details Page

### Component Structure

```
ExperimentDetails/
├── ExperimentHeader.tsx    # Name, owner, status, description
├── RunsTable.tsx           # List of runs with actions
├── MetricsChart.tsx        # Basic metric visualization
└── ExperimentDetails.tsx   # Main container
```

### ExperimentHeader Component

```tsx
import { Experiment } from '../types';

interface ExperimentHeaderProps {
  experiment: Experiment;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    created: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`status-badge ${styles[status] || styles.created}`}>
      {status}
    </span>
  );
}

export function ExperimentHeader({ experiment }: ExperimentHeaderProps) {
  const createdAt = new Date(experiment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="experiment-header">
      <div className="header-top">
        <h1>{experiment.name}</h1>
        <StatusBadge status={experiment.status} />
      </div>

      <div className="header-meta">
        <span className="owner">Owner: {experiment.owner}</span>
        <span className="created">Created: {createdAt}</span>
      </div>

      {experiment.description && (
        <p className="description">{experiment.description}</p>
      )}
    </div>
  );
}
```

### RunsTable Component

```tsx
import { Run } from '../types';

interface RunsTableProps {
  runs: Run[];
  onRunClick?: (runId: string) => void;
}

function formatDuration(startedAt: string, endedAt?: string): string {
  if (!endedAt) return 'In progress';

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const durationMs = end - start;

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function RunStatusBadge({ status }: { status: Run['status'] }) {
  const config: Record<Run['status'], { color: string; icon: string }> = {
    running: { color: 'blue', icon: '⟳' },
    completed: { color: 'green', icon: '✓' },
    failed: { color: 'red', icon: '✗' }
  };

  const { color, icon } = config[status];

  return (
    <span className={`run-status run-status--${color}`}>
      <span className="icon">{icon}</span>
      {status}
    </span>
  );
}

export function RunsTable({ runs, onRunClick }: RunsTableProps) {
  if (runs.length === 0) {
    return (
      <div className="empty-runs">
        <p>No runs yet. Start your first run!</p>
      </div>
    );
  }

  return (
    <div className="runs-section">
      <h2>Runs ({runs.length})</h2>

      <table className="runs-table">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Status</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Seed</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr
              key={run.id}
              onClick={() => onRunClick?.(run.id)}
              className={onRunClick ? 'clickable' : ''}
            >
              <td className="run-id">{run.id.slice(0, 8)}...</td>
              <td><RunStatusBadge status={run.status} /></td>
              <td>{formatTimestamp(run.startedAt)}</td>
              <td>{formatDuration(run.startedAt, run.endedAt)}</td>
              <td>{run.seed ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### MetricsChart Component (Simple Version)

```tsx
import { Metric } from '../types';

interface MetricsChartProps {
  metrics: Metric[];
  metricName: string;
}

export function MetricsChart({ metrics, metricName }: MetricsChartProps) {
  const filteredMetrics = metrics
    .filter(m => m.name === metricName)
    .sort((a, b) => a.step - b.step);

  if (filteredMetrics.length === 0) {
    return <p>No data for {metricName}</p>;
  }

  const maxValue = Math.max(...filteredMetrics.map(m => m.value));
  const minValue = Math.min(...filteredMetrics.map(m => m.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="metrics-chart">
      <h3>{metricName}</h3>

      <div className="chart-container">
        {filteredMetrics.map((metric, idx) => {
          const height = ((metric.value - minValue) / range) * 100;
          return (
            <div
              key={idx}
              className="bar"
              style={{ height: `${height}%` }}
              title={`Step ${metric.step}: ${metric.value.toFixed(4)}`}
            />
          );
        })}
      </div>

      <div className="chart-labels">
        <span>Min: {minValue.toFixed(4)}</span>
        <span>Max: {maxValue.toFixed(4)}</span>
      </div>
    </div>
  );
}
```

### Main ExperimentDetails Container

```tsx
import { useParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { ExperimentHeader } from './ExperimentHeader';
import { RunsTable } from './RunsTable';
import { MetricsChart } from './MetricsChart';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface ExperimentWithRuns {
  id: string;
  name: string;
  owner: string;
  description?: string;
  status: string;
  createdAt: string;
  runs: Run[];
}

export function ExperimentDetails() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const { data: experiment, loading, error, refetch } = useData<ExperimentWithRuns>(
    `http://localhost:8000/experiments/${experimentId}`
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!experiment) return null;

  return (
    <div className="experiment-details">
      <ExperimentHeader experiment={experiment} />

      <RunsTable
        runs={experiment.runs}
        onRunClick={(runId) => console.log('Navigate to run', runId)}
      />

      {/* Metrics section - could show for selected run */}
      <div className="metrics-section">
        <h2>Metrics</h2>
        <MetricsChart
          metrics={mockMetrics}
          metricName="accuracy"
        />
      </div>
    </div>
  );
}
```

---

## CSS Styles

```css
/* Status badges */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.bg-gray-100 { background-color: #f3f4f6; }
.text-gray-800 { color: #1f2937; }
.bg-blue-100 { background-color: #dbeafe; }
.text-blue-800 { color: #1e40af; }
.bg-green-100 { background-color: #dcfce7; }
.text-green-800 { color: #166534; }
.bg-red-100 { background-color: #fee2e2; }
.text-red-800 { color: #991b1b; }

/* Experiment header */
.experiment-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.header-top h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-meta {
  display: flex;
  gap: 24px;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Runs table */
.runs-table {
  width: 100%;
  border-collapse: collapse;
}

.runs-table th,
.runs-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.runs-table tr.clickable {
  cursor: pointer;
}

.runs-table tr.clickable:hover {
  background-color: #f9fafb;
}

/* Simple bar chart */
.chart-container {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 2px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.chart-container .bar {
  flex: 1;
  background: #3b82f6;
  min-height: 2px;
  transition: height 0.2s;
}

.chart-container .bar:hover {
  background: #2563eb;
}
```

---

## Component Organization for Larger Apps

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── experiments/      # Experiment-related components
│   │   ├── ExperimentList.tsx
│   │   ├── ExperimentCard.tsx
│   │   └── ExperimentDetails.tsx
│   └── runs/             # Run-related components
│       ├── RunsTable.tsx
│       └── RunDetails.tsx
├── hooks/                # Custom hooks
│   ├── useData.ts
│   └── useDebounce.ts
├── types/                # TypeScript interfaces
│   └── index.ts
├── api/                  # API client functions
│   └── experiments.ts
└── pages/                # Page-level components
    ├── Dashboard.tsx
    └── ExperimentPage.tsx
```

---

## Checkpoint Questions

Be ready to explain:
- [ ] How do you structure components for a dashboard?
- [ ] What makes a good status indicator?
- [ ] How would you handle real-time updates?
- [ ] When would you use a charting library vs custom?
