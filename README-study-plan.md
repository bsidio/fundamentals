# ML Experiment Tracker - Interview Study Plan

**Total Time:** ~8 hours for Days 1-3, ~4 hours for Day 4 (half day)

**Goal:** Be able to clearly talk through and partially demo a tiny "experiment tracking" system.

---

## Study Plan Overview

### Day 1 - Python + Backend + Data Modeling (Full Day ~7h)

| Block | Time | Topics | File |
|-------|------|--------|------|
| Morning | 60-90 min | Python warmup (comprehensions, context managers, exceptions) | `day1-python-backend-db/01-python-warmup.md` |
| Morning | 2-2.5h | Backend API basics (Flask/FastAPI, validation, logging) | `day1-python-backend-db/02-backend-api.md` |
| Afternoon | 1.5-2h | Database schema design (tables, indexes, SQL queries) | `day1-python-backend-db/03-database-schema.md` |
| Afternoon | 1-1.5h | DB integration with API (ORM, session management) | `day1-python-backend-db/04-db-integration.md` |
| Evening | 1-2h | System design sketch (architecture, scaling, caching) | `day1-python-backend-db/05-system-design.md` |

---

### Day 2 - React + Dashboards + Security (Full Day ~7h)

| Block | Time | Topics | File |
|-------|------|--------|------|
| Morning | 1-1.5h | React fundamentals (components, props, state, hooks) | `day2-react-security/01-react-fundamentals.md` |
| Morning | 1.5-2h | Data fetching (API calls, loading/error states, filters) | `day2-react-security/02-data-fetching.md` |
| Afternoon | 2h | Dashboard UI (experiment details, status badges, metrics) | `day2-react-security/03-dashboard-ui.md` |
| Afternoon | 1h | Security fundamentals (auth, CORS, vulnerabilities) | `day2-react-security/04-security-fundamentals.md` |
| Evening | 1-2h | Building your project story (STAR format, talking points) | `day2-react-security/05-project-story.md` |

---

### Day 3 - K8s + CI/CD + Linux + HPC + ML (Full Day ~7h)

| Block | Time | Topics | File |
|-------|------|--------|------|
| Morning | 2h | Kubernetes concepts (deployments, services, manifests) | `day3-k8s-linux-ml/01-kubernetes-concepts.md` |
| Morning | 1.5-2h | CI/CD pipeline (stages, branching, image tagging) | `day3-k8s-linux-ml/02-cicd-pipeline.md` |
| Afternoon | 1-1.5h | Linux fundamentals (debugging, processes, logs) | `day3-k8s-linux-ml/03-linux-fundamentals.md` |
| Afternoon | 1h | Infrastructure components (Redis, message queues) | `day3-k8s-linux-ml/04-infrastructure-components.md` |
| Afternoon | 30-45 min | HPC basics (SLURM, GPU resources, integration) | `day3-k8s-linux-ml/05-hpc-basics.md` |
| Evening | 1-2h | ML fundamentals (training loop, metrics, tracking) | `day3-k8s-linux-ml/06-ml-fundamentals.md` |

---

### Day 4 - Review & Mock Interview (Half Day ~4h)

| Block | Time | Topics | File |
|-------|------|--------|------|
| Block 1 | 1-1.5h | Cheat sheet creation (one-page reference) | `day4-review/01-cheat-sheet.md` |
| Block 1 | 30-45 min | Topic flash review (quick concept cards) | `day4-review/02-topic-flash-review.md` |
| Block 2 | 60-75 min | Mock interview questions (practice out loud) | `day4-review/03-mock-interview-questions.md` |
| Block 2 | 45-60 min | Weak spot refinement (clean up rambling answers) | `day4-review/04-weak-spot-templates.md` |

---

## Quick Reference

### Project Tech Stack
- **Backend:** Python, FastAPI, PostgreSQL, SQLAlchemy
- **Frontend:** React, TypeScript
- **Infrastructure:** Kubernetes, Docker, Redis, RabbitMQ
- **Integration:** SLURM (HPC), metrics logging

### Key Endpoints
- `GET/POST /experiments` - List/create experiments
- `GET /experiments/{id}` - Get experiment with runs
- `POST /runs/{id}/metrics` - Log metrics

### Core Concepts
- RESTful API design with proper status codes
- Relational database with indexes for query patterns
- React components with hooks for state and effects
- K8s deployments with health probes and rolling updates
- Security: API auth, SQL injection prevention, XSS protection

---

## Study Tips

1. **Do the exercises** - Reading isn't enough, build the code
2. **Explain out loud** - Practice verbal explanations
3. **Draw diagrams** - Architecture should be drawable
4. **Time yourself** - Interview answers should be 1-2 minutes
5. **Use the cheat sheet** - Review 30 min before interview

---

## Checkpoint Questions

Each file has checkpoint questions at the end. Make sure you can answer them before moving on.

**You're ready when you can:**
- [ ] Explain the project in under 2 minutes
- [ ] Draw the architecture on a whiteboard
- [ ] Discuss any technology choice with reasoning
- [ ] Debug a "pod failing" scenario step-by-step
- [ ] Answer "how would you scale this?" concretely
