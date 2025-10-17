# FlowScript Golden Examples Specification

**Version:** 1.0
**Status:** Complete
**Purpose:** Validation targets for parser/linter implementation and teaching materials for users

---

## Overview

This specification provides four canonical FlowScript patterns with their corresponding IR (Intermediate Representation) JSON compilations. These examples serve multiple purposes:

1. **Validation targets** - Parser/linter implementations must handle these correctly
2. **Teaching materials** - Demonstrate best practices for different use cases
3. **Architecture proof** - Show that FlowScript → IR compilation preserves semantic richness
4. **Query demonstrations** - Illustrate how computational queries operate on the IR graph

Each pattern demonstrates key FlowScript features and maps to real-world cognitive partnership scenarios.

---

## Pattern 1: Decision Under Tension with Alternatives

### Use Case
Architectural decision-making where multiple options exist with explicit tradeoffs.

### FlowScript Source

```flowscript
? authentication strategy for v1 launch

|| JWT tokens
  -> stateless architecture
    -> scales horizontally
    -> no server-side session storage
  -> revocation difficult ><[security vs simplicity] implementation complexity

|| session tokens + Redis
  -> instant revocation capability
  -> battle-tested approach
  -> server-side state required ><[scaling vs security] operational complexity
  -> additional infrastructure (Redis cluster)

* [decided(rationale: "security > scaling complexity for v1", on: "2025-10-15")] session tokens + Redis
  action: provision Redis cluster on AWS ElastiCache
  action: implement session middleware with 24hr TTL
```

### IR Compilation (JSON)

```json
{
  "nodes": [
    {
      "id": "sha256:a1b2c3...",
      "type": "question",
      "content": "authentication strategy for v1 launch",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 1,
        "timestamp": "2025-10-15T14:30:00Z"
      },
      "children": [
        {"$ref": "#/nodes/jwt_option"},
        {"$ref": "#/nodes/session_option"},
        {"$ref": "#/nodes/decision"}
      ]
    },
    {
      "id": "sha256:d4e5f6...",
      "label": "jwt_option",
      "type": "thought",
      "content": "JWT tokens",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 3,
        "timestamp": "2025-10-15T14:30:00Z"
      },
      "children": [
        {"$ref": "#/nodes/jwt_stateless"},
        {"$ref": "#/nodes/jwt_revocation"}
      ]
    },
    {
      "id": "sha256:g7h8i9...",
      "label": "jwt_stateless",
      "type": "thought",
      "content": "stateless architecture",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 4,
        "timestamp": "2025-10-15T14:30:00Z"
      },
      "children": [
        {"$ref": "#/nodes/jwt_scales"},
        {"$ref": "#/nodes/jwt_no_sessions"}
      ]
    },
    {
      "id": "sha256:j1k2l3...",
      "label": "jwt_scales",
      "type": "thought",
      "content": "scales horizontally",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 5,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:m4n5o6...",
      "label": "jwt_no_sessions",
      "type": "thought",
      "content": "no server-side session storage",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 6,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:p7q8r9...",
      "label": "jwt_revocation",
      "type": "thought",
      "content": "revocation difficult",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 7,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:s1t2u3...",
      "label": "jwt_complexity",
      "type": "thought",
      "content": "implementation complexity",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 7,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:v4w5x6...",
      "label": "session_option",
      "type": "thought",
      "content": "session tokens + Redis",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 9,
        "timestamp": "2025-10-15T14:30:00Z"
      },
      "children": [
        {"$ref": "#/nodes/session_revocation"},
        {"$ref": "#/nodes/session_battletested"},
        {"$ref": "#/nodes/session_state"},
        {"$ref": "#/nodes/session_infra"}
      ]
    },
    {
      "id": "sha256:y7z8a9...",
      "label": "session_revocation",
      "type": "thought",
      "content": "instant revocation capability",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 10,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:b1c2d3...",
      "label": "session_battletested",
      "type": "thought",
      "content": "battle-tested approach",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 11,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:e4f5g6...",
      "label": "session_state",
      "type": "thought",
      "content": "server-side state required",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 12,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:h7i8j9...",
      "label": "session_ops",
      "type": "thought",
      "content": "operational complexity",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 12,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:k1l2m3...",
      "label": "session_infra",
      "type": "thought",
      "content": "additional infrastructure (Redis cluster)",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 13,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:n4o5p6...",
      "label": "decision",
      "type": "thought",
      "content": "session tokens + Redis",
      "modifiers": ["locked"],
      "state": {
        "type": "decided",
        "fields": {
          "rationale": "security > scaling complexity for v1",
          "on": "2025-10-15"
        },
        "provenance": {
          "source_file": "decisions/auth.flow",
          "line_number": 15,
          "timestamp": "2025-10-15T14:35:00Z"
        }
      },
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 15,
        "timestamp": "2025-10-15T14:35:00Z"
      },
      "children": [
        {"$ref": "#/nodes/action_redis"},
        {"$ref": "#/nodes/action_middleware"}
      ]
    },
    {
      "id": "sha256:q7r8s9...",
      "label": "action_redis",
      "type": "action",
      "content": "provision Redis cluster on AWS ElastiCache",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 16,
        "timestamp": "2025-10-15T14:35:00Z"
      }
    },
    {
      "id": "sha256:t1u2v3...",
      "label": "action_middleware",
      "type": "action",
      "content": "implement session middleware with 24hr TTL",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 17,
        "timestamp": "2025-10-15T14:35:00Z"
      }
    }
  ],
  "relationships": [
    {
      "id": "sha256:rel_1...",
      "type": "alternative",
      "source": "sha256:a1b2c3...",
      "target": "sha256:d4e5f6...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 3,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_2...",
      "type": "alternative",
      "source": "sha256:a1b2c3...",
      "target": "sha256:v4w5x6...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 9,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_3...",
      "type": "causes",
      "source": "sha256:d4e5f6...",
      "target": "sha256:g7h8i9...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 4,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_4...",
      "type": "causes",
      "source": "sha256:g7h8i9...",
      "target": "sha256:j1k2l3...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 5,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_5...",
      "type": "causes",
      "source": "sha256:g7h8i9...",
      "target": "sha256:m4n5o6...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 6,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_6...",
      "type": "tension",
      "source": "sha256:p7q8r9...",
      "target": "sha256:s1t2u3...",
      "label": "security vs simplicity",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 7,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_7...",
      "type": "causes",
      "source": "sha256:v4w5x6...",
      "target": "sha256:y7z8a9...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 10,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_8...",
      "type": "causes",
      "source": "sha256:v4w5x6...",
      "target": "sha256:b1c2d3...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 11,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_9...",
      "type": "causes",
      "source": "sha256:v4w5x6...",
      "target": "sha256:e4f5g6...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 12,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_10...",
      "type": "tension",
      "source": "sha256:e4f5g6...",
      "target": "sha256:h7i8j9...",
      "label": "scaling vs security",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 12,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    },
    {
      "id": "sha256:rel_11...",
      "type": "causes",
      "source": "sha256:v4w5x6...",
      "target": "sha256:k1l2m3...",
      "provenance": {
        "source_file": "decisions/auth.flow",
        "line_number": 13,
        "timestamp": "2025-10-15T14:30:00Z"
      }
    }
  ]
}
```

### Queries Demonstrated

**1. `alternatives(question_id)` - Find decision options:**
```javascript
alternatives("sha256:a1b2c3...")
// Returns: {
//   options: [
//     {id: "sha256:d4e5f6...", content: "JWT tokens"},
//     {id: "sha256:v4w5x6...", content: "session tokens + Redis"}
//   ],
//   chosen: {id: "sha256:n4o5p6...", content: "session tokens + Redis"}
// }
```

**2. `why(decision_id)` - Trace decision rationale:**
```javascript
why("sha256:n4o5p6...")
// Returns: {
//   rationale: "security > scaling complexity for v1",
//   supporting_evidence: [
//     {id: "sha256:y7z8a9...", content: "instant revocation capability"},
//     {id: "sha256:b1c2d3...", content: "battle-tested approach"}
//   ]
// }
```

**3. `tensions()` - Find all tradeoffs:**
```javascript
tensions()
// Returns: [
//   {axis: "security vs simplicity", nodes: ["sha256:p7q8r9...", "sha256:s1t2u3..."]},
//   {axis: "scaling vs security", nodes: ["sha256:e4f5g6...", "sha256:h7i8j9..."]}
// ]
```

### Why This Pattern Matters

- **Demonstrates:** Alternative marker (`||`), tension relationships (`><[axis]`), state tracking (`[decided]`), action items
- **Real-world use:** Architectural decisions, RFC documentation, design discussions
- **Validates:** Parser handles alternatives correctly, linter enforces axis labeling, queries can reconstruct decision rationale
- **Teaching value:** Shows best practice for capturing "why we chose X over Y"

---

## Pattern 2: Debug/Incident Triage with Reverse Causation

### Use Case
Root cause analysis where effects are observed first and causes traced backward.

### FlowScript Source

```flowscript
! timeout errors in production API (500ms+ response times)
  <- database connection pool exhausted (max 20 connections)
    <- connection.release() missing in error handlers
      <- copy-paste bug from legacy user_controller.js
        <- no connection pooling tests in CI

[blocked(reason: "need staging environment to validate fix", since: "2025-10-16")]

action: add connection.release() to all error handlers
action: audit all controllers for resource leaks
action: add connection pool monitoring (Prometheus)
++ action: write integration tests for connection pooling

thought: pattern detected across 3 controllers (user, order, payment)
  -> suggests systematic issue in codebase
  -> code review template should check resource cleanup
```

### IR Compilation (JSON)

```json
{
  "nodes": [
    {
      "id": "sha256:urgent_1...",
      "type": "thought",
      "content": "timeout errors in production API (500ms+ response times)",
      "modifiers": ["urgent"],
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 1,
        "timestamp": "2025-10-16T09:15:00Z"
      },
      "children": []
    },
    {
      "id": "sha256:cause_1...",
      "type": "thought",
      "content": "database connection pool exhausted (max 20 connections)",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 2,
        "timestamp": "2025-10-16T09:20:00Z"
      }
    },
    {
      "id": "sha256:cause_2...",
      "type": "thought",
      "content": "connection.release() missing in error handlers",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 3,
        "timestamp": "2025-10-16T09:25:00Z"
      }
    },
    {
      "id": "sha256:cause_3...",
      "type": "thought",
      "content": "copy-paste bug from legacy user_controller.js",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 4,
        "timestamp": "2025-10-16T09:30:00Z"
      }
    },
    {
      "id": "sha256:cause_4...",
      "type": "thought",
      "content": "no connection pooling tests in CI",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 5,
        "timestamp": "2025-10-16T09:35:00Z"
      },
      "state": {
        "type": "blocked",
        "fields": {
          "reason": "need staging environment to validate fix",
          "since": "2025-10-16"
        },
        "provenance": {
          "source_file": "incidents/2025-10-16-api-timeout.flow",
          "line_number": 7,
          "timestamp": "2025-10-16T09:40:00Z"
        }
      }
    },
    {
      "id": "sha256:action_1...",
      "type": "action",
      "content": "add connection.release() to all error handlers",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 9,
        "timestamp": "2025-10-16T09:40:00Z"
      }
    },
    {
      "id": "sha256:action_2...",
      "type": "action",
      "content": "audit all controllers for resource leaks",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 10,
        "timestamp": "2025-10-16T09:40:00Z"
      }
    },
    {
      "id": "sha256:action_3...",
      "type": "action",
      "content": "add connection pool monitoring (Prometheus)",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 11,
        "timestamp": "2025-10-16T09:40:00Z"
      }
    },
    {
      "id": "sha256:action_4...",
      "type": "action",
      "content": "write integration tests for connection pooling",
      "modifiers": ["increment"],
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 12,
        "timestamp": "2025-10-16T09:40:00Z"
      }
    },
    {
      "id": "sha256:insight_1...",
      "type": "thought",
      "content": "pattern detected across 3 controllers (user, order, payment)",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 14,
        "timestamp": "2025-10-16T10:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/systemic"},
        {"$ref": "#/nodes/template"}
      ]
    },
    {
      "id": "sha256:systemic...",
      "type": "thought",
      "content": "suggests systematic issue in codebase",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 15,
        "timestamp": "2025-10-16T10:00:00Z"
      }
    },
    {
      "id": "sha256:template...",
      "type": "thought",
      "content": "code review template should check resource cleanup",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 16,
        "timestamp": "2025-10-16T10:00:00Z"
      }
    }
  ],
  "relationships": [
    {
      "id": "sha256:rev_cause_1...",
      "type": "caused_by",
      "source": "sha256:urgent_1...",
      "target": "sha256:cause_1...",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 2,
        "timestamp": "2025-10-16T09:20:00Z"
      }
    },
    {
      "id": "sha256:rev_cause_2...",
      "type": "caused_by",
      "source": "sha256:cause_1...",
      "target": "sha256:cause_2...",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 3,
        "timestamp": "2025-10-16T09:25:00Z"
      }
    },
    {
      "id": "sha256:rev_cause_3...",
      "type": "caused_by",
      "source": "sha256:cause_2...",
      "target": "sha256:cause_3...",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 4,
        "timestamp": "2025-10-16T09:30:00Z"
      }
    },
    {
      "id": "sha256:rev_cause_4...",
      "type": "caused_by",
      "source": "sha256:cause_3...",
      "target": "sha256:cause_4...",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 5,
        "timestamp": "2025-10-16T09:35:00Z"
      }
    },
    {
      "id": "sha256:insight_cause...",
      "type": "causes",
      "source": "sha256:insight_1...",
      "target": "sha256:systemic...",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 15,
        "timestamp": "2025-10-16T10:00:00Z"
      }
    },
    {
      "id": "sha256:insight_cause_2...",
      "type": "causes",
      "source": "sha256:insight_1...",
      "target": "sha256:template...",
      "provenance": {
        "source_file": "incidents/2025-10-16-api-timeout.flow",
        "line_number": 16,
        "timestamp": "2025-10-16T10:00:00Z"
      }
    }
  ]
}
```

### Queries Demonstrated

**1. `why(error_id)` - Trace root cause:**
```javascript
why("sha256:urgent_1...")
// Returns: {
//   causal_chain: [
//     {id: "sha256:cause_1...", content: "database connection pool exhausted"},
//     {id: "sha256:cause_2...", content: "connection.release() missing in error handlers"},
//     {id: "sha256:cause_3...", content: "copy-paste bug from legacy user_controller.js"},
//     {id: "sha256:cause_4...", content: "no connection pooling tests in CI"}
//   ],
//   root_cause: {id: "sha256:cause_4...", content: "no connection pooling tests in CI"}
// }
```

**2. `blocked(since)` - Find current blockers:**
```javascript
blocked()
// Returns: [
//   {
//     node: {id: "sha256:cause_4...", content: "no connection pooling tests in CI"},
//     reason: "need staging environment to validate fix",
//     since: "2025-10-16",
//     blocking: ["sha256:action_1...", "sha256:action_2..."]
//   }
// ]
```

**3. `what_if(fix_id)` - Impact of fix:**
```javascript
what_if("sha256:action_4...")
// Returns: {
//   direct_impact: "Prevents future connection pool issues",
//   indirect_impact: [
//     "Catches resource leaks in CI before production",
//     "Improves confidence in deployment pipeline"
//   ]
// }
```

### Why This Pattern Matters

- **Demonstrates:** Reverse causation (`<-`), urgent modifier (`!`), blocked state, increment modifier (`++`)
- **Real-world use:** Incident response, debugging, root cause analysis, post-mortems
- **Validates:** Parser handles bidirectional causation, linter catches orphaned nodes, queries can trace backward through causal chains
- **Teaching value:** Shows how to document investigative process with timestamps and evolving understanding

---

## Pattern 3: Research Knowledge Mapping with Hierarchical Structure

### Use Case
Exploring a complex domain with branching insights and nested relationships.

### FlowScript Source

```flowscript
quantum computing viability for cryptography

  -> decoherence problem (primary challenge)
    -> environmental noise interference
      -> requires extreme isolation (millikelvin temperatures)
        ><[physics vs economics] cryogenic infrastructure cost ($10M+ per system)
    -> quantum error correction needed
      -> topological qubits approach
        -> Microsoft Azure Quantum bet
        -> still theoretical (no working prototype)
      -> surface codes approach
        -> Google Sycamore implementation
        -> 1000:1 physical-to-logical qubit ratio ><[efficiency vs reliability] error tolerance

  -> scaling challenges
    -> qubit connectivity limitations
      -> 2D grid topology (current hardware)
      -> limits algorithmic complexity
    -> refrigeration requirements don't scale linearly
      -> heat removal becomes exponential problem

  -> timeline implications
    -> NIST post-quantum cryptography standards (2024)
    -> quantum advantage for crypto breaking: 10-15 years (conservative estimate)
    -> migration window: 5-10 years to adopt PQC

thought: current action is PQC migration, not waiting for quantum computers
  -> hybrid classical-quantum systems likely intermediate step

~ thought: might quantum networking solve connectivity before computing scales?
  -> quantum internet enables distributed computation
  -> separate research track to monitor
```

### IR Compilation (JSON)

```json
{
  "nodes": [
    {
      "id": "sha256:research_root...",
      "type": "thought",
      "content": "quantum computing viability for cryptography",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 1,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/decoherence"},
        {"$ref": "#/nodes/scaling"},
        {"$ref": "#/nodes/timeline"}
      ]
    },
    {
      "id": "sha256:decoherence...",
      "type": "thought",
      "content": "decoherence problem (primary challenge)",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 3,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/noise"},
        {"$ref": "#/nodes/error_correction"}
      ]
    },
    {
      "id": "sha256:noise...",
      "type": "thought",
      "content": "environmental noise interference",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 4,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/isolation"}
      ]
    },
    {
      "id": "sha256:isolation...",
      "type": "thought",
      "content": "requires extreme isolation (millikelvin temperatures)",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 5,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:cryo_cost...",
      "type": "thought",
      "content": "cryogenic infrastructure cost ($10M+ per system)",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 6,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:error_correction...",
      "type": "thought",
      "content": "quantum error correction needed",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 7,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/topological"},
        {"$ref": "#/nodes/surface_codes"}
      ]
    },
    {
      "id": "sha256:topological...",
      "type": "thought",
      "content": "topological qubits approach",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 8,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/microsoft"},
        {"$ref": "#/nodes/theoretical"}
      ]
    },
    {
      "id": "sha256:microsoft...",
      "type": "thought",
      "content": "Microsoft Azure Quantum bet",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 9,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:theoretical...",
      "type": "thought",
      "content": "still theoretical (no working prototype)",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 10,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:surface_codes...",
      "type": "thought",
      "content": "surface codes approach",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 11,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/google"},
        {"$ref": "#/nodes/ratio"}
      ]
    },
    {
      "id": "sha256:google...",
      "type": "thought",
      "content": "Google Sycamore implementation",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 12,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:ratio...",
      "type": "thought",
      "content": "1000:1 physical-to-logical qubit ratio",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 13,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:error_tolerance...",
      "type": "thought",
      "content": "error tolerance",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 13,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:scaling...",
      "type": "thought",
      "content": "scaling challenges",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 15,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/connectivity"},
        {"$ref": "#/nodes/refrigeration"}
      ]
    },
    {
      "id": "sha256:connectivity...",
      "type": "thought",
      "content": "qubit connectivity limitations",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 16,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/topology"},
        {"$ref": "#/nodes/complexity"}
      ]
    },
    {
      "id": "sha256:topology...",
      "type": "thought",
      "content": "2D grid topology (current hardware)",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 17,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:complexity...",
      "type": "thought",
      "content": "limits algorithmic complexity",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 18,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:refrigeration...",
      "type": "thought",
      "content": "refrigeration requirements don't scale linearly",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 19,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/heat"}
      ]
    },
    {
      "id": "sha256:heat...",
      "type": "thought",
      "content": "heat removal becomes exponential problem",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 20,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:timeline...",
      "type": "thought",
      "content": "timeline implications",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 22,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/nist"},
        {"$ref": "#/nodes/quantum_advantage"},
        {"$ref": "#/nodes/migration"}
      ]
    },
    {
      "id": "sha256:nist...",
      "type": "thought",
      "content": "NIST post-quantum cryptography standards (2024)",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 23,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:quantum_advantage...",
      "type": "thought",
      "content": "quantum advantage for crypto breaking: 10-15 years (conservative estimate)",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 24,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:migration...",
      "type": "thought",
      "content": "migration window: 5-10 years to adopt PQC",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 25,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:conclusion...",
      "type": "thought",
      "content": "current action is PQC migration, not waiting for quantum computers",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 27,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/hybrid"}
      ]
    },
    {
      "id": "sha256:hybrid...",
      "type": "thought",
      "content": "hybrid classical-quantum systems likely intermediate step",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 28,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:speculation...",
      "type": "thought",
      "content": "might quantum networking solve connectivity before computing scales?",
      "modifiers": ["exploratory"],
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 30,
        "timestamp": "2025-10-17T11:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/quantum_internet"},
        {"$ref": "#/nodes/research_track"}
      ]
    },
    {
      "id": "sha256:quantum_internet...",
      "type": "thought",
      "content": "quantum internet enables distributed computation",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 31,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:research_track...",
      "type": "thought",
      "content": "separate research track to monitor",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 32,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    }
  ],
  "relationships": [
    {
      "id": "sha256:rel_research_1...",
      "type": "causes",
      "source": "sha256:research_root...",
      "target": "sha256:decoherence...",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 3,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:rel_research_2...",
      "type": "causes",
      "source": "sha256:research_root...",
      "target": "sha256:scaling...",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 15,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:rel_research_3...",
      "type": "causes",
      "source": "sha256:research_root...",
      "target": "sha256:timeline...",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 22,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:tension_1...",
      "type": "tension",
      "source": "sha256:isolation...",
      "target": "sha256:cryo_cost...",
      "label": "physics vs economics",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 6,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    },
    {
      "id": "sha256:tension_2...",
      "type": "tension",
      "source": "sha256:ratio...",
      "target": "sha256:error_tolerance...",
      "label": "efficiency vs reliability",
      "provenance": {
        "source_file": "research/quantum-crypto-2025.flow",
        "line_number": 13,
        "timestamp": "2025-10-17T11:00:00Z"
      }
    }
  ]
}
```

### Queries Demonstrated

**1. `what_if(node_id)` - Explore consequences:**
```javascript
what_if("sha256:quantum_internet...")
// Returns: {
//   direct_consequences: [
//     {id: "sha256:research_track...", content: "separate research track to monitor"}
//   ],
//   related_tensions: [],
//   impact_assessment: "Speculative - requires continued monitoring"
// }
```

**2. `tensions()` - Map tradeoff landscape:**
```javascript
tensions()
// Returns: [
//   {
//     axis: "physics vs economics",
//     nodes: [
//       {id: "sha256:isolation...", content: "requires extreme isolation"},
//       {id: "sha256:cryo_cost...", content: "cryogenic infrastructure cost"}
//     ]
//   },
//   {
//     axis: "efficiency vs reliability",
//     nodes: [
//       {id: "sha256:ratio...", content: "1000:1 physical-to-logical qubit ratio"},
//       {id: "sha256:error_tolerance...", content: "error tolerance"}
//     ]
//   }
// ]
```

**3. `depth(node_id)` - Measure nesting levels:**
```javascript
depth("sha256:research_root...")
// Returns: {
//   max_depth: 5,
//   deepest_paths: [
//     ["research_root", "decoherence", "noise", "isolation", "cryo_cost"],
//     ["research_root", "decoherence", "error_correction", "surface_codes", "ratio", "error_tolerance"]
//   ],
//   linter_warning: false  // <5 levels threshold
// }
```

### Why This Pattern Matters

- **Demonstrates:** Deep hierarchical nesting, multiple tension axes, exploratory modifier (`~`), branching causation
- **Real-world use:** Literature review, technology assessment, strategic planning, research notes
- **Validates:** Parser handles deep nesting, linter warns at depth >5, queries can traverse complex graphs
- **Teaching value:** Shows how to map complex domains with uncertainty and competing constraints

---

## Pattern 4: Design RFC with Evolution and Continuity

### Use Case
Documenting design decisions over time with alternatives, evolution, and completion tracking.

### FlowScript Source

```flowscript
? caching strategy for read-heavy API endpoints

|| client-side caching (browser cache headers)
  -> reduces server load significantly
  -> stale data risk for dynamic content ><[performance vs freshness] user experience
  -> no infrastructure cost

|| Redis cache layer
  -> centralized cache invalidation
  -> consistent across clients
  -> additional infrastructure + monitoring ><[cost vs control] operational complexity
  -> battle-tested pattern

|| CDN edge caching (CloudFront)
  -> geographic distribution (lower latency)
  -> expensive for cache misses ><[latency vs cost] budget constraints
  -> requires cache key strategy

* [decided(rationale: "hybrid approach: CDN for static assets, Redis for dynamic data", on: "2025-10-14")]
  hybrid CDN + Redis architecture

  action: configure CloudFront for /static/* routes
  action: implement Redis cache for user profile data (5min TTL)
  action: add cache hit/miss monitoring to Datadog

  ✓ [completed(on: "2025-10-15")] CloudFront configuration deployed
  ✓ [completed(on: "2025-10-16")] Redis cache layer implemented

  [blocked(reason: "Datadog trial expired, need license approval", since: "2025-10-16")]
    action: add cache hit/miss monitoring to Datadog

thought: cache stampede risk for high-traffic endpoints
  -> implement probabilistic early expiration
  -> add jitter to TTL (±10% randomization)
  action: update cache middleware with jitter logic

=> performance testing on staging
  => load testing with k6 (1000 RPS)
    -> 95th percentile latency: 45ms (target: <50ms) ✓
    -> cache hit rate: 87% (target: >80%) ✓
  => deploy to production with gradual rollout
```

### IR Compilation (JSON)

```json
{
  "nodes": [
    {
      "id": "sha256:design_question...",
      "type": "question",
      "content": "caching strategy for read-heavy API endpoints",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 1,
        "timestamp": "2025-10-14T10:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/client_cache"},
        {"$ref": "#/nodes/redis_cache"},
        {"$ref": "#/nodes/cdn_cache"},
        {"$ref": "#/nodes/final_decision"}
      ]
    },
    {
      "id": "sha256:client_cache...",
      "type": "thought",
      "content": "client-side caching (browser cache headers)",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 3,
        "timestamp": "2025-10-14T10:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/reduces_load"},
        {"$ref": "#/nodes/stale_risk"},
        {"$ref": "#/nodes/no_cost"}
      ]
    },
    {
      "id": "sha256:reduces_load...",
      "type": "thought",
      "content": "reduces server load significantly",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 4,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:stale_risk...",
      "type": "thought",
      "content": "stale data risk for dynamic content",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 5,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:user_exp...",
      "type": "thought",
      "content": "user experience",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 5,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:no_cost...",
      "type": "thought",
      "content": "no infrastructure cost",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 6,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:redis_cache...",
      "type": "thought",
      "content": "Redis cache layer",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 8,
        "timestamp": "2025-10-14T10:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/centralized"},
        {"$ref": "#/nodes/consistent"},
        {"$ref": "#/nodes/infra_cost"},
        {"$ref": "#/nodes/battletested"}
      ]
    },
    {
      "id": "sha256:centralized...",
      "type": "thought",
      "content": "centralized cache invalidation",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 9,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:consistent...",
      "type": "thought",
      "content": "consistent across clients",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 10,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:infra_cost...",
      "type": "thought",
      "content": "additional infrastructure + monitoring",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 11,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:ops_complexity...",
      "type": "thought",
      "content": "operational complexity",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 11,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:battletested...",
      "type": "thought",
      "content": "battle-tested pattern",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 12,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:cdn_cache...",
      "type": "thought",
      "content": "CDN edge caching (CloudFront)",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 14,
        "timestamp": "2025-10-14T10:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/geo_dist"},
        {"$ref": "#/nodes/expensive"},
        {"$ref": "#/nodes/cache_key"}
      ]
    },
    {
      "id": "sha256:geo_dist...",
      "type": "thought",
      "content": "geographic distribution (lower latency)",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 15,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:expensive...",
      "type": "thought",
      "content": "expensive for cache misses",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 16,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:budget...",
      "type": "thought",
      "content": "budget constraints",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 16,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:cache_key...",
      "type": "thought",
      "content": "requires cache key strategy",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 17,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:final_decision...",
      "type": "thought",
      "content": "hybrid CDN + Redis architecture",
      "modifiers": ["locked"],
      "state": {
        "type": "decided",
        "fields": {
          "rationale": "hybrid approach: CDN for static assets, Redis for dynamic data",
          "on": "2025-10-14"
        },
        "provenance": {
          "source_file": "rfcs/2025-10-caching-strategy.flow",
          "line_number": 19,
          "timestamp": "2025-10-14T15:00:00Z"
        }
      },
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 19,
        "timestamp": "2025-10-14T15:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/action_cf"},
        {"$ref": "#/nodes/action_redis"},
        {"$ref": "#/nodes/action_monitoring"},
        {"$ref": "#/nodes/completed_cf"},
        {"$ref": "#/nodes/completed_redis"},
        {"$ref": "#/nodes/blocked_monitoring"},
        {"$ref": "#/nodes/thought_stampede"}
      ]
    },
    {
      "id": "sha256:action_cf...",
      "type": "action",
      "content": "configure CloudFront for /static/* routes",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 22,
        "timestamp": "2025-10-14T15:00:00Z"
      }
    },
    {
      "id": "sha256:action_redis...",
      "type": "action",
      "content": "implement Redis cache for user profile data (5min TTL)",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 23,
        "timestamp": "2025-10-14T15:00:00Z"
      }
    },
    {
      "id": "sha256:action_monitoring...",
      "type": "action",
      "content": "add cache hit/miss monitoring to Datadog",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 24,
        "timestamp": "2025-10-14T15:00:00Z"
      }
    },
    {
      "id": "sha256:completed_cf...",
      "type": "action",
      "content": "CloudFront configuration deployed",
      "modifiers": ["completed"],
      "state": {
        "type": "completed",
        "fields": {
          "on": "2025-10-15"
        },
        "provenance": {
          "source_file": "rfcs/2025-10-caching-strategy.flow",
          "line_number": 26,
          "timestamp": "2025-10-15T16:00:00Z"
        }
      },
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 26,
        "timestamp": "2025-10-15T16:00:00Z"
      }
    },
    {
      "id": "sha256:completed_redis...",
      "type": "action",
      "content": "Redis cache layer implemented",
      "modifiers": ["completed"],
      "state": {
        "type": "completed",
        "fields": {
          "on": "2025-10-16"
        },
        "provenance": {
          "source_file": "rfcs/2025-10-caching-strategy.flow",
          "line_number": 27,
          "timestamp": "2025-10-16T14:00:00Z"
        }
      },
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 27,
        "timestamp": "2025-10-16T14:00:00Z"
      }
    },
    {
      "id": "sha256:blocked_monitoring...",
      "type": "action",
      "content": "add cache hit/miss monitoring to Datadog",
      "state": {
        "type": "blocked",
        "fields": {
          "reason": "Datadog trial expired, need license approval",
          "since": "2025-10-16"
        },
        "provenance": {
          "source_file": "rfcs/2025-10-caching-strategy.flow",
          "line_number": 29,
          "timestamp": "2025-10-16T14:30:00Z"
        }
      },
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 29,
        "timestamp": "2025-10-16T14:30:00Z"
      }
    },
    {
      "id": "sha256:thought_stampede...",
      "type": "thought",
      "content": "cache stampede risk for high-traffic endpoints",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 32,
        "timestamp": "2025-10-16T15:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/prob_exp"},
        {"$ref": "#/nodes/jitter"},
        {"$ref": "#/nodes/action_jitter"}
      ]
    },
    {
      "id": "sha256:prob_exp...",
      "type": "thought",
      "content": "implement probabilistic early expiration",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 33,
        "timestamp": "2025-10-16T15:00:00Z"
      }
    },
    {
      "id": "sha256:jitter...",
      "type": "thought",
      "content": "add jitter to TTL (±10% randomization)",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 34,
        "timestamp": "2025-10-16T15:00:00Z"
      }
    },
    {
      "id": "sha256:action_jitter...",
      "type": "action",
      "content": "update cache middleware with jitter logic",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 35,
        "timestamp": "2025-10-16T15:00:00Z"
      }
    },
    {
      "id": "sha256:perf_test...",
      "type": "thought",
      "content": "performance testing on staging",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 37,
        "timestamp": "2025-10-16T16:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes/load_test"}
      ]
    },
    {
      "id": "sha256:load_test...",
      "type": "thought",
      "content": "load testing with k6 (1000 RPS)",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 38,
        "timestamp": "2025-10-16T17:00:00Z"
      },
      "children": [
        {"$ref": "#/nodes:latency_result"},
        {"$ref": "#/nodes/cache_hit_result"},
        {"$ref": "#/nodes/deploy"}
      ]
    },
    {
      "id": "sha256:latency_result...",
      "type": "thought",
      "content": "95th percentile latency: 45ms (target: <50ms)",
      "modifiers": ["completed"],
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 39,
        "timestamp": "2025-10-16T18:00:00Z"
      }
    },
    {
      "id": "sha256:cache_hit_result...",
      "type": "thought",
      "content": "cache hit rate: 87% (target: >80%)",
      "modifiers": ["completed"],
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 40,
        "timestamp": "2025-10-16T18:00:00Z"
      }
    },
    {
      "id": "sha256:deploy...",
      "type": "thought",
      "content": "deploy to production with gradual rollout",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 41,
        "timestamp": "2025-10-16T18:00:00Z"
      }
    }
  ],
  "relationships": [
    {
      "id": "sha256:alt_1...",
      "type": "alternative",
      "source": "sha256:design_question...",
      "target": "sha256:client_cache...",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 3,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:alt_2...",
      "type": "alternative",
      "source": "sha256:design_question...",
      "target": "sha256:redis_cache...",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 8,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:alt_3...",
      "type": "alternative",
      "source": "sha256:design_question...",
      "target": "sha256:cdn_cache...",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 14,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:tension_perf_fresh...",
      "type": "tension",
      "source": "sha256:stale_risk...",
      "target": "sha256:user_exp...",
      "label": "performance vs freshness",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 5,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:tension_cost_control...",
      "type": "tension",
      "source": "sha256:infra_cost...",
      "target": "sha256:ops_complexity...",
      "label": "cost vs control",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 11,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:tension_latency_cost...",
      "type": "tension",
      "source": "sha256:expensive...",
      "target": "sha256:budget...",
      "label": "latency vs cost",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 16,
        "timestamp": "2025-10-14T10:00:00Z"
      }
    },
    {
      "id": "sha256:temporal_1...",
      "type": "temporal",
      "source": "sha256:final_decision...",
      "target": "sha256:perf_test...",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 37,
        "timestamp": "2025-10-16T16:00:00Z"
      }
    },
    {
      "id": "sha256:temporal_2...",
      "type": "temporal",
      "source": "sha256:perf_test...",
      "target": "sha256:load_test...",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 38,
        "timestamp": "2025-10-16T17:00:00Z"
      }
    },
    {
      "id": "sha256:temporal_3...",
      "type": "temporal",
      "source": "sha256:load_test...",
      "target": "sha256:deploy...",
      "provenance": {
        "source_file": "rfcs/2025-10-caching-strategy.flow",
        "line_number": 41,
        "timestamp": "2025-10-16T18:00:00Z"
      }
    }
  ]
}
```

### Queries Demonstrated

**1. `alternatives(question_id)` - View all options considered:**
```javascript
alternatives("sha256:design_question...")
// Returns: {
//   options: [
//     {id: "sha256:client_cache...", content: "client-side caching"},
//     {id: "sha256:redis_cache...", content: "Redis cache layer"},
//     {id: "sha256:cdn_cache...", content: "CDN edge caching"}
//   ],
//   chosen: {id: "sha256:final_decision...", content: "hybrid CDN + Redis architecture"}
// }
```

**2. `blocked(since)` - Track implementation blockers:**
```javascript
blocked("2025-10-16")
// Returns: [
//   {
//     node: {id: "sha256:blocked_monitoring...", content: "add cache hit/miss monitoring"},
//     reason: "Datadog trial expired, need license approval",
//     since: "2025-10-16",
//     blocks_completion: true
//   }
// ]
```

**3. `completed(since)` - Track progress:**
```javascript
completed("2025-10-15")
// Returns: [
//   {id: "sha256:completed_cf...", content: "CloudFront configuration deployed", on: "2025-10-15"},
//   {id: "sha256:completed_redis...", content: "Redis cache layer implemented", on: "2025-10-16"},
//   {id: "sha256:latency_result...", content: "95th percentile latency: 45ms (target: <50ms)"},
//   {id: "sha256:cache_hit_result...", content: "cache hit rate: 87% (target: >80%)"}
// ]
```

**4. `timeline(root_id)` - Reconstruct temporal sequence:**
```javascript
timeline("sha256:final_decision...")
// Returns: [
//   {timestamp: "2025-10-14T15:00:00Z", event: "decision made"},
//   {timestamp: "2025-10-15T16:00:00Z", event: "CloudFront deployed"},
//   {timestamp: "2025-10-16T14:00:00Z", event: "Redis implemented"},
//   {timestamp: "2025-10-16T16:00:00Z", event: "performance testing started"},
//   {timestamp: "2025-10-16T18:00:00Z", event: "testing passed, ready for deployment"}
// ]
```

### Why This Pattern Matters

- **Demonstrates:** Multiple alternatives (`||`), temporal sequence (`=>`), completion marker (`✓`), state evolution over time, hybrid structures
- **Real-world use:** RFCs, project planning, implementation tracking, continuity across sessions
- **Validates:** Parser handles temporal vs causal distinction, linter catches state field requirements, queries can track task completion
- **Teaching value:** Shows complete lifecycle from decision → implementation → validation → deployment

---

## Implementation Validation Checklist

Parser/linter implementations must correctly handle all four patterns:

### Pattern 1: Decision Analysis
- [ ] Parse `||` alternative marker correctly
- [ ] Enforce `><[axis]` labeling (ERROR if missing)
- [ ] Compile `[decided(rationale, on)]` with required fields
- [ ] Generate content-hash IDs for deduplication
- [ ] Support `alternatives()` query on IR

### Pattern 2: Debug Triage
- [ ] Parse `<-` reverse causation correctly
- [ ] Handle `!` urgent modifier
- [ ] Compile `[blocked(reason, since)]` with required fields
- [ ] Support `why()` backward traversal query
- [ ] Support `blocked()` state filter query

### Pattern 3: Research Mapping
- [ ] Handle deep nesting (>3 levels)
- [ ] Parse `~` exploratory modifier
- [ ] Warn at nesting depth >5 levels (WARNING, not ERROR)
- [ ] Multiple tension relationships in same graph
- [ ] Support `tensions()` query to extract all tradeoffs
- [ ] Support `what_if()` forward traversal query

### Pattern 4: Design RFC Evolution
- [ ] Parse `=>` temporal operator (distinct from `->`)
- [ ] Parse `✓` completion marker
- [ ] Handle `[completed(on)]` state
- [ ] Track state evolution over time (provenance timestamps)
- [ ] Support `completed()` query for task tracking
- [ ] Support `timeline()` query for temporal reconstruction

### Cross-Pattern Requirements
- [ ] Consistent content-hash ID generation across patterns
- [ ] Provenance tracking (source file, line number, timestamp)
- [ ] Bidirectional relationship links in IR
- [ ] All state markers require fields (ERROR if missing)
- [ ] All tension markers require axis label (ERROR if missing)
- [ ] No orphaned nodes (degree 0, ERROR)
- [ ] No cycles without `feedback:true` (ERROR)

---

## Teaching Use Cases

### For New Users
Start with **Pattern 1** (Decision Analysis):
- Simplest structure (alternatives + decision)
- Immediate value (documents "why we chose X")
- Introduces core concepts (alternatives, tensions, states)

Progress to **Pattern 2** (Debug Triage):
- Introduces reverse causation (`<-`)
- Shows state tracking in practice
- Demonstrates urgent modifier

Advanced: **Pattern 3** (Research Mapping):
- Deep nesting for complex domains
- Multiple tension axes
- Exploratory thinking marker

Expert: **Pattern 4** (Design RFC Evolution):
- Combines all previous concepts
- Adds temporal sequence
- Shows continuity tracking over time

### For Tool Developers
Use all four patterns as **regression test suite**:
- Parser must compile all four correctly
- Linter must catch violations in modified versions
- Queries must return correct results
- IR JSON must validate against schema

---

## Extending This Specification

When adding new golden examples in the future:

1. **Identify gap** - What pattern is missing from current set?
2. **Real-world grounding** - Based on actual use case, not theoretical
3. **IR compilation** - Show complete FlowScript → JSON transformation
4. **Query demonstration** - Prove pattern enables computational operations
5. **Teaching value** - Explain when/why to use this pattern
6. **Validation checklist** - Add parser/linter requirements

**Current coverage:**
- ✓ Alternatives and decisions (Pattern 1)
- ✓ Reverse causation and debugging (Pattern 2)
- ✓ Deep hierarchical research (Pattern 3)
- ✓ Temporal evolution and completion tracking (Pattern 4)

**Future candidates:**
- Feedback loops (`<->` bidirectional causation)
- Multi-file references (`@project` scoping)
- Collaborative editing (merge conflict resolution)
- Version control integration (git commit provenance)

---

**Status:** Complete
**Last Updated:** 2025-10-17
**Version:** 1.0

This specification provides complete validation targets for Phase 2-3 parser/linter implementation.
