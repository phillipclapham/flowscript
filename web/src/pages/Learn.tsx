/**
 * FlowScript Learn Page
 * Complete notation reference, practical subset, reasoning graph concepts,
 * advanced patterns, and deeper philosophical structure.
 */

import { Link } from "react-router-dom";
import "./Learn.css";

export function Learn() {
  return (
    <div className="page learn-page">
      <h1 className="learn-hero-title">Learning FlowScript</h1>
      <p className="learn-hero-subtitle">
        From the three markers you need to start, through the full 21-marker system,
        to advanced patterns that emerge from composition. Everything here is drawn from
        daily use and the formal specification.
      </p>

      {/* Table of Contents */}
      <nav className="learn-toc">
        <h2>Contents</h2>
        <ol>
          <li><a href="#quick-start">Quick Start</a></li>
          <li><a href="#full-notation">The Full Notation System</a></li>
          <li><a href="#in-practice">In Practice: The AI Memory Subset</a></li>
          <li><a href="#reasoning-graph">The Reasoning Graph</a></li>
          <li><a href="#advanced-patterns">Advanced Patterns</a></li>
          <li><a href="#deeper-structure">The Deeper Structure</a></li>
        </ol>
      </nav>

      {/* ================================================================
          1. QUICK START
          ================================================================ */}
      <section className="learn-section" id="quick-start">
        <h2>Quick start</h2>
        <p>
          Start with three markers. That's enough to encode useful structure.
          Add more as you need them.
        </p>
        <div className="code-block">
{`->    shows what leads to what (causal flow)
><    shows tension / tradeoff (competing concerns)
{ }   wraps a complete thought (block structure)`}
        </div>
        <p>
          With just these three, you can encode a decision:
        </p>
        <div className="code-block">
{`{
  database decision
  -> chose Redis for speed
  -> but cluster costs $200/mo
  speed ><[performance vs cost] infrastructure budget
}`}
        </div>
        <p>
          LLMs parse FlowScript natively. No fine-tuning, no special configuration.
          The markers map directly to reasoning structures that language models already
          understand.
        </p>
      </section>

      {/* ================================================================
          2. THE FULL NOTATION SYSTEM
          ================================================================ */}
      <section className="learn-section" id="full-notation">
        <h2>The full notation system</h2>
        <p>
          21 markers across 5 categories. Every marker earned its place through
          daily use. The{" "}
          <a href="https://github.com/phillipclapham/flowscript/blob/main/FLOWSCRIPT_SYNTAX.md" target="_blank" rel="noopener noreferrer">
            syntax reference
          </a>{" "}
          has complete details with extended examples.
        </p>

        {/* --- Core Relations --- */}
        <h3 className="marker-section-title">Core Relations (5 markers)</h3>
        <p className="marker-section-desc">The foundation. Start here.</p>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">{'->'}</code>
            <span className="marker-meaning">leads to / causes / results in</span>
          </div>
          <p>Show causal flow, dependencies, logical implication.</p>
          <div className="code-block code-block--compact">
{`auth bug -> login failures
Redis decision -> faster sessions
complexity -> maintenance burden`}
          </div>
          <p className="marker-tip">
            Key distinction: use <code>{'->'}</code> for CAUSAL relationships.
            For temporal sequence without causation, use <code>{'=>'}</code>.
          </p>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">{'=>'}</code>
            <span className="marker-meaning">then / followed by / temporal sequence</span>
          </div>
          <p>Show temporal ordering WITHOUT claiming causation.</p>
          <div className="code-block code-block--compact">
{`wake up => coffee => work
Phase 1 complete => Phase 2 begins`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">{'<-'}</code>
            <span className="marker-meaning">derives from / caused by / provides context</span>
          </div>
          <p>Show origin, context, what something comes from. <code>A {'<-'} B</code> is equivalent to <code>B {'->'} A</code> but emphasizes A (the effect) first.</p>
          <div className="code-block code-block--compact">
{`login failures <- auth bug
decision <- user feedback`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">{'<->'}</code>
            <span className="marker-meaning">bidirectional / mutual influence</span>
          </div>
          <p>Two things affect each other. Feedback loops, interconnected concerns.</p>
          <div className="code-block code-block--compact">
{`team size <-> project scope
performance <-> memory usage`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">{'><[axis]'}</code>
            <span className="marker-meaning">tension / tradeoff / conflict</span>
          </div>
          <p>
            Competing concerns with a named axis. The axis label is <strong>required</strong> &mdash;
            bare <code>{'><'}</code> is a lint error. Forces precision on what's being traded.
          </p>
          <div className="code-block code-block--compact">
{`speed ><[velocity vs maintainability] code quality
features ><[stability vs functionality] stability
cost ><[performance vs budget] performance`}
          </div>
        </div>

        {/* --- Definition Operators --- */}
        <h3 className="marker-section-title">Definition Operators (2 markers)</h3>
        <p className="marker-section-desc">Clarify meaning and make distinctions.</p>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">=</code>
            <span className="marker-meaning">equivalent to / same as</span>
          </div>
          <div className="code-block code-block--compact">
{`success = 100+ validated users
hybrid approach = NL + selective FlowScript`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">!=</code>
            <span className="marker-meaning">different from / not the same</span>
          </div>
          <div className="code-block code-block--compact">
{`infrastructure != application
causal (->) != temporal (=>)`}
          </div>
        </div>

        {/* --- States --- */}
        <h3 className="marker-section-title">States (4 markers)</h3>
        <p className="marker-section-desc">Track decision and work status. Some require fields for enforcement.</p>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">[decided(rationale, on)]</code>
            <span className="marker-meaning">commitment made, locked in</span>
          </div>
          <p>
            Both fields <strong>required</strong>. Forces documentation of reasoning and timing.
          </p>
          <div className="code-block code-block--compact">
{`[decided(rationale: "user feedback validates need", on: "2026-03-10")]
Ship minimal version now`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">[exploring]</code>
            <span className="marker-meaning">not committed yet, investigating</span>
          </div>
          <div className="code-block code-block--compact">
{`[exploring] Redis vs Postgres for sessions
[exploring(hypothesis: "might improve perf")] Caching layer`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">[blocked(reason, since)]</code>
            <span className="marker-meaning">waiting on dependency</span>
          </div>
          <p>Both fields <strong>required</strong>. Forces explicit tracking of what blocks progress and when.</p>
          <div className="code-block code-block--compact">
{`[blocked(reason: "waiting on API keys", since: "2026-03-11")] Deploy
[blocked(reason: "needs design review", since: "2026-03-08")] Feature`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">[parking(why, until)]</code>
            <span className="marker-meaning">not ready to process yet</span>
          </div>
          <p>Fields recommended (warning if missing, not error).</p>
          <div className="code-block code-block--compact">
{`[parking(why: "not needed until v2", until: "after MVP")] Browser extension`}
          </div>
        </div>

        {/* --- Content Operators --- */}
        <h3 className="marker-section-title">Content Operators (4 markers)</h3>
        <p className="marker-section-desc">Tag the type of content being expressed.</p>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">?</code>
            <span className="marker-meaning">question / decision point</span>
          </div>
          <p>Opens a decision space. Usually followed by alternatives (<code>||</code>).</p>
          <div className="code-block code-block--compact">
{`? Which database for sessions?
  || Redis -> sub-ms reads
  || PostgreSQL -> mature tooling`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">thought:</code>
            <span className="marker-meaning">insight / observation</span>
          </div>
          <p>Can add confidence prefix: <code>* thought:</code> (high confidence) or <code>~ thought:</code> (uncertain).</p>
          <div className="code-block code-block--compact">
{`thought: Relations force explicit relationship definition
* thought: Evidence validates this works
~ thought: Not sure but maybe relevant`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">||</code>
            <span className="marker-meaning">alternative option</span>
          </div>
          <p>Lists alternatives under a question or decision point.</p>
          <div className="code-block code-block--compact">
{`? Deploy strategy
  || Blue-green deployment
  || Rolling update
  || Canary release`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">{'\u2713'}</code>
            <span className="marker-meaning">completed / done</span>
          </div>
          <div className="code-block code-block--compact">
{`\u2713 Auth system implementation
\u2713 Documentation updated`}
          </div>
        </div>

        {/* --- Modifiers --- */}
        <h3 className="marker-section-title">Modifiers (4 markers)</h3>
        <p className="marker-section-desc">Prefix any content to add emphasis or confidence level.</p>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">!</code>
            <span className="marker-meaning">urgent / important</span>
          </div>
          <div className="code-block code-block--compact">
{`! ? Launch timing - need decision today
! [blocked(reason: "critical path")] Deploy`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">*</code>
            <span className="marker-meaning">high confidence / proven</span>
          </div>
          <div className="code-block code-block--compact">
{`* thought: Evidence validates this approach
* [decided(rationale: "proven through testing")] Use this`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">~</code>
            <span className="marker-meaning">low confidence / uncertain / approximate</span>
          </div>
          <div className="code-block code-block--compact">
{`~ thought: Not sure but maybe relevant
~ 3 day estimate (depends on conditions)`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">++</code>
            <span className="marker-meaning">strong positive / emphatic</span>
          </div>
          <div className="code-block code-block--compact">
{`++ Love this direction
++ That analysis nailed it`}
          </div>
        </div>

        {/* --- Structure --- */}
        <h3 className="marker-section-title">Structure (2 markers)</h3>
        <p className="marker-section-desc">Organize content into blocks and actions.</p>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">{'{ }'}</code>
            <span className="marker-meaning">block / complete thought</span>
          </div>
          <p>Wraps related content into a unit. Supports recursive nesting for multi-level reasoning.</p>
          <div className="code-block code-block--compact">
{`{
  database decision
  -> chose Redis for speed
  -> but cluster costs $200/mo
}`}
          </div>
        </div>

        <div className="marker-detail">
          <div className="marker-header">
            <code className="marker-code">action:</code>
            <span className="marker-meaning">imperative / do this</span>
          </div>
          <div className="code-block code-block--compact">
{`action: fix the bug immediately
action: review before merging`}
          </div>
        </div>

        {/* --- Quick Reference Table --- */}
        <h3 className="marker-section-title">Quick Reference</h3>
        <div className="ref-table-wrapper">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Marker</th>
                <th>Meaning</th>
                <th>Required Fields</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>{'->'}</code></td><td>Leads to / causes</td><td>&mdash;</td></tr>
              <tr><td><code>{'=>'}</code></td><td>Then / temporal sequence</td><td>&mdash;</td></tr>
              <tr><td><code>{'<-'}</code></td><td>Derives from</td><td>&mdash;</td></tr>
              <tr><td><code>{'<->'}</code></td><td>Bidirectional</td><td>&mdash;</td></tr>
              <tr><td><code>{'><[axis]'}</code></td><td>Tension / tradeoff</td><td>axis label</td></tr>
              <tr><td><code>=</code></td><td>Equivalent to</td><td>&mdash;</td></tr>
              <tr><td><code>!=</code></td><td>Different from</td><td>&mdash;</td></tr>
              <tr><td><code>[decided]</code></td><td>Commitment made</td><td>rationale, on</td></tr>
              <tr><td><code>[exploring]</code></td><td>Investigating</td><td>&mdash;</td></tr>
              <tr><td><code>[blocked]</code></td><td>Waiting on dependency</td><td>reason, since</td></tr>
              <tr><td><code>[parking]</code></td><td>Not ready yet</td><td>why, until (recommended)</td></tr>
              <tr><td><code>?</code></td><td>Question / decision point</td><td>&mdash;</td></tr>
              <tr><td><code>thought:</code></td><td>Insight / observation</td><td>&mdash;</td></tr>
              <tr><td><code>||</code></td><td>Alternative option</td><td>&mdash;</td></tr>
              <tr><td><code>{'\u2713'}</code></td><td>Completed / done</td><td>&mdash;</td></tr>
              <tr><td><code>!</code></td><td>Urgent (prefix)</td><td>&mdash;</td></tr>
              <tr><td><code>*</code></td><td>High confidence (prefix)</td><td>&mdash;</td></tr>
              <tr><td><code>~</code></td><td>Uncertain (prefix)</td><td>&mdash;</td></tr>
              <tr><td><code>++</code></td><td>Strong positive (prefix)</td><td>&mdash;</td></tr>
              <tr><td><code>{'{ }'}</code></td><td>Block / complete thought</td><td>&mdash;</td></tr>
              <tr><td><code>action:</code></td><td>Imperative / do this</td><td>&mdash;</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ================================================================
          3. IN PRACTICE: THE AI MEMORY SUBSET
          ================================================================ */}
      <section className="learn-section" id="in-practice">
        <h2>In practice: the AI memory subset</h2>
        <p>
          You don't need all 21 markers for daily use. The flow system and{" "}
          <a href="https://github.com/phillipclapham/anneal-memory" target="_blank" rel="noopener noreferrer">
            anneal-memory
          </a>{" "}
          use a 15-marker subset for encoding knowledge patterns, tracking developing
          insights, and compressing session context. This is what FlowScript looks like
          in active production use.
        </p>

        <h3>The working set</h3>
        <p>
          These markers are used daily for encoding developing knowledge &mdash;
          observations that graduate through validation tiers (1x &rarr; 2x &rarr; 3x &rarr; proven)
          based on independent evidence:
        </p>

        <div className="subset-grid">
          <div className="subset-group">
            <h4>State markers (what's happening)</h4>
            <div className="code-block code-block--compact">
{`? Redis vs Postgres for sessions       # open question
thought: constraints = design material  # insight
\u2713 Auth system complete                  # done
[blocked(reason: "API keys")]           # stuck
[parking(why: "not until v2")]          # deferred
[decided(rationale: "speed > cost")]    # committed`}
            </div>
          </div>
          <div className="subset-group">
            <h4>Relationship markers (how things connect)</h4>
            <div className="code-block code-block--compact">
{`auth bug -> login failures              # causes
decision <- user feedback               # derives from
team size <-> project scope             # mutual
speed ><[perf vs cost] infrastructure   # tension`}
            </div>
          </div>
          <div className="subset-group">
            <h4>Modifiers (emphasis and confidence)</h4>
            <div className="code-block code-block--compact">
{`!  urgent / load-bearing
*  high confidence / proven
~  uncertain / approximate
++ strong positive`}
            </div>
          </div>
        </div>

        <h3>Real example: developing knowledge</h3>
        <p>
          This is what a developing knowledge entry looks like in practice &mdash;
          a pattern being tracked across sessions with lifecycle markers and dates:
        </p>
        <div className="code-block">
{`{Career Search Session (Apr 07 evening):
  ! resume_reframing_as_positioning_not_editing:
    same experience, completely different emphasis
    per target role. Infrastructure framing (Grafana)
    vs enablement framing (OpenAI) vs builder framing
    (LangChain). The resume IS positioning. | 1x (CAREER)
  ! contextload_as_universal_proof_point:
    AI tool -> saved churning accounts -> revenue
    preservation. Maps to every customer-facing AI JD.
    Strongest single story across all role types. | 1x
}`}
        </div>
        <p>
          The <code>| 1x</code> marker means "observed once." When the same pattern
          is independently confirmed, it increments to <code>2x</code>. At <code>3x</code>
          with independent evidence, it graduates to proven knowledge and gets compressed
          into a permanent, FlowScript-encoded principle. Patterns that go stale (&gt;7 days
          without activity) get archived. Git preserves everything.
        </p>

        <h3>The 9-marker compression subset</h3>
        <p>
          anneal-memory uses an even smaller subset for its continuity compression prompts.
          When an AI agent compresses session episodes into persistent memory, it uses these
          9 markers:
        </p>
        <div className="code-block">
{`?         question needing decision
thought:  insight worth preserving
\u2713         completed / done
[blocked] waiting on dependency (with reason, since)
[parking] not ready yet (with why, until)
[decided] commitment made (with rationale, on)
->        leads to / causes
><[axis]  tension / tradeoff
!         urgent / load-bearing`}
        </div>
        <p>
          This subset is sufficient to encode any knowledge pattern &mdash; what happened,
          why it matters, what it connects to, and what state it's in. The act of compressing
          through these markers IS the cognition: it forces the agent to identify relationships,
          make explicit what's implicit, and distinguish decisions from open questions.
        </p>
      </section>

      {/* ================================================================
          4. THE REASONING GRAPH
          ================================================================ */}
      <section className="learn-section" id="reasoning-graph">
        <h2>The reasoning graph</h2>
        <p>
          When FlowScript is parsed (via the Ohm.js parser or the SDK), it builds a
          typed graph of reasoning. Nodes have types (question, thought, decision, action).
          Relationships have types (causes, blocks, tensions, alternatives). This graph
          supports computation &mdash; traversal operations that answer questions prose cannot.
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

        <h3>Six typed queries</h3>
        <p>
          The FlowScript SDK implements six graph traversal operations. These are
          structural queries over typed relationships, not text search.
        </p>

        <div className="query-deep-dive">
          <div className="query-explain">
            <h4><code>tensions()</code> &mdash; Find tradeoffs</h4>
            <p>
              Returns every <code>{'><'}</code> relationship grouped by named axis.
              Contradictions preserved as queryable structure, not deleted.
            </p>
          </div>

          <div className="query-explain">
            <h4><code>blocked()</code> &mdash; What's stuck</h4>
            <p>
              Finds every <code>[blocked]</code> state including reason, timestamp,
              and everything downstream that's waiting. Impact analysis, not just status.
            </p>
          </div>

          <div className="query-explain">
            <h4><code>why(nodeId)</code> &mdash; Causal chain</h4>
            <p>
              Traces <code>{'->'}</code> chains backward from any node to find root causes.
              Decision provenance through typed relationships.
            </p>
          </div>

          <div className="query-explain">
            <h4><code>whatIf(nodeId)</code> &mdash; Impact analysis</h4>
            <p>
              Traces <code>{'->'}</code> chains forward. "If this changes, what breaks
              downstream?" Direct and indirect consequences.
            </p>
          </div>

          <div className="query-explain">
            <h4><code>alternatives(questionId)</code> &mdash; Decision archaeology</h4>
            <p>
              For any question node, returns every alternative considered: what was decided,
              blocked, deferred, and the rationale for each.
            </p>
          </div>

          <div className="query-explain">
            <h4><code>counterfactual(nodeId)</code> &mdash; Reversal analysis</h4>
            <p>
              What would need to change for a different outcome? Backward traversal with
              tension detection.
            </p>
          </div>
        </div>

        <h3>Temporal tiers</h3>
        <p>
          Nodes graduate through four tiers based on actual use. Knowledge that keeps
          getting referenced earns permanence. One-off observations fade. After many
          sessions, what remains is a curated knowledge base, not a pile of notes.
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
          Dormant nodes are pruned to the append-only audit trail &mdash; archived
          with full provenance, never destroyed. The graduation mechanism is the same
          one that powers{" "}
          <a href="https://github.com/phillipclapham/anneal-memory" target="_blank" rel="noopener noreferrer">
            anneal-memory
          </a>'s citation-validated knowledge development.
        </p>

        <h3>Audit trail</h3>
        <p>
          Every mutation to the reasoning graph is recorded in a SHA-256 hash-chained,
          append-only audit trail. Each entry links to the previous via cryptographic hash.
          Tampering with history breaks the chain. Cross-language (TypeScript and Python
          produce the same canonical JSON serialization).
        </p>
      </section>

      {/* ================================================================
          5. ADVANCED PATTERNS
          ================================================================ */}
      <section className="learn-section" id="advanced-patterns">
        <h2>Advanced patterns</h2>
        <p>
          These patterns weren't designed up front. They were discovered through extended
          use as the notation's compositional structure revealed new capabilities. Every
          pattern emerges from composing existing markers &mdash; no new syntax required.
          The{" "}
          <a href="https://github.com/phillipclapham/flowscript/blob/main/ADVANCED_PATTERNS.md" target="_blank" rel="noopener noreferrer">
            advanced patterns guide
          </a>{" "}
          in the repo has the full collection.
        </p>

        <h3>Recursive nesting</h3>
        <p>
          FlowScript's most powerful capability. Complex thinking isn't atomic &mdash;
          it's recursive, self-referential, multi-layered. Nesting creates explicit thought
          hierarchy, context at multiple depths, and sidebar commentary without breaking flow.
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
          Nesting enables recursive self-reference &mdash; thoughts about thoughts,
          analysis of analysis. A structure impossible in linear prose.
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
}`}
        </div>

        <h3>Multi-dimensional analysis</h3>
        <p>
          When a decision has technical, business, and personal dimensions, FlowScript
          keeps them isolated for independent analysis, then synthesizes across dimensions.
        </p>
        <div className="code-block">
{`{
  decision: when to launch?

  -> {technical:
       <- {86% complete <- hardest 14% remaining}
       -> need 2-4 more weeks minimum
     }

  -> {business:
       <- {competitive pressure <- market timing}
       -> pressure to launch sooner
     }

  -> {personal:
       <- {burnout: severe <- energy: limited}
       -> can't sustain current pace
     }

  -> synthesis: {
       technical ><[quality vs speed] business
       business ><[pressure vs capacity] personal
       -> all three must align
       -> [decided] launch when technically ready
          AND personally sustainable
       != calendar-driven launch
     }
}`}
        </div>

        <h3>Evidence chains with confidence markers</h3>
        <div className="code-block">
{`* thought: {
  FlowScript enables dimensional expansion of thinking

  <- {evidence: threshold effect observed
       <- {* observation: voluntary continued use despite friction}
       <- {* observation: thinking IN FlowScript, not translating}
       <- {~ observation: structures impossible in pure NL emerge
            <- hard to quantify <- need external validation
          }
       -> * conclusion: threshold crossed (n=1)
     }

  -> * finding: effect is real for at least one user
  -> ~ hypothesis: might generalize broadly
  -> ! action: need more data before claiming universality
}

# * = high confidence, ~ = uncertain, ! = urgent
# Certainty tracked structurally, not assumed.`}
        </div>

        <h3>Metaprogramming: workflow definitions</h3>
        <p>
          FlowScript enables executable conversation protocols &mdash; patterns
          that go beyond notation into something closer to programming.
        </p>
        <div className="code-block">
{`# Branching decisions
? convert remaining system files to FlowScript?
  || yes = action: execute conversion + test
  || no = action: discuss why we shouldn't

[decided(rationale: "systematic conversion improves continuity")]
yes -> proceed with conversion

# Workflow as temporal chain
{spec sync verification}
=> {add new content sections <- verified against source}
=> {update files}
=> {test fresh load -> validates OR reveals drift}
=> {validate OR revert}

# State machine
[exploring] initial investigation
-> evidence gathered
-> [decided(rationale: "data supports")] commit to direction
-> [blocked(reason: "waiting on API keys")] stalled
-> API keys arrived
-> \u2713 execution complete`}
        </div>

        <h3>Compression through hierarchy</h3>
        <div className="code-block">
{`# Before (verbose prose):
"We discussed whether to buy the flowscript.org domain. The cost
would be about $12 per year which is minimal. However, it signals
premature commitment before we've validated the idea publicly. We
could register it later if traction. For now, we decided to hold
off until after we share publicly and see if anyone cares."

# After (FlowScript - 75% smaller, queryable):
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

      {/* ================================================================
          6. THE DEEPER STRUCTURE
          ================================================================ */}
      <section className="learn-section" id="deeper-structure">
        <h2>The deeper structure</h2>
        <p>
          Everything above describes what FlowScript <em>does</em>. This section
          is about what it <em>is</em>, and why that matters beyond any single application.
        </p>

        <h3>Notation expands the space of possible thought</h3>
        <p>
          Musical notation didn't record what musicians were already playing. Before staff
          notation, European music was monophonic &mdash; single melodies, loosely coordinated.
          Notation made polyphony possible. Bach's fugues are literally unthinkable without it
          &mdash; not "hard to remember" but impossible to <em>compose</em>, because the
          simultaneous interaction of independent voices requires a representational system
          precise enough to reason about counterpoint.
        </p>
        <p>
          FlowScript does the same thing for structured reasoning. It makes a category of
          analysis possible where you hold multiple reasoning chains simultaneously, query
          across causal paths, and turn contradictions into typed tensions instead of silent
          overwrites. This category of reasoning is impossible in the vector-search paradigm
          because vector search has no representation for <em>why</em>.
        </p>

        <h3>Types make malformed reasoning unrepresentable</h3>
        <p>
          Every decision traces to a question through alternatives. Every contradiction
          becomes a typed tension with a named axis. Every state change gets an audited
          reason. These constraints give FlowScript a property familiar from type theory:
          {" "}<strong>well-typedness implies safety.</strong> A well-formed graph can always be
          queried &mdash; no stuck states, no silent contradictions, no untraceable decisions.
        </p>

        <h3>Compression reveals structure that verbosity hides</h3>
        <p>
          When you force reasoning through typed encoding, you force the extraction of
          structure that would otherwise remain implicit. This maps to a deep result in
          information theory: the minimum description of a dataset <em>is</em> its structure.
          Optimal compression and genuine understanding are the same operation.
        </p>
        <p>
          FlowScript's temporal tiers implement this: each consolidation cycle distills
          signal from noise, and the resulting structure is more useful than the verbose
          original. After enough cycles, what remains is a compressed knowledge base where
          the <em>shape</em> of the reasoning is the value.
        </p>

        <h3>Deletion is irrational</h3>
        <p>
          <a href="https://arxiv.org/abs/2603.17244" target="_blank" rel="noopener noreferrer">
            Recent work in formal epistemology
          </a>{" "}
          applied AGM belief revision postulates &mdash; the mathematical framework for
          rational belief change &mdash; and proved that deletion violates core rationality
          requirements. When you delete a contradicted memory, you destroy information that
          the formal framework says a rational agent must preserve. FlowScript's
          RELATE &gt; DELETE approach satisfies these postulates.
        </p>

        <h3>The metacognitive loop</h3>
        <p>
          When an AI agent writes FlowScript, queries its own reasoning graph, discovers
          tensions or gaps, and generates new reasoning informed by that structure &mdash;
          it's not just remembering. It's reasoning about its own reasoning through a typed,
          queryable substrate. This is metacognition, and it's the category of thought that
          typed notation makes possible.
        </p>

        <h3>Infrastructure, not a tool</h3>
        <p>
          SQL gave us queryable data. TCP/IP gave us addressable communication. Git gave
          us trackable changes. FlowScript gives structured reasoning a notation that makes
          it computable. The applications are what you use FlowScript for. The infrastructure
          is why it matters.
        </p>
      </section>

      {/* Next Steps */}
      <section className="learn-section learn-cta">
        <h2>Try it</h2>
        <p>
          The{" "}
          <Link to="/playground">interactive playground</Link>{" "}
          has a live FlowScript editor with D3 graph visualization and query execution.
          Write some FlowScript and watch the reasoning graph form.
        </p>
        <p>
          The full specification, parser source, and golden examples are in the{" "}
          <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer">
            GitHub repository
          </a>.
        </p>
        <div className="hero-actions">
          <Link to="/playground" className="btn btn-primary">Open Playground</Link>
          <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
