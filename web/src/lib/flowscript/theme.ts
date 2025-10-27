/**
 * FlowScript Syntax Highlighting Themes
 *
 * Creates light and dark themes with actual color values
 * (CodeMirror's EditorView.theme() doesn't work with CSS variables)
 */

import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { lightColors, darkColors } from "../theme/colors";

/**
 * Light theme for FlowScript
 * Uses saturated colors on white background
 */
export function createLightTheme(): Extension {
  return EditorView.theme({
    // Core Relations
    ".cm-flowscript-causal": {
      color: lightColors.causal,
      fontWeight: "600"
    },
    ".cm-flowscript-temporal": {
      color: lightColors.temporal,
      fontWeight: "600"
    },
    ".cm-flowscript-reverse-causal": {
      color: lightColors.reverseCausal,
      fontWeight: "600"
    },
    ".cm-flowscript-bidirectional": {
      color: lightColors.bidirectional,
      fontWeight: "600"
    },
    ".cm-flowscript-tension": {
      color: lightColors.tension,
      fontWeight: "700"
    },
    ".cm-flowscript-axis-label": {
      color: lightColors.axisLabel,
      fontStyle: "italic"
    },

    // Definition Operators
    ".cm-flowscript-equivalent": {
      color: lightColors.equivalent,
      fontWeight: "600"
    },
    ".cm-flowscript-not-equivalent": {
      color: lightColors.notEquivalent,
      fontWeight: "600"
    },

    // State Markers
    ".cm-flowscript-decided": {
      color: lightColors.decided,
      fontWeight: "700",
      backgroundColor: lightColors.decidedBg,
      padding: "0 4px",
      borderRadius: "3px"
    },
    ".cm-flowscript-exploring": {
      color: lightColors.exploring,
      fontWeight: "700",
      backgroundColor: lightColors.exploringBg,
      padding: "0 4px",
      borderRadius: "3px"
    },
    ".cm-flowscript-blocked": {
      color: lightColors.blocked,
      fontWeight: "700",
      backgroundColor: lightColors.blockedBg,
      padding: "0 4px",
      borderRadius: "3px"
    },
    ".cm-flowscript-parking": {
      color: lightColors.parking,
      fontWeight: "700",
      backgroundColor: lightColors.parkingBg,
      padding: "0 4px",
      borderRadius: "3px"
    },

    // Insights & Questions
    ".cm-flowscript-thought": {
      color: lightColors.thought,
      fontWeight: "600"
    },
    ".cm-flowscript-question": {
      color: lightColors.question,
      fontWeight: "700",
      fontSize: "1.1em"
    },
    ".cm-flowscript-completed": {
      color: lightColors.completed,
      fontWeight: "700",
      fontSize: "1.1em"
    },
    ".cm-flowscript-alternative": {
      color: lightColors.alternative,
      fontWeight: "600"
    },

    // Commands
    ".cm-flowscript-action": {
      color: lightColors.action,
      fontWeight: "600"
    },

    // Modifiers
    ".cm-flowscript-urgent": {
      color: lightColors.urgent,
      fontWeight: "700",
      fontSize: "1.05em"
    },
    ".cm-flowscript-positive": {
      color: lightColors.positive,
      fontWeight: "700"
    },
    ".cm-flowscript-confident": {
      color: lightColors.confident,
      fontWeight: "600"
    },
    ".cm-flowscript-uncertain": {
      color: lightColors.uncertain,
      fontWeight: "500",
      fontStyle: "italic"
    },

    // Structure
    ".cm-flowscript-brace": {
      color: lightColors.brace,
      fontWeight: "600"
    },
    ".cm-flowscript-bracket": {
      color: lightColors.bracket,
      fontWeight: "600"
    },
    ".cm-flowscript-scope": {
      color: lightColors.scope,
      fontWeight: "600",
      backgroundColor: lightColors.scopeBg,
      padding: "0 4px",
      borderRadius: "3px"
    },

    // Comments
    ".cm-flowscript-comment": {
      color: lightColors.comment,
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
      backgroundColor: lightColors.gutterBg,
      borderRight: `1px solid ${lightColors.gutterBorder}`,
      color: lightColors.textMuted,
    },

    ".cm-activeLineGutter": {
      backgroundColor: lightColors.activeLineGutter,
    },

    ".cm-activeLine": {
      backgroundColor: lightColors.activeLine,
      marginRight: "-1px", // Fix: prevent overflow past editor border
    },

    ".cm-selectionBackground, ::selection": {
      backgroundColor: `${lightColors.selection} !important`,
    },

    ".cm-focused .cm-selectionBackground": {
      backgroundColor: `${lightColors.selectionFocused} !important`,
    },

    ".cm-cursor": {
      borderLeftColor: lightColors.cursor,
      borderLeftWidth: "2px",
    },
  });
}

/**
 * Dark theme for FlowScript
 * Uses desaturated, lighter colors on dark background
 */
export function createDarkTheme(): Extension {
  return EditorView.theme({
    // Core Relations
    ".cm-flowscript-causal": {
      color: darkColors.causal,
      fontWeight: "600"
    },
    ".cm-flowscript-temporal": {
      color: darkColors.temporal,
      fontWeight: "600"
    },
    ".cm-flowscript-reverse-causal": {
      color: darkColors.reverseCausal,
      fontWeight: "600"
    },
    ".cm-flowscript-bidirectional": {
      color: darkColors.bidirectional,
      fontWeight: "600"
    },
    ".cm-flowscript-tension": {
      color: darkColors.tension,
      fontWeight: "700"
    },
    ".cm-flowscript-axis-label": {
      color: darkColors.axisLabel,
      fontStyle: "italic"
    },

    // Definition Operators
    ".cm-flowscript-equivalent": {
      color: darkColors.equivalent,
      fontWeight: "600"
    },
    ".cm-flowscript-not-equivalent": {
      color: darkColors.notEquivalent,
      fontWeight: "600"
    },

    // State Markers
    ".cm-flowscript-decided": {
      color: darkColors.decided,
      fontWeight: "700",
      backgroundColor: darkColors.decidedBg,
      padding: "0 4px",
      borderRadius: "3px"
    },
    ".cm-flowscript-exploring": {
      color: darkColors.exploring,
      fontWeight: "700",
      backgroundColor: darkColors.exploringBg,
      padding: "0 4px",
      borderRadius: "3px"
    },
    ".cm-flowscript-blocked": {
      color: darkColors.blocked,
      fontWeight: "700",
      backgroundColor: darkColors.blockedBg,
      padding: "0 4px",
      borderRadius: "3px"
    },
    ".cm-flowscript-parking": {
      color: darkColors.parking,
      fontWeight: "700",
      backgroundColor: darkColors.parkingBg,
      padding: "0 4px",
      borderRadius: "3px"
    },

    // Insights & Questions
    ".cm-flowscript-thought": {
      color: darkColors.thought,
      fontWeight: "600"
    },
    ".cm-flowscript-question": {
      color: darkColors.question,
      fontWeight: "700",
      fontSize: "1.1em"
    },
    ".cm-flowscript-completed": {
      color: darkColors.completed,
      fontWeight: "700",
      fontSize: "1.1em"
    },
    ".cm-flowscript-alternative": {
      color: darkColors.alternative,
      fontWeight: "600"
    },

    // Commands
    ".cm-flowscript-action": {
      color: darkColors.action,
      fontWeight: "600"
    },

    // Modifiers
    ".cm-flowscript-urgent": {
      color: darkColors.urgent,
      fontWeight: "700",
      fontSize: "1.05em"
    },
    ".cm-flowscript-positive": {
      color: darkColors.positive,
      fontWeight: "700"
    },
    ".cm-flowscript-confident": {
      color: darkColors.confident,
      fontWeight: "600"
    },
    ".cm-flowscript-uncertain": {
      color: darkColors.uncertain,
      fontWeight: "500",
      fontStyle: "italic"
    },

    // Structure
    ".cm-flowscript-brace": {
      color: darkColors.brace,
      fontWeight: "600"
    },
    ".cm-flowscript-bracket": {
      color: darkColors.bracket,
      fontWeight: "600"
    },
    ".cm-flowscript-scope": {
      color: darkColors.scope,
      fontWeight: "600",
      backgroundColor: darkColors.scopeBg,
      padding: "0 4px",
      borderRadius: "3px"
    },

    // Comments
    ".cm-flowscript-comment": {
      color: darkColors.comment,
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
      backgroundColor: darkColors.gutterBg,
      borderRight: `1px solid ${darkColors.gutterBorder}`,
      color: darkColors.textMuted,
    },

    ".cm-activeLineGutter": {
      backgroundColor: darkColors.activeLineGutter,
    },

    ".cm-activeLine": {
      backgroundColor: darkColors.activeLine,
      marginRight: "-1px", // Fix: prevent overflow past editor border
    },

    ".cm-selectionBackground, ::selection": {
      backgroundColor: `${darkColors.selection} !important`,
    },

    ".cm-focused .cm-selectionBackground": {
      backgroundColor: `${darkColors.selectionFocused} !important`,
    },

    ".cm-cursor": {
      borderLeftColor: darkColors.cursor,
      borderLeftWidth: "2px",
    },
  });
}
