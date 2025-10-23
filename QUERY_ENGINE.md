# FlowScript Query Engine

**Computable operations on cognitive graphs**

The FlowScript Query Engine proves that FlowScript is a computable substrate for memory and reasoning, not just notation. It enables sophisticated graph operations that are impossible with unstructured text.

---

## Overview

The query engine operates on FlowScript IR (Intermediate Representation) to perform computational operations on cognitive graphs:

- **Input:** Parsed FlowScript IR (JSON)
- **Operations:** 5 critical queries for cognitive graph analysis
- **Output:** Structured results (JSON)
- **Performance:** <1ms per query on typical graphs (measured: 20-41 nodes, 6-25 relationships)

### Architecture

```
FlowScript IR (JSON)
  ↓ load()
Query Engine
  ↓ buildIndexes()
O(1) lookup maps:
  - nodeMap: id → Node
  - relationshipsFromSource: source_id → Relationship[]
  - relationshipsToTarget: target_id → Relationship[]
  - stateMap: node_id → State
  ↓
5 Query Operations
  ↓
Structured Results
```

The engine builds efficient indexes for O(1) node lookups and O(E) graph traversals (where E = number of relationships).

---

## The Five Queries

### 1. why(nodeId) - Causal Ancestry

**Purpose:** Trace backward through causal relationships to understand why something exists or happened.

**Algorithm:**
- Reverse traversal through 'derives_from' and 'causes' relationships
- Builds causal chain from root causes to target node
- Detects cycles and multiple paths

**Use Cases:**
- Root cause analysis: "Why did we make this decision?"
- Dependency tracking: "What does this depend on?"
- Backward reasoning: "What led to this conclusion?"

**Output Formats:**
- `chain` (default): Linear causal chain with depth tracking
- `tree`: Full ancestor tree with all paths
- `minimal`: Just the node IDs

**Example (CLI):**
```bash
$ flowscript query why 6a507bd0dfab... examples/decision.json --format=chain
{
  "target": {
    "id": "6a507bd0dfab...",
    "content": "stateless architecture"
  },
  "causal_chain": [
    {
      "depth": 1,
      "id": "ea777fb1b1fa...",
      "content": "JWT tokens",
      "relationship_type": "causes"
    }
  ],
  "root_cause": {
    "id": "ea777fb1b1fa...",
    "content": "JWT tokens",
    "is_root": true
  },
  "metadata": {
    "total_ancestors": 1,
    "max_depth": 1,
    "has_multiple_paths": false
  }
}
```

**Options:**
- `format`: 'chain' | 'tree' | 'minimal' (default: 'chain')
- `maxDepth`: Maximum traversal depth (default: unlimited)

---

### 2. whatIf(nodeId) - Impact Analysis

**Purpose:** Trace forward through causal relationships to calculate transitive impact.

**Algorithm:**
- Forward traversal through 'causes' and 'temporal' relationships
- Builds impact tree with direct/indirect descendants
- Detects tensions in consequence zones
- Classifies impacts as benefits/risks (heuristic)

**Use Cases:**
- Impact analysis: "What happens if we change this?"
- Consequence mapping: "What does this affect?"
- Forward reasoning: "What are the implications?"

**Output Formats:**
- `tree` (default): Hierarchical impact tree with depth
- `list`: Flat list of all consequences
- `summary`: High-level impact summary with benefits/risks

**Example (CLI):**
```bash
$ flowscript query what-if ea777fb1b1fa... examples/decision.json --format=summary
{
  "impact_summary": "JWT tokens affects 4 downstream considerations",
  "benefits": [
    "stateless architecture",
    "scales horizontally",
    "no server-side session storage",
    "revocation difficult"
  ],
  "risks": [],
  "key_tradeoff": null
}
```

**Options:**
- `format`: 'tree' | 'list' | 'summary' (default: 'tree')
- `maxDepth`: Maximum traversal depth (default: unlimited)

---

### 3. tensions() - Tradeoff Mapping

**Purpose:** Extract all tension/tradeoff relationships systematically.

**Algorithm:**
- Filters all 'tension' relationships
- Groups by axis label or parent node
- Includes parent context when requested
- Supports scope filtering

**Use Cases:**
- Tradeoff analysis: "What are all the tensions in this system?"
- Constraint mapping: "What tradeoffs did we consider?"
- Decision review: "What tensions exist around this choice?"

**Output Formats:**
- Group by axis (default): Tensions organized by axis_label
- Group by node: Tensions organized by source node
- No grouping: Flat array of all tensions

**Example (CLI):**
```bash
$ flowscript query tensions examples/decision.json --group-by=axis
{
  "tensions_by_axis": {
    "security vs simplicity": [
      {
        "source": { "id": "...", "content": "JWT tokens" },
        "target": { "id": "...", "content": "implementation complexity" }
      }
    ],
    "scaling vs security": [
      {
        "source": { "id": "...", "content": "session tokens + Redis" },
        "target": { "id": "...", "content": "operational complexity" }
      }
    ]
  },
  "metadata": {
    "total_tensions": 2,
    "unique_axes": ["security vs simplicity", "scaling vs security"],
    "most_common_axis": "security vs simplicity"
  }
}
```

**Options:**
- `groupBy`: 'axis' | 'node' | 'none' (default: 'axis')
- `filterByAxis`: Array of axis labels to filter (optional)
- `includeContext`: Include parent context (default: false)
- `scope`: Node ID to limit subgraph (optional)

---

### 4. blocked() - Blocker Tracking

**Purpose:** Find all blocked nodes with dependency chains and impact scoring.

**Algorithm:**
- Filters nodes with state.status = 'blocked'
- Calculates days blocked from state.since
- Traces transitive causes (what's blocking the blocker)
- Traces transitive effects (what's blocked by this)
- Scores impact and prioritizes

**Use Cases:**
- Project management: "What's currently blocked?"
- Dependency analysis: "What's blocking critical work?"
- Prioritization: "Which blockers have the most impact?"

**Output Formats:**
- `detailed` (default): Full blocker details with chains
- `summary`: High-level statistics only

**Example (CLI):**
```bash
$ flowscript query blocked examples/decision.json --format=summary
{
  "blockers": [],
  "metadata": {
    "total_blockers": 0,
    "high_priority_count": 0,
    "average_days_blocked": 0,
    "oldest_blocker": null
  }
}
```

**Options:**
- `since`: Filter by blocked since date 'YYYY-MM-DD' (optional)
- `format`: 'detailed' | 'summary' (default: 'detailed')

**Impact Scoring:**
- Base score: days_blocked
- +1 per transitive cause (blocker dependency)
- +2 per transitive effect (downstream impact)
- Priority: high (>10), medium (5-10), low (<5)

---

### 5. alternatives(questionId) - Decision Reconstruction

**Purpose:** Reconstruct decision rationale from alternative nodes.

**Algorithm:**
- Finds all alternatives connected to question
- Identifies chosen alternative (has state.decided)
- Extracts tensions within each alternative
- Builds comparison matrix

**Use Cases:**
- Decision review: "What options did we consider?"
- Rationale recovery: "Why did we choose this?"
- Tradeoff analysis: "What were the key factors?"

**Output Formats:**
- `comparison` (default): Full comparison with tensions
- `simple`: Just alternatives and chosen option

**Example (CLI):**
```bash
$ flowscript query alternatives 9b20cbf148e... examples/decision.json --format=comparison
{
  "question": {
    "id": "9b20cbf148e...",
    "content": "authentication strategy for v1 launch"
  },
  "alternatives": [
    {
      "id": "ea777fb1b1fa...",
      "content": "JWT tokens",
      "chosen": false,
      "tensions": [...]
    },
    {
      "id": "a17d33cfe5b9...",
      "content": "session tokens + Redis",
      "chosen": true,
      "rationale": "security > scaling complexity for v1",
      "decided_on": "2025-10-15",
      "tensions": [...]
    }
  ],
  "decision_summary": {
    "chosen": "session tokens + Redis",
    "rationale": "security > scaling complexity for v1",
    "rejected": ["JWT tokens"],
    "key_factors": ["scaling vs security"]
  }
}
```

**Options:**
- `format`: 'comparison' | 'simple' (default: 'comparison')

---

## CLI Usage

### Installation

```bash
npm install -g flowscript
```

Or use locally:
```bash
./bin/flowscript query <command> [options]
```

### Command Reference

**General syntax:**
```bash
flowscript query <command> [node-id] <ir-file> [options]
```

**Get help:**
```bash
flowscript query --help
flowscript query why --help
```

### Examples

**1. Trace causal ancestry:**
```bash
# Default chain format
flowscript query why <node-id> examples/decision.json

# Tree format with depth limit
flowscript query why <node-id> examples/decision.json --format=tree --max-depth=3
```

**2. Calculate impact:**
```bash
# Default tree format
flowscript query what-if <node-id> examples/decision.json

# Summary format
flowscript query what-if <node-id> examples/decision.json --format=summary
```

**3. Extract tensions:**
```bash
# Group by axis (default)
flowscript query tensions examples/decision.json

# Filter by specific axis
flowscript query tensions examples/decision.json --axis="security vs simplicity"

# Include parent context
flowscript query tensions examples/decision.json --with-context
```

**4. Find blockers:**
```bash
# All blockers
flowscript query blocked examples/decision.json

# Filter by date
flowscript query blocked examples/decision.json --since=2025-10-01

# Summary only
flowscript query blocked examples/decision.json --format=summary
```

**5. Reconstruct decision:**
```bash
# Full comparison
flowscript query alternatives <question-id> examples/decision.json

# Simple format
flowscript query alternatives <question-id> examples/decision.json --format=simple
```

---

## Programmatic Usage

### TypeScript/JavaScript

**Installation:**
```bash
npm install flowscript
```

**Basic usage:**
```typescript
import { Parser, FlowScriptQueryEngine } from 'flowscript'
import * as fs from 'fs'

// Parse FlowScript → IR
const input = fs.readFileSync('example.fs', 'utf-8')
const parser = new Parser('example.fs')
const ir = parser.parse(input)

// Create query engine
const engine = new FlowScriptQueryEngine()
engine.load(ir)

// Run queries
const ancestry = engine.why('node-id', { format: 'chain' })
const impact = engine.whatIf('node-id', { format: 'summary', maxDepth: 3 })
const tensions = engine.tensions({ groupBy: 'axis' })
const blockers = engine.blocked({ since: '2025-10-01' })
const alternatives = engine.alternatives('question-id', { format: 'comparison' })

console.log(ancestry)
console.log(impact)
```

**Loading pre-parsed IR:**
```typescript
import { FlowScriptQueryEngine } from 'flowscript'
import * as fs from 'fs'

// Load IR JSON directly
const irJson = fs.readFileSync('example.json', 'utf-8')
const ir = JSON.parse(irJson)

const engine = new FlowScriptQueryEngine()
engine.load(ir)

// Query as normal
const tensions = engine.tensions()
```

**Error handling:**
```typescript
try {
  const result = engine.why('nonexistent-node')
} catch (error) {
  if (error instanceof Error) {
    console.error('Query error:', error.message)
    // "Node not found: nonexistent-node"
  }
}
```

---

## Performance

### Benchmarks (Golden Examples)

**ACTUAL measurements** from `scripts/benchmark-queries.ts` (run 2025-10-23):

Tested on golden example graphs:
- **decision.json**: 20 nodes, 12 relationships
- **debug.json**: 17 nodes, 6 relationships
- **design.json**: 41 nodes, 22 relationships
- **research.json**: 41 nodes, 25 relationships

**Results (measured on MacBook Apple Silicon):**
```
Query          | decision.json | debug.json | design.json | research.json
---------------|---------------|------------|-------------|---------------
Load           | <1ms          | <1ms       | <1ms        | <1ms
why()          | <1ms          | <1ms       | <1ms        | <1ms
whatIf()       | <1ms          | <1ms       | <1ms        | <1ms
tensions()     | <1ms          | <1ms       | <1ms        | <1ms
blocked()      | <1ms          | <1ms       | <1ms        | <1ms
alternatives() | <1ms          | <1ms       | <1ms        | <1ms
```

All queries execute in **<1ms** even on graphs with 41 nodes and 25 relationships. ✅ **All queries meet <100ms target.**

**Performance characteristics:**
- **Index building:** O(N + E) where N = nodes, E = relationships
- **Node lookups:** O(1) via Map
- **Graph traversals:** O(E) where E = edges in subgraph
- **Memory:** O(N + E) for indexes

### Optimization Notes

For typical cognitive graphs (10-100 nodes):
- Current implementation is sufficient
- No caching needed (queries are already <1ms)
- Map-based indexes provide O(1) lookups

For larger graphs (1000+ nodes):
- Consider adding result caching
- Consider incremental index updates
- Consider query result pagination

---

## Integration Guide

### Using in Your Project

**1. Install FlowScript:**
```bash
npm install flowscript
```

**2. Parse your cognitive graphs:**
```typescript
import { Parser } from 'flowscript'

const parser = new Parser('my-thoughts.fs')
const ir = parser.parse(myFlowScriptText)
```

**3. Query your memory:**
```typescript
import { FlowScriptQueryEngine } from 'flowscript'

const engine = new FlowScriptQueryEngine()
engine.load(ir)

// Find all tradeoffs
const tensions = engine.tensions({ groupBy: 'axis' })

// Trace decision rationale
const decision = engine.alternatives('question-node-id')

// Find blockers
const blockers = engine.blocked()
```

### Use Cases

**AI Continuity Systems:**
- Query previous decisions: `alternatives(questionId)`
- Find open questions: `blocked()` with no transitive causes
- Understand context: `why(nodeId)` to trace reasoning

**Project Management:**
- Track blockers: `blocked({ since: '2025-10-01' })`
- Analyze dependencies: `why(nodeId)` for dependency chains
- Impact analysis: `whatIf(nodeId)` before making changes

**Decision Support:**
- Review tradeoffs: `tensions({ groupBy: 'axis' })`
- Reconstruct decisions: `alternatives(questionId)`
- Find root causes: `why(nodeId)` to understand constraints

**Research & Analysis:**
- Map tradeoffs: `tensions()` across entire corpus
- Trace causality: `why(nodeId)` and `whatIf(nodeId)`
- Find patterns: Query across multiple graphs

---

## Proof of "Computable Substrate"

The query engine demonstrates that FlowScript is **computable substrate for cognitive graphs**, not just notation.

### Operations Impossible with Unstructured Text

**❌ With plain text/prose:**
- Can't automatically trace causal chains
- Can't calculate transitive impact
- Can't guarantee you found all tradeoffs
- Can't compute dependency chains
- Can't reconstruct decision rationale after the fact

**✅ With FlowScript IR:**
- `why()` - Automatic backward causal reasoning
- `whatIf()` - Automatic forward impact calculation
- `tensions()` - Systematic tradeoff extraction
- `blocked()` - Automatic dependency tracking
- `alternatives()` - Structural decision reconstruction

### The Evidence

These queries prove FlowScript enables computational operations on thought structure:

1. **Backward reasoning (why):** Traces causal ancestry automatically
2. **Forward reasoning (whatIf):** Calculates transitive impact
3. **Systematic extraction (tensions):** Finds all tradeoffs with certainty
4. **Lifecycle automation (blocked):** Manages dependencies computationally
5. **Structural recovery (alternatives):** Reconstructs decisions from graph

**= FlowScript is cognitive infrastructure**
**= Not notation, but computable substrate**
**= Mission accomplished ✅**

---

## Technical Details

### Node Types

Queries work across all FlowScript node types:
- `statement`: Facts and observations
- `question`: Open questions
- `alternative`: Decision options
- `decision`: Chosen alternatives (state.decided)
- `goal`: Objectives and targets
- `claim`: Assertions requiring evidence
- `evidence`: Supporting information
- `task`: Work items

### Relationship Types

The engine traverses these relationship types:
- `derives_from` (->): Causal/dependency (bidirectional for why/whatIf)
- `causes` (->): Direct causation
- `temporal` (=>): Sequential ordering
- `tension` (><): Tradeoffs and conflicts
- `supports` (+>): Evidence/claim support
- `contradicts` (->): Logical contradiction

### State Tracking

Queries respect node state:
- `status`: 'pending', 'active', 'completed', 'blocked', 'decided'
- `since`: Timestamp for state (ISO 8601 date)
- `reason`: Rationale for state (blocked/decided)

### Error Handling

The engine throws errors for:
- Node not found: `Node not found: <id>`
- Invalid node type: `Node <id> is not a question (type: <type>)`
- Invalid IR: Validation errors during load
- Missing relationships: Gracefully returns empty results

---

## alternatives() Query - Format Options

The `alternatives()` query supports three output formats via discriminated union types. Each format returns a different TypeScript type, enforced at compile time for type safety.

### Format: 'comparison' (default)

**Purpose:** Full decision analysis with all alternatives, tensions, and decision summary.

**Returns:** `AlternativesResultComparison`

```typescript
const result = engine.alternatives(questionId, {
  format: 'comparison',
  showRejectedReasons: true,
  includeConsequences: true
});

// Type narrowing
if (result.format === 'comparison') {
  console.log('Question:', result.question.content);
  console.log('Chosen:', result.decision_summary.chosen);
  console.log('Rationale:', result.decision_summary.rationale);

  // Show rejection reasoning
  result.alternatives.forEach(alt => {
    if (!alt.chosen && alt.rejection_reasons) {
      console.log(`\n${alt.content} rejected because:`);
      alt.rejection_reasons.forEach(reason => {
        console.log(`  - ${reason}`);
      });
    }
  });
}
```

**Output Structure:**
- `format`: 'comparison' (discriminator)
- `question`: { id, content }
- `alternatives`: AlternativeDetail[]
  - Each alternative includes: id, content, chosen, rationale?, rejection_reasons?, consequences?, tensions?
- `decision_summary`: { chosen, rationale, rejected, key_factors }

### Format: 'simple'

**Purpose:** Minimal summary - just question, options, and chosen answer.

**Returns:** `AlternativesResultSimple`

```typescript
const result = engine.alternatives(questionId, { format: 'simple' });

if (result.format === 'simple') {
  console.log(`Question: ${result.question}`);
  console.log(`Options: ${result.options_considered.join(', ')}`);
  console.log(`Chosen: ${result.chosen}`);
  console.log(`Reason: ${result.reason}`);
}
```

**Output Structure:**
- `format`: 'simple' (discriminator)
- `question`: string (just the question text)
- `options_considered`: string[]
- `chosen`: string | null
- `reason`: string | null

**Example Output:**
```json
{
  "format": "simple",
  "question": "authentication strategy for v1 launch",
  "options_considered": ["JWT tokens", "session tokens + Redis"],
  "chosen": "session tokens + Redis",
  "reason": "security > scaling complexity for v1"
}
```

### Format: 'tree'

**Purpose:** Hierarchical structure showing full consequence trees for each alternative.

**Returns:** `AlternativesResultTree`

```typescript
const result = engine.alternatives(questionId, {
  format: 'tree',
  showRejectedReasons: true
});

if (result.format === 'tree') {
  result.alternatives.forEach(alt => {
    console.log(`\n${alt.content} (chosen: ${alt.chosen})`);

    if (alt.rejection_reasons) {
      console.log('  Rejected because:');
      alt.rejection_reasons.forEach(r => console.log(`    - ${r}`));
    }

    printTree(alt.children, 1);
  });
}

function printTree(children: TreeAlternative[], depth: number) {
  children.forEach(child => {
    console.log('  '.repeat(depth) + '└─', child.content);
    printTree(child.children, depth + 1);
  });
}
```

**Output Structure:**
- `format`: 'tree' (discriminator)
- `question`: { id, content }
- `alternatives`: TreeAlternative[]
  - Recursive structure: id, content, chosen, rejection_reasons?, children[]

**Features:**
- Recursive tree building showing consequence relationships
- Cycle detection (prevents infinite loops)
- Optional rejection reasons at each level

### Type Safety with Discriminated Unions

The discriminated union ensures you **cannot access wrong fields**:

```typescript
const result = engine.alternatives(questionId);

// ❌ TypeScript error - must check format first
console.log(result.decision_summary);  // Error!

// ✅ Correct - type narrowing
if (result.format === 'comparison') {
  console.log(result.decision_summary);  // OK - TypeScript knows this exists
}

if (result.format === 'simple') {
  console.log(result.options_considered);  // OK
  console.log(result.decision_summary);  // Error - doesn't exist on simple format
}
```

**Benefits:**
- Compile-time type checking catches bugs
- IDE autocomplete shows only available fields
- Self-documenting API
- No "maybe exists" fields

### showRejectedReasons Option

Extract reasoning for why alternatives weren't chosen using FlowScript's `thought:` nodes.

**Convention:** Thought nodes that are children (via `causes` relationships) of rejected alternatives are interpreted as rejection reasoning.

**FlowScript Pattern:**
```flowscript
? authentication strategy
|| JWT tokens
  thought: Security team raised concerns about revocation during incident response
  -> stateless architecture
  -> scales horizontally
|| session tokens + Redis
  * [decided(rationale: "security > scaling for v1")] session tokens + Redis
  -> instant revocation capability
```

**TypeScript Usage:**
```typescript
const result = engine.alternatives(questionId, {
  format: 'comparison',  // or 'tree'
  showRejectedReasons: true
});

if (result.format === 'comparison') {
  const jwtAlt = result.alternatives.find(a => a.content === 'JWT tokens');
  if (jwtAlt && jwtAlt.rejection_reasons) {
    console.log('JWT rejected because:', jwtAlt.rejection_reasons);
    // ["Security team raised concerns about revocation during incident response"]
  }
}
```

**How it works:**
1. Query finds rejected alternatives (those without `[decided]` state)
2. Extracts child `thought:` nodes via `causes` relationships
3. Returns thought content as rejection reasons
4. Only added when `showRejectedReasons: true`
5. Never added to chosen alternative (doesn't make semantic sense)

**Why thought nodes?**
- `thought:` markers capture reasoning - exactly what rejection reasons are
- Rejection isn't a lifecycle state - it's just "not chosen" + the reasoning
- Keeps spec clean: states for lifecycle, thoughts for reasoning
- No spec changes needed (thought nodes already exist)

### Migration Guide

**Breaking Change in v1.0:** The `alternatives()` query now returns a discriminated union type instead of a single flexible interface.

**Before (old code):**
```typescript
const result = engine.alternatives(questionId);
console.log(result.decision_summary.chosen);  // Worked, but no type safety
```

**After (new code):**
```typescript
const result = engine.alternatives(questionId);

// Must check format before accessing format-specific fields
if (result.format === 'comparison') {
  console.log(result.decision_summary.chosen);  // Type-safe ✓
}
```

**Why this change?**
- Prevents runtime errors from accessing non-existent fields
- Makes format differences explicit
- TypeScript catches bugs at compile time
- Honest API - clear what each format provides

---

## Further Reading

- **[FlowScript Specification](spec/semantics.md)** - Complete syntax and semantics
- **[IR Schema](spec/ir.schema.json)** - Canonical IR format
- **[Critical Queries Spec](spec/critical_queries_spec.md)** - Detailed query specifications
- **[Toolchain Documentation](TOOLCHAIN.md)** - Parser, linter, CLI
- **[Golden Examples](examples/)** - Reference patterns with IR

---

**FlowScript Query Engine** - Computable operations on cognitive graphs
**Version:** 1.0.0
**License:** MIT
