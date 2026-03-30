/**
 * FlowScript Learn / Concepts Page
 * Educational content: what is typed reasoning, how the graph works,
 * the six queries, temporal tiers, audit trail, advanced patterns,
 * metaprogramming, and the deeper structure.
 */

import { Link } from "react-router-dom";
import "./Learn.css";

export function Learn() {
  return (
    <div className="page learn-page">
      <h1 className="learn-hero-title">Understanding FlowScript</h1>
      <p className="learn-hero-subtitle">
        The typed reasoning layer for AI agents: what it is, why it matters, how the reasoning graph works,
        and what becomes possible when you push the notation to its limits.
      </p>

      {/* What is Typed Reasoning */}
      <section className="learn-section">
        <h2>What is typed reasoning?</h2>
        <p>
          Most agent memory systems store <em>what was said</em>. FlowScript stores <em>why things were decided,
          what they conflicted with, and what they unblock</em>.
        </p>
        <p>
          The difference is structural. A vector store gives you "find things similar to X." FlowScript gives you
          "trace the causal chain that led to X, find everything that breaks if X changes, and show me
          every unresolved tradeoff." These are fundamentally different classes of operation. One searches
          content, the other traverses reasoning.
        </p>
        <div className="concept-diagram">
          <div className="concept-box concept-box--muted">
            <h4>Traditional agent memory</h4>
            <p>Text in &rarr; embeddings &rarr; similarity search</p>
            <p className="concept-question">"Find similar things" &#x2714;</p>
            <p className="concept-question concept-question--no">"Why did we decide that?" &#x2718;</p>
            <p className="concept-question concept-question--no">"What's blocking us?" &#x2718;</p>
          </div>
          <div className="concept-arrow">&rarr;</div>
          <div className="concept-box concept-box--primary">
            <h4>FlowScript</h4>
            <p>Typed nodes + typed relationships &rarr; graph traversal</p>
            <p className="concept-question">why() &mdash; causal chain &#x2714;</p>
            <p className="concept-question">blocked() &mdash; downstream impact &#x2714;</p>
            <p className="concept-question">tensions() &mdash; named tradeoffs &#x2714;</p>
          </div>
        </div>
      </section>

      {/* The Reasoning Graph */}
      <section className="learn-section">
        <h2>The reasoning graph</h2>
        <p>
          When your agent works through a problem, FlowScript builds a typed graph of its reasoning.
          Nodes have types (question, thought, decision, action). Relationships have types (causes, blocks,
          tensions, alternatives). This isn't free-form text. It's structured knowledge that supports
          computation.
        </p>
        <div className="node-types-grid">
          <div className="node-type">
            <span className="node-marker node-marker--question">?</span>
            <div>
              <strong>Question</strong>
              <p>A decision point with alternatives</p>
            </div>
          </div>
          <div className="node-type">
            <span className="node-marker node-marker--thought">thought:</span>
            <div>
              <strong>Thought</strong>
              <p>An observation or insight</p>
            </div>
          </div>
          <div className="node-type">
            <span className="node-marker node-marker--decided">[decided]</span>
            <div>
              <strong>Decision</strong>
              <p>A committed choice with rationale</p>
            </div>
          </div>
          <div className="node-type">
            <span className="node-marker node-marker--blocked">[blocked]</span>
            <div>
              <strong>Blocker</strong>
              <p>Something stuck with a reason and timestamp</p>
            </div>
          </div>
          <div className="node-type">
            <span className="node-marker node-marker--tension">{'><'}</span>
            <div>
              <strong>Tension</strong>
              <p>A tradeoff with a named axis</p>
            </div>
          </div>
          <div className="node-type">
            <span className="node-marker node-marker--causal">{'->'}</span>
            <div>
              <strong>Causal link</strong>
              <p>This leads to that (queryable chain)</p>
            </div>
          </div>
        </div>
        <p>
          The full notation has 21 markers. See the{" "}
          <a href="https://github.com/phillipclapham/flowscript/blob/main/FLOWSCRIPT_SYNTAX.md" target="_blank" rel="noopener noreferrer">
            syntax reference
          </a>{" "}
          for the complete specification. But you don't need to learn the notation to use FlowScript.
          The SDK builds the graph through a typed API, and the{" "}
          <a href="https://github.com/phillipclapham/flowscript-agents" target="_blank" rel="noopener noreferrer">
            Python SDK
          </a>{" "}
          auto-extracts typed nodes from plain conversation text.
        </p>
      </section>

      {/* The Five Queries — Deep Dive */}
      <section className="learn-section">
        <h2>The six queries, explained</h2>
        <p>
          These are graph traversal operations, not text search. They follow typed relationships through the
          reasoning graph and return structured results.
        </p>

        <div className="query-deep-dive">
          <div className="query-explain">
            <h3><code>tensions()</code> &mdash; Find tradeoffs</h3>
            <p>
              Returns every <code>{'><'}</code> relationship in the graph, grouped by named axis. A tension
              is two things that are both true but pull in opposite directions. "Performance vs cost,"
              "simplicity vs flexibility." Unlike most memory systems that delete contradictions, FlowScript
              preserves them as queryable structure.
            </p>
            <div className="code-block">
<span className="cm">// What tradeoffs exist in our reasoning?</span>{"\n"}
mem.query.tensions();{"\n"}
<span className="cm">{"// → { tensions_by_axis: {"}</span>{"\n"}
<span className="cm">{"//     \"performance vs cost\": [{ source, target }],"}</span>{"\n"}
<span className="cm">{"//     \"simplicity vs flexibility\": [{ source, target }]"}</span>{"\n"}
<span className="cm">{"//   } }"}</span>
            </div>
          </div>

          <div className="query-explain">
            <h3><code>blocked()</code> &mdash; What's stuck</h3>
            <p>
              Finds every <code>[blocked]</code> state in the graph, including the reason, the timestamp,
              and everything downstream that's waiting. This is impact analysis, not just "what's blocked"
              but "what is this blocker preventing from happening."
            </p>
            <div className="code-block">
<span className="cm">// What's stuck and what's waiting on it?</span>{"\n"}
mem.query.blocked();{"\n"}
<span className="cm">{"// → { blockers: [{"}</span>{"\n"}
<span className="cm">{"//     node, blocked_state: { reason, since },"}</span>{"\n"}
<span className="cm">{"//     downstream: [affected nodes...]"}</span>{"\n"}
<span className="cm">{"//   }] }"}</span>
            </div>
          </div>

          <div className="query-explain">
            <h3><code>why(nodeId)</code> &mdash; Causal chain</h3>
            <p>
              Traces <code>{'->'}</code> chains backward from any node to find its root causes. This is
              decision provenance. "Why did we end up here?" answered with a typed causal chain, not
              a keyword search through chat logs.
            </p>
            <div className="code-block">
<span className="cm">// Why did we decide to use Redis?</span>{"\n"}
mem.query.why(redisDecision);{"\n"}
<span className="cm">{"// → { causal_chain: [root → cause → ... → decision],"}</span>{"\n"}
<span className="cm">{"//     root_cause: \"sessions are ephemeral\" }"}</span>
            </div>
          </div>

          <div className="query-explain">
            <h3><code>whatIf(nodeId)</code> &mdash; Impact analysis</h3>
            <p>
              Traces <code>{'->'}</code> chains forward. "If this changes, what breaks downstream?"
              Direct consequences, indirect consequences, the full ripple effect through the reasoning graph.
            </p>
            <div className="code-block">
<span className="cm">// What breaks if we change the database choice?</span>{"\n"}
mem.query.whatIf(databaseDecision);{"\n"}
<span className="cm">{"// → { impact_tree: {"}</span>{"\n"}
<span className="cm">{"//     direct: [connection pooling, auth service],"}</span>{"\n"}
<span className="cm">{"//     indirect: [login flow, beta launch]"}</span>{"\n"}
<span className="cm">{"//   } }"}</span>
            </div>
          </div>

          <div className="query-explain">
            <h3><code>alternatives(questionId)</code> &mdash; Decision archaeology</h3>
            <p>
              For any question node, returns every alternative that was considered: what was decided,
              what was blocked, what was deferred, and the rationale for each. The full decision record.
            </p>
            <div className="code-block">
<span className="cm">// What options did we consider for the database?</span>{"\n"}
mem.query.alternatives(dbQuestion);{"\n"}
<span className="cm">{"// → { alternatives: ["}</span>{"\n"}
<span className="cm">{"//     { content: \"Redis\", chosen: true, rationale: \"speed critical\" },"}</span>{"\n"}
<span className="cm">{"//     { content: \"SQLite\", blocked: true, reason: \"no concurrent writes\" },"}</span>{"\n"}
<span className="cm">{"//     { content: \"PostgreSQL\", state: \"considered\" }"}</span>{"\n"}
<span className="cm">{"//   ] }"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Temporal Tiers */}
      <section className="learn-section">
        <h2>Memory that evolves</h2>
        <p>
          Nodes graduate through four temporal tiers based on actual use. Knowledge that keeps getting
          queried earns permanence. One-off observations fade. After 20 sessions, your memory is a curated
          knowledge base, not a pile of notes.
        </p>
        <div className="tier-list">
          <div className="tier tier--current">
            <div className="tier-label">current</div>
            <div className="tier-desc">
              <strong>Recent observations</strong> &mdash; may be pruned if not reinforced
            </div>
          </div>
          <div className="tier tier--developing">
            <div className="tier-label">developing</div>
            <div className="tier-desc">
              <strong>Emerging patterns</strong> &mdash; touched 2+ times, building confidence
            </div>
          </div>
          <div className="tier tier--proven">
            <div className="tier-label">proven</div>
            <div className="tier-desc">
              <strong>Validated through use</strong> &mdash; 3+ touches, protected from pruning
            </div>
          </div>
          <div className="tier tier--foundation">
            <div className="tier-label">foundation</div>
            <div className="tier-desc">
              <strong>Core truths</strong> &mdash; always preserved, never pruned
            </div>
          </div>
        </div>
        <p>
          Dormant nodes are pruned to the append-only audit trail, archived with full provenance, never
          destroyed. Four budget strategies (<code>tier-priority</code>, <code>recency</code>,{" "}
          <code>frequency</code>, <code>relevance</code>) control what surfaces when token budget is limited.
        </p>

        <h3>Session wraps: sleep for the reasoning graph</h3>
        <p>
          Just like a mind needs sleep to consolidate memories, the reasoning graph needs regular session
          wraps to develop intelligence over time. Without consolidation cycles, knowledge accumulates
          as noise instead of maturing through the temporal tiers above.
        </p>
        <p>
          A session wrap prunes dormant nodes to the audit trail, saves the graph, and triggers the
          graduation cycle. Three mechanisms ensure consolidation happens:
        </p>
        <ul className="audit-features">
          <li><strong>Explicit wrap:</strong> The LLM calls <code>session_wrap</code> when you say
            "let's wrap up" (best results — allows final reasoning capture before consolidation).</li>
          <li><strong>Auto-wrap:</strong> The Python MCP server auto-consolidates after 5 minutes of
            inactivity (configurable via <code>FLOWSCRIPT_AUTO_WRAP_MINUTES</code>, set to <code>0</code> to disable).</li>
          <li><strong>Process exit:</strong> Final consolidation runs automatically when the server shuts down.</li>
        </ul>
        <p>
          For SDK users, all adapters support <code>close()</code> and context managers (<code>with</code> blocks)
          that auto-wrap on exit.
        </p>
      </section>

      {/* Audit Trail & Compliance */}
      <section className="learn-section">
        <h2>Audit trail &amp; compliance</h2>
        <p>
          Every mutation to the reasoning graph is recorded in a SHA-256 hash-chained, append-only audit trail.
          Each entry links to the previous via cryptographic hash. Tampering with history breaks the chain.
        </p>
        <ul className="audit-features">
          <li><strong>Hash-chained:</strong> SHA-256 linked entries. <code>Memory.verifyAudit()</code> checks the full chain.</li>
          <li><strong>Crash-safe:</strong> fsync per write. Worst case on crash = duplicate entry (harmless for append-only).</li>
          <li><strong>Framework attribution:</strong> Every entry tagged with which adapter (LangGraph, CrewAI, etc.) made the change.</li>
          <li><strong>Cross-language:</strong> Same canonical JSON serialization in TypeScript and Python. Chains verify across languages.</li>
          <li><strong>Configurable retention:</strong> Default 7 years (SOX). Monthly rotation with gzip compression.</li>
          <li><strong>SIEM integration:</strong> <code>onEvent</code> / <code>on_event_async</code> callbacks stream audit events to external systems. Async mode uses a background thread so slow webhooks never block agent operations.</li>
        </ul>

        <h3>EU AI Act &mdash; Article 86 (Right to Explanation)</h3>
        <p>
          The Python SDK includes <code>explain()</code> &mdash; a deterministic, no-LLM function that converts{" "}
          <code>why()</code> results into formal compliance documents. Three audience modes: plain English for
          affected individuals, formal compliance language for regulatory submissions (with Article 86 citation
          and hash-chain verification reference), and structured output for developers. Same input always produces
          the same output. Also available as the <code>explain_decision</code> MCP tool.
        </p>
        <p>
          Enforcement begins August 2026. Audit trails can't be backdated. Organizations using FlowScript today
          have unbroken reasoning records from day one.
        </p>

        <p>
          You can't audit a deletion. You can query a tension. This is the structural argument for RELATE &gt; DELETE.
          FlowScript preserves the full reasoning record, not just the latest version.
        </p>
      </section>

      {/* Description Integrity */}
      <section className="learn-section">
        <h2>Description integrity</h2>
        <p>
          MCP tool descriptions are prompts. Your LLM reads them to decide what each tool does.
          If a malicious dependency, middleware, or monkey-patch mutates those descriptions in-process,
          the LLM silently follows poisoned instructions. Nobody in the MCP ecosystem addresses this.
        </p>
        <p>
          FlowScript's MCP servers include a three-layer integrity verification system — a reference
          implementation of{" "}
          <a href="https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/2402" target="_blank" rel="noopener noreferrer">
            deterministic description integrity for MCP
          </a>:
        </p>
        <ul className="audit-features">
          <li>
            <strong>Layer 1 — In-process verification:</strong> All tool definitions are deep-frozen at
            startup (immutable). SHA-256 hashes computed per tool. The <code>verify_integrity</code> tool
            lets the LLM check that nothing has been mutated since startup.
          </li>
          <li>
            <strong>Layer 2 — Host-verifiable manifest:</strong> The{" "}
            <code>flowscript://integrity/manifest</code> MCP Resource exposes hashes so the <em>host
            application</em> (Claude Code, Cursor) can verify descriptions without LLM involvement — moving
            the security boundary to the correct architectural layer.
          </li>
          <li>
            <strong>Layer 3 — Build-time root of trust:</strong> <code>tool-integrity.json</code> is
            generated at build time (<code>--generate-manifest</code>) and ships in the package. Provides
            a hash baseline independent of the running process.
          </li>
        </ul>
        <p>
          Think of it as SRI (Subresource Integrity) for LLM tool descriptions. Both the TypeScript
          and Python MCP servers implement this architecture with honest threat models — documenting
          exactly what it detects and what requires ecosystem-level changes.
        </p>
      </section>

      {/* The Consolidation Engine (Python SDK) */}
      <section className="learn-section">
        <h2>The consolidation engine</h2>
        <p>
          The Python SDK (<code>flowscript-agents</code>) includes a consolidation engine that automatically manages
          memory quality. When new information arrives, it doesn't just store it. It compares against existing
          knowledge and takes one of five actions:
        </p>
        <div className="consolidation-actions">
          <div className="action-item">
            <code className="action-code action-code--add">ADD</code>
            <span>Novel information. Store as a new node.</span>
          </div>
          <div className="action-item">
            <code className="action-code action-code--update">UPDATE</code>
            <span>Enriches existing knowledge. Merge into existing node.</span>
          </div>
          <div className="action-item">
            <code className="action-code action-code--relate">RELATE</code>
            <span>Contradicts existing knowledge. Create a queryable <em>tension</em> with a named axis.</span>
          </div>
          <div className="action-item">
            <code className="action-code action-code--resolve">RESOLVE</code>
            <span>Resolves a previously blocked item. Unblock and record resolution.</span>
          </div>
          <div className="action-item">
            <code className="action-code action-code--none">NONE</code>
            <span>Duplicate of existing knowledge. Skip.</span>
          </div>
        </div>
        <p>
          The key insight: <strong>RELATE instead of DELETE</strong>. When new information contradicts old,
          most systems silently overwrite. FlowScript creates a tension. Both sides preserved,
          the axis of disagreement named, the tradeoff queryable. The disagreement itself is knowledge.
        </p>
      </section>

      {/* @fix — Stratified Fixpoint Computation */}
      <section className="learn-section">
        <h2>@fix &mdash; Stratified fixpoint computation</h2>
        <p>
          FlowScript includes <code>@fix</code>, a formal fixpoint operator over typed reasoning graphs.
          When an agent needs to reason iteratively &mdash; resolving contradictions, propagating beliefs,
          converging on decisions &mdash; <code>@fix</code> provides three computational levels with
          guaranteed termination properties.
        </p>

        <div className="tier-list">
          <div className="tier tier--current">
            <div className="tier-label">L0</div>
            <div className="tier-desc">
              <strong>Pure description</strong> &mdash; no <code>@fix</code>. Static knowledge, observations. Always terminates.
            </div>
          </div>
          <div className="tier tier--developing">
            <div className="tier-label">L1</div>
            <div className="tier-desc">
              <strong>Bounded fixpoint</strong> &mdash; closed domain, inflationary. Always terminates (Knaster-Tarski). Consistency enforcement, belief propagation.
            </div>
          </div>
          <div className="tier tier--proven">
            <div className="tier-label">L2</div>
            <div className="tier-desc">
              <strong>General fixpoint</strong> &mdash; Turing-complete, bounded. Abductive reasoning, hypothesis generation.
            </div>
          </div>
        </div>

        <p>
          L1 can contain bounded L2 sub-computations &mdash; constraint escalates, never de-escalates.
          This is a <em>computational metamaterial</em>: tunable constraint radius within a single
          reasoning structure. The consolidation engine is a degenerate L1 fixpoint (single iteration).
        </p>

        <h3>Convergence certificates</h3>
        <p>
          When consolidation resolves contradictions, FlowScript produces a <strong>convergence
          certificate</strong> &mdash; a hash-chained attestation: <code>initial_graph_hash</code> &rarr;{" "}
          <code>delta_sequence</code> &rarr; <code>final_graph_hash</code> &rarr; <code>certificate_hash</code>.
          This is concrete Article 86 compliance infrastructure. An auditor can verify not just <em>what</em>{" "}
          your agent decided, but <em>how it got there</em> &mdash; and prove the record hasn't been altered.
        </p>
        <p>
          Every other agent memory system treats contradiction resolution as a black box. FlowScript
          makes the resolution process itself auditable.
        </p>
        <p>
          Formal grounding: Datalog stratification (Abiteboul-Hull-Vianu 1995), Knaster-Tarski
          fixed-point theory, and OWL's three-layer decidability model (Baader et al. 2003). Full spec:{" "}
          <a href="https://github.com/phillipclapham/flowscript/blob/main/spec/fixpoint_spec.md" target="_blank" rel="noopener noreferrer">
            fixpoint_spec.md
          </a>.
        </p>
      </section>

      {/* FlowScript Cloud */}
      <section className="learn-section">
        <h2>FlowScript Cloud &mdash; Independent witnessing</h2>
        <p>
          Local audit trails are tamper-evident but self-attested. <a href="https://api.flowscript.org" target="_blank" rel="noopener noreferrer">FlowScript Cloud</a>{" "}
          adds independent third-party witnessing: your SDK streams hash-chained events to the Cloud
          service, which verifies chain continuity and stores witness attestations. A compliance officer
          can't get this from your own database &mdash; independent verification requires an independent party.
        </p>
        <div className="code-block">
{`# One environment variable. That's it.
export FLOWSCRIPT_API_KEY=your-key

# In your Python code:
from flowscript_agents.cloud import CloudClient

cloud = CloudClient()  # reads FLOWSCRIPT_API_KEY from env
mem = Memory.load_or_create("agent.json", options=MemoryOptions(
    audit=AuditConfig(on_event=cloud.queue_event)
))
# Every audit event streams to api.flowscript.org automatically`}
        </div>
        <ul className="audit-features">
          <li><strong>Chain verification on ingestion:</strong> Cloud verifies hash chain continuity. Breaks trigger immediate alerts.</li>
          <li><strong>Witness attestations:</strong> Independent proof your chain was intact at time T.</li>
          <li><strong>Batch buffering:</strong> Events accumulate and flush in batches. Lock-free I/O &mdash; network never blocks your agent.</li>
          <li><strong>Three deployment tiers:</strong> SaaS at api.flowscript.org, self-hosted Cloudflare, or Docker on-premise. One codebase.</li>
          <li><strong>Source-available:</strong> BSL 1.1 (converts to Apache 2.0 after 4 years). <a href="https://github.com/phillipclapham/flowscript-cloud" target="_blank" rel="noopener noreferrer">Full source on GitHub</a>.</li>
        </ul>
      </section>

      {/* FlowScript as Notation */}
      <section className="learn-section">
        <h2>FlowScript as a notation</h2>
        <p>
          You don't need the SDK to use FlowScript. The 21-marker notation works anywhere you write
          structured text: in prompts, CLAUDE.md files, system instructions, design docs, or
          just thinking through a problem on paper.
        </p>
        <p>
          LLMs parse FlowScript natively. No fine-tuning, no special configuration. The syntax maps
          directly to reasoning structures that language models already understand: causal chains
          (<code>{'->'}</code>), tradeoffs (<code>{'><'}</code>), questions with alternatives
          (<code>?</code> / <code>||</code>), decisions (<code>[decided]</code>), blockers
          (<code>[blocked]</code>).
        </p>

        <h3>A forcing function for clear thinking</h3>
        <p>
          The deeper value of the notation is what happens when you use it. Encoding reasoning in
          FlowScript forces you to make relationships explicit that prose leaves ambiguous. Does
          this <em>cause</em> that, or just come after it? Is this a decision or still a question?
          Are these two things in tension, or just different?
        </p>
        <p>
          Prose lets you hide ambiguity. FlowScript doesn't. Every relationship has a type.
          Every state has a marker. The act of encoding is itself an act of analysis. You
          discover structure that verbosity obscures.
        </p>
        <div className="code-block">
{`# Before: prose hides the structure
"We considered Redis and PostgreSQL for sessions. Redis is faster
but more expensive. We went with Redis because speed matters more
than cost for this use case, but we're blocked on cluster setup."

# After: FlowScript makes relationships explicit
? Which database for sessions?
  || Redis
     -> sub-ms reads
     -> [decided(rationale: "speed > cost for ephemeral data", on: "2026-03-10")]
  || PostgreSQL
     -> mature tooling, team knows it

speed ><[performance vs cost] infrastructure cost
  -> Redis cluster = $200/mo vs PostgreSQL = $15/mo

[blocked(reason: "Redis cluster not provisioned", since: "2026-03-11")]
! auth service depends on session store
  -> blocks login flow rollout`}
        </div>
        <p>
          The FlowScript version isn't just shorter (~3:1 compression vs prose). It's <em>computable</em>.
          You can query it: what's blocked? What tradeoffs exist? Why did we choose Redis? The notation
          is the engine that makes the queries possible.
        </p>
      </section>

      {/* Advanced Patterns */}
      <section className="learn-section">
        <h2>Advanced patterns</h2>
        <p>
          These patterns weren't designed up front. They were discovered through extended use as the
          notation's compositional structure revealed new capabilities. Every pattern emerges from
          composing existing markers — no new syntax required.
        </p>

        <h3>Recursive nesting: multi-dimensional thinking space</h3>
        <p>
          FlowScript's most powerful capability is recursive nesting. Complex thinking isn't atomic —
          it's recursive, self-referential, multi-layered. Nesting creates explicit thought hierarchy,
          context at multiple depths, sidebar commentary without breaking flow, and meta-observations
          about observations.
        </p>
        <div className="code-block">
{`{
  decision: ship minimal version now
  -> faster launch
  -> {earlier user feedback
       -> {course corrections sooner
            -> {better product-market fit
                 -> higher likelihood of success
               }
          }
     }
  -> [decided] minimal version wins
}

# First-order through fourth-order effects,
# all structurally visible and queryable.`}
        </div>

        <h3>Meta-thoughts: reasoning about reasoning</h3>
        <p>
          Nesting enables recursive self-reference — thoughts about thoughts, analysis of analysis.
          This creates a structure impossible in linear prose: a thought that examines its own
          reasoning process while reasoning.
        </p>
        <div className="code-block">
{`thought: {
  analyzing our adoption pattern
  <- {
       observation: all 6 AI systems converged on same insights
       <- {meta: convergence itself is evidence
            <- {meta-meta: our confidence comes from this convergence
                 <- which is itself a pattern we're converging on
               }
          }
     }
  -> cross-architecture validation = strong evidence
  -> {
       but: we're biased observers
       <- {we created FlowScript
            <- our analysis might be self-confirming
            <- need external validation
          }
     }
}

# Captures both the observation AND the critical
# examination of the observation. The bias check
# is structurally embedded, not an afterthought.`}
        </div>

        <h3>Multi-dimensional analysis</h3>
        <p>
          When a decision has technical, business, and personal dimensions, FlowScript keeps them
          isolated for independent analysis, then synthesizes across dimensions with explicit tensions.
        </p>
        <div className="code-block">
{`{
  decision: when to launch?

  -> {technical:
       <- {86% complete <- hardest 14% remaining}
       -> need 2-4 more weeks minimum
     }

  -> {business:
       <- {competitive pressure <- market timing: AI tools hot now}
       -> pressure to launch sooner
     }

  -> {personal:
       <- {burnout: severe <- energy: limited, unreliable}
       -> can't sustain current pace
     }

  -> synthesis: {
       technical ><[quality vs speed] business
       business ><[pressure vs capacity] personal
       -> all three must align
       -> [decided] launch when technical ready AND personal sustainable
       != calendar-driven launch
     }
}`}
        </div>

        <h3>Evidence chains with confidence markers</h3>
        <p>
          Track evidence and confidence at each step using FlowScript's emphasis markers.
          Build arguments where certainty is explicit, not assumed.
        </p>
        <div className="code-block">
{`* thought: {
  FlowScript enables dimensional expansion of thinking

  <- {evidence: threshold effect observed
       <- {* observation: voluntary continued use despite friction
            <- experienced user, after 4 days intensive use
          }
       <- {* observation: thinking IN FlowScript, not translating
            <- self-reported cognitive shift
          }
       <- {~ observation: structures impossible in pure NL emerge
            <- hard to quantify <- need external validation
          }
       -> * conclusion: threshold crossed (n=1)
     }

  -> * finding: effect is real for at least one user
  -> ~ hypothesis: might generalize broadly
  -> ! action: need more data before claiming universality
}

# * = high confidence, ~ = low confidence, ! = urgent
# Certainty is tracked structurally, not assumed.`}
        </div>
      </section>

      {/* Metaprogramming */}
      <section className="learn-section">
        <h2>Metaprogramming patterns</h2>
        <p>
          FlowScript enables executable conversation protocols — patterns that go beyond
          notation into something closer to programming. These emerge from composing existing
          markers without adding new syntax.
        </p>

        <h3>Branching decisions</h3>
        <p>
          Conditional logic using composition of <code>?</code>, <code>{'{ }'}</code>, <code>=</code>,
          and <code>||</code> markers:
        </p>
        <div className="code-block">
{`? convert remaining system files to FlowScript?
  || yes = action: execute conversion + test
  || no = action: discuss why we shouldn't

[decided(rationale: "systematic conversion improves continuity")]
yes -> proceed with conversion

# Branching logic with rationale — no new syntax needed.
# The decision is queryable: alternatives() returns both paths.`}
        </div>

        <h3>Workflow definitions</h3>
        <p>
          Multi-step processes using temporal chains (<code>=&gt;</code>) with explicit
          inputs and outputs at each step:
        </p>
        <div className="code-block">
{`{spec sync verification}
=> {add new content sections <- verified against source}
=> {update GitHub + flow files}
=> {test fresh load -> validates OR reveals drift}
=> {validate OR revert}

# Each step's output feeds the next step's input.
# The full workflow is a queryable graph —
# whatIf() on any step shows downstream impact.`}
        </div>

        <h3>State machines</h3>
        <p>
          Track progression through lifecycle states using state markers.
          The full state history is captured in the audit trail.
        </p>
        <div className="code-block">
{`[exploring] initial investigation
-> evidence gathered
-> [decided(rationale: "data supports direction")] commit to direction
-> [blocked(reason: "waiting on API keys", since: "2026-03-22")] stalled
-> API keys arrived
-> ✓ execution complete

# Every state transition is a typed, auditable event.
# blocked() finds current blockers. why() traces how we got here.`}
        </div>

        <h3>Compression through hierarchy</h3>
        <p>
          Complex information compressed via nesting — same information, ~75% reduction,
          structure explicit and queryable:
        </p>
        <div className="code-block">
{`# Before (verbose prose):
"We discussed whether to buy the flowscript.org domain. The cost
would be about $12 per year which is minimal. However, it signals
premature commitment before we've validated the idea publicly. We
could register it later if traction. For now, we decided to hold
off until after we share publicly and see if anyone cares."

# After (FlowScript — 75% smaller, queryable):
{
  ? flowscript.org domain
  <- {$12/year minimal cost
       >< premature commitment signal
     }
  -> [decided] hold off until public validation
  <- {can register later <- if traction
       no risk of losing it now
     }
}`}
        </div>
      </section>

      {/* The Deeper Structure */}
      <section className="learn-section">
        <h2>The deeper structure</h2>
        <p>
          Everything above describes what FlowScript <em>does</em>. This section is about
          what it <em>is</em>, and why that matters beyond any single application.
        </p>

        <h3>Notation expands the space of possible thought</h3>
        <p>
          Musical notation didn't record what musicians were already playing. Before staff notation,
          European music was monophonic — single melodies, loosely coordinated. Notation made polyphony
          possible. Bach's fugues are literally unthinkable without it — not "hard to remember" but
          impossible to <em>compose</em>, because the simultaneous interaction of independent voices
          requires a representational system precise enough to reason about counterpoint.
        </p>
        <p>
          FlowScript does the same thing for AI cognition. It doesn't record what agents are already
          thinking. It makes a new category of reasoning possible — the kind where you can have multiple
          reasoning chains interacting, query across causal paths, and turn contradictions into structured
          tensions instead of silent overwrites. This category of reasoning is impossible in the
          vector-search paradigm because vector search has no representation for <em>why</em>.
        </p>

        <h3>Types make malformed reasoning unrepresentable</h3>
        <p>
          Every decision in a FlowScript graph traces to a question through alternatives. Every
          contradiction becomes a typed tension with a named axis. Every state change gets an audited
          reason. These constraints give FlowScript a property familiar from type theory: <strong>well-typedness
          implies safety.</strong> A well-formed graph can always be queried — no stuck states, no
          silent contradictions, no untraceable decisions. The type system makes certain classes of
          malformed reasoning structurally unrepresentable.
        </p>

        <h3>Compression reveals structure that verbosity hides</h3>
        <p>
          When you force reasoning through typed encoding, you force the extraction of structure that
          would otherwise remain implicit in natural language. This maps to a deep result in information
          theory: the minimum description of a dataset <em>is</em> its structure. Optimal compression
          and genuine understanding are the same operation.
        </p>
        <p>
          FlowScript's temporal tiers implement this: each consolidation cycle distills signal from
          noise, and the resulting structure is more useful than the verbose original. After enough
          cycles, what remains is a compressed knowledge base where the <em>shape</em> of the
          reasoning is the value, not the raw content.
        </p>

        <h3>The metacognitive loop</h3>
        <p>
          When an AI agent writes FlowScript, queries its own reasoning graph, discovers tensions
          or gaps, and generates new reasoning informed by that structure — it's not just remembering.
          It's reasoning about its own reasoning through a typed, queryable substrate. This is
          metacognition, and it's the category of thought that FlowScript makes possible that no
          vector store can touch.
        </p>

        <h3>Deletion is irrational</h3>
        <p>
          <a href="https://arxiv.org/abs/2603.17244" target="_blank" rel="noopener noreferrer">Recent work in formal epistemology</a>{" "}
          applied AGM belief revision postulates — the mathematical framework for rational belief
          change — and proved that deletion violates core rationality requirements. When you delete
          a contradicted memory, you destroy information that the formal framework says a rational
          agent must preserve. FlowScript's RELATE &gt; DELETE approach satisfies these postulates.
          The formal result says deletion is irrational. FlowScript is the implementation that takes
          that seriously.
        </p>

        <h3>Infrastructure, not a tool</h3>
        <p>
          SQL gave us queryable data. TCP/IP gave us addressable communication. Git gave us
          trackable changes. FlowScript gives AI agents queryable reasoning. Everything
          else — compliance, security, memory, observability — is an application of
          that infrastructure.
        </p>
        <p style={{ fontWeight: 600 }}>
          The applications are what you install FlowScript for. The infrastructure is why it matters.
        </p>
      </section>

      {/* Next Steps */}
      <section className="learn-section learn-cta">
        <h2>Ready to try it?</h2>
        <div className="hero-actions">
          <Link to="/get-started" className="btn btn-primary">Get Started</Link>
          <Link to="/playground" className="btn btn-secondary">Try the Playground</Link>
        </div>
      </section>
    </div>
  );
}
