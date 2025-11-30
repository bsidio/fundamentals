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
