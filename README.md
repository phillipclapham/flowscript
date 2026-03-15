# FlowScript

**Decision intelligence for AI agents.**

[![Tests](https://img.shields.io/badge/tests-246%20passing-brightgreen)](https://github.com/phillipclapham/flowscript) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Website](https://img.shields.io/badge/demo-flowscript.org-purple)](https://flowscript.org)

---

## The Problem

Your agent made a decision. Your PM asks "why?" You dig through chat logs and JSON blobs. Good luck.

Agent memory today is either opaque embeddings you can't inspect, expensive LLM self-editing you can't audit, or untyped state dicts with no structure. None of them answer "why did you decide that?" because none of them have semantics. They store tokens. FlowScript stores *reasoning*.

## Hello World

> **v1.0 SDK** (coming soon)

```typescript
import { Memory } from 'flowscript';
const mem = new Memory();

const q = mem.question("Which database for agent memory?");
mem.alternative(q, "Redis").decide({ rationale: "speed critical for real-time agents" });
mem.alternative(q, "SQLite").block({ reason: "no concurrent write support" });
mem.thought("Redis gives sub-ms reads").vs(mem.thought("cluster costs $200/mo"), "performance vs cost");

console.log(mem.query.blocked());   // structured blockers + downstream impact
console.log(mem.query.tensions());  // tradeoffs with named axes
mem.save("./memory.fs");            // human-readable, PM-reviewable
```

Three lines of output, three things no other memory system gives you: typed blockers with impact chains, named-axis tensions, and a `.fs` file a human can actually read.

---

## What You Get

### Token Efficiency

~3:1 compression ratio vs prose. Same reasoning, 66% fewer memory tokens. At scale that's real money.

### Decision Provenance

`why(nodeId)` returns a typed causal chain. Not vibes, not "the model said so." A traceable path from decision back through every factor that led there.

### Blocker Analysis

`blocked()` finds every stuck node, scores downstream impact, and tells you how long it's been waiting. Your agent doesn't just know *what's* blocked, it knows *what breaks* because of it.

### Human-Readable Audit

`.fs` files read like structured prose. Your PM can open agent memory in a code review. Try that with a vector database.

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

## Three Ways In

**1. From agent transcripts** (zero learning curve)

```typescript
const mem = Memory.fromTranscript(agentLog);
console.log(mem.query.tensions());
```

The LLM writes FlowScript. You never touch the syntax. Paste existing agent output, get queryable decision intelligence back.

**2. Builder API** (programmatic)

```typescript
const mem = new Memory();
const t = mem.thought("caching improves latency");
t.causes(mem.thought("higher memory usage"));
t.tensionWith(mem.thought("cost constraints"), "performance vs budget");
```

Feels like a builder/ORM. Type-safe, fluent chaining, auto-generates the graph.

**3. Parse `.fs` directly** (power users)

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

## Install

```bash
npm install flowscript
```

For Python and LDP protocol integration:

```bash
pip install flowscript-ldp
```

TypeScript-first. Python SDK wraps the same engine. See [flowscript-ldp](https://github.com/phillipclapham/flowscript-ldp) for the LDP Mode 3 reference implementation.

---

## How It Works

```
.fs file / builder API / transcript
        ↓
   FlowScript Parser (Ohm.js PEG grammar)
        ↓
   Intermediate Representation
   (typed graph: content-hash IDs, provenance tracking, SHA-256 dedup)
        ↓
   Query Engine (5 semantic operations)
        ↓
   Structured Results (chain / tree / flat / comparison)
```

The IR is the core. Every node gets a content-hash ID. Every relationship is typed (causes, derives, tension, blocks, etc.). Provenance tracks source files and line numbers. The schema is formally specified and validated.

246 tests. All passing. Parser, linter (9 semantic rules), validator, query engine, CLI.

Details: [TOOLCHAIN.md](TOOLCHAIN.md) | Formal specs: [spec/](spec/)

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

## Why This Isn't Another Memory Layer

| Capability | FlowScript | Embedding stores | State dicts | LLM self-edit |
|-----------|-----------|-----------------|------------|--------------|
| Semantic queries (why, blocked, tensions) | Yes | No | No | No |
| Human-readable persistence | Yes (.fs files) | No | Partially | No |
| Token efficiency (~3:1 compression) | Yes | N/A | No | No |
| Decision provenance | Yes (typed chains) | No | No | Sometimes |
| Sub-ms query performance | Yes | Depends | Yes | No (LLM call) |
| Works without fine-tuning | Yes | Yes | Yes | Yes |

If you're evaluating Mem0, Zep, Letta, or LangGraph for agent memory, those solve retrieval. FlowScript solves reasoning. They're not mutually exclusive. Use an embedding store for "find similar memories" and FlowScript for "why did we decide that?"

---

## Protocol Alignment

Three independent systems arrived at symbolic notation for AI communication without cross-pollination:

| System | Date | Scope |
|--------|------|-------|
| [SynthLang](https://github.com/ruvnet/SynthLang) | Jan 2025 | Prompt compression |
| **FlowScript** | **Oct 2025** | **Decision intelligence + formal toolchain** |
| [MetaGlyph](https://arxiv.org/abs/2601.07354) | Jan 2026 | Prompt compression (6 operators, 62-81% token reduction) |

When independent builders converge on the same structural insight, that's evidence the insight is load-bearing.

FlowScript's IR is the first implementation of **LDP Mode 3** (Semantic Graphs) from [arXiv:2603.08852](https://arxiv.org/abs/2603.08852). The [flowscript-ldp](https://pypi.org/project/flowscript-ldp/) package provides a working `LdpDelegate` with real HTTP integration, Mode 3 negotiation, and fallback chains. Active collaboration with the LDP paper author on session state machine co-design ([GitHub issues](https://github.com/sunilp/ldp-protocol/issues)).

Also structurally aligned with [G2CP](https://github.com/karim0bkh/G2CP_AAMAS) (graph-grounded agent communication, 73% token reduction), [JamJet](https://jamjet.dev) (Rust agent runtime with ProtocolAdapter), and [NFD](https://arxiv.org/abs/2603.10808) (three-tier cognitive architecture matching FlowScript's temporal model).

Running in production for 6+ months in the [flow system](https://github.com/phillipclapham/flow-methodology). Not theoretical.

---

## Cross-Architecture Evidence

Six AI architectures (Claude, ChatGPT, Gemini, DeepSeek, Claude Code, fresh Claude instances) parsed FlowScript *without being given the specification*. All six recognized the notation immediately and started using it in responses.

Different training data, different attention mechanisms, different optimization targets. Same structural recognition. This suggests FlowScript taps fundamental patterns in language and reasoning, not model-specific quirks.

Specification alone is sufficient for full adoption. No training. No fine-tuning. Just the syntax reference and examples.

Details: [ARCHITECTURE.md](ARCHITECTURE.md) (cognitive patterns from 6 months of real use)

---

## CLI

```bash
# Parse FlowScript to IR
flowscript parse example.fs -o example.json

# Lint for semantic errors (9 rules)
flowscript lint example.fs

# Validate IR against schema
flowscript validate example.json

# Query the graph
flowscript query why <node-id> example.json
flowscript query what-if <node-id> example.json
flowscript query tensions example.json
flowscript query blocked example.json
flowscript query alternatives <question-id> example.json
```

---

## Documentation

**Learn the notation:**
[FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) (complete spec) | [FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md) (beginner guide) | [FLOWSCRIPT_EXAMPLES.md](FLOWSCRIPT_EXAMPLES.md) (real-world patterns)

**Understand the engine:**
[QUERY_ENGINE.md](QUERY_ENGINE.md) (5 queries, TypeScript API) | [TOOLCHAIN.md](TOOLCHAIN.md) (parser, linter, validator)

**Dive deeper:**
[ARCHITECTURE.md](ARCHITECTURE.md) (cognitive patterns) | [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) (implementation) | [spec/](spec/) (formal specifications) | [examples/](examples/) (golden .fs/.json pairs)

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

*Decision intelligence for AI agents. Typed semantic queries over structured reasoning.*
