# FlowScript

**Your AI rewrites your auth system in 20 minutes flat. Two days later your senior engineer is still explaining what it broke — because it didn't know you rejected JWT three weeks ago, or why, or what that decision blocks.**

[![Tests](https://img.shields.io/badge/tests-628%20passing-brightgreen)](https://github.com/phillipclapham/flowscript) [![npm](https://img.shields.io/npm/v/flowscript-core)](https://www.npmjs.com/package/flowscript-core) [![PyPI](https://img.shields.io/pypi/v/flowscript-agents)](https://pypi.org/project/flowscript-agents/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Website](https://img.shields.io/badge/demo-flowscript.org-purple)](https://flowscript.org)

---

FlowScript gives AI tools a structured reasoning graph — not text search over notes, but typed queries over actual decision logic: `why()`, `tensions()`, `blocked()`, `alternatives()`, `whatIf()`. Sub-ms local traversal on project-scale graphs.

CLAUDE.md stores facts. FlowScript stores *reasoning* — why you chose Postgres, what tensions that creates, what's blocked, what breaks if you change your mind. They're complementary. Use both.

This isn't competing with RAG either. RAG finds relevant documents. FlowScript answers "why did we decide against the alternatives?" Different operation entirely.

---

## Try It

**Use Claude Code or Cursor?** Install and add to MCP config:

```bash
npm install -g flowscript-core
```

In `~/.claude/settings.json` (Claude Code) or your Cursor MCP config:

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

Restart your editor. You now have 12 reasoning tools. `--demo` seeds a sample project so you can explore immediately — ask about tensions, blockers, or why a decision was made. Remove `--demo` when you're ready for your own project.

Copy [this CLAUDE.md snippet](examples/CLAUDE.md.snippet) into your project to tell the agent when to record decisions, tensions, and blockers during normal coding.

**Use something else?** FlowScript is just an npm package:

```typescript
import { Memory } from 'flowscript-core';

const mem = new Memory();
const q = mem.question("Which database for agent memory?");
mem.alternative(q, "Redis").decide({ rationale: "speed critical" });
mem.alternative(q, "SQLite").block({ reason: "no concurrent writes" });
mem.tension(mem.thought("sub-ms reads"), mem.thought("$200/mo cluster"), "performance vs cost");

mem.query.tensions();   // structured tradeoffs with named axes
mem.query.blocked();    // what's stuck + downstream impact
mem.save("./memory.json");
```

**Building with agent frameworks?** Drop-in adapters for LangGraph, CrewAI, Google ADK, and OpenAI Agents SDK: `pip install flowscript-agents[langgraph]` — [details below](#works-with-your-stack).

---

## What the Queries Actually Return

These traverse a typed reasoning graph, not strings. Here's real output from the demo project:

**`tensions()`** — every tradeoff, with named axes:

```
><[performance vs cost]
  "Redis gives sub-ms reads but cluster costs $200/mo"
  vs "PostgreSQL on shared hosting is $15/mo and handles our scale"

><[statelessness vs revocability]
  "JWT with refresh tokens — stateless, scalable"
  vs "JWT revocation needs a blocklist — server-side state anyway"
```

**`blocked()`** — what's stuck and why:

```
[blocked] SQLite — zero ops, embedded, good enough for MVP
  reason: "Cannot handle concurrent writes from multiple API workers"
```

**`why("modular-monolith")`** — causal chain backward:

```
Collapsed back to a modular monolith — same code boundaries, one deploy
  ← Started with microservices but the overhead is killing velocity
    → Premature distribution is worse than premature optimization
```

**`alternatives("database-question")`** — what was considered, what was decided:

```
? Which database for user sessions and agent state?
  [decided] PostgreSQL — "Best balance of cost, reliability, and query power"
  [open]    Redis — sub-ms reads, great for session cache
  [blocked] SQLite — cannot handle concurrent writes
```

**`whatIf("postgresql")`** — downstream impact if this changes:

```
If PostgreSQL is removed:
  → Session storage needs replacement
  → Server-side auth decision invalidated
  → ULID migration becomes irrelevant
```

That last one is a `.fs` file — the human-readable format your PM can review without knowing code:

```
? Which database for user sessions and agent state?
  [decided] || PostgreSQL — battle-tested, ACID, rich querying
  || Redis — sub-ms reads, great for session cache
  [blocked] || SQLite — zero ops, embedded, good enough for MVP

thought: Started with microservices but overhead is killing velocity
  -> thought: Collapsed back to modular monolith — same boundaries, one deploy
    <- Premature distribution is worse than premature optimization
```

---

## But I Already Use CLAUDE.md

Good. Keep using it. CLAUDE.md tells your agent what to do. FlowScript tells it how to reason about what it's doing.

Facts: "we use Postgres, prefer functional style, run tests first."
Reasoning: *why* Postgres, *what tensions* that creates, *what's blocked*, *what breaks* if you change your mind.

They're complementary. CLAUDE.md is your agent's cheat sheet. FlowScript is its working memory.

The difference matters when your agent hits a decision point. With just CLAUDE.md, it re-derives every tradeoff from scratch. With FlowScript, it queries `tensions()` and already knows the performance-vs-cost axis from three weeks ago. It queries `blocked()` and knows SQLite is off the table and why. It queries `why("postgres")` and gets the full causal chain without re-reading the codebase.

---

## Works With Your Stack

### MCP (Claude Code, Cursor)

12 tools, local file persistence, zero cloud dependency. [Setup above](#try-it). Your reasoning stays on your machine — no cloud, no telemetry.

### Agent Frameworks (Python)

```bash
pip install flowscript-agents[langgraph]   # or crewai, google-adk, openai-agents, all
```

Drop-in replacements for each framework's native memory interface. Same API your framework expects, but now `query.tensions()` works:

```python
from flowscript_agents.langgraph import FlowScriptStore

store = FlowScriptStore("./agent-memory.json")

# Standard LangGraph operations
store.put(("agents", "planner"), "db_decision", {"value": "chose Redis for speed"})
items = store.search(("agents", "planner"), query="Redis")

# The part that's new — semantic queries on the same data
blockers = store.memory.query.blocked()
tensions = store.memory.query.tensions()
why_chain = store.memory.query.why(node_id)
```

Also available: [CrewAI](https://pypi.org/project/flowscript-agents/) (`FlowScriptStorage`), [Google ADK](https://pypi.org/project/flowscript-agents/) (`FlowScriptMemoryService`), [OpenAI Agents SDK](https://pypi.org/project/flowscript-agents/) (`FlowScriptSession`). All expose `.memory.query` for FlowScript queries.

---

## Temporal Intelligence

Memory that gets smarter over time, not just bigger.

| Tier | Meaning | Behavior |
|------|---------|----------|
| `current` | Recent observations | May be pruned if not reinforced |
| `developing` | Emerging patterns (2+ touches) | Building confidence |
| `proven` | Validated through use (3+ touches) | Protected from pruning |
| `foundation` | Core truths | Always preserved, even under budget pressure |

Nodes graduate automatically. `prune()` moves dormant nodes to an append-only audit trail (`.audit.jsonl`) — crash-safe, always recoverable. Proven and foundation tiers survive budget constraints. Your agent never loses hard-won knowledge.

The memory *compresses itself*, and the compression reveals structure that verbosity obscures. A decision that keeps coming back up earns its place. One-off observations fade.

---

## The Complete Developer Loop

```typescript
import { Memory } from 'flowscript-core';

// 1. Load or create (zero-friction first run)
const mem = Memory.loadOrCreate('./agent-memory.json');

// 2. Wire to your agent (12 tools, OpenAI function calling format)
const tools = mem.asTools();

// 3. Agent builds reasoning via tool calls during work
//    (no FlowScript syntax needed — the agent handles it)

// 4. Inject memory into prompts (respects token budget)
const context = mem.toFlowScript({
  maxTokens: 4000,
  strategy: 'tier-priority'  // proven knowledge always included
});

// 5. Or extract from existing conversations
const mem2 = await Memory.fromTranscript(agentLog, {
  extract: async (prompt) => await yourLLM(prompt)
});

// 6. Housekeep + save
mem.prune();   // dormant → .audit.jsonl (append-only)
mem.save();    // no-arg save to stored path
```

Four budget strategies: `tier-priority` (foundation first), `recency`, `frequency`, `relevance` (topic match). ~3:1 compression ratio vs prose.

---

## Comparison

| | FlowScript | Embedding stores | CLAUDE.md / state dicts |
|---|---|---|---|
| "Why did we decide X?" | `why(id)` — typed causal chain | No | No |
| "What's blocking progress?" | `blocked()` — with impact scoring | No | Manual grep |
| "What tradeoffs exist?" | `tensions()` — named axes | No | No |
| "What alternatives were considered?" | `alternatives(id)` | No | If you wrote them down |
| "What if we change this?" | `whatIf(id)` — downstream impact | No | No |
| Human-readable export | `.fs` files | No | Yes (but flat) |
| Token-budgeted injection | 4 strategies | No | Manual truncation |
| Temporal tiers + graduation | Automatic | No | No |
| Audit trail | `.audit.jsonl` (append-only) | No | Git history |

Under the hood: a local symbolic graph, not a vector database. Nodes are typed (thought, question, decision, insight, action, completion). Relationships are typed (causes, tension, derives_from, temporal, alternative). States are typed (decided, blocked, exploring, parked). Queries traverse this structure. No embeddings, no LLM calls, no network.

---

## Ecosystem

| Package | What | Install |
|---------|------|---------|
| [flowscript-core](https://www.npmjs.com/package/flowscript-core) | TypeScript SDK + MCP server + CLI | `npm install flowscript-core` |
| [flowscript-agents](https://pypi.org/project/flowscript-agents/) | Python — LangGraph, CrewAI, Google ADK, OpenAI Agents | `pip install flowscript-agents` |
| [flowscript-ldp](https://pypi.org/project/flowscript-ldp/) | Python IR + query engine (foundation layer) | `pip install flowscript-ldp` |
| [flowscript.org](https://flowscript.org) | Web editor + D3 visualization + live queries | Browser |

FlowScript is the first implementation of [LDP Mode 3](https://arxiv.org/abs/2603.08852) (Semantic Graphs). Three independent systems converged on symbolic notation for AI reasoning without cross-pollination — [SynthLang](https://github.com/ruvnet/SynthLang), FlowScript, [MetaGlyph](https://arxiv.org/abs/2601.07354). When independent builders converge, the insight is structural.

---

## Documentation

[FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) — 21-marker spec | [QUERY_ENGINE.md](QUERY_ENGINE.md) — 5 queries, TypeScript API | [FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md) — beginner guide | [examples/](examples/) — demo memory, CLAUDE.md snippet, golden files

---

## Governance

FlowScript's `why()` produces typed explanatory chains and the append-only audit trail provides decision provenance — the kind of structured explainability that regulations like the EU AI Act (Articles 12, 13, 86) are starting to require for high-risk AI systems.

---

## Contributing

Use FlowScript. Report what's friction. Open issues with evidence from real use. Framework integration PRs welcome.

[Issues](https://github.com/phillipclapham/flowscript/issues) | [Discussions](https://github.com/phillipclapham/flowscript/discussions)

---

MIT. 628 tests across TypeScript + Python. Built by [Phillip Clapham](https://phillipclapham.com).
