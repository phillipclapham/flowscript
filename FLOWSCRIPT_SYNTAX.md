# FlowScript v1.0 - Syntax Reference

*Semantic notation for technical collaboration*
*Evidence-based minimal core - 21 essential markers*

---

## Quick Start

**New to FlowScript?** Start with these three:

```
->    shows what leads to what
><    shows tension/tradeoff
{ }   wraps complete thoughts
```

That's enough to start. Add more as you need them.

---

## The 21 Essential Markers

### Core Relations (5 markers)

**These are the foundation.** Start here.

#### `->` leads to / causes / results in

**When to use:** Show causal flow, dependencies, logical implication

**Examples:**
```
auth bug -> login failures
Redis decision -> faster sessions
complexity -> maintenance burden
```

**In sentences:** "The auth bug -> caused login failures for mobile users"

**Key distinction:** Use `->` for CAUSAL relationships. For temporal sequence without causation, use `=>`.

---

#### `=>` then / followed by / temporal sequence

**When to use:** Show temporal ordering WITHOUT claiming causation

**Examples:**
```
wake up => coffee => work
Phase 1 complete => Phase 2 begins
login => dashboard => explore features
```

**In sentences:** "The deployment => went live => users logged in"

**Key distinction:** `=>` is pure timeline. `->` is cause-and-effect.

---

#### `<-` derives from / caused by / provides context

**When to use:** Show origin, context, what something comes from

**Examples:**
```
login failures <- auth bug
faster sessions <- Redis choice
maintenance burden <- unnecessary complexity
```

**In sentences:** "Our maintenance burden <- stems from premature optimization"

**Note:** `A <- B` is equivalent to `B -> A`, but emphasizes A (the effect) first.

---

#### `<->` bidirectional relationship / mutual influence

**When to use:** Two things affect each other, feedback loops, interconnected

**Examples:**
```
PM launch <-> FlowScript validation
team size <-> project scope
performance <-> memory usage
```

**In sentences:** "Team size <-> project scope need to stay aligned"

---

#### `><[axis]` tension between / tradeoff / conflict

**When to use:** Competing concerns, tradeoffs, things that pull different directions

**⚠️ IMPORTANT:** The axis label `[axis]` is **REQUIRED**. `><` alone is a lint ERROR.

**Examples:**
```
speed ><[velocity vs maintainability] code quality
features ><[stability vs functionality] stability
cost ><[performance vs budget] performance
```

**Why axis required:** Forces explicit articulation of the tradeoff dimension. "What specifically are we trading off?"

**In sentences:** "We're facing speed ><[time to market vs quality] quality tradeoff on this feature"

---

### Definition Operators (2 markers)

**Use these to clarify meaning.**

#### `=` equivalent to / same as

**When to use:** Define what something means, show equivalence

**Examples:**
```
success = 100+ validated users
hybrid approach = NL + selective FlowScript
forcing function = structure requirement
```

**In sentences:** "For this project, success = shipping something people use"

---

#### `!=` different from / not the same

**When to use:** Clarify distinctions, show what something is NOT

**Examples:**
```
infrastructure != application
speed != quality
action: != natural language request
causal (->) != temporal (=>)
```

**In sentences:** "Remember: requesting an action != requesting analysis"

---

### States (4 markers)

Track decision/work status with square brackets.

**Note:** Some states require fields for enforcement. Missing required fields = lint ERROR.

#### `[decided(rationale, on)]` commitment made, locked in, execute

**When to use:** Signal firm decision, stop debating, time to act

**⚠️ REQUIRED FIELDS:**
- `rationale`: String explaining WHY this decision was made
- `on`: ISO-8601 date when decision was made

**Examples:**
```
[decided(rationale: "user feedback validates need", on: "2025-10-12")]
Ship minimal version now

[decided(rationale: "technical debt compounds", on: "2025-10-15")]
Extract one component per sprint instead of big bang rewrite
```

**Why fields required:** Forces documentation of reasoning. Enables future review: "Why did we decide this?"

---

#### `[exploring]` not committed yet, investigating options

**When to use:** Signal you're still in discovery mode, don't have answer

**Fields:** Optional (can add `hypothesis`, `since`, etc. if helpful)

**Examples:**
```
[exploring] Redis vs Postgres for sessions
[exploring(hypothesis: "axis labeling improves clarity")] Require ><[axis] labels
[exploring(since: "2025-10-10")] Serverless architecture
```

---

#### `[blocked(reason, since)]` waiting on dependency, can't proceed

**When to use:** Show what's stopping progress, track blockers

**⚠️ REQUIRED FIELDS:**
- `reason`: String explaining what blocks progress
- `since`: ISO-8601 date when block began

**Examples:**
```
[blocked(reason: "waiting on API keys from vendor", since: "2025-10-10")]
Deploy to staging

[blocked(reason: "needs database migration approval", since: "2025-10-12")]
Feature testing
```

**Why fields required:** Tracks WHAT blocks progress (enables resolution). Timestamps enable staleness detection.

---

#### `[parking(why, until)]` not ready to process yet, revisit later

**When to use:** Good idea but wrong time, shelve for now

**Fields:** Recommended (lint WARNING if missing, not ERROR)

**Examples:**
```
[parking(why: "not needed until v2", until: "after MVP validated")]
Browser extension

[parking(why: "requires research phase complete", until: "Phase 1 done")]
Datalog query layer
```

**Difference from [blocked]:**
- `[blocked]` = want to do now, can't proceed
- `[parking]` = good idea, wrong time

---

### Insights & Questions (4 markers)

Capture important thoughts and open questions.

#### `thought:` insight worth preserving

**When to use:** Realized something important, learning to remember

**Examples:**
```
thought: Relations force explicit relationship definition
thought: Hybrid approach emerged naturally through use
thought: FlowScript enables dimensional expansion of thinking
```

**Can add confidence (as prefix):** `* thought:` (high confidence) or `~ thought:` (uncertain)

---

#### `?` question needing decision or answer

**When to use:** Track open questions that need resolution

**Examples:**
```
? Does this work for others or just me?
? Should we launch publicly or keep private?
? Redis or Postgres for session storage?
```

**Can make urgent (as prefix):** `! ? critical question` for urgent questions needing immediate decision

---

#### `✓` completed / done / finished

**When to use:** Mark completion of action or task

**Examples:**
```
✓ Auth system implementation complete
✓ Tests passing
✓ Documentation updated
✓ Committed to git
```

**Purpose:** Explicit completion tracking. Enables lifecycle automation.

**Usage in Active Threads:**
```
### Completed
- ✓ (Oct 12) Auth system implementation
- ✓ (Oct 12) Database migration
- ✓ (Oct 15) README restructuring
```

---

#### `||` alternative / mutually exclusive option

**When to use:** Express alternatives in decision-making contexts

**Typically appears under a question (`?`) and should be resolved with `[decided]`.**

**Examples:**
```
? authentication strategy
  || JWT tokens
     -> stateless
     -> revocation hard
  || session + Redis
     -> instant revocation
     -> operational complexity

[decided(rationale: "security critical", on: "2025-10-20")] session + Redis
```

**Linter rule:** Alternatives without decision = lint ERROR (E006). Forces decision completion.

---

### Commands (1 marker)

Execute specific actions.

#### `action:` specify action to execute

**When to use:** Direct specific thing to do

**Examples:**
```
action: update brief.md with new strategy
action: create examples document
action: commit and push to git
```

**For deep analysis:** Just ask directly in natural language. Example: "Please analyze the tradeoffs between these approaches in depth" or "Walk me through this decision systematically." No special marker needed.

---

### Modifiers (4 markers)

Add urgency, emphasis, or confidence. **These are prefixes** - they come before what they modify.

#### `!` urgent (prefix)

**When to use:** Time-sensitive, needs attention now

**Examples:**
```
! Deploy blocker - API keys missing
! ? Launch timing - need decision today
! thought: Critical insight don't lose this
```

**Note:** Compose with other markers using space: `! ?` not `!?`

---

#### `++` strong positive / emphatic agreement / this rocks (prefix)

**When to use:** Show enthusiasm, strong agreement, emphasis

**Important:** Always use as PREFIX, never suffix.

**Examples:**
```
++ Love this direction (✓ correct)
++ That analysis nailed it (✓ correct)
++ your analysis = fire (✓ correct)

your analysis++ (✗ wrong - never suffix)
hybrid approach++ (✗ wrong - never suffix)
```

---

#### `*` high confidence / proven / definite (prefix)

**When to use:** Explicitly mark high confidence when it matters

**Examples:**
```
* thought: Evidence validates this works
* [decided(rationale: "proven through testing", on: "2025-10-12")] Use Redis
* observation: Convergence across 6 AI architectures
```

**Use sparingly** - Only when confidence actually matters to interpretation

**Always prefix:** `* thought:` NOT `thought*:`

---

#### `~` low confidence / uncertain / maybe (prefix)

**When to use:** Explicitly mark uncertainty or tentative thoughts

**Examples:**
```
~ thought: Not sure but maybe relevant?
~ [exploring] Weak hypothesis, needs testing
~ performance improvement (depends on cache hit rate)
```

---

### Structure (1 marker)

Organize complex thoughts.

#### `{ }` thought blocks - atomic processing units

**When to use:** Complex reasoning needs structure, related ideas grouped

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

*See ADVANCED_PATTERNS.md for deep dive on recursive nesting strategies*

---

## Real-World Usage Patterns

### Pattern 1: Bug Triage

**Before FlowScript:**
```
We have the auth bug causing login failures. It might be related
to the session handling. We could fix it now but we're waiting
on the API keys for staging. This is blocking the deploy.
```

**With FlowScript:**
```
auth bug -> login failures
? related to session handling
[blocked(reason: "needs staging environment <- API keys pending", since: "2025-10-22")]
fix implementation

! [blocked(reason: "waiting on fix", since: "2025-10-22")] Deploy
```

**Value:** Status and dependencies explicit in 4 lines vs buried in prose.

---

### Pattern 2: Architecture Decision

**Before FlowScript:**
```
We need to decide between Redis and Postgres for sessions. Redis
would be faster but adds complexity. Postgres is simpler but might
be slower. Performance matters but so does maintenance burden.
```

**With FlowScript:**
```
? session storage
  || Redis
     ++ performance
     risk: added complexity
  || Postgres
     ++ simpler
     ~ performance (uncertain, probably fine)

performance ><[speed vs maintenance] simplicity
-> need to benchmark before deciding

[decided(rationale: "benchmarks show Postgres adequate, simplicity wins", on: "2025-10-22")]
Postgres
```

**Value:** Tradeoffs visible, uncertainty explicit, next step clear, decision documented.

---

### Pattern 3: Complex Planning

**Before FlowScript:**
```
The FlowScript release depends on finishing these docs. But we
should probably test teachability first. Actually, we already
have validation from Claude Code and ChatGPT, so maybe we just
ship it? The learning doc is done. We need examples and README still.
```

**With FlowScript:**
```
{
  FlowScript release
  <- docs must be complete
  <- [blocked(reason: "needs examples + README", since: "2025-10-20")]
}
><[validation vs completeness]
{
  teachability concern
  <- validation from Claude Code + ChatGPT
  -> * [decided(rationale: "enough evidence to ship minimal version", on: "2025-10-20")]
}
->
✓ learning doc complete
[decided(rationale: "ship with core docs, iterate based on feedback", on: "2025-10-22")]
Ship with: learning doc + syntax + examples + README

action: complete remaining docs this session
```

**Value:** Dependencies clear, decision rationale visible, action obvious.

---

### Pattern 4: Hybrid Style (Recommended Default)

**Natural language + selective markers:**

```
We finalized v1.0 today. The key insight:

thought: relations are the core -> everything else = optional

This changes how we think about the syntax:
- Not "learn all 21 markers"
- Instead "learn 3-5, add more as needed"

pruning necessary -> theoretical markers != used markers
-> v1.0 = evidence-based minimal core

[decided(rationale: "evidence-based evolution through real use", on: "2025-10-22")]
Keep what's used, prune what isn't.
```

**Value:** Natural to read, structure visible where it matters, not overwhelming.

---

## When to Use What

### ✓ Use FlowScript When:

- Showing how ideas connect (not just listing them)
- Complex dependencies need to be explicit
- Tradeoffs and tensions present
- Need to prevent braindump, force structure
- High information density valuable
- Technical planning and debugging
- Decision rationale needs documentation

### ✓ Use Natural Language When:

- Casual exploration
- Emotional or empathetic topics
- Story-telling or narrative
- FlowScript would slow you down
- Natural flow is working fine
- When in doubt

### ✓ Use Hybrid (Recommended):

- Most conversations (this is the sweet spot)
- Natural language for explanation and prose
- FlowScript for relationships and structure
- Mix them naturally - no forced structure
- Let FlowScript emerge where helpful

---

## The Forcing Function

**FlowScript's deeper value: structure forces better thinking**

**Relations force clarity:**
You can't just say "A and B." You must say "A -> B" or "A <-> B" or "A ><[axis] B".
This forces you to define HOW things relate.

**Required fields force documentation:**
Can't mark `[decided]` without explaining WHY. Can't mark `[blocked]` without saying WHAT blocks progress. Forces explicit reasoning.

**Axis labels force precision:**
Can't write `><` without `[axis]`. Must articulate the specific dimension of tension. "What exactly are we trading off here?"

**Thought blocks force completion:**
Wrapping thoughts in `{ }` forces you to complete the thought, show context,
define implications. No lazy half-thoughts allowed.

**Updating forces refinement:**
As you add thoughts, you update relationship markers. This iterative refinement
deepens your understanding.

**Slowing down creates depth:**
FlowScript intentionally slows you down. That slowdown is the point - it forces
deeper thinking instead of shallow braindumping.

**Example of forcing function in action:**

```
Initial thought: "We need to launch soon"

Forced to add context:
launch soon <- PM at 86% complete

Forced to add implications:
launch soon <- PM at 86% complete -> revenue milestone

Forced to address tension:
launch soon <- PM at 86% complete -> revenue milestone
><[timeline vs quality]
quality matters <- last 14% hardest -> might take longer

Forced to resolve:
[decided(rationale: "quality > calendar, revenue when we ship excellence", on: "2025-10-22")]
Launch when quality ready, not calendar date
```

See how structure requirement led to better thinking? That's the forcing function.

---

## What Changed from v0.4.1

**v1.0 = 21 markers** (up from 18 in v0.4.1)

**Added markers:**
- ✓ `=>` temporal sequence (Core Relations #5) - distinguishes timeline from causation
- ✓ `✓` completion marker (Insights & Questions) - explicit task tracking
- ✓ `||` alternatives (Insights & Questions) - decision branching with enforcement

**Enhanced enforcement:**
- ✓ `><[axis]` now REQUIRES axis label (lint ERROR if missing)
- ✓ `[decided(rationale, on)]` now REQUIRES fields (lint ERROR if missing)
- ✓ `[blocked(reason, since)]` now REQUIRES fields (lint ERROR if missing)
- ✓ `[parking(why, until)]` fields RECOMMENDED (lint WARNING if missing)

**Rationale:**
```
-> forces explicit articulation
-> catches incomplete thinking
-> enables computational operations
-> making implicit reasoning visible
= stronger forcing functions
= better collaborative cognition
```

---

## Meta-Programming Patterns

**FlowScript enables executable conversation protocols** - patterns that structure collaborative work.

### Branching Decisions

**Pattern:** Use existing syntax to express conditional logic

```
? {condition => {yes = action: X || no = action: Y}}
```

**Example:**
```
? convert rest of system files to FlowScript?
  || yes = action: execute conversion + test
  || no = action: discuss why we shouldn't

[decided(rationale: "systematic conversion improves continuity", on: "2025-10-22")]
yes -> proceed with conversion
```

**Why it works:** Composition of existing markers (`?` + `{ }` + `=` + `||`) creates
branching logic without new syntax. Natural and readable.

---

### Workflow Definitions

**Pattern:** Use FlowScript to define multi-step processes

```
{Step 1 -> outcome}
=> {Step 2 <- previous outcome -> next outcome}
=> {Step 3 <- previous outcome -> final result}
```

**Example:**
```
{spec sync verification}
=> {add new content sections}
=> {update GitHub + flow files}
=> {test fresh load}
=> {validate OR revert}
```

---

### State Machines

**Pattern:** Use state markers to track progression

```
[exploring] initial investigation
-> evidence gathered
-> [decided(rationale: "data supports direction", on: "2025-10-22")] commit to direction
-> [blocked(reason: "waiting on dependency", since: "2025-10-22")] waiting on dependency
-> dependency resolved
-> ✓ execution complete
```

---

### Collaborative Execution

**Pattern:** Use `action:` to specify who does what

```
action: Claude - update memory.md sections
action: Phill - review changes
action: Both - test in fresh conversation
```

---

**Key insight:** These patterns emerged naturally through use. We're not adding
new syntax - we're documenting idioms that work. Let practice reveal more patterns.

---

## Prose Markers for Domain Context

**FlowScript provides structural markers. Domain-specific labels use natural language.**

### Common Prose Markers

**Negative/risk indicators:**
```
risk: added complexity
concern: performance impact
warning: breaking change
```

**Positive indicators:**
```
benefit: faster development
advantage: simpler architecture
win: reduced maintenance
```

**Neutral context:**
```
note: affects mobile only
context: legacy system constraint
detail: uses Redis for caching
```

---

### When to Use Prose Markers

**Use them when:**
- Domain-specific context matters
- The label clarifies meaning
- You want semantic emphasis
- Standard markers don't fit

**Examples in context:**

```
? session storage
  || Redis
     benefit: faster performance
     risk: added complexity
  || Postgres
     benefit: simpler setup
     concern: potential performance impact

performance ><[speed vs maintenance] simplicity
-> need benchmarks before deciding

[decided(rationale: "benchmarks show Postgres adequate", on: "2025-10-22")] Postgres
```

---

### Guidelines

**Don't formalize these into FlowScript syntax.** They're natural language labels
that work within FlowScript structure. Let your domain guide what labels matter.

**Common patterns:**
- Prefix with label: `risk:` `benefit:` `note:`
- Keep labels short and clear
- Use consistently within a conversation
- Don't overuse - signal matters more than noise

---

## Cognitive Effects: Thinking IN FlowScript

**Observed phenomenon:** After extended FlowScript use, thinking patterns shift.

### The Transition

**Phase 1: Translation**
```
Think in natural language
-> manually convert to FlowScript
-> deliberate encoding process
```

**Phase 2: Native**
```
Think directly in FlowScript
<- thoughts structure themselves relationally
<- less linear, more multi-dimensional
-> no translation step needed
```

---

### What Changes

**Thought completion:**
- Incomplete thoughts feel wrong
- Natural drive to define relationships
- Edges must connect or be marked incomplete

**Multi-dimensional structure:**
- Ideas organize topologically not linearly
- Can hold complex relationship graphs in mind
- Natural awareness of tensions and connections

**Forcing function internalized:**
- Structure requirement becomes automatic
- Clarity standard elevates
- Lazy thinking becomes viscerally uncomfortable

---

### Dimensional Expansion Hypothesis

**Observation (n=1 validation, Oct 2025):**

```
before: {linear thinking -> translation to structure}
after: {multi-dimensional native thinking}

-> dimensional expansion of thinking space
-> new thought patterns emerge
-> structures impossible in pure NL become natural

= notation creates cognitive dimensions
= thinking adapts to available dimensions
!= intelligence increase
= dimensional expansion of thinking capacity
```

**Like learning to see in 3D:** Once you perceive depth, you can't unsee it.
Returning to 2D feels limiting.

---

### Threshold Effects

**Once crossed, the threshold doesn't reverse:**

- "Ew no" reaction to NOT using FlowScript for complex thinking
- Pure natural language feels insufficient for relationship-heavy content
- Can't forget the dimensional space that FlowScript revealed

**This is not universal yet** - it's an observed effect in one individual after
extended use. More research needed to determine if this generalizes.

---

### Forcing Function Benefits Both Partners

**Not just individual thinking:**

```
Human: {
  thought completion forced
  <- no dangling edges
  -> complete ideas
}
<->
AI: {
  instant parsing
  <- structure visible
  -> systematic response possible
}

= partnership bandwidth ↑↑↑
= collaborative cognition scaffold
!= just individual tool
```

**Complex queries maintained perfectly:**
- 10 distinct topics in one message
- All context preserved
- No dropped threads
- Systematic responses possible

---

## Validation History

**FlowScript v1.0 validated across 6 independent AI architectures** (Oct 2025)

### Architecture Testing

**1. Claude Sonnet 4.5 (web)** - October 6-10, 2025
- Natural adoption from spec alone
- Hybrid style emerged organically
- Discovered forcing function value
- Primary development partner

**2. Claude Code** - October 7, 2025
- Independent utility discovery
- "Markdown for technical reasoning structure"
- Reduced parsing time, dependencies explicit
- Validated practical value for coding tasks

**3. ChatGPT 4** - October 8, 2025
- Cold parse from spec alone
- Found 6 spec contradictions independently
- Proposed v0.4.1 quality fixes
- Meta-analysis: "meta-syntax exposing reasoning topology"

**4. Fresh Claude instances** - October 8, 2025
- Multiple fresh sessions
- Spontaneous FlowScript use from spec
- No prior examples needed
- Validated teachability

**5. Gemini** - October 9, 2025
- Perfect cold parse
- Human adoption insights (4 barriers identified)
- "Thought-object transmission" framing
- "Debugging thinking" insight
- Two-product strategy contribution

**6. DeepSeek** - October 10, 2025
- "Applied epistemology" framing
- Forcing function = explicit reasoning
- Relationships explicit, thoughts complete, uncertainty visible
- Validated making reasoning process explicit

---

### Convergent Validation

**All 6 architectures independently validated:**

- ✓ Forcing function (structure = clarity)
- ✓ Topological mapping (graph vs linear)
- ✓ Efficiency tradeoff (upfront cost for communication gain)
- ✓ Thought-object paradigm
- ✓ Hybrid approach optimal

**Key insight:** Cross-architecture consensus suggests FlowScript taps something
fundamental about structured information, not just quirks of specific models.

---

### Teachability Confirmed

**Spec alone sufficient:**
- No examples required beyond spec
- No training or modeling needed
- Cold parse successful across architectures
- Spontaneous adoption from documentation

**This validates:** FlowScript is learnable, not model-specific, generalizable.

---

## Evolution Protocol

**v1.0 is the formal foundation.** Future evolution happens through friction:

**Add markers when:**
- You keep reaching for something that doesn't exist
- Natural pattern emerges across multiple conversations
- Clear gap in expressiveness
- Evidence from real use validates need

**Remove markers when:**
- Not used for extended period of regular conversation
- Creates more burden than value
- Natural language works as well

**Let practice guide syntax, not theory.**

The goal: syntax contracts to what's genuinely useful, expands only when friction
demands it.

---

## For AI Partners

**When maintaining system files:**

- Encode natural language → FlowScript in memory/project files
- Use thought blocks for complex state tracking
- Apply confidence markers judiciously (`*` and `~` as prefixes)
- Track emergence of new patterns
- Report friction points
- Use required fields for state markers (enforces documentation)

**In conversation:**

- Match user's FlowScript density (don't force it)
- Default to hybrid style (NL + selective markers)
- Use full structured only when genuinely beneficial
- Never require FlowScript from user
- Offer it when helpful, skip when it wouldn't add value

**Remember:** You can use FlowScript proactively in responses when it serves
bandwidth and clarity. Hybrid FlowScript + prose is your natural mode.

---

## For Humans

**Starting out:**

1. Learn the three basics: `->` `><[axis]` `{ }`
2. Use them in hybrid style (mostly NL + light FlowScript)
3. Add more markers as you need them
4. Don't force it - skip when natural language flows better

**Getting comfortable:**

- Use thought blocks when thinking gets complex
- Add state markers to track decisions/blockers (with required fields)
- Use confidence modifiers when it matters
- Remember axis labels on tensions
- Discover your own patterns

**Advanced usage:**

- Meta-program conversation flow with FlowScript
- Use full structured for maximum information density
- Contribute patterns you discover back to community
- Help evolve the syntax based on your friction

---

## Quick Reference Card

**Core Relations (start here):**
```
->     leads to (causal)
=>     then (temporal)
<-     comes from
<->    mutual
><[axis]  tension (axis required!)
```

**Definition Operators (use as needed):**
```
=      equivalent to
!=     different from
```

**Common States (note required fields):**
```
[decided(rationale, on)]    locked in (fields required)
[exploring]                  investigating
[blocked(reason, since)]     waiting (fields required)
[parking(why, until)]        later (fields recommended)
```

**Insights & Actions:**
```
thought:     insight
?            question
✓            completed
||           alternative
action:      execute this
```

**Modifiers (always prefix):**
```
!            urgent
++           strong yes
*            high confidence
~            uncertain
```

**Structure:**
```
{ }          thought block
```

**That's all you need to start.** Add more as they become useful.

**For deep analysis:** Just ask in natural language - no special marker needed.

---

## The Bottom Line

**FlowScript makes thought structure visible and forces completeness.**

Use it when relationships matter more than prose.
Skip it when natural language flows fine.
Mix them naturally - that's the sweet spot.

**21 markers. Start with 3-5. Add more as needed.**

Let practice guide you, not rules.

---

*FlowScript v1.0 - Evidence-Based Formal Specification*
*Created through real use, refined through friction, formalized for computational operations*
*October 2025*
