# Day 4 - Block 1: Cheat Sheet (1-1.5h)

## Your Pre-Interview Refresh Document

---

## Project Summary

**Experiment Tracker**: A system for ML engineers to track experiments, runs, and metrics.

### Core API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/experiments` | GET | List experiments (filter by owner, status) |
| `/experiments` | POST | Create experiment |
| `/experiments/{id}` | GET | Get experiment with runs |
| `/runs` | POST | Create run for experiment |
| `/runs/{id}/metrics` | POST | Log metrics |

### Request/Response Examples

```json
// POST /experiments
{
    "name": "hyperparameter-search-v1",
    "owner": "alice",
    "description": "Testing learning rates"
}

// Response
{
    "id": "exp-uuid-123",
    "name": "hyperparameter-search-v1",
    "owner": "alice",
    "status": "created",
    "created_at": "2024-01-15T10:00:00Z"
}
```

---

## Database Schema

```
experiments                    runs                        metrics
├── id (UUID, PK)             ├── id (UUID, PK)           ├── id (UUID, PK)
├── name                       ├── experiment_id (FK) ──►  ├── run_id (FK) ──►
├── owner                      ├── started_at              ├── name
├── description                ├── ended_at                ├── step
├── status                     ├── status                  ├── value
└── created_at                 └── seed                    └── timestamp

Indexes:
- experiments(owner), experiments(status)
- runs(experiment_id), runs(status, started_at)
- metrics(run_id, name), metrics(run_id, step)
```

---

## Kubernetes Deployment

### Key Manifests

```yaml
# Deployment essentials
spec:
  replicas: 3
  containers:
    resources:
      requests: { cpu: "250m", memory: "256Mi" }
      limits: { cpu: "500m", memory: "512Mi" }
    livenessProbe:
      httpGet: { path: /health, port: 8000 }
    readinessProbe:
      httpGet: { path: /health, port: 8000 }
    env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef: { name: db-creds, key: url }
```

### How to Deploy

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl rollout status deployment/backend
```

### Rolling Update

- maxSurge: 1, maxUnavailable: 0
- New pod created → becomes ready → old pod terminated
- Rollback: `kubectl rollout undo deployment/backend`

---

## Security Measures

### Authentication
- API key header (`X-API-Key`) for all endpoints
- JWT tokens for user authentication (optional)
- Token expiration and refresh

### CORS
- Whitelist allowed origins
- Only allow necessary HTTP methods

### Data Protection
- ORM/parameterized queries → prevents SQL injection
- React default escaping → prevents XSS
- CSRF tokens for forms (if applicable)
- HTTPS everywhere

### RBAC Roles
| Role | Permissions |
|------|-------------|
| Viewer | Read experiments, runs, metrics |
| Operator | Viewer + create/update runs |
| Admin | Full access |

---

## HPC Integration

### SLURM Workflow
```
User → sbatch script.sh → SLURM queue → GPU node → Training
                                              ↓
                                   Logs metrics to API
                                              ↓
                                   Writes checkpoints to shared storage
```

### Integration Points
1. Training script calls tracker API to log metrics
2. Store SLURM job ID with run for status tracking
3. Poll SLURM or use epilog webhook for completion events
4. Checkpoints on shared storage (NFS/Lustre)

### Resource Request Example
```bash
#SBATCH --partition=gpu
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=24:00:00
```

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────►│   FastAPI   │────►│  PostgreSQL │
│  Dashboard  │     │   Backend   │     │  (Primary)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
               ┌────▼────┐  ┌─────▼─────┐
               │  Redis  │  │ RabbitMQ  │
               │ (Cache) │  │  (Queue)  │
               └─────────┘  └───────────┘
```

### Scaling Strategy
- **Reads**: Redis cache + read replicas
- **Writes**: Message queue for batch inserts
- **Compute**: Stateless backends behind load balancer

### Caching
- Dashboard stats: 60s TTL
- Experiment details: 5min TTL
- Invalidate on writes

---

## Quick Tech Answers

### "Why PostgreSQL?"
> Structured data with clear relationships. Need ACID for metrics integrity. Complex queries for aggregations and joins.

### "Why FastAPI?"
> Fast, async support, automatic validation with Pydantic, auto-generated API docs.

### "Why React?"
> Industry standard, component model fits dashboard UIs, strong ecosystem.

### "Why Redis?"
> Sub-millisecond reads for hot data, simple API, good for caching and rate limiting.

### "Why message queue?"
> Decouples training jobs from API. Handles metric bursts. Enables async processing.

---

## Linux Debug Commands

```bash
# Process issues
ps aux | grep python
top / htop

# Disk issues
df -h
du -sh /var/log

# Log investigation
journalctl -u myservice -f
tail -f /var/log/app.log

# Network issues
ss -tlnp | grep 8000
curl http://localhost:8000/health

# K8s debugging
kubectl get pods
kubectl describe pod <name>
kubectl logs <pod> --previous
```

---

## ML Metrics to Know

| Metric | When to Use |
|--------|-------------|
| Accuracy | Balanced classes |
| Precision | False positives costly |
| Recall | False negatives costly |
| F1 | Balance precision/recall |
| Loss | Training optimization |

### Overfitting Detection
- Training loss ↓, Validation loss ↑
- Solution: Early stopping, regularization, more data

---

## React Architecture

### Component Hierarchy
```
App
├── Dashboard
│   ├── FilterBar
│   │   ├── SearchInput
│   │   ├── StatusFilter
│   │   └── OwnerFilter
│   ├── ExperimentList
│   │   └── ExperimentCard (repeated)
│   └── PaginationControls
└── ExperimentDetail
    ├── ExperimentHeader
    ├── RunsTable
    │   └── RunRow (repeated)
    └── MetricsChart
```

### Key Patterns
```typescript
// Custom hook for data fetching
function useExperiments(filters: Filters) {
    const [data, setData] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetchExperiments(filters)
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [filters]);

    return { data, loading, error };
}

// Memoized filtering
const filteredExperiments = useMemo(
    () => experiments.filter(e => e.name.includes(search)),
    [experiments, search]
);
```

---

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Tests
        run: |
          pip install -r requirements.txt
          pytest --cov=app tests/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Image
        run: docker build -t tracker:${{ github.sha }} .
      - name: Push to Registry
        run: docker push registry/tracker:${{ github.sha }}

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/backend \
            backend=registry/tracker:${{ github.sha }}
```

### Pipeline Stages
```
Commit → Lint → Test → Build → Push → Deploy
   │       │      │       │       │      │
   │       │      │       │       │      └─► K8s rolling update
   │       │      │       │       └─► Container registry
   │       │      │       └─► Docker image with SHA tag
   │       │      └─► pytest + coverage
   │       └─► ruff/eslint
   └─► Trigger
```

---

## Observability Stack

### Logging
```python
import structlog

logger = structlog.get_logger()

# Structured logs with context
logger.info(
    "experiment_created",
    experiment_id=exp.id,
    owner=exp.owner,
    duration_ms=elapsed
)
```

### Metrics (Prometheus)
```python
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency'
)
```

### Key Metrics to Monitor
| Metric | Alert Threshold |
|--------|-----------------|
| Error rate | > 1% |
| p99 latency | > 500ms |
| CPU usage | > 80% |
| Memory usage | > 85% |
| DB connections | > 90% pool |

---

## System Design Patterns

### Database Query Optimization
```sql
-- Before: Full table scan (slow)
SELECT * FROM metrics WHERE name = 'accuracy';

-- After: Use covering index (fast)
CREATE INDEX idx_metrics_name_value ON metrics(name, value);
SELECT name, value FROM metrics WHERE name = 'accuracy';

-- Check query plan
EXPLAIN ANALYZE SELECT ...
```

### Connection Pooling
```python
# SQLAlchemy connection pool
engine = create_engine(
    DATABASE_URL,
    pool_size=5,           # Base connections
    max_overflow=10,       # Extra connections under load
    pool_pre_ping=True,    # Check connection health
    pool_recycle=3600      # Refresh connections hourly
)
```

### Rate Limiting
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.get("/experiments")
@limiter.limit("100/minute")
async def list_experiments():
    ...
```

---

## Error Handling Patterns

### API Error Responses
```python
class APIError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status = status
        self.code = code
        self.message = message

@app.exception_handler(APIError)
async def api_error_handler(request, exc):
    return JSONResponse(
        status_code=exc.status,
        content={
            "error": exc.code,
            "message": exc.message,
            "request_id": request.state.request_id
        }
    )

# Usage
raise APIError(404, "NOT_FOUND", "Experiment not found")
```

### Retry Pattern
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
def call_external_service():
    response = requests.get(url)
    response.raise_for_status()
    return response.json()
```

---

## Common Interview Scenarios

### "API is slow" - Debug Steps
1. Check response times in APM/logs
2. Identify slow endpoint
3. Check database query times (slow query log)
4. Check external service calls
5. Profile application code
6. Check resource utilization (CPU, memory)

### "Pod keeps crashing" - Debug Steps
1. `kubectl describe pod <name>` - check events
2. `kubectl logs <pod> --previous` - crash logs
3. Check resource limits (OOMKilled?)
4. Check liveness probe configuration
5. Check application startup errors
6. Verify ConfigMaps/Secrets mounted correctly

### "Database connection errors" - Debug Steps
1. Check connection pool exhaustion
2. Verify network connectivity to DB
3. Check DB max_connections limit
4. Look for long-running transactions
5. Check for connection leaks
6. Verify credentials/SSL config

---

## Quick Reference Cards

### HTTP Status Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | No/invalid auth |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource missing |
| 409 | Conflict | Duplicate/conflict |
| 422 | Unprocessable | Validation failed |
| 500 | Server Error | Unexpected failure |
| 503 | Service Unavailable | Overloaded/maintenance |

### Python Data Structures
| Structure | Lookup | Insert | Use Case |
|-----------|--------|--------|----------|
| list | O(n) | O(1)* | Ordered, indexed |
| dict | O(1) | O(1) | Key-value, fast lookup |
| set | O(1) | O(1) | Unique, membership |
| deque | O(n) | O(1) | Queue/stack, both ends |

### SQL Query Order
```sql
SELECT      -- 5. Choose columns
FROM        -- 1. Get tables
JOIN        -- 2. Combine tables
WHERE       -- 3. Filter rows
GROUP BY    -- 4. Aggregate
HAVING      -- 6. Filter groups
ORDER BY    -- 7. Sort results
LIMIT       -- 8. Limit output
```

### Git Commands
```bash
# Common workflow
git status
git add -p                    # Interactive add
git commit -m "feat: message"
git push origin feature-branch

# Debugging
git log --oneline -10         # Recent commits
git diff HEAD~1               # Last commit changes
git blame file.py             # Line-by-line history
git bisect start              # Find bad commit

# Cleanup
git stash                     # Save work temporarily
git rebase -i HEAD~3          # Squash commits
```

---

## 30-Second Project Pitch

> "I built an experiment tracking system for ML engineers. The problem was tracking hyperparameters, metrics, and results across training runs.
>
> It's a FastAPI backend with PostgreSQL, a React dashboard with filtering and run comparison, and it integrates with GPU clusters via SLURM.
>
> Key features: RESTful API for logging from training scripts, real-time dashboard updates, and proper caching for frequently accessed views."

---

## 2-Minute Technical Deep Dive

> "Let me walk through the technical architecture.
>
> **Backend**: FastAPI with async endpoints. Pydantic handles request validation automatically. SQLAlchemy ORM with PostgreSQL - I chose this over MongoDB because we have clear entity relationships and need complex aggregation queries.
>
> **Database Design**: Three main tables - experiments, runs, metrics. The key insight was putting metrics in a separate table with composite indexes on (run_id, name) and (run_id, step) for fast time-series queries.
>
> **Frontend**: React with TypeScript. Custom hooks for data fetching with loading/error states. useMemo for client-side filtering. Component structure separates smart containers from dumb presentational components.
>
> **Deployment**: Kubernetes with Deployments, Services, and ConfigMaps. Rolling updates with health checks ensure zero downtime. Database credentials in Secrets, injected as environment variables.
>
> **Scaling considerations**: Redis cache for dashboard aggregations, message queue for high-volume metric ingestion, read replicas for query load distribution."

---

## Interview Day Reminders

### Before the Interview
- [ ] Review this cheat sheet 30 min before
- [ ] Have water ready
- [ ] Test your audio/video
- [ ] Have a notepad for drawing
- [ ] Quiet environment, good lighting

### During the Interview
- [ ] Listen to the full question before answering
- [ ] Ask clarifying questions if unclear
- [ ] Start with high-level, then go deeper
- [ ] Use concrete examples from your project
- [ ] It's OK to say "Let me think about that"
- [ ] If stuck, explain your thinking process

### Questions to Ask Them
- "What does a typical project look like?"
- "How do you handle technical debt?"
- "What's the team's approach to testing?"
- "What are the biggest challenges right now?"

### Remember
- They want you to succeed
- Show your problem-solving process
- Be honest about what you don't know
- Enthusiasm and curiosity matter
