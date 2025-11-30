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

## Checkpoint Questions

- [ ] When would you use Redis vs a message broker?
- [ ] What would you cache in the experiment tracker?
- [ ] How do you handle cache invalidation?
- [ ] Why use a message queue for metrics logging?
- [ ] What's in a "run completed" message?
