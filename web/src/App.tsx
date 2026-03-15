/**
 * FlowScript Web Application
 *
 * Session 7a: Editor Core + Syntax Highlighting
 * Session 7a.5: Theme System + UX Polish
 */

import { useState, useEffect, useMemo } from "react";
import { Editor } from "./components/Editor";
import { GraphPreview } from "./components/GraphPreview";
import { QueryPanel } from "./components/QueryPanel";
import { CompilePanel } from "./components/CompilePanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { LineWrapToggle } from "./components/LineWrapToggle";
import { useTheme } from "./lib/theme/useTheme";
import { parseFlowScript } from "./utils/fullFlowScriptParser";
import "./App.css";

// Example FlowScript content
const EXAMPLE_FLOWSCRIPT = `# Agent Memory — Platform Migration

? {decision: Which database for the new session service?}
  || PostgreSQL
     -> mature ecosystem and tooling
     -> team already knows it
     + strong ACID guarantees
  || Redis
     -> sub-millisecond reads
     -> natural fit for session data (TTL built-in)
     -> [decided(rationale: "session data is ephemeral, speed matters more than durability", on: "2026-03-10")]

? {decision: How should we handle the API versioning?}
  || URL path versioning (/v1/, /v2/)
     -> simple to understand
     -> breaks caching across versions
  || Header-based versioning
     -> cleaner URLs
     -> harder to test in browser
     -> [decided(rationale: "API gateway handles header routing, keeps URLs stable for clients", on: "2026-03-12")]

thought: sessions are fundamentally temporary — optimizing for durability is solving the wrong problem
  -> Redis chosen for sessions
     -> deploy Redis cluster by end of sprint
        -> update connection pooling config
           -> run load tests against staging
              -> ! validate p99 latency under 5ms

* user preferences must remain in PostgreSQL
  <- requires ACID for billing-linked settings

[blocked(reason: "waiting on Redis cluster provisioning", since: "2026-03-11")]
! auth service depends on session store
  -> blocks login flow rollout
     -> delays beta launch

[blocked(reason: "versioning strategy not yet implemented in gateway", since: "2026-03-13")]
! API docs generation
  -> blocks developer onboarding
     -> delays partner integrations

speed ><[performance vs consistency] data safety
  -> Redis replication is async (small window of data loss possible)
  -> ! never store payment data in Redis

developer experience ><[simplicity vs flexibility] operational cost
  -> simpler APIs = faster onboarding
  -> flexible APIs = more support burden

~ exploring: could Redis Streams replace our Kafka setup?
  <- similar pub/sub model but simpler ops
  -> worth prototyping after migration ships
     -> would reduce infrastructure cost by 30%

✓ connection pooling library evaluated
✓ staging environment provisioned
✓ team aligned on migration approach

action: write migration runbook before proceeding
action: schedule downtime window with SRE team
`;

type EditorTab = 'editor' | 'convert';

function App() {
  const [code, setCode] = useState(EXAMPLE_FLOWSCRIPT);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 0 });
  const [activeTab, setActiveTab] = useState<EditorTab>('editor');
  const { theme } = useTheme();
  const [lineWrapping, setLineWrapping] = useState(() => {
    // Load from localStorage, default to true
    const stored = localStorage.getItem("flowscript-line-wrap");
    return stored !== "false"; // Default true
  });

  // Persist line wrapping preference
  useEffect(() => {
    localStorage.setItem("flowscript-line-wrap", String(lineWrapping));
  }, [lineWrapping]);

  const handleCursorChange = (line: number, col: number) => {
    setCursorPos({ line, col });
  };

  const toggleLineWrapping = () => {
    setLineWrapping((prev) => !prev);
  };

  // Single parse for both graph and query panel (no double-parsing)
  const parseResult = useMemo(() => parseFlowScript(code), [code]);
  const ir = parseResult.ir || null;
  const parseError = parseResult.error?.message || null;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon">⚡</span>
            FlowScript
          </h1>
          <p className="tagline">AI Memory Infrastructure</p>
          <div className="header-actions">
            <LineWrapToggle enabled={lineWrapping} onToggle={toggleLineWrapping} />
            <ThemeToggle />
            <span className="cursor-position">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
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
              {activeTab === 'editor' ? 'FlowScript v1.0 - 21 markers' : 'Natural language → FlowScript'}
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
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          FlowScript v1.0 · AI Memory Infrastructure
        </p>
        <p className="footer-links">
          <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
