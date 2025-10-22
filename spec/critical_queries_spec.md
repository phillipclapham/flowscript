# FlowScript Critical Queries Specification

**Version:** 1.0
**Status:** Complete
**Purpose:** Define core computational operations that prove FlowScript is a "computable substrate"

---

## Overview

This specification defines five critical queries that operate on FlowScript IR (Intermediate Representation) graphs. These queries demonstrate that FlowScript is not merely notation, but a **computable substrate** for cognitive partnership.

**What makes these queries "critical":**

1. **Foundational operations** - Core graph traversals needed for cognitive work
2. **Architecture proof** - Demonstrate FlowScript → IR compilation preserves semantic richness
3. **User value** - Each query solves real problems in human-AI collaboration
4. **Implementation guidance** - Clear specifications for Phase 6 continuity demo

Together, these five queries enable:
- **Memory navigation** - "Why did we decide X?"
- **Impact analysis** - "What happens if we change Y?"
- **Tradeoff mapping** - "What are all the tensions?"
- **Blocker tracking** - "What's blocking progress?"
- **Decision reconstruction** - "What alternatives did we consider?"

---

## Query 1: `why(nodeId)` - Causal Ancestry

### Purpose
Trace backward through causal relationships to understand why a node exists, what led to a decision, or what caused an error.

### Function Signature

```typescript
function why(
  nodeId: string,
  options?: {
    maxDepth?: number,      // Limit traversal depth (default: unlimited)
    includeCorrelations?: boolean,  // Include correlates relationships (default: false)
    format?: 'chain' | 'tree' | 'minimal'  // Output format (default: 'chain')
  }
): CausalAncestry
```

### Algorithm

```
1. Start at target node (nodeId)
2. Traverse all incoming relationships of type:
   - derives_from (<-)
   - Optionally: correlates (=)
3. For each parent node found:
   - Add to ancestry set
   - If maxDepth not reached, recursively traverse its parents
4. Build causal chain(s) from root causes to target
5. Return structured result based on format option
```

**Graph operations:**
- Reverse traversal (follow edges backward)
- Cycle detection (stop if revisiting node)
- Multiple paths (preserve all causal chains)
- Root identification (nodes with no incoming causal edges)

### Example FlowScript Input

```flowscript
! timeout errors in production API (500ms+ response times)
  <- database connection pool exhausted (max 20 connections)
    <- connection.release() missing in error handlers
      <- copy-paste bug from legacy user_controller.js
        <- no connection pooling tests in CI
```

### Example Output

**Format: 'chain' (default)**
```json
{
  "target": {
    "id": "sha256:urgent_1...",
    "content": "timeout errors in production API (500ms+ response times)"
  },
  "causal_chain": [
    {
      "depth": 4,
      "id": "sha256:cause_4...",
      "content": "no connection pooling tests in CI",
      "relationship_type": "derives_from"
    },
    {
      "depth": 3,
      "id": "sha256:cause_3...",
      "content": "copy-paste bug from legacy user_controller.js",
      "relationship_type": "derives_from"
    },
    {
      "depth": 2,
      "id": "sha256:cause_2...",
      "content": "connection.release() missing in error handlers",
      "relationship_type": "derives_from"
    },
    {
      "depth": 1,
      "id": "sha256:cause_1...",
      "content": "database connection pool exhausted (max 20 connections)",
      "relationship_type": "derives_from"
    }
  ],
  "root_cause": {
    "id": "sha256:cause_4...",
    "content": "no connection pooling tests in CI",
    "is_root": true
  },
  "metadata": {
    "total_ancestors": 4,
    "max_depth": 4,
    "has_multiple_paths": false
  }
}
```

**Format: 'minimal'**
```json
{
  "root_cause": "no connection pooling tests in CI",
  "chain": [
    "no connection pooling tests in CI",
    "copy-paste bug from legacy user_controller.js",
    "connection.release() missing in error handlers",
    "database connection pool exhausted",
    "timeout errors in production API"
  ]
}
```

### Edge Cases

**Multiple causal paths:**
```flowscript
slow page load
  <- large image assets
  <- unoptimized database queries
```
Result: Return both paths, indicate branching in metadata

**Causal cycle (should be caught by linter):**
```flowscript
A -> B -> C -> A
```
Result: Return error, reference linter violation

**No causal ancestors:**
```flowscript
thought: initial hypothesis (no incoming edges)
```
Result: Return target node as its own root cause

### Why This Query Matters

- **Debugging:** Trace errors back to root causes
- **Decision justification:** Reconstruct why a choice was made
- **Knowledge archaeology:** Understand historical context
- **Audit trail:** Verify reasoning chains for critical decisions

**Real-world value:**
"Our API is timing out. Run `why(timeout_errors)` and I immediately see the root cause is missing CI tests, not just a surface-level connection leak."

---

## Query 2: `what_if(nodeId)` - Impact Analysis

### Purpose
Trace forward through causal relationships to understand the consequences of a change, decision, or action.

### Function Signature

```typescript
function what_if(
  nodeId: string,
  options?: {
    maxDepth?: number,      // Limit traversal depth (default: unlimited)
    includeCorrelations?: boolean,  // Include correlates relationships (default: false)
    includeTemporalConsequences?: boolean,  // Follow temporal (=>) edges (default: true)
    format?: 'tree' | 'list' | 'summary'  // Output format (default: 'tree')
  }
): ImpactAnalysis
```

### Algorithm

```
1. Start at source node (nodeId)
2. Traverse all outgoing relationships of type:
   - causes (->)
   - temporal (=>) if includeTemporalConsequences
   - Optionally: correlates (=)
3. For each child node found:
   - Add to consequences set
   - Tag with relationship type
   - If maxDepth not reached, recursively traverse its children
4. Identify tensions (><) in descendant subgraph
5. Build impact tree from source to leaf nodes
6. Return structured result with impact assessment
```

**Graph operations:**
- Forward traversal (follow edges forward)
- Subgraph extraction (all reachable descendants)
- Tension detection (highlight tradeoffs in impact zone)
- Leaf identification (nodes with no outgoing causal edges)

### Example FlowScript Input

```flowscript
? adopt serverless architecture

|| traditional server deployment
  -> predictable costs
  -> manual scaling required

|| serverless functions (AWS Lambda)
  -> automatic scaling
  -> pay-per-invocation
  -> cold start latency ><[performance vs cost] reduced infrastructure overhead
  -> vendor lock-in risk
```

### Example Output

**Format: 'tree' (default)**
```json
{
  "source": {
    "id": "sha256:serverless_option...",
    "content": "serverless functions (AWS Lambda)"
  },
  "impact_tree": {
    "direct_consequences": [
      {
        "id": "sha256:auto_scale...",
        "content": "automatic scaling",
        "relationship": "causes",
        "depth": 1
      },
      {
        "id": "sha256:pay_per...",
        "content": "pay-per-invocation",
        "relationship": "causes",
        "depth": 1
      },
      {
        "id": "sha256:cold_start...",
        "content": "cold start latency",
        "relationship": "causes",
        "depth": 1,
        "has_tension": true
      },
      {
        "id": "sha256:vendor_lock...",
        "content": "vendor lock-in risk",
        "relationship": "causes",
        "depth": 1
      }
    ],
    "indirect_consequences": [
      {
        "id": "sha256:infra_overhead...",
        "content": "reduced infrastructure overhead",
        "relationship": "tension_target",
        "depth": 2,
        "tension_axis": "performance vs cost"
      }
    ]
  },
  "tensions_in_impact_zone": [
    {
      "axis": "performance vs cost",
      "source": {
        "id": "sha256:cold_start...",
        "content": "cold start latency"
      },
      "target": {
        "id": "sha256:infra_overhead...",
        "content": "reduced infrastructure overhead"
      }
    }
  ],
  "metadata": {
    "total_descendants": 5,
    "max_depth": 2,
    "tension_count": 1,
    "has_temporal_consequences": false
  }
}
```

**Format: 'summary'**
```json
{
  "impact_summary": "Adopting serverless architecture affects 5 downstream considerations",
  "benefits": [
    "automatic scaling",
    "pay-per-invocation",
    "reduced infrastructure overhead"
  ],
  "risks": [
    "cold start latency",
    "vendor lock-in risk"
  ],
  "key_tradeoff": "performance vs cost (cold start latency vs reduced infrastructure overhead)"
}
```

### Edge Cases

**No consequences:**
```flowscript
thought: initial idea (no outgoing edges)
```
Result: Return empty consequences, indicate leaf node

**Temporal vs causal distinction:**
```flowscript
implementation complete
  => deploy to staging
  => run integration tests
  -> confidence in production deployment
```
Result: Include temporal sequence if `includeTemporalConsequences: true`, always include causal consequences

**Feedback loop (bidirectional `<->`):**
```flowscript
user feedback <-> product improvements
```
Result: Mark as feedback relationship, include in impact but flag as bidirectional

### Why This Query Matters

- **Decision support:** Understand full implications before committing
- **Risk assessment:** Identify downstream consequences
- **Planning:** Map dependencies and cascading effects
- **Change management:** Predict what breaks when X changes

**Real-world value:**
"Before deciding on serverless, run `what_if(serverless_option)` and see all consequences, including the performance vs cost tradeoff hidden in cold starts."

---

## Query 3: `tensions()` - Tradeoff Mapping

### Purpose
Extract all tension relationships from the graph to visualize the tradeoff landscape and understand competing priorities.

### Function Signature

```typescript
function tensions(
  options?: {
    groupBy?: 'axis' | 'node' | 'none',  // How to organize results (default: 'axis')
    filterByAxis?: string[],  // Only return tensions with these axes
    includeContext?: boolean,  // Include parent nodes for context (default: true)
    scope?: string  // Filter to subgraph under this node ID (default: entire graph)
  }
): TensionMap
```

### Algorithm

```
1. If scope provided, extract subgraph under scope node
   Else use entire graph
2. Find all relationships of type: tension (><)
3. For each tension relationship:
   - Extract axis label (required by linter)
   - Identify source and target nodes
   - If includeContext, find parent nodes (1 level up)
4. Group tensions according to groupBy option
5. Return structured tension map
```

**Graph operations:**
- Relationship filtering (type = tension)
- Label extraction (axis field)
- Context retrieval (parent node lookup)
- Grouping/aggregation by axis or node

### Example FlowScript Input

```flowscript
quantum computing viability

  -> decoherence problem
    -> extreme isolation required
      ><[physics vs economics] cryogenic infrastructure cost ($10M+)

  -> error correction needed
    -> 1000:1 physical-to-logical qubit ratio
      ><[efficiency vs reliability] error tolerance

  -> scaling challenges
    -> refrigeration requirements
      ><[linear vs exponential] heat removal problem
```

### Example Output

**groupBy: 'axis' (default)**
```json
{
  "tensions_by_axis": {
    "physics vs economics": [
      {
        "source": {
          "id": "sha256:isolation...",
          "content": "extreme isolation required"
        },
        "target": {
          "id": "sha256:cryo_cost...",
          "content": "cryogenic infrastructure cost ($10M+)"
        },
        "context": {
          "parent": {
            "id": "sha256:decoherence...",
            "content": "decoherence problem"
          }
        }
      }
    ],
    "efficiency vs reliability": [
      {
        "source": {
          "id": "sha256:ratio...",
          "content": "1000:1 physical-to-logical qubit ratio"
        },
        "target": {
          "id": "sha256:error_tolerance...",
          "content": "error tolerance"
        },
        "context": {
          "parent": {
            "id": "sha256:error_correction...",
            "content": "error correction needed"
          }
        }
      }
    ],
    "linear vs exponential": [
      {
        "source": {
          "id": "sha256:refrigeration...",
          "content": "refrigeration requirements"
        },
        "target": {
          "id": "sha256:heat...",
          "content": "heat removal problem"
        },
        "context": {
          "parent": {
            "id": "sha256:scaling...",
            "content": "scaling challenges"
          }
        }
      }
    ]
  },
  "metadata": {
    "total_tensions": 3,
    "unique_axes": 3,
    "most_common_axis": null
  }
}
```

**groupBy: 'node'**
```json
{
  "tensions_by_node": {
    "sha256:isolation...": {
      "node_content": "extreme isolation required",
      "tensions": [
        {
          "axis": "physics vs economics",
          "opposing_node": {
            "id": "sha256:cryo_cost...",
            "content": "cryogenic infrastructure cost ($10M+)"
          }
        }
      ]
    },
    "sha256:ratio...": {
      "node_content": "1000:1 physical-to-logical qubit ratio",
      "tensions": [
        {
          "axis": "efficiency vs reliability",
          "opposing_node": {
            "id": "sha256:error_tolerance...",
            "content": "error tolerance"
          }
        }
      ]
    }
  }
}
```

### Edge Cases

**No tensions in graph:**
```flowscript
simple causal chain
  -> consequence A
  -> consequence B
```
Result: Return empty tension map, indicate no tradeoffs found

**Multiple tensions with same axis:**
```flowscript
performance ><[speed vs accuracy] model quality
performance ><[speed vs accuracy] inference cost
```
Result: Group both under "speed vs accuracy", show as array

**Tension without axis label (linter ERROR):**
```flowscript
A >< B  (missing [axis])
```
Result: Should not occur (caught by linter), but return error if encountered

### Why This Query Matters

- **Strategic planning:** Map the tradeoff landscape
- **Decision making:** Understand competing priorities
- **Communication:** Articulate tensions to stakeholders
- **Design review:** Identify all compromises in a proposal

**Real-world value:**
"Before architectural review, run `tensions()` to extract all tradeoffs. Present them grouped by axis to show we've thought through every compromise."

---

## Query 4: `blocked(since)` - Blocker Tracking

### Purpose
Find all nodes in blocked state to identify what's preventing progress and what they're blocking.

### Function Signature

```typescript
function blocked(
  options?: {
    since?: string,  // ISO date: only blockers since this date (default: all)
    includeTransitiveCauses?: boolean,  // Include what's blocking the blocker (default: true)
    includeTransitiveEffects?: boolean,  // Include what's blocked by this blocker (default: true)
    format?: 'detailed' | 'summary' | 'list'  // Output format (default: 'detailed')
  }
): BlockerReport
```

### Algorithm

```
1. Filter all nodes for state.type = "blocked"
2. If since provided, filter by state.fields.since >= since
3. For each blocked node:
   - Extract reason and since from state.fields
   - If includeTransitiveCauses:
     - Run why(blockedNodeId) to find what's blocking the blocker
   - If includeTransitiveEffects:
     - Find all nodes that depend on this blocked node (reverse what_if)
4. Calculate impact score (number of nodes transitively blocked)
5. Sort by impact score (descending)
6. Return structured blocker report
```

**Graph operations:**
- State filtering (state.type = blocked)
- Date comparison (since field)
- Backward traversal (transitive causes)
- Forward traversal (transitive effects)
- Impact calculation (affected node count)

### Example FlowScript Input

```flowscript
! production deployment ready

  [blocked(reason: "waiting on security audit completion", since: "2025-10-10")]

  -> feature complete
  -> tests passing
  -> staging validated

deploy monitoring dashboard
  [blocked(reason: "need Datadog license approval", since: "2025-10-16")]
  <- monitoring infrastructure ready

optimize database queries
  [blocked(reason: "need production database access", since: "2025-10-14")]
  -> required for performance SLA
```

### Example Output

**Format: 'detailed' (default)**
```json
{
  "blockers": [
    {
      "node": {
        "id": "sha256:prod_deploy...",
        "content": "production deployment ready",
        "modifiers": ["urgent"]
      },
      "blocked_state": {
        "reason": "waiting on security audit completion",
        "since": "2025-10-10",
        "days_blocked": 7
      },
      "transitive_causes": [
        {
          "id": "sha256:security_team...",
          "content": "security team backlog"
        }
      ],
      "transitive_effects": [
        {
          "id": "sha256:customer_launch...",
          "content": "customer launch delayed"
        },
        {
          "id": "sha256:revenue_impact...",
          "content": "Q4 revenue target at risk"
        }
      ],
      "impact_score": 2,
      "priority": "high"
    },
    {
      "node": {
        "id": "sha256:db_optimize...",
        "content": "optimize database queries"
      },
      "blocked_state": {
        "reason": "need production database access",
        "since": "2025-10-14",
        "days_blocked": 3
      },
      "transitive_causes": [],
      "transitive_effects": [
        {
          "id": "sha256:perf_sla...",
          "content": "required for performance SLA"
        }
      ],
      "impact_score": 1,
      "priority": "medium"
    },
    {
      "node": {
        "id": "sha256:monitoring...",
        "content": "deploy monitoring dashboard"
      },
      "blocked_state": {
        "reason": "need Datadog license approval",
        "since": "2025-10-16",
        "days_blocked": 1
      },
      "transitive_causes": [
        {
          "id": "sha256:monitoring_infra...",
          "content": "monitoring infrastructure ready"
        }
      ],
      "transitive_effects": [],
      "impact_score": 0,
      "priority": "low"
    }
  ],
  "metadata": {
    "total_blockers": 3,
    "high_priority_count": 1,
    "average_days_blocked": 3.7,
    "oldest_blocker": {
      "id": "sha256:prod_deploy...",
      "since": "2025-10-10"
    }
  }
}
```

**Format: 'summary'**
```json
{
  "summary": "3 blockers identified, 1 high priority",
  "high_priority_blockers": [
    {
      "content": "production deployment ready",
      "reason": "waiting on security audit completion",
      "days_blocked": 7,
      "affects": 2
    }
  ],
  "action_items": [
    "Escalate security audit (blocking production for 7 days)",
    "Request production database access",
    "Follow up on Datadog license approval"
  ]
}
```

### Edge Cases

**No blockers found:**
```json
{
  "blockers": [],
  "metadata": {
    "total_blockers": 0,
    "message": "No blocked nodes found"
  }
}
```

**Blocker without since field (linter ERROR):**
```flowscript
[blocked(reason: "waiting")]  // Missing 'since' field
```
Result: Should not occur (caught by linter), return error if encountered

**Cascading blockers (A blocks B, B blocks C):**
Result: Show full transitive chain, calculate total impact across cascade

### Why This Query Matters

- **Project management:** Identify what's preventing progress
- **Prioritization:** Focus on high-impact blockers first
- **Communication:** Generate status reports automatically
- **Escalation:** Surface old blockers that need attention

**Real-world value:**
"Run `blocked()` every Monday to generate a priority-sorted list of what's stuck. Oldest high-impact blocker gets escalated automatically."

---

## Query 5: `alternatives(questionId)` - Decision Options

### Purpose
Extract all alternative options considered for a question, showing which was chosen and why.

### Function Signature

```typescript
function alternatives(
  questionId: string,
  options?: {
    includeRationale?: boolean,  // Include decision rationale (default: true)
    includeConsequences?: boolean,  // Run what_if on each alternative (default: false)
    showRejectedReasons?: boolean,  // Extract why alternatives weren't chosen (default: false)
    format?: 'comparison' | 'tree' | 'simple'  // Output format (default: 'comparison')
  }
): DecisionOptions
```

### Algorithm

```
1. Verify questionId is a node of type "question"
2. Find all outgoing relationships of type "alternative" (||)
3. For each alternative:
   - Extract node content
   - Check if it has [decided] state (chosen option)
   - If includeRationale, extract rationale from state.fields
   - If includeConsequences, run what_if(alternativeId)
   - If showRejectedReasons, extract rejection notes (if any)
4. Identify which alternative was chosen (has [decided] state)
5. Build comparison matrix if format = 'comparison'
6. Return structured decision options
```

**Graph operations:**
- Question node verification (type = question)
- Alternative relationship filtering (type = alternative)
- State detection (decided state on one alternative)
- Consequence extraction (what_if for each option)

### Example FlowScript Input

```flowscript
? authentication strategy for v1 launch

|| JWT tokens
  -> stateless architecture
  -> scales horizontally
  -> revocation difficult ><[security vs simplicity] implementation complexity

|| session tokens + Redis
  -> instant revocation capability
  -> battle-tested approach
  -> server-side state required ><[scaling vs security] operational complexity

* [decided(rationale: "security > scaling complexity for v1", on: "2025-10-15")] session tokens + Redis
  action: provision Redis cluster
```

### Example Output

**Format: 'comparison' (default)**
```json
{
  "question": {
    "id": "sha256:auth_question...",
    "content": "authentication strategy for v1 launch"
  },
  "alternatives": [
    {
      "id": "sha256:jwt_option...",
      "content": "JWT tokens",
      "chosen": false,
      "pros": [
        "stateless architecture",
        "scales horizontally"
      ],
      "cons": [
        "revocation difficult"
      ],
      "tensions": [
        {
          "axis": "security vs simplicity",
          "tradeoff": "implementation complexity"
        }
      ]
    },
    {
      "id": "sha256:session_option...",
      "content": "session tokens + Redis",
      "chosen": true,
      "pros": [
        "instant revocation capability",
        "battle-tested approach"
      ],
      "cons": [
        "server-side state required"
      ],
      "tensions": [
        {
          "axis": "scaling vs security",
          "tradeoff": "operational complexity"
        }
      ],
      "decision_rationale": "security > scaling complexity for v1",
      "decision_date": "2025-10-15",
      "actions": [
        "provision Redis cluster"
      ]
    }
  ],
  "decision_summary": {
    "chosen": "session tokens + Redis",
    "rationale": "security > scaling complexity for v1",
    "rejected": ["JWT tokens"],
    "key_factors": [
      "instant revocation capability",
      "battle-tested approach"
    ]
  }
}
```

**Format: 'simple'**
```json
{
  "question": "authentication strategy for v1 launch",
  "options_considered": [
    "JWT tokens",
    "session tokens + Redis"
  ],
  "chosen": "session tokens + Redis",
  "reason": "security > scaling complexity for v1"
}
```

### Edge Cases

**Question with no alternatives:**
```flowscript
? open question (no alternatives listed yet)
```
Result: Return empty alternatives array, indicate exploratory phase

**Multiple alternatives chosen (linter WARNING):**
```flowscript
? approach
|| option A
  * [decided] option A
|| option B
  * [decided] option B
```
Result: Flag as ambiguous, return all decided options with warning

**Alternative without decision:**
```flowscript
? question
|| option A
|| option B
(neither has [decided] state)
```
Result: Return all alternatives, indicate decision still pending

### Why This Query Matters

- **Decision archaeology:** Reconstruct why choices were made
- **Audit trail:** Document alternatives considered
- **Knowledge transfer:** Onboard new team members to past decisions
- **Reversal analysis:** Revisit decisions when context changes

**Real-world value:**
"Six months later, someone asks 'Why didn't we use JWT?' Run `alternatives(auth_question)` and see the full decision context, including the security vs scaling tradeoff we made."

---

## Implementation Priority

For Phase 6 Continuity Demo, implement in this order:

### Phase 6a: Core Traversal (2-3 hours)
1. **why()** - Backward causal traversal
2. **what_if()** - Forward causal traversal

**Why first:** Foundation for all other queries, proves basic graph operations work

### Phase 6b: Specialized Queries (1-2 hours)
3. **tensions()** - Relationship filtering and grouping
4. **blocked()** - State filtering and impact analysis

**Why second:** Build on traversal primitives, add filtering/grouping

### Phase 6c: Decision Support (1 hour)
5. **alternatives()** - Question-specific logic with state detection

**Why last:** Most complex (combines traversal + state + grouping), validates complete architecture

---

## Query Composition

These queries can be composed to answer more complex questions:

### "What's blocking our high-priority work?"
```typescript
const blockers = blocked({ format: 'detailed' });
const highPriority = blockers.filter(b => b.priority === 'high');
highPriority.forEach(blocker => {
  console.log(why(blocker.node.id));  // Why is this blocked?
  console.log(what_if(blocker.node.id));  // What depends on unblocking this?
});
```

### "Show me all decisions and their tradeoffs"
```typescript
const questions = graph.nodes.filter(n => n.type === 'question');
questions.forEach(q => {
  const opts = alternatives(q.id, { includeConsequences: true });
  const allTensions = opts.alternatives.flatMap(alt =>
    tensions({ scope: alt.id })
  );
  console.log({ question: q.content, tensions: allTensions });
});
```

### "Explain this decision's full context"
```typescript
function explainDecision(decisionId: string) {
  const ancestry = why(decisionId);  // What led to this decision?
  const impact = what_if(decisionId);  // What are the consequences?
  const opts = alternatives(ancestry.root_cause.id);  // What alternatives were considered?
  const tradeoffs = tensions({ scope: decisionId });  // What tradeoffs were made?

  return { ancestry, impact, opts, tradeoffs };
}
```

---

## Performance Considerations

### Graph Size
- **Small graphs (<100 nodes):** All queries real-time (<10ms)
- **Medium graphs (100-1000 nodes):** All queries acceptable (<100ms)
- **Large graphs (1000-10000 nodes):** May need optimization

### Optimization Strategies
1. **Indexing:** Build index of relationship types for faster filtering
2. **Caching:** Cache results of expensive traversals (transitive closures)
3. **Lazy evaluation:** Don't compute consequences unless requested
4. **Incremental updates:** When graph changes, update index, don't rebuild

### For Phase 6 MVP
- No optimization needed (< 100 nodes in demo)
- Focus on correctness, not performance
- Add instrumentation to measure query times
- Optimize in Phase 8+ if real-world use requires it

---

## Testing Requirements

Each query must have tests covering:

### Correctness Tests
- [ ] Correct results for golden examples (all 4 patterns)
- [ ] Handles empty results gracefully
- [ ] Respects maxDepth parameter
- [ ] Handles cycles without infinite loops

### Edge Case Tests
- [ ] Missing node IDs (return error)
- [ ] Malformed states (linter should catch, but handle gracefully)
- [ ] Multiple paths (preserve all, don't deduplicate incorrectly)
- [ ] Very deep chains (>10 levels)

### Integration Tests
- [ ] Query composition works (e.g., why() inside what_if())
- [ ] Results match IR schema exactly
- [ ] Provenance tracked correctly
- [ ] Performance acceptable on medium graphs

---

## Future Query Extensions

**Not in v1.0, but valuable for future:**

### `timeline(nodeId)` - Temporal Reconstruction
Trace temporal (`=>`) relationships to show event sequence over time.

### `completed(since)` - Task Completion Tracking
Filter nodes with `[completed]` state, group by date, track velocity.

### `explore(searchTerm)` - Semantic Search
Full-text search across node content, return subgraphs.

### `diff(graphA, graphB)` - Version Comparison
Compare two versions of same graph, show what changed.

### `path(fromId, toId)` - Shortest Path
Find shortest path between two nodes (any relationship type).

### `cluster(similarityMetric)` - Topic Clustering
Group related nodes using content similarity or structural patterns.

---

## Validation Checklist

Phase 6 continuity demo is successful when:

- [ ] All 5 queries implemented and tested
- [ ] Each query works on all 4 golden example patterns
- [ ] Query composition produces meaningful results
- [ ] Performance acceptable on demo graphs
- [ ] Results validate against IR schema
- [ ] Documentation complete for each query
- [ ] Live demo shows "computable substrate" in action

---

**Status:** Complete
**Last Updated:** 2025-10-17
**Version:** 1.0

These five queries prove FlowScript is computable substrate by demonstrating that structured notation enables computational memory operations impossible with plain text.
