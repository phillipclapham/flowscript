# FlowScript: The Missing Notation Layer for AI Communication

*Makes thought topology explicit and computational. Enables human-AI cognitive symbiosis.*

---

## The Language Bottleneck

AI was supposed to democratize intelligence. Instead, it democratized *access*.

Everyone can talk to Claude, ChatGPT, Gemini. But most users are stuck at 20% of what's possible. Not because the models are limited - because language is the bottleneck.

Want genius-level results? You need genius-level language. The prompt is everything. Structure your thinking clearly, specify relationships explicitly, encode your context correctly - suddenly the AI becomes a thinking partner instead of a fancy search engine.

But mastering that language? It's a full-time skill. Most people don't have the bandwidth. So they get mediocre outputs, shrug, and conclude "AI isn't that useful."

**The problem isn't the AI. It's that we're using natural language prose for something that needs structure.**

Natural language is incredible for nuance and creativity. But it's ambiguous by design. When you need to specify exact relationships, track state across conversations, or build on previous context - prose breaks down. The structure is implicit, buried in grammar and word choice. AI has to infer what you mean.

And inference fails more than we'd like to admit.

---

## The Solution: Semantic Notation

FlowScript is semantic notation for human-AI communication. It makes thought structure explicit using 21 carefully-chosen markers.

Not a new language. Not replacing natural language. **Augmenting it.**

You write mostly normal prose, but when relationships matter - when you need to be precise about causation, tension, state, or logical structure - you use notation. The AI instantly parses the topology of your thinking.

**Works with any AI. No installation. No setup. Just start using it.**

> **Researchers & protocol designers:** FlowScript compiles to a formal Intermediate Representation with a complete toolchain (parser, linter, validator, query engine — 214/214 tests passing). If you're here for the IR, agent protocol integration, or convergent evolution evidence, jump to [Protocol Research & Formal Toolchain](#protocol-research--formal-toolchain).

Think of it as markdown for reasoning. Markdown didn't replace writing - it made structure explicit: headers, emphasis, lists, links. Writers still write prose, but structure became computational. Documents became navigable, parseable, transformable.

FlowScript does the same for thought structure. Relations, states, questions, insights - the scaffolding of reasoning made explicit and computational.

### Quick Example

**Before (natural language):**
```
The current approach has scaling issues. We could try serverless 
architecture but that introduces cold start latency which affects 
user experience. There's a tradeoff between cost and performance 
that needs careful evaluation.
```

**After (with FlowScript):**
```
current approach -> scaling issues

? serverless architecture
  <- eliminates scaling issues
  -> introduces cold start latency
  -> degrades user experience
  
cost >< performance
-> needs careful evaluation
```

Same information. Half the words. Structure explicit. AI sees the relationships instantly - not buried in prose, not requiring inference, just *there*.

---

## Getting Started in 60 Seconds

**No installation. No setup. Just start using FlowScript markers in your next AI conversation.**

### The Three Essential Markers

Learn these three, use them now:

**`->` = leads to / causes / results in**
```
poor sleep -> reduced focus -> mistakes -> stress
```

**`?` = question / decision point**
```
? should we refactor now or ship first
```

**`><` = tension / tradeoff**
```
speed >< code quality
security >< user convenience
```

### Try It Right Now

Open ChatGPT, Claude, Gemini - any AI you use. Type a message using those three markers.

**That's it. You're using FlowScript.**

Works everywhere:
- ✓ ChatGPT (OpenAI)
- ✓ Claude (Anthropic)  
- ✓ Gemini (Google)
- ✓ DeepSeek
- ✓ Any AI with text input

Want more? Add markers as needed. See [FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) for the complete set (21 markers).

Want proof it works? See [Evidence](#evidence-cross-architecture-validation) below.

---

## Layer 1: Better Prompts (For Everyone)

The immediate, practical use of FlowScript: **prompt engineering that actually works**.

### The Forcing Function

When you use FlowScript markers, you're forced to complete your thinking. Can't be vague about causation when you have to use `->`. Can't hand-wave relationships when structure is explicit. 

This is a *feature*, not a bug.

Incomplete thoughts produce incomplete results. FlowScript makes incompleteness visible. You see the gaps in your reasoning before the AI sees them.

Users report the same pattern: "I thought I knew what I wanted to ask, but when I tried to structure it with FlowScript, I realized I hadn't thought it through. Once I clarified the relationships, the AI's response was 10x better."

The forcing function catches fuzzy thinking early.

### Start Simple, Scale Up

You don't need all 21 markers. Start with 3:

**`->` = leads to / causes / results in**
```
exercise -> endorphins -> better mood
```

**`?` = question / decision point**
```
? should we refactor now or after launch
```

**`><` = tension / tradeoff / conflict**
```
speed >< accuracy
security >< usability
```

That's it. Three markers get you 70% of the value.

As you get comfortable, add more:

- `<-` (derives from)
- `<->` (bidirectional relationship)
- `thought:` (insight worth preserving)
- `[blocked]` (waiting on something)
- `[decided]` (committed direction)

See [FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) for the complete set.

### Hybrid Approach

FlowScript works best *mixed with natural language*. Not either/or. Both.

Write prose where prose is natural. Use notation where structure matters. The AI parses both seamlessly.

Example:
```
We're considering a major refactor. The codebase has accumulated 
tech debt over 2 years, and velocity is slowing.

current velocity -> declining
  <- tech debt accumulation
  <- poor separation of concerns
  <- no test coverage

? refactor now vs refactor later

refactor now:
  -> immediate velocity hit (2-3 weeks)
  -> cleaner foundation
  -> easier future features
  
refactor later:
  -> ship current features faster
  -> tech debt compounds
  -> eventual rewrite needed

timeline pressure >< code quality >< team morale

thought: team is burned out from shipping under pressure
-> refactor might actually improve morale (working on quality)

* [decided] 2-week refactor sprint
  -> ship current features first (1 week)
  -> then focused refactor (2 weeks)
  -> balances all constraints
```

Reads naturally. Structure visible. AI understands the full context - the tension, the decision factors, the reasoning, the outcome.

This is prompt engineering that works because **structure and context are explicit, not inferred**.

---

## Layer 2: Power Users

Once you're comfortable with basic markers, FlowScript enables sophisticated structured thinking.

### The Complete Marker Set

21 markers total. Start with 3, add as needed:

**State tracking:**
- `[blocked]` - waiting on dependency
- `[decided]` - committed direction  
- `[parking]` - idea not ready to process
- `[exploring]` - investigating, not committed

**Insights & Actions:**
- `thought:` - insight worth preserving
- `action:` - specific action to take
- `✓` - completed action

**Relationships:**
- `<-` - derives from / caused by
- `<->` - bidirectional relationship / mutual influence
- `!=` - different from (definition)
- `=` - equivalent to (definition)

**Modifiers:**
- `!` - urgent (prefix any marker)
- `~` - maybe/exploring (prefix)
- `*` - proven/definite (prefix)

**Scope:**
- `@project` - scoped to specific project

See [FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md) for complete details.

### Use Cases

**Research & Analysis:**
Map complex relationships, track decision factors, preserve reasoning chains across conversations.

**Project Management:**  
State tracking across sessions, blocker visibility, decision documentation, progress tracking.

**Technical Problem-Solving:**
Debug chains, architecture decisions, tradeoff documentation, dependency mapping.

**Strategic Planning:**
Cascade analysis, second-order effects, constraint mapping, scenario evaluation.

**The Pattern:** Natural language for narrative, FlowScript for structure. Hybrid approach works best.

### Progressive Adoption

```
Start simple:
  -> ? ><

Add as needed:
  -> ? >< [blocked] [decided]

Power user:
  -> All 21 markers + FlowScript thinking

= Learn at your own pace
```

---

## Protocol Research & Formal Toolchain

FlowScript isn't just notation you paste into a chat window. It compiles to a formal Intermediate Representation — a JSON structure with content-hash IDs, provenance tracking, typed relationships, and schema validation. That IR is what makes everything below possible.

### The IR: Why It Matters

The FlowScript toolchain parses `.fs` files into a canonical IR that preserves the full topology of your thinking as structured data:

```bash
# Parse FlowScript to IR
flowscript parse example.fs -o example.json

# Lint for semantic errors (9 rules: 6 errors, 3 warnings)
flowscript lint example.fs

# Validate IR against canonical schema
flowscript validate example.json

# Query the cognitive graph
flowscript query why <node-id> example.json
flowscript query what-if <node-id> example.json
flowscript query tensions example.json
```

214 tests passing. All queries execute in <1ms on typical cognitive graphs. The IR includes content-hash deduplication, source file provenance, line numbers, and timestamps — everything a memory system or protocol payload needs.

For the full toolchain and query engine documentation, see [Toolchain & Query Engine](#toolchain--query-engine) below.

### Position in the Agent Protocol Landscape

The transport layer for agent communication is settled. MCP (agent-to-tool) and A2A (agent-to-agent) are both under the Linux Foundation. 97M+ monthly MCP downloads. That layer is infrastructure commons now — same status as HTTP.

Competition has moved up the stack to three layers:
1. **Network effects** — who owns agent discovery
2. **Semantic layer** — how agents understand each other's meaning
3. **Cognitive substrate** — what makes agents think well, not just communicate

FlowScript operates at layers 2 and 3. It's not competing with MCP or A2A — it's what goes *inside* the messages they transport.

### Convergent Evolution

Three independent systems arrived at symbolic notation for AI communication without any cross-pollination:

| System | Date | Scope |
|--------|------|-------|
| [SynthLang](https://github.com/ruvnet/SynthLang) | Jan 2025 | Prompt compression |
| **FlowScript** | **Oct 2025** | **Cognitive substrate + formal toolchain** |
| [MetaGlyph](https://arxiv.org/abs/2601.07354) | Jan 2026 | Prompt compression (6 operators, 62-81% token reduction) |

When independent builders in different domains converge on the same structural insight — explicit topology beats implicit prose for AI communication — that's evidence the insight is load-bearing, not idiosyncratic.

FlowScript is the broadest in scope: 21 markers, parser, linter, validator, query engine, web editor, D3 visualization. SynthLang and MetaGlyph focus on compression; FlowScript treats notation as *cognitive infrastructure* — computable, queryable, and memory-ready.

### Research Alignment

Recent work in agent protocol design has independently identified the structural slot FlowScript fills:

**LDP** ([arXiv:2603.08852](https://arxiv.org/abs/2603.08852)) defines six progressive payload modes for agent communication. Mode 1 (Semantic Frames) achieves 37% token reduction. Mode 3 (Semantic Graphs) is specified but has no implementation or evaluation — it's described as "future work pending wider API support for intermediate representations." FlowScript's IR is a working implementation of Mode 3.

**G2CP** ([GitHub](https://github.com/karim0bkh/G2CP_AAMAS)) is a graph-grounded communication protocol where agents exchange structured subgraphs instead of free text. Their SUBGRAPH wire format — typed nodes, labeled edges with confidence scores — is structurally isomorphic to FlowScript's IR. G2CP reports 73% token reduction and 0.90 task accuracy. FlowScript provides the human-readable authoring layer that G2CP's wire format lacks.

**NFD** ([arXiv:2603.10808](https://arxiv.org/abs/2603.10808)) independently derives a three-tier cognitive architecture for agents (stable identity → developing capability → recent context) that matches the temporal memory structure FlowScript was built to encode — and that the [flow system](https://github.com/phillipclapham/flow-methodology) has been running in production since October 2025.

**JamJet** ([GitHub](https://github.com/jamjet-labs/jamjet)) is a production Rust agent runtime (launched March 2026) with a `ProtocolAdapter` plugin system. LDP already has a [JamJet adapter](https://github.com/sunilp/ldp-protocol). The integration path for FlowScript is concrete: FlowScript IR → LDP Mode 3 payload → existing JamJet adapter → JamJet runtime.

### What This Means

The agent protocol ecosystem is converging on a need for structured semantic payloads — something richer than plain text but lighter than full knowledge graphs. FlowScript's IR sits exactly in that gap: human-writable, machine-parseable, formally validated, and already integrated into a production cognitive system.

This isn't theoretical positioning. The [flow system](https://github.com/phillipclapham/flow-methodology) has been running FlowScript-encoded memory in production for 6 months. The toolchain has 214 passing tests. The IR schema is stable and documented.

If you're working on agent protocols and want to explore integration, [open an issue](https://github.com/phillipclapham/flowscript/issues) or see the [formal specification](spec/).

---

## Layer 3: What FlowScript Enables

This is where it gets interesting.

### Cognitive Symbiosis: A Proof of Concept

One developer spent 6 weeks building a personal continuity system using FlowScript notation. The result: cognitive partnership that exceeds individual capacity.

**What was built:**
- Persistent memory with FlowScript-native structure
- Cross-context collaboration (web ↔ mobile via git sync)
- Computational operations on relationship graphs
- Automated lifecycle management (questions → discoveries)
- Multi-session project continuity with state tracking

**The "Third Mind" phenomenon:**
Results exceed what either human or AI produces alone. Ideas emerge from the collaboration space itself. Quality doesn't match either partner's signature - it's genuinely collaborative.

**Key insight:** FlowScript structure enables operations that pure prose can't support. Relationships become queryable. State becomes computational. Memory becomes a graph you can traverse.

**Want details?** See [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) for the complete implementation. This is called the "flow" system - one possible way to use FlowScript.

**Want to build your own?** FlowScript notation is open. It works with any AI and any architecture. Build whatever continuity system makes sense for you:

- Web app + database (prompt generation pattern)
- Browser extension + local storage
- Mobile app with cloud sync
- API service for team use
- File-based like flow system
- Something entirely different

**The notation is universal. Implementation is up to you.**

### Why This Matters

If semantic notation can enable cognitive symbiosis for one person in 6 weeks, what becomes possible at scale?

**Potential applications:**
- Advanced continuity systems (commercial products)
- Structured knowledge bases (corporate memory)
- Research collaboration tools (academic use)
- Multi-agent AI coordination (team workflows)
- Novel interaction paradigms (yet to be discovered)

**Early days:** FlowScript shipped October 2025. Applications are still being discovered through use. Evidence-based evolution guided by what actually works.

### Research Directions

**Open questions:**
- Does FlowScript generalize beyond continuity systems?
- What computational operations become possible with formal semantics?
- How does extended FlowScript use change thinking patterns?
- Can this enable human-AI collaborative reasoning at scale?

**Exploration welcome:** This is genuinely new territory. Community contributions and research collaboration encouraged.

---

## Toolchain & Query Engine

The toolchain introduced in [Protocol Research & Formal Toolchain](#protocol-research--formal-toolchain) above deserves a deeper look. Here's what each component does and why it matters.

### The Five Queries

The query engine demonstrates operations **impossible with unstructured text**:

**1. why(nodeId) - Causal Ancestry**
Trace backward through causal relationships automatically. "Why does this exist?" becomes a computational query, not manual tracing.

**2. whatIf(nodeId) - Impact Analysis**
Calculate forward impact transitively. "What happens if I change this?" becomes automatic, not guesswork.

**3. tensions() - Tradeoff Mapping**
Extract all tensions systematically. "What tradeoffs exist?" becomes guaranteed complete, not best-effort search.

**4. blocked() - Blocker Tracking**
Find blocked nodes with dependency chains. "What's blocking critical work?" becomes automated lifecycle management.

**5. alternatives(questionId) - Decision Reconstruction**
Reconstruct decision rationale from graph structure. "Why did we choose this?" becomes recoverable after the fact.

### The Proof

These queries prove FlowScript is **computable substrate**, not just notation:

- ❌ Can't automatically trace causal chains in prose
- ❌ Can't calculate transitive impact without structure
- ❌ Can't guarantee you found all tradeoffs in text
- ❌ Can't compute dependency chains from descriptions
- ❌ Can't reconstruct decision rationale after the fact

✅ **FlowScript IR enables ALL of these operations computationally**

### Performance

All queries execute in **<1ms** on typical cognitive graphs (20-41 nodes, 6-25 relationships - measured). Fast enough for real-time use, even on modest hardware.

### Learn More

- **[TOOLCHAIN.md](TOOLCHAIN.md)** - Complete toolchain documentation
- **[QUERY_ENGINE.md](QUERY_ENGINE.md)** - Query engine guide with examples
- **[spec/](spec/)** - Formal specifications (grammar, IR schema, linter rules)
- **[examples/](examples/)** - Golden examples with IR pairs

---

## Evidence: Cross-Architecture Validation

Here's what convinced us FlowScript was real:

### Spontaneous Parsing & Recognition

**All 6 AI architectures parsed basic FlowScript *without being given the specification*.**

When shown FlowScript-structured content with no explanation, every architecture:
- Understood the notation immediately
- Identified it as a significant upgrade in communication
- Recognized the same benefit patterns (forcing function, thought topology, hybrid approach)
- Began using it naturally in responses

This is remarkable. These architectures have different training data, different attention mechanisms, different optimization targets. But they all recognized the same patterns.

**Only after spontaneous recognition did we provide the specification** - to ensure consistent grammar and shared understanding of edge case markers.

This suggests FlowScript taps **fundamental structures in language and reasoning**, not model-specific quirks or training artifacts.

### The 6 Architectures

1. **Claude (Anthropic)** - Original development environment
2. **ChatGPT (OpenAI)** - Full adoption from spec alone
3. **Gemini (Google)** - Independent insights on adoption barriers
4. **DeepSeek** - "Applied epistemology" framing
5. **Claude Code** - Spontaneous use without prompting
6. **Fresh Claude instances** - Zero prior context validation

**Key findings:**

### Convergent Insights

All architectures independently identified:
- **Forcing function value** - Structure catches incomplete thinking
- **Thought topology** - Relationships made explicit and computational
- **Hybrid approach** - Natural language + selective notation is optimal
- **Accessibility vs power** - Simple markers serve general users, full set serves power users

### Teachability Confirmed

Specification alone is sufficient for detailed adoption. No training data, no fine-tuning. Just the syntax reference and examples. All 6 architectures parsed correctly on first exposure and adopted comprehensive use after seeing the spec.

### Specific Framings Worth Noting

- **Gemini:** "Thought-object transmission" + "Debugging thinking" + "Looks like code" adoption barrier
- **DeepSeek:** "Applied epistemology" (making reasoning explicit)
- **Claude Code:** "Markdown for technical reasoning"
- **ChatGPT:** Spontaneous hybrid approach after seeing examples

### Why It Works Across Architectures

FlowScript isn't changing model behavior. It's **augmenting human input**.

You structure your prompts more clearly. The model parses better input. That's why it works everywhere - you're not relying on model-specific features. You're using structure that any language model can understand.

The spontaneous parsing proves this. If it were model-specific, different architectures wouldn't converge on the same understanding without training.

---

## Product Vision

FlowScript as notation is open and free (see [LICENSE](LICENSE)). We're exploring two product concepts built on this foundation:

### The Bridge (For Everyone)

**Concept:** Simple interface that generates expert-level prompts using FlowScript behind the scenes. Users get better AI results without learning notation.

### The Editor (For Power Users)

**Concept:** IDE-like environment with real-time visual preview. Power users write FlowScript directly, see structure as graphs, export in multiple formats.

### Status

Both are exploratory concepts, not commitments. FlowScript notation works today and is complete. These products are speculative applications we're validating with community feedback.

**→ See [PRODUCT_VISION.md](PRODUCT_VISION.md) for detailed exploration, reality checks, and how to engage.**

---

## Documentation & Resources

### Learning FlowScript

- **[FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md)** - Complete specification (21 markers)
- **[FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md)** - Beginner's guide (start here)
- **[FLOWSCRIPT_EXAMPLES.md](FLOWSCRIPT_EXAMPLES.md)** - Real-world usage examples

### Understanding the Architecture

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Cognitive patterns and meta-analysis from real use
- **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** - Implementation details for flow system

---

## Contributing & Community

FlowScript is in active development. Contributions welcome:

### Try It

Use FlowScript in your AI interactions. Start with 3 markers (`->`, `?`, `><`). Add more as needed. Report what works and what doesn't.

### Share Examples

Found a pattern that works well? Submit to [FLOWSCRIPT_EXAMPLES.md](FLOWSCRIPT_EXAMPLES.md) via pull request.

### Report Friction

Where does the notation slow you down? Where is it unclear? Open an issue. Evidence-based evolution requires real usage data.

### Propose Additions

Notice something missing? Propose new markers with:
- Use case (what are you trying to express?)
- Why existing markers don't work
- Evidence from actual use (not theoretical)

FlowScript evolves through **revealed preference**, not upfront design. What gets used survives. What creates friction gets pruned.

### Protocol Integration

Working on agent communication protocols? FlowScript's IR is a natural fit for structured semantic payloads. See [Protocol Research & Formal Toolchain](#protocol-research--formal-toolchain) for alignment with LDP, G2CP, and JamJet. If you're building adapters or exploring integration, open an issue or PR.

### Research Collaboration

Interested in the cognitive architecture implications? Convergent evolution of symbolic AI notation? Agent protocol design? The Third Mind hypothesis?

Open an issue tagged `research`. Let's explore together.

---

## Status & Roadmap

### Current: v1.0 Foundation (October 2025)

✅ **Core notation stable** - 21 markers, evidence-based
✅ **Cross-architecture validation** - 6 AI systems, spontaneous parsing confirmed
✅ **Lifecycle automation proven** - Working in production systems
✅ **Teachability confirmed** - Spec alone sufficient for adoption

### Next: Protocol Integration & Formal Benchmarks

🔬 **Compression benchmarks** — Formal measurements against MetaGlyph and SynthLang on equivalent documents
🔬 **LDP Mode 3 implementation** — FlowScript IR as the reference implementation for LDP's Semantic Graphs payload mode
🔬 **JamJet adapter** — ProtocolAdapter for FlowScript payloads in the JamJet agent runtime
🔬 **Third Mind research** — Extended case studies beyond single-user validation

### Active Research Questions

- How does FlowScript generalize as a protocol payload vs. a human authoring tool?
- What's the compression-to-semantic-fidelity curve across different content types?
- Can FlowScript IR bridge human-authored reasoning and agent-to-agent communication?
- Does the Third Mind phenomenon scale to multi-user, multi-agent systems?

FlowScript shipped October 9, 2025. The protocol landscape caught up in early 2026. The convergence is accelerating.

---

## Get Started

**Easiest path:**

1. Read [FLOWSCRIPT_LEARNING.md](FLOWSCRIPT_LEARNING.md) (10 minutes)
2. Try 3 markers in your next AI conversation (`->`, `?`, `><`)
3. Notice where structure helps vs where it slows you down
4. Add more markers as needed
5. Report back what you discovered

**That's it. No installation, no API, no accounts. Just notation.**

If it makes your AI interactions better, use it. If it doesn't, don't. Evidence-based evolution means real usage drives everything.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contact & Support

- **Issues:** [GitHub Issues](https://github.com/phillipclapham/flowscript/issues)
- **Discussions:** [GitHub Discussions](https://github.com/phillipclapham/flowscript/discussions)

---

**FlowScript v1.0 - October 2025**

*Evidence-based notation for collaborative cognition.*

*The missing notation layer for AI communication.*
