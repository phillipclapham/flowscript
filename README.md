<p align="center">
  <img src="docs/brand/logo-512.png" alt="FlowScript" width="120" />
</p>

<h1 align="center">FlowScript</h1>

<p align="center"><strong>Structured reasoning memory for AI agents. Five queries no vector store can answer: <code>why()</code>, <code>tensions()</code>, <code>blocked()</code>, <code>alternatives()</code>, <code>whatIf()</code>. Your agent builds the graph during normal work. You query it.</strong></p>

[![Tests](https://github.com/phillipclapham/flowscript/actions/workflows/test.yml/badge.svg)](https://github.com/phillipclapham/flowscript/actions/workflows/test.yml) [![npm](https://img.shields.io/npm/v/flowscript-core)](https://www.npmjs.com/package/flowscript-core) [![PyPI](https://img.shields.io/pypi/v/flowscript-agents)](https://pypi.org/project/flowscript-agents/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Website](https://img.shields.io/badge/demo-flowscript.org-purple)](https://flowscript.org)

---

```typescript
import { Memory } from 'flowscript-core';

const mem = Memory.loadOrCreate('./agent-memory.json');
const tools = mem.asTools(); // 15 tools, OpenAI function calling format
// → pass to OpenAI, Anthropic, or any function-calling LLM as tool definitions
// → your agent builds the reasoning graph during normal work

// Five typed queries over the reasoning your agent built:
mem.query.tensions();            // structured tradeoffs with named axes
mem.query.blocked();             // what's stuck + downstream impact
mem.query.why(nodeId);           // causal chain backward from any decision
mem.query.whatIf(nodeId);        // what breaks if this changes
mem.query.alternatives(nodeId);  // what was considered + what was decided

// Human-readable view of the entire graph:
console.log(mem.toFlowScript());

const wrap = mem.sessionWrap();  // prune dormant → audit trail, save
```

Sub-ms local traversal on project-scale graphs. No embeddings required, no LLM calls, no network. Hash-chained audit trail. And when memories contradict, we don't delete — we create a queryable *tension*.

<p align="center">
  <img src="https://raw.githubusercontent.com/phillipclapham/flowscript/main/docs/flowscript-demo.png" alt="FlowScript — web editor with .fs syntax, D3 reasoning graph, and live query panel" width="800">
</p>

---

## Why FlowScript

Agent memory stores what happened. FlowScript stores why.

Most agent infrastructure is converging on authorization — identity, access control, audit trails for *who did what*. That's necessary. But it leaves a gap: your agent can prove it was *allowed* to make a decision, but not *why* it made it. Researchers call this "[strategic blindness](https://arxiv.org/abs/2603.18718)" — memory that tracks content without tracking reasoning.

FlowScript sits above your memory store, not instead of it. Google Memory Bank, LangGraph checkpointers, Mem0 — they remember what your agent stored. FlowScript remembers why it decided, what it traded off, and what breaks if you change your mind.

---

## Get Started

### MCP Server (Claude Code / Cursor)

```bash
npm install -g flowscript-core
```

```json
{
  "mcpServers": {
    "flowscript": {
      "command": "flowscript-mcp",
      "args": ["./project-memory.json"]
    }
  }
}
```

Restart your editor. 15 reasoning tools, local file persistence, zero cloud dependency. Add `--demo` before the file path to seed a sample project for exploration.

Copy [this CLAUDE.md snippet](examples/CLAUDE.md.snippet) into your project to tell the agent when to record decisions, tensions, and blockers automatically.

> **Already using CLAUDE.md?** Keep using it. CLAUDE.md tells your agent what to do. FlowScript tells it how to reason about what it's doing — they're complementary. CLAUDE.md is the cheat sheet, FlowScript is the working memory.

> **Want auto-extraction from plain text?** The [Python MCP server](https://github.com/phillipclapham/flowscript-agents) auto-detects your API key and configures vector search, typed extraction, and contradiction handling — same reasoning queries, automatic graph construction.

### TypeScript SDK

```bash
npm install flowscript-core
```

```typescript
import { Memory } from 'flowscript-core';

// Load or create (zero-friction first run)
const mem = Memory.loadOrCreate('./agent-memory.json');

// 15 agent tools in OpenAI function calling format
const tools = mem.asTools();

// Or build directly — typed nodes with explicit relationships
const q = mem.question("Which database for agent memory?");
mem.alternative(q, "Redis").decide({ rationale: "speed critical" });
mem.alternative(q, "SQLite").block({ reason: "no concurrent writes" });
mem.tension(mem.thought("sub-ms reads"), mem.thought("$200/mo cluster"), "performance vs cost");

// Extract from existing conversations
const extracted = await Memory.fromTranscript(conversationLog, {
  extract: async (prompt) => await yourLLM(prompt)
});
```

### Vercel AI SDK

```typescript
import { Memory } from 'flowscript-core';
import { toVercelTools, getFlowScriptContext } from 'flowscript-core/vercel';
import { tool, jsonSchema, generateText, stepCountIs } from 'ai';

const mem = Memory.loadOrCreate('./agent-memory.json');
const fsTools = toVercelTools(mem); // 5 tools: store, recall, tensions, blocked, context

// Wrap with Vercel's tool() + jsonSchema() helpers
const tools = Object.fromEntries(
  Object.entries(fsTools).map(([name, def]) => [
    name,
    tool({
      description: def.description,
      inputSchema: jsonSchema(def.parameters), // AI SDK v6: inputSchema, not parameters
      execute: def.execute,
    }),
  ])
);

// AI SDK v6: use stopWhen, not maxSteps
const result = await generateText({
  model: yourModel,
  tools,
  stopWhen: stepCountIs(10),
  prompt: "Analyze the database options we discussed",
});

// Or inject memory as system context (middleware pattern)
const context = getFlowScriptContext(mem, { maxTokens: 4000 });
const result2 = await generateText({
  model: yourModel,
  system: `You are an assistant.\n\n${context}`,
  prompt: "What tradeoffs are we facing?",
});
```

Does NOT require `ai` as a dependency — you bring your own Vercel AI SDK. FlowScript provides tool definitions that wrap with `tool()` + `jsonSchema()`.

### Agent Frameworks (Python)

Drop-in adapters for LangGraph, CrewAI, Google ADK, OpenAI Agents, Pydantic AI, smolagents, LlamaIndex, Haystack, and CAMEL-AI:

```bash
pip install flowscript-agents[langgraph]   # or crewai, google-adk, openai-agents, all
```

[See flowscript-agents →](https://github.com/phillipclapham/flowscript-agents)

---

## What the Queries Return

Queries return structured objects. `toFlowScript()` renders the full graph in human-readable `.fs` notation. Here's a project memory and what each query extracts from it:

```
? Which database for user sessions and agent state?
  [decided(rationale: "Best balance of cost, reliability, and query power", on: "2026-03-22")] || PostgreSQL
    -> thought: Session storage needs replacement
    -> thought: Server-side auth decision invalidated
    -> thought: ULID migration becomes irrelevant
  || Redis — sub-ms reads, great for session cache
  [blocked(reason: "Cannot handle concurrent writes", since: "2026-03-22")] || SQLite

thought: Redis gives sub-ms reads but cluster costs $200/mo
  ><[performance vs cost] thought: PostgreSQL on shared hosting is $15/mo

thought: Started with microservices but the overhead is killing velocity
  -> thought: Collapsed back to a modular monolith — same code boundaries, one deploy
    -> thought: Premature distribution is worse than premature optimization
```

**`tensions()`** finds the `><` relationships — tradeoffs with named axes. Returns `{ tensions_by_axis: { "performance vs cost": [{ source, target }] } }`.

**`blocked()`** finds `[blocked]` states — what's stuck and why. Returns `{ blockers: [{ node, blocked_state: { reason } }] }`.

**`why(nodeId)`** traces `->` chains backward — the full causal ancestry of any node. Returns `{ causal_chain, root_cause }`.

**`alternatives(questionId)`** collects `||` alternatives under a `?` question — with decided/blocked states. Returns `{ alternatives: [{ content, chosen, rationale }] }`.

**`whatIf(nodeId)`** traces `->` chains forward — everything downstream. Returns `{ impact_tree: { direct_consequences, indirect_consequences } }`.

All five queries touch returned nodes, driving graduation through temporal tiers. Knowledge that keeps getting queried earns permanence. One-off observations fade.

---

## When Memories Contradict

FlowScript doesn't delete contradictions. Both sides are preserved as a queryable tension with a named axis:

```typescript
const a = mem.thought("Redis gives sub-ms reads — critical for UX");
const b = mem.thought("Redis cluster costs $200/mo for 3 nodes");
mem.tension(a, b, "performance vs cost");

mem.query.tensions();
// → ><[performance vs cost]
//     "sub-ms reads critical for UX" vs "$200/mo for 3 nodes"
```

The disagreement itself is knowledge. The [Python SDK](https://github.com/phillipclapham/flowscript-agents) automates this — its consolidation engine detects contradictions and creates tensions instead of deletions. You can't audit a deletion. You can query a tension.

---

## Memory That Evolves

Nodes graduate through four temporal tiers based on actual use:

| Tier | Meaning | Behavior |
|:-----|:--------|:---------|
| `current` | Recent observations | May be pruned if not reinforced |
| `developing` | Emerging patterns (2+ touches) | Building confidence |
| `proven` | Validated through use (3+ touches) | Protected from pruning |
| `foundation` | Core truths | Always preserved |

Dormant nodes are pruned to the audit trail — archived with full provenance, never destroyed. After 20 sessions, your memory is a curated knowledge base, not a pile of notes.

```typescript
// Start: orient with token-budgeted summary
const orientation = mem.sessionStart({ maxTokens: 4000 });
// → summary, blockers, tensions, garden stats, tier distribution

// End: prune dormant, save, get before/after stats
const wrap = mem.sessionWrap();
// → { nodesBefore, pruned, nodesAfter, tiersAfter, saved }
```

Four budget strategies: `tier-priority` (foundation first), `recency`, `frequency`, `relevance` (topic match). ~3:1 compression ratio vs prose.

---

## Audit Trail

Every mutation is SHA-256 hash-chained, append-only, crash-safe:

```typescript
const mem = Memory.loadOrCreate('./agent.json', {
  audit: { retentionMonths: 84 }
});

// ... agent builds reasoning ...

// Verify chain integrity
const result = Memory.verifyAudit('./agent.json');
// → { valid: true, totalEntries: 42, filesVerified: 1 }

// Query reasoning provenance
const history = Memory.queryAudit('./agent.json', {
  events: ['node_create', 'state_change', 'graduation'],
  sessionId: 'session-abc'
});
```

Framework attribution on every entry — `setAdapterContext('langgraph', 'FlowScriptStore', 'put')` tags all subsequent events. Monthly rotation with gzip compression. `onEvent` callback for SIEM integration. Configurable retention periods (default 7 years).

Same audit format across both SDKs — canonical JSON serialization, cross-language chain verification.

---

## Description Integrity — SRI for LLM Tool Descriptions

MCP tool descriptions are the prompts your LLM actually reads. If a malicious dependency, middleware, or monkey-patch mutates them in-process, the LLM silently follows poisoned instructions. FlowScript's MCP servers include a three-layer integrity verification system — a reference implementation of [deterministic description integrity for MCP](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/2402):

**Layer 1 — In-process verification** (`verify_integrity` tool): SHA-256 hashes of all tool definitions computed at startup, deep-frozen in memory. The LLM can call `verify_integrity` to confirm no in-process mutation has occurred. Detects: malicious npm/pip dependencies, monkey-patching, middleware that modifies tool objects.

**Layer 2 — Host-verifiable manifest** (`flowscript://integrity/manifest` resource): Exposes the integrity manifest as an MCP Resource so the *host application* (Claude Code, Cursor) can verify descriptions without LLM involvement — moving the security boundary to the correct architectural layer.

**Layer 3 — Build-time root of trust** (`tool-integrity.json`): Generated at build time (`--generate-manifest`), ships in the package. Provides a hash baseline independent of the running process. Startup verification compares against both runtime and build-time manifests.

```bash
# Generate build-time manifest
flowscript-mcp --generate-manifest

# LLM calls verify_integrity → PASS/FAIL verdict with per-tool hashes
# Host reads flowscript://integrity/manifest → client-side verification
```

**Honest threat model:** This detects in-process mutation. It does not detect supply chain attacks (poisoned before startup), transport-layer MITM (hashes don't leave the process), or client-side injection. Full ecosystem integrity requires client-side verification against out-of-band manifests. Both the [TypeScript](https://www.npmjs.com/package/flowscript-core) and [Python](https://pypi.org/project/flowscript-agents/) MCP servers implement this architecture.

---

## Comparison

| | FlowScript | Mem0 | Vector stores |
|:---|:---|:---|:---|
| Find similar content | Vector search (Python SDK) | Vector search | Vector search |
| "Why did we decide X?" | `why()` — typed causal chain | — | — |
| "What's blocking?" | `blocked()` — downstream impact | — | — |
| "What tradeoffs?" | `tensions()` — named axes | — | — |
| "What if we change this?" | `whatIf()` — impact analysis | — | — |
| Contradictions | Preserved as tensions | Deleted | N/A |
| Audit trail | SHA-256 hash chain | — | — |
| Temporal graduation | Automatic 4-tier | — | — |
| Token budgeting | 4 strategies | — | — |

Under the hood: a local symbolic graph with typed nodes, typed relationships, and typed states. Queries traverse structure — no embeddings required, no LLM calls, no network. Sub-ms on project-scale graphs. Vector search and reasoning queries are orthogonal — use both.

---

## Ecosystem

| Package | What | Install |
|:--------|:-----|:--------|
| [flowscript-core](https://www.npmjs.com/package/flowscript-core) | TypeScript SDK — Memory class, 15 agent tools, Vercel AI SDK adapter, audit trail, token budgeting | `npm install flowscript-core` |
| [flowscript-agents](https://pypi.org/project/flowscript-agents/) | Python SDK — 9 framework adapters, auto-extraction, consolidation, audit trail | `pip install flowscript-agents openai` |
| [flowscript.org](https://flowscript.org) | Web editor, D3 visualization, live query panel | Browser |

**731 TypeScript tests** across 15 suites. **1,312 total** across both SDKs. Same audit trail format and canonical JSON serialization across both languages.

### Docs

[FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) — 21-marker spec | [QUERY_ENGINE.md](QUERY_ENGINE.md) — queries + TypeScript API | [FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md) — beginner guide | [examples/](examples/) — demo memory, CLAUDE.md snippet, golden files

---

## Known Limitations

- **Single-file access**: `save()` uses `writeFileSync`. Two agents writing the same file will clobber. Use separate memory files per agent.
- **Single-writer audit**: Two processes writing the same audit file will corrupt the hash chain. One writer per memory file.
- **NodeRef persistence boundary**: After `Memory.loadOrCreate()`, old NodeRef objects point to the previous Memory instance. Using stale refs corrupts the audit chain. Always get fresh handles from the reloaded memory.
- **CJS package**: Exports CommonJS. Works in ESM via Node.js interop (`import { Memory } from 'flowscript-core'` works in Node 18+).

---

## Contributing

Issues with evidence from real use. Framework integration PRs welcome.

[Issues](https://github.com/phillipclapham/flowscript/issues) | [Discussions](https://github.com/phillipclapham/flowscript/discussions)

---

MIT. Built by [Phillip Clapham](https://phillipclapham.com).
