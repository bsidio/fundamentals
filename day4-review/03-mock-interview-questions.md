# Day 4 - Block 2: Mock Interview Questions (60-75 min)

Practice answering these out loud. Time yourself - aim for 1-2 minutes per answer.

---

## Interview Framework

### STAR Method for Behavioral Questions

| Component | Description | Example |
|-----------|-------------|---------|
| **S**ituation | Set the context | "On our ML platform team..." |
| **T**ask | What was your responsibility | "I was responsible for..." |
| **A**ction | What you specifically did | "I implemented..." |
| **R**esult | Measurable outcome | "This reduced... by 50%" |

### Technical Question Structure

```
1. Clarify requirements (30 seconds)
2. High-level approach (30 seconds)
3. Detailed explanation (1-2 minutes)
4. Trade-offs and alternatives (30 seconds)
```

---

## Project & Background Questions

### "Tell me about a tool you built for ML engineers."

**Structure**: Problem → Solution → Impact

> "ML engineers on our team struggled to track experiments and compare results across training runs. They were using spreadsheets which didn't scale and made it hard to reproduce results.
>
> I built an experiment tracking system with a Python API that training scripts call to log metrics, and a React dashboard for visualization. Engineers can filter by status, compare runs, and see metric charts.
>
> The technical stack is FastAPI, PostgreSQL for structured experiment data, and Redis for caching dashboard queries. It integrates with our SLURM cluster to track GPU job status."

---

### "Walk me through the architecture of your system."

**Structure**: Draw as you explain

> "At a high level: we have a React frontend that talks to a FastAPI backend, which connects to PostgreSQL.
>
> [Draw boxes while explaining]
>
> Training jobs on the GPU cluster make API calls to log metrics. These go through a message queue to batch inserts and handle bursts. The dashboard reads from the database, with Redis caching frequently accessed aggregations.
>
> For deployment, everything runs on Kubernetes. The API is stateless so we can scale horizontally. Secrets are managed through K8s Secrets, and we use rolling updates for zero-downtime deployments."

---

## System Design Questions

### "Design an experiment tracking system."

**Structure**: Requirements → Data Model → API → Scale

> "First, let me clarify requirements. We need to track experiments, runs within experiments, and metrics within runs. Users need to create experiments, start runs, log metrics during training, and view results.
>
> For the data model, I'd use three tables: experiments with name, owner, status; runs with experiment_id, timestamps, and status; metrics with run_id, name, step, and value. I'd index on experiment_id for runs and run_id for metrics since those are the main access patterns.
>
> The API would be RESTful: POST /experiments to create, POST /experiments/{id}/runs to start a run, POST /runs/{id}/metrics to log metrics. GET endpoints with filtering for the dashboard.
>
> For scale, metrics logging could be high volume, so I'd batch inserts through a queue. Dashboard queries hit cached aggregations in Redis. Read replicas for the database if needed."

---

### "How would you deploy it on Kubernetes?"

> "I'd create a Deployment for the backend with 3 replicas, resource requests/limits, and both liveness and readiness probes hitting the /health endpoint. Database credentials would be in a Secret, referenced as environment variables.
>
> A Service would expose the backend internally. For the frontend, either serve static files from a CDN or another Deployment running nginx.
>
> For updates, I use rolling updates with maxSurge=1 and maxUnavailable=0, so we always have capacity during deploys. If the new pods fail health checks, the rollout stops automatically. I can rollback with kubectl rollout undo."

---

### "How would you scale it if usage doubles?"

> "First, I'd identify the bottleneck. For reads, I'd check cache hit rates - if Redis is missing too often, I might increase TTLs or cache more aggressively. I'd also consider read replicas for the database.
>
> For writes, especially metrics logging, I'd ensure we're batching through the message queue. If that's saturated, I'd add more consumers or increase batch sizes.
>
> For the API servers, they're stateless, so I'd increase replicas and let the load balancer distribute. I'd monitor response times and resource usage to see where we're constrained.
>
> Long-term, if metrics volume grows significantly, I might consider a time-series database like InfluxDB for that specific data."

---

## Security Questions

### "How do you deal with security for internal tools?"

> "Even internal tools need defense in depth. First, authentication - I use API keys for service-to-service and JWT tokens for users, with proper expiration.
>
> Authorization uses role-based access control: viewers can only read, operators can create runs, admins have full access.
>
> For common vulnerabilities: SQL injection is prevented by using an ORM with parameterized queries. XSS is handled by React's default escaping. CORS is configured to only allow requests from known frontend origins.
>
> I also implement rate limiting to prevent abuse, structured logging for audit trails, and never log sensitive data like credentials."

---

### "What common attacks are you aware of?"

> "The main web vulnerabilities are SQL injection, XSS, and CSRF.
>
> SQL injection happens when user input is concatenated into queries. Prevention is parameterized queries - ORMs do this automatically.
>
> XSS is injecting malicious scripts. React prevents this by escaping content by default. Never use dangerouslySetInnerHTML with user input.
>
> CSRF tricks authenticated users into unwanted requests. Prevention includes CSRF tokens and SameSite cookies.
>
> Beyond these, I'd mention securing secrets management, HTTPS everywhere, and principle of least privilege for access control."

---

## Linux & Operations Questions

### "Backend pod is failing. How do you debug?"

> "First, kubectl get pods to see the status. CrashLoopBackOff means it's starting and dying repeatedly. ImagePullBackOff means it can't fetch the image.
>
> Next, kubectl describe pod to see events - this often shows the immediate cause like missing secrets, failed probes, or resource issues.
>
> Then kubectl logs to see application output. If the container already crashed, use --previous flag. I'm looking for connection errors, missing config, or exceptions during startup.
>
> If it's running but unhealthy, I might exec into the pod to check connectivity to dependencies, disk space, or memory usage."

---

### "What's your experience with Linux in production?"

> "I'm comfortable with common debugging workflows. For process issues, I use top or htop to identify high CPU/memory processes. For disk issues, df -h for usage and du to find large directories.
>
> For logs, journalctl for systemd services or tail -f for log files. I've used grep to search logs and sed/awk for parsing.
>
> For networking, I use ss to check listening ports, curl to test endpoints, and netstat or lsof to see connections. I understand file permissions and use chmod/chown when needed."

---

## HPC & ML Questions

### "How would your system interact with an HPC cluster?"

> "Integration happens at two points. First, when a training job starts, the script calls our API to create a run and logs the SLURM job ID. Throughout training, it logs metrics via HTTP.
>
> Second, we need to know when jobs finish. Either we poll SLURM periodically using squeue, or we configure SLURM's epilog to send a webhook when jobs complete.
>
> Checkpoints and artifacts go to shared storage mounted on all nodes. We store the paths in our database so users can download or load models later.
>
> The dashboard shows job status and lets users see queue position or resource usage alongside experiment metrics."

---

### "How would you coordinate hardware resource usage?"

> "SLURM handles the actual scheduling - jobs request GPUs, memory, and time, and the scheduler allocates nodes based on availability and fairness policies.
>
> Our tracker helps with visibility. We'd show which experiments are queued, running, or completed, and what resources they requested. Users could plan when to submit based on cluster utilization.
>
> We might also add features like estimating queue wait time based on historical data, or flagging when experiments request unusual resources. For quota management, we could track usage per team."

---

## Practice Tips

1. **Time yourself** - Answers should be 1-2 minutes, not 5
2. **Structure your answers** - Start with the high-level, then details
3. **Say "I don't know"** - Better than guessing wrong
4. **Ask clarifying questions** - Shows you think before coding
5. **Use the whiteboard/paper** - Draw diagrams as you explain

---

## Red Flag Phrases to Avoid

- "I've never done that" → Instead: "I haven't done that specifically, but I'd approach it by..."
- "That's easy" → Just explain it clearly
- "I don't know" (alone) → Add: "...but I'd start by looking at X"
- Long pauses without thinking out loud → Narrate your thought process

---

## Coding Questions

### "Implement a rate limiter"

```python
# Token bucket algorithm
class RateLimiter:
    def __init__(self, tokens_per_second: float, max_tokens: int):
        self.rate = tokens_per_second
        self.max_tokens = max_tokens
        self.tokens = max_tokens
        self.last_refill = time.time()

    def allow(self) -> bool:
        # Refill tokens based on elapsed time
        now = time.time()
        self.tokens = min(
            self.max_tokens,
            self.tokens + (now - self.last_refill) * self.rate
        )
        self.last_refill = now

        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

### "Find the best run from each experiment"

```python
# SQL approach
SELECT DISTINCT ON (experiment_id)
    experiment_id, run_id, accuracy
FROM runs
ORDER BY experiment_id, accuracy DESC;

# Python approach
from collections import defaultdict

def best_runs(runs: list[dict]) -> list[dict]:
    best = {}
    for run in runs:
        exp_id = run['experiment_id']
        if exp_id not in best or run['accuracy'] > best[exp_id]['accuracy']:
            best[exp_id] = run
    return list(best.values())
```

### "Design a function to batch API requests"

```python
import asyncio
from typing import TypeVar, Callable

T = TypeVar('T')

async def batch_process(
    items: list[T],
    processor: Callable[[T], asyncio.Future],
    batch_size: int = 10,
    delay: float = 0.1
) -> list:
    """Process items in batches with rate limiting."""
    results = []

    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        batch_results = await asyncio.gather(
            *[processor(item) for item in batch],
            return_exceptions=True
        )
        results.extend(batch_results)
        await asyncio.sleep(delay)  # Rate limit

    return results
```

---

## Database Questions

### "Your query is slow. How do you debug it?"

> "First, I'd use EXPLAIN ANALYZE to see the execution plan. I'm looking for:
>
> 1. Sequential scans on large tables - suggests missing index
> 2. Nested loops with many iterations - might need a JOIN strategy change
> 3. Large row estimate vs actual - statistics might be stale (run ANALYZE)
> 4. External sorts - hitting disk, might need more work_mem
>
> For the fix, I'd add appropriate indexes. For composite indexes, I consider the column order based on query patterns. If it's a complex query, I might also consider query restructuring or denormalization."

### "Explain database indexing"

> "An index is like a book's index - a separate data structure that speeds up lookups. The default B-tree index enables O(log n) lookups instead of O(n) sequential scans.
>
> Index on columns used in WHERE, JOIN, and ORDER BY. Composite indexes matter for multi-column filters - the leftmost prefix rule means (a, b, c) works for queries on (a), (a, b), or (a, b, c), but not (b) alone.
>
> Trade-offs: indexes speed up reads but slow down writes because every INSERT/UPDATE must update the index. Storage overhead too. So index what you query, not everything."

---

## Behavioral Questions

### "Tell me about a time you dealt with a production incident"

> "**Situation**: Our metrics pipeline started dropping data during peak training hours. Users noticed missing metrics in dashboards.
>
> **Task**: As on-call, I needed to diagnose and fix it quickly while communicating status.
>
> **Action**: I checked logs and saw Redis was timing out. Our cache was hitting memory limits during high-volume metrics logging. Short-term, I increased Redis memory and added TTLs to evict stale keys. Long-term, we implemented write batching to reduce Redis operations.
>
> **Result**: Resolved within 30 minutes. Added monitoring for Redis memory to alert before hitting limits. No similar incidents since."

### "Tell me about a technical decision you had to defend"

> "**Situation**: Team was choosing between building our own metrics storage vs using InfluxDB.
>
> **Task**: I evaluated options and recommended InfluxDB despite initial skepticism about adding another dependency.
>
> **Action**: I prototyped both approaches, measured performance, and presented data. PostgreSQL struggled with our time-series write volume (100K metrics/min). InfluxDB handled it easily with better compression and built-in retention policies. I also showed the maintenance burden of a custom solution.
>
> **Result**: Team adopted InfluxDB. We got 5x better write performance and 80% less storage cost from compression. Worth the additional dependency."

### "Describe a time you had to learn something quickly"

> "**Situation**: We needed to containerize our application and deploy to Kubernetes, but I had no K8s experience.
>
> **Task**: Get the system running on K8s in two weeks for a demo.
>
> **Action**: I focused on practical knowledge - started with official docs, then built incrementally: first Dockerfiles, then simple deployments, then added services, configmaps, and finally health checks. I pair-programmed with a teammate who knew K8s for complex parts.
>
> **Result**: Deployed on time. Learned that focusing on doing over reading was more effective. Now I'm comfortable writing production K8s manifests."

---

## Questions to Ask Them

### Technical Environment
- "What does your deployment pipeline look like?"
- "How do you handle database migrations?"
- "What's your approach to testing and code review?"
- "What monitoring and alerting do you have?"

### Team & Culture
- "What does a typical project look like for this role?"
- "How are technical decisions made on the team?"
- "What are the biggest challenges the team is facing?"
- "How do you balance new features vs technical debt?"

### Growth & Success
- "What does success look like in the first 6 months?"
- "What opportunities are there for learning and growth?"
- "How does the team share knowledge?"

---

## Practice Checklist

Before the interview:

- [ ] Practiced each question aloud (not just in your head)
- [ ] Timed answers (1-2 minutes each)
- [ ] Can draw architecture diagrams
- [ ] Have 2-3 specific examples from experience ready
- [ ] Prepared questions to ask them
- [ ] Reviewed the company/team's tech stack
