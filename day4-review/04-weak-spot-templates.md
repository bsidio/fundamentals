# Day 4 - Block 2: Weak Spot Templates (45-60 min)

Use these templates to write clean answers for questions where you rambled or froze.

---

## Template Structure

For each weak spot:
1. **Write a 3-5 sentence answer**
2. **Practice saying it 2-3 times**
3. **Time yourself (aim for 30-60 seconds)**

---

## Common Weak Spots

### "Explain [technical concept] simply"

**Template:**
> "[Concept] is [one sentence definition]. It solves [specific problem]. For example, [concrete example]. The key thing to remember is [core insight]."

**Example - Explain an index:**
> "An index is a separate data structure that speeds up database lookups. Without it, the database has to scan every row - O(n). With an index, it can find rows in O(log n), like looking something up in a book's index instead of reading every page. The key thing is you index columns you frequently filter or join on."

---

### "Walk me through how X works"

**Template:**
> "At a high level, [X] works in [N] steps. First, [step 1]. Then, [step 2]. Finally, [step 3]. The key decision point is [where complexity lives]."

**Example - How does a rolling update work?**
> "A rolling update works in three phases. First, Kubernetes creates a new pod with the updated image. Once that pod passes health checks, it terminates one old pod. It repeats this until all pods are updated. The key thing is it maintains availability throughout - there's always enough healthy pods to serve traffic."

---

### "What would you do if [scenario]?"

**Template:**
> "I'd start by [first diagnostic step]. That would tell me [what information]. Based on that, I'd either [option A] if [condition], or [option B] if [different condition]. The goal is [underlying objective]."

**Example - What if the API is slow?**
> "I'd start by checking where time is spent - is it the database, network, or application code? I'd look at slow query logs and APM traces. If it's database queries, I'd check for missing indexes or N+1 problems. If it's application code, I'd profile to find hot spots. The goal is to find the actual bottleneck before optimizing."

---

### "Why did you choose X over Y?"

**Template:**
> "I chose [X] because [primary reason relevant to our use case]. [Y] is good for [different use case], but we needed [specific capability]. The trade-off is [what we gave up], which was acceptable because [why it's ok]."

**Example - Why PostgreSQL over MongoDB?**
> "I chose PostgreSQL because our data has clear relationships - experiments have runs, runs have metrics. We also need complex queries for aggregations and joins. MongoDB would be good if we had flexible schemas or nested documents, but our schema is stable. The trade-off is less flexibility, but that's fine because our data model is well-defined."

---

### "How would you scale X?"

**Template:**
> "Scaling depends on where the bottleneck is. For [type A load], I'd [solution A]. For [type B load], I'd [solution B]. The first thing I'd do is [measurement step] to identify the actual constraint."

**Example - How would you scale the experiment tracker?**
> "It depends on where the bottleneck is. For read-heavy load like dashboards, I'd add Redis caching and database read replicas. For write-heavy load like metrics logging, I'd batch through a message queue. The first thing I'd do is look at metrics - response times, database query times, cache hit rates - to find the actual constraint before optimizing."

---

## Your Weak Spot Worksheet

### Weak Spot 1: _______________________

**Question I struggled with:**

**My 3-5 sentence answer:**

**Practice count:** [ ] 1 [ ] 2 [ ] 3

---

### Weak Spot 2: _______________________

**Question I struggled with:**

**My 3-5 sentence answer:**

**Practice count:** [ ] 1 [ ] 2 [ ] 3

---

### Weak Spot 3: _______________________

**Question I struggled with:**

**My 3-5 sentence answer:**

**Practice count:** [ ] 1 [ ] 2 [ ] 3

---

### Weak Spot 4: _______________________

**Question I struggled with:**

**My 3-5 sentence answer:**

**Practice count:** [ ] 1 [ ] 2 [ ] 3

---

### Weak Spot 5: _______________________

**Question I struggled with:**

**My 3-5 sentence answer:**

**Practice count:** [ ] 1 [ ] 2 [ ] 3

---

## Quick Fixes for Common Mistakes

### Rambling
**Problem:** Answer goes on for 3+ minutes
**Fix:** State conclusion first, then support with 2-3 points max

### Too vague
**Problem:** "It depends" without specifics
**Fix:** Give concrete example, then generalize

### Too detailed
**Problem:** Explaining implementation details nobody asked for
**Fix:** Start high-level, offer to go deeper: "Do you want me to elaborate on any part?"

### Freezing
**Problem:** Mind goes blank
**Fix:** Buy time with: "Let me think about that for a moment..." Then start with what you DO know.

### Not answering the question
**Problem:** Talking about related but different topic
**Fix:** Repeat the question in your answer: "You asked about X, so..."

---

## Confidence Boosters

### Before each answer:
- Take a breath
- Organize your thoughts (it's OK to pause)
- Start with a high-level summary

### If you don't know:
> "I haven't worked with that specifically, but based on [related experience], I'd approach it by..."

### If you made a mistake:
> "Actually, let me correct that - [correct answer]."

### If you're unsure:
> "I think [answer], though I'd want to verify [uncertain part] before implementing."

---

## Additional Weak Spot Templates

### "How do you handle errors/failures?"

**Template:**
> "I think about errors in three layers: [prevention], [detection], and [recovery]. For prevention, [how you avoid errors]. For detection, [how you catch them early]. For recovery, [how you handle gracefully]. The key is [underlying principle]."

**Example - How do you handle API errors?**
> "I handle API errors in three layers. For prevention, I validate inputs with Pydantic schemas before processing. For detection, I use structured logging with request IDs so I can trace failures across services. For recovery, I return meaningful error codes and messages - never expose stack traces to users. The key is making errors debuggable for developers while being helpful for users."

---

### "What's the difference between X and Y?"

**Template:**
> "[X] is about [core purpose of X]. [Y] is about [core purpose of Y]. The main difference is [key distinction]. You'd choose [X] when [use case], and [Y] when [different use case]."

**Example - What's the difference between authentication and authorization?**
> "Authentication is about identity - proving who you are. Authorization is about permissions - what you're allowed to do. The main difference is authentication happens first (login), then authorization happens on each request (access control). You need both: authenticate to verify the user, then authorize to check if they can access specific resources."

---

### "Tell me about a time when..."

**Template (STAR Method):**
> "In [situation/context], I needed to [task/challenge]. I [action you took] by [specific steps]. The result was [outcome with metrics if possible]. I learned [key takeaway]."

**Example - Tell me about a time you dealt with a production issue:**
> "Our API started timing out during peak hours. I needed to identify the bottleneck quickly because users were affected. I added query timing logs and found that one dashboard query was taking 5+ seconds. I added a composite index on experiment_id and created_at, which brought it down to 50ms. I learned the importance of monitoring query performance before problems hit production."

---

### "How would you design X?"

**Template:**
> "I'd start with the requirements: [2-3 key requirements]. For the architecture, I'd use [high-level components]. The data model would have [key entities]. For [critical concern like scale/security], I'd [specific approach]. The trade-off is [what you sacrifice], but [why it's acceptable]."

**Example - How would you design a notification system?**
> "I'd start with requirements: users need real-time alerts, multiple channels (email, SMS, push), and delivery guarantees. For architecture, I'd use a message queue for async delivery with channel-specific workers. The data model has notification templates, user preferences, and delivery logs. For scale, workers are stateless and horizontally scalable. The trade-off is eventual consistency - notifications might be slightly delayed but never lost."

---

### "What are the trade-offs of X?"

**Template:**
> "[X] gives you [benefits]. The costs are [drawbacks]. It's a good fit when [ideal use case]. It's not ideal when [poor fit scenario]. The key decision factor is [how to evaluate]."

**Example - What are the trade-offs of microservices?**
> "Microservices give you independent deployment, technology flexibility, and team autonomy. The costs are operational complexity, network latency, and distributed system challenges like data consistency. It's a good fit when you have multiple teams working on different domains. It's not ideal for small teams or simple applications. The key factor is whether the organizational benefits outweigh the technical complexity."

---

### "How do you test X?"

**Template:**
> "I'd test [X] at multiple levels. Unit tests for [isolated logic]. Integration tests for [component interactions]. E2E tests for [critical user flows]. I'd prioritize [most important tests] because [reasoning]."

**Example - How would you test the experiment tracking API?**
> "I'd test at three levels. Unit tests for business logic like metric aggregation calculations. Integration tests for database operations - creating experiments, logging metrics, querying results. E2E tests for the critical flow: create experiment, log some metrics, verify they appear in the dashboard. I'd prioritize integration tests because the API is mostly data operations where the database interaction is the complex part."

---

### "What happens when you type [URL] in a browser?"

**Template:**
> "It's a [N]-step process. First, [DNS/network step]. Then, [connection step]. Next, [request/response step]. Finally, [rendering step]. At each step, there are optimizations like [examples]."

**Example - Full answer:**
> "It's a multi-step process. First, DNS resolution translates the domain to an IP address - this might be cached locally, in the router, or require a recursive DNS lookup. Then, TCP connection with a 3-way handshake, plus TLS handshake for HTTPS. Next, the HTTP request goes to the server, which processes it and returns HTML. Finally, the browser parses HTML, fetches CSS/JS resources, builds the DOM, and renders the page. Optimizations include DNS prefetching, connection keep-alive, HTTP/2 multiplexing, and caching at every layer."

---

### "How do you debug [problem]?"

**Template:**
> "I'd follow a systematic approach: [gather information], [form hypothesis], [test hypothesis], [iterate or fix]. My first step would be [specific action]. I'd use [specific tools] to [specific insight]."

**Example - How do you debug a memory leak?**
> "I'd follow a systematic approach. First, gather information: confirm the leak by monitoring memory over time. Then form a hypothesis: check for common causes like growing collections, unclosed connections, or circular references. Test by adding logging around suspects or using a heap profiler. My first step would be to take heap snapshots at different times and compare what's growing. In Node.js I'd use the built-in inspector; in Python, memory_profiler."

---

### "Explain your architecture"

**Template:**
> "The system has [N] main components. [Component 1] handles [responsibility]. [Component 2] handles [responsibility]. They communicate via [mechanism]. Data flows from [source] to [destination]. The key design decisions were [2-3 decisions] because [reasoning]."

**Example - For the ML Experiment Tracker:**
> "The system has three main components. The FastAPI backend handles API requests and business logic. PostgreSQL stores experiments, runs, and metrics with proper relationships. The React frontend displays dashboards and handles user interaction. They communicate via REST API with JSON payloads. Data flows from training scripts to the API, into the database, and out to the dashboard. Key decisions: REST over GraphQL for simplicity, PostgreSQL for complex aggregation queries, separate metrics table for flexible time-series queries."

---

### "How would you improve X?"

**Template:**
> "Looking at [X], I see opportunities for improvement in [area 1], [area 2], and [area 3]. The highest-impact change would be [specific change] because [reasoning]. I'd measure success by [metric]. The risk is [potential downside] which I'd mitigate by [approach]."

**Example - How would you improve the experiment tracker?**
> "I see opportunities in three areas: performance, usability, and reliability. Highest-impact would be adding Redis caching for dashboard aggregations - those queries scan lots of metrics and are repeated frequently. I'd measure success by p95 dashboard load time, aiming for under 500ms. The risk is cache invalidation complexity, which I'd mitigate by using short TTLs (60s) since slightly stale data is acceptable for dashboards."

---

## Domain-Specific Weak Spots

### Python Questions

**"Explain the GIL":**
> "The GIL is Python's Global Interpreter Lock - it allows only one thread to execute Python bytecode at a time. This means CPU-bound multithreading doesn't speed up Python. For CPU parallelism, use multiprocessing. For I/O bound tasks like network calls, threading still works fine because the GIL is released during I/O. Libraries like NumPy also release the GIL during calculations."

**"List vs tuple vs set":**
> "Lists are mutable ordered sequences - use when you need to modify items. Tuples are immutable ordered sequences - use for fixed data, as dict keys, or when immutability is important. Sets are mutable unordered unique items - use for membership testing and deduplication. Lookup is O(n) for lists, O(1) for sets."

**"Decorators explained":**
> "A decorator is a function that takes a function and returns a modified function. It's syntactic sugar for wrapping functions. Common uses: logging, timing, authentication checks, retry logic. The @decorator syntax is equivalent to func = decorator(func). You can stack decorators - they apply bottom to top."

---

### React Questions

**"Virtual DOM explained":**
> "The Virtual DOM is React's in-memory representation of the actual DOM. When state changes, React creates a new Virtual DOM tree, diffs it against the previous one, and only updates the actual DOM elements that changed. This batching and minimization makes updates faster than direct DOM manipulation."

**"useEffect vs useLayoutEffect":**
> "Both run after render, but useEffect runs asynchronously after paint - good for data fetching, subscriptions. useLayoutEffect runs synchronously before paint - use for DOM measurements or animations where you need to prevent visual flicker. Prefer useEffect unless you're seeing visual glitches."

**"Keys in React":**
> "Keys help React identify which items changed, were added, or removed in lists. Without keys, React re-renders everything. With keys, it only updates what's different. Keys should be stable, unique identifiers - not array indexes (unless the list is static). Usually use item IDs from your data."

---

### Database Questions

**"ACID explained":**
> "ACID guarantees for database transactions. Atomicity: all operations succeed or all fail. Consistency: transactions move the database from one valid state to another. Isolation: concurrent transactions don't interfere. Durability: committed transactions survive crashes. PostgreSQL provides all four; some NoSQL databases trade these for performance."

**"When to use an index":**
> "Create indexes on columns you frequently filter (WHERE), join (ON), or order by (ORDER BY). Don't index everything - indexes slow down writes and use storage. Composite indexes help queries that filter on multiple columns. Use EXPLAIN to check if queries use indexes. Index foreign keys for faster joins."

**"N+1 query problem":**
> "N+1 happens when you fetch a list (1 query) then loop through and fetch related data for each item (N queries). Example: fetch 100 experiments (1 query), then fetch runs for each (100 queries). Fix with eager loading/JOINs - get everything in one or two queries. ORMs have features like SQLAlchemy's joinedload."

---

### Kubernetes Questions

**"Pod lifecycle":**
> "Pods go through phases: Pending (scheduled but not running), Running (at least one container running), Succeeded (all containers terminated successfully), Failed (all containers terminated, at least one failed), Unknown (state cannot be determined). Health probes (liveness, readiness) affect when pods receive traffic and when they're restarted."

**"Service types":**
> "ClusterIP: internal-only, accessible within cluster. NodePort: exposes on each node's IP at a static port. LoadBalancer: provisions external load balancer (cloud provider). Ingress: HTTP routing rules, SSL termination, name-based virtual hosting. Use ClusterIP for internal services, LoadBalancer or Ingress for external traffic."

**"ConfigMap vs Secret":**
> "Both inject configuration into pods. ConfigMaps for non-sensitive data like environment variables, config files. Secrets for sensitive data like passwords, API keys - stored base64 encoded, can be encrypted at rest. Access via environment variables or mounted files. Don't commit Secrets to git."

---

### System Design Questions

**"CAP theorem":**
> "In a distributed system, you can only guarantee two of three: Consistency (all nodes see same data), Availability (every request gets a response), Partition tolerance (system works despite network failures). Since networks fail, you really choose between CP (consistent but may be unavailable) or AP (available but may be inconsistent). PostgreSQL is CP, Cassandra is AP."

**"Load balancing strategies":**
> "Round-robin: requests go to servers in order - simple but ignores server load. Least connections: sends to server with fewest active connections - better for varying request times. IP hash: same client always goes to same server - good for session affinity. Health checks: removes unhealthy servers from rotation."

**"Caching strategies":**
> "Cache-aside: application checks cache, falls back to database, updates cache. Write-through: write to cache and database together. Write-behind: write to cache, async write to database. TTL-based: cache expires after time period. Invalidation: explicitly remove stale entries. Choose based on consistency requirements and read/write patterns."

---

## Final Preparation Checklist

### Weak Spot Identification
- [ ] Identified 3-5 weak spots from mock interview
- [ ] Written clean answers using templates
- [ ] Practiced each answer out loud 2-3 times
- [ ] Timed answers (30-60 seconds each)

### Project Readiness
- [ ] Can explain project in under 2 minutes
- [ ] Can discuss each technology choice with reasoning
- [ ] Can draw the architecture on a whiteboard
- [ ] Have specific metrics/numbers ready

### Interview Logistics
- [ ] Have questions prepared for them
- [ ] Researched the company's tech stack
- [ ] Know who you're interviewing with
- [ ] Prepared environment (camera, mic, quiet space)

### Mental Preparation
- [ ] Got enough sleep the night before
- [ ] Know where you tend to ramble
- [ ] Have "buying time" phrases ready
- [ ] Practiced saying "I don't know, but..."
