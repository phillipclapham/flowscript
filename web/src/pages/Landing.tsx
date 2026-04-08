/**
 * FlowScript Landing Page
 * Introduces FlowScript as a semantic notation system.
 * Points to anneal-memory as the evolution of the core concepts.
 */

import { Link } from "react-router-dom";
import "./Landing.css";

export function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Semantic notation for<br />
            <span className="hero-highlight">structured reasoning</span>
          </h1>
          <p className="hero-subtitle">
            FlowScript is a 21-marker notation system for encoding decisions, tensions, blockers,
            causal chains, and temporal knowledge. It forces explicit relationships that prose
            leaves ambiguous, and compresses reasoning at ~3:1 while making it queryable.
          </p>
          <div className="hero-actions">
            <Link to="/learn" className="btn btn-primary">Learn the Notation</Link>
            <Link to="/playground" className="btn btn-secondary">Try the Playground</Link>
          </div>
        </div>
      </section>

      {/* Evolution Banner */}
      <section className="section evolution-banner">
        <div className="section-inner">
          <p className="evolution-text">
            The core concepts explored here &mdash; compression-as-cognition, temporal graduation,
            citation-validated patterns, immune system &mdash; evolved into{" "}
            <a href="https://github.com/phillipclapham/anneal-memory" target="_blank" rel="noopener noreferrer">
              anneal-memory
            </a>, a two-layer memory system for AI agents.
            The notation remains in active daily use for reasoning compression and knowledge encoding.
          </p>
        </div>
      </section>

      {/* Before / After */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Prose hides structure. FlowScript reveals it.</h2>
          <p className="section-lead">
            When you force reasoning through typed encoding, you discover relationships
            that natural language leaves implicit. The compression isn't just shorter &mdash;
            it's computable.
          </p>
          <div className="relate-comparison">
            <div className="relate-side relate-side--delete">
              <h3>Natural language</h3>
              <div className="code-block">
{`We discussed whether to use Redis or PostgreSQL
for sessions. Redis is faster but more expensive.
We went with Redis because speed matters more for
ephemeral data. However, we're now blocked on
cluster provisioning, which is holding up the
auth service and login flow rollout.`}
              </div>
            </div>
            <div className="relate-side relate-side--tension">
              <h3>FlowScript</h3>
              <div className="code-block">
{`? Which database for sessions?
  || Redis -> sub-ms reads
     -> [decided(rationale: "speed > cost
         for ephemeral data", on: "2026-03-10")]
  || PostgreSQL -> mature tooling

speed ><[performance vs cost] infrastructure cost

[blocked(reason: "Redis cluster not provisioned",
  since: "2026-03-11")]
! auth service -> blocks login flow rollout`}
              </div>
            </div>
          </div>
          <p className="compare-note">
            Both say the same thing. The FlowScript version is ~60% shorter and every
            relationship is typed &mdash; you can programmatically ask "what's blocked?",
            "what tradeoffs exist?", and "why did we choose Redis?"
          </p>
        </div>
      </section>

      {/* The 21 Markers */}
      <section className="section section--alt">
        <div className="section-inner">
          <h2 className="section-title">21 markers, 5 categories</h2>
          <p className="section-lead">
            Every marker earns its place through daily use. The full system is small enough
            to learn in an afternoon and expressive enough to encode any reasoning structure.
          </p>
          <div className="marker-grid">
            <div className="marker-category">
              <h3>Relations</h3>
              <div className="marker-list">
                <div className="marker-item"><code>{'->'}</code> <span>leads to / causes</span></div>
                <div className="marker-item"><code>{'<-'}</code> <span>derives from</span></div>
                <div className="marker-item"><code>{'<->'}</code> <span>mutual influence</span></div>
                <div className="marker-item"><code>{'=>'}</code> <span>temporal sequence</span></div>
                <div className="marker-item"><code>{'><[axis]'}</code> <span>tension / tradeoff</span></div>
              </div>
            </div>
            <div className="marker-category">
              <h3>States</h3>
              <div className="marker-list">
                <div className="marker-item"><code>[decided]</code> <span>commitment made</span></div>
                <div className="marker-item"><code>[exploring]</code> <span>investigating</span></div>
                <div className="marker-item"><code>[blocked]</code> <span>waiting on dependency</span></div>
                <div className="marker-item"><code>[parking]</code> <span>not ready yet</span></div>
              </div>
            </div>
            <div className="marker-category">
              <h3>Content</h3>
              <div className="marker-list">
                <div className="marker-item"><code>?</code> <span>question / decision point</span></div>
                <div className="marker-item"><code>thought:</code> <span>insight / observation</span></div>
                <div className="marker-item"><code>||</code> <span>alternative option</span></div>
                <div className="marker-item"><code>{'\u2713'}</code> <span>completed / done</span></div>
              </div>
            </div>
            <div className="marker-category">
              <h3>Modifiers</h3>
              <div className="marker-list">
                <div className="marker-item"><code>!</code> <span>urgent / important</span></div>
                <div className="marker-item"><code>*</code> <span>high confidence</span></div>
                <div className="marker-item"><code>~</code> <span>uncertain / approximate</span></div>
                <div className="marker-item"><code>++</code> <span>strong positive</span></div>
              </div>
            </div>
            <div className="marker-category">
              <h3>Structure</h3>
              <div className="marker-list">
                <div className="marker-item"><code>{'{ }'}</code> <span>block / complete thought</span></div>
                <div className="marker-item"><code>=</code> <span>equivalent to</span></div>
                <div className="marker-item"><code>!=</code> <span>different from</span></div>
                <div className="marker-item"><code>action:</code> <span>imperative / do this</span></div>
              </div>
            </div>
          </div>
          <p className="marker-note">
            Start with three: <code>{'->'}</code>, <code>{'><'}</code>, and <code>{'{ }'}</code>.
            Add more as you need them. LLMs parse FlowScript natively &mdash; no fine-tuning required.
          </p>
        </div>
      </section>

      {/* Notation as Thinking Tool */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Notation expands the space of possible thought</h2>
          <p className="section-lead">
            Musical notation didn't record what musicians were already playing. Before staff notation,
            European music was monophonic. Notation made polyphony possible. Bach's fugues are
            literally unthinkable without it &mdash; not "hard to remember" but impossible to
            compose, because simultaneous interacting voices require a precise representational system.
          </p>
          <p className="section-lead">
            FlowScript does the same thing for structured reasoning. It makes a category of
            analysis possible where you hold multiple causal chains simultaneously, query across
            reasoning paths, and turn contradictions into typed tensions instead of silent overwrites.
          </p>
          <div className="thinking-grid">
            <div className="thinking-card">
              <h3>Compression reveals structure</h3>
              <p>
                When you force reasoning through typed encoding, you extract structure that
                prose leaves implicit. Optimal compression and genuine understanding are the
                same operation.
              </p>
            </div>
            <div className="thinking-card">
              <h3>Types prevent malformed reasoning</h3>
              <p>
                Every decision traces to a question through alternatives. Every contradiction
                becomes a typed tension with a named axis. The notation makes certain classes of
                sloppy thinking structurally unrepresentable.
              </p>
            </div>
            <div className="thinking-card">
              <h3>Deletion is irrational</h3>
              <p>
                When new information contradicts old, most systems silently overwrite. FlowScript
                preserves both sides as a queryable tension. The disagreement itself is knowledge.
                RELATE &gt; DELETE.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Was Built */}
      <section className="section section--alt">
        <div className="section-inner">
          <h2 className="section-title">What was built here</h2>
          <p className="section-lead">
            FlowScript was a deep exploration of typed reasoning representation for AI agents.
            The engineering is real. The concepts proved themselves and evolved.
          </p>
          <div className="built-grid">
            <div className="built-card">
              <h3>The notation</h3>
              <p>
                21 markers with formal grammar, Ohm.js parser, linter with semantic rules,
                and an interactive web editor with D3 graph visualization. Used daily for
                reasoning compression.
              </p>
            </div>
            <div className="built-card">
              <h3>Typed queries</h3>
              <p>
                Six graph traversal operations no vector store can answer:
                {" "}<code>why()</code>, <code>tensions()</code>, <code>blocked()</code>,
                {" "}<code>whatIf()</code>, <code>alternatives()</code>, <code>counterfactual()</code>.
                Sub-millisecond local traversal, no LLM calls.
              </p>
            </div>
            <div className="built-card">
              <h3>Temporal graduation</h3>
              <p>
                Knowledge graduates through tiers based on actual use: current &rarr; developing
                &rarr; proven &rarr; foundation. Dormant patterns prune automatically.
                Memory that evolves instead of accumulating.
              </p>
            </div>
            <div className="built-card">
              <h3>~1,500 tests</h3>
              <p>
                779 TypeScript + 717 Python. Parser, grammar, SDK, query engine, audit trail,
                framework adapters. Published on npm and PyPI. MIT licensed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Evolution */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Evolution</h2>
          <p className="section-lead">
            Through building FlowScript, we discovered that the core insights were more
            powerful than the syntax. The notation barrier was real &mdash; developers
            won't learn a new language for memory. But the mechanisms underneath &mdash;
            compression-as-cognition, temporal graduation, citation-validated patterns &mdash;
            those were genuinely novel.
          </p>
          <div className="evolution-flow">
            <div className="evolution-step">
              <h3>FlowScript explored</h3>
              <ul>
                <li>Typed reasoning graphs with six query operations</li>
                <li>Temporal graduation (1x &rarr; 2x &rarr; 3x &rarr; proven)</li>
                <li>Compression-as-cognition: the act of compressing IS the understanding</li>
                <li>Anti-inbreeding defense: citation-based validation</li>
                <li>Hash-chained audit trails for tamper-evident provenance</li>
              </ul>
            </div>
            <div className="evolution-arrow">&darr;</div>
            <div className="evolution-step evolution-step--highlight">
              <h3>
                <a href="https://github.com/phillipclapham/anneal-memory" target="_blank" rel="noopener noreferrer">
                  anneal-memory
                </a>
                {" "}delivers
              </h3>
              <ul>
                <li>Same cognitive architecture, zero-dependency MCP server</li>
                <li>No syntax to learn &mdash; agents use natural language</li>
                <li>Episodes compress into identity through consolidation</li>
                <li>Immune system: citation-validated graduation + principle demotion</li>
                <li>Hebbian associations + limbic layer for cognitive-affective state</li>
              </ul>
            </div>
            <div className="evolution-arrow">&darr;</div>
            <div className="evolution-step">
              <h3>The notation lives on</h3>
              <ul>
                <li>Used daily for continuity compression and knowledge encoding</li>
                <li>9-marker subset powers anneal-memory's compression prompts</li>
                <li>Typed relationship principles inform ongoing research</li>
                <li>This site preserves the notation reference and interactive playground</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section section--alt cta-section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Open source. MIT licensed.</h2>
          <p className="section-lead">
            The notation, parser, SDK, and this playground are all public.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/learn" className="btn btn-primary">Learn FlowScript</Link>
            <Link to="/playground" className="btn btn-secondary">Try the Playground</Link>
          </div>
          <div className="repo-links">
            <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer">
              flowscript (TypeScript)
            </a>
            <span className="repo-sep">&middot;</span>
            <a href="https://github.com/phillipclapham/flowscript-agents" target="_blank" rel="noopener noreferrer">
              flowscript-agents (Python)
            </a>
            <span className="repo-sep">&middot;</span>
            <a href="https://github.com/phillipclapham/anneal-memory" target="_blank" rel="noopener noreferrer">
              anneal-memory
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
