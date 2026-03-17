# FlowScript

**Your AI has notes. FlowScript gives it a working memory.**

[![Tests](https://img.shields.io/badge/tests-628%20passing-brightgreen)](https://github.com/phillipclapham/flowscript) [![npm](https://img.shields.io/npm/v/flowscript-core)](https://www.npmjs.com/package/flowscript-core) [![PyPI](https://img.shields.io/pypi/v/flowscript-agents)](https://pypi.org/project/flowscript-agents/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Website](https://img.shields.io/badge/demo-flowscript.org-purple)](https://flowscript.org)

---

CLAUDE.md remembers facts. FlowScript remembers *why you rejected microservices three weeks ago, what tensions exist in your architecture, and which decisions are blocking progress.*

Five typed queries no other memory system has: `why()`, `tensions()`, `blocked()`, `alternatives()`, `whatIf()`. All execute in <1ms. All on structured reasoning, not text search.

RAG finds relevant documents. FlowScript remembers why you decided against the alternatives. They're not competing — use both.

---

## Try It (60 seconds)

```bash
npm install -g flowscript-core
```

Add to your Claude Code config (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "flowscript": {
      "command": "flowscript-mcp",
      "args": ["--demo", "./project-memory.json"]
    }
  }
}
```

Restart Claude Code. You now have 12 reasoning tools. The `--demo` flag seeds a sample project so you can explore immediately:

> "What tensions exist in this project?"
> "What's blocking progress?"
> "Why did we choose PostgreSQL?"
> "What alternatives did we consider for auth?"

Remove `--demo` when you're ready to start fresh with your own project.

### Make It Stick

Copy [this snippet](examples/CLAUDE.md.snippet) into your project's `CLAUDE.md`. It tells Claude Code when and how to use the FlowScript tools naturally — recording decisions, tensions, and blockers as it encounters them during normal coding work. After a few sessions, your agent has a queryable understanding of your project's reasoning history.

---

## What the Queries Return

These aren't string searches. They traverse a typed reasoning graph.

**`tensions()`** — every tradeoff in your project, with named axes:

```
><[performance vs cost]
  "Redis gives sub-ms reads but cluster costs $200/mo"
  vs "PostgreSQL on shared hosting is $15/mo and handles our scale"

><[statelessness vs revocability]
  "JWT with refresh tokens — stateless, scalable"
  vs "JWT revocation is a pain — need a blocklist, which means server-side state anyway"
```

**`blocked()`** — what's stuck and why:

```
[blocked] SQLite — zero ops, embedded, good enough for MVP
  reason: "Cannot handle concurrent writes from multiple API workers"
```

**`why("modular-monolith")`** — trace the causal chain backward:

```
Collapsed back to a modular monolith — same code boundaries, one deploy
  ← Started with microservices but the overhead is killing velocity
    → Premature distribution is worse than premature optimization
```

**`alternatives("database-question")`** — what was considered and what was decided:

```
? Which database for user sessions and agent state?
  [decided] PostgreSQL — "Best balance of cost, reliability, and query power"
  [open]    Redis — sub-ms reads, great for session cache
  [blocked] SQLite — cannot handle concurrent writes
```

**`whatIf("postgresql")`** — what breaks if this decision changes:

```
If PostgreSQL is removed:
  → Session storage approach needs replacement
  → Server-side auth decision (depends on Postgres) is invalidated
  → ULID migration (in progress) becomes irrelevant
```

---

## Hello World (TypeScript)

```typescript
import { Memory } from 'flowscript-core';

const mem = new Memory();

const q = mem.question("Which database for agent memory?");
mem.alternative(q, "Redis").decide({ rationale: "speed critical for real-time agents" });
mem.alternative(q, "SQLite").block({ reason: "no concurrent write support" });
mem.tension(
  mem.thought("Redis gives sub-ms reads"),
  mem.thought("cluster costs $200/mo"),
  "performance vs cost"
);

console.log(mem.query.tensions());  // structured tradeoffs with named axes
console.log(mem.query.blocked());   // blockers + downstream impact
mem.save("./memory.json");          // persists across sessions
```

---

## Works With Your Stack

### MCP (Claude Code, Cursor)

Already shown above. 12 tools, local file persistence, zero cloud dependency. Your reasoning stays on your machine.

### LangGraph

```python
from flowscript_agents.langgraph import FlowScriptStore

store = FlowScriptStore("./agent-memory.json")
store.put(("agents", "planner"), "db_decision", {"value": "chose Redis"})
store.memory.query.tensions()  # FlowScript queries on LangGraph data
```

### CrewAI

```python
from flowscript_agents.crewai import FlowScriptStorage

storage = FlowScriptStorage("./crew-memory.json")
storage.save({"content": "User prefers concise answers", "score": 0.9})
storage.memory.query.blocked()  # semantic queries on CrewAI memory
```

### Google ADK

```python
from flowscript_agents.google_adk import FlowScriptMemoryService

service = FlowScriptMemoryService("./adk-memory.json")
# Wire to Runner: Runner(agent=agent, memory_service=service)
service.memory.query.why(node_id)
```

### OpenAI Agents SDK

```python
from flowscript_agents.openai_agents import FlowScriptSession

session = FlowScriptSession("conv_123", "./openai-memory.json")
# Wire to Runner: Runner.run(agent, "Hello", session=session)
session.memory.query.alternatives(question_id)
```

**Install:** `pip install flowscript-agents[langgraph]` (or `crewai`, `google-adk`, `openai-agents`, `all`)

All four are drop-in replacements for each framework's native memory interface. Same API your framework expects, but now `query.tensions()` works.

---

## The Complete Developer Loop

What v1.0 delivers end to end:

```typescript
import { Memory } from 'flowscript-core';

// 1. Load or create (zero-friction first run)
const mem = Memory.loadOrCreate('./agent-memory.json');

// 2. Wire to your agent (12 tools, OpenAI function calling format)
const tools = mem.asTools();

// 3. Agent builds reasoning via tool calls during work
//    (no FlowScript syntax knowledge needed)

// 4. Inject memory into prompts (respects token budget)
const context = mem.toFlowScript({
  maxTokens: 4000,
  strategy: 'tier-priority'  // proven knowledge always included
});

// 5. Or extract reasoning from existing conversations
const mem2 = await Memory.fromTranscript(agentLog, {
  extract: async (prompt) => await yourLLM(prompt)
});

// 6. Housekeep + save
mem.prune();   // dormant nodes → .audit.jsonl (append-only)
mem.save();    // no-arg save to stored path
```

---

## Temporal Intelligence

Memory that gets smarter over time, not just bigger.

| Tier | Meaning | Behavior |
|------|---------|----------|
| `current` | Recent observations | May be pruned if not reinforced |
| `developing` | Patterns emerging (2+ touches) | Building confidence |
| `proven` | Validated through use (3+ touches) | Protected from pruning |
| `foundation` | Core truths | Always preserved, even under budget pressure |

Nodes graduate automatically based on frequency. `prune()` moves dormant nodes to an append-only audit trail (`.audit.jsonl`). Proven and foundation tiers survive budget constraints — your agent never loses hard-won knowledge.

This is the part that makes FlowScript fundamentally different from a key-value store. A decision that keeps coming back up earns its place. One-off observations fade. The memory *compresses itself*, and the compression reveals structure that verbosity obscures.

---

## Token-Budgeted Serialization

Inject memory into agent prompts without blowing your context window.

```typescript
mem.toFlowScript({ maxTokens: 4000, strategy: 'tier-priority' });  // foundation first
mem.toFlowScript({ maxTokens: 4000, strategy: 'recency' });        // newest first
mem.toFlowScript({ maxTokens: 4000, strategy: 'frequency' });      // most-referenced first
mem.toFlowScript({ maxTokens: 4000, strategy: 'relevance', relevanceQuery: 'auth' });
```

~3:1 compression ratio vs prose. Same reasoning, fewer tokens. At scale that's real money.

---

## Audit Trail

`prune()` doesn't delete — it archives. Every pruned node is appended to `.audit.jsonl` with full provenance. Write-before-remove ordering for crash safety.

```typescript
mem.prune();  // dormant → agent-memory.audit.jsonl
const history = Memory.readAuditLog('./agent-memory.audit.jsonl');
```

Your agent's decision history is always recoverable.

---

## Human-Readable Persistence

Memory saves as `.json` (lossless, machine-first) or `.fs` (human-readable FlowScript notation). The `.fs` format is what makes this reviewable by humans:

```
? Which database for user sessions and agent state?
  [decided] || PostgreSQL — battle-tested, ACID, rich querying
  || Redis — sub-ms reads, great for session cache
  [blocked] || SQLite — zero ops, embedded, good enough for MVP

thought: Redis gives sub-ms reads but cluster costs $200/mo minimum
  ><[performance vs cost] thought: PostgreSQL on shared hosting is $15/mo

thought: Started with microservices but overhead is killing velocity
  -> thought: Collapsed back to modular monolith — same boundaries, one deploy
    <- Premature distribution is worse than premature optimization
```

Show that to your PM. They can read it.

---

## Why Not Just Use CLAUDE.md / .cursorrules?

CLAUDE.md is great for facts: "we use Postgres," "prefer functional style," "run tests before committing."

FlowScript is for reasoning: *why* you chose Postgres, *what tensions* that creates with your caching strategy, *what's blocked* by the auth decision, and *what breaks* if you change your mind.

Facts tell your agent what to do. Reasoning tells it how to think about what it's doing.

Both matter. They're complementary.

---

## Comparison

| | FlowScript | Embedding stores | CLAUDE.md / state dicts |
|---|---|---|---|
| "Why did we decide X?" | `query.why(id)` — typed causal chain | No | No |
| "What's blocking progress?" | `query.blocked()` — with impact scoring | No | Manual grep |
| "What tradeoffs exist?" | `query.tensions()` — named axes | No | No |
| "What alternatives were considered?" | `query.alternatives(id)` | No | If you wrote them down |
| "What if we change this?" | `query.whatIf(id)` — downstream impact | No | No |
| Human-readable export | `.fs` files | No | Yes (but flat) |
| Token-budgeted injection | 4 strategies | No | Manual truncation |
| Temporal tiers + graduation | Automatic | No | No |
| Append-only audit trail | `.audit.jsonl` | No | Git history |

---

## EU AI Act Alignment

FlowScript's `why()` produces the typed explanatory chains that Articles 12, 13(3)(b)(iv), and 86 require for high-risk AI systems. The append-only audit trail provides the decision provenance these regulations mandate. Built for reasoning — compliance comes free.

*Applies to high-risk AI systems under Annex III. Not a universal compliance claim.*

---

## Ecosystem

| Package | What | Install |
|---------|------|---------|
| [flowscript-core](https://www.npmjs.com/package/flowscript-core) | TypeScript SDK — Memory, asTools, queries, MCP server | `npm install flowscript-core` |
| [flowscript-agents](https://pypi.org/project/flowscript-agents/) | Python — LangGraph, CrewAI, Google ADK, OpenAI Agents | `pip install flowscript-agents` |
| [flowscript-ldp](https://pypi.org/project/flowscript-ldp/) | Python IR + query engine (foundation layer) | `pip install flowscript-ldp` |
| [flowscript.org](https://flowscript.org) | Web editor, D3 visualization, live queries | Browser |

---

## Documentation

[FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) — 21-marker notation spec
[QUERY_ENGINE.md](QUERY_ENGINE.md) — 5 queries, TypeScript API
[FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md) — beginner guide
[FLOWSCRIPT_EXAMPLES.md](FLOWSCRIPT_EXAMPLES.md) — real-world patterns
[examples/](examples/) — demo memory, activation snippet, golden files

---

## Protocol Alignment

Three independent systems arrived at symbolic notation for AI communication without cross-pollination: [SynthLang](https://github.com/ruvnet/SynthLang) (Jan 2025), **FlowScript** (Oct 2025), [MetaGlyph](https://arxiv.org/abs/2601.07354) (Jan 2026). When independent builders converge, the insight is structural.

FlowScript's IR is the first implementation of [LDP Mode 3](https://arxiv.org/abs/2603.08852) (Semantic Graphs). Active collaboration with the LDP paper author. Also aligned with [G2CP](https://github.com/karim0bkh/G2CP_AAMAS), [JamJet](https://jamjet.dev), and [NFD](https://arxiv.org/abs/2603.10808).

---

## Contributing

Use FlowScript. Report what's friction. Open issues with evidence from real use, not theoretical proposals. Framework integration PRs welcome.

- [GitHub Issues](https://github.com/phillipclapham/flowscript/issues)
- [GitHub Discussions](https://github.com/phillipclapham/flowscript/discussions)

---

MIT. 628 tests across TypeScript + Python. Built by [Phillip Clapham](https://phillipclapham.com).
