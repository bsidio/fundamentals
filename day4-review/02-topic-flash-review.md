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

## FastAPI

### Request Validation
```python
from pydantic import BaseModel, Field

class CreateExperiment(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    owner: str
    description: str | None = None

@app.post("/experiments", status_code=201)
async def create_experiment(data: CreateExperiment):
    # Pydantic auto-validates, returns 422 on invalid
    return {"id": uuid4(), **data.model_dump()}
```

**Q: Why use Pydantic?**
> Automatic validation, type coercion, serialization. Clear error messages. Documentation generation.

### Dependency Injection
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/experiments")
def list_experiments(db: Session = Depends(get_db)):
    return db.query(Experiment).all()
```

**Q: Why dependency injection?**
> Testability (mock dependencies), code reuse, automatic cleanup. Same pattern for auth, DB, config.

### Error Handling
```python
from fastapi import HTTPException

@app.get("/experiments/{id}")
async def get_experiment(id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp
```

**Q: HTTP status code semantics?**
> 2xx success (200 OK, 201 Created). 4xx client error (400 Bad Request, 401 Unauthorized, 404 Not Found). 5xx server error.

---

## API Design

### REST Principles
```
GET    /experiments        List all
POST   /experiments        Create new
GET    /experiments/{id}   Get specific
PUT    /experiments/{id}   Full update
PATCH  /experiments/{id}   Partial update
DELETE /experiments/{id}   Remove
```

**Q: REST vs GraphQL?**
> REST: Simple, cacheable, standardized. GraphQL: Flexible queries, reduces over-fetching, single endpoint. Choose REST for simple APIs, GraphQL when clients need flexibility.

### API Versioning
```python
# URL versioning
@app.get("/v1/experiments")
@app.get("/v2/experiments")

# Header versioning
# Accept: application/vnd.api+json; version=2
```

**Q: When to version?**
> When making breaking changes. Non-breaking (add field) doesn't need version. Breaking (remove field, change type) needs version.

---

## Linux

### Process Management
```bash
# View processes
ps aux | grep python
top -c
htop

# Background/foreground
./script.sh &          # Run in background
jobs                   # List background jobs
fg %1                  # Bring job 1 to foreground
nohup ./long.sh &      # Survives logout

# Signals
kill -15 PID           # SIGTERM (graceful)
kill -9 PID            # SIGKILL (force)
kill -HUP PID          # SIGHUP (reload config)
```

**Q: SIGTERM vs SIGKILL?**
> SIGTERM (15): graceful shutdown, process can catch and cleanup. SIGKILL (9): immediate termination, cannot be caught.

### File System
```bash
# Disk usage
df -h                  # Filesystem usage
du -sh /var/log/*      # Directory sizes
ncdu                   # Interactive disk usage

# File operations
find /var -name "*.log" -mtime +7   # Files older than 7 days
xargs rm < files.txt                # Bulk delete
rsync -avz src/ dest/               # Efficient copy
```

**Q: When use find vs locate?**
> find: real-time search, slower. locate: uses index, fast but may be stale. Use find for accuracy, locate for speed.

### Networking
```bash
# Check connectivity
ping -c 3 google.com
traceroute api.example.com
dig api.example.com

# Port checking
netstat -tlnp          # Listening ports
ss -tlnp               # Modern netstat
lsof -i :8000          # What's using port 8000
curl -v http://localhost:8000/health
```

**Q: How debug "connection refused"?**
> 1) Is process running? 2) Listening on right port/interface? 3) Firewall blocking? 4) SELinux/AppArmor?

---

## Docker

### Dockerfile Best Practices
```dockerfile
# Multi-stage build for smaller image
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

**Q: Why multi-stage builds?**
> Smaller final image. Build dependencies not in production image. Better security (less attack surface).

### Docker Compose
```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://db:5432/app
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
```

**Q: depends_on vs healthcheck?**
> depends_on: start order only. healthcheck: actual readiness. Use both for proper startup orchestration.

---

## System Design

### Scaling Patterns
```
Vertical Scaling:    Bigger machine (limited)
Horizontal Scaling:  More machines (preferred)

Read-Heavy:          Caching, read replicas
Write-Heavy:         Sharding, message queues
Compute-Heavy:       Workers, async processing
```

**Q: First step when scaling?**
> Measure first! Find the actual bottleneck (CPU? Memory? I/O? Network?). Don't optimize blindly.

### Caching
```python
# Cache-aside pattern
def get_experiment(id: str):
    # 1. Check cache
    cached = redis.get(f"exp:{id}")
    if cached:
        return json.loads(cached)

    # 2. Query database
    exp = db.query(Experiment).get(id)

    # 3. Update cache
    redis.setex(f"exp:{id}", 300, exp.json())  # 5 min TTL
    return exp
```

**Q: Cache invalidation strategies?**
> TTL: simple, eventual consistency. Write-through: update cache on write. Event-based: invalidate on data change.

### Message Queues
```python
# Producer
channel.basic_publish(
    exchange='',
    routing_key='metrics',
    body=json.dumps({'run_id': '...', 'value': 0.95})
)

# Consumer
def callback(ch, method, properties, body):
    metric = json.loads(body)
    db.insert(metric)
    ch.basic_ack(delivery_tag=method.delivery_tag)
```

**Q: When use message queues?**
> Async processing, decoupling services, handling traffic spikes, reliable delivery. Examples: metrics ingestion, email sending, job processing.

---

## Observability

### Logging Best Practices
```python
import structlog

logger = structlog.get_logger()

# Structured logging with context
logger.info(
    "experiment_created",
    experiment_id=exp.id,
    owner=exp.owner,
    duration_ms=elapsed
)
```

**Q: Why structured logging?**
> Machine-parseable, filterable, aggregatable. Can query: "show all errors for experiment X in last hour."

### Metrics (Prometheus style)
```python
from prometheus_client import Counter, Histogram

requests_total = Counter(
    'api_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'api_request_duration_seconds',
    'Request latency'
)

@app.middleware("http")
async def metrics_middleware(request, call_next):
    with request_duration.time():
        response = await call_next(request)
    requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    return response
```

**Q: Key metrics to track?**
> RED: Rate (requests/sec), Errors (error rate), Duration (latency). USE: Utilization, Saturation, Errors for resources.

### Distributed Tracing
```python
# Add trace ID to all logs/requests
@app.middleware("http")
async def tracing_middleware(request, call_next):
    trace_id = request.headers.get("X-Trace-ID", str(uuid4()))
    structlog.contextvars.bind_contextvars(trace_id=trace_id)
    response = await call_next(request)
    response.headers["X-Trace-ID"] = trace_id
    return response
```

**Q: Why distributed tracing?**
> Follow request across services. Find where time is spent. Debug issues in microservices.

---

## Testing

### Testing Pyramid
```
         /\
        /  \      E2E Tests (few)
       /----\     Integration Tests (some)
      /------\    Unit Tests (many)
     /--------\
```

### Python Testing
```python
import pytest
from fastapi.testclient import TestClient

# Unit test
def test_format_metric():
    result = format_metric({"value": 0.95})
    assert result == "0.95"

# Integration test
@pytest.fixture
def client():
    return TestClient(app)

def test_create_experiment(client):
    response = client.post(
        "/experiments",
        json={"name": "test", "owner": "me"}
    )
    assert response.status_code == 201
    assert "id" in response.json()
```

**Q: Unit vs Integration tests?**
> Unit: isolated function, fast, mock dependencies. Integration: multiple components, slower, real dependencies. Both needed.

### React Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';

test('filter updates list', async () => {
    render(<ExperimentList />);

    // Find and interact with filter
    const input = screen.getByPlaceholderText('Filter...');
    fireEvent.change(input, { target: { value: 'training' } });

    // Assert filtered results
    await waitFor(() => {
        expect(screen.getByText('training-run-1')).toBeInTheDocument();
        expect(screen.queryByText('inference-run')).not.toBeInTheDocument();
    });
});
```

**Q: What to test in React?**
> User interactions, conditional rendering, async data loading, error states. Test behavior, not implementation.

---

## CI/CD

### GitHub Actions
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest --cov=app tests/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: docker/build-push-action@v5
        with:
          push: ${{ github.ref == 'refs/heads/main' }}
          tags: myapp:${{ github.sha }}
```

**Q: CI vs CD?**
> CI (Continuous Integration): automated testing on every commit. CD (Continuous Delivery): automated deployment to staging/production.

### Deployment Strategies
```yaml
# Rolling update (default)
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0

# Blue-green: run both versions, switch traffic
# Canary: gradual traffic shift to new version
```

**Q: When use each strategy?**
> Rolling: most cases, zero downtime. Blue-green: instant rollback needed. Canary: risky changes, want to monitor gradually.

---

## Quick Self-Test

### Python & FastAPI
1. When would you use async Python?
2. Why use Pydantic models?
3. What's dependency injection good for?

### React
4. What's the difference between props and state?
5. When does useEffect run?
6. What are React keys for?

### Database
7. Why create database indexes?
8. What's the N+1 query problem?
9. INNER JOIN vs LEFT JOIN?

### Kubernetes
10. What's a Kubernetes Service?
11. Liveness vs readiness probes?
12. What happens when memory limit exceeded?

### Security
13. How does React prevent XSS?
14. How do ORMs prevent SQL injection?
15. What is CSRF?

### System Design
16. When use message queues?
17. Cache invalidation strategies?
18. First step when scaling?

---

## Answers

### Python & FastAPI
1. I/O-bound operations with many concurrent requests (web servers, API calls)
2. Automatic validation, type coercion, clear error messages, documentation
3. Testability, code reuse, automatic cleanup

### React
4. Props: passed from parent, read-only. State: internal, mutable, triggers re-renders
5. After render. `[]` deps: only on mount. `[x]`: when x changes. No deps: every render
6. Help React identify list items that changed, added, or removed for efficient updates

### Database
7. Speed up queries from O(n) to O(log n) for frequently filtered/joined columns
8. Making N additional queries for each row in the initial result set. Fix with eager loading/joins
9. INNER: only matching rows. LEFT: all left rows + matching right (nulls for no match)

### Kubernetes
10. Stable network endpoint that routes traffic to pods matching a selector
11. Liveness: is alive? Fails → restart. Readiness: can accept traffic? Fails → remove from endpoints
12. Container is OOMKilled (terminated). CPU limit just throttles.

### Security
13. Escapes HTML by default when rendering with `{}`
14. Parameterized queries - user input sent separately, treated as data not code
15. Cross-Site Request Forgery: tricking logged-in user to make unintended requests

### System Design
16. Async processing, decoupling services, handling traffic spikes, reliable delivery
17. TTL (simple), write-through (strong consistency), event-based (explicit invalidation)
18. Measure first! Find the actual bottleneck before optimizing
