# Day 3 - Morning: CI/CD Pipeline (1.5-2h)

## Goals
- Understand CI/CD concepts and stages
- Draft a pipeline for the experiment tracker
- Know about branching strategies and image tagging

---

## CI/CD Overview

### Continuous Integration (CI)
- Automatically build and test on every commit
- Catch issues early
- Ensure code quality gates pass

### Continuous Deployment (CD)
- Automatically deploy to environments
- Progressive rollout (dev → staging → prod)
- Automated rollback on failures

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit  │ → │  Build   │ → │  Test    │ → │  Deploy  │
│          │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     └───────────────┴───────────────┴───────────────┘
                     CI                    CD
```

---

## Pipeline Stages

### Stage 1: Test

```yaml
# .github/workflows/ci.yaml (GitHub Actions)
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run linting
      run: |
        pip install ruff
        ruff check .

    - name: Run type checking
      run: |
        pip install mypy
        mypy src/

    - name: Run tests
      run: |
        pytest tests/ --cov=src --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: coverage.xml
```

### Stage 2: Build Docker Images

```yaml
  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ghcr.io/${{ github.repository }}/backend
        tags: |
          type=sha,prefix=
          type=ref,event=branch
          type=semver,pattern={{version}}

    - name: Build and push backend
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build and push frontend
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
```

### Stage 3: Deploy

```yaml
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging

    steps:
    - uses: actions/checkout@v4

    - name: Set up kubectl
      uses: azure/setup-kubectl@v3

    - name: Configure kubeconfig
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

    - name: Update image tag
      run: |
        kubectl set image deployment/backend \
          backend=ghcr.io/${{ github.repository }}/backend:${{ github.sha }} \
          -n staging

    - name: Wait for rollout
      run: |
        kubectl rollout status deployment/backend -n staging --timeout=300s

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval

    steps:
    - name: Deploy to production
      run: |
        kubectl set image deployment/backend \
          backend=ghcr.io/${{ github.repository }}/backend:${{ github.sha }} \
          -n production
```

---

## Complete Pipeline (Pseudo-YAML)

```yaml
pipeline:
  stages:
    - test
    - build
    - deploy-staging
    - deploy-production

test:
  stage: test
  script:
    - pip install -r requirements.txt
    - ruff check .                    # Linting
    - mypy src/                       # Type checking
    - pytest tests/ --cov=src         # Unit tests
    - npm test                        # Frontend tests (if any)
  artifacts:
    reports:
      coverage: coverage.xml

build:
  stage: build
  only:
    - main
    - develop
  script:
    - docker build -t backend:$CI_COMMIT_SHA ./backend
    - docker build -t frontend:$CI_COMMIT_SHA ./frontend
    - docker push registry.example.com/backend:$CI_COMMIT_SHA
    - docker push registry.example.com/frontend:$CI_COMMIT_SHA

deploy-staging:
  stage: deploy-staging
  only:
    - main
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - kubectl set image deployment/backend backend=registry.example.com/backend:$CI_COMMIT_SHA
    - kubectl rollout status deployment/backend --timeout=300s

deploy-production:
  stage: deploy-production
  only:
    - main
  when: manual  # Require manual approval
  environment:
    name: production
    url: https://example.com
  script:
    - kubectl set image deployment/backend backend=registry.example.com/backend:$CI_COMMIT_SHA
    - kubectl rollout status deployment/backend --timeout=300s
```

---

## Branching Strategy

### Git Flow (Common)

```
main          ──●──────────────●─────────────●─── (production releases)
               │              │             │
develop       ─┼──●───●───────┼──●───●──────┼─── (integration branch)
               │  │   │       │  │   │      │
feature/x     ─┴──●   │       │  │   │      │
                      │       │  │   │      │
feature/y     ────────┴───────┘  │   │      │
                                 │   │      │
hotfix/z      ───────────────────┴───┴──────┘
```

### Branch → Environment Mapping

| Branch | Deploys To | Trigger |
|--------|-----------|---------|
| `feature/*` | PR preview (optional) | Push |
| `develop` | Development/Staging | Push |
| `main` | Production | Manual approval |
| `hotfix/*` | Production (fast track) | Push after review |

---

## Image Tagging Strategy

### Good Tags

```bash
# Commit SHA - immutable, traceable
myapp:a1b2c3d

# Semantic version
myapp:1.2.3

# Branch + SHA for dev
myapp:develop-a1b2c3d

# Timestamp for debugging
myapp:2024-01-15-a1b2c3d
```

### Bad Tags

```bash
# Mutable - can't trace what's deployed
myapp:latest

# Too generic
myapp:new
myapp:v1
```

### Dockerfile Best Practices

```dockerfile
# Multi-stage build
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .

# Non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## GitOps Approach (Alternative)

Instead of `kubectl set image`, update manifests in Git:

```yaml
# ArgoCD / Flux pattern
1. Pipeline builds image → pushes to registry
2. Pipeline updates image tag in k8s manifest repo
3. GitOps tool detects change → syncs to cluster

Benefits:
- Git is single source of truth
- Easy rollback (revert commit)
- Audit trail
- Declarative state
```

---

## Key Points for Interview

### "Where would you have branch vs main deploy?"

> "Feature branches run tests but don't deploy. When merged to develop or main, we build Docker images tagged with the commit SHA. Develop deploys automatically to staging for testing. Main deploys to production after manual approval in the pipeline."

### "How do you tag images?"

> "I use commit SHAs as the primary tag - they're immutable and traceable. You can always find exactly what code is deployed. For releases, I add semantic version tags. I avoid 'latest' because it's mutable and you can't tell what's actually running."

### "What happens if deployment fails?"

> "The pipeline checks rollout status with a timeout. If pods fail health checks, the rollout stops and the job fails. We can rollback with `kubectl rollout undo` or re-run the pipeline with the previous commit. With GitOps, you just revert the manifest commit."

---

---

## Environment Management

### Environment Variables & Secrets in CI/CD

```yaml
# GitHub Actions - Using Secrets
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Links to environment with secrets

    steps:
    - name: Deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        API_KEY: ${{ secrets.API_KEY }}
      run: |
        # Secrets are masked in logs automatically
        ./deploy.sh

# Environment-specific config
- name: Set environment config
  run: |
    if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
      echo "ENVIRONMENT=production" >> $GITHUB_ENV
      echo "REPLICAS=3" >> $GITHUB_ENV
    else
      echo "ENVIRONMENT=staging" >> $GITHUB_ENV
      echo "REPLICAS=1" >> $GITHUB_ENV
    fi
```

### Secret Management Best Practices

| Approach | Use Case | Example |
|----------|----------|---------|
| CI/CD Secrets | Pipeline credentials | GitHub Secrets |
| External Secrets | Runtime secrets | AWS Secrets Manager |
| Sealed Secrets | GitOps workflows | Bitnami Sealed Secrets |
| Vault | Enterprise-grade | HashiCorp Vault |

---

## Testing in Pipelines

### Test Pyramid

```
           /\
          /  \
         / E2E \        Few, slow, expensive
        /──────\
       /  Integ \       Some integration tests
      /──────────\
     /    Unit    \     Many, fast, cheap
    /──────────────\
```

### Test Stages Example

```yaml
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_DB: test
        POSTGRES_PASSWORD: test
      ports:
        - 5432:5432

  steps:
  # Unit tests (fast, no dependencies)
  - name: Unit Tests
    run: pytest tests/unit/ -v --cov=src

  # Integration tests (with database)
  - name: Integration Tests
    env:
      DATABASE_URL: postgresql://postgres:test@localhost:5432/test
    run: pytest tests/integration/ -v

  # E2E tests (full system)
  - name: E2E Tests
    run: |
      docker-compose up -d
      npm run test:e2e
      docker-compose down
```

---

## Pipeline Optimization

### Caching Dependencies

```yaml
- name: Cache Python dependencies
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-

- name: Cache npm dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
```

### Parallel Jobs

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
    - run: ruff check .

  type-check:
    runs-on: ubuntu-latest
    steps:
    - run: mypy src/

  unit-test:
    runs-on: ubuntu-latest
    steps:
    - run: pytest tests/unit/

  # All must pass before build
  build:
    needs: [lint, type-check, unit-test]
    runs-on: ubuntu-latest
    steps:
    - run: docker build .
```

### Matrix Builds

```yaml
test:
  strategy:
    matrix:
      python-version: ['3.10', '3.11', '3.12']
      os: [ubuntu-latest, macos-latest]
  runs-on: ${{ matrix.os }}
  steps:
  - uses: actions/setup-python@v4
    with:
      python-version: ${{ matrix.python-version }}
  - run: pytest tests/
```

---

## Rollback Strategies

### Automated Rollback

```yaml
deploy:
  steps:
  - name: Deploy
    run: kubectl apply -f k8s/

  - name: Wait for rollout
    id: rollout
    run: |
      if ! kubectl rollout status deployment/backend --timeout=300s; then
        echo "::set-output name=failed::true"
      fi

  - name: Rollback on failure
    if: steps.rollout.outputs.failed == 'true'
    run: |
      kubectl rollout undo deployment/backend
      exit 1  # Mark job as failed
```

### Canary Deployments

```yaml
# Deploy to small percentage first
canary:
  steps:
  - name: Deploy canary (10%)
    run: |
      kubectl apply -f k8s/canary.yaml
      sleep 300  # Monitor for 5 minutes

  - name: Check canary metrics
    run: |
      ERROR_RATE=$(curl -s prometheus/api/v1/query?query=error_rate)
      if [ "$ERROR_RATE" -gt "0.01" ]; then
        kubectl delete -f k8s/canary.yaml
        exit 1
      fi

  - name: Full rollout
    run: kubectl apply -f k8s/production.yaml
```

---

## Monitoring Deployments

### Health Checks in Pipeline

```yaml
- name: Smoke test
  run: |
    for i in {1..30}; do
      if curl -sf https://api.example.com/health; then
        echo "Service is healthy"
        exit 0
      fi
      sleep 10
    done
    echo "Health check failed"
    exit 1

- name: Verify deployment
  run: |
    DEPLOYED_VERSION=$(curl -s https://api.example.com/version)
    if [ "$DEPLOYED_VERSION" != "${{ github.sha }}" ]; then
      echo "Version mismatch!"
      exit 1
    fi
```

### Deployment Notifications

```yaml
- name: Notify Slack on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployed ${{ github.sha }} to production"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployment failed for ${{ github.sha }}"
      }
```

---

## Checkpoint Questions

Be ready to explain:

- [ ] **What's the difference between CI and CD?**
  > CI (Continuous Integration): Automatically build, lint, test on every commit. Catch issues early. CD (Continuous Deployment): Automatically deploy to environments after CI passes. Progressive rollout with manual gates for production.

- [ ] **Why use commit SHA for image tags?**
  > Immutable and traceable. You can always find exactly what code is deployed. "latest" is mutable—you can't tell what's running. SHA enables easy rollback and debugging.

- [ ] **How do you handle production deployments?**
  > Manual approval gates, gradual rollout (canary or blue-green), health checks, automated rollback on failure. Monitor metrics during deployment. Have runbook for manual intervention.

- [ ] **What is GitOps and why would you use it?**
  > Git is single source of truth for infrastructure state. Tools like ArgoCD sync cluster state to Git. Benefits: audit trail, easy rollback (revert commit), declarative, self-healing.

- [ ] **How do you handle secrets in pipelines?**
  > Store in CI/CD secret storage (GitHub Secrets), never in code. Use environment-specific secrets. For runtime, use external secrets managers. Rotate regularly. Audit access.
