/**
 * FlowScript Learn / Concepts Page
 * Educational content: what is decision intelligence, how the graph works,
 * the five queries, temporal tiers, audit trail.
 */

import { Link } from "react-router-dom";
import "./Learn.css";

export function Learn() {
  return (
    <div className="page learn-page">
      <h1 className="learn-hero-title">Understanding FlowScript</h1>
      <p className="learn-hero-subtitle">
        Decision intelligence for AI agents: what it is, why it matters, and how the reasoning graph works.
      </p>

      {/* What is Decision Intelligence */}
      <section className="learn-section">
        <h2>What is decision intelligence?</h2>
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
        <h2>The five queries, explained</h2>
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
          that auto-wrap on exit. After 20 sessions, your memory is a curated knowledge base, not a pile of notes.
        </p>
      </section>

      {/* Audit Trail */}
      <section className="learn-section">
        <h2>Audit trail</h2>
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
          <li><strong>SIEM integration:</strong> <code>onEvent</code> callback for streaming audit events to external systems.</li>
        </ul>
        <p>
          You can't audit a deletion. You can query a tension. This is the structural argument for RELATE &gt; DELETE
          . FlowScript preserves the full reasoning record, not just the latest version.
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

        <h3>Using notation in prompts</h3>
        <p>
          Add FlowScript blocks to your system prompts or CLAUDE.md files to give your agent structured
          context it can reason over:
        </p>
        <div className="code-block">
{`# In CLAUDE.md or a system prompt:
# Project context — current state of the migration

? Which cache layer for the API gateway?
  || Cloudflare Workers KV
     -> global edge distribution
     -> [decided(rationale: "already on CF, zero cold start", on: "2026-03-15")]
  || Redis Cloud
     -> more control over eviction

[blocked(reason: "KV write limits in free tier", since: "2026-03-16")]
! rate limiting depends on cache layer

thought: edge caching makes regional failover unnecessary
  -> simplifies the architecture significantly
  -> ! but debugging edge issues is harder than centralized`}
        </div>
        <p>
          Your agent reads this as structured reasoning, not just text. It understands what's decided,
          what's blocked, and what tradeoffs exist, without you explaining any of it in prose.
          The{" "}
          <Link to="/playground">playground</Link> lets you experiment with the notation
          interactively and see the reasoning graph it produces.
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
