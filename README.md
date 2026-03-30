<p align="center">
  <img src="docs/brand/logo-512.png" alt="FlowScript" width="120" />
</p>

<h1 align="center">FlowScript</h1>

<p align="center"><strong>Your AI agents make decisions they can't explain.<br>FlowScript makes those decisions queryable.</strong></p>

<p align="center"><em>Vector stores remember what. FlowScript remembers why.</em></p>

<p align="center">
  <a href="https://github.com/phillipclapham/flowscript/actions/workflows/test.yml"><img src="https://github.com/phillipclapham/flowscript/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
  <a href="https://www.npmjs.com/package/flowscript-core"><img src="https://img.shields.io/npm/v/flowscript-core" alt="npm"></a>
  <a href="https://pypi.org/project/flowscript-agents/"><img src="https://img.shields.io/pypi/v/flowscript-agents" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://flowscript.org"><img src="https://img.shields.io/badge/demo-flowscript.org-purple" alt="Website"></a>
</p>

---

FlowScript is a reasoning memory system for AI agents. It gives your agents typed, queryable memory — six semantic queries that no vector store can answer — backed by a hash-chained audit trail.

This repo contains the **TypeScript SDK**, the **FlowScript notation spec**, and the **web editor** at [flowscript.org](https://flowscript.org).

> **Looking for the MCP server?** Most developers want [`flowscript-agents`](https://github.com/phillipclapham/flowscript-agents) — the Python package with MCP server, nine framework adapters, auto-extraction, and session memory.

---

## Quick Start

```bash
npm install flowscript-core
```

```typescript
import { Memory } from 'flowscript-core';

const mem = Memory.loadOrCreate('./agent-memory.json');

// Build reasoning directly — typed nodes with explicit relationships
const q = mem.question("Which database for agent memory?");
mem.alternative(q, "Redis").decide({ rationale: "speed critical" });
mem.alternative(q, "SQLite").block({ reason: "no concurrent writes" });
mem.tension(mem.thought("sub-ms reads"), mem.thought("$200/mo cluster"), "performance vs cost");

// Six typed queries over the reasoning graph
mem.query.tensions();            // tradeoffs with named axes
mem.query.blocked();             // what's stuck + downstream impact
mem.query.why(nodeId);           // causal chain backward from any decision
mem.query.whatIf(nodeId);        // what breaks if this changes
mem.query.alternatives(nodeId);  // what was considered + decided
mem.query.counterfactual(nodeId); // what would need to change

// 15 agent tools in OpenAI function calling format
const tools = mem.asTools();

// Human-readable serialization
console.log(mem.toFlowScript());

// Session lifecycle — prune dormant nodes to audit trail
mem.sessionWrap();
mem.save('./agent-memory.json');
```

Sub-millisecond graph traversal. No embeddings required, no LLM calls, no network dependency. And when memories contradict, FlowScript doesn't delete — it creates a queryable tension.

---

## What FlowScript Does

- **Six reasoning queries** — `why()`, `tensions()`, `blocked()`, `alternatives()`, `whatIf()`, `counterfactual()`. Graph traversals, not LLM calls. Deterministic and reproducible.
- **Typed nodes** — thoughts, questions, decisions, alternatives, blockers. With explicit relationships: causes, tensions, blocks.
- **Temporal intelligence** — nodes track creation time, last touched, touch frequency. Session wraps prune dormant knowledge to the audit trail while promoting recurring patterns.
- **Hash-chained audit trail** — every mutation logged with SHA-256 chain integrity. Tamper-evident, queryable, verifiable.
- **Token budgeting** — four serialization strategies (recent, relevant, balanced, full) to fit memory into any context window.
- **Human-readable format** — `.fs` FlowScript notation that PMs can read in code review.

---

## The Ecosystem

| Package | What it is | Install |
|:--------|:-----------|:--------|
| [**flowscript-agents**](https://github.com/phillipclapham/flowscript-agents) | Python SDK — MCP server, 9 framework adapters, auto-extraction, session memory | `pip install flowscript-agents` |
| [**flowscript-core**](https://www.npmjs.com/package/flowscript-core) | TypeScript SDK — Memory class, query engine, 15 agent tools, built-in MCP server | `npm install flowscript-core` |
| [**flowscript-cloud**](https://github.com/phillipclapham/flowscript-cloud) | Compliance witnessing — independent chain verification + attestations (BSL 1.1) | [`api.flowscript.org`](https://api.flowscript.org/v1/health) |
| [**flowscript.org**](https://flowscript.org) | Web editor — CodeMirror 6 with FlowScript syntax highlighting + D3 reasoning graph visualization | — |

---

## The Notation

FlowScript is a 21-marker semantic notation that both humans and AI can read and write. It sits between natural language (ambiguous, verbose) and formal logic (precise, unreadable).

```
{database_decision:
  ? which_database_for_sessions | Redis vs PostgreSQL
  + Redis: sub-ms reads, proven at scale
  + PostgreSQL: rich queries, $15/month, ACID
  >< performance vs cost
  [decided(rationale: "budget constraint eliminated Redis", on: "2026-03-30")]
  ! migration_blocked(reason: "data export tool needed", since: "2026-03-28")
}
```

The notation is optional — the TypeScript and Python APIs handle everything programmatically. The notation exists for human-readable serialization, code review, and direct authoring by power users.

Every marker has computational semantics. `?` creates a question node. `+` creates alternatives. `><` creates a tension. `!` creates a blocker. The parser turns this into the same IR that the query engine traverses.

**Full spec:** [`spec/`](spec/) directory in this repo (757 lines, v2.1).

---

## Web Editor

<p align="center">
  <img src="docs/flowscript-demo.png" alt="FlowScript — web editor with .fs syntax, D3 reasoning graph, and live query panel" width="800">
</p>

The web editor at [flowscript.org](https://flowscript.org) provides:
- CodeMirror 6 with custom FlowScript language mode and syntax highlighting
- D3 force-directed graph visualization of reasoning nodes and relationships
- Live query panel — run `tensions()`, `blocked()`, `why()` against your graph in the browser
- WCAG AA accessible, responsive design

Source code in [`web/`](web/).

---

## Links

- **[flowscript-agents](https://github.com/phillipclapham/flowscript-agents)** — Python SDK, MCP server, framework adapters
- **[flowscript.org](https://flowscript.org)** — Web editor and visualization
- **[FlowScript Cloud](https://github.com/phillipclapham/flowscript-cloud)** — Compliance witnessing service
- **[CLAUDE.md snippet](examples/CLAUDE.md.snippet)** — Tells your agent when to use FlowScript tools
- **[Spec](spec/)** — Formal FlowScript notation specification (v2.1)

---

<p align="center">
  Built by <a href="https://phillipclapham.com">Phill Clapham</a> · <a href="https://claphamdigital.com">Clapham Digital LLC</a>
</p>
