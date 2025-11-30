# Day 1 - Afternoon: Database Schema Design (1.5-2h)

## Goals
- Design tables for experiment tracking
- Understand primary keys, foreign keys, and indexes
- Write essential SQL queries
- Learn query optimization and execution plans

---

## Relational Database Fundamentals

### ACID Properties

Every relational database guarantees these properties:

| Property | Meaning | Example |
|----------|---------|---------|
| **Atomicity** | All or nothing | Transfer: debit AND credit succeed, or neither |
| **Consistency** | Valid state to valid state | Constraints always enforced |
| **Isolation** | Concurrent transactions don't interfere | Two users updating same row |
| **Durability** | Committed data persists | Survives power failure |

```sql
-- Example: Atomic transaction
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- Both happen, or neither
```

### Normalization Levels

| Form | Rule | Example Violation |
|------|------|-------------------|
| **1NF** | No repeating groups | `tags = "ml,pytorch,cv"` (should be separate table) |
| **2NF** | No partial dependencies | `order_items(order_id, product_id, product_name)` |
| **3NF** | No transitive dependencies | `employees(id, dept_id, dept_name)` |

**When to Denormalize**: Read-heavy workloads, complex joins hurting performance, caching layer can't help.

---

## Schema Design

### Entity Relationship Diagram (Conceptual)

```
experiments (1) ──────< (N) runs (1) ──────< (N) metrics
```

### Table Definitions

```sql
-- Experiments table
CREATE TABLE experiments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    owner           VARCHAR(50) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'created',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('created', 'running', 'completed', 'failed'))
);

-- Index for filtering by owner
CREATE INDEX idx_experiments_owner ON experiments(owner);
-- Index for filtering by status
CREATE INDEX idx_experiments_status ON experiments(status);

-- Runs table
CREATE TABLE runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id   UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    started_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at        TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'running',
    seed            INTEGER,

    CONSTRAINT valid_run_status CHECK (status IN ('running', 'completed', 'failed'))
);

-- Index for fetching runs by experiment
CREATE INDEX idx_runs_experiment_id ON runs(experiment_id);
-- Index for filtering by status and date
CREATE INDEX idx_runs_status_started ON runs(status, started_at);

-- Metrics table
CREATE TABLE metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id          UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,
    step            INTEGER NOT NULL,
    value           DOUBLE PRECISION NOT NULL,
    timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Composite index for querying metrics by run and name
CREATE INDEX idx_metrics_run_name ON metrics(run_id, name);
-- Index for time-series queries
CREATE INDEX idx_metrics_run_step ON metrics(run_id, step);
```

---

## Key Design Decisions

### Primary Keys
- Using **UUID** instead of auto-increment integers
- Globally unique, better for distributed systems
- No sequential ID leakage

### Foreign Keys
- `runs.experiment_id` → `experiments.id`
- `metrics.run_id` → `runs.id`
- **ON DELETE CASCADE**: When parent is deleted, children are deleted

### Indexes Explained

| Index | Purpose | Query It Speeds Up |
|-------|---------|-------------------|
| `idx_experiments_owner` | Filter by owner | `WHERE owner = 'alice'` |
| `idx_runs_experiment_id` | Join runs to experiment | `JOIN runs ON experiments.id = runs.experiment_id` |
| `idx_metrics_run_name` | Composite index | `WHERE run_id = ? AND name = 'accuracy'` |
| `idx_runs_status_started` | Filter + sort | `WHERE status = 'running' ORDER BY started_at` |

---

## Essential SQL Queries

### 1. Runs for a Given Experiment

```sql
SELECT r.id, r.started_at, r.ended_at, r.status, r.seed
FROM runs r
WHERE r.experiment_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY r.started_at DESC;
```

### 2. Latest Run per Experiment

```sql
SELECT DISTINCT ON (experiment_id)
    experiment_id,
    id as run_id,
    started_at,
    status
FROM runs
ORDER BY experiment_id, started_at DESC;

-- Alternative using window function
SELECT experiment_id, id, started_at, status
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY experiment_id ORDER BY started_at DESC) as rn
    FROM runs
) sub
WHERE rn = 1;
```

### 3. Average of a Metric for a Run

```sql
SELECT
    run_id,
    name as metric_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as num_samples
FROM metrics
WHERE run_id = '123e4567-e89b-12d3-a456-426614174000'
  AND name = 'accuracy'
GROUP BY run_id, name;
```

### 4. Runs Filtered by Status and Date

```sql
SELECT r.*, e.name as experiment_name
FROM runs r
JOIN experiments e ON r.experiment_id = e.id
WHERE r.status = 'completed'
  AND r.started_at >= '2024-01-01'
  AND r.ended_at <= '2024-12-31'
ORDER BY r.started_at DESC
LIMIT 50;
```

### 5. Experiment Summary with Run Counts

```sql
SELECT
    e.id,
    e.name,
    e.owner,
    e.status,
    COUNT(r.id) as total_runs,
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_runs,
    COUNT(CASE WHEN r.status = 'failed' THEN 1 END) as failed_runs
FROM experiments e
LEFT JOIN runs r ON e.id = r.experiment_id
GROUP BY e.id, e.name, e.owner, e.status
ORDER BY e.created_at DESC;
```

---

## Why Relational Database?

### Good Fit for This Use Case
1. **Structured Data**: Experiments, runs, metrics have clear schemas
2. **Relationships**: Clear 1:N relationships between entities
3. **ACID Compliance**: Need data integrity for metrics tracking
4. **Complex Queries**: Aggregations, joins, filtering common
5. **Reporting**: SQL is powerful for analytics queries

### When to Consider NoSQL
- **Document Store (MongoDB)**: Flexible schema, nested data
- **Time Series (InfluxDB)**: High-volume metrics with time focus
- **Key-Value (Redis)**: Caching, session storage

---

## Index Deep Dive

### What is an Index?
- Separate data structure (usually B-tree) for fast lookups
- Like a book's index: points to where data lives
- Trade-off: faster reads, slower writes

### B-Tree Index (Default)
```
                  [M]
                 /   \
            [D,H]     [R,W]
           / | \      / | \
         [A-C][E-G][I-L][N-Q][S-V][X-Z]
```

### Index Types

| Type | Use Case | Example |
|------|----------|---------|
| **B-Tree** | General purpose, range queries | `WHERE created_at > '2024-01-01'` |
| **Hash** | Exact equality only | `WHERE id = 'abc-123'` |
| **GIN** | Full-text search, arrays, JSONB | `WHERE tags @> '{ml}'` |
| **GiST** | Geometric, range types | `WHERE location <-> point(0,0)` |
| **BRIN** | Large tables, sorted data | Time-series with sequential inserts |

### Index Selection Rules
1. **Filter columns**: Columns in WHERE clauses
2. **Join columns**: Foreign keys
3. **Sort columns**: Columns in ORDER BY
4. **Composite indexes**: Order matters (leftmost prefix rule)

```sql
-- This index: (status, started_at)
-- Speeds up: WHERE status = 'running' AND started_at > '2024-01-01'
-- Speeds up: WHERE status = 'running'
-- Does NOT speed up: WHERE started_at > '2024-01-01' (no status filter)
```

### Partial Indexes

```sql
-- Only index running experiments (smaller, faster)
CREATE INDEX idx_running_experiments
ON experiments(owner)
WHERE status = 'running';

-- Only used when query includes WHERE status = 'running'
```

### Covering Indexes (Index-Only Scans)

```sql
-- Include all columns needed by query in index
CREATE INDEX idx_experiments_covering
ON experiments(owner, status) INCLUDE (name, created_at);

-- This query can be answered from index alone (no table access)
SELECT name, created_at FROM experiments WHERE owner = 'alice' AND status = 'running';
```

---

## Query Optimization

### Reading EXPLAIN Output

```sql
EXPLAIN ANALYZE
SELECT * FROM experiments WHERE owner = 'alice';

-- Sample output:
-- Index Scan using idx_experiments_owner on experiments
--   Index Cond: (owner = 'alice')
--   Rows Removed by Filter: 0
--   Planning Time: 0.123 ms
--   Execution Time: 0.456 ms
```

### Key Metrics to Watch

| Metric | Good | Bad |
|--------|------|-----|
| **Scan Type** | Index Scan, Index Only Scan | Seq Scan on large tables |
| **Rows** | Estimated ≈ Actual | Large discrepancy |
| **Loops** | 1 | Many (nested loop problem) |
| **Sort Method** | quicksort (in memory) | external merge (disk) |

### Common Query Optimizations

```sql
-- BAD: Function on indexed column (can't use index)
SELECT * FROM experiments WHERE LOWER(name) = 'test';

-- GOOD: Use expression index or case-insensitive collation
CREATE INDEX idx_experiments_name_lower ON experiments(LOWER(name));

-- BAD: Leading wildcard (can't use index)
SELECT * FROM experiments WHERE name LIKE '%test%';

-- GOOD: Full-text search for this use case
CREATE INDEX idx_experiments_name_fts ON experiments USING gin(to_tsvector('english', name));
SELECT * FROM experiments WHERE to_tsvector('english', name) @@ to_tsquery('test');

-- BAD: OR conditions often can't use indexes well
SELECT * FROM experiments WHERE owner = 'alice' OR status = 'running';

-- GOOD: Use UNION for better index usage
SELECT * FROM experiments WHERE owner = 'alice'
UNION
SELECT * FROM experiments WHERE status = 'running';
```

---

## Transactions and Locking

### Transaction Isolation Levels

| Level | Dirty Read | Non-Repeatable | Phantom |
|-------|------------|----------------|---------|
| Read Uncommitted | Yes | Yes | Yes |
| Read Committed | No | Yes | Yes |
| Repeatable Read | No | No | Yes |
| Serializable | No | No | No |

```sql
-- Set isolation level for transaction
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT * FROM experiments WHERE owner = 'alice';
UPDATE experiments SET status = 'running' WHERE owner = 'alice';
COMMIT;
```

### Deadlock Prevention

```sql
-- Always acquire locks in consistent order
-- BAD: Transaction 1 locks A then B, Transaction 2 locks B then A

-- GOOD: Both transactions lock in same order (A, then B)
BEGIN;
SELECT * FROM experiments WHERE id = 'A' FOR UPDATE;
SELECT * FROM experiments WHERE id = 'B' FOR UPDATE;
-- ... do work ...
COMMIT;
```

### Row-Level Locking

```sql
-- FOR UPDATE: Exclusive lock, blocks other writes
SELECT * FROM experiments WHERE id = 'abc' FOR UPDATE;

-- FOR SHARE: Shared lock, allows other reads
SELECT * FROM experiments WHERE id = 'abc' FOR SHARE;

-- SKIP LOCKED: Don't wait, skip locked rows (great for job queues)
SELECT * FROM jobs WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1;
```

---

## Advanced SQL Patterns

### Window Functions

```sql
-- Rank runs by accuracy within each experiment
SELECT
    experiment_id,
    id as run_id,
    accuracy,
    RANK() OVER (PARTITION BY experiment_id ORDER BY accuracy DESC) as rank
FROM runs
WHERE accuracy IS NOT NULL;

-- Running average of metrics
SELECT
    step,
    value,
    AVG(value) OVER (ORDER BY step ROWS BETWEEN 9 PRECEDING AND CURRENT ROW) as moving_avg
FROM metrics
WHERE run_id = 'abc-123' AND name = 'loss';
```

### Common Table Expressions (CTEs)

```sql
-- Recursive CTE: Find all related experiments (if you had a parent_id)
WITH RECURSIVE experiment_tree AS (
    -- Base case
    SELECT id, name, parent_id, 0 as depth
    FROM experiments
    WHERE id = 'root-exp'

    UNION ALL

    -- Recursive case
    SELECT e.id, e.name, e.parent_id, et.depth + 1
    FROM experiments e
    JOIN experiment_tree et ON e.parent_id = et.id
    WHERE et.depth < 10  -- Prevent infinite recursion
)
SELECT * FROM experiment_tree;

-- Non-recursive CTE for readability
WITH recent_runs AS (
    SELECT * FROM runs WHERE started_at > NOW() - INTERVAL '7 days'
),
run_metrics AS (
    SELECT run_id, AVG(value) as avg_accuracy
    FROM metrics
    WHERE name = 'accuracy'
    GROUP BY run_id
)
SELECT r.*, rm.avg_accuracy
FROM recent_runs r
LEFT JOIN run_metrics rm ON r.id = rm.run_id;
```

### UPSERT (INSERT ... ON CONFLICT)

```sql
-- Insert or update if exists
INSERT INTO experiments (id, name, owner, status)
VALUES ('abc-123', 'My Experiment', 'alice', 'running')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert or ignore if exists
INSERT INTO experiments (id, name, owner)
VALUES ('abc-123', 'My Experiment', 'alice')
ON CONFLICT (id) DO NOTHING;
```

---

## Checkpoint Questions

Be ready to explain:

- [ ] **Why did you choose a relational DB here?**
  > Structured data with clear relationships (experiments → runs → metrics), need ACID compliance for data integrity, complex aggregation queries for dashboards, and SQL is powerful for ad-hoc analytics.

- [ ] **What is an index and how does it speed up queries?**
  > An index is a separate data structure (usually B-tree) that maintains sorted references to rows. Instead of scanning every row (O(n)), it enables O(log n) lookups. Trade-off: faster reads, slower writes due to index maintenance.

- [ ] **What is a foreign key and why use CASCADE?**
  > A foreign key enforces referential integrity—ensures `runs.experiment_id` always points to a valid `experiments.id`. CASCADE means when the parent is deleted, children are automatically deleted, maintaining consistency.

- [ ] **When would you use a composite index?**
  > When queries filter on multiple columns together. Order matters: `(status, created_at)` works for `WHERE status = 'x'` or `WHERE status = 'x' AND created_at > y`, but NOT for `WHERE created_at > y` alone (leftmost prefix rule).

- [ ] **Trade-offs between UUID vs auto-increment IDs?**
  > UUID: Globally unique, no coordination needed for distributed systems, no sequential ID leakage (security). Auto-increment: Smaller storage (8 bytes vs 16), better index locality, human-readable. Use UUID for distributed systems or security-sensitive apps.

- [ ] **What are transaction isolation levels?**
  > Controls how concurrent transactions see each other's changes. Read Committed (default in Postgres) prevents dirty reads. Serializable prevents all anomalies but has higher contention. Choose based on consistency vs performance needs.

- [ ] **How do you identify a slow query?**
  > Use `EXPLAIN ANALYZE` to see execution plan. Look for sequential scans on large tables, large row estimates vs actuals, nested loops with many iterations, or external sorts (hitting disk). Add indexes or rewrite query.
