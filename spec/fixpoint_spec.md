# FlowScript @fix Specification — Fixpoint Computation over Typed Reasoning Graphs

**Version:** 1.0 (Draft)
**Status:** Specification
**Date:** March 27, 2026
**Purpose:** THIS IS THE AUTHORITATIVE DEFINITION of the `@fix` operator — FlowScript's fixpoint combinator for iterative computation over typed reasoning graphs. This document defines the complete formal semantics, syntax, intermediate representation, termination guarantees, convergence properties, audit trail interaction, linter rules, and query interaction for `@fix`.

**Integration:** This spec integrates into the existing FlowScript specification suite:
- `grammar.md` — new productions for `@fix` syntax
- `semantics.md` — Category 8: Computational Operators
- `ir.schema.json` — new `fixpoint` node type and `fixpoint_step` relationship type
- `linter-rules.md` — new rules E007-E009 for @fix validation
- `critical_queries_spec.md` — updated query behavior during and after fixpoint computation
- `golden_examples_spec.md` — Pattern 5: Belief Convergence via @fix

---

## Document Purpose

FlowScript without `@fix` is a representation language — it describes reasoning structures. FlowScript with `@fix` is a computational language — it performs reasoning. The difference is between sheet music and performance. Between a blueprint and a building.

This document specifies the operator that completes that transition.

`@fix` is not an extension bolted onto FlowScript. It is the operator that was always missing — the construct that makes FlowScript's existing five queries (`why`, `what_if`, `tensions`, `blocked`, `alternatives`) not just readable but *derivable*. Every implicit computational pattern already in the system — graduation, garden/prune, consolidation, touch-on-query — is a degenerate case of `@fix`. This spec makes the pattern explicit, composable, and expressible in the notation itself.

**The key architectural decision:** FlowScript stratifies computational power by design. Not three separate layers bolted together — one system with a tunable constraint radius. The constraint determines what `@fix` can do:

| Constraint | Computational Class | Terminates? | Use |
|---|---|---|---|
| `L0` | Term algebra (no @fix) | Always | Compliance audit, interoperability, notation |
| `L1` | Bounded fixpoint (≈ Datalog, PTIME) | Always | Belief propagation, planning, bounded metacognition |
| `L2` | General fixpoint (Turing-complete) | Not guaranteed | Open-ended reasoning, hypothesis generation, creative cognition |

At L0, `@fix` is not available — the graph is pure notation. At L1, `@fix` operates on existing nodes only and is guaranteed to terminate. At L2, `@fix` can create new nodes (Skolemization) and is Turing-complete.

This is not a compromise. It is the only correct architecture. The compliance engine MUST be decidable. The cognitive substrate MUST be as powerful as possible. The notation bridges both.

**Precedent:** SQL did exactly this — core SQL (decidable relational algebra) → WITH RECURSIVE (≈ Datalog, PTIME, terminates on finite data under set semantics) → PL/pgSQL (Turing-complete). FlowScript is the first system to do this intentionally, with stratification as a first-class architectural feature rather than an accidental byproduct of language evolution.

**Formal foundations:**
- Knaster-Tarski theorem (1955): Monotone operators on complete lattices have least fixpoints
- Immerman-Vardi theorem (1982/1986): FO[LFP] captures PTIME on ordered finite structures
- Gurevich-Shelah theorem (1986): Inflationary fixpoint = least fixpoint on finite structures
- Curry-Howard correspondence: A converged fixpoint computation IS a constructive proof; the audit trail IS the proof object
- AGM belief revision (1985): Postulates K*1-K*8 constrain rational belief revision; iterated revision to fixpoint = proof of belief consistency

---

## 1. Semantic Definition

### 1.1 `@fix` — Fixpoint Computation (iterative convergence over typed graph)

**Semantic Definition:**

`@fix` expresses iterative computation over a FlowScript graph that runs until convergence — the point where further iteration produces no new structure. It is the mechanism by which FlowScript transitions from *describing* reasoning to *performing* reasoning.

- **`match`**: A pattern that selects elements from the current graph state. This is the "what to look at" — which nodes, relationships, or subgraph structures are relevant to this computation.
- **`yield`**: A production that specifies what new structure to add to the graph based on matched elements. This is the "what to derive" — new nodes, relationships, or state annotations.
- **`until`**: A termination condition. At L1, this is always satisfiable (guaranteed convergence on finite graphs under monotone rules). At L2, this may require explicit bounds.

Each iteration of `@fix`:
1. Evaluates `match` against the current graph state
2. For each match, evaluates `yield` to produce new graph elements
3. Adds new elements to the graph (inflationary — never removes)
4. Checks `until` condition
5. If not satisfied, repeats from step 1 with the updated graph
6. If satisfied, the computation has reached its fixpoint

**Convergence = no new content-hashes produced in an iteration.** Because FlowScript nodes and relationships are content-hash addressed, producing identical content across iterations naturally deduplicates. An iteration that produces no new hashes has reached fixpoint. This is equivalent to Datalog's semi-naive evaluation: when the delta (new facts) is empty, the computation is complete.

**NOT a loop.** `@fix` is not "do X until Y" in the imperative sense. It is a declarative specification of a convergence goal — "the graph should satisfy these properties, and here's how to derive them." The iteration is the mechanism, not the meaning. The meaning is the fixpoint.

**NOT arbitrary recursion.** `@fix` computes fixpoints over a typed graph — it is constrained by the graph structure, the type system, and the constraint level. At L1, it is provably equivalent to Datalog (PTIME, always terminates). Even at L2, it operates over graph structure, not arbitrary computation.

### 1.2 Constraint Levels

The constraint level is a **per-computation property**, not a global setting. Different `@fix` computations in the same graph can operate at different constraint levels. The constraint is declared in the `@fix` expression and recorded in the audit trail.

#### L0 — Notation (no @fix)

At L0, `@fix` is not available. The graph is pure representation — describing reasoning without performing it. L0 is the compliance floor: every FlowScript expression at L0 is a static description that always terminates (trivially, because no computation occurs).

L0 is the default. You must explicitly opt INTO computation.

#### L1 — Bounded Fixpoint (Datalog-equivalent, PTIME, always terminates)

At L1, `@fix` operates under three restrictions:

1. **Finite domain:** `match` can only reference nodes that already exist in the graph. No new node IDs can be created by `yield`.
2. **Monotone rules:** `yield` can only ADD to the graph — new relationships, new state annotations, new metadata. It cannot remove or modify existing elements.
3. **No value invention:** `yield` cannot introduce content that doesn't derive from matched content. No Skolem constants.

Under these restrictions, the Knaster-Tarski theorem guarantees convergence: the set of possible graph states forms a finite lattice, the @fix operator is monotone on this lattice, and iteration from bottom always reaches the least fixpoint in at most O(n^k) steps, where n is the domain size and k is the maximum rule arity.

**This is not a design choice. It is a mathematical theorem.** L1 @fix computations terminate because the mathematics makes non-termination impossible under these constraints.

The Gurevich-Shelah theorem (1986) further simplifies: on finite structures, inflationary fixpoint (what @fix uses — union with previous state at each step) is expressively equivalent to least fixpoint. We get the simplicity of inflationary semantics with the power of least fixpoint for free.

#### L2 — General Fixpoint (Turing-complete, opt-in)

At L2, the three L1 restrictions are relaxed:

1. **Value invention:** `yield` can create new nodes (Skolem constants) — hypothesized entities that must exist to satisfy the computation but haven't been constructed yet.
2. **Non-monotone operations:** `yield` can mark elements as superseded (though cannot physically delete — FlowScript is append-only by design).
3. **Unbounded domain:** The graph can grow without a priori bound.

At L2, termination is NOT guaranteed. The Halting Problem applies. `@fix` at L2 MUST include one of:
- `max_iterations: N` — hard bound on iteration count
- `timeout: duration` — wall-clock bound
- `measure: function` — user-provided well-founded ordering that decreases with each step (proof of termination)

**When L2 converges:** Every Skolem constant is either grounded (identified with an existing node or instantiated as a concrete new node with full provenance) or explicitly marked as unresolved. The converged graph drops back to L1-equivalent — all elements have concrete identity and the result is auditable.

**When L2 does not converge:** The computation is halted at the bound, the partial result is preserved in the graph with an explicit `fixpoint_status: "diverged"` marker, and the audit trail records the incomplete iteration sequence. This is not a failure — it is information. "This reasoning process did not converge within bounds" is itself a meaningful result.

### 1.3 Key Properties

**Inflationary.** Each iteration takes the union of the previous state with the new derivations. Structure is only added, never removed. This is the formal definition of monotonicity that enables the termination guarantee.

**Deterministic at L1.** Given the same initial graph and the same @fix expression, L1 computation produces the same fixpoint regardless of rule application order. This follows from the Knaster-Tarski theorem — the least fixpoint is unique.

**Content-hash convergence.** Convergence is detected via content hashing — when an iteration produces only nodes and relationships whose content-hashes already exist in the graph, the delta is empty and fixpoint is reached. This leverages FlowScript's existing content-hash addressing.

**Semi-naive evaluation.** Each iteration processes only the delta from the previous iteration — new facts, not all facts. This is the standard optimization from Datalog that reduces complexity from O(n²) to O(n) in typical cases. Required for practical performance.

**Stratified negation.** If `match` includes negative conditions ("no existing tension between X and Y"), the computation must be stratified: positive derivations are computed to fixpoint first, then negative conditions are evaluated against the completed positive stratum. This is how Datalog handles negation safely while maintaining decidability.

**Auditable.** Every iteration step produces audit trail entries. At L1, the complete audit trail IS a constructive proof of the fixpoint (Curry-Howard). At L2, the audit trail records the computation history regardless of convergence.

**Composable.** Multiple `@fix` computations can operate on the same graph, potentially at different constraint levels. Interaction between computations follows stratification — lower-constraint computations complete before higher-constraint ones reference their results.

### 1.4 The Relationship to Existing FlowScript Mechanisms

`@fix` does not replace existing FlowScript mechanisms. It reveals that they are all instances of the same pattern:

| Mechanism | @fix equivalent | Constraint level |
|---|---|---|
| Consolidation Engine | `@fix` with `iterations: 1` | L1 (monotone: ADD/RELATE/RESOLVE) |
| Graduation | `@fix` matching frequency thresholds, yielding tier promotions | L0 (hardcoded, implicit) |
| Garden/Prune | `@fix` matching dormancy, yielding tier demotions | L0 (hardcoded, implicit) |
| Touch-on-Query | Each query IS a fixpoint step (increments frequency, drives graduation) | L0 (implicit) |
| Session Wrap | Human + AI converge on "what matters" — manual fixpoint | Mixed (human-in-loop) |

Making this pattern explicit enables:
- **Custom convergence rules** beyond hardcoded graduation thresholds
- **Belief propagation** across reasoning chains
- **Hypothesis testing** via L2 Skolemization
- **Cross-session reasoning** where @fix resumes from previous fixpoint state
- **Formal proofs of reasoning consistency** via L1 audit trails

---

## 2. Syntax

### 2.1 Grammar (EBNF)

```ebnf
FixpointExpression ::= "@fix" Identifier? FixpointBlock
FixpointBlock      ::= "{" FixpointClause+ "}"
FixpointClause     ::= MatchClause | YieldClause | UntilClause | ConstraintClause

MatchClause        ::= "match" ":" MatchPattern
YieldClause        ::= "yield" ":" YieldProduction
UntilClause        ::= "until" ":" TerminationCondition
ConstraintClause   ::= "constraint" ":" ConstraintLevel

MatchPattern       ::= GraphPattern | QueryReference
YieldProduction    ::= NodeProduction | RelationshipProduction | StateProduction
TerminationCondition ::= "stable" | IterationBound | MeasureFunction | CompoundCondition
ConstraintLevel    ::= "L0" | "L1" | "L2"

IterationBound     ::= "max_iterations" ":" Integer
CompoundCondition  ::= TerminationCondition ("||" TerminationCondition)*

GraphPattern       ::= "{" PatternElement ("," PatternElement)* "}"
PatternElement     ::= NodePattern | RelationshipPattern | NegationPattern
NodePattern        ::= Variable ":" NodeType MatchCondition?
RelationshipPattern ::= Variable RelOp Variable
NegationPattern    ::= "not" PatternElement

QueryReference     ::= "tensions()" | "blocked()" | "alternatives(" Variable ")"
```

### 2.2 Concrete Syntax Examples

**L1 — Belief Propagation:**
```flowscript
@fix propagate_trust {
  match: { A: node -> trusts -> B: node, B -> believes -> P: thought }
  yield: { A -> believes -> P | confidence: derived }
  until: stable
  constraint: L1
}
```

**L1 — Tension Resolution:**
```flowscript
@fix resolve_tensions {
  match: tensions()
  yield: { resolve(matched) | strategy: newer_supersedes }
  until: stable
  constraint: L1
}
```

**L2 — Hypothesis Generation:**
```flowscript
@fix generate_hypotheses {
  match: { X: node, blocked(X), not alternatives(X) }
  yield: { new hypothesis(X) -> resolves -> X }
  until: stable || max_iterations: 50
  constraint: L2
}
```

### 2.3 Invalid Syntax

```flowscript
# WRONG: @fix without constraint level
@fix resolve {
  match: tensions()
  yield: { resolve(matched) }
  until: stable
}
# Use: always declare constraint level explicitly.
# Default is NOT provided — this is intentional.
# You must know what computational regime you're in.

# WRONG: L1 with value invention (new nodes)
@fix hypothesize {
  match: { X: node, blocked(X) }
  yield: { new hypothesis -> resolves -> X }
  until: stable
  constraint: L1
}
# Use: constraint: L2. Creating new nodes requires L2.

# WRONG: L2 without termination bound
@fix explore {
  match: { X: node }
  yield: { new derived(X) -> extends -> X }
  until: stable
  constraint: L2
}
# Use: until: stable || max_iterations: 100
# L2 MUST include an explicit bound. "stable" alone is
# insufficient because L2 convergence is not guaranteed.
```

---

## 3. Intermediate Representation

### 3.1 IR Extensions

`@fix` introduces two new elements to the IR schema:

**New node type: `fixpoint`**

A `fixpoint` node represents a completed (or halted) @fix computation. It contains:

```json
{
  "id": "<content-hash>",
  "type": "fixpoint",
  "content": "<human-readable description of the fixpoint computation>",
  "provenance": { "source_file": "...", "line_number": 42 },
  "ext": {
    "fix": {
      "name": "propagate_trust",
      "constraint": "L1",
      "status": "converged | diverged | bounded",
      "iterations": 7,
      "delta_sequence": [12, 8, 3, 1, 0],
      "initial_graph_hash": "<hash of graph state before @fix>",
      "final_graph_hash": "<hash of graph state after @fix>",
      "match_pattern": "<serialized match clause>",
      "yield_production": "<serialized yield clause>",
      "until_condition": "<serialized until clause>"
    }
  }
}
```

**New relationship type: `fixpoint_derived`**

Every node or relationship produced by an @fix iteration carries a `fixpoint_derived` relationship linking it to the `fixpoint` node. This provides complete provenance: "this fact was derived by this fixpoint computation at iteration N."

```json
{
  "id": "<content-hash>",
  "type": "fixpoint_derived",
  "source": "<id of derived element>",
  "target": "<id of fixpoint node>",
  "ext": {
    "iteration": 3,
    "constraint": "L1"
  }
}
```

### 3.2 Graph Invariants

New invariants added to the graph:

- **`fixpoint_constraint_valid`**: Every `fixpoint` node's constraint level is consistent with its derivations — L1 fixpoints produce no new node IDs (only new relationships/states on existing nodes), L2 fixpoints may produce new node IDs.
- **`fixpoint_convergence_valid`**: Every `fixpoint` node with `status: "converged"` has `delta_sequence` ending in 0 (no new hashes in final iteration).
- **`fixpoint_bound_present`**: Every `fixpoint` node with `constraint: "L2"` has an explicit termination bound in `until_condition`.

---

## 4. Linter Rules

### E007: fixpoint-constraint-violation

**Severity:** ERROR

**Specification:** An `@fix` computation at constraint level L1 MUST NOT produce new node IDs. If `yield` would create a node whose content-hash does not match any existing node, this is a constraint violation.

**Rationale:** L1's termination guarantee depends on operating over a finite, fixed domain. Creating new nodes expands the domain and breaks the guarantee. This is the formal boundary between decidable and undecidable computation. It's not a style preference — it's the Halting Problem.

**Detection:** During @fix execution, check every node produced by `yield`. If its content-hash is not in the pre-existing node set AND constraint is L1, emit E007.

**Error message:**
```
E007 fixpoint-constraint-violation at line {line}
  @fix "{name}" at constraint L1 produced new node ID {hash}
  L1 computations must operate on existing nodes only.
  To create new nodes, use constraint: L2 with explicit bounds.
```

### E008: fixpoint-l2-missing-bound

**Severity:** ERROR

**Specification:** An `@fix` computation at constraint level L2 MUST include an explicit termination bound: `max_iterations`, `timeout`, or `measure`.

**Rationale:** L2 is Turing-complete. Termination is not guaranteed. An explicit bound is the developer's assertion: "I accept that this may not converge, and here's my safety net." Without a bound, a non-converging L2 computation runs forever.

**Error message:**
```
E008 fixpoint-l2-missing-bound at line {line}
  @fix "{name}" at constraint L2 has no explicit termination bound.
  L2 computations MUST include: max_iterations, timeout, or measure.
  "stable" alone is insufficient — L2 convergence is not guaranteed.
```

### E009: fixpoint-missing-constraint

**Severity:** ERROR

**Specification:** Every `@fix` expression MUST declare an explicit constraint level.

**Rationale:** The constraint level is not a default — it's a decision. You must know whether your computation is decidable (L1) or Turing-complete (L2). There is no safe default. L1 is safe but limited. L2 is powerful but unsafe. The developer must choose.

**Why this is ERROR, not WARNING:** An unlabeled computation cannot be validated, cannot be audited with correct guarantees, and cannot be referenced by compliance checks. This is a structural requirement, not a preference.

**Error message:**
```
E009 fixpoint-missing-constraint at line {line}
  @fix "{name}" has no constraint level declared.
  Every @fix computation MUST declare: constraint: L0 | L1 | L2
  There is no default. You must know your computational regime.
```

### W004: fixpoint-high-iteration-count

**Severity:** WARNING

**Specification:** An `@fix` computation that exceeds 100 iterations without converging SHOULD be reviewed. This is not an error — some computations legitimately require many iterations. But high iteration counts may indicate an incorrect match/yield pattern.

---

## 5. Audit Trail Interaction

### 5.1 New Audit Event Types

`@fix` introduces three new audit event types:

| Event Type | When Emitted | Fields |
|---|---|---|
| `fixpoint_start` | At the beginning of @fix execution | name, constraint, match_pattern, initial_graph_hash |
| `fixpoint_iteration` | After each iteration step | iteration_number, delta_size, new_hashes[], elapsed_ms |
| `fixpoint_end` | At convergence or termination | status (converged/diverged/bounded), total_iterations, final_graph_hash, delta_sequence |

### 5.2 The Proof Object

At L1, the complete audit trail of an @fix computation IS a constructive proof:

- **Theorem:** The converged graph state is consistent under the match/yield rules
- **Proof steps:** Each `fixpoint_iteration` entry shows what was derived and how
- **Proof termination:** The `fixpoint_end` entry with `status: "converged"` and delta = 0
- **Proof verification:** Re-execute the @fix on the initial graph state — deterministic L1 computation must produce identical hash chain

This is the Curry-Howard correspondence applied to reasoning graphs. Under Curry-Howard, a program of type τ is a proof of proposition τ. A terminating L1 @fix computation that produces a consistent graph state is a proof of that state's consistency. Not metaphorically. Formally.

### 5.3 Lossless Reconstruction (L1)

The L0 audit record of an L1 computation is lossless — it contains exactly enough information to reconstruct the L1 computation. This follows from:

1. The initial graph hash identifies the starting state exactly (content-hash addressing)
2. Each iteration's delta (new hashes) records exactly what was derived
3. The final graph hash identifies the converged state exactly
4. L1 computations are deterministic (unique least fixpoint on finite structures)

A compliance auditor can verify an L1 fixpoint computation by replaying the audit trail and checking that each iteration's delta matches. This is not "auditing a log" — it is "verifying a mathematical proof."

For L2 computations, the audit trail is not lossless (non-determinism from Skolemization, potential non-convergence). The audit trail records what happened but cannot guarantee reconstruction.

---

## 6. Query Interaction

### 6.1 Queries During @fix Execution

During an @fix computation, the five existing queries operate on the *current* graph state at each iteration:

- **`tensions()`** in a `match` clause: Returns tensions as of the current iteration. As @fix resolves tensions, subsequent iterations see fewer.
- **`blocked()`** in a `match` clause: Returns blocked nodes as of the current iteration.
- **`why(nodeId)`** on a fixpoint-derived node: Traces provenance through `fixpoint_derived` relationships back to the originating @fix computation and iteration.
- **`what_if(nodeId)`** on a node modified by @fix: Shows forward consequences including fixpoint-derived elements.

### 6.2 Queries After @fix Completion

After an @fix computation completes:

- **`why(nodeId)`** for any fixpoint-derived node traverses backward through `fixpoint_derived` → `fixpoint` node → original `match` sources. The complete causal chain is preserved.
- **`tensions()`** reflects the post-fixpoint graph state — resolved tensions no longer appear (they carry `resolved` state markers), new tensions derived by @fix DO appear.
- **All queries see the converged graph.** The fixpoint IS the graph state. There is no "before @fix" vs "after @fix" distinction in the query results — only in the audit trail, which preserves the full history.

---

## 7. Formal Properties Summary

| Property | L0 | L1 | L2 |
|---|---|---|---|
| @fix available | No | Yes | Yes |
| Creates new nodes | — | No | Yes (Skolemization) |
| Terminates | Trivially (no computation) | Always (Knaster-Tarski) | Not guaranteed |
| Deterministic | Yes | Yes (unique least fixpoint) | No (Skolem choice) |
| Audit trail | Static description | Constructive proof | Computation history |
| Audit reconstruction | Trivial | Lossless | Lossy |
| Complexity (data) | O(1) | O(n^k) — PTIME | Undecidable |
| Formal class | Term algebra | FO[LFP] ≈ Datalog | Turing-complete |

---

## 8. Design Rationale

### Why stratify at all?

Because the compliance engine MUST be decidable and the cognitive substrate MUST be as powerful as possible. Every predecessor system forced a choice — either decidable (and limited) or powerful (and unauditable). FlowScript refuses the choice. One notation, one graph, tunable constraint radius.

### Why not just use L2 with gas (like Solidity)?

Gas provides *practical* termination (every computation eventually runs out of gas) but not *formal* termination guarantees. A gas-bounded computation might terminate for the wrong reasons — running out of gas before reaching the correct fixpoint. L1 doesn't just terminate — it terminates AT the correct answer. The termination is a mathematical property of the computation, not an external resource limit.

### Why is constraint level required, not defaulted?

Because the choice between decidable and Turing-complete computation is too consequential to be a default. Defaulting to L1 would silently limit developers. Defaulting to L2 would silently remove compliance guarantees. The developer must choose, and the choice is recorded in the audit trail. This is intentional. Structure forces clarity.

### Why inflationary semantics?

Because the Gurevich-Shelah theorem tells us we get least-fixpoint power for free with inflationary semantics on finite structures. Inflationary (only add, never remove) is simpler to implement, simpler to audit, and exactly as expressive as least fixpoint on FlowScript's finite graphs. There is no reason to choose the more complex option.

### Why content-hash convergence?

Because FlowScript already uses content-hash addressing for deduplication. Convergence detection via "no new hashes" is not an additional mechanism — it's a consequence of the existing architecture. The system was already built for this.

---

## Next Steps

**Integration into existing spec files:**
1. `grammar.md` — Add @fix productions to EBNF and Ohm grammar
2. `semantics.md` — Add Category 8: Computational Operators
3. `ir.schema.json` — Add `fixpoint` node type, `fixpoint_derived` relationship type, graph invariants
4. `linter-rules.md` — Add E007, E008, E009, W004
5. `critical_queries_spec.md` — Update query behavior for fixpoint-derived elements
6. `golden_examples_spec.md` — Add Pattern 5: Belief Convergence via @fix
7. `grammar.ohm` — Implement parser rules
8. Update "21 markers" count to "22 markers" throughout all documents

**Implementation:**
1. Python SDK: Generalize ConsolidationEngine into fixpoint engine with constraint parameter
2. TypeScript SDK: Add @fix to parser, IR types, and Memory class
3. Audit trail: Add three new event types (fixpoint_start, fixpoint_iteration, fixpoint_end)
4. Linter: Implement E007-E009 and W004

---

*FlowScript @fix Specification v1.0 (Draft)*
*March 27, 2026*
*"The compliance engine should be decidable. The cognitive substrate should be as powerful as possible. The notation bridges both."*
