/**
 * FlowScript Syntax Highlighting Theme
 *
 * Semantic colors for the 21 FlowScript markers.
 * Colors follow cognitive semantics and WCAG AA contrast guidelines.
 */

import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * Semantic color palette for FlowScript markers
 *
 * Design principles:
 * - Readability first (WCAG AA contrast)
 * - Semantic colors (causal = blue, temporal = purple, etc.)
 * - Professional (not garish)
 * - Accessible (distinguishable by non-color-blind users)
 */
const colors = {
  // Core Relations
  causal: "#3b82f6",           // Blue - cause & effect
  temporal: "#8b5cf6",         // Purple - time sequence
  reverseCausal: "#0ea5e9",    // Sky blue - reverse flow
  bidirectional: "#06b6d4",    // Cyan - mutual influence
  tension: "#f59e0b",          // Amber - conflict/tradeoff
  axisLabel: "#d97706",        // Dark amber - tension axis

  // Definition Operators
  equivalent: "#10b981",       // Green - equivalence
  notEquivalent: "#ef4444",    // Red - distinction

  // State Markers
  decided: "#22c55e",          // Bright green - committed
  exploring: "#fbbf24",        // Yellow - investigating
  blocked: "#dc2626",          // Dark red - blocked
  parking: "#94a3b8",          // Slate - deferred

  // Insights & Questions
  thought: "#a855f7",          // Bright purple - insight
  question: "#f97316",         // Orange - question
  completed: "#059669",        // Dark green - done
  alternative: "#64748b",      // Gray - option

  // Commands
  action: "#0284c7",           // Blue-600 - action

  // Modifiers
  urgent: "#dc2626",           // Red - urgent
  positive: "#16a34a",         // Green-600 - positive
  confident: "#7c3aed",        // Violet-600 - confident
  uncertain: "#9ca3af",        // Gray-400 - uncertain

  // Structure
  brace: "#6b7280",            // Gray-500 - structure
  bracket: "#6b7280",          // Gray-500 - structure
  scope: "#06b6d4",            // Cyan - scope

  // Comments
  comment: "#9ca3af",          // Gray-400 - comment
} as const;

/**
 * FlowScript highlighting styles
 */
const flowScriptHighlighting = HighlightStyle.define([
  // Core Relations
  { tag: tags.atom, color: colors.causal },
  { tag: tags.propertyName, color: colors.temporal },

  // We'll use custom classes for FlowScript-specific tokens
  // These are applied via the tokenizer
]);

/**
 * Custom styles for FlowScript tokens
 * Applied via CSS classes that match our token types
 */
const flowScriptStyles = EditorView.theme({
  // Core Relations
  ".cm-flowscript-causal": { color: colors.causal, fontWeight: "600" },
  ".cm-flowscript-temporal": { color: colors.temporal, fontWeight: "600" },
  ".cm-flowscript-reverse-causal": { color: colors.reverseCausal, fontWeight: "600" },
  ".cm-flowscript-bidirectional": { color: colors.bidirectional, fontWeight: "600" },
  ".cm-flowscript-tension": { color: colors.tension, fontWeight: "700" },
  ".cm-flowscript-axis-label": { color: colors.axisLabel, fontStyle: "italic" },

  // Definition Operators
  ".cm-flowscript-equivalent": { color: colors.equivalent, fontWeight: "600" },
  ".cm-flowscript-not-equivalent": { color: colors.notEquivalent, fontWeight: "600" },

  // State Markers
  ".cm-flowscript-decided": { color: colors.decided, fontWeight: "700", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "0 4px", borderRadius: "3px" },
  ".cm-flowscript-exploring": { color: colors.exploring, fontWeight: "700", backgroundColor: "rgba(251, 191, 36, 0.1)", padding: "0 4px", borderRadius: "3px" },
  ".cm-flowscript-blocked": { color: colors.blocked, fontWeight: "700", backgroundColor: "rgba(220, 38, 38, 0.1)", padding: "0 4px", borderRadius: "3px" },
  ".cm-flowscript-parking": { color: colors.parking, fontWeight: "700", backgroundColor: "rgba(148, 163, 184, 0.1)", padding: "0 4px", borderRadius: "3px" },

  // Insights & Questions
  ".cm-flowscript-thought": { color: colors.thought, fontWeight: "600" },
  ".cm-flowscript-question": { color: colors.question, fontWeight: "700", fontSize: "1.1em" },
  ".cm-flowscript-completed": { color: colors.completed, fontWeight: "700", fontSize: "1.1em" },
  ".cm-flowscript-alternative": { color: colors.alternative, fontWeight: "600" },

  // Commands
  ".cm-flowscript-action": { color: colors.action, fontWeight: "600" },

  // Modifiers
  ".cm-flowscript-urgent": { color: colors.urgent, fontWeight: "700", fontSize: "1.05em" },
  ".cm-flowscript-positive": { color: colors.positive, fontWeight: "700" },
  ".cm-flowscript-confident": { color: colors.confident, fontWeight: "600" },
  ".cm-flowscript-uncertain": { color: colors.uncertain, fontWeight: "500", fontStyle: "italic" },

  // Structure
  ".cm-flowscript-brace": { color: colors.brace, fontWeight: "600" },
  ".cm-flowscript-bracket": { color: colors.bracket, fontWeight: "600" },
  ".cm-flowscript-scope": { color: colors.scope, fontWeight: "600", backgroundColor: "rgba(6, 182, 212, 0.1)", padding: "0 4px", borderRadius: "3px" },

  // Comments
  ".cm-flowscript-comment": { color: colors.comment, fontStyle: "italic", opacity: "0.7" },

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
    backgroundColor: "#f9fafb",
    borderRight: "1px solid #e5e7eb",
    color: "#6b7280",
  },

  ".cm-activeLineGutter": {
    backgroundColor: "#f3f4f6",
  },

  ".cm-activeLine": {
    backgroundColor: "#f9fafb",
  },

  ".cm-selectionBackground, ::selection": {
    backgroundColor: "#dbeafe !important",
  },

  ".cm-focused .cm-selectionBackground": {
    backgroundColor: "#bfdbfe !important",
  },

  ".cm-cursor": {
    borderLeftColor: "#3b82f6",
    borderLeftWidth: "2px",
  },
});

/**
 * Complete FlowScript theme extension
 * Includes both highlighting and visual styles
 */
export function flowScriptTheme(): Extension {
  return [
    syntaxHighlighting(flowScriptHighlighting),
    flowScriptStyles,
  ];
}

/**
 * Export colors for use in other components
 */
export { colors as flowScriptColors };
