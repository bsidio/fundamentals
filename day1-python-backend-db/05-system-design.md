# Day 1 - Evening: System Design Sketch (1-2h)

## Goals
- Have a high-level architecture you can present
- Understand scaling, caching, and async patterns
- Learn to reason about trade-offs in system design
- Practice back-of-envelope calculations

---

## System Design Interview Framework

### 1. Clarify Requirements (5 min)
- **Functional**: What features? CRUD, search, real-time?
- **Non-functional**: Scale, latency, availability, consistency?
- **Constraints**: Budget, timeline, team expertise?

### 2. Estimate Scale (5 min)
- Users: DAU, peak concurrent
- Data: Storage needs, read/write ratio
- Traffic: QPS, bandwidth

### 3. High-Level Design (10 min)
- Draw major components
- Define data flow
- Identify storage needs

### 4. Deep Dive (15 min)
- Database schema
- API design
- Scaling strategy
- Failure handling

### 5. Trade-offs & Extensions (5 min)
- Bottlenecks and solutions
- Future improvements

---

## Back-of-Envelope Calculations

### Quick Reference Numbers

| Unit | Value |
|------|-------|
| 1 day | 86,400 seconds (~100K) |
| 1 million requests/day | ~12 QPS |
| 1 billion requests/day | ~12,000 QPS |
| 1 KB | 1,000 bytes |
| 1 MB | 1,000 KB |
| 1 GB | 1,000 MB |
| 1 TB | 1,000 GB |

### Latency Numbers

| Operation | Time |
|-----------|------|
| L1 cache reference | 0.5 ns |
| L2 cache reference | 7 ns |
| Main memory reference | 100 ns |
| SSD random read | 150 μs |
| HDD random read | 10 ms |
| Network round-trip (same DC) | 0.5 ms |
| Network round-trip (cross-country) | 40 ms |

### Example: ML Experiment Tracker Scale

```
Users: 1,000 ML engineers
Active experiments: 10 per user = 10,000 experiments
Runs per experiment: 100 avg = 1,000,000 runs
Metrics per run: 1,000 data points = 1 billion metrics

Storage:
- Experiment: ~500 bytes × 10K = 5 MB
- Run: ~200 bytes × 1M = 200 MB
- Metric: ~50 bytes × 1B = 50 GB

Traffic:
- 100 experiments created/day = 0.001 QPS
- 10,000 runs started/day = 0.1 QPS
- 10M metrics logged/day = 115 QPS (bursty!)
- Dashboard views: 10K/day = 0.1 QPS

Conclusion: Read-heavy for dashboards, write-heavy for metrics
Need: Batch writes for metrics, caching for dashboards
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER (nginx)                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌──────────┐    ┌──────────┐    ┌──────────┐
             │ Frontend │    │ Frontend │    │ Frontend │
             │ (React)  │    │ (React)  │    │ (React)  │
             └──────────┘    └──────────┘    └──────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                     │
│                    (rate limiting, auth)                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌──────────┐    ┌──────────┐    ┌──────────┐
             │ Backend  │    │ Backend  │    │ Backend  │
             │ (FastAPI)│    │ (FastAPI)│    │ (FastAPI)│
             └──────────┘    └──────────┘    └──────────┘
                    │               │               │
        ┌───────────┴───────────────┴───────────────┴───────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────┐           ┌──────────────┐           ┌──────────────┐
│    Redis     │           │   Postgres   │           │ Message Queue│
│   (Cache)    │           │   (Primary)  │           │  (RabbitMQ)  │
└──────────────┘           └──────────────┘           └──────────────┘
                                    │
                                    ▼
                           ┌──────────────┐
                           │   Postgres   │
                           │   (Replica)  │
                           └──────────────┘
```

---

## Component Responsibilities

### Frontend (React)
- Dashboard UI for viewing experiments and runs
- Filtering, sorting, pagination
- Real-time updates via WebSocket or polling

### API Gateway
- **Rate Limiting**: Prevent abuse
- **Authentication**: Validate API keys/JWT
- **Request Routing**: Route to appropriate backend

### Backend API (FastAPI)
- CRUD operations for experiments, runs, metrics
- Business logic validation
- Aggregation queries for dashboards

### PostgreSQL
- Primary storage for structured data
- Read replica for scaling read-heavy workloads

### Redis Cache
- Cache hot queries (dashboard aggregations)
- Session storage
- Rate limiting counters

### Message Queue (RabbitMQ/Kafka)
- Async job processing
- Event notifications ("run completed")
- Decoupling of components

---

## Scaling Strategies

### Scaling Reads

1. **Read Replicas**
   - Route read queries to replica
   - Primary handles writes only
   - Eventual consistency (few ms lag)

2. **Caching Layer**
   ```python
   # Cache pattern
   def get_experiment(id):
       cached = redis.get(f"exp:{id}")
       if cached:
           return json.loads(cached)

       exp = db.query(Experiment).get(id)
       redis.setex(f"exp:{id}", 300, json.dumps(exp))  # 5 min TTL
       return exp
   ```

3. **CDN for Static Assets**
   - Serve React bundle from CDN
   - Edge caching for API responses

### Scaling Writes

1. **Write-Behind Cache**
   - Batch writes to reduce DB pressure
   - Metrics collected → Redis → Batch insert

2. **Message Queue for Async**
   ```python
   # Instead of direct DB write
   def log_metric(metric):
       queue.publish("metrics", metric)

   # Worker processes batch
   def process_metrics():
       batch = queue.consume("metrics", batch_size=100)
       db.bulk_insert(batch)
   ```

3. **Database Sharding**
   - Partition by experiment_id
   - Each shard handles subset of data

---

## Caching Strategy

### What to Cache

| Data | TTL | Reason |
|------|-----|--------|
| Experiment list | 1 min | Frequently accessed, changes rarely |
| Experiment detail | 5 min | Read-heavy, updates less frequent |
| Dashboard aggregations | 30 sec | Computed queries, expensive |
| User session | 24 hours | Auth data, rarely changes |

### Cache Invalidation

```python
# Invalidate on write
def update_experiment(id, data):
    db.update(experiment, data)
    redis.delete(f"exp:{id}")
    redis.delete("exp:list")  # Invalidate list cache
```

### Cache Patterns

1. **Cache-Aside**: App manages cache
2. **Read-Through**: Cache fetches from DB on miss
3. **Write-Through**: Write to cache and DB together
4. **Write-Behind**: Write to cache, async to DB

---

## Message Queue Usage

### Event-Driven Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ ML Training │ ──► │   Queue     │ ──► │  API Server │
│    Job      │     │ (run_done)  │     │  (update UI)│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Notification│
                    │   Service   │
                    └─────────────┘
```

### Message Types

```json
// Run completed event
{
    "event": "run_completed",
    "run_id": "abc-123",
    "experiment_id": "exp-456",
    "status": "completed",
    "metrics": {
        "accuracy": 0.95,
        "loss": 0.05
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Use Cases

1. **Run Completion → Dashboard Update**
   - Training job publishes "run_completed"
   - API server subscribes, pushes to frontend via WebSocket

2. **Metrics Batching**
   - Training logs metrics to queue
   - Worker batches and inserts to DB

3. **Notifications**
   - "Run failed" → Email/Slack notification

---

## Interview Talking Points

### "How would you scale reads/writes?"

> "For reads, I'd add read replicas and a Redis caching layer for hot queries like dashboard aggregations. For writes, especially high-volume metrics, I'd use a message queue to batch inserts rather than individual writes. This decouples the training jobs from the database and handles bursts of metrics smoothly."

### "Where would you put caching?"

> "I'd cache at multiple levels: Redis for API responses like experiment lists and aggregations with short TTLs, and potentially a CDN for the React frontend. Cache invalidation happens on writes, and I'd use cache-aside pattern where the app checks cache first, falls back to DB, then populates cache."

### "What goes into a message on the queue?"

> "For a 'run completed' event: the run ID, experiment ID, final status, summary metrics, and timestamp. This allows the API to update the dashboard, a notification service to alert the user, and potentially trigger downstream jobs like model registration."

---

## Quick Architecture Checklist

- [ ] Load balancer in front of frontend/API
- [ ] Stateless backend (horizontal scaling)
- [ ] Database with read replica for scale
- [ ] Redis for caching and sessions
- [ ] Message queue for async operations
- [ ] CDN for static assets
- [ ] Logging and monitoring (ELK, Prometheus)

---

## CAP Theorem

In a distributed system, you can only guarantee 2 of 3:

| Property | Meaning |
|----------|---------|
| **Consistency** | All nodes see same data at same time |
| **Availability** | Every request gets a response |
| **Partition Tolerance** | System works despite network failures |

### Real-World Choices

Since network partitions are inevitable, you choose between:

- **CP (Consistency + Partition)**: Bank transactions, inventory systems
  - Example: Traditional RDBMS with synchronous replication
  - Trade-off: May be unavailable during partition

- **AP (Availability + Partition)**: Social media feeds, shopping carts
  - Example: Cassandra, DynamoDB
  - Trade-off: May show stale data temporarily

### For ML Experiment Tracker
```
Experiments/Runs: CP - Need accurate status and results
Metrics: AP - Eventual consistency OK, high availability more important
Dashboard: AP - Cached data acceptable, always respond
```

---

## Consistency Patterns

### Strong Consistency
Every read returns the most recent write.

```python
# Synchronous replication
def create_experiment(data):
    primary.write(data)       # Write to primary
    replica.write(data)       # Wait for replica
    return success            # Only then respond
```

### Eventual Consistency
Reads may return stale data, but will eventually converge.

```python
# Asynchronous replication
def create_experiment(data):
    primary.write(data)       # Write to primary
    queue.publish(data)       # Async replicate
    return success            # Respond immediately

# Background worker syncs to replicas
```

### Read-Your-Writes Consistency
User always sees their own writes, may see stale data from others.

```python
def get_experiment(user, id):
    # If user just wrote, read from primary
    if recently_wrote(user, id):
        return primary.read(id)
    # Otherwise, replica is fine
    return replica.read(id)
```

---

## Load Balancing Strategies

### Round Robin
Distribute requests evenly in order.
- **Pro**: Simple, no state needed
- **Con**: Doesn't account for server load

### Least Connections
Route to server with fewest active connections.
- **Pro**: Better for varying request durations
- **Con**: Requires tracking connection state

### IP Hash
Route based on client IP (sticky sessions).
- **Pro**: Same user hits same server
- **Con**: Uneven distribution if IPs cluster

### Weighted
Assign weights based on server capacity.
- **Pro**: Handles heterogeneous servers
- **Con**: Manual configuration

```nginx
# Nginx example
upstream backend {
    least_conn;
    server backend1:8000 weight=3;
    server backend2:8000 weight=2;
    server backend3:8000 weight=1;
}
```

---

## Database Replication

### Primary-Replica (Master-Slave)

```
                    Writes
                      │
                      ▼
               ┌──────────────┐
               │   Primary    │
               │   (Master)   │
               └──────────────┘
                      │
         ┌────────────┼────────────┐
         │ Replication│            │
         ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Replica  │ │ Replica  │ │ Replica  │
   │   (R1)   │ │   (R2)   │ │   (R3)   │
   └──────────┘ └──────────┘ └──────────┘
         │            │            │
         └────────────┴────────────┘
                      │
                   Reads
```

### Synchronous vs Asynchronous

| Type | Pro | Con |
|------|-----|-----|
| **Synchronous** | Strong consistency | Higher latency, availability risk |
| **Asynchronous** | Low latency, high availability | Data loss risk, eventual consistency |

### Handling Replica Lag

```python
def get_experiment_safe(id):
    """Read from primary for recent writes."""
    experiment = replica.read(id)

    # Check if data might be stale
    if experiment.updated_at > now() - timedelta(seconds=5):
        # Recent update, read from primary to be safe
        experiment = primary.read(id)

    return experiment
```

---

## Rate Limiting

### Token Bucket Algorithm

```python
class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.last_refill = time.time()

    def allow_request(self) -> bool:
        self._refill()
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(
            self.capacity,
            self.tokens + elapsed * self.refill_rate
        )
        self.last_refill = now
```

### Distributed Rate Limiting with Redis

```python
import redis

def is_rate_limited(user_id: str, limit: int = 100, window: int = 60) -> bool:
    """Sliding window rate limiter."""
    key = f"rate_limit:{user_id}"
    now = time.time()

    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window)  # Remove old entries
    pipe.zadd(key, {str(now): now})              # Add current request
    pipe.zcard(key)                               # Count requests
    pipe.expire(key, window)                      # Set TTL
    _, _, count, _ = pipe.execute()

    return count > limit
```

---

## Monitoring & Observability

### The Three Pillars

| Pillar | Purpose | Tools |
|--------|---------|-------|
| **Metrics** | Aggregate measurements over time | Prometheus, Grafana, DataDog |
| **Logs** | Detailed event records | ELK Stack, Loki, Splunk |
| **Traces** | Request flow across services | Jaeger, Zipkin, OpenTelemetry |

### Key Metrics (USE/RED)

**USE Method** (for resources):
- **Utilization**: % of time resource is busy
- **Saturation**: Amount of queued work
- **Errors**: Error count

**RED Method** (for services):
- **Rate**: Requests per second
- **Errors**: Failed requests per second
- **Duration**: Distribution of response times

### Example Dashboard Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# Business metrics
experiments_created = Counter(
    'experiments_created_total',
    'Total experiments created'
)

active_runs = Gauge(
    'active_runs',
    'Currently running experiments'
)
```

### Alerting Rules

```yaml
# Prometheus alert rules
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile latency above 2s"
```

---

## Interview Talking Points

### "How would you scale reads/writes?"

> "For reads, I'd add read replicas and a Redis caching layer for hot queries like dashboard aggregations. For writes, especially high-volume metrics, I'd use a message queue to batch inserts rather than individual writes. This decouples the training jobs from the database and handles bursts of metrics smoothly."

### "Where would you put caching?"

> "I'd cache at multiple levels: Redis for API responses like experiment lists and aggregations with short TTLs, and potentially a CDN for the React frontend. Cache invalidation happens on writes, and I'd use cache-aside pattern where the app checks cache first, falls back to DB, then populates cache."

### "What goes into a message on the queue?"

> "For a 'run completed' event: the run ID, experiment ID, final status, summary metrics, and timestamp. This allows the API to update the dashboard, a notification service to alert the user, and potentially trigger downstream jobs like model registration."

### "How would you handle a database outage?"

> "First, circuit breaker to stop overwhelming the DB with retries. Return cached data where possible with degraded indicator. Queue writes for replay when DB recovers. For critical operations, fail fast with clear error messages. Monitor and alert for quick human response."

### "How do you ensure data consistency?"

> "Depends on the use case. For experiment metadata, use transactions and primary reads for consistency. For metrics, eventual consistency is acceptable—use async replication and batch writes. For the dashboard, cache with short TTL and accept slightly stale data for availability."

---

## Checkpoint Questions

Be ready to explain:

- [ ] **What is CAP theorem?**
  > In distributed systems, you can only guarantee 2 of 3: Consistency, Availability, Partition tolerance. Since network partitions happen, you choose between CP (consistent but may be unavailable) or AP (available but may be inconsistent).

- [ ] **When would you use a message queue?**
  > For decoupling services, handling traffic spikes (buffer writes), async processing (send email after signup), event-driven architecture (notify multiple services of an event), and reliability (retry failed operations).

- [ ] **How do you decide what to cache?**
  > Cache data that's read frequently, expensive to compute, tolerant of staleness, and relatively static. Consider TTL based on freshness needs. Don't cache user-specific data that changes constantly or security-sensitive data.

- [ ] **What's the difference between horizontal and vertical scaling?**
  > Vertical: Add more CPU/RAM to existing machine (simpler, has limits). Horizontal: Add more machines (complex but unlimited). Prefer horizontal for stateless services, vertical for databases until you need sharding.

- [ ] **How would you design for high availability?**
  > Redundancy at every layer (multiple servers, replicated DBs, multi-AZ). Load balancing with health checks. Circuit breakers to isolate failures. Graceful degradation (serve cached data). Automated failover. Regular disaster recovery testing.

- [ ] **What metrics would you monitor for this system?**
  > Request rate and latency (p50, p95, p99), error rate by endpoint, database query time, cache hit rate, queue depth, CPU/memory utilization. Business metrics: experiments created, active runs, metrics logged per second.
