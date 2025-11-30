# Day 1 - Morning: Backend API Basics (2-2.5h)

## Goals
- Create a production-ready API with FastAPI
- Implement proper validation, error handling, and logging
- Understand middleware, dependencies, and testing patterns

---

## 1. FastAPI Fundamentals

### Project Setup

```bash
# Create project structure
mkdir experiment-tracker-api && cd experiment-tracker-api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pydantic python-dotenv

# Project structure
experiment-tracker-api/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration management
│   ├── models/           # Pydantic models
│   │   ├── __init__.py
│   │   └── experiment.py
│   ├── routes/           # API endpoints
│   │   ├── __init__.py
│   │   └── experiments.py
│   ├── services/         # Business logic
│   │   └── experiment_service.py
│   └── middleware/       # Custom middleware
│       └── logging.py
├── tests/
│   └── test_experiments.py
├── requirements.txt
└── .env
```

### Configuration Management (`app/config.py`)

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings with environment variable support."""
    app_name: str = "Experiment Tracker API"
    debug: bool = False
    database_url: str = "postgresql://localhost/experiments"
    redis_url: str = "redis://localhost:6379"
    api_key_header: str = "X-API-Key"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"

@lru_cache()  # Cache settings (singleton pattern)
def get_settings() -> Settings:
    return Settings()
```

### Main Application (`app/main.py`)

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time

from app.config import get_settings
from app.routes import experiments

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("Starting up...")
    # Initialize database connections, caches, etc.
    yield
    # Shutdown
    logger.info("Shutting down...")
    # Close connections, cleanup resources

app = FastAPI(
    title=get_settings().app_name,
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time:.4f}s)")
    return response

# Include routers
app.include_router(experiments.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers."""
    return {"status": "healthy", "version": "1.0.0"}
```

---

## 2. Pydantic Models for Validation

### Request/Response Models (`app/models/experiment.py`)

```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

class ExperimentStatus(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

# Request models (what client sends)
class ExperimentCreate(BaseModel):
    """Schema for creating a new experiment."""
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique experiment name",
        examples=["hyperparameter_search_v1"]
    )
    owner: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Username of experiment owner"
    )
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional experiment description"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        # Only allow alphanumeric, underscore, hyphen
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Name must be alphanumeric with underscores/hyphens only")
        return v.lower()  # Normalize to lowercase

class ExperimentUpdate(BaseModel):
    """Schema for updating an experiment."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[ExperimentStatus] = None

# Response models (what server returns)
class RunSummary(BaseModel):
    """Brief run info for experiment listings."""
    id: UUID
    started_at: datetime
    status: str

    model_config = {"from_attributes": True}

class ExperimentResponse(BaseModel):
    """Full experiment details."""
    id: UUID
    name: str
    owner: str
    description: Optional[str]
    status: ExperimentStatus
    created_at: datetime
    updated_at: Optional[datetime]
    runs: List[RunSummary] = []

    model_config = {"from_attributes": True}

class ExperimentListItem(BaseModel):
    """Experiment summary for list views."""
    id: UUID
    name: str
    owner: str
    status: ExperimentStatus
    created_at: datetime
    run_count: int

    model_config = {"from_attributes": True}

# Pagination wrapper
class PaginatedResponse(BaseModel):
    """Generic paginated response."""
    items: List[ExperimentListItem]
    total: int
    page: int
    per_page: int
    pages: int
```

---

## 3. API Routes with Proper Error Handling

### Experiments Router (`app/routes/experiments.py`)

```python
from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional, List
from uuid import UUID
import logging

from app.models.experiment import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
    ExperimentListItem,
    ExperimentStatus,
    PaginatedResponse
)
from app.services.experiment_service import ExperimentService, get_experiment_service

router = APIRouter(prefix="/experiments", tags=["experiments"])
logger = logging.getLogger(__name__)

# Custom exception for not found
class ExperimentNotFoundError(Exception):
    def __init__(self, experiment_id: UUID):
        self.experiment_id = experiment_id

@router.get("", response_model=PaginatedResponse)
async def list_experiments(
    owner: Optional[str] = Query(None, description="Filter by owner"),
    status: Optional[ExperimentStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    service: ExperimentService = Depends(get_experiment_service)
):
    """
    List all experiments with optional filters and pagination.

    - **owner**: Filter experiments by owner username
    - **status**: Filter by experiment status
    - **page**: Page number (1-indexed)
    - **per_page**: Number of items per page (max 100)
    """
    logger.info(f"Listing experiments: owner={owner}, status={status}, page={page}")

    result = await service.list_experiments(
        owner=owner,
        status=status,
        page=page,
        per_page=per_page
    )

    return PaginatedResponse(
        items=result.items,
        total=result.total,
        page=page,
        per_page=per_page,
        pages=(result.total + per_page - 1) // per_page
    )

@router.post("", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
async def create_experiment(
    experiment: ExperimentCreate,
    service: ExperimentService = Depends(get_experiment_service)
):
    """
    Create a new experiment.

    - Validates experiment name format
    - Checks for duplicate names
    - Returns created experiment with ID
    """
    logger.info(f"Creating experiment: {experiment.name} by {experiment.owner}")

    try:
        created = await service.create_experiment(experiment)
        logger.info(f"Created experiment: {created.id}")
        return created
    except ValueError as e:
        logger.warning(f"Validation error creating experiment: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: UUID,
    service: ExperimentService = Depends(get_experiment_service)
):
    """
    Get a specific experiment by ID.

    Returns experiment details including all runs.
    """
    logger.info(f"Fetching experiment: {experiment_id}")

    experiment = await service.get_experiment(experiment_id)
    if not experiment:
        logger.warning(f"Experiment not found: {experiment_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment {experiment_id} not found"
        )

    return experiment

@router.patch("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: UUID,
    update: ExperimentUpdate,
    service: ExperimentService = Depends(get_experiment_service)
):
    """
    Update an existing experiment.

    Only provided fields will be updated (PATCH semantics).
    """
    logger.info(f"Updating experiment: {experiment_id}")

    experiment = await service.update_experiment(experiment_id, update)
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment {experiment_id} not found"
        )

    return experiment

@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment(
    experiment_id: UUID,
    service: ExperimentService = Depends(get_experiment_service)
):
    """
    Delete an experiment and all its runs.

    This action is irreversible.
    """
    logger.info(f"Deleting experiment: {experiment_id}")

    deleted = await service.delete_experiment(experiment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment {experiment_id} not found"
        )

    logger.info(f"Deleted experiment: {experiment_id}")
```

---

## 4. Dependency Injection Pattern

### Service Layer (`app/services/experiment_service.py`)

```python
from typing import Optional, List
from uuid import UUID
from dataclasses import dataclass

from app.models.experiment import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
    ExperimentListItem,
    ExperimentStatus
)

@dataclass
class ListResult:
    items: List[ExperimentListItem]
    total: int

class ExperimentService:
    """Business logic for experiment operations."""

    def __init__(self, db_session, cache_client=None):
        self.db = db_session
        self.cache = cache_client

    async def list_experiments(
        self,
        owner: Optional[str] = None,
        status: Optional[ExperimentStatus] = None,
        page: int = 1,
        per_page: int = 20
    ) -> ListResult:
        """List experiments with filters and pagination."""
        # Try cache first for common queries
        cache_key = f"experiments:list:{owner}:{status}:{page}:{per_page}"
        if self.cache:
            cached = await self.cache.get(cache_key)
            if cached:
                return cached

        # Build query
        query = self.db.query(Experiment)

        if owner:
            query = query.filter(Experiment.owner == owner)
        if status:
            query = query.filter(Experiment.status == status)

        # Get total count
        total = query.count()

        # Paginate
        offset = (page - 1) * per_page
        experiments = query.order_by(Experiment.created_at.desc())\
                          .offset(offset)\
                          .limit(per_page)\
                          .all()

        result = ListResult(items=experiments, total=total)

        # Cache for 60 seconds
        if self.cache:
            await self.cache.setex(cache_key, 60, result)

        return result

    async def create_experiment(self, data: ExperimentCreate) -> ExperimentResponse:
        """Create a new experiment."""
        # Check for duplicate name
        existing = self.db.query(Experiment)\
                         .filter(Experiment.name == data.name)\
                         .first()
        if existing:
            raise ValueError(f"Experiment with name '{data.name}' already exists")

        experiment = Experiment(
            name=data.name,
            owner=data.owner,
            description=data.description
        )
        self.db.add(experiment)
        self.db.commit()
        self.db.refresh(experiment)

        # Invalidate list cache
        if self.cache:
            await self.cache.delete_pattern("experiments:list:*")

        return experiment

    async def get_experiment(self, experiment_id: UUID) -> Optional[ExperimentResponse]:
        """Get experiment by ID with eager-loaded runs."""
        # Try cache
        cache_key = f"experiment:{experiment_id}"
        if self.cache:
            cached = await self.cache.get(cache_key)
            if cached:
                return cached

        experiment = self.db.query(Experiment)\
                           .options(joinedload(Experiment.runs))\
                           .filter(Experiment.id == experiment_id)\
                           .first()

        if experiment and self.cache:
            await self.cache.setex(cache_key, 300, experiment)  # 5 min

        return experiment

    async def update_experiment(
        self,
        experiment_id: UUID,
        update: ExperimentUpdate
    ) -> Optional[ExperimentResponse]:
        """Update experiment fields."""
        experiment = self.db.query(Experiment)\
                           .filter(Experiment.id == experiment_id)\
                           .first()

        if not experiment:
            return None

        # Only update provided fields
        update_data = update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(experiment, field, value)

        experiment.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(experiment)

        # Invalidate cache
        if self.cache:
            await self.cache.delete(f"experiment:{experiment_id}")
            await self.cache.delete_pattern("experiments:list:*")

        return experiment

    async def delete_experiment(self, experiment_id: UUID) -> bool:
        """Delete experiment and cascade to runs."""
        result = self.db.query(Experiment)\
                       .filter(Experiment.id == experiment_id)\
                       .delete()

        self.db.commit()

        if result and self.cache:
            await self.cache.delete(f"experiment:{experiment_id}")
            await self.cache.delete_pattern("experiments:list:*")

        return result > 0

# Dependency injection
async def get_experiment_service():
    """FastAPI dependency for experiment service."""
    db = get_db_session()
    cache = get_cache_client()
    try:
        yield ExperimentService(db, cache)
    finally:
        db.close()
```

---

## 5. HTTP Status Codes Reference

| Code | Name | When to Use |
|------|------|-------------|
| **2xx Success** | | |
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no body) |
| **4xx Client Errors** | | |
| 400 | Bad Request | Validation errors, malformed JSON |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, state conflict |
| 422 | Unprocessable Entity | Valid JSON but semantic errors |
| 429 | Too Many Requests | Rate limit exceeded |
| **5xx Server Errors** | | |
| 500 | Internal Server Error | Unhandled exception |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Maintenance, overloaded |

---

## 6. Testing Your API

### Test File (`tests/test_experiments.py`)

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestExperimentEndpoints:

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_create_experiment_success(self):
        response = client.post(
            "/api/v1/experiments",
            json={
                "name": "test-experiment",
                "owner": "alice",
                "description": "Test description"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "test-experiment"
        assert data["owner"] == "alice"
        assert "id" in data

    def test_create_experiment_invalid_name(self):
        response = client.post(
            "/api/v1/experiments",
            json={
                "name": "invalid name with spaces!",
                "owner": "alice"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_get_experiment_not_found(self):
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/experiments/{fake_id}")
        assert response.status_code == 404

    def test_list_experiments_pagination(self):
        response = client.get(
            "/api/v1/experiments",
            params={"page": 1, "per_page": 10}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "pages" in data

    def test_list_experiments_filter_by_status(self):
        response = client.get(
            "/api/v1/experiments",
            params={"status": "running"}
        )
        assert response.status_code == 200
        for item in response.json()["items"]:
            assert item["status"] == "running"
```

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test
pytest tests/test_experiments.py::TestExperimentEndpoints::test_health_check -v
```

---

## 7. Running the Server

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production (with multiple workers)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# With gunicorn (production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Testing with curl

```bash
# Health check
curl http://localhost:8000/health

# Create experiment
curl -X POST http://localhost:8000/api/v1/experiments \
  -H "Content-Type: application/json" \
  -d '{"name": "test-exp", "owner": "alice", "description": "My first experiment"}'

# List experiments
curl "http://localhost:8000/api/v1/experiments?page=1&per_page=10"

# Get specific experiment
curl http://localhost:8000/api/v1/experiments/{id}

# Update experiment
curl -X PATCH http://localhost:8000/api/v1/experiments/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "running"}'

# Delete experiment
curl -X DELETE http://localhost:8000/api/v1/experiments/{id}
```

---

## Checkpoint Questions

Be ready to explain:

- [ ] **What is a REST API?**
  > REST (Representational State Transfer) is an architectural style using HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources identified by URLs. It's stateless - each request contains all needed information.

- [ ] **Difference between GET vs POST?**
  > GET retrieves data without side effects (idempotent, cacheable). POST creates new resources and can have side effects (not idempotent). GET parameters are in URL, POST has request body.

- [ ] **How does FastAPI route requests?**
  > FastAPI uses Python decorators (@app.get, @router.post) to map URL paths and HTTP methods to handler functions. Path parameters are extracted from URLs, query params from ?key=value.

- [ ] **What is dependency injection?**
  > DI provides objects a function needs (dependencies) rather than having the function create them. In FastAPI, `Depends()` injects services, database sessions, etc. Makes testing easier with mock dependencies.

- [ ] **Why use Pydantic models?**
  > Pydantic provides data validation, serialization, and documentation. Request bodies are validated automatically, type errors return 422. Models also generate OpenAPI/Swagger docs.

- [ ] **Why structure code with services/routes?**
  > Separation of concerns: routes handle HTTP (requests/responses), services contain business logic. This makes testing easier, logic reusable, and code maintainable.
