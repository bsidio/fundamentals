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

## Final Preparation Checklist

- [ ] Identified 3-5 weak spots from mock interview
- [ ] Written clean answers using templates
- [ ] Practiced each answer out loud 2-3 times
- [ ] Timed answers (30-60 seconds each)
- [ ] Can explain project in under 2 minutes
- [ ] Have questions prepared for them
