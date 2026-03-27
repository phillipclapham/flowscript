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
            Five typed queries no vector store can answer: <code>why()</code>, <code>tensions()</code>, <code>blocked()</code>, <code>alternatives()</code>, <code>whatIf()</code>.
            Hash-chained audit trail. Structural compliance. MIT licensed.
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
          <h2 className="section-title">Five queries no vector store can answer</h2>
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
              <p>14 reasoning tools with auto-extraction and contradiction handling. Add one JSON block to your editor config and restart.</p>
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

      {/* Enterprise & Compliance */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Enterprise &amp; Compliance</h2>
          <p className="section-lead">
            FlowScript's typed reasoning chains are compliance-ready audit infrastructure. Not a separate product &mdash; a structural property of how it works.
          </p>
          <div className="problem-grid">
            <div className="problem-card">
              <h3>EU AI Act Art. 12</h3>
              <p>Record-keeping. Hash-chained audit trail, append-only, tamper-evident, 7-year default retention.</p>
            </div>
            <div className="problem-card">
              <h3>EU AI Act Art. 13</h3>
              <p>Transparency. <code>why()</code> queries return typed causal chains &mdash; not reconstructions, actual reasoning records.</p>
            </div>
            <div className="problem-card">
              <h3>EU AI Act Art. 86</h3>
              <p>Right to explanation. <code>alternatives()</code> reconstructs what was considered, what was chosen, and the rationale.</p>
            </div>
          </div>
          <p className="query-note" style={{ marginTop: '1.5rem' }}>
            Enforcement begins August 2026. Audit trails can't be backdated. Organizations using FlowScript today have unbroken reasoning records from day one. You can turn on logging tomorrow &mdash; you can't manufacture the last 18 months of decision provenance.
          </p>
        </div>
      </section>

      {/* Security */}
      <section className="section section--alt">
        <div className="section-inner">
          <h2 className="section-title">Security: Can't Patch, Must Architect</h2>
          <p className="section-lead">
            Three independent CVE clusters dropped in the same week &mdash; MCPwned, ClawHub, and ClawJacked (CVSS 8.8, 15,200 affected instances). Same structural root cause: unvalidated content flowing through agent invocation paths.
          </p>
          <p className="section-lead">
            FlowScript doesn't prevent every attack class. What it makes structurally impossible is <strong>reasoning corruption</strong> &mdash; untraceable decisions, silent contradictions, unaudited state changes. The type system makes them unrepresentable. Same architectural insight as <a href="https://www.cl.cam.ac.uk/research/security/ctsrd/cheri/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>CHERI</a>: structural prevention over behavioral detection.
          </p>
        </div>
      </section>

      {/* What FlowScript Actually Is — Layer 1 (condensed for web) */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">What FlowScript actually is</h2>
          <p className="section-lead">
            The five queries and the audit trail are what FlowScript <em>does</em>. Here's what it <em>is</em>.
          </p>
          <p className="section-lead">
            Musical notation didn't record what musicians were already playing. It made polyphony <em>possible</em>. Bach's fugues are literally unthinkable without it &mdash; not "hard to remember" but impossible to compose, because the interaction of independent voices requires a representational system precise enough to reason about counterpoint.
          </p>
          <p className="section-lead">
            FlowScript does the same thing for AI cognition. It doesn't record what agents are already thinking. It makes a new category of reasoning possible &mdash; the kind where you can have multiple reasoning chains interacting, query across causal paths, and turn contradictions into structured tensions. This is impossible in the vector-search paradigm because vector search has no representation for <em>why</em>.
          </p>
          <p className="section-lead">
            FlowScript is infrastructure. Not a tool. Not a framework. Infrastructure &mdash; like SQL gave us queryable data, TCP/IP gave us addressable communication, and Git gave us trackable changes. FlowScript gives AI agents queryable reasoning. Everything else &mdash; compliance, security, memory, observability &mdash; is an application of that infrastructure.
          </p>
          <p className="section-lead" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            The applications are what you install FlowScript for. The infrastructure is why it matters.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section cta-section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Open source. MIT licensed. 1,315 tests.</h2>
          <p className="section-lead">
            731 TypeScript + 584 Python. Same audit trail format across both SDKs.
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
