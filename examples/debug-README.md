# Pattern 2: Debug/Incident Triage (debug.fs)

**Purpose:** Root cause analysis and incident triage using reverse causation to trace effects back to their origins.

**Use this pattern when:**
- Debugging production incidents
- Writing post-mortems
- Tracing error chains backward from symptom to root cause
- Documenting investigative processes

---

## Key Features Demonstrated

### 1. Urgent Modifier (`!`)
Flags critical issues that need immediate attention:
```flowscript
! timeout errors in production API (500ms+ response times)
```

**Benefit:** Makes critical problems immediately visible in queries and visualization.

### 2. Reverse Causation (`<-`)
Traces effects back to their causes (backward reasoning):
```flowscript
! timeout errors in production API
  <- database connection pool exhausted
    <- connection.release() missing in error handlers
      <- copy-paste bug from legacy code
        <- no connection pooling tests in CI
```

**Semantic meaning:** `A <- B` means "A is caused by B" or "A derives from B"
**Reading direction:** Start with the observable symptom, then trace backward to root cause

**Difference from `->` (forward causation):**
- `bug -> crash` = Forward: "this bug causes a crash"
- `crash <- bug` = Backward: "this crash is caused by a bug"

Both are semantically equivalent, but `<-` emphasizes the investigative flow.

### 3. Blocked State (`[blocked]`)
Tracks impediments that prevent progress:
```flowscript
[blocked(reason: "need staging environment to validate fix", since: "2025-10-16")]
```

**Required fields:**
- `reason`: Why work is blocked
- `since`: When blocking started (ISO-8601 date)

### 4. Increment Modifier (`++`)
Highlights improvements or positive actions:
```flowscript
++ action: write integration tests for connection pooling
```

**Benefit:** Distinguishes improvement work from routine fixes.

### 5. Forward Causation with Insights (`->`)
Documents implications and systemic patterns:
```flowscript
thought: pattern detected across 3 controllers
  -> suggests systematic issue in codebase
  -> code review template should check resource cleanup
```

---

## Query Examples

### `why(node_id)` - Trace Root Cause
**Purpose:** Walk backward through `<-` relationships to find ultimate cause

**Example query:**
```javascript
why("timeout_errors")
// Returns causal chain:
// [
//   { depth: 4, content: "no connection pooling tests in CI" },      // root cause
//   { depth: 3, content: "copy-paste bug from legacy code" },
//   { depth: 2, content: "connection.release() missing" },
//   { depth: 1, content: "database connection pool exhausted" }
// ]
```

**Value:** Immediately identifies the root cause (deepest node in chain).

### `blocked()` - Find All Blockers
**Purpose:** List all nodes with `[blocked]` state

**Example query:**
```javascript
blocked()
// Returns:
// [
//   {
//     content: "...",
//     reason: "need staging environment to validate fix",
//     since: "2025-10-16",
//     days_blocked: 6
//   }
// ]
```

**Value:** Visibility into what's preventing progress.

### `urgent()` - Critical Issues
**Purpose:** Find all nodes with `!` modifier

**Example query:**
```javascript
urgent()
// Returns:
// [
//   {
//     content: "timeout errors in production API (500ms+ response times)",
//     modifiers: ["urgent"]
//   }
// ]
```

**Value:** Triage dashboard - what needs immediate attention.

---

## Teaching Value

### Backward vs Forward Reasoning
This pattern demonstrates the power of **backward causation** for debugging:

**Forward reasoning (prediction):**
```
Known: bug exists
Question: what will it cause?
Pattern: bug -> ?
```

**Backward reasoning (diagnosis):**
```
Known: system is broken
Question: what caused it?
Pattern: symptom <- ?
```

Debugging is naturally backward-reasoning: you observe the problem first, then trace to the cause.

### Causal Depth
The indentation shows **causal depth** - how many steps from symptom to root cause:
- Depth 0: Observable symptom (timeout errors)
- Depth 1: Proximate cause (pool exhausted)
- Depth 2: Implementation bug (missing release)
- Depth 3: Human error (copy-paste)
- Depth 4: Process gap (no tests) ← **root cause**

Fixing at depth 4 (add tests) prevents recurrence. Fixing at depth 2 (add release) only fixes this instance.

### Structured Post-Mortems
This pattern naturally creates a post-mortem structure:
1. **Symptom:** What broke (with urgency flag)
2. **Investigation:** Causal chain (reverse causation)
3. **Blockers:** What's preventing fixes
4. **Actions:** Remediation steps
5. **Lessons:** Systemic patterns discovered

---

## FlowScript Breakdown

**Line 1:** Symptom with urgent modifier
```flowscript
! timeout errors in production API (500ms+ response times)
```

**Lines 2-5:** Reverse causal chain (4 levels deep)
```flowscript
  <- database connection pool exhausted (max 20 connections)
    <- connection.release() missing in error handlers
      <- copy-paste bug from legacy user_controller.js
        <- no connection pooling tests in CI
```

**Line 7:** Blocked state (work impediment)
```flowscript
[blocked(reason: "need staging environment to validate fix", since: "2025-10-16")]
```

**Lines 9-12:** Action items (remediation)
```flowscript
action: add connection.release() to all error handlers
action: audit all controllers for resource leaks
action: add connection pool monitoring (Prometheus)
++ action: write integration tests for connection pooling
```
Note: Action nodes can be standalone (not required to have relationships).

**Lines 14-16:** Insight about systemic issue
```flowscript
thought: pattern detected across 3 controllers (user, order, payment)
  -> suggests systematic issue in codebase
  -> code review template should check resource cleanup
```

---

## Generated IR Structure

**Nodes:** 13 total
- 1 with `!` urgent modifier
- 1 with `++` increment modifier
- 5 with children arrays (hierarchical structure)

**Relationships:** 7 total
- 4 `derives_from` (reverse causation `<-`)
- 3 `causes` (forward implications `->`)

**States:** 1 blocked state

**Graph properties:**
- Causal depth: 4 (longest backward chain)
- Branches: 2 (thought node has 2 implications)

---

## When to Use This Pattern

**Good for:**
- Production incident analysis
- Bug triage and root cause analysis
- Post-mortems and retrospectives
- Debugging complex systems

**Not ideal for:**
- Forward planning (use Pattern 1: Decision)
- Exploratory research (use Pattern 3: Research)
- Design discussions (use Pattern 4: Design)

**Telltale signs you need this pattern:**
- Starting with "the system is broken, why?"
- Need to trace backward from effect to cause
- Incident response and debugging workflows

---

**Related patterns:**
- [Pattern 1: Decision](./decision-README.md) - Forward-looking architectural choices
- [Pattern 3: Research](./research-README.md) - Deep exploration with uncertainty
- [Pattern 4: Design](./design-README.md) - Design evolution over time
