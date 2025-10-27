/**
 * FlowScript Language Mode for CodeMirror 6
 *
 * Uses Lezer tags for syntax highlighting with StreamLanguage.
 * This is the proper, documented way to highlight StreamLanguage parsers.
 */

import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { flowScriptTokenizer, flowScriptTags } from "./tokenizer";
import { lightColors, darkColors } from "../theme/colors";

/**
 * Token table: Maps token strings returned by tokenizer → Lezer tags
 *
 * StreamLanguage uses this to convert our custom token names
 * (e.g., "flowscript-comment") into tags that can be styled.
 */
const tokenTable = {
  "flowscript-comment": flowScriptTags.comment,
  "flowscript-causal": flowScriptTags.causal,
  "flowscript-temporal": flowScriptTags.temporal,
  "flowscript-reverse-causal": flowScriptTags.reverseCausal,
  "flowscript-bidirectional": flowScriptTags.bidirectional,
  "flowscript-tension": flowScriptTags.tension,
  "flowscript-axis-label": flowScriptTags.axisLabel,
  "flowscript-equivalent": flowScriptTags.equivalent,
  "flowscript-not-equivalent": flowScriptTags.notEquivalent,
  "flowscript-decided": flowScriptTags.decided,
  "flowscript-exploring": flowScriptTags.exploring,
  "flowscript-blocked": flowScriptTags.blocked,
  "flowscript-parking": flowScriptTags.parking,
  "flowscript-thought": flowScriptTags.thought,
  "flowscript-question": flowScriptTags.question,
  "flowscript-completed": flowScriptTags.completed,
  "flowscript-alternative": flowScriptTags.alternative,
  "flowscript-action": flowScriptTags.action,
  "flowscript-urgent": flowScriptTags.urgent,
  "flowscript-positive": flowScriptTags.positive,
  "flowscript-confident": flowScriptTags.confident,
  "flowscript-uncertain": flowScriptTags.uncertain,
  "flowscript-brace": flowScriptTags.brace,
  "flowscript-bracket": flowScriptTags.bracket,
  "flowscript-scope": flowScriptTags.scope,
};

/**
 * FlowScript language with token table
 */
export const flowScript = StreamLanguage.define({
  ...flowScriptTokenizer,
  tokenTable
});

/**
 * Light theme highlight style
 * Maps each tag to its color/styling
 */
const lightHighlightStyle = HighlightStyle.define([
  // Core Relations
  { tag: flowScriptTags.causal, color: lightColors.causal, fontWeight: "600" },
  { tag: flowScriptTags.temporal, color: lightColors.temporal, fontWeight: "600" },
  { tag: flowScriptTags.reverseCausal, color: lightColors.reverseCausal, fontWeight: "600" },
  { tag: flowScriptTags.bidirectional, color: lightColors.bidirectional, fontWeight: "600" },
  { tag: flowScriptTags.tension, color: lightColors.tension, fontWeight: "700" },
  { tag: flowScriptTags.axisLabel, color: lightColors.axisLabel, fontStyle: "italic" },

  // Definition Operators
  { tag: flowScriptTags.equivalent, color: lightColors.equivalent, fontWeight: "600" },
  { tag: flowScriptTags.notEquivalent, color: lightColors.notEquivalent, fontWeight: "600" },

  // State Markers
  { tag: flowScriptTags.decided, color: lightColors.decided, fontWeight: "700", backgroundColor: lightColors.decidedBg },
  { tag: flowScriptTags.exploring, color: lightColors.exploring, fontWeight: "700", backgroundColor: lightColors.exploringBg },
  { tag: flowScriptTags.blocked, color: lightColors.blocked, fontWeight: "700", backgroundColor: lightColors.blockedBg },
  { tag: flowScriptTags.parking, color: lightColors.parking, fontWeight: "700", backgroundColor: lightColors.parkingBg },

  // Insights & Questions
  { tag: flowScriptTags.thought, color: lightColors.thought, fontWeight: "600" },
  { tag: flowScriptTags.question, color: lightColors.question, fontWeight: "700" },
  { tag: flowScriptTags.completed, color: lightColors.completed, fontWeight: "700" },
  { tag: flowScriptTags.alternative, color: lightColors.alternative, fontWeight: "600" },

  // Commands
  { tag: flowScriptTags.action, color: lightColors.action, fontWeight: "600" },

  // Modifiers
  { tag: flowScriptTags.urgent, color: lightColors.urgent, fontWeight: "700" },
  { tag: flowScriptTags.positive, color: lightColors.positive, fontWeight: "700" },
  { tag: flowScriptTags.confident, color: lightColors.confident, fontWeight: "600" },
  { tag: flowScriptTags.uncertain, color: lightColors.uncertain, fontWeight: "500", fontStyle: "italic" },

  // Structure
  { tag: flowScriptTags.brace, color: lightColors.brace, fontWeight: "600" },
  { tag: flowScriptTags.bracket, color: lightColors.bracket, fontWeight: "600" },
  { tag: flowScriptTags.scope, color: lightColors.scope, fontWeight: "600", backgroundColor: lightColors.scopeBg },

  // Comments
  { tag: flowScriptTags.comment, color: lightColors.comment, fontStyle: "italic" },
]);

/**
 * Dark theme highlight style
 * Same structure as light, but with dark colors
 */
const darkHighlightStyle = HighlightStyle.define([
  // Core Relations
  { tag: flowScriptTags.causal, color: darkColors.causal, fontWeight: "600" },
  { tag: flowScriptTags.temporal, color: darkColors.temporal, fontWeight: "600" },
  { tag: flowScriptTags.reverseCausal, color: darkColors.reverseCausal, fontWeight: "600" },
  { tag: flowScriptTags.bidirectional, color: darkColors.bidirectional, fontWeight: "600" },
  { tag: flowScriptTags.tension, color: darkColors.tension, fontWeight: "700" },
  { tag: flowScriptTags.axisLabel, color: darkColors.axisLabel, fontStyle: "italic" },

  // Definition Operators
  { tag: flowScriptTags.equivalent, color: darkColors.equivalent, fontWeight: "600" },
  { tag: flowScriptTags.notEquivalent, color: darkColors.notEquivalent, fontWeight: "600" },

  // State Markers
  { tag: flowScriptTags.decided, color: darkColors.decided, fontWeight: "700", backgroundColor: darkColors.decidedBg },
  { tag: flowScriptTags.exploring, color: darkColors.exploring, fontWeight: "700", backgroundColor: darkColors.exploringBg },
  { tag: flowScriptTags.blocked, color: darkColors.blocked, fontWeight: "700", backgroundColor: darkColors.blockedBg },
  { tag: flowScriptTags.parking, color: darkColors.parking, fontWeight: "700", backgroundColor: darkColors.parkingBg },

  // Insights & Questions
  { tag: flowScriptTags.thought, color: darkColors.thought, fontWeight: "600" },
  { tag: flowScriptTags.question, color: darkColors.question, fontWeight: "700" },
  { tag: flowScriptTags.completed, color: darkColors.completed, fontWeight: "700" },
  { tag: flowScriptTags.alternative, color: darkColors.alternative, fontWeight: "600" },

  // Commands
  { tag: flowScriptTags.action, color: darkColors.action, fontWeight: "600" },

  // Modifiers
  { tag: flowScriptTags.urgent, color: darkColors.urgent, fontWeight: "700" },
  { tag: flowScriptTags.positive, color: darkColors.positive, fontWeight: "700" },
  { tag: flowScriptTags.confident, color: darkColors.confident, fontWeight: "600" },
  { tag: flowScriptTags.uncertain, color: darkColors.uncertain, fontWeight: "500", fontStyle: "italic" },

  // Structure
  { tag: flowScriptTags.brace, color: darkColors.brace, fontWeight: "600" },
  { tag: flowScriptTags.bracket, color: darkColors.bracket, fontWeight: "600" },
  { tag: flowScriptTags.scope, color: darkColors.scope, fontWeight: "600", backgroundColor: darkColors.scopeBg },

  // Comments
  { tag: flowScriptTags.comment, color: darkColors.comment, fontStyle: "italic" },
]);

/**
 * FlowScript language support with syntax highlighting
 *
 * @param isDark - Whether to use dark theme colors
 * @returns Array of CodeMirror extensions
 */
export function flowScriptLanguage(isDark: boolean = false) {
  return [
    flowScript,
    syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle)
  ];
}
