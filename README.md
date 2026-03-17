# FlowScript

**Decision intelligence for AI agents.**

[![Tests](https://img.shields.io/badge/tests-532%20passing-brightgreen)](https://github.com/phillipclapham/flowscript) [![npm](https://img.shields.io/npm/v/flowscript-core)](https://www.npmjs.com/package/flowscript-core) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Website](https://img.shields.io/badge/demo-flowscript.org-purple)](https://flowscript.org)

---

## The Problem

Your agent made a decision. Your PM asks "why?" You dig through chat logs and JSON blobs. Good luck.

Agent memory today is either opaque embeddings you can't inspect, expensive LLM self-editing you can't audit, or untyped state dicts with no structure. They store tokens. FlowScript stores *reasoning* — structured, typed, queryable in <1ms.

**Mem0, Zep, Letta, LangGraph — those solve retrieval. FlowScript solves reasoning.** They're not mutually exclusive. Use an embedding store for "find similar memories" and FlowScript for "why did we decide that?"

---

## Install

```bash
npm install flowscript-core
```

---

## Hello World

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

console.log(mem.query.blocked());   // structured blockers + downstream impact
console.log(mem.query.tensions());  // tradeoffs with named axes
mem.save("./memory.fs");            // human-readable, PM-reviewable
```

Three lines of output, three things no other memory system gives you: typed blockers with impact chains, named-axis tensions, and a `.fs` file a human can actually read.

---

## The Complete Developer Loop

This is what v1.0 delivers. Persistent, evolving agent memory in 10 minutes.

```typescript
import { Memory } from 'flowscript-core';

// 1. Load or create persistent memory (zero-friction first run)
const mem = Memory.loadOrCreate('./agent-memory.json');

// 2. Wire to your agent framework (12 tools, OpenAI function calling format)
const tools = mem.asTools();
// → add_node, relate_nodes, set_state, remove_state,
//   query_why, query_what_if, query_tensions, query_blocked, query_alternatives,
//   get_memory, search_nodes, add_alternative

// 3. Your agent builds reasoning in real-time via tool calls
//    (no FlowScript syntax knowledge needed — the tools handle it)

// 4. Inject memory into agent prompt (respects token budget)
const context = mem.toFlowScript({
  maxTokens: 4000,
  strategy: 'tier-priority'  // proven+foundation always included
});

// 5. End of session: housekeep + save
mem.prune();   // dormant nodes → .audit.jsonl (append-only, crash-safe)
mem.save();    // no-arg save to stored path

// 6. Next session: load → memory has evolved
//    Growing nodes (recent), resting (few days), dormant (auto-prunable)
//    Patterns graduate: current → developing → proven → foundation
```

---

## Three Ways In

**1. Agent tools** (zero learning curve — wire and go)

```typescript
const mem = Memory.loadOrCreate('./memory.json');
const tools = mem.asTools();

// Pass tools to any OpenAI-compatible agent framework.
// The agent builds structured reasoning via tool calls —
// no FlowScript syntax knowledge needed.
```

**2. From agent transcripts** (extract reasoning from existing conversations)

```typescript
const mem = await Memory.fromTranscript(agentLog, {
  extract: async (prompt) => await yourLLM(prompt)  // any LLM
});
console.log(mem.query.tensions());
```

Paste an existing agent conversation. The LLM extracts structured reasoning. You get queryable decision intelligence back. LLM-agnostic — bring your own model.

**3. Builder API** (programmatic construction)

```typescript
const mem = new Memory();
const t = mem.thought("caching improves latency");
t.causes(mem.thought("higher memory usage"));
mem.tension(
  mem.thought("speed matters"),
  mem.thought("cost constraints"),
  "performance vs budget"
);
```

Fluent chaining, type-safe, auto-generates the reasoning graph.

**4. Parse `.fs` directly** (power users)

```typescript
const mem = Memory.parse(`
  ? which database for sessions
  || Redis <- speed critical
  || Postgres <- better durability
  speed >< durability
`);
```

21 markers, human-readable, works in any text editor. [Full syntax spec](FLOWSCRIPT_SYNTAX.md).

---

## Wire to Your Agent

`asTools()` returns 12 tools in OpenAI function calling format. Your agent gets structured reasoning as tool calls — no prompt engineering, no FlowScript syntax.

```typescript
const tools = mem.asTools();
// Returns: MemoryTool[] — each has { type, function: { name, description, parameters }, handler }

// Filter by category:
const queryOnly = mem.asTools({ include: ['query'] });

// Namespace for multi-tool agents:
const prefixed = mem.asTools({ prefix: 'memory_' });
// → memory_add_node, memory_query_why, etc.
```

**Core tools** (build the graph): `add_node`, `add_alternative`, `relate_nodes`, `set_state`, `remove_state`

**Query tools** (ask questions): `query_why`, `query_what_if`, `query_tensions`, `query_blocked`, `query_alternatives`

**Memory tools** (inspect + search): `get_memory`, `search_nodes`

Each tool handler returns typed `{ success: true, data }` or `{ success: false, error }`.

---

## Token-Budgeted Serialization

Inject memory into agent prompts without blowing your context window.

```typescript
// Hard budget — never exceeds maxTokens
const context = mem.toFlowScript({ maxTokens: 4000 });

// Four strategies:
mem.toFlowScript({ maxTokens: 4000, strategy: 'tier-priority' });  // foundation first (default)
mem.toFlowScript({ maxTokens: 4000, strategy: 'recency' });        // newest first
mem.toFlowScript({ maxTokens: 4000, strategy: 'frequency' });      // most-referenced first
mem.toFlowScript({ maxTokens: 4000, strategy: 'relevance', relevanceQuery: 'auth' }); // topic match

// Proven + foundation tiers always included (preserveTiers default)
// Dormant nodes excluded by default (excludeDormant)
```

~3:1 compression ratio vs prose. Same reasoning, 66% fewer tokens. At scale that's real money.

---

## Audit Trail

`prune()` doesn't delete — it archives. Every pruned node, relationship, and state is appended to `.audit.jsonl` with full provenance. Write-before-remove ordering for crash safety.

```typescript
mem.prune();  // dormant nodes → agent-memory.audit.jsonl

// Query the audit trail
const history = Memory.readAuditLog('./agent-memory.audit.jsonl');
// Returns: AuditEntry[] — timestamp, event, full node objects, temporal metadata
```

Your agent's decision history is always recoverable. Compliance-friendly by design.

---

## The Query Engine

Five semantic queries. No competitor has these.

| Query | What it does | Example question it answers |
|-------|-------------|---------------------------|
| `why(nodeId)` | Traces causal chains backward | "Why did we choose Redis?" |
| `whatIf(nodeId)` | Projects forward consequences | "What breaks if we drop caching?" |
| `tensions()` | Maps all tradeoffs with named axes | "What tensions exist in this design?" |
| `blocked()` | Finds blockers with impact scoring | "What's stuck and what's downstream?" |
| `alternatives(questionId)` | Reconstructs decision rationale | "What options did we consider?" |

Each query returns structured, typed results in multiple formats (chain, tree, flat, comparison). All execute in **<1ms** on typical agent memory graphs.

These operations are computationally impossible on unstructured text. That's the point. Structure makes reasoning queryable.

Full query docs with TypeScript API: [QUERY_ENGINE.md](QUERY_ENGINE.md)

---

## Temporal Intelligence

Memory that gets smarter over time. Nodes have temporal tiers that reflect how established knowledge is:

| Tier | Meaning | Behavior |
|------|---------|----------|
| `current` | New, recent observations | Grows quickly, may be pruned |
| `developing` | Patterns emerging (touched 2+ times) | Building confidence |
| `proven` | Validated through repeated use (3+ times) | Protected from pruning |
| `foundation` | Core truths | Always preserved, even under budget pressure |

Nodes graduate automatically based on frequency. The `garden()` method shows what's growing, resting, and dormant. `prune()` removes dormant nodes to the audit trail. Proven and foundation tiers are preserved through budget constraints — your agent never loses hard-won knowledge.

---

## Agent-to-Agent Decision Exchange

FlowScript's most differentiated use case: **structured semantic payloads between agents.**

When Agent A asks Agent B "why did you make that decision?", most systems return unstructured text. FlowScript returns a typed causal chain:

```typescript
// Agent B responds to a why() query with structured reasoning
const chain = mem.query.why("auth-decision-001");
// Returns: decision ← rationale ← evidence ← constraints
// Every link typed, every source tracked, every tradeoff named

// Agent A can then query further:
const impacts = mem.query.whatIf("auth-decision-001");
// "If that decision changes, what downstream effects propagate?"
```

This is [LDP Mode 3](https://arxiv.org/abs/2603.08852) (Semantic Graphs) — structured decision payloads as a protocol, not just storage. No other agent memory system enables typed reasoning exchange between agents. Embedding stores pass blobs. FlowScript passes *understanding*.

See [flowscript-ldp](https://pypi.org/project/flowscript-ldp/) for the working reference implementation.

---

## Cross-Architecture Evidence

Six AI architectures (Claude, ChatGPT, Gemini, DeepSeek, Claude Code, fresh Claude instances) parsed FlowScript *without being given the specification*. All six recognized the notation immediately and started using it in responses.

Different training data, different attention mechanisms, different optimization targets. Same structural recognition. This suggests FlowScript taps fundamental patterns in language and reasoning, not model-specific quirks.

Specification alone is sufficient for full adoption. No training. No fine-tuning. Just the syntax reference and examples.

Running in production daily in a multi-agent cognitive architecture with 11 sensors, 22 scheduled tasks, and bilateral AI-to-AI relay. Not theoretical.

---

## Why This Isn't Another Memory Layer

| Capability | FlowScript | Embedding stores | State dicts | LLM self-edit |
|-----------|-----------|-----------------|------------|--------------|
| Semantic queries (why, blocked, tensions) | Yes | No | No | No |
| Human-readable persistence | Yes (.fs files) | No | Partially | No |
| Decision provenance | Yes (typed chains) | No | No | Sometimes |
| Agent-to-agent reasoning exchange | Yes (LDP Mode 3) | No | No | No |
| Token-budgeted serialization | Yes (4 strategies) | No | No | No |
| Temporal tiers + graduation | Yes | No | No | No |
| Append-only audit trail | Yes (.audit.jsonl) | No | No | No |
| Sub-ms query performance | Yes | Depends | Yes | No (LLM call) |
| Works without fine-tuning | Yes | Yes | Yes | Yes |

---

## EU AI Act Alignment

FlowScript's `why()` query produces the typed explanatory chains that Articles 12, 13(3)(b)(iv), and 86 of the EU AI Act require for high-risk AI systems. The append-only audit trail (`.audit.jsonl`) provides the decision provenance record these regulations mandate. Built for reasoning — compliance comes free.

*Applies to high-risk AI systems under Annex III. Not a universal compliance claim.*

---

## Notation at a Glance

You don't need to learn all 21 markers. Start with these:

| Marker | Meaning | Example |
|--------|---------|---------|
| `->` | causes / leads to | `poor sleep -> reduced focus` |
| `?` | question / decision point | `? which framework to use` |
| `><` | tension / tradeoff | `speed >< code quality` |
| `[blocked]` | waiting on dependency | `* [blocked(reason, since)]` |
| `[decided]` | committed direction | `* [decided(rationale, on)]` |
| `thought:` | insight worth preserving | `thought: caching is the bottleneck` |

Full 21-marker spec: [FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) | Beginner guide: [FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md) | Real-world examples: [FLOWSCRIPT_EXAMPLES.md](FLOWSCRIPT_EXAMPLES.md)

---

## CLI

```bash
# Parse FlowScript to IR
npx flowscript-core parse example.fs -o example.json

# Lint for semantic errors (9 rules)
npx flowscript-core lint example.fs

# Validate IR against schema
npx flowscript-core validate example.json

# Query the graph
npx flowscript-core query why <node-id> example.json
npx flowscript-core query tensions example.json
npx flowscript-core query blocked example.json
npx flowscript-core query alternatives <question-id> example.json
```

---

## Protocol Alignment

Three independent systems arrived at symbolic notation for AI communication without cross-pollination:

| System | Date | Scope |
|--------|------|-------|
| [SynthLang](https://github.com/ruvnet/SynthLang) | Jan 2025 | Prompt compression |
| **FlowScript** | **Oct 2025** | **Decision intelligence + formal toolchain** |
| [MetaGlyph](https://arxiv.org/abs/2601.07354) | Jan 2026 | Prompt compression (6 operators, 62-81% token reduction) |

When independent builders converge on the same structural insight, that's evidence the insight is load-bearing.

FlowScript's IR is the first implementation of **LDP Mode 3** (Semantic Graphs) from [arXiv:2603.08852](https://arxiv.org/abs/2603.08852). Active collaboration with the LDP paper author on session state machine co-design ([GitHub issues](https://github.com/sunilp/ldp-protocol/issues)).

Also structurally aligned with [G2CP](https://github.com/karim0bkh/G2CP_AAMAS) (graph-grounded agent communication, 73% token reduction), [JamJet](https://jamjet.dev) (Rust agent runtime with ProtocolAdapter), and [NFD](https://arxiv.org/abs/2603.10808) (three-tier cognitive architecture matching FlowScript's temporal model).

---

## Documentation

**Learn the notation:**
[FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) (complete spec) | [FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md) (beginner guide) | [FLOWSCRIPT_EXAMPLES.md](FLOWSCRIPT_EXAMPLES.md) (real-world patterns)

**Understand the engine:**
[QUERY_ENGINE.md](QUERY_ENGINE.md) (5 queries, TypeScript API) | [TOOLCHAIN.md](TOOLCHAIN.md) (parser, linter, validator)

**Dive deeper:**
[ADVANCED_PATTERNS.md](ADVANCED_PATTERNS.md) (sophisticated usage) | [spec/](spec/) (formal specifications) | [examples/](examples/) (golden .fs/.json pairs)

**Try it live:** [flowscript.org](https://flowscript.org)

---

## Contributing

Use FlowScript. Report what's friction. Open issues with evidence from real use, not theoretical proposals.

Working on agent protocols? FlowScript's IR is a natural fit for structured semantic payloads. PRs for integration welcome.

- [GitHub Issues](https://github.com/phillipclapham/flowscript/issues)
- [GitHub Discussions](https://github.com/phillipclapham/flowscript/discussions)

---

## License

MIT. See [LICENSE](LICENSE).

*Decision intelligence for AI agents. 532 tests. Typed semantic queries over structured reasoning.*
