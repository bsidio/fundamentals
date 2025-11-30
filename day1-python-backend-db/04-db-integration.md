# Day 1 - Afternoon: DB Integration with API (1-1.5h)

## Goals
- Integrate database with your API using an ORM
- Implement POST and GET endpoints with real DB operations
- Understand async database patterns
- Learn repository and unit of work patterns

---

## ORM Fundamentals

### What is an ORM?

**Object-Relational Mapping** bridges the gap between object-oriented code and relational databases:

```python
# Without ORM: Raw SQL strings
cursor.execute("SELECT * FROM experiments WHERE owner = %s", (owner,))
rows = cursor.fetchall()
experiments = [{"id": r[0], "name": r[1], ...} for r in rows]

# With ORM: Pythonic objects
experiments = db.query(Experiment).filter(Experiment.owner == owner).all()
# experiments is a list of Experiment objects with attributes
```

### ORM Trade-offs

| Aspect | Advantage | Disadvantage |
|--------|-----------|--------------|
| **Productivity** | Faster development, less SQL | Hidden complexity |
| **Safety** | SQL injection prevention | Can generate inefficient queries |
| **Portability** | Database-agnostic code | Lose DB-specific features |
| **Maintainability** | Type-safe, IDE support | Another abstraction layer |

---

## SQLAlchemy + FastAPI Integration

### Project Setup

```bash
pip install sqlalchemy asyncpg psycopg2-binary alembic
# For async: pip install sqlalchemy[asyncio] asyncpg
```

### Database Models (`models.py`)

```python
from sqlalchemy import Column, String, Text, DateTime, Integer, Float, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    owner = Column(String(50), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="created")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    runs = relationship("Run", back_populates="experiment", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(status.in_(['created', 'running', 'completed', 'failed'])),
    )


class Run(Base):
    __tablename__ = "runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    experiment_id = Column(UUID(as_uuid=True), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    status = Column(String(20), default="running")
    seed = Column(Integer)

    # Relationships
    experiment = relationship("Experiment", back_populates="runs")
    metrics = relationship("Metric", back_populates="run", cascade="all, delete-orphan")


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)
    step = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    run = relationship("Run", back_populates="metrics")
```

### Database Session (`database.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost:5432/experiment_tracker"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for getting DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Pydantic Schemas (`schemas.py`)

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID

# Request schemas
class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    owner: str = Field(..., min_length=1)
    description: Optional[str] = None

# Response schemas
class RunSummary(BaseModel):
    id: UUID
    started_at: datetime
    status: str

    class Config:
        from_attributes = True  # For Pydantic v2 (orm_mode in v1)

class ExperimentResponse(BaseModel):
    id: UUID
    name: str
    owner: str
    description: Optional[str]
    status: str
    created_at: datetime
    runs: list[RunSummary] = []

    class Config:
        from_attributes = True

class ExperimentList(BaseModel):
    id: UUID
    name: str
    owner: str
    status: str
    created_at: datetime
    run_count: int

    class Config:
        from_attributes = True
```

### API Routes (`main.py`)

```python
from fastapi import FastAPI, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import logging

from database import get_db, engine
from models import Base, Experiment, Run
from schemas import ExperimentCreate, ExperimentResponse, ExperimentList

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Experiment Tracker API")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/experiments", status_code=status.HTTP_201_CREATED, response_model=ExperimentResponse)
def create_experiment(experiment: ExperimentCreate, db: Session = Depends(get_db)):
    """Create a new experiment."""
    logger.info(f"Creating experiment: {experiment.name}")

    db_experiment = Experiment(
        name=experiment.name,
        owner=experiment.owner,
        description=experiment.description
    )
    db.add(db_experiment)
    db.commit()
    db.refresh(db_experiment)

    logger.info(f"Created experiment: {db_experiment.id}")
    return db_experiment


@app.get("/experiments", response_model=list[ExperimentList])
def list_experiments(
    owner: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """List experiments with optional filters."""
    query = db.query(
        Experiment.id,
        Experiment.name,
        Experiment.owner,
        Experiment.status,
        Experiment.created_at,
        func.count(Run.id).label("run_count")
    ).outerjoin(Run).group_by(Experiment.id)

    if owner:
        query = query.filter(Experiment.owner == owner)
    if status:
        query = query.filter(Experiment.status == status)

    results = query.order_by(Experiment.created_at.desc()).all()
    return results


@app.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Get experiment with its runs."""
    logger.info(f"Fetching experiment: {experiment_id}")

    experiment = db.query(Experiment)\
        .options(joinedload(Experiment.runs))\
        .filter(Experiment.id == experiment_id)\
        .first()

    if not experiment:
        logger.warning(f"Experiment not found: {experiment_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )

    return experiment
```

---

## Key ORM Concepts

### Session Lifecycle
```python
db = Session()          # Open session
db.add(object)          # Stage for insert
db.commit()             # Write to DB
db.refresh(object)      # Reload from DB
db.close()              # Close session
```

### Querying Patterns

```python
# Get by ID
experiment = db.query(Experiment).filter(Experiment.id == id).first()

# Get all with filter
experiments = db.query(Experiment).filter(Experiment.owner == "alice").all()

# Join and eager load
experiment = db.query(Experiment)\
    .options(joinedload(Experiment.runs))\
    .filter(Experiment.id == id)\
    .first()

# Aggregation
from sqlalchemy import func
result = db.query(
    Experiment.owner,
    func.count(Experiment.id).label("count")
).group_by(Experiment.owner).all()
```

### N+1 Query Problem

```python
# BAD: N+1 queries (1 for experiments, N for each experiment's runs)
experiments = db.query(Experiment).all()
for exp in experiments:
    print(exp.runs)  # Triggers additional query!

# GOOD: Eager loading (1 query with JOIN)
experiments = db.query(Experiment)\
    .options(joinedload(Experiment.runs))\
    .all()
```

---

## How ORMs Prevent SQL Injection

### The Problem
```python
# DANGEROUS: String interpolation
query = f"SELECT * FROM users WHERE name = '{user_input}'"
# If user_input = "'; DROP TABLE users; --"
# Result: SELECT * FROM users WHERE name = ''; DROP TABLE users; --'
```

### The Solution: Parameterized Queries
```python
# ORM uses parameterized queries internally
db.query(Experiment).filter(Experiment.name == user_input)
# Becomes: SELECT * FROM experiments WHERE name = $1
# With parameter: ['user_input_value']
# SQL injection characters are escaped automatically
```

---

---

## Async Database Operations

### Why Async?

Sync operations block the thread while waiting for I/O:
```python
# Sync: Thread blocked during DB query
result = db.query(Experiment).all()  # Thread waits here
```

Async allows handling other requests while waiting:
```python
# Async: Thread released during DB query
result = await db.execute(select(Experiment))  # Other requests can run
```

### Async SQLAlchemy Setup

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/db"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### Async Query Patterns

```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Async query
async def get_experiments(db: AsyncSession, owner: str = None):
    query = select(Experiment)
    if owner:
        query = query.where(Experiment.owner == owner)

    result = await db.execute(query)
    return result.scalars().all()

# Async with eager loading (use selectinload, not joinedload for async)
async def get_experiment_with_runs(db: AsyncSession, experiment_id: str):
    query = (
        select(Experiment)
        .options(selectinload(Experiment.runs))
        .where(Experiment.id == experiment_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()

# Async create
async def create_experiment(db: AsyncSession, data: ExperimentCreate):
    experiment = Experiment(**data.model_dump())
    db.add(experiment)
    await db.flush()  # Get ID without committing
    await db.refresh(experiment)
    return experiment
```

---

## Repository Pattern

### Why Use Repositories?

Separates data access logic from business logic:

```python
# Without repository: Business logic mixed with data access
@app.get("/experiments/{id}")
async def get_experiment(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Experiment).where(Experiment.id == id)
    result = await db.execute(query)
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(404)
    return experiment

# With repository: Clean separation
@app.get("/experiments/{id}")
async def get_experiment(id: str, repo: ExperimentRepository = Depends()):
    experiment = await repo.get_by_id(id)
    if not experiment:
        raise HTTPException(404)
    return experiment
```

### Repository Implementation

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List

T = TypeVar("T")

class BaseRepository(ABC, Generic[T]):
    """Abstract base repository."""

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        pass

    @abstractmethod
    async def get_all(self, **filters) -> List[T]:
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        pass

    @abstractmethod
    async def update(self, entity: T) -> T:
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        pass


class ExperimentRepository(BaseRepository[Experiment]):
    """Experiment-specific repository."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[Experiment]:
        query = select(Experiment).where(Experiment.id == id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, owner: str = None, status: str = None) -> List[Experiment]:
        query = select(Experiment)
        if owner:
            query = query.where(Experiment.owner == owner)
        if status:
            query = query.where(Experiment.status == status)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_with_runs(self, id: str) -> Optional[Experiment]:
        query = (
            select(Experiment)
            .options(selectinload(Experiment.runs))
            .where(Experiment.id == id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, experiment: Experiment) -> Experiment:
        self.db.add(experiment)
        await self.db.flush()
        await self.db.refresh(experiment)
        return experiment

    async def update(self, experiment: Experiment) -> Experiment:
        await self.db.flush()
        await self.db.refresh(experiment)
        return experiment

    async def delete(self, id: str) -> bool:
        experiment = await self.get_by_id(id)
        if experiment:
            await self.db.delete(experiment)
            return True
        return False
```

---

## Unit of Work Pattern

### Managing Transactions Across Repositories

```python
class UnitOfWork:
    """Coordinates multiple repositories in a single transaction."""

    def __init__(self, session_factory):
        self.session_factory = session_factory

    async def __aenter__(self):
        self.session = self.session_factory()
        self.experiments = ExperimentRepository(self.session)
        self.runs = RunRepository(self.session)
        self.metrics = MetricRepository(self.session)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        else:
            await self.commit()
        await self.session.close()

    async def commit(self):
        await self.session.commit()

    async def rollback(self):
        await self.session.rollback()


# Usage
async def create_experiment_with_run(data: dict):
    async with UnitOfWork(async_session) as uow:
        # Both operations in same transaction
        experiment = await uow.experiments.create(Experiment(**data["experiment"]))
        run = await uow.runs.create(Run(experiment_id=experiment.id, **data["run"]))
        # Auto-commits on exit, rolls back on exception
        return experiment, run
```

---

## Database Migrations with Alembic

### Setup

```bash
# Initialize alembic
alembic init alembic

# Edit alembic.ini
sqlalchemy.url = postgresql://user:password@localhost:5432/db
```

### Migration Workflow

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "add experiments table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# View history
alembic history
```

### Migration File Example

```python
# alembic/versions/001_add_experiments.py
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None

def upgrade():
    op.create_table(
        'experiments',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('owner', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), default='created'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_experiments_owner', 'experiments', ['owner'])

def downgrade():
    op.drop_index('idx_experiments_owner')
    op.drop_table('experiments')
```

---

## Connection Pooling

### Why Pool Connections?

Creating database connections is expensive (TCP handshake, authentication, etc.). Pooling reuses connections:

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,          # Connections to keep open
    max_overflow=10,      # Extra connections when busy
    pool_timeout=30,      # Wait for connection before error
    pool_recycle=1800,    # Recycle connections after 30 min
    pool_pre_ping=True,   # Check connection health before use
)
```

### Pool Monitoring

```python
from sqlalchemy import event

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug(f"Connection checked out from pool")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    logger.debug(f"Connection returned to pool")
```

---

## Testing Database Code

### Test Database Setup

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "postgresql://test:test@localhost:5432/test_db"

@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture
def db(engine):
    """Each test gets fresh transaction that's rolled back."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()
```

### Test Examples

```python
def test_create_experiment(db):
    repo = ExperimentRepository(db)

    experiment = Experiment(name="Test", owner="alice")
    created = repo.create(experiment)

    assert created.id is not None
    assert created.name == "Test"
    assert created.owner == "alice"

def test_get_experiments_by_owner(db):
    repo = ExperimentRepository(db)

    # Setup
    repo.create(Experiment(name="Exp1", owner="alice"))
    repo.create(Experiment(name="Exp2", owner="alice"))
    repo.create(Experiment(name="Exp3", owner="bob"))
    db.commit()

    # Test
    alice_experiments = repo.get_all(owner="alice")

    assert len(alice_experiments) == 2
    assert all(e.owner == "alice" for e in alice_experiments)
```

---

## Checkpoint Questions

Be ready to explain:

- [ ] **What is an ORM and why use one?**
  > ORM (Object-Relational Mapping) translates between database tables and Python objects. Benefits: SQL injection prevention, database portability, type safety, IDE support. Trade-off: potential for generating inefficient queries if not careful.

- [ ] **How does SQLAlchemy prevent SQL injection?**
  > SQLAlchemy uses parameterized queries internally. User input is passed as parameters, not interpolated into SQL strings. The database driver escapes special characters, making injection impossible.

- [ ] **What is the N+1 query problem and how do you solve it?**
  > N+1 occurs when you query N items, then for each item make another query (1+N total). Example: get experiments, then for each get runs. Solution: eager loading with `joinedload()` or `selectinload()` to fetch related data in one query.

- [ ] **What is `joinedload` vs `lazy loading` vs `selectinload`?**
  > Lazy loading: Related objects loaded on access (triggers N+1). Joinedload: Single query with JOIN (good for one-to-one). Selectinload: Separate query with IN clause (good for one-to-many, required for async).

- [ ] **How do you handle database sessions in a web framework?**
  > Use dependency injection to provide session per request. Session opened at request start, committed on success, rolled back on error, closed after response. FastAPI's `Depends()` with generator function handles this pattern.

- [ ] **What is the repository pattern?**
  > Abstracts data access behind an interface. Business logic calls `repo.get_by_id()` instead of knowing SQL/ORM details. Benefits: testability (mock repos), swappable implementations, clean separation of concerns.

- [ ] **Why use database migrations?**
  > Track schema changes in version control, apply changes consistently across environments, enable rollbacks, team collaboration on schema changes. Alembic auto-generates migrations from model changes.
