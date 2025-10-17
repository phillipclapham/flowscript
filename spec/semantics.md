# FlowScript v1.0 - Formal Semantic Specification

**Status:** Canonical Definition
**Version:** 1.0.0
**Last Updated:** October 2025
**Purpose:** Single source of truth for FlowScript marker semantics

---

## Document Purpose

This document provides the **formal semantic specification** for FlowScript v1.0. Every marker has exactly ONE clear, unambiguous meaning. This specification enables:

- **Unambiguous parsing:** Tools can parse FlowScript without guessing
- **Consistent interpretation:** All implementations agree on meaning
- **Compilation contract:** FlowScript text → canonical IR mapping
- **Validation rules:** What is valid vs invalid FlowScript

**THIS IS THE AUTHORITATIVE DEFINITION.** All other documentation, examples, and implementations must align with this specification.

---

## Core Principles

### 1. One Meaning Per Marker

Each marker has **exactly one semantic meaning**. No ambiguity. No context-dependent interpretation. The meaning is fixed and formal.

### 2. Composition Over Proliferation

Complex semantics emerge from **composing simple markers**, not from creating specialized markers for every use case.

Example: `! ? urgent question` is composition of modifiers, not a special `!?` marker.

### 3. Evidence-Based Minimalism

FlowScript v1.0 includes **20 markers** - the minimal set proven through real use to enable structured thought. No theoretical markers. Every marker earns its place through evidence.

### 4. Forcing Functions

Certain requirements (axis labels, state fields) **force explicit articulation**. This is intentional. Structure forces clarity. Clarity improves thinking and communication.

---

## The 20 Markers

### Category 1: Core Relations (5 markers)

These markers express **relationships between concepts**. They are the foundation of FlowScript's ability to make thought topology explicit.

#### 1.1 `->` (causes / leads to / implies / depends on)

**Semantic Definition:**
Expresses **causal relationship, logical implication, or dependency**. A -> B means:
- A causes B (causation)
- A implies B (logical consequence)
- B depends on A (dependency)
- A must happen before B (prerequisite)

**NOT temporal sequence** - use `=>` for that.

**Examples:**
```
poor sleep -> reduced focus
reduced focus -> mistakes
mistakes -> stress

auth bug -> login failures
timeout issues -> user frustration

technical debt -> slower velocity
slower velocity -> missed deadlines
```

**Key Properties:**
- Transitive: A -> B and B -> C implies A -> C
- Directional: A -> B does NOT imply B -> A
- Semantic: Represents causal/logical connection, not just sequence

**Invalid Usage:**
```
wake up -> coffee          # WRONG: temporal sequence, not causal
                          # Use: wake up => coffee

morning -> afternoon      # WRONG: temporal, not causal
                          # Use: morning => afternoon
```

**Composition:**
```
! A -> B                  # Urgent causal relationship
~ A -> B                  # Uncertain/exploring causal connection
* A -> B                  # Proven causal relationship
```

---

#### 1.2 `=>` (then / followed by / temporal sequence)

**Semantic Definition:**
Expresses **temporal sequence without causal claim**. A => B means:
- A happens before B in time
- B follows A temporally
- NO claim about causation or dependency

**NOT causation** - use `->` for that.

**Examples:**
```
wake up => coffee => work
morning => afternoon => evening

receive email => read email => respond

Phase 1 complete => Phase 2 begins
```

**Key Properties:**
- Temporal only: A => B means temporal ordering
- Non-causal: Does NOT claim A causes B
- Sequential: Represents timeline flow

**When to use `=>` vs `->`:**
```
# Temporal sequence (use =>):
login => dashboard => explore features

# Causal dependency (use ->):
missing auth -> login fails
login fails -> user frustration

# Can appear together:
user clicks button => backend receives request -> validation runs -> response sent
(temporal)          (temporal)                  (causal)         (causal)
```

**Invalid Usage:**
```
A => B -> C => D         # Mixing temporal and causal - valid but be careful
                        # Make sure the distinction is meaningful

feature shipped => users happy    # WRONG: causal relationship, not just sequence
                                  # Use: feature shipped -> users happy
```

---

#### 1.3 `<-` (derives from / caused by / provides context)

**Semantic Definition:**
Expresses **reverse causal relationship or contextual origin**. A <- B means:
- A derives from B (B is source of A)
- A is caused by B (B causes A)
- B provides context for understanding A

Semantically equivalent to B -> A, but used for different **emphasis** or **reading flow**.

**Examples:**
```
login failures <- auth bug
(emphasizes the problem, then reveals cause)

maintenance burden <- unnecessary complexity
(emphasizes burden, traces back to origin)

FlowScript <- Protocol Memory Seeds system
(emphasizes FlowScript, shows origin)
```

**When to use `<-` vs `->`:**
```
# Use -> when flowing forward (cause to effect):
auth bug -> login failures

# Use <- when flowing backward (effect to cause):
login failures <- auth bug

# Both mean the same thing, choose based on reading flow
```

**Composition with nesting:**
```
{
  current problem: authentication failures
  <- {root cause: session timeout misconfigured
       <- {why: copied settings from old system
            <- {historical context: different requirements}
          }
     }
}
```

---

#### 1.4 `<->` (bidirectional / mutual influence / feedback loop)

**Semantic Definition:**
Expresses **bidirectional relationship or mutual influence**. A <-> B means:
- A affects B AND B affects A
- Mutual influence or dependency
- Feedback loop between A and B
- Neither is purely cause nor purely effect

**Examples:**
```
team size <-> project scope
(larger team enables larger scope, larger scope requires larger team)

performance <-> memory usage
(improving performance may increase memory, reducing memory may hurt performance)

practice <-> skill
(practice improves skill, skill enables better practice)

PM launch <-> FlowScript validation
(PM validates FlowScript, FlowScript enables PM features)
```

**Key Properties:**
- Symmetric: A <-> B is identical to B <-> A
- Represents systems thinking (circular causality)
- NOT just "related" - must be mutual influence

**Invalid Usage:**
```
apples <-> oranges        # WRONG: just related, not mutual influence
                         # Use prose: "apples and oranges"

code <-> bugs            # WRONG: not bidirectional
                         # Use: code -> bugs (code causes bugs)
```

---

#### 1.5 `><[axis]` (tension / tradeoff / conflict)

**Semantic Definition:**
Expresses **tension, tradeoff, or inherent conflict** between two concerns. A ><[axis] B means:
- A and B are in tension along specified axis
- Improving A tends to worsen B along that dimension
- Tradeoff exists - cannot optimize both simultaneously
- **[axis] label is REQUIRED** - specifies the dimension of tension

**ENFORCEMENT:** Unlabeled `><` without [axis] is a **lint ERROR**. The axis label forces explicit articulation of the tradeoff dimension.

**Examples:**
```
speed ><[code quality vs velocity] careful refactoring
mobile ><[input method vs convenience] desktop
cost ><[performance vs budget] performance
features ><[stability vs functionality] stability

serverless adoption
  -> faster deployment
  -> lower maintenance
  -> cold start latency ><[performance vs cost] cost savings
```

**Axis Label Requirements:**
- MUST be present (lint ERROR if missing)
- MUST specify the dimension of tension
- SHOULD be concise (2-5 words)
- CAN use "vs" or other connectors for clarity

**Valid Axis Labels:**
```
><[performance vs simplicity]
><[security vs usability]
><[cost vs speed]
><[precision vs cognitive load]
><[short-term vs long-term]
><[innovation vs stability]
```

**Invalid Usage:**
```
speed >< quality         # ERROR: missing axis label
                        # Fix: speed ><[velocity vs maintainability] quality

A >< B                  # ERROR: missing axis label
                        # Fix: A ><[dimension] B
```

**Composition:**
```
! speed ><[velocity vs quality] quality    # Urgent tradeoff
~ cost ><[performance vs budget] perf      # Uncertain tradeoff
```

**Multiple Tensions:**
```
serverless approach:
  cost ><[budget vs scale] performance
  cold starts ><[latency vs cost] savings
  vendor lock-in ><[flexibility vs convenience] managed service
```

---

### Category 2: Definition Operators (2 markers)

These markers express **equivalence and distinction**. They define what things mean and clarify what they don't mean.

#### 2.1 `=` (equivalent to / defined as / means)

**Semantic Definition:**
Expresses **equivalence or definition**. A = B means:
- A is equivalent to B
- A is defined as B
- A means the same thing as B

**Examples:**
```
success = 100+ validated users
hybrid approach = natural language + selective FlowScript
forcing function = structure requirement that ensures completeness
MVP = minimal viable product
```

**Key Properties:**
- Symmetric: A = B implies B = A
- Used for definitions, not assertions
- Context-dependent (definitions may be scoped to specific project/conversation)

**Invalid Usage:**
```
apples = oranges        # WRONG: not equivalent
water = H2O            # This is actually valid (chemical equivalence)
```

---

#### 2.2 `!=` (different from / not the same as / distinct from)

**Semantic Definition:**
Expresses **distinction or non-equivalence**. A != B means:
- A is NOT equivalent to B
- A is different from B
- Clarifying a distinction

**Examples:**
```
FlowScript != notation system alone
FlowScript = computable substrate for cognitive partnership

infrastructure != application
speed != quality
action: != natural language request

causal (->) != temporal (=>)
```

**Purpose:**
Prevents confusion by explicitly stating what something is NOT. Especially useful when clarifying subtle distinctions.

---

### Category 3: State Markers (4 markers)

These markers express **decision and work status**. They enable lifecycle tracking and computational state management.

#### 3.1 `[decided(rationale, on)]` (committed decision)

**Semantic Definition:**
Signals a **firm decision has been made**. Time to execute, not debate.

**ENFORCEMENT:** Fields `rationale` and `on` are **REQUIRED** (lint ERROR if missing).

**Required Fields:**
- `rationale`: String explaining WHY this decision was made
- `on`: ISO-8601 date when decision was made

**Examples:**
```
[decided(rationale: "user feedback validates need", on: "2025-10-12")]
Ship minimal version now

[decided(rationale: "technical debt compounds, incremental is optimal", on: "2025-10-15")]
Extract one component per sprint instead of big bang rewrite

[decided(rationale: "evidence from 6 AI architectures validates approach", on: "2025-10-10")]
FlowScript = computable substrate for cognitive partnership
```

**Why Fields are Required:**
- Forces documentation of reasoning
- Enables future review ("why did we decide this?")
- Prevents "gut feeling" decisions without rationale
- Timestamping enables staleness detection

**Invalid Usage:**
```
[decided] Ship now                    # ERROR: missing required fields
[decided(on: "2025-10-12")] Ship     # ERROR: missing rationale field
[decided(rationale: "seems good")] X  # ERROR: missing on field
```

**Composition:**
```
* [decided(rationale: "proven through testing", on: "2025-10-12")] Use Redis
! [decided(rationale: "critical security fix", on: "2025-10-12")] Deploy immediately
```

---

#### 3.2 `[exploring]` (investigating / not committed)

**Semantic Definition:**
Signals **investigation mode** - not yet committed to direction. Options being evaluated.

**ENFORCEMENT:** Fields are **OPTIONAL** (no lint error if missing, but fields CAN be provided for additional context).

**Optional Fields:**
- `hypothesis`: String describing what's being explored
- `since`: ISO-8601 date when exploration began
- Other fields as needed

**Examples:**
```
[exploring] Redis vs Postgres for sessions
[exploring(hypothesis: "axis labeling improves clarity")] Require ><[axis] labels
[exploring(since: "2025-10-10")] Serverless architecture

? [exploring] Launch timing - Q1 vs Q2
```

**Purpose:**
Distinguishes exploration from commitment. Signals "still figuring this out" vs "we've decided."

---

#### 3.3 `[blocked(reason, since)]` (waiting on dependency)

**Semantic Definition:**
Signals work is **blocked** - cannot proceed until dependency is resolved.

**ENFORCEMENT:** Fields `reason` and `since` are **REQUIRED** (lint ERROR if missing).

**Required Fields:**
- `reason`: String explaining what blocks progress
- `since`: ISO-8601 date when block began

**Examples:**
```
[blocked(reason: "waiting on API keys from vendor", since: "2025-10-10")]
Deploy to staging

[blocked(reason: "needs database migration approval", since: "2025-10-12")]
Feature testing

[blocked(reason: "spec must be complete before parser implementation", since: "2025-10-12")]
Phase 2-3 toolchain development
```

**Why Fields are Required:**
- Tracks WHAT blocks progress (enables resolution)
- Timestamps enable staleness detection
- Forces explicit articulation of dependencies
- Enables automated staleness alerts (>60 days = review)

**Invalid Usage:**
```
[blocked] Deploy                           # ERROR: missing required fields
[blocked(reason: "waiting")] X            # ERROR: missing since field
[blocked(since: "2025-10-12")] Y          # ERROR: missing reason field
```

---

#### 3.4 `[parking(why, until)]` (deferred / not ready)

**Semantic Definition:**
Signals idea is **not ready to process yet** - revisit later when conditions change.

**ENFORCEMENT:** Fields `why` and `until` are **RECOMMENDED** (lint WARNING if missing, not ERROR).

**Recommended Fields:**
- `why`: String explaining why idea is parked
- `until`: String describing when to revisit

**Examples:**
```
[parking(why: "not needed until v2", until: "after MVP validated")]
Browser extension

[parking(why: "requires research phase complete", until: "Phase 1 done")]
Datalog query layer

[parking(why: "defer until we hit performance wall", until: "users report slowness")]
SQLite backing for persistence
```

**Purpose:**
Captures good ideas that are wrong time. Prevents forgetting, but acknowledges "not now."

**Difference from [blocked]:**
- `[blocked]` = want to do now, can't proceed
- `[parking]` = good idea, wrong time

---

### Category 4: Insights & Questions (3 markers)

These markers express **thoughts worth preserving** and **questions needing answers**.

#### 4.1 `thought:` (insight / realization / learning)

**Semantic Definition:**
Marks an **insight worth preserving** - something learned, realized, or discovered.

**Examples:**
```
thought: FlowScript enables dimensional expansion of thinking
thought: Energy tracking might be the PM differentiator
thought: Forcing functions catch incomplete thinking
thought: Structure forces clarity forces completeness
```

**Purpose:**
Distinguishes insights from requests. "I realized X" vs "please do Y."

**Composition:**
```
* thought: Evidence validates this works           # High confidence insight
~ thought: Not sure but maybe relevant?           # Low confidence insight
! thought: Critical insight don't lose this       # Urgent insight
```

**Invalid Usage:**
```
thought: Can you help me with X?    # WRONG: that's a request, not insight
                                    # Use: action: help with X
                                    # Or just: ? how to handle X
```

---

#### 4.2 `?` (question / decision point / uncertainty)

**Semantic Definition:**
Marks a **question needing answer or decision**. Explicit uncertainty or decision point.

**Examples:**
```
? Should we refactor now or ship first?
? Redis vs Postgres for session storage?
? Does this work for others or just me?
? Launch timing - need decision today
```

**Purpose:**
Makes questions explicit and trackable. Enables lifecycle management (questions eventually get answered or abandoned).

**Composition:**
```
! ? critical question                             # Urgent question
~ ? uncertain about this                          # Exploratory question
* ? definitely need answer                        # High-priority question
```

**With State:**
```
? [exploring] Which architecture approach?
? [blocked(reason: "needs user research", since: "2025-10-12")] Feature priority?
```

---

#### 4.3 `✓` (completed / done / finished)

**Semantic Definition:**
Marks **completion of action or task**. Signals "this is done."

**Examples:**
```
✓ Auth system implementation complete
✓ Tests passing
✓ Documentation updated
✓ Committed to git
```

**Purpose:**
Explicit completion tracking. Enables lifecycle automation (completed items can be migrated, archived, or removed after staleness period).

**Usage in Active Threads:**
```
### Completed
- ✓ (Oct 12) Auth system implementation
- ✓ (Oct 12) Database migration
- ✓ (Oct 15) README restructuring
```

**Lifecycle:**
```
? question
  ↓ (answered)
✓ question resolved
  ↓ (extract to Shared Discoveries)
[removed from Active Threads after 7 days]
```

---

### Category 5: Commands (1 marker)

#### 5.1 `action:` (specific action to execute)

**Semantic Definition:**
Specifies a **concrete action to take**. Direct, specific, executable.

**Examples:**
```
action: update brief.md with new strategy
action: create examples document
action: commit and push to git
action: run tests and fix failures
```

**Purpose:**
Distinguishes action requests from analysis requests.

**Important:**
```
# For actions, use action: marker:
action: fix the auth bug

# For deep analysis, use natural language:
"Please analyze the tradeoffs between these approaches in depth"

# Don't force action: marker for analysis requests
```

---

### Category 6: Modifiers (4 markers)

These are **prefix markers** - they modify other markers. They ALWAYS come BEFORE what they modify.

#### 6.1 `!` (urgent / time-sensitive / critical)

**Semantic Definition:**
Marks something as **urgent** - needs attention now, time-sensitive.

**ALWAYS PREFIX:** Comes before what it modifies.

**Examples:**
```
! Deploy blocker - API keys missing
! ? Launch timing - need decision today
! thought: Critical insight don't lose this
! [blocked(reason: "production down", since: "2025-10-17")] Fix immediately
```

**Composition:**
```
! ?                    # Urgent question
! thought:             # Critical insight
! [blocked]            # Critical blocker
! A -> B               # Urgent causal relationship
```

**Invalid Usage:**
```
Deploy blocker!        # WRONG: suffix usage
                      # Fix: ! Deploy blocker

urgent!               # WRONG: standalone urgency
                      # Fix: ! [whatever is urgent]
```

---

#### 6.2 `++` (strong positive / emphatic agreement / emphasis)

**Semantic Definition:**
Expresses **strong positive emphasis or agreement**. "This rocks" / "Exactly right" / "Love this."

**ALWAYS PREFIX:** Never use as suffix.

**Examples:**
```
++ Love this direction
++ That analysis nailed it
++ your analysis = fire
++ This is exactly what we need

Redis:
  ++ performance
  ++ scales well
```

**Invalid Usage:**
```
your analysis++            # WRONG: suffix
                          # Fix: ++ your analysis

hybrid approach++         # WRONG: suffix
                          # Fix: ++ hybrid approach
```

---

#### 6.3 `*` (high confidence / proven / definite)

**Semantic Definition:**
Marks **high confidence** - proven, definite, validated.

**ALWAYS PREFIX:** Comes before what it modifies.

**Examples:**
```
* thought: Evidence validates this works
* [decided(rationale: "proven through testing", on: "2025-10-12")] Use Redis
* observation: Convergence across 6 AI architectures
```

**Purpose:**
Explicit confidence level when it matters to interpretation.

**Use Sparingly:**
Only mark confidence when it actually matters. Don't prefix everything with `*`.

---

#### 6.4 `~` (low confidence / uncertain / maybe)

**Semantic Definition:**
Marks **low confidence** - uncertain, exploratory, tentative.

**ALWAYS PREFIX:** Comes before what it modifies.

**Examples:**
```
~ thought: Not sure but maybe relevant?
~ [exploring] Weak hypothesis, needs testing
~ performance improvement (depends on cache hit rate)
```

**Purpose:**
Explicit uncertainty. "I'm not confident about this" signal.

---

### Category 7: Structure (1 marker)

#### 7.1 `{ }` (thought blocks / atomic processing units)

**Semantic Definition:**
Groups **related ideas into atomic unit**. Enables hierarchical structure, nesting, and complex relationship expression.

**Simple block:**
```
{
  complete thought
  <- context/origin
  -> implication
}
```

**Multiple blocks showing relationship:**
```
{option A: faster but fragile}
><[speed vs reliability]
{option B: slower but robust}
-> need to decide based on priorities
```

**Nested blocks for hierarchy:**
```
{
  main idea
  -> {supporting detail 1}
  -> {supporting detail 2}
  -> conclusion from both
}
```

**Advanced nesting with inline sidebars:**
```
thought: {
  main observation about the pattern
  <- {context that led to this <- specific trigger}
  -> {implication 1}
  -> {implication 2 <- note this one is critical}
}
```

**Depth Limits:**
- **Readable:** 3-4 levels deep
- **Pushing it:** 5 levels
- **Too deep:** 6+ levels (break into multiple blocks)

**Purpose:**
- Hierarchical structure
- Grouping related concepts
- Nesting for depth
- Sidebar commentary
- Compression through structure

---

## Composition Rules

### Modifier Composition

**Modifiers are prefixes** and can compose:

```
! ?                           # Urgent question
~ thought:                    # Uncertain thought
* [decided]                   # High-confidence decision
! [blocked]                   # Critical blocker

! ~ thought:                 # Urgent but uncertain thought
* ! [decided]                # Highly confident urgent decision
```

**Order:** Modifiers can appear in any order before the marker they modify.

### Marker Composition

**State + Relationship:**
```
[blocked] -> prevents next step
[decided] = committed direction
```

**Modifiers + State:**
```
! [blocked(reason: "...", since: "...")]
* [decided(rationale: "...", on: "...")]
~ [exploring]
```

**Thought blocks + Relations:**
```
{
  thought: main insight
  <- context
  -> implication
}
```

### Invalid Compositions

```
->?                          # ERROR: markers don't merge
[decided blocked]            # ERROR: one state at a time
thought: action:             # ERROR: one insight/command marker
```

---

## Precedence Rules

When multiple markers appear, **precedence determines binding**:

1. **Modifiers** (`!` `++` `*` `~`) - highest precedence, bind to next marker
2. **States** (`[decided]` `[exploring]` `[blocked]` `[parking]`)
3. **Relationships** (`->` `=>` `<-` `<->` `><[axis]`)
4. **Structure** (`{ }`) - lowest precedence, groups everything

**Example:**
```
! [blocked(reason: "...", since: "...")] A -> B

Parses as:
  ! (modifies [blocked])
  [blocked] (state of A)
  A -> B (relationship)
```

---

## Escape Sequences

To use markers **literally** in text (not as FlowScript):

### Escaping Markers

```
\->         # Literal arrow in text (not causal marker)
\?          # Literal question mark (not question marker)
\\          # Literal backslash
\[          # Literal left bracket
\]          # Literal right bracket
\{          # Literal left brace
\}          # Literal right brace
```

**Examples:**
```
To type a literal arrow \-> in text use backslash-hyphen-greaterthan

The question mark \? character vs the FlowScript marker ?

Escape the backslash \\ itself with double backslash
```

### When Escaping is Needed

**In prose where markers would be interpreted:**
```
# Without escape (FlowScript):
A -> B means A causes B

# With escape (literal):
Type A \-> B to create a causal relationship
```

**In code examples:**
```
# Showing FlowScript syntax:
The \-> marker expresses causation
```

---

## Content-Hash ID Generation

FlowScript enables **automatic deduplication** through content-hash IDs. Same semantic content = same ID.

### Algorithm: SHA-256

**Input:** Normalized representation of node
- Content text (trimmed, normalized whitespace)
- Node type (statement, question, thought, etc.)
- Relevant attributes (not including provenance)

**Output:** SHA-256 hash as hexadecimal string

**Example:**
```
Input:
  type: "thought"
  content: "FlowScript enables dimensional expansion of thinking"

Output:
  id: "a7f2c8d1b4e9f6a3c5d8e2b7f1a4c9d6e3b8a2f7c1d5e9b4a8f2c6d1e5a9b3f"
```

### Why Content-Hash IDs?

**Automatic deduplication:**
```
# Same thought in two files = one node in graph

File 1:
  thought: Energy tracking = key differentiator

File 2:
  thought: Energy tracking = key differentiator

Result: Single node with same content-hash ID
```

**Transclusion support:**
```
# Reference same thought across documents
thought: {main insight}
  alias_of: "a7f2c8d1b4e9f6a3..."
```

**Benefits:**
- Zero-friction deduplication
- Same thought tracked across files
- Cross-document references
- Version-independent identity (same content = same ID)

### Normalization Rules

**Before hashing:**
1. Trim leading/trailing whitespace
2. Normalize internal whitespace (multiple spaces → single space)
3. Lowercase for case-insensitive comparison (OPTIONAL based on implementation)
4. Remove provenance data (not part of semantic identity)
5. Include structural markers (type, relationships)

---

## Provenance Tracking

Every FlowScript element can have **provenance** - metadata about origin, authorship, and creation.

### Purpose

**Trust:** Who wrote this? Human or AI?
**Audit:** When was this added? What version?
**Debugging:** Where did this come from? Which file, which line?
**Evidence:** Track decision chain - who decided what when?

### Required Fields

```
provenance: {
  source_file: "string (file path)"
  line_number: integer (line in source)
  timestamp: "ISO-8601 datetime"
}
```

### Optional Fields

```
provenance: {
  ...required fields...
  author: {
    agent: "string (name or ID)"
    role: "human" | "ai"
  }
  parser_version: "string (e.g., 'flowscriptc 0.1.0')"
  hash: "string (content hash for verification)"
}
```

### Example

```
Node:
  id: "a7f2c8d1..."
  type: "thought"
  content: "FlowScript enables dimensional expansion of thinking"
  provenance: {
    source_file: "memory.md"
    line_number: 142
    timestamp: "2025-10-12T14:23:15Z"
    author: {
      agent: "Claude"
      role: "ai"
    }
  }
```

### In FlowScript Text (Optional)

Provenance is typically added by parsers, not written manually. But can be explicit:

```
thought: Energy tracking = differentiator
  @source: memory.md:142
  @author: Phill
  @date: 2025-10-12
```

---

## Validation Rules

### ERROR-Level Rules (MUST fix)

1. **Unlabeled tension:** `><` without [axis] label
   ```
   speed >< quality              # ERROR: missing axis
   Fix: speed ><[velocity vs maintainability] quality
   ```

2. **Missing required state fields:**
   ```
   [blocked] Deploy              # ERROR: missing reason, since
   [decided] Ship now            # ERROR: missing rationale, on
   ```

3. **Invalid marker syntax:**
   ```
   ->?                          # ERROR: markers don't merge
   [decided blocked]            # ERROR: one state at a time
   ```

4. **Orphaned nodes:** Nodes not reachable from root/goal (see linter-rules.md)

5. **Causal cycles:** A -> B -> C -> A without explicit feedback flag (see linter-rules.md)

### WARNING-Level Rules (SHOULD fix)

1. **Missing recommended state fields:**
   ```
   [parking] Browser extension   # WARNING: why/until fields recommended
   ```

2. **Deep nesting:** Thought blocks nested >5 levels deep
   ```
   {{{{{{{...}}}}}}}            # WARNING: too deep, break into multiple blocks
   ```

3. **Long causal chains:** >10 steps without branching (see linter-rules.md)

---

## Usage Patterns

### Pattern 1: Bug Triage

```
auth bug -> login failures
? related to session handling
[blocked(reason: "needs staging environment", since: "2025-10-15")] fix requires testing
! [blocked(reason: "API keys pending", since: "2025-10-12")] Deploy
```

### Pattern 2: Architecture Decision

```
? session storage: Redis vs Postgres

{Redis}
++ performance
risk: added complexity

{Postgres}
++ simpler
~ performance (uncertain, probably fine)

performance ><[speed vs maintenance burden] simplicity
-> need to benchmark before deciding

[decided(rationale: "simplicity wins for MVP, can migrate later", on: "2025-10-15")]
Start with Postgres
```

### Pattern 3: Complex Planning

```
{
  FlowScript release
  <- docs must be complete
  -> [blocked(reason: "needs examples + README", since: "2025-10-10")] blocked on documentation
}
><[completeness vs speed]
{
  teachability concern
  <- validation from Claude Code + ChatGPT
  -> * [decided(rationale: "enough evidence to ship minimal", on: "2025-10-10")] validated
}
=>
[decided(rationale: "balance speed and quality", on: "2025-10-10")]
Ship with: learning doc + syntax + examples + README

action: complete remaining docs this session
```

### Pattern 4: Hybrid Style (Recommended)

```
We finalized v0.4 today. The key insight:

thought: relations are the core -> everything else = optional

This changes how we think about the syntax:
- Not "learn all 20 markers"
- Instead "learn 3, add more as needed"

pruning necessary -> theoretical markers != used markers
-> v0.4 = evidence-based minimal core

[decided(rationale: "evidence-based evolution", on: "2025-10-09")]
Keep what's used, prune what isn't
```

---

## Evolution Protocol

### Adding Markers

FlowScript v1.0 has **20 markers** - the minimal set proven through real use.

**To add new marker:**
1. Evidence of friction (existing markers insufficient)
2. Natural pattern emerging across multiple users/sessions
3. Clear gap in expressiveness
4. Proposal with rationale + examples
5. Community discussion + validation
6. Update this specification
7. Version increment

### Removing Markers

**To remove marker:**
1. Evidence of non-use (not used naturally over extended period)
2. Burden > value
3. Natural language works equally well
4. Deprecation period (mark as deprecated in v1.x, remove in v2.0)
5. Update specification
6. Version increment

### Changing Semantics

**To change marker meaning:**
1. Strong evidence current meaning creates confusion
2. Better alternative meaning identified
3. Breaking change protocol (major version increment)
4. Migration guide for existing FlowScript
5. Update specification
6. Version increment

---

## Version History

### v1.0.0 (October 2025)

**Breaking changes from v0.4.1:**
- Added `=>` temporal operator (18→19 markers)
- Formalized `✓` as official marker (19→20 markers)
- **REQUIRED** `><[axis]` axis labeling (lint ERROR if missing)
- **REQUIRED** `[blocked(reason, since)]` fields (lint ERROR if missing)
- **REQUIRED** `[decided(rationale, on)]` fields (lint ERROR if missing)
- **RECOMMENDED** `[parking(why, until)]` fields (lint WARNING if missing)
- Content-hash ID specification added
- Provenance tracking specification added
- Escape sequences formalized

**Why these changes:**
- `=>` enables clear causal vs temporal distinction (Decision 1)
- `✓` formalized due to widespread natural usage
- Required fields implement forcing functions (Decisions 2-3)
- Content-hash enables deduplication (Decision 6)
- Provenance enables trust + audit (Decision 6)

---

## Implementation Notes

### For Parser Developers

**This specification is your contract.**

- Each marker has exactly one semantic meaning
- Composition rules define how markers combine
- Precedence rules define binding order
- Validation rules define what's valid vs invalid
- IR schema (see ir.schema.json) defines output format

**Your parser must:**
- Implement all 20 markers with defined semantics
- Enforce ERROR-level validation rules
- Emit WARNING-level validation rules
- Generate canonical IR per specification
- Include provenance in output
- Generate content-hash IDs correctly

### For Tool Developers

**This specification enables:**
- Linters (validate FlowScript correctness)
- Formatters (pretty-print FlowScript)
- Visualizers (render thought graphs)
- Query engines (traverse relationship graphs)
- Editors (syntax highlighting, autocomplete)

**Use ir.schema.json** for canonical IR structure.

### For Users

**This specification defines:**
- What each marker means (no ambiguity)
- How markers compose
- What's valid FlowScript
- What will trigger lint errors/warnings

**Start simple:**
- Learn 3 markers: `->` `?` `><[axis]`
- Add more as needed
- Hybrid style (prose + selective notation) works best

---

## Conclusion

This semantic specification provides the **formal foundation** for FlowScript v1.0. Every marker has exactly one meaning. Composition rules are explicit. Validation rules are defined.

**This enables:**
- Unambiguous parsing
- Consistent interpretation across implementations
- Compilation to canonical IR
- Tool development (linters, formatters, visualizers)
- Computational operations on thought graphs

**Next steps:**
- See [ir.schema.json](ir.schema.json) for canonical IR structure
- See [grammar.md](grammar.md) for formal grammar (EBNF)
- See [linter-rules.md](linter-rules.md) for complete validation rules
- See [golden_examples_spec.md](golden_examples_spec.md) for validation targets

---

**FlowScript v1.0 Semantic Specification**
**Authoritative Definition**
**October 2025**
