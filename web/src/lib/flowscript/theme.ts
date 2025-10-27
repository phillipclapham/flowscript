/**
 * FlowScript Syntax Highlighting Theme
 *
 * Uses CSS custom properties for theme support (light/dark modes)
 * Actual color values set in App.css via data-theme attribute
 */

import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * Custom styles for FlowScript tokens
 * Uses CSS variables that respond to data-theme attribute
 *
 * Note: We use CSS classes only (not tag-based highlighting)
 * because our tokenizer returns custom class names directly
 */
const flowScriptStyles = EditorView.theme({
  // Core Relations
  ".cm-flowscript-causal": {
    color: "var(--color-causal)",
    fontWeight: "600"
  },
  ".cm-flowscript-temporal": {
    color: "var(--color-temporal)",
    fontWeight: "600"
  },
  ".cm-flowscript-reverse-causal": {
    color: "var(--color-reverse-causal)",
    fontWeight: "600"
  },
  ".cm-flowscript-bidirectional": {
    color: "var(--color-bidirectional)",
    fontWeight: "600"
  },
  ".cm-flowscript-tension": {
    color: "var(--color-tension)",
    fontWeight: "700"
  },
  ".cm-flowscript-axis-label": {
    color: "var(--color-axis-label)",
    fontStyle: "italic"
  },

  // Definition Operators
  ".cm-flowscript-equivalent": {
    color: "var(--color-equivalent)",
    fontWeight: "600"
  },
  ".cm-flowscript-not-equivalent": {
    color: "var(--color-not-equivalent)",
    fontWeight: "600"
  },

  // State Markers
  ".cm-flowscript-decided": {
    color: "var(--color-decided)",
    fontWeight: "700",
    backgroundColor: "var(--color-decided-bg)",
    padding: "0 4px",
    borderRadius: "3px"
  },
  ".cm-flowscript-exploring": {
    color: "var(--color-exploring)",
    fontWeight: "700",
    backgroundColor: "var(--color-exploring-bg)",
    padding: "0 4px",
    borderRadius: "3px"
  },
  ".cm-flowscript-blocked": {
    color: "var(--color-blocked)",
    fontWeight: "700",
    backgroundColor: "var(--color-blocked-bg)",
    padding: "0 4px",
    borderRadius: "3px"
  },
  ".cm-flowscript-parking": {
    color: "var(--color-parking)",
    fontWeight: "700",
    backgroundColor: "var(--color-parking-bg)",
    padding: "0 4px",
    borderRadius: "3px"
  },

  // Insights & Questions
  ".cm-flowscript-thought": {
    color: "var(--color-thought)",
    fontWeight: "600"
  },
  ".cm-flowscript-question": {
    color: "var(--color-question)",
    fontWeight: "700",
    fontSize: "1.1em"
  },
  ".cm-flowscript-completed": {
    color: "var(--color-completed)",
    fontWeight: "700",
    fontSize: "1.1em"
  },
  ".cm-flowscript-alternative": {
    color: "var(--color-alternative)",
    fontWeight: "600"
  },

  // Commands
  ".cm-flowscript-action": {
    color: "var(--color-action)",
    fontWeight: "600"
  },

  // Modifiers
  ".cm-flowscript-urgent": {
    color: "var(--color-urgent)",
    fontWeight: "700",
    fontSize: "1.05em"
  },
  ".cm-flowscript-positive": {
    color: "var(--color-positive)",
    fontWeight: "700"
  },
  ".cm-flowscript-confident": {
    color: "var(--color-confident)",
    fontWeight: "600"
  },
  ".cm-flowscript-uncertain": {
    color: "var(--color-uncertain)",
    fontWeight: "500",
    fontStyle: "italic"
  },

  // Structure
  ".cm-flowscript-brace": {
    color: "var(--color-brace)",
    fontWeight: "600"
  },
  ".cm-flowscript-bracket": {
    color: "var(--color-bracket)",
    fontWeight: "600"
  },
  ".cm-flowscript-scope": {
    color: "var(--color-scope)",
    fontWeight: "600",
    backgroundColor: "var(--color-scope-bg)",
    padding: "0 4px",
    borderRadius: "3px"
  },

  // Comments
  ".cm-flowscript-comment": {
    color: "var(--color-comment)",
    fontStyle: "italic",
    opacity: "0.7"
  },

  // General editor styles
  "&.cm-editor": {
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
  },

  ".cm-content": {
    lineHeight: "1.7",
    padding: "8px 0",
  },

  ".cm-line": {
    padding: "0 12px",
  },

  ".cm-gutters": {
    backgroundColor: "var(--editor-gutter-bg)",
    borderRight: "1px solid var(--editor-gutter-border)",
    color: "var(--text-muted)",
  },

  ".cm-activeLineGutter": {
    backgroundColor: "var(--editor-active-line-gutter)",
  },

  ".cm-activeLine": {
    backgroundColor: "var(--editor-active-line)",
    marginRight: "-1px", // Fix: prevent overflow past editor border
  },

  ".cm-selectionBackground, ::selection": {
    backgroundColor: "var(--editor-selection) !important",
  },

  ".cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--editor-selection-focused) !important",
  },

  ".cm-cursor": {
    borderLeftColor: "var(--editor-cursor)",
    borderLeftWidth: "2px",
  },
});

/**
 * Complete FlowScript theme extension
 * Returns CSS-based styling for FlowScript tokens
 */
export function flowScriptTheme(): Extension {
  return flowScriptStyles;
}
