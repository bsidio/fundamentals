# ML Experiment Tracker - Interview Study Plan

A 4-day intensive study plan for preparing to discuss a simple ML Experiment Tracking system in technical interviews.

**Total Time:** ~12 hours (8h for Days 1-3, 4h for Day 4)

**Goal:** Clearly explain and partially demo a small "experiment tracking" system covering Python, React, databases, Kubernetes, and system design.

---

## Project Overview

### Mini-Project: Simple ML Experiment Tracker

- **Backend:** Python (FastAPI)
- **Database:** PostgreSQL with proper schema design
- **Frontend:** React dashboard with filters and visualizations
- **Deployment:** Kubernetes manifests and CI/CD pipeline
- **Integration:** HPC/GPU cluster concepts

---

## Study Schedule

### Day 1 - Python + Backend + Data Modeling (6-8h)

| Block | Duration | Topics |
|-------|----------|--------|
| Morning | 3-4h | Python warmup, FastAPI basics, REST API design |
| Afternoon | 3h | Database schema design, SQL queries, ORM integration |
| Evening | 1-2h | System design sketch, architecture diagram |

**Key Deliverables:**
- Working API with `/health`, `/experiments` endpoints
- Database schema for experiments, runs, metrics
- Architecture diagram with caching and message queue

### Day 2 - React + Security (6-8h)

| Block | Duration | Topics |
|-------|----------|--------|
| Morning | 3-4h | React fundamentals, hooks, data fetching |
| Afternoon | 3h | Dashboard UI, security fundamentals (OWASP, auth) |
| Evening | 1-2h | Story building, project summary practice |

**Key Deliverables:**
- React dashboard with experiment list and filters
- Security notes (SQL injection, XSS, CSRF, RBAC)
- 2-minute project pitch

### Day 3 - Kubernetes + Linux + DevOps (6-8h)

| Block | Duration | Topics |
|-------|----------|--------|
| Morning | 3-4h | Kubernetes concepts, manifests, CI/CD pipeline |
| Afternoon | 3h | Linux fundamentals, debugging, HPC basics |
| Evening | 1-2h | ML fundamentals review |

**Key Deliverables:**
- K8s Deployment, Service, ConfigMap, Secret manifests
- CI/CD pipeline (test → build → deploy)
- Linux debugging workflow

### Day 4 - Review + Mock Interview (4h)

| Block | Duration | Topics |
|-------|----------|--------|
| Block 1 | 2h | Cheat sheet creation, topic flash review |
| Block 2 | 2h | Mock interview practice, weak spot refinement |

**Key Deliverables:**
- One-page cheat sheet
- Polished answers to common questions

---

## Core Technical Stack

| Category | Technologies |
|----------|-------------|
| **Backend** | Python, FastAPI, Pydantic, SQLAlchemy |
| **Frontend** | React, TypeScript, Tailwind CSS |
| **Database** | PostgreSQL, Redis (caching) |
| **Infrastructure** | Kubernetes, Docker, GitHub Actions |
| **Integration** | SLURM, Message Queues |

---

## Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/experiments` | List all experiments |
| POST | `/experiments` | Create new experiment |
| GET | `/experiments/{id}` | Get experiment with runs |
| POST | `/runs/{id}/metrics` | Log metrics for a run |

---

## Database Schema

```sql
experiments (id, name, owner, description, created_at, status)
runs (id, experiment_id, started_at, ended_at, status, seed)
metrics (id, run_id, name, step, value, timestamp)
```

**Key Indexes:**
- `metrics(run_id, name)` - Fast metric lookups
- `runs(experiment_id, status)` - Filtered run queries

---

## Interview Questions to Prepare

### Project & Architecture
- "Tell me about a tool you built for ML engineers."
- "Walk me through the architecture of your system."
- "How would you scale it if usage doubles?"

### Technical Deep Dives
- "Design an experiment tracking system."
- "How would you deploy it on Kubernetes?"
- "What happens during a rolling update?"

### Security & Operations
- "How do you deal with security for internal tools?"
- "What common attacks are you aware of?"
- "Backend pod is failing — how do you debug?"

### HPC & ML
- "How would your system interact with an HPC cluster?"
- "How would you coordinate hardware resource usage?"

---

## Quick Start

```bash
# Run the study app
cd study-app
npm install
npm run dev

# Docker deployment
docker-compose up --build
```

---

## Directory Structure

```
fundamentals/
├── study-app/           # Next.js study plan application
├── day1-python-backend-db/
│   ├── 01-python-warmup.md
│   ├── 02-backend-api.md
│   ├── 03-database-schema.md
│   ├── 04-db-integration.md
│   └── 05-system-design.md
├── day2-react-security/
│   ├── 01-react-fundamentals.md
│   ├── 02-data-fetching.md
│   ├── 03-dashboard-ui.md
│   └── 04-security-fundamentals.md
├── day3-k8s-linux-ml/
│   ├── 01-kubernetes-concepts.md
│   ├── 02-cicd-pipeline.md
│   ├── 03-linux-fundamentals.md
│   └── 04-ml-fundamentals.md
├── day4-review/
│   ├── 01-cheat-sheet.md
│   ├── 02-flash-review.md
│   └── 03-mock-interview-questions.md
├── docker-compose.yml
└── readme.md
```

---

## Ready When You Can...

- [ ] Explain the project in under 2 minutes
- [ ] Draw the architecture on a whiteboard
- [ ] Discuss any technology choice with reasoning
- [ ] Debug a "pod failing" scenario step-by-step
- [ ] Answer "how would you scale this?" concretely
