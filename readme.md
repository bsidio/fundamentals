~8 hours for Days 1–3

~4 hours for Day 4 (half day)

Goal: be able to clearly talk through and partially demo a tiny “experiment tracking” system (even if it’s not fully finished).

We’ll keep everything centered around one mini-project so your prep feels coherent:

🧪 Mini-project theme: “Simple ML Experiment Tracker”
Backend in Python (Flask/FastAPI), DB schema, small React dashboard, deployed mentally to K8s.

Day 1 – Python + Backend + Data Modeling (Full Day)
Morning (3–4h): Python & web backend fundamentals

Goals

Refresh Python fundamentals as they relate to services/tools

Get a minimal API skeleton running

Do

Python warmup (60–90 min)

Practice:

List/dict/set operations, comprehensions

with context managers

try/except with clean error messages

Write a tiny script:

Reads JSON config for an “experiment” (name, params, seed)

Prints it in a nice table + validates required fields

Backend basics (Flask or FastAPI) (2–2.5h)

Create a minimal API project:

/health → returns {status: "ok"}

/experiments (GET/POST)

Add:

Simple validation

Proper status codes

Basic structured logging (log level, timestamp, endpoint)

End-of-block checkpoint (5–10 min)

Can you explain out loud:

What a REST API is?

Difference between GET vs POST?

How your framework routes a request to a handler?

Afternoon (3h): Relational DB design + infra basics

Goals

Be able to design the schema for experiment tracking

Comfort talking about indexes & queries

Do

Schema design (1.5–2h)

Design tables on paper or in a file:

experiments(id, name, owner, description, created_at, status)

runs(id, experiment_id, started_at, ended_at, status, seed)

metrics(id, run_id, name, step, value, timestamp)

For each table, decide:

Primary keys

Foreign keys

A couple of helpful indexes (e.g. on metrics(run_id, name)).

Write 4–5 SQL queries:

Runs for a given experiment

Latest run per experiment

Average of a metric for a run

Runs filtered by status and date

Integrate DB with API (1–1.5h)

Use any ORM you like (SQLAlchemy, Django ORM conceptually).

Implement:

POST /experiments → writes to DB

GET /experiments/{id} → joins runs to show summary

End-of-block checkpoint

Can you explain:

Why you chose relational DB here?

What an index is and how it speeds queries up?

Evening (1–2h): System design sketch

Goals

Have a high-level architecture in your head (and notes) you can present.

Do

Draw or write a simple architecture:

Frontend (React) → Backend API (Flask) → Postgres

Optional: Redis cache in front of DB for hot queries

Message broker (e.g. RabbitMQ/Kafka) for:

“job finished” → “update dashboard / send notification”

Jot down bullet points you can later say in interview:

How you’d scale reads/writes

Where you’d put caching

What goes into a message on the queue

Day 2 – React + Dashboards + UX & Security Basics
Morning (3–4h): React fundamentals

Goals

Be able to build a small dashboard-like UI

Have language to talk about state, props, and fetching data

Do

React warmup (1–1.5h)

Create a minimal app:

<RunList /> component that renders static fake data

Use props to pass in an array of runs

Practice:

useState, useEffect, simple derived values (useMemo if you like)

Data fetching (1.5–2h)

Replace fake data with real fetch:

Call your /experiments API

Show loading / error states

Add filters UI:

Text input filter by experiment name

Dropdown to filter by status (running/completed/failed)

End-of-block checkpoint

Can you explain:

Difference between props vs state?

How you’d organize components in a larger app?

Afternoon (3h): Dashboards + security fundamentals

Goals

Build one “interview-worthy” screen

Be able to say sensible things about securing web apps

Do

Experiment details view (2h)

Build a page like:

List of runs for a selected experiment

Basic metric table or line chart (even with hardcoded data if needed)

Include:

Status badges (color by status)

Timestamps formatted nicely

Security pass (1h)

Add (even conceptually):

Simple API-key or token check on backend

CORS config on backend

Review and write short notes on:

SQL injection & how ORMs/prepared statements help

XSS basics & escaping user input

CSRF conceptually (forms, cookies, CSRF tokens)

Think about:

How you’d do RBAC for this tool (who can register models, who can only view)

End-of-block checkpoint

Be ready to answer:

“How would you secure an internal dashboard?”

“What common attacks are you aware of?”

Evening (1–2h): Story building

Goals

Turn what you’ve done into a cohesive story.

Do

Write a 1–2 minute project summary you can say out loud:

Problem: “ML engineers need to track experiments and metrics.”

Solution: “I designed a small system with X, Y, Z…”

Technical highlights:

Python + Flask API

Postgres schema and queries

React UI with filters and detail page

Practice saying it like you’re explaining to a hiring manager.

Day 3 – Kubernetes, CI/CD, Linux, HPC & ML Fundamentals
Morning (3–4h): Kubernetes & deployment thinking

Goals

Be able to talk through deploying your mini-app to K8s

Know core k8s concepts

Do

Kubernetes conceptual setup (2h)

Write (even if you don’t apply) sample manifests:

Deployment for your backend

Service exposing it internally

Deployment for your frontend (or imagine it as static files served by Nginx)

Add:

Resource requests/limits (CPU/memory)

Environment variables for DB connection

Think about:

How you’d handle secrets (K8s Secrets)

How you’d do rolling updates / rollbacks

CI/CD pipeline sketch (1.5–2h)

Draft a pipeline in pseudo-YAML:

Step 1: Run tests (pytest, frontend tests if any)

Step 2: Build Docker images (frontend + backend)

Step 3: Push to registry

Step 4: Apply k8s manifests (or GitOps flow)

Note where:

Branch vs main deploy

Tagging images with commit SHAs

End-of-block checkpoint

Be ready to answer:

“How would you deploy and update your service on Kubernetes?”

“What happens during a rolling update?”

Afternoon (3h): Linux + infra + HPC fundamentals

Goals

Be confident navigating Linux and explaining infra pieces

Have a basic HPC story

Do

Linux crash review (1–1.5h)

Commands to mentally rehearse:

ps, top/htop, df -h, du -sh *

journalctl -u your-service

ls -l, chmod, chown

Think through:

“Backend pod is failing — how do you debug?”

Logs, describe pod, check events, etc.

Infra components (1h)

Write short notes on:

Redis (cache): what you’d cache in your experiment tracker

Message broker: how training jobs could publish “run_completed” events

Prepare 1–2 examples:

“We use Redis to cache expensive dashboard queries.”

“We use a message broker so training jobs & UI are decoupled.”

HPC basics (30–45 min)

Understand and be ready to say:

Slurm-style workflow: submit job → scheduler → node

Resources: GPUs/CPUs/memory/time

Logs & artifacts on shared storage

Tie it back to your tool:

“My tool would periodically poll the scheduler or receive events from it.”

End-of-block checkpoint

Can you describe:

“How would your tool integrate with a GPU cluster?”

“How would you coordinate hardware resource usage?”

Evening (1–2h): ML fundamentals for this role

Goals

Be able to talk ML at a practical infra-supporting level.

Do

Review:

What is an experiment?

Train/val/test, epochs, batches

Common metrics: accuracy, loss, precision/recall, F1

Basic NN training loop:

forward → loss → backward → optimizer step

Think about:

What exactly your tool tracks:

Hyperparameters

Metrics over steps/epochs

Artifacts (models, checkpoints, plots, logs)

Code version (git SHA)

Know by name:

MLflow / Weights & Biases & what they broadly do

Day 4 – Half Day – Review, Mock Interview, Polish
Block 1 (2h): Focused review & flash notes

Goals

Lock in key talking points

Fill tiny gaps

Do

Cheat sheet creation (1–1.5h)

One page (or two) max with:

Core API design (endpoints & entities)

DB schema summary

Short bullet list: “How I’d deploy this on K8s”

Short bullet list: “Security measures”

Short bullet list: “HPC integration idea”

Keep this as your pre-interview refresh doc.

Quick topic flash review (30–45 min)

Python:

Exceptions, logging, async vs sync

React:

Props/state, data fetching, basic component tree

DB:

Indexes, joins, why relational for metadata

Block 2 (2h): Mock interview & refinement

Goals

Practice saying things out loud

Smooth out your explanations

Do

Self mock interview (~60–75 min)
Answer out loud (record yourself if possible) for questions like:

“Tell me about a tool you built for ML engineers.”

“Design an experiment tracking system.”

“How would you deploy it on Kubernetes?”

“How would you scale it if usage doubles?”

“How do you deal with security for internal tools?”

“What’s your experience with Linux in production environments?”

“How would your system interact with an HPC cluster?”

Refine weak spots (~45–60 min)

Any question where you rambled or froze:

Write a clean 3–5 sentence answer

Practice it once or twice more