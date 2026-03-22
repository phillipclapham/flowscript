/**
 * FlowScript Playground Page
 * Interactive editor with D3 graph visualization and query engine.
 * Migrated from original App.tsx — this is the existing interactive demo.
 */

import { useState, useEffect, useMemo } from "react";
import { Editor } from "../components/Editor";
import { GraphPreview } from "../components/GraphPreview";
import { QueryPanel } from "../components/QueryPanel";
import { CompilePanel } from "../components/CompilePanel";
import { LineWrapToggle } from "../components/LineWrapToggle";
import { useTheme } from "../lib/theme/useTheme";
import { parseFlowScript } from "../utils/fullFlowScriptParser";
import "./Playground.css";

// Example FlowScript content — shows compound value over multiple sessions.
// Each section represents decisions that accumulated over weeks, with
// temporal evolution, resolved blockers, and tensions discovered over time.
const EXAMPLE_FLOWSCRIPT = `# SaaS Project: 6 Weeks of Agent Memory
# This is what your project's reasoning looks like after real use.
# Decisions graduate through tiers. Tensions emerge over time.
# Blockers get resolved. Knowledge compounds.

# ── Week 1: Architecture foundations ──────────────────

? {decision: Primary database for user data?}
  || PostgreSQL
     -> ACID compliance for payments
     -> team expertise
     -> [decided(rationale: "payment transactions require strict consistency, team has 5 years PostgreSQL experience", on: "2026-02-03")]
  || MongoDB
     -> flexible schema for user profiles
     -> faster iteration on data model

? {decision: Authentication approach?}
  || Build custom JWT auth
     -> full control over token lifecycle
  || Auth0
     -> faster to ship, SOC2 out of the box
     -> [decided(rationale: "getting to market matters more than auth customization, can migrate later", on: "2026-02-05")]

thought: "can migrate later" decisions should be tracked — they become technical debt if forgotten
  -> Auth0 chosen for now

✓ Auth0 tenant configured
✓ social login working

# ── Week 2: New info challenges early choices ─────────

thought: user profile queries are getting complex — PostgreSQL JSON columns are clumsy for nested preferences
  -> revisiting schema flexibility

? {decision: Add a document store for profiles?}
  || Keep everything in PostgreSQL (JSON columns)
  || Add DynamoDB for profile data only
     -> [decided(rationale: "profiles are read-heavy, rarely join with payment data — separate store is cleaner", on: "2026-02-12")]

PostgreSQL for payments ><[consistency vs operational complexity] DynamoDB for profiles
  -> now maintaining two databases instead of one
  -> ! data sync between stores needs careful handling
  -> deploy team needs DynamoDB expertise

[blocked(reason: "DynamoDB IAM roles not provisioned yet", since: "2026-02-13")]
! profile migration script
  -> blocks user settings feature
     -> delays beta invites

# ── Week 3: Blockers resolved, new tensions ───────────

✓ DynamoDB IAM roles provisioned
✓ profile migration script shipped — 50k users migrated
✓ beta invites sent

thought: Auth0 rate limits are hitting us at scale — 1000 req/min on the free tier
  -> enterprise tier is $23k/year
     -> ! contradicts "faster to market" rationale — now we're locked in AND paying enterprise rates

Auth0 speed-to-market ><[short-term velocity vs long-term cost] custom auth independence
  -> switching back to custom auth now would cost 3-4 weeks
  -> staying means $23k/year and rate limit dependency
  -> ! this is the "migrate later" debt from Week 1 materializing

[blocked(reason: "Auth0 enterprise contract requires legal review", since: "2026-02-21")]
! scaling beyond 1000 users
  -> blocks public launch
     -> delays revenue

# ── Week 4-5: Patterns emerge, knowledge graduates ───

thought: the "migrate later" pattern has burned us twice now (Auth0 + data layer)
  -> * decision principle: if migration cost grows with usage, decide upfront
     <- Auth0 lock-in + DynamoDB operational overhead both trace back to "ship fast, fix later"

~ exploring: could we use Supabase to replace both PostgreSQL + Auth0?
  <- PostgreSQL under the hood (preserves ACID)
  <- built-in auth (eliminates Auth0 dependency)
  <- row-level security (reduces custom auth code)
  -> worth a proof-of-concept after public launch
     -> would consolidate 3 services into 1

✓ Auth0 enterprise contract signed (pragmatic, not ideal)
✓ public launch shipped — 2,400 users first week
✓ payment processing stable on PostgreSQL

# ── Week 6: Current session ───────────────────────────

thought: Supabase PoC results are promising — auth + database + realtime in one platform
  -> migration path exists but timing matters
     -> ! don't migrate during growth phase (learned from Week 2 disruption)

action: schedule Supabase migration for Q3 (post-Series A)
action: document Auth0 workarounds for rate limiting (knowledge base)
action: review all "migrate later" decisions quarterly
`;

type EditorTab = 'editor' | 'convert';

export function Playground() {
  const [code, setCode] = useState(EXAMPLE_FLOWSCRIPT);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 0 });
  const [activeTab, setActiveTab] = useState<EditorTab>('editor');
  const { theme } = useTheme();
  const [lineWrapping, setLineWrapping] = useState(() => {
    const stored = localStorage.getItem("flowscript-line-wrap");
    return stored !== "false";
  });

  useEffect(() => {
    localStorage.setItem("flowscript-line-wrap", String(lineWrapping));
  }, [lineWrapping]);

  const handleCursorChange = (line: number, col: number) => {
    setCursorPos({ line, col });
  };

  const toggleLineWrapping = () => {
    setLineWrapping((prev) => !prev);
  };

  const parseResult = useMemo(() => parseFlowScript(code), [code]);
  const ir = parseResult.ir || null;
  const parseError = parseResult.error?.message || null;

  return (
    <div className="playground">
      <div className="playground-toolbar">
        <LineWrapToggle enabled={lineWrapping} onToggle={toggleLineWrapping} />
        <span className="cursor-position">
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
      </div>

      <div className="playground-content">
        {/* Editor Panel */}
        <div className="panel editor-panel">
          <div className="panel-header">
            <div className="editor-tabs">
              <button
                className={`editor-tab ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                Editor
              </button>
              <button
                className={`editor-tab ${activeTab === 'convert' ? 'active' : ''}`}
                onClick={() => setActiveTab('convert')}
              >
                Convert
              </button>
            </div>
            <span className="panel-subtitle">
              {activeTab === 'editor' ? 'FlowScript v1.1 — 21 markers' : 'Natural language → FlowScript'}
            </span>
          </div>
          <div className="panel-content">
            {activeTab === 'editor' ? (
              <Editor
                initialValue={code}
                onChange={setCode}
                onCursorChange={handleCursorChange}
                lineWrapping={lineWrapping}
                theme={theme}
              />
            ) : (
              <CompilePanel
                onCompiled={(flowscript) => {
                  setCode(flowscript);
                  setActiveTab('editor');
                }}
              />
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="panel preview-panel">
          <div className="panel-header">
            <h2>Preview</h2>
            <span className="panel-subtitle">Graph + Query Engine</span>
          </div>
          <div className="panel-content">
            <div className="preview-tabs">
              <GraphPreview ir={ir} parseError={parseError} />
              <QueryPanel ir={ir} parseError={parseError} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
