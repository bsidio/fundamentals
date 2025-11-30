# Day 1 - Morning: Python Warmup (60-90 min)

## Goals
- Refresh Python fundamentals as they relate to services/tools
- Practice core data structures and patterns
- Understand memory management and performance implications

---

## 1. Data Structures Deep Dive

### Lists, Dicts, Sets - When to Use Each

| Structure | Use Case | Time Complexity (avg) | Memory |
|-----------|----------|----------------------|--------|
| List | Ordered collection, duplicates OK | O(1) append, O(n) search | Contiguous |
| Dict | Key-value mapping, fast lookup | O(1) get/set | Hash table |
| Set | Unique elements, membership test | O(1) add/check | Hash table |

```python
# List: ordered, allows duplicates
experiment_names = ["exp_v1", "exp_v2", "exp_v1"]  # v1 appears twice

# Dict: fast key lookup
experiment_status = {
    "exp_001": "running",
    "exp_002": "completed",
    "exp_003": "failed"
}
print(experiment_status["exp_001"])  # O(1) lookup

# Set: unique values, fast membership testing
active_users = {"alice", "bob", "charlie"}
if "alice" in active_users:  # O(1) check
    print("Alice is active")
```

### Comprehensions - Concise and Readable

```python
# List comprehension
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# Dict comprehension
word_lengths = {word: len(word) for word in ["hello", "world"]}
# {'hello': 5, 'world': 5}

# Nested comprehension (use sparingly - readability matters)
matrix = [[i * j for j in range(3)] for i in range(3)]
# [[0, 0, 0], [0, 1, 2], [0, 2, 4]]

# Set comprehension
unique_lengths = {len(word) for word in ["hello", "world", "python"]}
# {5, 6}
```

### Set Operations for Data Analysis

```python
# Common set operations
all_experiments = {"exp1", "exp2", "exp3", "exp4"}
completed = {"exp1", "exp3"}
failed = {"exp2"}

# What's still running?
running = all_experiments - completed - failed  # {'exp4'}

# Union: all finished (completed OR failed)
finished = completed | failed  # {'exp1', 'exp2', 'exp3'}

# Intersection: find common users between two systems
system_a_users = {"alice", "bob", "charlie"}
system_b_users = {"bob", "charlie", "dave"}
common_users = system_a_users & system_b_users  # {'bob', 'charlie'}

# Symmetric difference: users in only one system
exclusive_users = system_a_users ^ system_b_users  # {'alice', 'dave'}
```

---

## 2. Context Managers (`with` statement)

### Why Use Context Managers?

Context managers ensure resources are properly cleaned up, even if an exception occurs.

```python
# Without context manager (dangerous!)
f = open("config.json", "r")
data = f.read()
# If an exception happens here, file never closes!
f.close()

# With context manager (safe)
with open("config.json", "r") as f:
    data = f.read()
# File automatically closes, even if exception occurs
```

### Built-in Context Managers

```python
import threading
import sqlite3

# File handling
with open("config.json", "r") as f:
    data = json.load(f)

# Thread locks
lock = threading.Lock()
with lock:
    # Critical section - only one thread at a time
    shared_resource.update()

# Database connections
with sqlite3.connect("database.db") as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM experiments")
# Connection automatically closed
```

### Custom Context Managers

```python
from contextlib import contextmanager
import time
import logging

# Using decorator (simpler)
@contextmanager
def timer(label: str):
    """Time a block of code."""
    start = time.perf_counter()
    try:
        yield  # Code inside 'with' block runs here
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f} seconds")

# Usage
with timer("database_query"):
    results = expensive_query()

# Using class (more control)
class DatabaseTransaction:
    def __init__(self, connection):
        self.conn = connection

    def __enter__(self):
        self.conn.begin()
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.conn.commit()
        else:
            self.conn.rollback()
        return False  # Don't suppress exceptions

# Usage
with DatabaseTransaction(db_conn) as conn:
    conn.execute("INSERT INTO experiments ...")
    conn.execute("INSERT INTO runs ...")
# Auto-commits on success, rollbacks on exception
```

---

## 3. Exception Handling

### Exception Hierarchy

```
BaseException
 └── Exception
      ├── ValueError      # Invalid value
      ├── TypeError       # Wrong type
      ├── KeyError        # Dict key not found
      ├── IndexError      # List index out of range
      ├── FileNotFoundError
      ├── ConnectionError
      └── RuntimeError    # Generic runtime error
```

### Best Practices

```python
# BAD: Catching everything
try:
    risky_operation()
except Exception:
    pass  # Silently swallows ALL errors, including bugs!

# GOOD: Catch specific exceptions
try:
    config = load_config(path)
except FileNotFoundError:
    logger.error(f"Config file not found: {path}")
    config = default_config
except json.JSONDecodeError as e:
    logger.error(f"Invalid JSON in config: {e}")
    raise ConfigurationError(f"Malformed config file: {path}")

# GOOD: Re-raise with context
try:
    result = external_api.call()
except requests.RequestException as e:
    raise ServiceUnavailableError(f"API call failed: {e}") from e
```

### Custom Exceptions

```python
# Define domain-specific exceptions
class ExperimentError(Exception):
    """Base exception for experiment-related errors."""
    pass

class ExperimentNotFoundError(ExperimentError):
    """Raised when an experiment doesn't exist."""
    def __init__(self, experiment_id: str):
        self.experiment_id = experiment_id
        super().__init__(f"Experiment not found: {experiment_id}")

class InvalidMetricError(ExperimentError):
    """Raised when metric data is invalid."""
    pass

# Usage
def get_experiment(experiment_id: str) -> Experiment:
    experiment = db.query(Experiment).get(experiment_id)
    if not experiment:
        raise ExperimentNotFoundError(experiment_id)
    return experiment

# Caller can catch specifically
try:
    exp = get_experiment("exp-123")
except ExperimentNotFoundError as e:
    return {"error": f"Not found: {e.experiment_id}"}, 404
```

---

## 4. Generators and Iterators

### Why Generators?

Generators produce values on-demand, saving memory for large datasets.

```python
# List: stores ALL values in memory
def get_all_metrics_list(run_id: str) -> list:
    metrics = []
    for row in db.query_metrics(run_id):  # 1 million rows
        metrics.append(process(row))
    return metrics  # 1 million items in memory!

# Generator: produces values one at a time
def get_all_metrics_gen(run_id: str):
    for row in db.query_metrics(run_id):  # 1 million rows
        yield process(row)  # Only 1 item in memory at a time

# Usage (same syntax, different memory!)
for metric in get_all_metrics_gen(run_id):
    print(metric)
```

### Generator Expressions

```python
# List comprehension: creates list immediately
squares_list = [x**2 for x in range(1_000_000)]  # Uses ~8MB RAM

# Generator expression: creates values on demand
squares_gen = (x**2 for x in range(1_000_000))  # Uses ~100 bytes

# Both work the same way
for square in squares_gen:
    process(square)
```

### Practical Example: Log Processing

```python
def read_large_log(filepath: str):
    """Read log file line by line without loading entire file."""
    with open(filepath, "r") as f:
        for line in f:  # File objects are iterators!
            yield json.loads(line)

def filter_errors(log_entries):
    """Filter to only error entries."""
    for entry in log_entries:
        if entry.get("level") == "ERROR":
            yield entry

def extract_experiment_ids(error_entries):
    """Extract experiment IDs from error entries."""
    for entry in error_entries:
        if "experiment_id" in entry:
            yield entry["experiment_id"]

# Chain generators - memory efficient pipeline
log_entries = read_large_log("app.log")  # 10GB file
errors = filter_errors(log_entries)
exp_ids = extract_experiment_ids(errors)

# Only processes one line at a time!
failed_experiments = set(exp_ids)
```

---

## 5. Type Hints

### Why Type Hints?

- Documentation that's always up-to-date
- IDE autocomplete and error detection
- Catch bugs before runtime with mypy

```python
from typing import Optional, List, Dict, Union, Callable
from datetime import datetime

# Basic types
def greet(name: str) -> str:
    return f"Hello, {name}"

# Optional (can be None)
def get_description(exp_id: str) -> Optional[str]:
    exp = get_experiment(exp_id)
    return exp.description  # Could be None

# Collections
def get_run_ids(experiment: Experiment) -> List[str]:
    return [run.id for run in experiment.runs]

# Dict with specific types
def get_metrics(run_id: str) -> Dict[str, float]:
    return {"accuracy": 0.95, "loss": 0.05}

# Union types (Python 3.10+ can use |)
def process_input(value: Union[str, int]) -> str:
    return str(value)

# Callable types
def retry(func: Callable[[], str], attempts: int = 3) -> str:
    for _ in range(attempts):
        try:
            return func()
        except Exception:
            continue
    raise RuntimeError("All retries failed")
```

### Type Hints with Classes

```python
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class Experiment:
    id: str
    name: str
    owner: str
    description: Optional[str] = None
    status: str = "created"
    created_at: datetime = None
    runs: List["Run"] = None  # Forward reference

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.runs is None:
            self.runs = []

@dataclass
class Run:
    id: str
    experiment_id: str
    status: str = "running"
    seed: Optional[int] = None
```

---

## Exercise: Experiment Config Reader

Write a script that:
1. Reads a JSON config for an "experiment" (name, params, seed)
2. Validates required fields with proper error handling
3. Prints it in a formatted table

### Sample Config (`experiment_config.json`)
```json
{
    "name": "hyperparameter_search_v1",
    "params": {
        "learning_rate": 0.001,
        "batch_size": 32,
        "epochs": 100
    },
    "seed": 42
}
```

### Solution

```python
import json
from typing import Any, Dict, List
from dataclasses import dataclass
from contextlib import contextmanager
import time

# Custom exceptions
class ConfigError(Exception):
    """Base exception for config errors."""
    pass

class ConfigNotFoundError(ConfigError):
    """Config file not found."""
    pass

class ConfigValidationError(ConfigError):
    """Config validation failed."""
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(f"Validation failed: {errors}")

# Type definitions
@dataclass
class ExperimentConfig:
    name: str
    params: Dict[str, Any]
    seed: int
    description: str = ""

REQUIRED_FIELDS = ["name", "params", "seed"]

@contextmanager
def timer(label: str):
    start = time.perf_counter()
    yield
    print(f"[{label}] {time.perf_counter() - start:.4f}s")

def load_config(path: str) -> dict:
    """Load JSON config with proper error handling."""
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise ConfigNotFoundError(f"Config file not found: {path}")
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid JSON: {e}")

def validate_config(config: dict) -> List[str]:
    """Validate required fields exist. Returns list of errors."""
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in config:
            errors.append(f"Missing required field: {field}")

    if "params" in config and not isinstance(config["params"], dict):
        errors.append("'params' must be a dictionary")

    if "seed" in config and not isinstance(config["seed"], int):
        errors.append("'seed' must be an integer")

    return errors

def parse_config(config: dict) -> ExperimentConfig:
    """Parse raw config dict into typed dataclass."""
    errors = validate_config(config)
    if errors:
        raise ConfigValidationError(errors)

    return ExperimentConfig(
        name=config["name"],
        params=config["params"],
        seed=config["seed"],
        description=config.get("description", "")
    )

def print_table(config: ExperimentConfig) -> None:
    """Print config as formatted table."""
    width = 45
    print("=" * width)
    print(f"{'EXPERIMENT CONFIGURATION':^{width}}")
    print("=" * width)
    print(f"{'Field':<15} │ {'Value':<25}")
    print("-" * width)
    print(f"{'Name':<15} │ {config.name:<25}")
    print(f"{'Seed':<15} │ {config.seed:<25}")
    print(f"{'Description':<15} │ {config.description or '(none)':<25}")
    print("-" * width)
    print("Parameters:")
    for key, value in config.params.items():
        print(f"  {key:<13} │ {value:<25}")
    print("=" * width)

def main():
    with timer("total"):
        try:
            with timer("load"):
                raw_config = load_config("experiment_config.json")

            with timer("parse"):
                config = parse_config(raw_config)

            print_table(config)

        except ConfigNotFoundError as e:
            print(f"ERROR: {e}")
        except ConfigValidationError as e:
            print("ERROR: Configuration validation failed:")
            for error in e.errors:
                print(f"  - {error}")
        except ConfigError as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    main()
```

---

## Checkpoint Questions

Be ready to explain:

- [ ] **What is a context manager and why use `with`?**
  > A context manager ensures resources are properly acquired and released. The `with` statement guarantees cleanup happens even if exceptions occur. Common uses: file handling, database connections, locks.

- [ ] **Difference between list, dict, and set?**
  > List: ordered, allows duplicates, O(n) search. Dict: key-value pairs, O(1) lookup by key. Set: unordered unique values, O(1) membership test.

- [ ] **When to use `try/except` vs `if/else` for validation?**
  > Use `if/else` for expected conditions (empty input). Use `try/except` for exceptional situations (file not found, network error). Follow EAFP (Easier to Ask Forgiveness than Permission) in Python.

- [ ] **What is a generator vs a list comprehension?**
  > List comprehension creates all values immediately in memory. Generator produces values on-demand, one at a time, using `yield`. Use generators for large datasets to save memory.

- [ ] **Why use type hints?**
  > Type hints provide documentation, enable IDE autocomplete, and allow static analysis tools (mypy) to catch bugs before runtime. They make code more maintainable.
