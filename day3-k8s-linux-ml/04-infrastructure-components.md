# Day 3 - Afternoon: Infrastructure Components (1h)

## Goals
- Understand Redis, message brokers, and their use cases
- Know when to use each component
- Have concrete examples for the experiment tracker

---

## Redis (Cache)

### What is Redis?
- In-memory key-value data store
- Extremely fast (microseconds)
- Supports various data structures (strings, hashes, lists, sets)

### Use Cases in Experiment Tracker

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

# 1. Cache expensive dashboard queries
def get_experiment_summary(experiment_id: str):
    cache_key = f"exp:summary:{experiment_id}"

    # Try cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # Cache miss - query database
    summary = db.query_experiment_summary(experiment_id)

    # Store in cache with TTL
    r.setex(cache_key, 300, json.dumps(summary))  # 5 min TTL
    return summary


# 2. Cache aggregated metrics
def get_dashboard_stats():
    cache_key = "dashboard:stats"

    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    stats = {
        "total_experiments": db.count_experiments(),
        "active_runs": db.count_runs(status="running"),
        "completed_today": db.count_runs(status="completed", date="today")
    }

    r.setex(cache_key, 60, json.dumps(stats))  # 1 min TTL
    return stats


# 3. Rate limiting
def check_rate_limit(api_key: str, limit: int = 100):
    cache_key = f"ratelimit:{api_key}"

    current = r.incr(cache_key)
    if current == 1:
        r.expire(cache_key, 60)  # Reset every minute

    return current <= limit
```

### Cache Invalidation

```python
# Invalidate on write
def update_experiment(experiment_id: str, data: dict):
    db.update_experiment(experiment_id, data)

    # Invalidate related caches
    r.delete(f"exp:summary:{experiment_id}")
    r.delete("dashboard:stats")
    r.delete("exp:list")  # If listing is cached
```

### Interview Talking Point

> "We use Redis to cache expensive dashboard queries. Things like experiment summaries and aggregated metrics don't change every second, so we cache them with a short TTL. On any write, we invalidate the relevant cache keys. This reduced database load significantly for frequently accessed dashboards."

---

## Message Broker (RabbitMQ/Kafka)

### What is a Message Broker?
- Middleware for async communication between services
- Producers send messages to queues
- Consumers process messages independently
- Decouples systems and handles spikes

### RabbitMQ vs Kafka

| Aspect | RabbitMQ | Kafka |
|--------|----------|-------|
| Pattern | Message queue | Event log |
| Ordering | Per queue | Per partition |
| Retention | Until consumed | Configurable duration |
| Use case | Task queues, RPC | Event streaming, logs |
| Throughput | Thousands/sec | Millions/sec |

### Use Cases in Experiment Tracker

#### 1. Training Job → Dashboard Update

```python
# Producer: Training job publishes completion event
import pika

def publish_run_completed(run_id: str, experiment_id: str, metrics: dict):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters('rabbitmq')
    )
    channel = connection.channel()

    channel.queue_declare(queue='run_events', durable=True)

    message = {
        "event": "run_completed",
        "run_id": run_id,
        "experiment_id": experiment_id,
        "status": "completed",
        "metrics": metrics,
        "timestamp": datetime.utcnow().isoformat()
    }

    channel.basic_publish(
        exchange='',
        routing_key='run_events',
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2  # Persistent
        )
    )
    connection.close()
```

```python
# Consumer: API server processes events
def process_run_events():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters('rabbitmq')
    )
    channel = connection.channel()
    channel.queue_declare(queue='run_events', durable=True)

    def callback(ch, method, properties, body):
        event = json.loads(body)

        if event["event"] == "run_completed":
            # Update database
            db.update_run_status(event["run_id"], event["status"])

            # Invalidate cache
            redis.delete(f"exp:summary:{event['experiment_id']}")

            # Notify connected clients (WebSocket)
            websocket.broadcast(event)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue='run_events', on_message_callback=callback)
    channel.start_consuming()
```

#### 2. Metrics Batching

```python
# Producer: Training script logs metrics frequently
def log_metric(run_id: str, name: str, value: float, step: int):
    message = {
        "run_id": run_id,
        "name": name,
        "value": value,
        "step": step,
        "timestamp": datetime.utcnow().isoformat()
    }
    channel.basic_publish(
        exchange='',
        routing_key='metrics',
        body=json.dumps(message)
    )

# Consumer: Batch insert to database
def process_metrics_batch():
    batch = []
    batch_size = 100
    flush_interval = 5  # seconds

    def flush_batch():
        if batch:
            db.bulk_insert_metrics(batch)
            batch.clear()

    def callback(ch, method, properties, body):
        batch.append(json.loads(body))
        if len(batch) >= batch_size:
            flush_batch()
        ch.basic_ack(delivery_tag=method.delivery_tag)

    # Also flush on timer
    Timer(flush_interval, flush_batch).start()
```

### Message Structure

```json
{
    "event": "run_completed",
    "run_id": "abc-123",
    "experiment_id": "exp-456",
    "status": "completed",
    "metrics": {
        "final_accuracy": 0.95,
        "final_loss": 0.05,
        "total_epochs": 100,
        "training_time_seconds": 3600
    },
    "artifacts": {
        "model_path": "s3://models/exp-456/abc-123/model.pt",
        "logs_path": "s3://logs/exp-456/abc-123/"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "metadata": {
        "gpu_type": "A100",
        "framework": "pytorch"
    }
}
```

### Interview Talking Point

> "We use a message broker so training jobs and the UI are decoupled. When a job finishes, it publishes a 'run_completed' event with metrics and status. The API server consumes this, updates the database, invalidates caches, and pushes updates to connected clients.
>
> For high-volume metrics logging, we batch messages and insert to the database in bulk rather than one-by-one. This prevents the database from becoming a bottleneck during training."

---

## Architecture with All Components

```
┌──────────────────┐
│  Training Jobs   │
│  (GPU Cluster)   │
└────────┬─────────┘
         │ log_metric(), run_completed()
         ▼
┌──────────────────┐
│  Message Queue   │ ◄─── Decouples producers/consumers
│  (RabbitMQ)      │      Handles spikes
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│  API Server      │ ◄─────► │     Redis        │
│  (FastAPI)       │         │   (Cache)        │
└────────┬─────────┘         └──────────────────┘
         │                            │
         ▼                            │ cache invalidation
┌──────────────────┐                  │
│   PostgreSQL     │ ◄────────────────┘
│   (Primary)      │
└──────────────────┘
```

---

## Redis Advanced Patterns

### Session Storage
```python
# Store user sessions in Redis instead of database
def create_session(user_id: str, token_data: dict) -> str:
    session_id = str(uuid4())
    session_key = f"session:{session_id}"

    r.setex(
        session_key,
        3600,  # 1 hour expiry
        json.dumps({
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            **token_data
        })
    )
    return session_id

def validate_session(session_id: str) -> dict | None:
    session = r.get(f"session:{session_id}")
    if session:
        # Refresh TTL on access
        r.expire(f"session:{session_id}", 3600)
        return json.loads(session)
    return None

def revoke_session(session_id: str):
    r.delete(f"session:{session_id}")
```

### Pub/Sub for Real-Time Updates
```python
# Publisher: Notify when experiment status changes
def notify_experiment_update(experiment_id: str, status: str):
    r.publish(
        f"experiments:{experiment_id}",
        json.dumps({
            "event": "status_changed",
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        })
    )

# Subscriber: WebSocket handler listens for updates
async def websocket_handler(websocket, experiment_id: str):
    pubsub = r.pubsub()
    pubsub.subscribe(f"experiments:{experiment_id}")

    try:
        for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send(message["data"])
    finally:
        pubsub.unsubscribe()
```

### Distributed Locking
```python
# Prevent duplicate processing with distributed lock
def process_with_lock(job_id: str):
    lock_key = f"lock:job:{job_id}"

    # Try to acquire lock (SETNX pattern)
    acquired = r.set(lock_key, "1", nx=True, ex=300)  # 5 min timeout

    if not acquired:
        logger.info(f"Job {job_id} already being processed")
        return

    try:
        # Do the work
        process_job(job_id)
    finally:
        # Release lock
        r.delete(lock_key)

# Using redlock for stronger guarantees
from redlock import Redlock

dlm = Redlock([{"host": "redis1"}, {"host": "redis2"}, {"host": "redis3"}])

with dlm.lock("resource_name", 10000):  # 10 second TTL
    # Critical section
    process_critical_operation()
```

### Leaderboard / Sorted Sets
```python
# Track best performing runs per experiment
def record_run_score(experiment_id: str, run_id: str, accuracy: float):
    r.zadd(
        f"leaderboard:{experiment_id}",
        {run_id: accuracy}
    )

def get_top_runs(experiment_id: str, limit: int = 10):
    # Get top N runs by accuracy (descending)
    return r.zrevrange(
        f"leaderboard:{experiment_id}",
        0, limit - 1,
        withscores=True
    )

def get_run_rank(experiment_id: str, run_id: str):
    # Get rank of specific run (0-indexed from top)
    return r.zrevrank(f"leaderboard:{experiment_id}", run_id)
```

---

## Message Broker Advanced Patterns

### Dead Letter Queues
```python
# Handle failed messages gracefully
channel.queue_declare(
    queue='metrics',
    durable=True,
    arguments={
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': 'metrics_dlq',
        'x-message-ttl': 86400000  # 24 hours
    }
)

# Dead letter queue for failed messages
channel.queue_declare(queue='metrics_dlq', durable=True)

def process_metrics():
    def callback(ch, method, properties, body):
        try:
            metric = json.loads(body)
            db.insert_metric(metric)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            logger.error(f"Failed to process: {e}")
            # Reject and send to DLQ
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    channel.basic_consume(queue='metrics', on_message_callback=callback)
```

### Priority Queues
```python
# Different priorities for different message types
channel.queue_declare(
    queue='jobs',
    durable=True,
    arguments={'x-max-priority': 10}
)

# High priority: immediate jobs
channel.basic_publish(
    exchange='',
    routing_key='jobs',
    body=json.dumps(urgent_job),
    properties=pika.BasicProperties(priority=10)
)

# Low priority: batch jobs
channel.basic_publish(
    exchange='',
    routing_key='jobs',
    body=json.dumps(batch_job),
    properties=pika.BasicProperties(priority=1)
)
```

### Fan-out Pattern
```python
# Multiple consumers receive the same message
channel.exchange_declare(exchange='events', exchange_type='fanout')

# Consumer 1: Update database
channel.queue_declare(queue='events_db')
channel.queue_bind(exchange='events', queue='events_db')

# Consumer 2: Send notifications
channel.queue_declare(queue='events_notify')
channel.queue_bind(exchange='events', queue='events_notify')

# Consumer 3: Update analytics
channel.queue_declare(queue='events_analytics')
channel.queue_bind(exchange='events', queue='events_analytics')

# Producer: Publish once, all consumers receive
channel.basic_publish(
    exchange='events',
    routing_key='',  # Ignored for fanout
    body=json.dumps(event)
)
```

### Retry with Exponential Backoff
```python
def publish_with_retry(message: dict, max_retries: int = 3):
    retry_count = message.get('_retry_count', 0)

    if retry_count >= max_retries:
        # Send to DLQ
        channel.basic_publish(
            exchange='',
            routing_key='metrics_dlq',
            body=json.dumps(message)
        )
        return

    # Calculate backoff delay
    delay_ms = min(1000 * (2 ** retry_count), 60000)  # Max 1 minute

    message['_retry_count'] = retry_count + 1

    # Use delayed message exchange
    channel.basic_publish(
        exchange='',
        routing_key='metrics',
        body=json.dumps(message),
        properties=pika.BasicProperties(
            headers={'x-delay': delay_ms}
        )
    )
```

---

## Object Storage (S3/MinIO)

### What is Object Storage?
- Store unstructured data (files, images, models)
- Accessed via HTTP API (not filesystem)
- Highly scalable and durable
- Cheaper than block storage for large files

### Use Cases in Experiment Tracker
```python
import boto3

s3 = boto3.client(
    's3',
    endpoint_url='http://minio:9000',  # MinIO for local dev
    aws_access_key_id='minioadmin',
    aws_secret_access_key='minioadmin'
)

# 1. Store model checkpoints
def upload_checkpoint(run_id: str, checkpoint_path: str, step: int):
    key = f"checkpoints/{run_id}/step_{step}.pt"
    s3.upload_file(checkpoint_path, 'ml-artifacts', key)
    return f"s3://ml-artifacts/{key}"

# 2. Store training logs
def upload_logs(run_id: str, log_content: str):
    key = f"logs/{run_id}/training.log"
    s3.put_object(
        Bucket='ml-artifacts',
        Key=key,
        Body=log_content.encode('utf-8')
    )

# 3. Generate presigned URLs for download
def get_download_url(key: str, expires_in: int = 3600) -> str:
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': 'ml-artifacts', 'Key': key},
        ExpiresIn=expires_in
    )

# 4. List artifacts for a run
def list_run_artifacts(run_id: str) -> list:
    response = s3.list_objects_v2(
        Bucket='ml-artifacts',
        Prefix=f"checkpoints/{run_id}/"
    )
    return [obj['Key'] for obj in response.get('Contents', [])]
```

### Lifecycle Policies
```json
{
    "Rules": [
        {
            "ID": "DeleteOldCheckpoints",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "checkpoints/"
            },
            "Expiration": {
                "Days": 90
            }
        },
        {
            "ID": "ArchiveLogs",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "logs/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "GLACIER"
                }
            ]
        }
    ]
}
```

---

## Load Balancer

### Types of Load Balancers
| Type | Layer | Use Case |
|------|-------|----------|
| L4 (TCP/UDP) | Transport | High performance, simple routing |
| L7 (HTTP) | Application | Content-based routing, SSL termination |

### Kubernetes Service Types
```yaml
# ClusterIP - Internal only
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8000

---
# LoadBalancer - External with cloud LB
apiVersion: v1
kind: Service
metadata:
  name: backend-external
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8000

---
# Ingress - L7 routing
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tracker-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - tracker.example.com
      secretName: tracker-tls
  rules:
    - host: tracker.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### Load Balancing Algorithms
```
Round Robin:        A → B → C → A → B → C
Least Connections:  Route to server with fewest active connections
IP Hash:            Same client IP always goes to same server
Weighted:           Route more traffic to more powerful servers
```

---

## Service Discovery

### Kubernetes DNS
```python
# Services automatically get DNS names
# Format: <service>.<namespace>.svc.cluster.local

# From another pod, connect to backend service:
DATABASE_URL = "postgresql://postgres:5432/tracker"  # Service name as host
REDIS_URL = "redis://redis:6379/0"

# Headless service for direct pod access
# (e.g., for database clustering)
# Returns all pod IPs instead of single service IP
```

### Environment Variables
```yaml
# Kubernetes automatically injects service info
env:
  - name: BACKEND_SERVICE_HOST
    value: "10.0.0.123"
  - name: BACKEND_SERVICE_PORT
    value: "8000"

# Or use config from ConfigMap
  - name: DATABASE_URL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: database_url
```

---

## Monitoring Infrastructure

### Prometheus + Grafana Stack
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: backend

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']
```

### Key Infrastructure Metrics
| Component | Metrics |
|-----------|---------|
| Redis | `redis_connected_clients`, `redis_memory_used_bytes`, `redis_commands_processed_total` |
| RabbitMQ | `rabbitmq_queue_messages`, `rabbitmq_queue_consumers`, `rabbitmq_message_rate` |
| PostgreSQL | `pg_stat_activity_count`, `pg_database_size_bytes`, `pg_stat_statements_calls` |

### Alerting Rules
```yaml
groups:
  - name: infrastructure
    rules:
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage above 90%"

      - alert: QueueBacklog
        expr: rabbitmq_queue_messages > 10000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Message queue backlog growing"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connections near limit"
```

---

## Architecture with All Components

```
┌──────────────────┐
│  Training Jobs   │
│  (GPU Cluster)   │
└────────┬─────────┘
         │ log_metric(), run_completed()
         ▼
┌──────────────────┐
│  Message Queue   │ ◄─── Decouples producers/consumers
│  (RabbitMQ)      │      Handles spikes
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│  API Server      │ ◄─────► │     Redis        │
│  (FastAPI)       │         │   (Cache)        │
└────────┬─────────┘         └──────────────────┘
         │                            │
         ▼                            │ cache invalidation
┌──────────────────┐                  │
│   PostgreSQL     │ ◄────────────────┘
│   (Primary)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Object Storage  │ ◄─── Model checkpoints, logs
│  (S3/MinIO)      │
└──────────────────┘
```

### Full Production Architecture
```
                              ┌─────────────────┐
                              │   CDN/CloudFlare │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Load Balancer  │
                              │   (L7/Ingress)  │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
           ┌────────▼────────┐ ┌───────▼───────┐ ┌───────▼───────┐
           │   Frontend      │ │   API Pod 1   │ │   API Pod 2   │
           │   (Static)      │ │   (FastAPI)   │ │   (FastAPI)   │
           └─────────────────┘ └───────┬───────┘ └───────┬───────┘
                                       │                 │
                    ┌──────────────────┴─────────────────┘
                    │
     ┌──────────────┼──────────────┬──────────────┐
     │              │              │              │
┌────▼────┐  ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│  Redis  │  │  PostgreSQL │ │ RabbitMQ  │ │    S3     │
│ (Cache) │  │  (Primary)  │ │  (Queue)  │ │ (Storage) │
└─────────┘  └──────┬──────┘ └───────────┘ └───────────┘
                    │
              ┌─────▼─────┐
              │  Replica  │
              │ (Read-only)│
              └───────────┘
```

---

## Checkpoint Questions

### Redis
- [ ] When would you use Redis vs a message broker?
- [ ] What would you cache in the experiment tracker?
- [ ] How do you handle cache invalidation?
- [ ] What's the difference between cache-aside and write-through?
- [ ] How would you implement distributed locking?

### Message Queues
- [ ] Why use a message queue for metrics logging?
- [ ] What's in a "run completed" message?
- [ ] How do you handle failed messages (DLQ)?
- [ ] When would you use fanout vs direct routing?
- [ ] How do you ensure message ordering?

### Object Storage
- [ ] What would you store in S3 vs PostgreSQL?
- [ ] How do you handle large file downloads?
- [ ] What are lifecycle policies used for?

### General
- [ ] How does the full architecture handle a spike in training jobs?
- [ ] What happens if Redis goes down?
- [ ] How do you monitor infrastructure health?

---

## Checkpoint Answers

### Redis
- **Redis vs message broker**: Redis for caching, rate limiting, pub/sub. Message broker for guaranteed delivery, task queues, decoupling services.
- **What to cache**: Dashboard stats, experiment summaries, frequently accessed lists.
- **Cache invalidation**: Delete keys on write, or use short TTLs.
- **Cache-aside vs write-through**: Cache-aside loads on miss; write-through updates cache on every write.
- **Distributed locking**: SETNX with TTL, or Redlock for multi-node.

### Message Queues
- **Why queue for metrics**: Handles burst traffic, batches inserts, decouples training from API.
- **Run completed message**: run_id, experiment_id, status, final metrics, artifacts paths, timestamp.
- **DLQ handling**: Failed messages go to dead letter queue for inspection/retry.
- **Fanout vs direct**: Fanout for multiple consumers (notifications, analytics, database). Direct for single consumer.
- **Message ordering**: Kafka partitions, RabbitMQ single queue, or sequence numbers in message.

### Object Storage
- **S3 vs PostgreSQL**: S3 for large files (checkpoints, logs). PostgreSQL for structured data (experiments, runs, metrics).
- **Large downloads**: Presigned URLs, chunked downloads, CDN.
- **Lifecycle policies**: Auto-delete old data, transition to cheaper storage tiers.
