# Day 4 - Block 1: Topic Flash Review (30-45 min)

Quick review cards for key topics. Read through and test yourself.

---

## Python

### Exceptions
```python
# Specific exceptions first, general last
try:
    data = json.loads(text)
except json.JSONDecodeError as e:
    logger.error(f"Invalid JSON: {e}")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise
```

**Q: When use exceptions vs if/else?**
> Exceptions for truly exceptional cases (file not found, network error). If/else for expected conditions (user input validation).

### Logging
```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

logger.info("Processing request", extra={"user_id": user_id})
```

**Q: What log levels exist?**
> DEBUG < INFO < WARNING < ERROR < CRITICAL

### Async vs Sync
```python
# Sync - blocks until complete
response = requests.get(url)

# Async - can do other things while waiting
async def fetch(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

# Use async for I/O-bound operations (network, file, DB)
```

**Q: When use async?**
> When handling many concurrent I/O operations (web servers, API calls). Not helpful for CPU-bound work.

---

## React

### Props vs State

| Props | State |
|-------|-------|
| Passed from parent | Internal to component |
| Read-only | Mutable via setter |
| Component receives | Component manages |

```tsx
// Props: data passed down
function Child({ name }: { name: string }) {
    return <p>{name}</p>;
}

// State: internal, changes trigger re-render
function Parent() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Data Fetching Pattern
```tsx
function useFetch<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(url)
            .then(res => res.json())
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [url]);

    return { data, loading, error };
}
```

**Q: When does useEffect run?**
> After render. With `[]` deps: only on mount. With `[x]`: when x changes. No deps: every render.

### Component Organization
```
src/
├── components/
│   ├── common/       # Button, Input, Loading
│   └── features/     # ExperimentList, RunTable
├── hooks/            # useData, useFilters
├── pages/            # Dashboard, ExperimentPage
└── types/            # TypeScript interfaces
```

**Q: Smart vs Dumb components?**
> Smart (container): manages state, fetches data. Dumb (presentational): receives props, renders UI.

---

## Database

### Indexes
```sql
-- B-tree index speeds up lookups
CREATE INDEX idx_runs_experiment ON runs(experiment_id);

-- Composite index (order matters!)
CREATE INDEX idx_metrics_run_name ON metrics(run_id, name);
-- Speeds up: WHERE run_id = ? AND name = ?
-- Speeds up: WHERE run_id = ?
-- Does NOT speed up: WHERE name = ? (no leftmost column)
```

**Q: What is an index?**
> A separate data structure (B-tree) that enables O(log n) lookups instead of O(n) table scans.

### Joins
```sql
-- INNER JOIN: only matching rows
SELECT e.name, r.status
FROM experiments e
JOIN runs r ON e.id = r.experiment_id;

-- LEFT JOIN: all left rows + matching right
SELECT e.name, COUNT(r.id) as run_count
FROM experiments e
LEFT JOIN runs r ON e.id = r.experiment_id
GROUP BY e.id;
```

**Q: Why relational DB for this project?**
> Clear entity relationships. Need ACID for consistent metrics. Complex queries for aggregations and filtering.

### N+1 Problem
```python
# BAD: 1 query for experiments + N queries for runs
for exp in db.query(Experiment).all():
    print(exp.runs)  # Each access = new query!

# GOOD: 1 query with JOIN
experiments = db.query(Experiment).options(joinedload(Experiment.runs)).all()
```

---

## Kubernetes

### Pod vs Deployment vs Service

| Resource | Purpose |
|----------|---------|
| Pod | One or more containers, ephemeral |
| Deployment | Manages pod replicas, handles updates |
| Service | Stable network endpoint for pods |

### Probes
```yaml
livenessProbe:    # Is it alive? If not, restart
  httpGet:
    path: /health
    port: 8000

readinessProbe:   # Is it ready? If not, no traffic
  httpGet:
    path: /health
    port: 8000
```

**Q: Difference between liveness and readiness?**
> Liveness: is container healthy? Fails → restart. Readiness: can accept traffic? Fails → remove from service endpoints.

### Resources
```yaml
resources:
  requests:       # Guaranteed minimum
    cpu: "250m"   # 0.25 cores
    memory: "256Mi"
  limits:         # Maximum allowed
    cpu: "500m"
    memory: "512Mi"
```

**Q: What happens if limit exceeded?**
> CPU: throttled. Memory: OOMKilled (container dies).

---

## Security

### SQL Injection
```python
# BAD
query = f"SELECT * FROM users WHERE name = '{user_input}'"

# GOOD - parameterized
db.query(User).filter(User.name == user_input)
```

### XSS
```tsx
// React escapes by default - safe
<p>{userInput}</p>

// DANGEROUS - avoid
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

### CSRF
- Attack: Trick logged-in user into making request
- Prevention: CSRF tokens in forms, SameSite cookies

**Q: How do ORMs prevent SQL injection?**
> They use parameterized queries. User input is sent separately from the query, so it's treated as data, not executable SQL.

---

## Quick Self-Test

1. When would you use async Python?
2. What's the difference between props and state?
3. Why create database indexes?
4. What's a Kubernetes Service?
5. How does React prevent XSS?
6. What's the N+1 query problem?

---

## Answers

1. I/O-bound operations with many concurrent requests (web servers, API calls)
2. Props: passed from parent, read-only. State: internal, mutable, triggers re-renders
3. Speed up queries from O(n) to O(log n) for frequently filtered/joined columns
4. Stable network endpoint that routes traffic to pods matching a selector
5. Escapes HTML by default when rendering with `{}`
6. Making N additional queries for each row in the initial result set. Fix with eager loading/joins.
