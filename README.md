<p align="center">
  <img src="docs/brand/logo-512.png" alt="FlowScript" width="120" />
</p>

<h1 align="center">FlowScript</h1>

<p align="center"><strong>Semantic notation for structured reasoning</strong></p>

<p align="center"><em>21 typed markers for encoding decisions, tensions, blockers, causal chains, and temporal knowledge.</em></p>

<p align="center">
  <a href="https://github.com/phillipclapham/flowscript/actions/workflows/test.yml"><img src="https://github.com/phillipclapham/flowscript/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
  <a href="https://www.npmjs.com/package/flowscript-core"><img src="https://img.shields.io/npm/v/flowscript-core" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://flowscript.org"><img src="https://img.shields.io/badge/site-flowscript.org-purple" alt="Website"></a>
</p>

---

> **Evolution note:** FlowScript explored typed reasoning representation for AI agents — compression-as-cognition, temporal graduation, citation-validated patterns, immune system. These core concepts evolved into [**anneal-memory**](https://github.com/phillipclapham/anneal-memory), a two-layer memory system for AI agents. The notation remains in active daily use for reasoning compression and knowledge encoding. This repo is maintained as a reference implementation and notation playground.

---

## The Notation

FlowScript is a 21-marker semantic notation that both humans and AI parse natively. It sits between natural language (ambiguous, verbose) and formal logic (precise, unreadable). Start with three markers — `->`, `><`, `{ }` — and add more as you need them.

```
{database_decision:
  ? which_database_for_sessions
  || Redis -> sub-ms reads, proven at scale
  || PostgreSQL -> rich queries, $15/month, ACID

  speed ><[performance vs cost] infrastructure budget

  [decided(rationale: "budget constraint eliminated Redis", on: "2026-03-30")]
  ! [blocked(reason: "data export tool needed", since: "2026-03-28")]
}
```

Every marker has computational semantics. `?` creates a question node. `||` creates alternatives. `><` creates a tension with a named axis. `[decided]` records a commitment with rationale and date. The parser turns this into the same IR that the query engine traverses.

**Learn the full notation:** [flowscript.org/learn](https://flowscript.org/learn) | **Formal spec:** [`spec/`](spec/) directory (757 lines, v2.1)

---

## What This Repo Contains

### TypeScript SDK (`flowscript-core` on npm)

779 tests. Memory class with typed node construction, six graph traversal queries, 15 agent tools in OpenAI function calling format, hash-chained audit trail, and four token budgeting strategies.

```typescript
import { Memory } from 'flowscript-core';

const mem = Memory.loadOrCreate('./agent-memory.json');

// Build reasoning — typed nodes with explicit relationships
const q = mem.question("Which database for agent memory?");
mem.alternative(q, "Redis").decide({ rationale: "speed critical" });
mem.alternative(q, "SQLite").block({ reason: "no concurrent writes" });
mem.tension(mem.thought("sub-ms reads"), mem.thought("$200/mo cluster"), "performance vs cost");

// Six typed queries over the reasoning graph
mem.query.tensions();             // tradeoffs with named axes
mem.query.blocked();              // what's stuck + downstream impact
mem.query.why(nodeId);            // causal chain backward
mem.query.whatIf(nodeId);         // what breaks if this changes
mem.query.alternatives(nodeId);   // what was considered + decided
mem.query.counterfactual(nodeId); // what would need to change

// Human-readable serialization
console.log(mem.toFlowScript());
```

Sub-millisecond graph traversal. No embeddings, no LLM calls, no network dependency.

### Web Editor ([flowscript.org](https://flowscript.org))

<p align="center">
  <img src="docs/flowscript-demo.png" alt="FlowScript — web editor with .fs syntax, D3 reasoning graph, and live query panel" width="800">
</p>

- CodeMirror 6 with custom FlowScript language mode and syntax highlighting
- D3 force-directed graph visualization of reasoning nodes and relationships
- Live query panel — run `tensions()`, `blocked()`, `why()` against your graph in the browser
- WCAG AA accessible, responsive design

Source code in [`web/`](web/).

### Notation Spec

The full FlowScript v2.1 specification in [`spec/`](spec/):
- `semantics.md` — all 21 markers formally defined
- `grammar.md` — EBNF formal grammar
- `ir.schema.json` — JSON schema for the intermediate representation
- `linter-rules.md` — semantic validation rules (6 errors, 3 warnings)

### Teaching Materials

- [`FLOWSCRIPT_SYNTAX.md`](FLOWSCRIPT_SYNTAX.md) — comprehensive syntax reference with examples
- [`FLOWSCRIPT_LEARNING.md`](FLOWSCRIPT_LEARNING.md) — conceptual introduction
- [`FLOWSCRIPT_EXAMPLES.md`](FLOWSCRIPT_EXAMPLES.md) — real-world patterns (before/after)
- [`ADVANCED_PATTERNS.md`](ADVANCED_PATTERNS.md) — recursive nesting, meta-thoughts, metaprogramming
- [`examples/`](examples/) — four golden examples (Decision, Debug, Research, Design) with teaching guides

---

## What Evolved into anneal-memory

Through building FlowScript, we discovered that the core insights were more powerful than the syntax:

| FlowScript explored | anneal-memory delivers |
|:---------------------|:----------------------|
| Temporal graduation (1x → 2x → 3x → proven) | Citation-validated graduation with immune system |
| Compression-as-cognition | Episodes compress into identity through consolidation |
| Hash-chained audit trail | Tamper-evident compliance layer (EU AI Act) |
| Anti-inbreeding defense | Graduation gate + principle demotion through citation decay |
| Transport-layer wrapper | Compliance proxy vision (MCP transport interception) |
| Six typed reasoning queries | Planned for anneal-memory CLI |

The notation barrier was real — developers won't learn a new syntax for memory. anneal-memory delivers the same cognitive architecture as a zero-dependency MCP server where agents use natural language.

**[anneal-memory on GitHub](https://github.com/phillipclapham/anneal-memory)** | **[anneal-memory on PyPI](https://pypi.org/project/anneal-memory/)**

---

## Related

- **[flowscript-agents](https://github.com/phillipclapham/flowscript-agents)** — Python SDK with MCP server, nine framework adapters, 717 tests
- **[anneal-memory](https://github.com/phillipclapham/anneal-memory)** — Where the core concepts live now
- **[flowscript.org](https://flowscript.org)** — Notation reference, Learn page, and interactive playground

---

<p align="center">
  Built by <a href="https://phillipclapham.com">Phill Clapham</a> · <a href="https://claphamdigital.com">Clapham Digital LLC</a>
</p>
