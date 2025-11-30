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

## 30-Second Project Pitch

> "I built an experiment tracking system for ML engineers. The problem was tracking hyperparameters, metrics, and results across training runs.
>
> It's a FastAPI backend with PostgreSQL, a React dashboard with filtering and run comparison, and it integrates with GPU clusters via SLURM.
>
> Key features: RESTful API for logging from training scripts, real-time dashboard updates, and proper caching for frequently accessed views."

---

## Interview Day Reminders

- [ ] Review this cheat sheet 30 min before
- [ ] Have water ready
- [ ] Test your audio/video
- [ ] Have a notepad for drawing
- [ ] Remember: They want you to succeed
