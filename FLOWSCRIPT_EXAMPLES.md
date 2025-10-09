# FlowScript Examples and Patterns

*Real-world scenarios showing when and how FlowScript helps*

---

## How to Use This Guide

**Each example shows:**
- ❌ Before: Natural language version (what you'd normally write)
- ✅ With FlowScript: Structured version (relationships and dependencies explicit)
- 💡 Why it helps: What FlowScript makes visible

**Start simple, get complex.** Early examples use 3-5 markers. Later examples show advanced patterns.

---

## Part 1: Basic Patterns

### Using `->` (leads to)

❌ **Before:**
```
The API timeout is causing the user to see errors. This makes them retry, 
which creates more load on the server, making the problem worse.
```

✅ **With FlowScript:**
```
API timeout -> user sees errors -> user retries -> more server load -> worse timeouts
```

💡 **Why it helps:** The cascade is immediately visible. Six steps that would take a paragraph to explain become one line showing the feedback loop.

---

### Using `><` (tension)

❌ **Before:**
```
We want to ship fast but we also need it to be stable. Adding features 
quickly would make users happy but might introduce bugs. We need to 
balance these concerns.
```

✅ **With FlowScript:**
```
ship fast >< maintain stability
more features >< fewer bugs
user happiness >< system reliability
```

💡 **Why it helps:** The three tradeoffs are instantly visible. No need to explain "balance" - the `><` marker shows the tension exists.

---

### Using `{ }` (thought blocks)

❌ **Before:**
```
The Redis solution would be faster, and it scales well, but it adds 
operational complexity. We'd need to learn Redis, maintain another 
service, and handle failover. That's a lot of overhead for a small team.
```

✅ **With FlowScript:**
```
{
  Redis option
  ++ performance
  ++ scales well
  -- operational complexity
  -> requires: learning + maintenance + failover handling
  <- small team = high overhead cost
}
```

💡 **Why it helps:** All pros/cons contained in one atomic unit. The context (small team) and implications (high overhead) are explicit.

---

## Part 2: Real-World Scenarios

### Scenario 1: Bug Triage

❌ **Before:**
```
We've got a critical auth bug in production that's preventing mobile users 
from logging in. It started after yesterday's deploy. Sarah thinks it might 
be related to the session token changes in PR #347. We need to roll back 
immediately to restore service, then debug in staging. The rollback is 
blocked because Jenkins is down - DevOps is working on it. ETA 30 minutes. 
Once we roll back, we can investigate whether it's the token change or 
something else.
```

✅ **With FlowScript:**
```
!! auth bug in production
-> mobile users can't login
<- yesterday's deploy (PR #347 session token changes)

[decided] Rollback immediately to restore service
[blocked] Jenkins down <- DevOps working on it (ETA: 30min)

After rollback:
[exploring] Is it token change or something else?
-> need to debug in staging
```

💡 **Why it helps:** 
- `!!` signals critical severity immediately
- Dependencies and blockers explicit
- Decision vs investigation clearly separated
- Timeline visible (ETA in blocker)
- Action plan obvious

---

### Scenario 2: Architecture Decision with Tradeoffs

❌ **Before:**
```
We need to decide how to handle real-time notifications. WebSockets would 
give us true push notifications with low latency, but they're harder to 
scale and maintain. We'd need to manage connections, handle reconnects, 
and deal with load balancing. Polling is much simpler - just HTTP requests 
on an interval. It's easier to cache, easier to scale, but creates more 
server load and has higher latency. Our users probably don't need 
sub-second updates, so polling might be fine. But if we grow, polling 
could get expensive. We need to figure out our priorities.
```

✅ **With FlowScript:**
```
? Real-time notifications: WebSockets vs Polling

{
  WebSockets
  ++ true push (low latency)
  ++ feels snappier
  -- complex (connection mgmt + reconnect + load balancing)
  -- harder to scale
}
><
{
  Polling  
  ++ much simpler (just HTTP)
  ++ easier to cache + scale
  -- more server load
  -- higher latency
}

constraints:
- users don't need sub-second updates
- BUT growth could make polling expensive

thought: start simple, migrate later if needed
-> [decided] Polling for MVP, monitor load, switch if it becomes problem
```

💡 **Why it helps:**
- Both options' pros/cons in structured blocks
- `><` shows they're alternatives, not compatible
- Constraints listed separately from options
- Decision includes future migration path
- Rationale preserved (start simple)

---

### Scenario 3: Complex Dependency Chain

❌ **Before:**
```
The frontend deploy is blocked because we're waiting on the API to be 
updated first. The API update needs the database migration to run. The 
migration is ready but we can't run it until the backup completes. The 
backup is running now, should be done in an hour. Once the backup finishes, 
we run the migration, then deploy the API, then we can deploy the frontend. 
But actually, QA needs to test the API in staging before production deploy, 
so add that step too.
```

✅ **With FlowScript:**
```
Frontend deploy blocked on:
-> API update blocked on:
   -> database migration blocked on:
      -> [blocked] backup in progress (ETA: 1hr)

After backup completes:
1. Run migration
2. Deploy API to staging  
3. [blocked] QA testing in staging
4. Deploy API to production
5. Deploy frontend

[decided] Timeline: ~3hrs minimum (backup + testing + deploys)
```

💡 **Why it helps:**
- Nested dependencies immediately visible
- Timeline clear (3hr minimum)
- Testing step won't get forgotten
- Each blocker explicit
- Sequential steps numbered

---

### Scenario 4: Feature Prioritization

❌ **Before:**
```
We have three features users are asking for: advanced search, export to 
PDF, and email notifications. Advanced search would help power users find 
stuff faster but it's complex to build - probably 3 weeks of work. PDF 
export is easier, maybe 1 week, and several customers have asked for it. 
Email notifications are critical for engagement but requires setting up 
email infrastructure we don't have yet - 2 weeks plus ongoing maintenance. 
We can only do one this sprint. We need revenue, so should we do what 
customers are actively asking for (PDF export)?
```

✅ **With FlowScript:**
```
? Feature for next sprint (can only do one)

Options:

{Advanced Search}
++ helps power users  
-- complex (3 weeks)
[exploring] Revenue impact unclear

{PDF Export}
++ customers asking for it
++ quick win (1 week)
++ potential revenue unlocker

{Email Notifications}  
++ critical for engagement
-- requires infrastructure setup (2 weeks)
-- ongoing maintenance burden

Constraints:
- need revenue soon
- prefer quick wins while small

[decided] PDF Export
-> customers asking = validated demand
-> quick ship = faster revenue
-> [parking] search + email for later sprints
```

💡 **Why it helps:**
- All three options in comparable structure
- Effort estimates explicit
- Constraints separated from options
- Decision rationale clear (validated demand + quick ship)
- Parked items won't be forgotten

---

### Scenario 5: Debugging Complex Interaction

❌ **Before:**
```
Users are reporting that sometimes their saved data disappears. It doesn't 
happen every time, only occasionally. When we look at the logs, we see 
successful save operations, so the data is reaching the database. But then 
later it's gone. We think it might be a race condition - if a user saves 
and then immediately navigates away, maybe the second component is loading 
stale data and overwriting the save? Or maybe it's the cache invalidation 
not working properly? We should check if it correlates with the new 
optimistic updates feature we shipped last week.
```

✅ **With FlowScript:**
```
Bug: Saved data occasionally disappears

What we know:
- intermittent (not every time)
- logs show successful save operations
- data reaches database
- but then gone later

Hypotheses:

{Race condition}
user saves -> navigates immediately
-> second component loads stale data
-> overwrites fresh save

{Cache invalidation}  
save completes -> cache not invalidated
-> stale cache served on next load

{Optimistic updates}
<- new feature shipped last week
-> possible correlation?

action: Check logs for timing patterns
? Does disappearance correlate with quick navigation?
? Does it correlate with optimistic update feature usage?

[decided] Start with timing analysis before diving into code
```

💡 **Why it helps:**
- Known facts separated from hypotheses
- Each hypothesis as thought block with causal chain
- Timing relationships explicit (-> immediately ->)
- Investigation plan clear
- Correlation questions explicit

---

### Scenario 6: Refactoring Decision

❌ **Before:**
```
Our user model is getting really messy. It started simple but now it has 
authentication stuff, profile data, billing information, preferences, and 
activity tracking all mixed together. Every time we add a feature we add 
more fields. The class is over 1000 lines now. We should probably split 
it up, but that's a big refactor. It's working right now, and we have 
feature deadlines to hit. Maybe we just leave it alone for now and 
refactor later when we have more time?
```

✅ **With FlowScript:**
```
Problem: User model bloated (1000+ lines)
<- started simple  
-> grew to include: auth + profile + billing + prefs + activity
-> every feature adds more fields

{Refactor now}
++ cleaner codebase
++ easier future development  
-- big time investment
-- delays feature work
[blocked] feature deadlines approaching

{Leave it}  
++ hit deadlines
-- keeps growing
-- future refactor gets harder
thought: "technical debt compounds"

><

[decided] Incremental approach:
1. Stop adding to User model (new features in separate models)
2. Extract one piece per sprint (start with billing)
3. Hit deadlines while slowly improving architecture

-> technical debt stops growing
-> makes progress without big bang rewrite
```

💡 **Why it helps:**
- Problem origin and growth pattern visible
- Refactor-now vs leave-it tradeoffs explicit
- Deadline constraint acknowledged
- Third option (incremental) emerges from seeing the tension
- Prevents false binary (refactor-all vs refactor-never)

---

### Scenario 7: Performance vs Simplicity Tradeoff

❌ **Before:**
```
The dashboard is loading slowly because we're making separate API calls for 
each widget. We could optimize this by creating a single endpoint that 
returns all the data at once. That would reduce the number of requests from 
12 to 1, which should be much faster. But it means we need a custom endpoint 
just for the dashboard, which makes our API less consistent. Also, if we 
add or remove widgets later, we'd need to update that endpoint. Maybe we 
should do it anyway though, because the performance difference is significant. 
Or we could implement caching instead?
```

✅ **With FlowScript:**
```
Problem: Dashboard slow (12 separate API calls)

{Option A: Single dashboard endpoint}
++ performance (12 requests -> 1)  
++ significantly faster
-- custom endpoint (breaks API consistency)
-- couples dashboard to backend
-- harder to modify widgets later

{Option B: Keep separate calls + add caching}
++ maintains API consistency
++ widgets stay decoupled
~~ performance improvement (depends on cache hit rate)

{Option C: Client-side request batching}
++ performance (12 -> 1 or 2 roundtrips)
++ keeps API consistent
~~ complexity in client
[exploring] How complex is this to implement?

Metrics:
- current load time: 3-4 seconds
- acceptable load time: <1 second
- users complain frequently

thought: user experience matters more than API consistency
-> [decided] Option A for now
-> IF widgets change frequently, revisit batching approach
```

💡 **Why it helps:**
- Three options instead of two (batching emerged)
- Each option's tradeoffs explicit
- Uncertainty marked (`~~` for cache hit rate, `~` for complexity)
- Metrics provide decision context
- Decision includes future pivot point

---

### Scenario 8: Database Schema Decision

❌ **Before:**
```
We need to store user preferences. We could use a JSON column in the users 
table - that's flexible and easy. Or we could create a separate preferences 
table with a row per preference - that's more normalized and easier to 
query. The JSON approach is simpler to start with but might cause problems 
later if we need to search or filter by preferences. The normalized approach 
is more work upfront but more flexible later. We probably won't need to 
query preferences often, but we might. Hard to predict.
```

✅ **With FlowScript:**
```
? How to store user preferences

{JSON column in users table}
++ simple to implement
++ flexible (no schema changes needed)
-- can't easily query/filter
-- can't index on specific preferences
-- migrations harder if structure changes

{Normalized preferences table}
++ queryable + filterable
++ indexable
++ easier migrations
-- more upfront work
-- more complex queries

Current needs:
- storing preferences ✓
- querying preferences ~~ (maybe, unclear)
- filtering by preferences ~~ (probably not soon)

thought: optimize for current needs + easy migration path
-> [decided] Start with JSON column
-> IF we need querying, migrate to normalized table
-> JSON -> table migration is straightforward (one-time script)

[decided] Build for today, make tomorrow's migration easy
```

💡 **Why it helps:**
- Both approaches' tradeoffs explicit
- Current vs future needs separated
- Uncertainty marked (`~~`)
- Migration path considered upfront
- Decision rationale preserved

---

### Scenario 9: API Design Discussion

❌ **Before:**
```
We need to design the endpoint for getting a user's purchase history. Should 
it be GET /users/123/purchases or GET /purchases?user_id=123? The first one 
is more RESTful and shows the relationship clearly. The second one is more 
flexible if we want to query purchases other ways later. We could also do 
both - have the user-scoped endpoint as the main one and the purchases 
endpoint as a search interface. That's more work but gives us both benefits. 
Though maybe that's over-engineering for something we might not need.
```

✅ **With FlowScript:**
```
? API endpoint for user purchase history

{GET /users/:id/purchases}
++ RESTful (shows ownership relationship)
++ intuitive (purchases belong to user)  
-- locked to user-scoped queries only

{GET /purchases?user_id=:id}
++ flexible (can add other filters later)
-- less clear ownership relationship
-- requires query param parsing

{Both endpoints}  
++ RESTful + flexible
-- more work
-- more to maintain
? Do we need the flexibility?

Current requirements:
- get purchases for a user ✓
- search all purchases [parking] (not needed now)

Future possibilities:
- admin view of all purchases ~~ (maybe needed)
- filter purchases by date/amount ~~ (unclear)

[decided] Start with /users/:id/purchases
-> covers current need
-> RESTful + clear
-> IF we need flexible search later, add /purchases endpoint then
-> two endpoints = fine if they serve different use cases

thought: YAGNI until we need it
```

💡 **Why it helps:**
- All three approaches visible
- Current vs future requirements explicit
- Uncertainty acknowledged (`~~`)
- YAGNI principle applied
- Future addition path clear

---

### Scenario 10: Testing Strategy

❌ **Before:**
```
We need better test coverage but we're not sure where to focus. We could 
write unit tests for everything, but that takes a long time and some of 
the code changes frequently. Integration tests would catch more real bugs 
but they're slower and more brittle. E2E tests give us confidence the app 
works but they're really slow and break when we change UI. We probably 
need a mix, but what's the right balance? And should we block features 
until tests are written?
```

✅ **With FlowScript:**
```
? Testing strategy - where to invest effort

Test types tradeoffs:

{Unit tests}
++ fast
++ catch logic errors
-- miss integration issues  
-- high maintenance (code changes often)

{Integration tests}
++ catch real bugs  
++ reasonable speed
~~ brittleness depends on design

{E2E tests}
++ confidence app actually works
-- very slow
-- fragile (break on UI changes)

Current state:
- coverage: ~40%
- bugs from: integration issues mostly
- development speed: fast (feature work)

Strategy:

[decided] Testing pyramid:
1. Core business logic -> unit tests ✓
2. API contracts + DB -> integration tests ✓✓ (focus here)
3. Critical user flows -> E2E tests (minimal)

[decided] Don't block features on tests
-> write tests same sprint as feature
-> but don't block ship if test not done
-> track technical debt, pay down next sprint

thought: perfect coverage != valuable coverage
-> focus on high-risk areas
-> integration tests give best ROI for our bugs
```

💡 **Why it helps:**
- Three test types compared directly
- Current pain point explicit (integration issues)
- Strategy prioritized (integration tests = focus)
- Blocking question answered
- Tradeoff acknowledged (coverage vs velocity)

---

### Scenario 11: Team Communication

❌ **Before:**
```
The team is having trouble staying coordinated. Frontend doesn't know what 
backend is working on, so they build features that depend on API endpoints 
that don't exist yet. Backend doesn't know frontend priorities, so they 
build endpoints nobody uses. Stand-ups take forever and people zone out. 
Slack is chaos - questions get lost. Maybe we need better documentation? 
Or more meetings? Or different meetings? We tried a weekly planning meeting 
but nobody prepared for it so it was just arguing about priorities.
```

✅ **With FlowScript:**
```
Problem: Team coordination breakdown

Symptoms:
- frontend builds on non-existent APIs
- backend builds unused endpoints  
- stand-ups long + unfocused
- Slack questions lost
- planning meetings unproductive

Root causes:
-> no shared visibility on current work
-> no shared roadmap  
-> communication not captured/searchable

{More meetings}
++ enforced synchronization
-- people hate meetings
-- doesn't solve async communication

{Better documentation}  
++ searchable + persistent
-- nobody reads docs
-- stale immediately

{Shared project board + API contract-first}
++ visibility on who's building what
++ API contracts defined before implementation
++ async communication (fewer meetings)
-- requires discipline
[blocked] Need to choose tool + establish process

[decided] Three changes:
1. Shared board (GitHub Projects) <- already have it
2. API design review before implementation
3. Replace daily standup with async updates (Mon/Wed/Fri)

-> frontend sees what's coming (API designs)
-> backend sees priorities (board)  
-> less meeting time
-> searchable communication

[exploring] Try for 2 weeks, adjust based on friction
```

💡 **Why it helps:**
- Symptoms separated from root causes
- Multiple potential solutions examined
- Chosen solution addresses root causes directly
- Implementation specifics clear
- Trial period built in

---

## Part 3: Common Combinations

### Pattern: Decision with Alternatives

```
? Problem statement

{Option A}
++ benefits
-- drawbacks

><

{Option B}  
++ benefits
-- drawbacks

Constraints:
- important factor 1
- important factor 2

[decided] Choice with rationale
-> next actions
```

---

### Pattern: Blocked Work with Context

```
Feature X
[blocked] dependency Y
<- reason for dependency
-> what unblocks it
-> ETA if known

Meanwhile:
[decided] work on parallel task Z
```

---

### Pattern: Complex Reasoning Chain

```
{
  main thought
  <- where it comes from
  ->
  {
    sub-thought 1
    -> implication A
  }
  +
  {
    sub-thought 2  
    -> implication B
  }
  ->
  conclusion from A + B
}
```

---

### Pattern: Exploring Uncertainty

```
thought~: hypothesis worth investigating

Supporting evidence:
- observation 1
- observation 2

Conflicting evidence:  
- observation 3

[exploring] Need to test assumption X
-> if true: consequence A
-> if false: consequence B

action: design experiment to test X
```

---

### Pattern: Cascading Dependencies

```
Goal
-> requires Step 1
   -> requires Step 1a [decided]
   -> requires Step 1b [blocked]
-> requires Step 2 [parking]

Critical path:
1. Unblock Step 1b  
2. Complete Step 1
3. Unpark + execute Step 2
```

---

## Part 4: Anti-Patterns

### ❌ Anti-Pattern 1: Forcing FlowScript Where NL Works Better

**Don't do this:**
```
thought: I'm feeling tired today
-> low energy <- didn't sleep well
-> might need coffee -> caffeine helps
```

**Do this instead:**
```
Feeling tired today - didn't sleep well. Might grab coffee.
```

💡 **Why:** Simple statements don't need structure. Save FlowScript for actual complexity.

---

### ❌ Anti-Pattern 2: Over-Engineering Simple Decisions

**Don't do this:**
```
? Should I use tabs or spaces

{Tabs}
++ configurable width
-- inconsistent rendering

{Spaces}
++ consistent rendering  
-- fixed width

[decided] Spaces after analysis
```

**Do this instead:**
```
Using spaces (team standard). Done.
```

💡 **Why:** Not every decision needs analysis. Defer to convention and move on.

---

### ❌ Anti-Pattern 3: Encoding Without Relationships

**Don't do this:**
```
thought: performance matters
thought: users want speed
thought: caching helps
thought: Redis is fast
```

**Do this instead:**
```
users want speed -> performance matters
-> caching helps performance
-> Redis = good option for caching
```

💡 **Why:** FlowScript's value is showing HOW things relate, not just listing them.

---

### ❌ Anti-Pattern 4: Overusing Urgency Markers

**Don't do this:**
```
! Need to ship feature X
! Bug in production  
! Meeting in 10 minutes
! Client email unanswered
```

**Do this instead:**
```
!! Bug in production (service down)
! Client email unanswered (response promised today)

Need to ship feature X
Meeting in 10 minutes
```

💡 **Why:** If everything is urgent, nothing is. Use `!` sparingly for actual urgency.

---

### ❌ Anti-Pattern 5: Nested Thought Blocks Too Deep

**Don't do this:**
```
{
  outer thought
  -> {
    inner thought 1
    -> {
      deep thought A
      -> {
        deeper thought A1
        -> {
          deepest thought A1a
        }
      }
    }
  }
}
```

**Do this instead:**
```
Main idea:
{outer thought -> inner thought 1 -> deep thought A}

Details:
{deep thought A -> deeper thought A1 -> deepest thought A1a}
```

💡 **Why:** More than 2-3 levels of nesting becomes hard to parse. Break into multiple flat blocks.

---

## Part 5: Progressive Complexity

### Level 1: Just Relations

Start with the simplest markers showing how things connect:

```
API timeout -> user error -> retry -> more load -> worse timeout
```

**Add complexity:** Show the tension

```
fix timeout quickly >< maintain code quality
```

---

### Level 2: Add States

Track decisions and blockers:

```
[exploring] Redis vs Postgres for sessions

Redis:
++ fast
-- complex

[decided] Try Redis in staging first
[blocked] Need Docker setup on staging server
```

---

### Level 3: Add Thought Blocks

Group related reasoning:

```
{
  [exploring] Redis vs Postgres
  
  {Redis: ++ fast -- complex}
  ><  
  {Postgres: ++ simple ~~ speed}
  
  [decided] Start with Postgres (simpler)
  -> migrate to Redis if performance issues
}
```

---

### Level 4: Add Confidence and Context

Show certainty levels and scope:

```
@auth_service {
  thought*: Token expiry causing logout bug
  <- observed pattern in logs [decided]
  
  Fix:
  [exploring~] Extend expiry? Or refresh token?
  -> need to test both approaches
  
  [blocked] Staging environment down (ETA: 2hrs)
}
```

---

### Level 5: Full Structured Reasoning

Maximum information density for complex problems:

```
!! Production incident: Payment processing failing

{
  What we know*:
  - started 2:47 PM
  - 100% failure rate  
  - error: "gateway timeout"
  <- Stripe API responding slowly
}

{
  Immediate actions:
  [decided] Switch to backup payment provider
  -> already in progress (DevOps)
  -> ETA: 15min
  
  [blocked] Customer refunds
  <- need failed transaction list
  <- need approval from Finance
}

{
  Root cause investigation [parking]:
  ? Why is Stripe slow?
  -> their status page shows no issues
  -> [exploring~] possible: our request rate? their regional outage?
  
  action: Email Stripe support after immediate fire out
}

Next update: 3:15 PM or when backup provider live
```

---

## Part 6: When NOT to Use FlowScript

### Skip FlowScript for:

**1. Casual conversation**
```
Just chatting about the weather - no structure needed
```

**2. Emotional topics**
```
I'm frustrated with this project. Feeling burnt out and need a break.
```

**3. Simple statements**
```
The deploy finished successfully. Moving on to next task.
```

**4. Stories and narratives**
```
So this funny thing happened in the meeting today...
```

**5. When relationships are obvious**
```
I need coffee because I'm tired.
(Don't need: tired -> need coffee)
```

**6. Quick back-and-forth**
```
Ready?
Yep!
Let's go.
```

### Use FlowScript for:

**1. Complex dependencies**
**2. Architecture decisions**  
**3. Tradeoff analysis**
**4. Bug investigation**
**5. Planning and coordination**
**6. Technical reasoning**
**7. When relationships matter more than prose**

---

## The Bottom Line

**FlowScript makes relationships visible.**

Start with three markers: `->` `><` `{ }`

Add more as they become useful.

Mix naturally with prose - that's the sweet spot.

Skip it when natural language flows fine.

Use it when structure helps thinking, not as a requirement.

**Let the examples guide you. Try them in your own work. Discover your patterns.**

---

*FlowScript Examples v1.0*  
*Real patterns from real use*  
*October 2025*
