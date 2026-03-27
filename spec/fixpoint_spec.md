# FlowScript @fix Specification — Fixpoint Computation over Typed Reasoning Graphs

**Version:** 2.0
**Status:** Specification
**Date:** March 27, 2026
**Purpose:** THIS IS THE AUTHORITATIVE DEFINITION of the `@fix` operator — FlowScript's fixpoint combinator for iterative computation over typed reasoning graphs. This document defines the complete formal semantics, syntax, intermediate representation, termination guarantees, convergence properties, audit trail interaction, linter rules, query interaction, and mathematical foundations for `@fix`.

**Integration:** This spec integrates into the existing FlowScript specification suite:
- `grammar.md` — new productions for `@fix` syntax
- `semantics.md` — Category 8: Computational Operators
- `ir.schema.json` — new `fixpoint` node type and `fixpoint_derived` relationship type
- `linter-rules.md` — new rules E007-E011 for @fix validation
- `critical_queries_spec.md` — updated query behavior during and after fixpoint computation
- `golden_examples_spec.md` — Pattern 5: Belief Convergence via @fix

---

## Document Purpose

FlowScript without `@fix` is a representation language — it describes reasoning structures. FlowScript with `@fix` is a computational language — it performs reasoning.

`@fix` is the operator that was always missing. Every implicit computational pattern already in the system — graduation, garden/prune, consolidation, touch-on-query — is a degenerate case of `@fix`. This spec makes the pattern explicit, composable, and expressible in the notation itself.

**The key architectural decision:** FlowScript is a computational metamaterial — one system with a tunable constraint radius, not three separate layers bolted together. The constraint determines what `@fix` can do, and it can vary *within* a single computation through nested `@fix` expressions. An L1 computation that needs creative generation can spawn a bounded L2 sub-computation, whose results ground back into the L1 domain. Same notation. Same graph. Constraint radius varies spatially across the computation.

| Constraint | Computational Class | Terminates? | Use |
|---|---|---|---|
| `L0` | Term algebra (no @fix) | Always | Compliance audit, interoperability, notation |
| `L1` | Bounded fixpoint (PTIME on finite structures) | Always | Belief propagation, planning, bounded metacognition |
| `L2` | General fixpoint (Turing-complete) | Not guaranteed | Hypothesis generation, abductive reasoning, creative cognition |

**Precedent:** SQL achieved this same stratification — core SQL (decidable relational algebra) → WITH RECURSIVE (Datalog-equivalent, terminates on finite data under set semantics) → PL/pgSQL (Turing-complete). Smart contracts independently discovered the same principle (Clarity = decidable, Solidity = TC with gas). FlowScript is the first system to implement this stratification intentionally, with constraint modulation as a first-class architectural feature.

**Formal foundations:**
- Knaster-Tarski theorem (1955): Monotone operators on complete lattices have least fixpoints
- Finite ascending chain condition: On finite lattices, iterated application from bottom converges
- Gurevich-Shelah theorem (1986): Inflationary fixpoint has equivalent expressive power to least fixpoint on finite structures
- Abiteboul-Hull-Vianu (1995): Datalog with value invention is Turing-complete
- AGM belief revision (1985): Postulates K*1-K*8 constrain rational belief revision; iterated revision to fixpoint = proof of belief consistency

---

## 1. Semantic Definition

### 1.1 `@fix` — Fixpoint Computation (iterative convergence over typed graph)

**Semantic Definition:**

`@fix` expresses iterative computation over a FlowScript graph that runs until convergence — the point where further iteration produces no new structure. It is the mechanism by which FlowScript transitions from *describing* reasoning to *performing* reasoning.

- **`match`**: A pattern that selects elements from the current graph state. This is the "what to look at" — which nodes, relationships, or subgraph structures are relevant to this computation.
- **`yield`**: A production that specifies what new structure to add to the graph based on matched elements. This is the "what to derive" — new relationships, state annotations, or (at L2) new nodes.
- **`until`**: A termination condition that determines when the computation has reached its fixpoint.
- **`constraint`**: The computational regime — L1 (bounded, always terminates) or L2 (general, Turing-complete, requires explicit bounds).

Each iteration of `@fix`:
1. Evaluates `match` against the current graph state
2. For each match, evaluates `yield` to produce new graph elements
3. Adds new elements to the graph (inflationary — union with previous state)
4. Computes the **delta**: the set of newly produced content-hashes not present before this iteration
5. Checks `until` condition (at minimum: delta = ∅ implies convergence)
6. If not satisfied, repeats from step 1 using ONLY the delta as input (semi-naive evaluation)
7. If satisfied, the computation has reached its fixpoint

**Definition — Convergence:** A `@fix` computation has converged when the current iteration produces zero new content-hashes. Because FlowScript nodes and relationships are content-hash addressed, producing identical content across iterations naturally deduplicates. An iteration with empty delta has reached fixpoint.

**Definition — Delta:** The delta of iteration *i* is the set of content-hashes produced by `yield` in iteration *i* that were not present in the graph at the start of iteration *i*. Formally: δᵢ = hashes(yield(match(Gᵢ))) \ hashes(Gᵢ), where Gᵢ is the graph state at the start of iteration *i*.

**Definition — Semi-naive evaluation:** Each iteration processes only the delta from the previous iteration, not the entire graph. Iteration *i+1* evaluates `match` only against elements in δᵢ and their immediate graph neighborhood. This is the standard optimization from Datalog that reduces per-iteration cost from O(|G|) to O(|δ|).

**Zero-match case:** If `match` produces zero results on the first iteration, the computation converges immediately with `iterations: 0` and `delta_sequence: [0]`. A fixpoint node is still created to record that the computation was attempted and trivially converged.

**NOT a loop.** `@fix` is not "do X until Y" in the imperative sense. It is a declarative specification of a convergence goal. The iteration is the mechanism, not the meaning. The meaning is the fixpoint.

### 1.2 Constraint Levels as Tunable Radius

The constraint level is NOT a global flag. It is a **per-computation property that can vary within a single reasoning process** through nested `@fix` expressions. Different `@fix` computations — including nested ones — can operate at different constraint levels. The constraint is declared in each `@fix` expression and recorded in the audit trail.

This is the metamaterial property: one graph, one notation, spatially varying constraint radius. The audit trail records the constraint at every point, so a compliance auditor can verify: "this region of the computation never exceeded L1."

#### L0 — Notation (no @fix)

At L0, `@fix` is not available. The graph is pure representation. L0 is the compliance floor: every FlowScript expression at L0 is a static description that trivially terminates because no computation occurs. L0 is the default constraint level for the graph itself.

#### L1 — Bounded Fixpoint (always terminates)

At L1, `@fix` operates under three restrictions:

1. **Closed domain:** `yield` may only reference existing node IDs as sources and targets of new relationships. Any new relationship must connect existing nodes. Any state annotation must apply to an existing node. No new node IDs may be created.
2. **Inflationary semantics:** `yield` can only ADD to the graph — new relationships, new state annotations, new metadata in `ext` bags. It cannot remove or modify existing elements. Each iteration takes the union of the previous state with new derivations.
3. **No Skolemization:** `yield` cannot create new node identifiers. Content transformation is irrelevant — the restriction is on the *identity* of produced elements, not their content.

**Termination guarantee:** Under these restrictions, the set of all possible graph annotations (relationships, state markers, metadata) over the fixed node set, ordered by set inclusion, forms a **finite complete lattice** (it is the power set of a finite set, which is always a complete lattice). The `@fix` operator is monotone on this lattice (inflationary semantics guarantee monotonicity). By the **finite ascending chain condition**, iterated application from the empty annotation set converges to a fixpoint in at most |L| steps, where |L| is bounded by O(n^k) — n being the number of nodes and k the maximum arity of match patterns.

This is a mathematical property of the architecture, not a runtime check. L1 computations terminate because the mathematics makes non-termination impossible under these constraints.

The Gurevich-Shelah theorem (1986) further confirms: on finite structures, inflationary fixpoint has the same expressive power as least fixpoint. We get the simplicity of inflationary semantics with the definability of least fixpoint.

#### L2 — General Fixpoint (the generative layer)

L2 is where creative cognition happens. It is not "L1 with restrictions relaxed" — it is a fundamentally different mode of computation. L1 is deductive (premise-first: what follows from what exists). L2 is abductive (hypothesis-first: what MUST exist to explain what we observe).

At L2, the three L1 restrictions are lifted:

1. **Skolemization:** `yield` can create new nodes — hypothesized entities that must exist to satisfy the computation but haven't been constructed yet. These are Skolem constants: names for things whose existence is required but whose identity is not yet determined.
2. **Non-monotone annotations:** `yield` can mark elements as superseded (though FlowScript is append-only — supersession adds a marker, it doesn't delete).
3. **Unbounded domain:** The graph can grow without a priori bound.

Datalog with value invention (Skolemization) is Turing-complete (Abiteboul, Hull, and Vianu, *Foundations of Databases*, 1995). The Halting Problem therefore applies to L2: termination is undecidable in general.

L2 `@fix` MUST include an explicit termination bound:
- `max_iterations: N` — hard bound on iteration count
- `timeout: duration` — wall-clock bound
- `measure: function` — user-provided decreasing measure (proof of termination)

**When L2 converges:** Every Skolem constant is either identified with an existing node (the hypothesis was about something already known under a different name) or instantiated as a concrete new node with full provenance (the hypothesis generated genuine new structure). The converged result is fully grounded — auditable, queryable, L1-compatible.

**When L2 does not converge:** The computation halts at the bound. The partial result is preserved with an explicit `fixpoint_status: "bounded"` marker. The audit trail records the incomplete iteration sequence. This is not a failure — "this reasoning did not converge within bounds" is itself meaningful information.

**Skolemization is anticipation, not risk.** In music, anticipation plays a note that resolves a beat early — creating dissonance against the present but momentum toward the future. Skolem constants work the same way: they create temporary ungroundedness that drives the computation toward resolution. Without Skolemization, agents can reason about what exists but cannot hypothesize about what COULD exist. L2 is the essential generative mechanism. L1 is the discipline that makes the generation auditable.

#### Nested @fix — Constraint Modulation

The metamaterial property emerges from nesting. An L1 computation can CONTAIN bounded L2 sub-computations:

```flowscript
@fix resolve_policy {
  match: { P: policy -> blocks -> G: goal, not grounded(P) }
  yield: {
    @fix hypothesize {
      match: { P, context(P) }
      yield: { new hypothesis -> grounds -> P }
      until: grounded(P) or max_iterations: 10
      constraint: L2
    }
  }
  until: stable
  constraint: L1
}
```

**Semantics of nesting:**
- The outer @fix is L1 — bounded, always terminates
- When it encounters a match that requires creative generation, it spawns an inner L2 @fix
- The inner L2 runs with its own explicit bounds (`max_iterations: 10`)
- When the inner @fix converges or bounds, its grounded results become concrete elements in the outer L1 graph
- The outer L1 continues with these grounded results as new facts

**Termination of nested computation:** The outer L1 terminates because:
1. L1 iterates at most O(n^k) times (finite ascending chain)
2. Each inner L2 is individually bounded (required by E008)
3. Total work ≤ O(n^k) × inner_bound = finite

The constraint radius varies spatially: the outer computation is decidable, the inner sub-computation is Turing-complete (but bounded). The audit trail records the constraint at every level, so compliance verification can distinguish L1 regions from L2 regions within the same computation.

**Constraint monotonicity rule:** A nested `@fix` MUST have a constraint level ≥ its parent. An L2 computation cannot contain an L1 sub-computation that it treats as decidable — L1 guarantees only hold when the entire environment is L1. The reverse is safe: L1 can contain bounded L2 because the L1 discipline governs overall termination. (Formally: constraint levels form a total order L0 < L1 < L2, and nesting escalates or preserves, never de-escalates.)

### 1.3 Key Properties

**Inflationary.** Each iteration takes the union of the previous state with new derivations. Structure is only added, never removed. This is the formal requirement for monotonicity on the annotation lattice.

**Fixpoint uniqueness (L1).** Given the same initial graph and the same @fix expression, L1 computation produces a unique fixpoint. This follows from the Knaster-Tarski theorem — the least fixpoint of a monotone operator on a complete lattice is unique. The delta sequence (per-iteration derivation counts) may vary with rule application order (semi-naive evaluation processes deltas, and delta contents depend on order), but the final converged state is identical regardless.

**Content-hash convergence.** Convergence is detected via content hashing. An iteration with δ = ∅ (no new hashes) has reached fixpoint. This leverages FlowScript's existing content-hash addressing. For convergence detection, content-hashes are computed over semantic content only — iteration-specific metadata (iteration number in `fixpoint_derived.ext.iteration`) is excluded from the hash.

**Semi-naive evaluation (REQUIRED).** Each iteration processes only the delta from the previous iteration. This is the standard Datalog optimization. Without it, per-iteration cost is O(|G|). With it, per-iteration cost is O(|δ|). Required for practical performance.

**Stratified negation.** If `match` includes negative conditions (`not` patterns), the computation must be stratified: positive derivations within each stratum are computed to fixpoint first, then negative conditions are evaluated against the completed positive stratum before the next stratum begins.

Formally: partition the match/yield rules by negation dependency. If rule R₁'s yield feeds positively into rule R₂'s match, they are in the same stratum. If R₁'s yield feeds into a `not` in R₂'s match, R₁ must be in a strictly lower stratum. Within each stratum, compute the fixpoint without negation. This is the standard stratification from Datalog with negation (Apt, Blair, Walker, 1988).

If no valid stratification exists (cyclic negation dependency), the program is rejected (E010).

**Composition.** Multiple `@fix` computations can operate on the same graph, including nested. Constraint levels form a total order (L0 < L1 < L2). The effective constraint of a composition is the join (maximum) of its components: L1 composed with L2 has effective constraint L2. Sequential @fix computations within the same constraint level compose — the fixpoint of the composition equals the fixpoint of the union of their rules (by the modularity of Datalog evaluation on shared domains).

**Idempotency.** Running an L1 @fix computation on a graph that already contains its fixpoint is idempotent: the least fixpoint is already reached, so the first iteration produces δ = ∅ and the computation converges immediately with `iterations: 0`. This follows directly from the definition of fixpoint.

**Auditable.** Every iteration step produces audit trail entries. The audit trail of an L1 computation serves as a verifiable certificate: given the initial graph and the match/yield rules, the delta sequence constitutes a constructively checkable proof that the fixpoint was correctly reached. An independent verifier can replay the computation on the initial graph state and confirm identical convergence. For L2 computations, the audit trail records the computation history regardless of convergence.

### 1.4 Relationship to Existing FlowScript Mechanisms

`@fix` does not replace existing FlowScript mechanisms. It reveals that they are all instances of the same pattern:

| Mechanism | @fix equivalent | Constraint |
|---|---|---|
| Consolidation Engine | `@fix` with `iterations: 1` | L1 |
| Graduation | `@fix` matching frequency ≥ threshold, yielding tier promotion | L0 (hardcoded) |
| Garden/Prune | `@fix` matching dormancy > threshold, yielding tier demotion | L0 (hardcoded) |
| Touch-on-Query | Each query IS a fixpoint step (increments frequency, drives graduation) | L0 (implicit) |
| Session Wrap | Human + AI converge on "what matters" — manual fixpoint | Mixed |

Making this pattern explicit enables custom convergence rules, belief propagation across reasoning chains, hypothesis testing via L2 Skolemization, and formal proofs of reasoning consistency via L1 audit trails.

### 1.5 Mathematical Foundations

This section provides the category-theoretic and type-theoretic foundations for readers who want the full formal picture. It is not required for implementation but grounds the design decisions.

#### Enriched Category Structure

FlowScript's constraint levels correspond to three enrichments of the same underlying category. The objects are graph nodes. The morphisms are relationships. What changes across constraint levels is the *hom-object* — the structure measuring how nodes relate:

- **L0:** Enriched over the free monoid (term algebra). Morphisms are descriptions. Composition is concatenation. No computational content.
- **L1:** Enriched over a finite bounded semilattice (Datalog-equivalent). Morphisms carry derivation content. The semilattice structure guarantees a unique least fixpoint, reachable in finite steps.
- **L2:** Enriched over Set (or a topos with internal logic). Morphisms carry arbitrary computational content. Skolemization introduces new objects, not just new morphisms.

The transitions between levels are **changes of enrichment base** (Kelly, *Basic Concepts of Enriched Category Theory*, 1982). The forgetful functor L1 → L0 drops computational content, retaining only the static description. The forgetful functor L2 → L1 restricts to the closed domain (existing nodes only), dropping Skolem constants.

These forgetful functors have **left adjoints**: the free fixpoint construction. Given a static L0 graph, the left adjoint produces the minimal L1 computation over it (which is the empty computation — no derivations needed). The adjunction is what makes L1 → L0 audit reconstruction lossless: the L0 audit trail of an L1 computation, combined with the initial graph and the rules, uniquely determines the L1 computation (because the least fixpoint is unique on finite lattices).

For L2 → L0, the audit trail is lossy: Turing-complete computations may not terminate, Skolem choices introduce non-determinism, and the fixpoint (if it exists) may not be unique.

#### Type-Theoretic Perspective

In a type-theoretic framing, constraint levels correspond to monads:
- L0 expressions are **pure** — no computational effects
- L1 expressions inhabit a **bounded-reasoning monad** — effects are derivations that provably terminate
- L2 expressions inhabit an **open-reasoning monad** — effects include Skolemization and potential non-termination

The constraint level of a computation is tracked by its type. An L1 fixpoint returns `Converged<Graph>` — the type guarantees convergence. An L2 fixpoint returns `Result<Graph, Bounded>` — the type reflects that convergence is not guaranteed.

This distinction should be reflected in the IR: L1 fixpoint nodes have status restricted to `converged` only (non-convergence is unrepresentable). L2 fixpoint nodes have status `converged | bounded`. The linter enforces this at the type level, not as a runtime check.

#### Universal Property

`@fix` computes the **initial algebra** of the endofunctor defined by match/yield. At L1, the initial algebra is the least fixpoint (Lambek's lemma: the initial algebra of an endofunctor on a category with an initial object is a fixpoint). At L2, when the computation converges, it produces an initial algebra; when it doesn't converge (bounds hit), it produces a **final coalgebra observation** — a finite window into a potentially infinite computation. This is why L1 fixpoints are deterministic (initial algebras are unique up to isomorphism) and L2 fixpoints may not be (coalgebras admit multiple observations of the same structure).

#### Curry-Howard Connection

The full Curry-Howard correspondence requires a typed proof calculus that FlowScript does not define. However, the audit trail of an L1 computation serves as a **verifiable certificate** in the following precise sense:

Given:
- An initial graph state G₀ (identified by content-hash)
- A set of match/yield rules R
- An audit trail recording δ₀, δ₁, ..., δₙ where δₙ = ∅

A verifier can:
1. Reconstruct G₀ from the hash
2. Apply R to G₀, verify the produced delta matches δ₀
3. Apply R to G₀ ∪ δ₀, verify the produced delta matches δ₁
4. Continue until δₙ = ∅
5. Confirm the final graph hash matches the recorded final hash

If all steps verify, the certificate proves: "the fixpoint was correctly computed from these rules on this initial state." This is a constructively checkable proof — the verifier performs concrete computation at each step. The audit trail IS the proof object in this operational sense.

---

## 2. Syntax

### 2.1 Grammar (EBNF)

Production names follow existing `grammar.md` conventions (lowercase with underscores).

```ebnf
fixpoint_expression  ::= "@fix" identifier? fixpoint_block
fixpoint_block       ::= "{" fixpoint_clause+ "}"
fixpoint_clause      ::= match_clause | yield_clause | until_clause | constraint_clause

match_clause         ::= "match" ":" match_body
yield_clause         ::= "yield" ":" yield_body
until_clause         ::= "until" ":" termination_condition
constraint_clause    ::= "constraint" ":" constraint_level

constraint_level     ::= "L1" | "L2"

(* Match patterns *)
match_body           ::= "{" pattern_element ("," pattern_element)* "}"
                       | query_reference
pattern_element      ::= path_pattern | node_pattern | negation_pattern
path_pattern         ::= node_pattern ("->" identifier "->" node_pattern)+
node_pattern         ::= variable ":" node_type match_condition?
match_condition      ::= "(" predicate ("," predicate)* ")"
negation_pattern     ::= "not" (node_pattern | query_reference)
query_reference      ::= query_name "(" argument_list? ")"
query_name           ::= "tensions" | "blocked" | "alternatives" | "why" | "what_if"
argument_list        ::= argument ("," argument)*
argument             ::= variable | string_literal

(* Yield productions *)
yield_body           ::= "{" yield_element ("," yield_element)* "}"
                       | nested_fix
                       | builtin_action
yield_element        ::= relationship_production | state_production | node_production
relationship_production ::= variable "->" identifier "->" variable annotation*
node_production      ::= "new" identifier "(" argument_list? ")" annotation*
state_production     ::= "resolve" "(" variable ")" annotation*
                       | "annotate" "(" variable ")" annotation*
annotation           ::= "|" identifier ":" value
nested_fix           ::= fixpoint_expression
builtin_action       ::= "resolve" "(" "matched" ")" annotation*

(* Termination conditions *)
termination_condition ::= "stable" | iteration_bound | timeout_bound
                        | measure_ref | compound_condition
stable               ::= "stable"
iteration_bound      ::= "max_iterations" ":" integer
timeout_bound        ::= "timeout" ":" duration
duration             ::= integer time_unit
time_unit            ::= "ms" | "s" | "m"
measure_ref          ::= "measure" ":" identifier
compound_condition   ::= termination_condition ("or" termination_condition)+

(* Primitives *)
variable             ::= uppercase_letter (letter | digit | "_")*
identifier           ::= letter (letter | digit | "_")*
node_type            ::= "node" | "thought" | "question" | "decision" | "blocker"
                       | "action" | "statement" | "insight" | "completion"
                       | "alternative" | "exploring" | "parking"
predicate            ::= identifier "(" argument_list? ")"
value                ::= identifier | string_literal | integer
```

**Key design notes:**
- `constraint_level` does NOT include `L0`. L0 means @fix is unavailable — writing `@fix` with `constraint: L0` is contradictory. See E011.
- Compound conditions use `or` keyword (not `||`, which is the existing alternative marker).
- `nested_fix` in `yield_body` enables constraint modulation — an L1 yield can contain an L2 sub-computation.
- `path_pattern` captures chained node-relationship-node patterns as a single production.
- `stable` is defined as `δ = ∅` (current iteration produced zero new content-hashes). At L1, `stable` alone is sufficient (convergence guaranteed). At L2, `stable` alone is insufficient and must be combined with an explicit bound (E008).

### 2.2 Concrete Syntax Examples

**L1 — Belief Propagation:**
```flowscript
@fix propagate_trust {
  match: { A: node -> trusts -> B: node, B: node -> believes -> P: thought }
  yield: { A -> believes -> P | confidence: derived }
  until: stable
  constraint: L1
}
```

**L1 — Tension Resolution:**
```flowscript
@fix resolve_tensions {
  match: tensions()
  yield: resolve(matched) | strategy: newer_supersedes
  until: stable
  constraint: L1
}
```

**L2 — Hypothesis Generation:**
```flowscript
@fix generate_hypotheses {
  match: { X: node(blocked(X)), not alternatives(X) }
  yield: { new hypothesis(X) -> resolves -> X }
  until: stable or max_iterations: 50
  constraint: L2
}
```

**Nested — L1 with L2 Sub-computation (the metamaterial):**
```flowscript
@fix resolve_policy {
  match: { P: decision(not grounded(P)) -> blocks -> G: node }
  yield: {
    @fix hypothesize {
      match: { P, context(P) }
      yield: { new candidate(P) -> grounds -> P | source: abductive }
      until: grounded(P) or max_iterations: 10
      constraint: L2
    }
  }
  until: stable
  constraint: L1
}
```

### 2.3 Invalid Syntax

```flowscript
# WRONG: @fix without constraint level
@fix resolve {
  match: tensions()
  yield: resolve(matched)
  until: stable
}
# Use: always declare constraint level explicitly.
# There is no default. You must know your computational regime.

# WRONG: L1 with node creation
@fix hypothesize {
  match: { X: node(blocked(X)) }
  yield: { new hypothesis -> resolves -> X }
  until: stable
  constraint: L1
}
# Use: constraint: L2 with explicit bounds. Creating new nodes
# requires L2 — it breaks the closed domain that guarantees
# L1 termination.

# WRONG: L2 without explicit bound
@fix explore {
  match: { X: node }
  yield: { new derived(X) -> extends -> X }
  until: stable
  constraint: L2
}
# Use: until: stable or max_iterations: 100
# L2 "stable" alone is insufficient — convergence is not
# guaranteed. You need an explicit bound as safety net.

# WRONG: Nested @fix that de-escalates constraint
@fix outer {
  match: { X: node }
  yield: {
    @fix inner {
      match: { X }
      yield: { X -> derived -> X }
      until: stable
      constraint: L1
    }
  }
  until: stable or max_iterations: 50
  constraint: L2
}
# Invalid: inner constraint (L1) < outer constraint (L2).
# L1 termination guarantees require the ENTIRE environment
# to be L1. An L1 sub-computation inside L2 cannot rely on
# L1 guarantees. Nesting must escalate or preserve, never
# de-escalate. (See E011.)
```

---

## 3. Intermediate Representation

### 3.1 IR Extensions

**New node type: `fixpoint`**

The `node.type` enum in `ir.schema.json` MUST be extended to include `fixpoint`. The `relationshipType` enum MUST be extended to include `fixpoint_derived`.

A `fixpoint` node records a completed (or bounded) @fix computation.

**L1 fixpoint node:**
```json
{
  "id": "<content-hash>",
  "type": "fixpoint",
  "content": "propagate_trust: belief propagation converged in 7 iterations",
  "provenance": { "source_file": "reasoning.fs", "line_number": 42 },
  "ext": {
    "fix": {
      "name": "propagate_trust",
      "constraint": "L1",
      "status": "converged",
      "iterations": 7,
      "delta_sequence": [12, 8, 3, 1, 0],
      "initial_graph_hash": "<hash>",
      "final_graph_hash": "<hash>",
      "match_pattern": "<serialized>",
      "yield_production": "<serialized>",
      "until_condition": "stable"
    }
  }
}
```

**L2 fixpoint node:**
```json
{
  "id": "<content-hash>",
  "type": "fixpoint",
  "content": "hypothesize: generation bounded at 50 iterations",
  "provenance": { "source_file": "reasoning.fs", "line_number": 58 },
  "ext": {
    "fix": {
      "name": "hypothesize",
      "constraint": "L2",
      "status": "converged | bounded",
      "iterations": 50,
      "delta_sequence": [5, 3, 2, 2, 1, "..."],
      "skolem_constants_created": 8,
      "skolem_constants_grounded": 6,
      "skolem_constants_unresolved": 2,
      "initial_graph_hash": "<hash>",
      "final_graph_hash": "<hash>",
      "bound_type": "max_iterations",
      "bound_value": 50
    }
  }
}
```

**Critical type distinction:** L1 fixpoint nodes have `status` restricted to `"converged"` only. Non-convergence is mathematically impossible at L1 — the type makes this unrepresentable, not a runtime check. L2 fixpoint nodes have `status` of `"converged"` or `"bounded"` (hit the explicit limit without converging). The value `"diverged"` does not exist — all L2 computations either converge or are bounded; unbounded L2 is rejected by E008.

**New relationship type: `fixpoint_derived`**

Every element produced by an @fix iteration carries a `fixpoint_derived` relationship linking it to the fixpoint node. This provides complete provenance.

```json
{
  "id": "<content-hash>",
  "type": "fixpoint_derived",
  "source": "<id of derived element>",
  "target": "<id of fixpoint node>",
  "provenance": { "source_file": "reasoning.fs", "line_number": 42 },
  "ext": {
    "iteration": 3,
    "constraint": "L1"
  }
}
```

**Definition — `delta_sequence`:** An array of non-negative integers where `delta_sequence[i]` is the number of new content-hashes produced in iteration *i*. Content-hashes for delta purposes are computed over semantic content only — iteration-specific metadata (`fixpoint_derived.ext.iteration`) is excluded. For L1 computations, the final element is always 0 (convergence). The sequence is not necessarily monotonically decreasing (a derivation in iteration *i* may trigger more derivations in iteration *i+1* than *i* produced).

### 3.2 Graph Invariants

New invariants added:

- **`fixpoint_constraint_valid`**: L1 fixpoint nodes have `status: "converged"` only. L2 fixpoint nodes have `status: "converged" | "bounded"`.
- **`fixpoint_convergence_valid`**: Every fixpoint node with `status: "converged"` has `delta_sequence` ending in 0.
- **`fixpoint_bound_present`**: Every fixpoint node with `constraint: "L2"` has an explicit termination bound in its `ext.fix` fields.
- **`fixpoint_nesting_monotone`**: In nested fixpoint computations, inner fixpoint constraint levels are ≥ outer fixpoint constraint levels.
- **`fixpoint_derivation_complete`**: Every element produced by an @fix computation has a corresponding `fixpoint_derived` relationship.

---

## 4. Linter Rules

### E007: fixpoint-constraint-violation

**Severity:** ERROR

**Specification:** An `@fix` computation at constraint L1 MUST NOT produce new node IDs. If `yield` would create a node whose content-hash does not exist in the pre-computation node set, this is a constraint violation.

**Rationale:** L1's termination guarantee depends on a finite, closed domain. Creating new nodes expands the domain and breaks the guarantee. This is the formal boundary between decidable and Turing-complete computation.

**Detection:** Before @fix execution, snapshot the set of existing node content-hashes. During execution, check every element produced by `yield`. If a new node hash appears and constraint is L1, emit E007.

**Error message:**
```
E007 fixpoint-constraint-violation at line {line}
  @fix "{name}" at constraint L1 produced new node ID {hash}
  L1 computations must operate on existing nodes only.
  To create new nodes, use constraint: L2 with explicit bounds.
```

### E008: fixpoint-l2-missing-bound

**Severity:** ERROR

**Specification:** An `@fix` computation at constraint L2 MUST include an explicit termination bound: `max_iterations`, `timeout`, or `measure`. The `stable` condition alone is insufficient at L2.

**Rationale:** L2 is Turing-complete. Convergence is not guaranteed. An explicit bound is the developer's assertion: "I accept that this may not converge, and here is my safety net." The bound is not "gas" — it is a declaration about the expected computation depth.

**Error message:**
```
E008 fixpoint-l2-missing-bound at line {line}
  @fix "{name}" at constraint L2 has no explicit termination bound.
  L2 computations MUST include: max_iterations, timeout, or measure.
  Use: until: stable or max_iterations: N
```

### E009: fixpoint-missing-constraint

**Severity:** ERROR

**Specification:** Every `@fix` expression MUST declare an explicit constraint level (L1 or L2).

**Rationale:** The choice between decidable and Turing-complete computation is too consequential to default. The developer must choose, and the choice is recorded in the audit trail. Structure forces clarity.

**Why ERROR, not WARNING:** An unlabeled computation cannot be validated, audited, or referenced by compliance checks.

**Error message:**
```
E009 fixpoint-missing-constraint at line {line}
  @fix "{name}" has no constraint level declared.
  Every @fix MUST declare: constraint: L1 | L2
  There is no default. You must know your computational regime.
```

### E010: fixpoint-unstratifiable-negation

**Severity:** ERROR

**Specification:** If `match` contains `not` patterns, the negation dependencies must be stratifiable. A cyclic negation dependency (predicate P depends negatively on Q which depends positively on P) makes the semantics undefined and is rejected.

**Detection:** Build the dependency graph of match/yield rules. If rule R₁'s yield feeds into a `not` in R₂'s match, add a negative dependency edge R₂ → R₁. If the resulting graph has a cycle through a negative edge, the program is unstratifiable.

**Rationale:** Unstratified negation in Datalog has no unique minimal model. The semantics become ambiguous. Well-founded semantics (three-valued logic) could resolve this, but FlowScript does not currently support three-valued reasoning. Rejecting unstratifiable negation keeps the semantics clean.

**Error message:**
```
E010 fixpoint-unstratifiable-negation at line {line}
  @fix "{name}" has cyclic negation dependency: {cycle}
  Negation conditions must reference only predicates that are fully
  computed before the current stratum. Reorder your rules or remove
  the cyclic negation.
```

### E011: fixpoint-nesting-de-escalation

**Severity:** ERROR

**Specification:** A nested `@fix` MUST have a constraint level ≥ its enclosing `@fix`. An L1 sub-computation inside an L2 computation is invalid — L1 guarantees require the entire computational environment to be L1.

**Rationale:** L1 termination depends on the closed-world assumption over the entire domain. If the outer L2 computation can modify the graph concurrently with the inner L1, the inner L1's closed-domain assumption is violated. Escalation is safe (L1 outer, L2 inner) because the L1 discipline governs overall termination. De-escalation is not.

**Error message:**
```
E011 fixpoint-nesting-de-escalation at line {line}
  Nested @fix "{inner}" at constraint {inner_level} inside @fix
  "{outer}" at constraint {outer_level}.
  Nested constraint must be >= outer constraint.
  L1 guarantees cannot hold inside an L2 environment.
```

### W004: fixpoint-high-iteration-count

**Severity:** WARNING

**Specification:** An `@fix` computation exceeding 100 iterations without converging SHOULD be reviewed. Not an error — some computations legitimately require many iterations. But high counts may indicate incorrect match/yield patterns.

---

## 5. Audit Trail Interaction

### 5.1 New Audit Event Types

| Event Type | When Emitted | Key Fields |
|---|---|---|
| `fixpoint_start` | Beginning of @fix execution | name, constraint, match_pattern, initial_graph_hash |
| `fixpoint_iteration` | After each iteration | iteration_number, delta_size, new_hashes[], elapsed_ms |
| `fixpoint_end` | At convergence or bounding | status, total_iterations, final_graph_hash, delta_sequence |

For nested @fix, each level produces its own audit events. The nesting relationship is captured via the enclosing fixpoint node's ID in the inner `fixpoint_start` event.

### 5.2 Verifiable Certificate (L1)

The audit trail of an L1 computation is a verifiable certificate. Given:
- Initial graph G₀ (identified by content-hash)
- Match/yield rules R
- Audit trail recording δ₀, δ₁, ..., δₙ where δₙ = ∅

A verifier performs:
1. Reconstruct G₀
2. For each i from 0 to n: apply R to Gᵢ using semi-naive evaluation on δᵢ₋₁, verify produced delta matches δᵢ
3. Confirm final graph hash matches recorded hash
4. If all steps verify: the certificate proves correct fixpoint computation

This is constructively checkable — the verifier performs concrete computation at each step. The audit trail IS the proof object in this operational sense.

### 5.3 Lossless Reconstruction (L1)

The L0 audit record of an L1 computation contains enough information to fully reconstruct the computation. This follows from:
1. The initial graph hash identifies the starting state (content-hash addressing)
2. Each iteration's delta records exactly what was derived
3. The least fixpoint is unique on finite complete lattices (Knaster-Tarski)
4. L1 computation is deterministic in its result (fixpoint uniqueness)

An auditor can verify any L1 computation by replaying it. This is the operational manifestation of the adjunction between L1 and L0: the forgetful functor (drop computation, keep audit trail) has a left adjoint (reconstruct computation from audit trail + initial state + rules).

For L2: the audit trail is not lossless. Non-determinism from Skolem choice and potential non-convergence mean the audit trail records what happened but cannot guarantee identical reconstruction.

---

## 6. Query Interaction

### 6.1 Queries During @fix Execution

During an @fix computation, queries operate on the current graph state at each iteration:

- **`tensions()` in `match`:** Returns tensions as of the current iteration. As @fix resolves tensions, subsequent iterations see fewer.
- **`blocked()` in `match`:** Returns blocked nodes as of current iteration.
- **`why(nodeId)` on fixpoint-derived node:** Traces through `fixpoint_derived` relationship to originating @fix computation and iteration number.
- **`what_if(nodeId)`:** Shows forward consequences including fixpoint-derived elements.
- **`alternatives(nodeId)`:** Includes alternatives created by L2 Skolemization.

### 6.2 Queries After @fix Completion

After completion, all queries see the converged (or bounded) graph state. The fixpoint IS the graph. History is in the audit trail, not the query results. Specifically:

- `why()` for fixpoint-derived nodes traverses backward through `fixpoint_derived` → fixpoint node → original match sources
- `tensions()` reflects post-fixpoint state — resolved tensions carry resolution markers, new tensions from @fix appear
- All five queries work unchanged on the converged graph

---

## 7. Formal Properties Summary

| Property | L1 | L2 |
|---|---|---|
| Creates new nodes | No (closed domain) | Yes (Skolemization) |
| Terminates | Always (finite ascending chain) | Not guaranteed (TC) |
| Fixpoint unique | Yes (least fixpoint, Knaster-Tarski) | If converges: depends on Skolem choices |
| Delta sequence deterministic | Final result yes, per-step order may vary | No |
| Audit trail | Verifiable certificate (lossless reconstruction) | Computation history (lossy) |
| IR status values | `converged` only | `converged` or `bounded` |
| Complexity (data) | O(n^k) — PTIME on finite structures | Undecidable (Abiteboul-Hull-Vianu 1995) |
| Can nest | Yes (can contain bounded L2) | Yes (can contain L2) |
| Negation | Stratified (E010 rejects cycles) | Stratified |
| Mathematical structure | Initial algebra of match/yield endofunctor | Final coalgebra observation (if bounded) |

---

## 8. Design Rationale

### Why a metamaterial, not three layers?

Because the compliance question isn't "was this entire computation decidable?" It's "was THIS REGION of the computation decidable?" A policy reasoning engine needs L1 discipline for the audit trail and L2 creativity for hypothesis generation. Not sequentially — within the same reasoning process. Nested @fix with constraint modulation makes this expressible in the notation itself.

### Why is constraint level required, not defaulted?

Because the choice between decidable and Turing-complete computation is too consequential to be a default. Defaulting to L1 silently limits. Defaulting to L2 silently removes compliance guarantees. The developer must choose. Structure forces clarity.

### Why inflationary semantics?

Because the Gurevich-Shelah theorem tells us we get least-fixpoint expressive power with inflationary semantics on finite structures. Inflationary (only add, union with previous) is simpler to implement, simpler to audit, and equally expressive. There is no reason to choose the more complex option.

### Why is L2 the generative layer, not the dangerous one?

Because without L2, agents can only reason about what exists. They cannot hypothesize, explore counterfactuals, or generate candidates. L2 is where genuine novelty enters the system. The bounds on L2 are not "safety nets" — they are the developer's declaration of expected computation depth. A bounded L2 computation that doesn't converge hasn't failed; it has reported "this reasoning requires more depth than I allocated." That's information, not error.

### Why nested @fix instead of sequential?

Because sequential L1-then-L2 is two separate computations sharing a graph. Nested L1-containing-L2 is one computation with spatially varying constraint radius. The difference matters for audit: nested @fix records the constraint at every point in the computation tree, making it possible to verify "this L1 computation used L2 only in these bounded sub-regions." Sequential composition loses this structure.

---

## Key Citations

- Knaster, B. and Tarski, A. (1955). "A lattice-theoretical fixpoint theorem and its applications." *Pacific Journal of Mathematics*.
- Immerman, N. (1982) and Vardi, M. (1982). FO[LFP] captures PTIME on ordered finite structures.
- Gurevich, Y. and Shelah, S. (1986). "Fixed-Point Extensions of First-Order Logic." *Annals of Pure and Applied Logic*.
- Kreutzer, S. (2002). "Expressive Equivalence of Least and Inflationary Fixed-Point Logic." *LICS*.
- Abiteboul, S., Hull, R., and Vianu, V. (1995). *Foundations of Databases*. Addison-Wesley. (Skolemization = Turing-completeness.)
- Alchourrón, C., Gärdenfors, P., and Makinson, D. (1985). "On the Logic of Theory Change." *Journal of Symbolic Logic*. (AGM postulates.)
- Park, et al. (2026). "Graph-Native Cognitive Memory." arXiv:2603.17244. (AGM satisfaction for property graphs.)
- Kelly, G.M. (1982). *Basic Concepts of Enriched Category Theory*. (Change of enrichment base.)
- Apt, K., Blair, H., and Walker, A. (1988). "Towards a Theory of Declarative Knowledge." (Stratified negation.)
- Hirn, C. and Grust, T. (2023). "A Fix for the Fixation on Fixpoints." *CIDR*.

---

## Next Steps

**Integration into existing spec files:**
1. `grammar.md` — Add @fix productions
2. `semantics.md` — Add Category 8: Computational Operators
3. `ir.schema.json` — Extend enums, add invariants
4. `linter-rules.md` — Add E007-E011, W004
5. `critical_queries_spec.md` — Update query behavior for fixpoint-derived elements
6. `golden_examples_spec.md` — Add Pattern 5: Belief Convergence via @fix (including nested example)
7. `grammar.ohm` — Implement parser rules

**Implementation priority:**
1. Python SDK: Generalize ConsolidationEngine → FixpointEngine with constraint parameter
2. TypeScript: Add @fix to parser, IR types, Memory class
3. Audit trail: Three new event types
4. Linter: E007-E011, W004

---

*FlowScript @fix Specification v2.0*
*March 27, 2026*
*"One notation. One graph. Tunable constraint radius. The compliance engine is decidable. The cognitive substrate is as powerful as possible. The notation bridges both."*
