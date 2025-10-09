# FlowScript v0.4 - Syntax Reference

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

### Core Relations (6 markers)

**These are the foundation.** Everything else is optional.

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

**Can add confidence:** `thought*:` (high confidence) or `thought~:` (uncertain)

---

#### `?` question needing decision or answer

**When to use:** Track open questions that need resolution

**Examples:**
```
? Does this work for others or just Phill?
? Should we launch publicly or keep private?
? Redis or Postgres for session storage?
```

**Can make urgent:** `!?` for critical questions needing immediate decision

---

### Commands (2 markers)

Invoke processing modes.

#### `!go!` apply maximum analysis

**When to use:** Need deep thinking, want comprehensive analysis

**Examples:**
```
!go! market viability for premium tier
!go! technical tradeoffs between approaches
!go! @meta our collaboration patterns
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

### Modifiers (4 markers)

Add urgency, emphasis, or confidence.

#### `!` urgent (prefix)

**When to use:** Time-sensitive, needs attention now

**Examples:**
```
! Deploy blocker - API keys missing
!? Launch timing - need decision today
!thought: Critical insight don't lose this
```

---

#### `++` strong positive / emphatic agreement / this rocks

**When to use:** Show enthusiasm, strong agreement, emphasis

**Examples:**
```
++ Love this direction
++ That analysis nailed it
hybrid approach ++ natural and effective
```

---

#### `*` high confidence (prefix)

**When to use:** Very sure about this, proven, definite

**Examples:**
```
thought*: Evidence validates this works
[decided*] Locked in, no changing
```

**Use sparingly** - Only when confidence actually matters to interpretation

---

#### `~` low confidence (prefix)

**When to use:** Uncertain, exploring, might be wrong

**Examples:**
```
thought~: Not sure but maybe relevant?
[exploring~] Weak hypothesis, needs testing
```

**Use sparingly** - Only when confidence actually matters to interpretation

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
!! deploy blocked
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
  -- adds complexity

Postgres:  
  ++ simpler
  ~~ performance (maybe fine?)

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
  <- validation from Claude Code + ChatGPT [decided*]
  -> enough evidence to ship minimal version
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

**14 markers dropped after real usage testing:**

- ✗ `!!` critical blocker → redundant with `!`
- ✗ `!?` urgent question → `!` + `?` works fine  
- ✗ `!thought:` critical insight → `thought:` + `!` works fine
- ✗ `!reflect!` action marker → never used, NL works
- ✗ `[testing]` state → never naturally used
- ✗ `@system` `@meta` scopes → `@project` enough
- ✗ `let x = y` logic constructs → can express in NL if needed
- ✗ `if {...}` conditionals → can express in NL if needed  
- ✗ `|| &&` operators → can express in NL if needed
- ✗ `for each` loops → never used, NL works

**Pruning principle:** If it wasn't used naturally in 2-4 days of real conversation, 
it's gone. The syntax contracts to what you actually use.

---

## Evolution Protocol

**v0.4 is the minimal viable core.** Future evolution happens through friction:

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
- Apply confidence markers judiciously (`*` and `~`)
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

**Core Relations (learn these first):**
```
->     leads to
<-     comes from
<->    mutual
><     tension
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
!            urgent
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

*FlowScript v0.4 - Evidence-Based Minimal Core*  
*Created through real use, refined through friction*  
*October 2025*
