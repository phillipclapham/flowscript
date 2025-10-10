# FlowScript v0.4.1 - Syntax Reference

*Semantic notation for technical collaboration*
*Evidence-based minimal core - 20 essential markers*

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

## The 20 Essential Markers

### Core Relations (4 markers)

**These are the foundation.** Start here.

#### `->` leads to / causes / results in

**When to use:** Show causal flow, dependencies, what comes next

**Examples:**
```
auth bug -> login failures
Redis decision -> faster sessions
complexity -> maintenance burden
```

**In sentences:** "The auth bug -> caused login failures for mobile users"

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

#### `><` tension between / in conflict with / tradeoff

**When to use:** Competing concerns, tradeoffs, things that pull different directions

**Examples:**
```
speed >< code quality
features >< stability
cost >< performance
```

**In sentences:** "We're facing speed >< quality tradeoff on this feature"

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
action: != !go!
infrastructure != application
speed != quality
```

**In sentences:** "Remember: action: (do this) != !go! (analyze this)"

---

### States (4 markers)

Track decision/work status with square brackets.

#### `[decided]` commitment made, locked in, execute

**When to use:** Signal firm decision, stop debating, time to act

**Examples:**
```
[decided] Ship minimal version now
[decided] Keep FlowScript name
[decided] Focus PM first, FlowScript second
```

---

#### `[exploring]` not committed yet, investigating options

**When to use:** Signal you're still in discovery mode, don't have answer

**Examples:**
```
[exploring] Redis vs Postgres for sessions
[exploring] Whether to release publicly
[exploring] Best architecture for real-time sync
```

---

#### `[blocked]` waiting on dependency, can't proceed

**When to use:** Show what's stopping progress, track blockers

**Examples:**
```
[blocked] Deploy waiting on API keys
[blocked] Testing needs staging environment
[blocked] Launch blocked by legal review
```

---

#### `[parking]` not ready to process yet, revisit later

**When to use:** Good idea but wrong time, shelve for now

**Examples:**
```
[parking] Browser extension until v2
[parking] Mobile app after web stable
[parking] Advanced features post-MVP
```

---

### Insights & Questions (2 markers)

Capture important thoughts and open questions.

#### `thought:` insight worth preserving

**When to use:** Realized something important, learning to remember

**Examples:**
```
thought: Relations force explicit relationship definition
thought: Hybrid approach emerged naturally through use
thought: Size limits were premature optimization
```

**Can add confidence (as prefix):** `* thought:` (high confidence) or `~ thought:` (uncertain)

---

#### `?` question needing decision or answer

**When to use:** Track open questions that need resolution

**Examples:**
```
? Does this work for others or just Phill?
? Should we launch publicly or keep private?
? Redis or Postgres for session storage?
```

**Can make urgent (as prefix):** `! ? critical question` for urgent questions needing immediate decision

---

### Commands (2 markers)

Invoke processing modes.

#### `!go!` apply maximum analysis

**When to use:** Need deep thinking, want comprehensive analysis

**Examples:**
```
!go! market viability for premium tier
!go! technical tradeoffs between approaches
!go! our collaboration patterns
```

**Different from `action:`** - This says "think deeply" not "do this thing"

---

#### `action:` specify action to execute

**When to use:** Direct specific thing to do (not analysis)

**Examples:**
```
action: update brief.md with new strategy
action: create examples document
action: commit and push to git
```

**Different from `!go!`** - This says "do this thing" not "analyze this"

---

### Modifiers (3 markers)

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

#### `*` and `~` confidence modifiers (prefix)

**When to use:** Explicitly mark confidence level when it matters

**Examples:**
```
* thought: Evidence validates this works (high confidence)
~ thought: Not sure but maybe relevant? (low confidence)
* [decided] Locked in, no changing (very confident decision)
~ [exploring] Weak hypothesis, needs testing (uncertain exploration)
```

**Use sparingly** - Only when confidence actually matters to interpretation

**Always prefix:** `* thought:` NOT `thought*:`

---

### Structure (2 markers)

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
><
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

---

#### `@project` direct to specific project

**When to use:** Scope thought/decision to particular project

**Examples:**
```
@flowscript: [decided] Release minimal version
@protocol_memory: [blocked] Deploy waiting on keys
```

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
[blocked] fix needs staging environment <- API keys pending
! [blocked] Deploy
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
? session storage: Redis vs Postgres

Redis:
  ++ performance
  risk: added complexity

Postgres:  
  ++ simpler
  ~ performance (uncertain, probably fine)

performance >< maintenance burden
-> need to benchmark before deciding
```

**Value:** Tradeoffs visible, uncertainty explicit, next step clear.

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
  -> [blocked] needs: examples + README
}
><
{
  teachability concern
  <- validation from Claude Code + ChatGPT
  -> * [decided] enough evidence to ship minimal version
}
->
[decided] Ship with: learning doc + syntax + examples + README
action: complete remaining docs this session
```

**Value:** Dependencies clear, decision rationale visible, action obvious.

---

### Pattern 4: Hybrid Style (Recommended Default)

**Natural language + selective markers:**

```
We finalized v0.4 today. The key insight:

thought: relations are the core -> everything else = optional

This changes how we think about the syntax:
- Not "learn all 20 markers"  
- Instead "learn 3, add more as needed"

pruning necessary -> theoretical markers != used markers
-> v0.4 = evidence-based minimal core

[decided] Keep what's used, prune what isn't.
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
You can't just say "A and B." You must say "A -> B" or "A <-> B" or "A >< B". 
This forces you to define HOW things relate.

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
><
quality matters <- last 14% hardest -> might take longer

Forced to resolve:
[decided] Launch when quality ready, not calendar
-> revenue milestone when we ship something excellent
```

See how structure requirement led to better thinking? That's the forcing function.

---

## What Got Pruned (Evidence-Based)

**v0.4 = 20 markers** (down from 30+ in v0.3)

**Markers dropped after real usage testing:**

- ✗ `!!` critical blocker → use `! [blocked]` (composition beats special tokens)
- ✗ `!?` urgent question → use `! ?` (composition beats special tokens)
- ✗ `--` strong negative → use prose like `risk:` or `concern:`
- ✗ `~~` uncertain negative → use `~` prefix with prose
- ✗ `!thought:` critical insight → use `! thought:` (composition)
- ✗ `!reflect!` action marker → never used, NL works
- ✗ `[testing]` state → never naturally used
- ✗ `@system` `@meta` scopes → `@project` is enough
- ✗ `let x = y` logic constructs → can express in NL if needed
- ✗ `if {...}` conditionals → can express in NL if needed  
- ✗ `|| &&` operators → can express in NL if needed
- ✗ `for each` loops → never used, NL works

**Pruning principle:** If it wasn't used naturally in 2-4 days of real conversation, 
it's gone. The syntax contracts to what you actually use.

**v0.4.1 refinement:** Fixed spec contradictions - composition over special tokens, 
prefix modifiers consistently, clearer categorization.

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
=> {
  yes = action: execute conversion + test
  ||
  no = action: discuss why we shouldn't
}
```

**Why it works:** Composition of existing markers (`?` + `{ }` + `=` + `||`) creates 
branching logic without new syntax. Natural and readable.

---

### Workflow Definitions

**Pattern:** Use FlowScript to define multi-step processes

```
{Step 1 -> outcome}
-> {Step 2 <- previous outcome -> next outcome}
-> {Step 3 <- previous outcome -> final result}
```

**Example:**
```
{spec sync verification}
-> {add new content sections}
-> {update GitHub + flow files}
-> {test fresh load}
-> {validate OR revert}
```

---

### State Machines

**Pattern:** Use state markers to track progression

```
[exploring] initial investigation
-> evidence gathered
-> [decided] commit to direction
-> [blocked] waiting on dependency
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
? session storage: Redis vs Postgres

Redis:
  benefit: faster performance
  risk: added complexity
  
Postgos:
  benefit: simpler setup
  concern: potential performance impact
  
performance >< simplicity
-> need benchmarks before deciding
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
Phill: {
  thought completion forced
  <- no dangling edges
  -> complete ideas
}
<->
Claude: {
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

**FlowScript v0.4.1 validated across 6 independent AI architectures** (Oct 2025)

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

**v0.4.1 is the minimal viable core.** Future evolution happens through friction:

**Add markers when:**
- You keep reaching for something that doesn't exist
- Natural pattern emerges across multiple conversations
- Clear gap in expressiveness

**Remove markers when:**
- Not used for 2-4 weeks of regular conversation
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

1. Learn the three basics: `->` `><` `{ }`
2. Use them in hybrid style (mostly NL + light FlowScript)
3. Add more markers as you need them
4. Don't force it - skip when natural language flows better

**Getting comfortable:**

- Use thought blocks when thinking gets complex
- Add state markers to track decisions/blockers
- Use confidence modifiers when it matters
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
->     leads to
<-     comes from
<->    mutual
><     tension
```

**Definition Operators (use as needed):**
```
=      equivalent to
!=     different from
```

**Common States:**
```
[decided]    locked in
[exploring]  investigating  
[blocked]    waiting
[parking]    later
```

**Useful Extras:**
```
thought:     insight
?            question
!            urgent (prefix)
++           strong yes
{ }          thought block
```

**That's all you need to start.** Add more as they become useful.

---

## The Bottom Line

**FlowScript makes thought structure visible.**

Use it when relationships matter more than prose.  
Skip it when natural language flows fine.  
Mix them naturally - that's the sweet spot.

**20 markers. Start with 3. Add more as needed.**

Let practice guide you, not rules.

---

*FlowScript v0.4.1 - Evidence-Based Minimal Core*  
*Created through real use, refined through friction*  
*October 2025*
