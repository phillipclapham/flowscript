/**
 * FlowScript Web Application
 *
 * Session 7a: Editor Core + Syntax Highlighting
 */

import { useState } from "react";
import { Editor } from "./components/Editor";
import { GraphPreview } from "./components/GraphPreview";
import { QueryPanel } from "./components/QueryPanel";
import "./App.css";

// Example FlowScript content
const EXAMPLE_FLOWSCRIPT = `# FlowScript Example - AI Memory Infrastructure

? {goal: Prove FlowScript as memory infrastructure}
  || Build better prompts
     -> easier for users
     -> limited impact
  || Build memory infrastructure
     -> enables cognitive symbiosis
     -> proves architectural readiness
     -> [decided(rationale: "evidence from 6 architectures validates approach", on: "2025-10-24")]

thought: FlowScript isn't notation - it's computable substrate for memory

* Cross-architecture validation
  -> 6 AI systems spontaneously parsed FlowScript
  -> convergent insights across architectures
  -> universal comprehension (not model-specific)

! Memory-ready architecture:
  -> content-hash IDs = automatic deduplication
  -> provenance tracking = trust + audit
  -> schema validation = invariants enforced
  -> state markers = lifecycle automation
  -> relationship types = computational operations

speed ><[velocity vs maintainability] careful design
  -> must balance shipping vs quality
  -> ! quality NON-NEGOTIABLE for infrastructure

Phase 7 = Memory Infrastructure Launch
  => Session 7a: Editor Core (7-8h)
  => Session 7b: Graph Preview (6-7h)
  => Session 7c: Linter + Queries (6-7h)
  => Session 7d: Multi-Layer Showcase (9-11h)
  => Session 7e: Tutorial + Deploy (5-6h)
  => Session 7f: Research Papers + Launch (16-20h)

✓ Foundation complete (214/214 tests passing)
✓ Query engine working (<1ms performance)
~ Third Mind hypothesis [EVIDENCED] - needs multi-user validation

action: Build production-ready web app with perfect syntax highlighting

@project FlowScript v1.0
`;

function App() {
  const [code, setCode] = useState(EXAMPLE_FLOWSCRIPT);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 0 });

  const handleCursorChange = (line: number, col: number) => {
    setCursorPos({ line, col });
  };

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
            <h2>Editor</h2>
            <span className="panel-subtitle">FlowScript v1.0 - 21 markers</span>
          </div>
          <div className="panel-content">
            <Editor
              initialValue={code}
              onChange={setCode}
              onCursorChange={handleCursorChange}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="panel preview-panel">
          <div className="panel-header">
            <h2>Preview</h2>
            <span className="panel-subtitle">Coming in Session 7b & 7c</span>
          </div>
          <div className="panel-content">
            <div className="preview-tabs">
              <GraphPreview flowScriptCode={code} />
              <QueryPanel flowScriptCode={code} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Session 7a: Editor Core + Syntax Highlighting ✓
        </p>
        <p className="footer-links">
          <a href="https://github.com/anthropics/flowscript" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {" · "}
          <a href="/docs" target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
