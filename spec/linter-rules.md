# FlowScript v1.0 - Linter Rules Specification

**Status:** Canonical Definition
**Version:** 1.0.0
**Last Updated:** October 2025
**Purpose:** Validation rules for semantic correctness enforcement

---

## Document Purpose

This document defines the **complete set of validation rules** for FlowScript v1.0. Linters enforce these rules to:

- **Catch semantic errors** - Invalid or incomplete thinking
- **Enforce forcing functions** - Required structure that ensures clarity
- **Enable computational operations** - Valid graph structure for queries
- **Improve quality** - Flag code smells and anti-patterns

**Severity Levels:**

- **ERROR** - MUST fix. Breaks semantic contract or enables computational operations
- **WARNING** - SHOULD fix. Code smells that may indicate problems

**THIS IS THE LINTER CONTRACT.** All FlowScript linters MUST implement these rules consistently.

---

## Rule Philosophy

### Forcing Functions

FlowScript rules are **forcing functions** - they force explicit articulation:

- Unlabeled tension → forces naming the tradeoff dimension
- Missing state fields → forces documentation of reasoning
- Alternatives without decision → forces completing the thought
- Orphaned nodes → forces intentional structure

**This is intentional.** Can't hide behind vague thinking. Structure forces clarity forces completeness.

### Error vs Warning

**ERROR** when:
- Breaks semantic contract (e.g., missing required fields)
- Prevents compilation to valid IR
- Violates graph invariants (e.g., cycles in causal edges)
- Enables computational operations (e.g., orphan detection)

**WARNING** when:
- Indicates potential problem (e.g., deep nesting)
- Style or quality issue
- Doesn't prevent parsing
- User may have valid reason to ignore

### Progressive Enhancement

**Core rules** (ERROR) never change for a major version.

**Quality rules** (WARNING) can be added based on usage patterns:
- Evidence of friction → add WARNING
- Pattern proves valuable → upgrade to ERROR in next major version

This enables **evidence-based evolution** of quality standards.

---

## ERROR-Level Rules (MUST Fix)

### E001: Unlabeled Tension

**Severity:** ERROR

**Specification:**

Tension marker `><` MUST include axis label in brackets.

```
INVALID: A >< B
VALID:   A ><[axis label] B
```

**Detection:**

Parse for `><` not immediately followed by `[`.

**Rationale:**

Forces explicit articulation of tradeoff dimension. Prevents vague handwaving like "these are in conflict" without naming HOW they conflict.

**Examples of violations:**

```
speed >< quality
# ERROR: Missing axis label
# Which dimension of tension? Performance? Velocity? Maintainability?

mobile friction >< desktop experience
# ERROR: Missing axis label
# Input method? Features? User experience? All three?
```

**How to fix:**

```
speed ><[velocity vs maintainability] quality
# VALID: Tension dimension explicit

mobile friction ><[input method vs convenience] desktop experience
# VALID: Specific tradeoff named
```

**Why this is ERROR not WARNING:**

- Decision 2: Explicit architectural forcing function
- Prevents incomplete thinking
- Enables tension analysis queries
- Semantic contract violation

**Implementation:**

1. Tokenize `><` followed by optional whitespace
2. Next token MUST be `[`
3. Capture text until `]`
4. If `[` missing → emit E001 error
5. Store axis_label for IR relationship

**Edge cases:**

- Multiple spaces between `><` and `[` - VALID (whitespace flexible)
- Empty brackets `><[]` - ERROR (axis required, not just brackets)
- Escaped `\><` - NOT a marker, skip

**Error message template:**

```
E001: Unlabeled tension marker
  Line {line}: Tension marker ><` missing axis label
  Found: {left_node} >< {right_node}
  Expected: {left_node} ><[axis_label] {right_node}

  Suggestion: Specify the dimension of tradeoff
  Examples:
    - ><[performance vs cost]
    - ><[security vs usability]
    - ><[short-term vs long-term]
```

---

### E002: Missing Required State Fields

**Severity:** ERROR

**Specification:**

State markers with REQUIRED fields must include them:

- `[decided]` → MUST have `rationale` and `on`
- `[blocked]` → MUST have `reason` and `since`

State markers with RECOMMENDED fields emit WARNING if missing (see W001).

**Detection:**

1. Parse state marker
2. Check for required fields
3. Validate field syntax (key: value)
4. Validate date format for temporal fields

**Rationale:**

Forces documentation of reasoning and timing. Prevents "we decided" without explaining why, or "blocked" without tracking when/why.

**Examples of violations:**

```
[decided] Use Redis
# ERROR: Missing required fields 'rationale' and 'on'

[decided(on: "2025-10-15")] Approach A
# ERROR: Missing required field 'rationale'

[blocked] Deploy to staging
# ERROR: Missing required fields 'reason' and 'since'

[blocked(reason: "waiting on keys")] Deploy
# ERROR: Missing required field 'since'
```

**How to fix:**

```
[decided(rationale: "user feedback validates need", on: "2025-10-15")] Use Redis
# VALID: Both required fields present

[blocked(reason: "waiting on API keys from vendor", since: "2025-10-12")] Deploy to staging
# VALID: Both required fields present
```

**Why this is ERROR not WARNING:**

- Decision 3: Explicit architectural forcing function
- Prevents "I'll remember later" (you won't)
- Enables lifecycle automation (staleness detection)
- Required for computational queries
- Semantic contract violation

**Implementation:**

1. Parse state marker type
2. Extract field list (text between parentheses)
3. Parse fields as key:value pairs (respect string escaping)
4. Check required fields present:
   ```
   decided: ["rationale", "on"]
   blocked: ["reason", "since"]
   exploring: []  # no required fields
   parking: []    # no required fields (WARNING in W001)
   ```
5. Validate date format for temporal fields
6. Emit E002 if required field missing

**Edge cases:**

- Extra fields beyond required - VALID (extensibility)
- Field order - flexible (rationale, on OR on, rationale both valid)
- Whitespace in field values - preserved in strings
- Empty strings - VALID syntactically, but poor practice (consider WARNING)

**Error message template:**

```
E002: Missing required state fields
  Line {line}: State marker [{state_type}] missing required fields
  Missing: {missing_fields}

  Required fields for [{state_type}]:
    {field_list_with_types}

  Example:
    [decided(rationale: "explanation here", on: "2025-10-15")]
```

---

### E003: Invalid Marker Syntax

**Severity:** ERROR

**Specification:**

Markers must follow valid composition rules:

- Markers don't merge: `->?` invalid
- One state at a time: `[decided blocked]` invalid
- One insight/command marker: `thought: action:` invalid
- State before content: `Deploy [blocked]` invalid (should be `[blocked] Deploy`)

**Detection:**

Parse sequences and detect invalid compositions.

**Rationale:**

Ensures unambiguous parsing. Prevents confusion and semantic errors.

**Examples of violations:**

```
->?
# ERROR: Markers don't merge

A->=B
# ERROR: Invalid token (mixing -> and =>)

[decided blocked] Task
# ERROR: Only one state marker allowed

thought: action: Do something
# ERROR: Only one insight/command marker

Deploy to production [blocked]
# ERROR: State must come before content
```

**How to fix:**

```
? A -> B
# VALID: Question with causal relationship in content

A -> B
A => C
# VALID: Separate relationships

[decided(rationale: "...", on: "...")] Task
[blocked(reason: "...", since: "...")] Task
# VALID: One state marker per element

thought: This observation
action: Take this step
# VALID: One marker per element

[blocked(reason: "...", since: "...")] Deploy to production
# VALID: State before content
```

**Why this is ERROR not WARNING:**

- Parser ambiguity
- Semantic confusion
- Grammar violation

**Implementation:**

1. Tokenize marker sequences
2. Check composition validity:
   - No merged tokens (`->?`, `->=`)
   - Max one state marker per element
   - Max one insight/command marker per element
   - State markers must precede content
3. Emit E003 if invalid composition detected

**Edge cases:**

- Modifiers can stack: `! ~ thought:` VALID
- Markers in prose content: VALID (that's hybrid style)
- Escaped markers: Skip (not actual markers)

**Error message template:**

```
E003: Invalid marker syntax
  Line {line}: Invalid marker composition
  Found: {invalid_sequence}
  Problem: {specific_issue}

  Valid composition rules:
    - Modifiers can stack: ! ~ thought:
    - Only one state marker: [decided] NOT [decided blocked]
    - Only one insight marker: thought: NOT thought: action:
    - State before content: [blocked] Deploy NOT Deploy [blocked]
```

---

### E004: Orphaned Nodes

**Severity:** ERROR

**Specification:**

Nodes with **zero relationships** (no edges in or out) are orphaned. This indicates:
- Isolated thought with no connections
- Incomplete thinking
- Forgotten fragment

**Detection:**

After parsing complete document:
1. Build graph of all nodes and relationships
2. Calculate degree for each node (in-edges + out-edges)
3. Nodes with degree 0 → orphaned

**Rationale:**

FlowScript is about **relationships between thoughts**. Isolated nodes break the graph structure and indicate incomplete articulation.

**Exceptions:**
- Root questions (starting point for exploration) - degree 0 acceptable
- Standalone insights marked with `thought:` - acceptable if intentional
- Action nodes - todo items that don't require graph connections
- Completion nodes - finished work tracking (metadata, not graph semantics)
- Top-level statements that spawn relationships - not orphaned

**Rationale for action/completion exemption:**
Actions and completions serve as metadata (todo lists, completion tracking) rather than participating in the causal/relational reasoning graph. They represent OUTPUTS of reasoning (what to do, what was done) rather than the reasoning itself. This pattern is demonstrated in spec Pattern 2 (debug/incident triage) where action nodes form a todo list separate from the causal analysis.

**Note:** This is NOT "unreachable from {goal}" (too strict). This is "completely isolated" (no connections at all).

**Examples of violations:**

```
A -> B -> C

Orphaned thought here

D -> E

# "Orphaned thought here" has no relationships
# Degree = 0 (no edges in or out)
# ERROR: Orphaned node
```

```
? main question
  || option A -> analysis
  || option B -> analysis

Random unconnected note

[decided(...)] option A

# "Random unconnected note" isolated
# ERROR: Orphaned node
```

**How to fix:**

```
A -> B -> C
  <- Orphaned thought here  # Now connected

D -> E
```

Or remove if truly orphaned:
```
A -> B -> C
D -> E

# Removed orphaned thought
```

Or connect to structure:
```
? main question
  || option A -> analysis
  || option B -> analysis

thought: Random note
  -> informed decision process

[decided(...)] option A
```

**Why this is ERROR not WARNING:**

- Graph invariant violation
- Indicates incomplete thinking
- Breaks computational operations
- Fragments thought structure

**Implementation:**

1. Parse entire document to AST
2. Build graph:
   ```
   nodes = Set of all content nodes
   edges = Set of all relationships
   ```
3. Calculate degree:
   ```
   for each node:
     in_degree = count edges targeting this node
     out_degree = count edges from this node
     total_degree = in_degree + out_degree
   ```
4. Find orphans:
   ```
   orphans = nodes where total_degree == 0
   ```
5. Filter exceptions (optional):
   - Root questions `?` with alternatives
   - Standalone `thought:` markers (user choice)
6. Emit E004 for remaining orphans

**Edge cases:**

- Question with alternatives but no decision → NOT orphaned (alternatives are edges)
- Thought block with internal structure `{A -> B}` → NOT orphaned if block has relationships
- Single line document "just a thought" → Orphaned, but may be intentional (consider allowing via flag)

**Error message template:**

```
E004: Orphaned node
  Line {line}: Node has no relationships (isolated)
  Node: {node_content}

  This node is completely isolated (no connections to other thoughts).

  To fix:
    - Connect with relationship: {node} -> {target}
    - Or connect backward: {source} -> {node}
    - Or remove if truly orphaned
```

---

### E005: Causal Cycles

**Severity:** ERROR

**Specification:**

Causal relationships (`->`) must form a **Directed Acyclic Graph (DAG)**.

Cycles are invalid unless ALL edges in the cycle have `feedback: true` flag (set automatically by `<->` bidirectional marker).

```
INVALID: A -> B -> C -> A      # Cycle without feedback
VALID:   A <-> B               # Bidirectional (feedback: true on both edges)
VALID:   A -> B <-> C -> A     # Mixed, but cycle edges marked as feedback
```

**Detection:**

1. Build directed graph of causal (`->`) relationships only
2. Exclude edges with `feedback: true` flag
3. Run cycle detection algorithm (DFS or Tarjan's)
4. If cycle found → emit E005 with cycle path

**Rationale:**

Causal reasoning should be acyclic - cause precedes effect. Cycles represent:
- Logical error (circular reasoning)
- OR intentional feedback loop

Intentional feedback loops MUST be marked with `<->` (bidirectional) to set `feedback: true` flag.

**Examples of violations:**

```
A -> B -> C -> A
# ERROR: Cycle detected
# Path: A -> B -> C -> A

poor sleep -> reduced focus -> stress -> poor sleep
# ERROR: Cycle in causal chain
# Path: poor sleep -> reduced focus -> stress -> poor sleep
```

**How to fix - Option 1: Use bidirectional for feedback:**

```
A <-> B -> C
# VALID: A and B mutually influence (feedback: true)
# No cycle in causal graph (bidirectional edges excluded)

poor sleep <-> stress
stress -> reduced focus
# VALID: Sleep and stress feedback loop marked explicitly
```

**How to fix - Option 2: Break cycle:**

```
A -> B -> C
C -> D (not back to A)
# VALID: No cycle
```

**How to fix - Option 3: Temporal instead of causal:**

```
morning => work => evening => sleep => morning
# VALID: Temporal sequence (=>, not ->)
# Cycles allowed in temporal relationships
```

**Why this is ERROR not WARNING:**

- Decision 6: Explicit graph invariant
- Ensures DAG structure for causal reasoning
- Enables proper graph traversal
- Prevents logical errors

**Implementation:**

1. Extract causal relationships:
   ```
   causal_edges = relationships where type == "causes"
                  AND feedback != true
   ```

2. Build directed graph from causal_edges

3. Detect cycles using DFS:
   ```python
   def has_cycle(graph):
       visited = set()
       rec_stack = set()

       for node in graph.nodes:
           if node not in visited:
               if dfs_cycle(node, visited, rec_stack, graph):
                   return True, get_cycle_path()
       return False, []
   ```

4. If cycle found:
   - Extract cycle path
   - Emit E005 with path

**Edge cases:**

- Self-loop `A -> A` - Cycle (should use `A <-> A` if intended)
- Multiple cycles - Report first found (user fixes, re-lint finds next)
- `<->` creates two edges - Both have `feedback: true`, excluded from check
- Mixed `->` and `<->` - Only check `->` edges

**Error message template:**

```
E005: Causal cycle detected
  Cycle found in causal relationships: {cycle_path}

  Causal relationships (->)must form a DAG (no cycles).

  This cycle: {A} -> {B} -> {C} -> {A}

  To fix:
    1. If this is intentional feedback, use bidirectional:
       {A} <-> {B}

    2. If temporal sequence, use temporal marker:
       {A} => {B} => {C} => {A}

    3. If logical error, break the cycle:
       Remove one relationship or restructure reasoning
```

---

### E006: Alternatives Without Decision

**Severity:** ERROR

**Specification:**

When alternatives (`||`) are used under a question (`?`), at least ONE must eventually be marked with `[decided]` OR the question must be marked `[parking]`.

**Detection:**

1. Find all questions with alternatives
2. Check if any alternative has `[decided]` state
3. OR check if question has `[parking]` state
4. If neither → emit E006

**Rationale:**

Alternatives represent **decision in progress**. The thought must complete:
- Either make decision (`[decided]`)
- Or explicitly defer (`[parking]`)

Leaving alternatives dangling indicates incomplete thinking.

**Examples of violations:**

```
? authentication strategy
  || JWT tokens
     -> stateless
  || session + Redis
     -> instant revocation

# ERROR: Alternatives without decision
# Question has options but no decision made and not parked
```

```
? feature prioritization
  || A
  || B
  || C

Some other thoughts...

# ERROR: Alternatives presented but never decided
```

**How to fix - Option 1: Make decision:**

```
? authentication strategy
  || JWT tokens
     -> stateless
  || session + Redis
     -> instant revocation

[decided(rationale: "security critical for v1", on: "2025-10-15")]
session + Redis
```

**How to fix - Option 2: Park the decision:**

```
[parking(why: "need more data", until: "after user research")]
? authentication strategy
  || JWT tokens
  || session + Redis
```

**How to fix - Option 3: Remove alternatives if not actually deciding:**

```
? authentication strategy

thought: Should consider JWT vs session tokens
```

**Why this is ERROR not WARNING:**

- Decision 6: Explicit forcing function
- Prevents incomplete decision-making
- Ensures alternatives have closure
- Enables decision tracking queries

**Implementation:**

1. Parse document, build AST
2. Find all questions (`?` nodes)
3. For each question, find children alternatives (`||` relationships)
4. If alternatives exist:
   ```python
   has_decision = any(
       alternative has [decided] state
       for alternative in question.alternatives
   )

   question_parked = question has [parking] state

   if not (has_decision or question_parked):
       emit E006 error
   ```

**Edge cases:**

- Multiple alternatives, multiple decided → VALID (changed mind, documented evolution)
- Alternatives without question parent → VALID (comparison without formal decision)
- Question without alternatives → Not subject to this rule
- [exploring] on question → Still requires eventual decision or parking

**Error message template:**

```
E006: Alternatives without decision
  Line {line}: Question has alternatives but no decision
  Question: {question_content}
  Alternatives: {alternative_list}

  Alternatives require closure:
    - Make decision: [decided(rationale: "...", on: "...")] {chosen}
    - OR park decision: [parking(why: "...", until: "...")] ? {question}
    - OR remove alternatives if not actually deciding
```

---

## WARNING-Level Rules (SHOULD Fix)

### W001: Missing Recommended State Fields

**Severity:** WARNING

**Specification:**

State marker `[parking]` SHOULD include recommended fields:
- `why` - Why is this parked?
- `until` - When to revisit?

Missing these fields doesn't break semantics, but reduces clarity.

**Detection:**

Parse `[parking]` state and check for `why` and `until` fields.

**Rationale:**

Parking without explanation = easy to forget why. Recommended fields improve clarity and enable better lifecycle management.

**Examples:**

```
[parking] Browser extension feature
# WARNING: Missing recommended fields 'why' and 'until'
```

**How to fix:**

```
[parking(why: "not needed until v2", until: "after MVP validated")]
Browser extension feature
# VALID: Recommended fields present
```

**Why this is WARNING not ERROR:**

- Not required for semantics
- User may have valid reason to omit
- Quality improvement, not correctness

**Implementation:**

Similar to E002 but emit WARNING instead of ERROR for missing recommended fields.

**Error message template:**

```
W001: Missing recommended state fields
  Line {line}: [parking] missing recommended fields
  Recommended: why, until

  Example:
    [parking(why: "not ready yet", until: "after Phase 1")]
```

---

### W002: Deep Nesting

**Severity:** WARNING

**Specification:**

Thought blocks `{ }` nested deeper than **5 levels** may indicate over-complexity.

```
Readable:  {{{{{ }}}}}      # 5 levels - OK
Too deep:  {{{{{{ }}}}}}    # 6 levels - WARNING
```

**Detection:**

Track nesting depth during parsing. Emit WARNING when depth > 5.

**Rationale:**

Deep nesting becomes hard to read and understand. Often indicates need to refactor into multiple separate structures.

**Examples:**

```
{
  {
    {
      {
        {
          {
            Very deeply nested thought
          }
        }
      }
    }
  }
}
# WARNING: Nesting depth 6 exceeds recommended maximum of 5
```

**How to fix:**

Break into multiple separate blocks:

```
{
  Main thought
  -> {Supporting detail}
  -> {Another detail}
}

{
  Related thought referenced above
  -> further details
}
```

Or flatten structure using relationships:

```
A -> B -> C -> D -> E
# Instead of: {A -> {B -> {C -> {D -> E}}}}
```

**Why this is WARNING not ERROR:**

- User may have valid reason for deep nesting
- Readability issue, not semantic error
- Doesn't break parsing or compilation

**Implementation:**

1. Track nesting depth during parsing
2. Increment on `{`, decrement on `}`
3. Record max depth per block
4. Emit W002 if max_depth > 5

**Error message template:**

```
W002: Deep nesting detected
  Line {line}: Thought block nested {depth} levels deep
  Recommended maximum: 5 levels

  Consider:
    - Breaking into multiple separate blocks
    - Using flat relationships instead of nesting
    - Restructuring for clarity
```

---

### W003: Long Causal Chains

**Severity:** WARNING

**Specification:**

Causal chains (`->`) longer than **10 steps** without branching may indicate:
- Over-simplification (missing nuance)
- OR over-analysis (diminishing returns)

```
OK:     A -> B -> C -> D -> E -> F -> G -> H -> I -> J      # 10 steps
WARN:   A -> B -> ... -> K                                   # 11 steps
```

**Detection:**

1. Build causal graph
2. Find longest paths
3. Emit WARNING if path > 10 nodes without branching

**Rationale:**

Very long causal chains often miss branching factors or intermediate nuance. Encouraging branching improves analysis quality.

**Examples:**

```
poor sleep -> tired -> reduced focus -> mistakes ->
stress -> worse sleep -> more tired -> more mistakes ->
more stress -> burnout -> health issues -> more problems
# WARNING: Causal chain 12 steps without branching
```

**How to fix - Add branching nuance:**

```
poor sleep -> tired
  -> reduced focus -> mistakes
  -> irritability -> conflicts
  -> health issues

stress <-> poor sleep
# Better: Shows multiple parallel effects and feedback
```

**Why this is WARNING not ERROR:**

- Long chains may be accurate (rare)
- Quality suggestion, not semantic error
- Doesn't break graph structure

**Implementation:**

1. Build directed graph of causal (`->`) edges
2. Find longest simple paths:
   ```python
   def longest_path_from(node, graph, visited):
       visited.add(node)
       max_length = 0

       for neighbor in graph[node]:
           if neighbor not in visited:
               length = 1 + longest_path_from(neighbor, graph, visited)
               max_length = max(max_length, length)

       visited.remove(node)
       return max_length
   ```
3. Emit W003 if longest_path > 10

**Error message template:**

```
W003: Long causal chain detected
  Chain length: {length} steps (recommended maximum: 10)
  Path: {node_1} -> {node_2} -> ... -> {node_n}

  Consider:
    - Adding branching to show parallel effects
    - Breaking into multiple related chains
    - Adding intermediate context or nuance
```

---

## Implementation Guidance

### Linter Architecture

**Recommended two-pass approach:**

**Pass 1: Syntax validation (during parsing)**
- E003: Invalid marker syntax
- E002: Missing required state fields (partial - syntax check)

**Pass 2: Semantic validation (after parsing)**
- E001: Unlabeled tension (if parser emits relationship without axis)
- E002: Missing required state fields (complete - semantic check)
- E004: Orphaned nodes (requires full graph)
- E005: Causal cycles (requires full graph)
- E006: Alternatives without decision (requires full graph)
- W001: Missing recommended fields
- W002: Deep nesting
- W003: Long causal chains (requires graph traversal)

### Error Reporting

**Standard format:**

```
{severity}: {rule_id} {rule_name}
  Line {line}, Column {col}: {description}

  {context_snippet}
  {helpful_suggestion}
```

**Example:**

```
ERROR: E001 Unlabeled tension
  Line 42, Column 15: Tension marker missing axis label

  Found: speed >< quality

  Suggestion: Specify dimension of tradeoff
    speed ><[velocity vs maintainability] quality
```

### Configuration

**Allow linter configuration:**

```json
{
  "rules": {
    "E001": "error",
    "E002": "error",
    "E003": "error",
    "E004": "warn",     // User downgrades to warning
    "E005": "error",
    "E006": "error",
    "W001": "off",      // User disables
    "W002": {"level": "warn", "max_depth": 7},  // User adjusts threshold
    "W003": {"level": "warn", "max_length": 15}
  }
}
```

**Recommendations:**
- ERROR rules should default to "error" (don't allow disabling easily)
- WARNING rules can be configured or disabled
- Allow threshold adjustments for WARNING rules

### Performance

**For large documents:**

- Cache graph construction (don't rebuild per rule)
- Run independent rules in parallel
- Incremental validation (only check changed regions)

**Expected complexity:**

- E001, E002, E003: O(n) where n = nodes
- E004: O(n + e) where e = edges (graph traversal)
- E005: O(n + e) (cycle detection - DFS)
- E006: O(n) (check questions and alternatives)
- W002: O(n) (track depth during parse)
- W003: O(n * e) worst case (longest path search)

---

## Rule Evolution

### Adding Rules

**Process:**
1. Evidence of pattern in real usage
2. Proposal with rationale and examples
3. Implement as WARNING first
4. Gather feedback from community
5. If valuable, keep as WARNING or upgrade to ERROR in next version
6. Update this specification

### Deprecating Rules

**Process:**
1. Evidence rule isn't valuable or has false positives
2. Mark as deprecated in documentation
3. Downgrade to WARNING if currently ERROR
4. Remove in next major version
5. Update specification

### Rule Changes

**Severity changes:**
- WARNING → ERROR requires major version (breaking change)
- ERROR → WARNING requires major version (relaxing contract)
- Threshold adjustments (W002, W003) can happen in minor versions

---

## Testing Linter Implementation

### Required Test Cases

**For each rule, test:**

1. **Positive cases** (should trigger)
2. **Negative cases** (should NOT trigger)
3. **Edge cases**
4. **Fix verification** (suggested fix is valid)

### Example Test Suite

```javascript
// E001: Unlabeled tension
test("E001 detects unlabeled tension", () => {
  const input = "speed >< quality";
  const errors = lint(input);
  expect(errors).toContainError("E001");
});

test("E001 passes with axis label", () => {
  const input = "speed ><[velocity vs maintainability] quality";
  const errors = lint(input);
  expect(errors).not.toContainError("E001");
});

// E004: Orphaned nodes
test("E004 detects orphaned node", () => {
  const input = `
    A -> B

    Orphaned thought here

    C -> D
  `;
  const errors = lint(input);
  expect(errors).toContainError("E004");
  expect(errors).toMatchMessage(/Orphaned thought here/);
});
```

### Golden Examples Validation

All golden examples from `golden_examples_spec.md` MUST lint cleanly (no errors, warnings OK).

---

## Integration with Other Specifications

### Alignment with semantics.md

Every ERROR rule enforces semantic requirements from semantics.md:

- E001 → semantics.md section 1.5 (tension requires axis)
- E002 → semantics.md sections 3.1, 3.3 (required state fields)
- E003 → semantics.md composition rules
- E004 → semantics.md graph structure (relationships required)
- E005 → semantics.md causal semantics (DAG structure)
- E006 → semantics.md alternatives semantics (require closure)

### Alignment with ir.schema.json

Linter validates pre-conditions for valid IR:

- E001 → ensures `relationship.axis_label` present for tension
- E002 → ensures `state.fields` contain required data
- E004, E005 → ensure `invariants.causal_acyclic` and `invariants.all_nodes_reachable`
- Valid linted FlowScript → valid IR per schema

### Alignment with grammar.md

Linter catches semantic errors that grammar allows syntactically:

- Grammar allows `><` without `[axis]` syntactically
- Linter enforces semantic requirement (E001)
- Separation of concerns: grammar = syntax, linter = semantics

---

## Conclusion

These **8 validation rules** (6 ERROR + 2 WARNING) enforce FlowScript's semantic contract and quality standards.

**ERROR rules** are forcing functions - they make FlowScript's "computable substrate" vision work by ensuring:
- Required structure (unlabeled tensions, missing fields)
- Valid graph invariants (no orphans, no cycles)
- Complete thinking (alternatives need decisions)

**WARNING rules** guide quality without breaking compilation.

**For linter developers:** Implement all ERROR rules. WARNING rules optional but recommended.

**For users:** ERROR rules MUST be fixed. WARNING rules are suggestions.

**Next steps:**
- See [semantics.md](semantics.md) for semantic definitions
- See [grammar.md](grammar.md) for syntax rules
- See [ir.schema.json](ir.schema.json) for IR structure

---

**FlowScript v1.0 Linter Rules**
**Semantic Contract Enforcement**
**October 2025**
