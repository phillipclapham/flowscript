# Golden Example: Design Pattern

**Pattern:** Design RFC with evolution, lifecycle tracking, and completion states
**Use Cases:** RFC documentation, project planning, implementation tracking, continuity across sessions
**Complexity:** High (40-45 lines, 3 alternatives, temporal sequences, multiple states, evolution over time)
**Key Features:** `?`, `||`, `->`, `><[axis]`, `[decided]`, `[blocked]`, `✓`, `=>` temporal sequences

---

## Purpose

The design pattern captures complete RFC lifecycle from decision through implementation to deployment. It demonstrates FlowScript's ability to:
- Document multiple alternatives with explicit tradeoffs
- Track decisions with rationale (`[decided]` state)
- Show temporal progression through implementation (`=>` operators)
- Mark completion and blockers (`✓`, `[blocked]`, `[completed]`)
- Evolve over time as project progresses through phases

This pattern answers: **"What did we decide, why, what's the status, and what's blocking us?"**

---

## When to Use

Use the design pattern when:
- **Writing RFCs** that require tracking from decision to deployment
- **Project planning** with multiple phases and dependencies
- **Tracking implementation progress** across sessions/sprints
- **Documenting evolution** of decisions over time with state changes

**Don't use** for:
- Simple one-time decisions (use decision pattern instead)
- Research without implementation plans
- Completed projects without ongoing changes
- Debug/incident response (use debug pattern instead)

---

## FlowScript Breakdown

### Structure

```flowscript
? [question describing the decision]

|| [Alternative 1]
  -> [implication 1]
  -> [tradeoff] ><[axis] [consequence]

|| [Alternative 2]
  -> [implication 1]
  -> [tradeoff] ><[axis] [consequence]

|| [Alternative 3 - could be hybrid]
  -> [combined approach details]
  -> [tradeoff] ><[axis] [consequence]

* [decided(rationale: "...", on: "YYYY-MM-DD")] [chosen alternative]

  action: [implementation task 1]
  action: [implementation task 2]

  ✓ [completed(on: "YYYY-MM-DD")] [completed task description]
  ✓ [completed(on: "YYYY-MM-DD")] [another completed task]

  [blocked(reason: "...", since: "YYYY-MM-DD")]
    action: [blocked task]

thought: [insight or consideration discovered during implementation]
  -> [implication]
  action: [follow-up task]

=> [next phase temporally]
  => [sub-phase]
    -> [metric/result] ✓
  => [deployment phase]
```

### Components Explained

**Question (`?`)**: Frames the design decision
- Example: `? caching strategy for read-heavy API endpoints`

**Alternatives (`||`)**: Each option being considered
- Can include "hybrid" alternatives that combine approaches
- Show implications and tradeoffs for each
- Example: `|| hybrid CDN + Redis architecture`

**Tension Markers (`><[axis]`)**: Articulate explicit tradeoffs
- Multiple axes show competing constraints
- Example: `><[performance vs freshness]`, `><[cost vs control]`

**Decision Marker (`[decided]`)**: Documents the final choice
- **MUST include rationale and date**
- Links to one of the alternatives
- Example: `[decided(rationale: "hybrid approach: CDN for static, Redis for dynamic", on: "2025-10-14")]`

**Action Items (`action:`)**: Implementation tasks
- Concrete next steps
- Can be nested under blocks
- Example: `action: configure CloudFront for /static/* routes`

**Completion Markers (`✓`)**: Track finished tasks
- Can use standalone `✓` or `[completed(on: "...")]` state
- Shows progress over time
- Example: `✓ [completed(on: "2025-10-15")] CloudFront configuration deployed`

**Blocked State (`[blocked]`)**: Document blockers
- **MUST include reason and since date**
- Shows what's preventing progress
- Example: `[blocked(reason: "Datadog trial expired, need license approval", since: "2025-10-16")]`

**Temporal Operators (`=>`)**: Show timeline progression
- **Distinct from `->` (causal)** - this is time-based sequence
- Chain implementation phases
- Example: `=> performance testing` `=> deploy to production`

---

## Example: Caching Strategy RFC

[See [design.fs](design.fs) for the complete example]

**Scenario**: Choosing caching strategy, implementing it, testing, and deploying with state tracking over multiple days.

**Key Insights**:
1. **Multiple alternatives**: 3 options including hybrid approach
2. **Evolution over time**: Decision (Oct 14) → Implementation (Oct 15-16) → Testing → Deployment
3. **State tracking**: Completed tasks, blocked monitoring, new insights discovered
4. **Temporal sequence**: Shows testing THEN deployment (not just causation)
5. **Real-world blockers**: License approval needed, documented explicitly

---

## Compiled IR Structure

When parsed, `design.fs` generates:
- **41 nodes** (question, 3 alternatives, decision, actions, completions, thoughts, test results)
- **22 relationships**:
  - 3 alternative relationships (question → each `||`)
  - 14 causes relationships (from `->` operators)
  - 3 tension relationships (from `><[axis]` markers)
  - 2 temporal relationships (from `=>` operators showing timeline)
- **2 states in states array**:
  - 1 decided state (with rationale and date)
  - 1 blocked state (with reason and since date)
- **2 completion nodes** (from `✓` markers)

The IR preserves complete lifecycle with temporal ordering and state evolution.

---

## Query Operations

Once compiled to IR, the design graph enables lifecycle tracking:

### 1. `alternatives(question_id)` - View all options considered

```javascript
alternatives("caching_strategy_question")
// Returns:
// {
//   options: [
//     { content: "client-side caching (browser cache headers)" },
//     { content: "Redis cache layer" },
//     { content: "hybrid CDN + Redis architecture" }
//   ],
//   chosen: { content: "hybrid CDN + Redis architecture" }
// }
```

### 2. `blocked(since)` - Track implementation blockers

```javascript
blocked("2025-10-16")
// Returns:
// [
//   {
//     action: "add cache hit/miss monitoring to Datadog",
//     reason: "Datadog trial expired, need license approval",
//     since: "2025-10-16",
//     blocks_completion: true
//   }
// ]
```

### 3. `completed(since)` - Track progress over time

```javascript
completed("2025-10-15")
// Returns:
// [
//   {
//     task: "CloudFront configuration deployed",
//     completed_on: "2025-10-15"
//   },
//   {
//     task: "Redis cache layer implemented",
//     completed_on: "2025-10-16"
//   },
//   {
//     metric: "95th percentile latency: 45ms (target: <50ms)",
//     status: "passed"
//   },
//   {
//     metric: "cache hit rate: 87% (target: >80%)",
//     status: "passed"
//   }
// ]
```

### 4. `timeline(root_id)` - Reconstruct temporal sequence

```javascript
timeline("caching_decision")
// Returns:
// [
//   { date: "2025-10-14", event: "decision made" },
//   { date: "2025-10-15", event: "CloudFront deployed" },
//   { date: "2025-10-16", event: "Redis implemented" },
//   { date: "2025-10-16", event: "monitoring blocked (license needed)" },
//   { date: "later", event: "performance testing started" },
//   { date: "later", event: "load testing (1000 RPS)" },
//   { date: "later", event: "deployment to production" }
// ]
```

---

## Teaching Value

This pattern demonstrates:

**1. Complete Lifecycle Documentation**: Decision → Implementation → Validation → Deployment
- Captures "why we chose X" (rationale)
- Tracks "what we did" (actions)
- Shows "what's done" (completions)
- Documents "what's blocked" (blockers with reasons)

**2. Temporal vs Causal Distinction**: `=>` vs `->`
- `->` = causal implication (A causes/implies B)
- `=>` = temporal sequence (A happens THEN B happens)
- Example: Decision `=>` Testing `=>` Deploy (timeline, not causation)

**3. State Evolution Over Time**: Real-world progression
- Documents project lifecycle as it happens
- Can update across sessions/days
- Preserves decision rationale for future reference
- Blockers documented with reasons (no mystery about why stopped)

**4. Multiple State Types**: Rich status tracking
- `[decided]` = choice made with rationale
- `[completed]` = task finished with date
- `[blocked]` = progress stopped with reason
- Enables "what's the current status?" queries

---

## Temporal Sequence Explanation

**Critical distinction**: Temporal (`=>`) vs Causal (`->`)

```flowscript
# Causal relationship (implication)
Redis cache layer
  -> consistent across clients       # Redis CAUSES/ENABLES consistency

# Temporal relationship (timeline)
performance testing on staging
  => load testing with k6            # Testing happens, THEN load testing
  => deploy to production            # After load testing, THEN deploy
```

**Why this matters:**
- Causal: "A makes B possible" or "A implies B"
- Temporal: "Do A, wait for results, then do B"
- Queries can reconstruct project timelines using temporal edges
- Enables "what's next?" planning based on temporal sequence

---

## Variations

**Simple RFC** (decision + actions, ~20 lines):
- 2-3 alternatives
- Decision with actions
- No temporal sequence yet

**Complex Multi-Phase** (6+ states, ~60 lines):
- Multiple phases with temporal sequences
- Many completed/blocked states
- Evolution over weeks/months
- Performance metrics and validations

**Living Document** (updated over time):
- Start with alternatives + decision
- Add completions as work progresses
- Document blockers as discovered
- Evolve across multiple sessions

---

## Integration with Other Patterns

**After Decision Pattern**: RFCs often follow architectural decisions
**Before Deployment**: Design documents what will be built
**With Research Pattern**: Research feeds into design alternatives
**Feeds Debug Pattern**: If design has issues, use debug to trace causes

---

## Validation

To verify your design pattern works:

```bash
# Parse to IR
./bin/flowscript parse design.fs -o design.json

# Lint for semantic errors
./bin/flowscript lint design.fs

# Validate IR structure
./bin/flowscript validate design.json
```

**Expected**:
- ✅ Parse succeeds
- ✅ Lint passes (0 errors, 0 warnings)
- ✅ Validate passes
- ✅ Relationships include: alternative, causes, tension, temporal types
- ✅ States array has: decided, blocked (and potentially completed)
- ✅ Completion nodes present (✓ markers)

---

## Next Steps

1. **Try it yourself**: Create an RFC for a current project
2. **Track progress**: Update with completions and blockers as work progresses
3. **Use temporal sequences**: Document implementation timeline with `=>`
4. **Study other patterns**: See `decision.fs`, `debug.fs`, `research.fs`

---

**Last Updated**: 2025-10-22
**Session**: 4a-continued-5g
**Status**: Complete golden example with full IR validation (Pattern 4)
