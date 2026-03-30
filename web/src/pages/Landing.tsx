/**
 * FlowScript Landing Page
 * The first thing visitors see — hero, value prop, demo, install, frameworks.
 */

import { Link } from "react-router-dom";
import { FrameworkLogos } from "../components/FrameworkLogos";
import "./Landing.css";

export function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Your AI agents make decisions they can't explain.<br />
            <span className="hero-highlight">FlowScript makes those decisions queryable.</span>
          </h1>
          <p className="hero-subtitle">
            Vector stores remember what. FlowScript remembers why.
            Six reasoning queries no vector store can answer: <code>why()</code>, <code>tensions()</code>, <code>blocked()</code>, <code>alternatives()</code>, <code>whatIf()</code>, <code>counterfactual()</code>.
            Hash-chained audit trail. Nine framework adapters. MIT licensed.
          </p>
          <div className="hero-actions">
            <Link to="/get-started" className="btn btn-primary">Get Started</Link>
            <Link to="/playground" className="btn btn-secondary">Try the Playground</Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">The problem with agent memory</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">&#x1F50D;</div>
              <h3>Vector stores find similar text</h3>
              <p>But they can't tell you <em>why</em> a decision was made, what it conflicted with, or what it unblocks downstream.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">&#x1F5D1;</div>
              <h3>Contradictions get deleted</h3>
              <p>When new information conflicts with old, most memory systems silently overwrite. The disagreement, which is often the most valuable context, is lost forever.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">&#x1F4A8;</div>
              <h3>No reasoning provenance</h3>
              <p>After 20 sessions, you have a pile of facts with no structure. No causal chains. No way to ask "what led to this?" or "what breaks if this changes?"</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Missing Layer */}
      <section className="section section--accent">
        <div className="section-inner accent-inner">
          <h2 className="section-title">The typed reasoning layer</h2>
          <p className="section-lead accent-lead">
            Every agent framework gives AI agents memory. None make that memory <em>queryable</em>.
          </p>
          <p className="accent-subtext">
            FlowScript sits above your memory store, not instead of it. It's the layer between what your agent does and why.
          </p>
        </div>
      </section>

      {/* The Queries — the product */}
      <section className="section section--alt">
        <div className="section-inner">
          <h2 className="section-title">Six queries no vector store can answer</h2>
          <p className="section-lead">
            FlowScript builds a typed reasoning graph during normal agent work. You query it with structured operations that traverse relationships, not embeddings.
          </p>
          <div className="query-grid">
            <div className="query-card">
              <code className="query-name">tensions()</code>
              <p>Find tradeoffs with named axes. "Performance vs cost", "simplicity vs flexibility". Preserved as queryable structure, not buried in chat logs.</p>
            </div>
            <div className="query-card">
              <code className="query-name">blocked()</code>
              <p>What's stuck, why, and everything downstream that's waiting. Trace the full impact of any blocker through the reasoning graph.</p>
            </div>
            <div className="query-card">
              <code className="query-name">why(nodeId)</code>
              <p>Trace the causal chain backward from any decision to its root cause. The provenance trail your compliance team will thank you for.</p>
            </div>
            <div className="query-card">
              <code className="query-name">whatIf(nodeId)</code>
              <p>What breaks if this changes? Trace causal chains forward to see direct and indirect consequences before you act.</p>
            </div>
            <div className="query-card">
              <code className="query-name">alternatives(questionId)</code>
              <p>What options were considered? What was decided, what was blocked, and the rationale for each. Decision archaeology.</p>
            </div>
            <div className="query-card">
              <code className="query-name">counterfactual(nodeId)</code>
              <p>What would need to change for a different outcome? Backward traversal with tension detection — satisfies CJEU C-203/22 counterfactual explanation requirements.</p>
            </div>
          </div>
          <p className="query-note">
            Sub-millisecond local traversal. No embeddings required, no LLM calls, no network. The Python SDK adds vector search and auto-extraction on top. Use both.
          </p>
        </div>
      </section>

      {/* RELATE > DELETE */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">When memories contradict</h2>
          <div className="relate-comparison">
            <div className="relate-side relate-side--delete">
              <h3>Other memory systems</h3>
              <div className="code-block">
<span className="code-comment"># New info contradicts old info</span>{"\n"}
memory.update(old_fact, new_fact){"\n"}
<span className="code-comment"># Old fact is gone. The disagreement</span>{"\n"}
<span className="code-comment"># — which was the most valuable context —</span>{"\n"}
<span className="code-comment"># is silently destroyed.</span>{"\n"}
<span className="code-comment"># You can't audit a deletion.</span>
              </div>
            </div>
            <div className="relate-side relate-side--tension">
              <h3>FlowScript</h3>
              <div className="code-block">
<span className="code-kw">const</span> a = mem.thought(<span className="code-str">"Redis: sub-ms reads"</span>);{"\n"}
<span className="code-kw">const</span> b = mem.thought(<span className="code-str">"Redis: $200/mo cluster"</span>);{"\n"}
mem.tension(a, b, <span className="code-str">"performance vs cost"</span>);{"\n"}
{"\n"}
mem.query.tensions();{"\n"}
<span className="code-comment">{"// → ><[performance vs cost]"}</span>{"\n"}
<span className="code-comment">{'//   "sub-ms reads" vs "$200/mo cluster"'}</span>{"\n"}
<span className="code-comment">{"// Both preserved. Queryable. Auditable."}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Framework Adapters */}
      <section className="section section--alt">
        <div className="section-inner">
          <h2 className="section-title">Works with your stack</h2>
          <p className="section-lead">
            Drop-in adapters for 9 Python agent frameworks, Vercel AI SDK (TypeScript), and MCP support for Claude Code and Cursor. Your agent gets reasoning memory without changing how it works.
          </p>
          <FrameworkLogos />
        </div>
      </section>

      {/* Install */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Get started in 30 seconds</h2>
          <div className="install-grid">
            <div className="install-card">
              <h3>TypeScript SDK</h3>
              <div className="code-block install-cmd">npm install flowscript-core</div>
              <p>Memory class, 15 agent tools, Vercel AI SDK adapter, audit trail, token budgeting. Works with any LLM that supports function calling.</p>
              <a href="https://www.npmjs.com/package/flowscript-core" target="_blank" rel="noopener noreferrer" className="install-link">
                View on npm &rarr;
              </a>
            </div>
            <div className="install-card">
              <h3>Python Agent Adapters</h3>
              <div className="code-block install-cmd">pip install flowscript-agents</div>
              <p>9 framework adapters, auto-extraction, consolidation engine, vector search, and audit trail. Typed contradictions become queryable tensions.</p>
              <a href="https://pypi.org/project/flowscript-agents/" target="_blank" rel="noopener noreferrer" className="install-link">
                View on PyPI &rarr;
              </a>
            </div>
            <div className="install-card">
              <h3>MCP Server (Claude Code / Cursor)</h3>
              <div className="code-block install-cmd">pip install flowscript-agents openai</div>
              <p>20 reasoning tools with auto-extraction and contradiction handling. Add one JSON block to your editor config and restart.</p>
              <Link to="/get-started" className="install-link">
                Setup guide &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="section section--alt">
        <div className="section-inner">
          <h2 className="section-title">How FlowScript compares</h2>
          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th></th>
                  <th>FlowScript</th>
                  <th>Mem0</th>
                  <th>Vector stores</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Find similar content</td>
                  <td>Vector search (Python SDK)</td>
                  <td>Vector search</td>
                  <td>Vector search</td>
                </tr>
                <tr>
                  <td>"Why did we decide X?"</td>
                  <td className="has-feature">why() &mdash; typed causal chain</td>
                  <td className="no-feature">&mdash;</td>
                  <td className="no-feature">&mdash;</td>
                </tr>
                <tr>
                  <td>"What's blocking?"</td>
                  <td className="has-feature">blocked() &mdash; downstream impact</td>
                  <td className="no-feature">&mdash;</td>
                  <td className="no-feature">&mdash;</td>
                </tr>
                <tr>
                  <td>"What tradeoffs?"</td>
                  <td className="has-feature">tensions() &mdash; named axes</td>
                  <td className="no-feature">&mdash;</td>
                  <td className="no-feature">&mdash;</td>
                </tr>
                <tr>
                  <td>"What if we change this?"</td>
                  <td className="has-feature">whatIf() &mdash; impact analysis</td>
                  <td className="no-feature">&mdash;</td>
                  <td className="no-feature">&mdash;</td>
                </tr>
                <tr>
                  <td>"What would it take to reverse this?"</td>
                  <td className="has-feature">counterfactual() &mdash; reversal analysis</td>
                  <td className="no-feature">&mdash;</td>
                  <td className="no-feature">&mdash;</td>
                </tr>
                <tr>
                  <td>Contradictions</td>
                  <td className="has-feature">Preserved as tensions</td>
                  <td className="no-feature">Deleted</td>
                  <td className="no-feature">N/A</td>
                </tr>
                <tr>
                  <td>Audit trail</td>
                  <td className="has-feature">SHA-256 hash chain</td>
                  <td className="no-feature">&mdash;</td>
                  <td className="no-feature">&mdash;</td>
                </tr>
                <tr>
                  <td>Temporal graduation</td>
                  <td className="has-feature">Automatic 4-tier</td>
                  <td className="no-feature">&mdash;</td>
                  <td className="no-feature">&mdash;</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="query-note" style={{ marginTop: '1rem' }}>
            Vector search and reasoning queries are orthogonal. Use both. Mem0 for retrieval, FlowScript for reasoning. They're different architectural layers.
          </p>
        </div>
      </section>

      {/* Already compliance-ready */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Already compliance-ready</h2>
          <p className="section-lead">
            You don't install FlowScript for compliance. You install it for reasoning memory. But because every decision traces through typed causal chains with a hash-chained audit trail, what you get is inherently compliant.
          </p>
          <div className="problem-grid">
            <div className="problem-card">
              <h3>Hash-chained audit trail</h3>
              <p>SHA-256 linked, append-only, crash-safe, 7-year default retention. Tampering breaks the chain. Framework attribution on every entry.</p>
            </div>
            <div className="problem-card">
              <h3>Typed provenance</h3>
              <p><code>why()</code> returns the actual causal chain, not a reconstruction. <code>explain()</code> generates deterministic compliance documents &mdash; no LLM in the loop, same input always produces same output.</p>
            </div>
            <div className="problem-card">
              <h3>Structural prevention</h3>
              <p>The type system makes untraceable decisions, silent contradictions, and unaudited state changes structurally unrepresentable. Prevention at the architecture level, not behavioral detection.</p>
            </div>
          </div>
          <p className="query-note" style={{ marginTop: '1.5rem' }}>
            Maps to EU AI Act Articles 12 (record-keeping), 13 (transparency), and 86 (right to explanation). Enforcement begins August 2026. You can turn on logging tomorrow &mdash; you can't manufacture the last year of decision provenance.
          </p>
        </div>
      </section>

      {/* Under the hood */}
      <section className="section section--alt">
        <div className="section-inner">
          <h2 className="section-title">Under the hood</h2>
          <p className="section-lead">
            When the consolidation engine resolves contradictions, it produces a <strong>convergence certificate</strong> &mdash; a hash-chained attestation recording the initial graph state, every delta applied, and the final state. An auditor can verify not just what your agent decided, but how it got there.
          </p>
          <p className="section-lead">
            The formal spec includes <code>@fix</code>, a stratified fixpoint operator with three computational levels and guaranteed termination properties. The consolidation engine is a degenerate case. Full spec: <a href="https://github.com/phillipclapham/flowscript/blob/main/spec/fixpoint_spec.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>fixpoint_spec.md</a>.
          </p>
        </div>
      </section>

      {/* FlowScript Cloud */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">FlowScript Cloud <span style={{ fontSize: '0.6em', fontWeight: 400, opacity: 0.7 }}>(coming soon)</span></h2>
          <p className="section-lead">
            Local audit trails are tamper-evident but self-attested. FlowScript Cloud will add independent third-party witnessing: your SDK streams hash-chained events to the Cloud service, which verifies chain continuity and stores witness attestations.
          </p>
          <div className="install-grid">
            <div className="install-card">
              <h3>One environment variable</h3>
              <div className="code-block install-cmd">export FLOWSCRIPT_API_KEY=your-key</div>
              <p>Every audit event streams automatically. Chain verification and witness attestation happen server-side. Your local audit trail remains the source of truth.</p>
            </div>
            <div className="install-card">
              <h3>Three deployment tiers</h3>
              <p><strong>SaaS</strong> at api.flowscript.org. <strong>Self-hosted Cloudflare</strong> &mdash; deploy to your own account. <strong>Docker on-premise</strong> for regulated industries. One codebase, three deployment models.</p>
            </div>
            <div className="install-card">
              <h3>Source-available</h3>
              <p>BSL 1.1 licensed. Full source on GitHub. Converts to Apache 2.0 after 4 years. Audit the code that audits your agents.</p>
              <a href="https://github.com/phillipclapham/flowscript-cloud" target="_blank" rel="noopener noreferrer" className="install-link">
                View on GitHub &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section section--alt cta-section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Open source. MIT licensed. ~1,500 tests.</h2>
          <p className="section-lead">
            779 TypeScript + 717 Python + 68 Cloud. Same audit trail format across all three.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/get-started" className="btn btn-primary">Get Started</Link>
            <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
