# Day 2 - Evening: Building Your Project Story (1-2h)

## Goals
- Create a compelling 1-2 minute project summary
- Prepare technical highlights you can discuss in depth
- Practice articulating your work

---

## The STAR Framework

**S**ituation → **T**ask → **A**ction → **R**esult

### Template for Your Project Story

**Situation:**
"ML engineers at [company/team] needed to track experiments and metrics across multiple training runs. They were using spreadsheets/ad-hoc solutions that didn't scale."

**Task:**
"I was tasked with building a simple experiment tracking system that would allow engineers to log experiments, track runs, and visualize metrics."

**Action:**
"I designed and built a full-stack solution with:
- A Python/FastAPI backend with a PostgreSQL database
- A React dashboard for viewing and filtering experiments
- RESTful APIs for programmatic access from training scripts"

**Result:**
"The system allows engineers to easily compare runs, identify successful hyperparameters, and share results. It reduced experiment tracking overhead and improved reproducibility."

---

## Your 1-2 Minute Project Summary

### Version 1: Technical Focus

> "I built a simple ML experiment tracking system. The problem was that ML engineers needed a way to track experiments, runs, and metrics across training jobs.
>
> For the backend, I used Python with FastAPI and PostgreSQL. I designed a relational schema with experiments, runs, and metrics tables, with proper foreign keys and indexes for common query patterns like 'show me all runs for this experiment' or 'average accuracy across runs.'
>
> The frontend is a React dashboard that shows a filterable list of experiments with status badges and run counts. You can drill into an experiment to see individual runs, their status, duration, and basic metric charts.
>
> For security, I implemented API key authentication and proper CORS configuration. The system is designed to be deployed on Kubernetes with a deployment manifest, service, and config for connecting to the database."

### Version 2: Impact Focus

> "ML experiment tracking was a pain point - engineers were losing track of which hyperparameters worked best and couldn't easily compare runs. I built a system to solve this.
>
> The key insight was keeping it simple: a clean REST API that training scripts can call to log metrics, and a dashboard where you can visualize results. I focused on the core workflow - start experiment, create runs, log metrics at each step, mark complete.
>
> The technical stack is FastAPI, PostgreSQL, and React. I spent time on the schema design to make common queries fast - things like 'latest run per experiment' and 'average of a metric.' The dashboard shows real-time filtering and lets you compare runs side by side.
>
> It's designed for internal use so I kept authentication simple with API keys, but the architecture would support OAuth if needed."

---

## Technical Highlights to Discuss

### 1. Database Design

**Key Points:**
- Chose PostgreSQL for ACID compliance and complex queries
- Three-table schema: experiments → runs → metrics
- Indexes on foreign keys and common filter columns
- UUID primary keys for distributed systems compatibility

**Prepared Deep-Dive:**
> "I designed the schema with three main entities. The relationship is experiments have many runs, and runs have many metrics. I used UUIDs for primary keys since they're globally unique and work well in distributed systems.
>
> For indexes, I focused on the query patterns: filtering experiments by owner or status, joining runs to experiments, and querying metrics by run and name. The composite index on metrics(run_id, name) speeds up the common query 'give me all accuracy values for this run.'"

### 2. API Design

**Key Points:**
- RESTful endpoints with proper HTTP methods and status codes
- Pydantic models for request/response validation
- Structured logging with request context
- Error handling with meaningful messages

**Prepared Deep-Dive:**
> "The API follows REST conventions - GET for reads, POST for creates, PUT for updates. I use Pydantic for validation which gives you automatic request body parsing and helpful error messages.
>
> Each endpoint logs the operation with context - what's being accessed, who's accessing it, and the outcome. This is crucial for debugging in production. For errors, I return structured responses with error codes and messages, not just HTTP status."

### 3. React Architecture

**Key Points:**
- Component hierarchy with smart/dumb pattern
- Custom hooks for data fetching
- Client-side filtering with useMemo
- Loading, error, and empty states

**Prepared Deep-Dive:**
> "The frontend uses a simple component structure. I have a custom useData hook that handles fetch, loading, error, and refetch. Components like RunList receive data as props and just handle rendering.
>
> Filtering is done client-side with useMemo to avoid re-filtering on every render. For larger datasets, I'd move this to the server with query parameters. I made sure to handle all UI states - loading spinner, error with retry, and empty state with helpful messages."

### 4. Security Considerations

**Key Points:**
- API key authentication
- CORS whitelist for allowed origins
- ORM prevents SQL injection
- React escaping prevents XSS

**Prepared Deep-Dive:**
> "For an internal tool, I implemented API key authentication - simple but effective. The backend validates the key on every request and rejects with 401 if invalid.
>
> CORS is configured to only allow requests from our frontend domains. SQL injection isn't a concern because SQLAlchemy uses parameterized queries. XSS is handled by React's default escaping."

---

## Anticipated Questions & Answers

### "What would you do differently?"

> "A few things: First, I'd add WebSocket support for real-time updates instead of polling. Second, I'd implement proper pagination for large datasets. Third, I'd add end-to-end tests with Playwright for critical user flows."

### "How would you scale this?"

> "For reads, I'd add a Redis cache for dashboard aggregations and read replicas for the database. For writes, especially high-volume metrics, I'd use a message queue to batch inserts. Horizontally, the stateless API servers scale behind a load balancer."

### "What was the hardest part?"

> "Getting the schema right for the query patterns. I initially had metrics embedded in runs, but realized we needed to query metrics independently - things like 'show me accuracy over all runs.' Normalizing to a separate metrics table with proper indexes solved that."

### "Why these technology choices?"

> "FastAPI for the backend because it's fast, has great type support with Pydantic, and auto-generates OpenAPI docs. PostgreSQL because we have relational data with clear schemas and need ACID transactions. React because it's the industry standard and I'm most productive with it."

---

## Practice Checklist

- [ ] Can you explain the project in under 2 minutes?
- [ ] Can you draw the architecture on a whiteboard?
- [ ] Can you explain each technology choice with reasoning?
- [ ] Can you discuss one component in depth (DB, API, or UI)?
- [ ] Can you articulate trade-offs and what you'd improve?
- [ ] Can you answer "why" for any decision you made?

---

## Practice Exercise

Set a timer for 2 minutes and practice explaining your project out loud. Record yourself if possible. Listen for:

1. Clear problem statement
2. Your specific contribution
3. Technical details that show depth
4. Confidence without arrogance
5. No filler words or long pauses

Repeat until it feels natural.

---

## Additional Technical Deep Dives

### 5. Kubernetes Deployment Strategy

**Key Points:**
- Multi-container deployment with separate frontend/backend
- Resource requests/limits for cost efficiency
- Health checks for zero-downtime deployments
- Secrets management for database credentials

**Prepared Deep-Dive:**
> "For deployment, I designed Kubernetes manifests with separate deployments for frontend and backend. The backend deployment has resource limits - 256MB memory request with 512MB limit - and both liveness and readiness probes hitting /health.
>
> Database credentials are in K8s Secrets, injected as environment variables. For updates, I use rolling deployments with maxSurge=1 and maxUnavailable=0, so there's always full capacity. If the new pods fail health checks, the rollout stops automatically."

### 6. CI/CD Pipeline Design

**Key Points:**
- Automated testing on every PR
- Docker image builds with commit SHA tags
- GitOps deployment approach
- Rollback strategy

**Prepared Deep-Dive:**
> "The CI/CD pipeline has four stages. First, run tests - pytest for backend, Jest for frontend. Second, build Docker images tagged with the commit SHA for traceability. Third, push to our container registry. Fourth, update the Kubernetes manifests with the new image tag.
>
> We use GitOps - ArgoCD watches the manifest repo and syncs to the cluster. For rollbacks, we just revert the manifest commit and ArgoCD handles the rest. Image tags are immutable, so we can always trace back to exact code."

### 7. Monitoring and Observability

**Key Points:**
- Structured logging with request context
- Prometheus metrics for dashboards
- Error tracking with context
- Performance monitoring

**Prepared Deep-Dive:**
> "For observability, I implemented structured JSON logging with request IDs that flow through the entire request lifecycle. This makes it easy to trace issues across services.
>
> I'd add Prometheus metrics for key operations - request latency histograms, error rates, and business metrics like experiments created. These feed into Grafana dashboards. For errors, we'd integrate with something like Sentry to capture stack traces with context."

### 8. Performance Optimization

**Key Points:**
- Database query optimization with indexes
- Response caching for repeated reads
- Pagination for large datasets
- Frontend optimization with React.memo

**Prepared Deep-Dive:**
> "Performance optimization started with the database. I used EXPLAIN ANALYZE to identify slow queries and added appropriate indexes. The composite index on metrics(run_id, name) cut query time from 200ms to 5ms for the common 'get metrics for run' query.
>
> For the API, I cache aggregated stats in Redis with 60-second TTL since they're expensive to compute and don't need real-time accuracy. On the frontend, I use useMemo for filtered lists and React.memo for expensive components to prevent unnecessary re-renders."

---

## Behavioral Questions Tied to Your Project

### "Tell me about a technical decision you made and why"

> "When designing the metrics storage, I initially planned to store metrics as a JSON blob within the runs table. But I realized we'd need to query individual metrics - things like 'show me accuracy over all runs for this experiment.'
>
> I refactored to a normalized metrics table with proper indexes. The trade-off was more complex queries and slightly more storage, but we gained query flexibility and better performance for the dashboard aggregations. This is a case where I had to think about query patterns before committing to a schema."

### "Describe a time you had to learn something quickly"

> "When building this project, I hadn't used FastAPI before. I had a week to get the backend running. I focused on the essentials - routing, Pydantic models for validation, and async database operations.
>
> I read the official docs, built small test endpoints, and incrementally added complexity. Within a few days I was productive. The key was focusing on what I needed for this project rather than trying to learn everything. I also leveraged my Flask experience - many concepts transferred directly."

### "How do you handle disagreements about technical decisions?"

> "I focus on data and trade-offs rather than opinions. In this project, there was a question about whether to use REST or GraphQL. I outlined the trade-offs: GraphQL gives clients flexibility but adds complexity; REST is simpler and sufficient for our known query patterns.
>
> Since we had a small, controlled set of use cases and tight timeline, REST made more sense. I documented the decision and the reasoning so if requirements changed, we could revisit it. The key is making decisions reversible when possible and documenting why you made them."

---

## Questions to Ask Them

Having good questions shows engagement and helps you evaluate the role:

### About the Technical Environment
- "What does your deployment pipeline look like?"
- "How do you handle database migrations in production?"
- "What monitoring and alerting do you have in place?"
- "How do you approach technical debt?"

### About the Team and Role
- "What does a typical project look like for this role?"
- "How are technical decisions made on the team?"
- "What would success look like in the first 6 months?"
- "What's the biggest challenge the team is facing right now?"

### About ML/Platform Specifics
- "How do ML engineers currently track experiments?"
- "What's the scale of training jobs you're running?"
- "How do you manage GPU resources across teams?"
- "What's the relationship between platform team and ML researchers?"

---

## Red Flags to Avoid in Your Answers

### Don't:
- **Over-claim:** "I built the entire system myself" when you had a team
- **Be vague:** "It was a standard setup" without specifics
- **Dismiss complexity:** "It was pretty simple" - everything has challenges
- **Badmouth:** Never criticize previous employers or teammates
- **Be arrogant:** "Obviously I chose the best approach"

### Do:
- **Be specific:** Use numbers, metrics, concrete examples
- **Show growth:** "I learned X from this challenge"
- **Credit others:** "The team helped with..." or "A colleague suggested..."
- **Acknowledge trade-offs:** "The downside was... but we accepted it because..."
- **Show enthusiasm:** Genuine interest in the problem space

---

## Final Preparation Checklist

Before your interview:

- [ ] Practiced 2-minute project pitch 5+ times
- [ ] Can explain each technology choice with reasoning
- [ ] Have specific numbers/metrics where possible
- [ ] Prepared 3-4 questions to ask them
- [ ] Know what you'd do differently
- [ ] Can discuss one component in-depth (DB, API, or UI)
- [ ] Have behavioral examples ready (conflict, learning, failure)
- [ ] Reviewed the company's tech stack and product
