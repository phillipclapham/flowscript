/**
 * FlowScript Tokenizer for CodeMirror 6
 *
 * Tokenizes the 21 FlowScript markers:
 *
 * Core Relations (5):
 *   -> (causal), => (temporal), <- (reverse causal), <-> (bidirectional), ><[axis] (tension)
 *
 * Definition Operators (2):
 *   = (equivalent), != (not equivalent)
 *
 * State Markers (4):
 *   [decided(...)], [exploring], [blocked(...)], [parking(...)]
 *
 * Insights & Questions (4):
 *   thought:, ?, ✓, || (alternative)
 *
 * Commands (1):
 *   action:
 *
 * Modifiers (4):
 *   ! (urgent), ++ (positive), * (confident), ~ (uncertain)
 *
 * Structure (1):
 *   { } (thought blocks)
 */

import type { StreamParser } from "@codemirror/language";

export interface FlowScriptToken {
  type: string;
  value: string;
}

/**
 * Token types for syntax highlighting
 */
export const TokenTypes = {
  // Core Relations
  CAUSAL: "flowscript-causal",           // ->
  TEMPORAL: "flowscript-temporal",        // =>
  REVERSE_CAUSAL: "flowscript-reverse-causal", // <-
  BIDIRECTIONAL: "flowscript-bidirectional",   // <->
  TENSION: "flowscript-tension",          // ><[axis]

  // Definition Operators
  EQUIVALENT: "flowscript-equivalent",    // =
  NOT_EQUIVALENT: "flowscript-not-equivalent", // !=

  // State Markers
  DECIDED: "flowscript-decided",          // [decided(...)]
  EXPLORING: "flowscript-exploring",      // [exploring]
  BLOCKED: "flowscript-blocked",          // [blocked(...)]
  PARKING: "flowscript-parking",          // [parking(...)]

  // Insights & Questions
  THOUGHT: "flowscript-thought",          // thought:
  QUESTION: "flowscript-question",        // ?
  COMPLETED: "flowscript-completed",      // ✓
  ALTERNATIVE: "flowscript-alternative",  // ||

  // Commands
  ACTION: "flowscript-action",            // action:

  // Modifiers
  URGENT: "flowscript-urgent",            // !
  POSITIVE: "flowscript-positive",        // ++
  CONFIDENT: "flowscript-confident",      // *
  UNCERTAIN: "flowscript-uncertain",      // ~

  // Structure
  BRACE: "flowscript-brace",             // { }
  BRACKET: "flowscript-bracket",         // [ ]

  // Other
  AXIS_LABEL: "flowscript-axis-label",   // [axis] in tensions
  STATE_FIELD: "flowscript-state-field", // fields in state markers
  SCOPE: "flowscript-scope",             // @project
  COMMENT: "flowscript-comment",         // # comments
} as const;

interface TokenizerState {
  inStateBracket: boolean;
  inTensionAxis: boolean;
  inThoughtBlock: boolean;
  braceDepth: number;
}

/**
 * FlowScript StreamParser for CodeMirror 6
 */
export const flowScriptTokenizer: StreamParser<TokenizerState> = {
  token(stream, state) {
    // Skip whitespace
    if (stream.eatSpace()) {
      return null;
    }

    const ch = stream.peek();

    // Comments (# to end of line)
    if (ch === "#") {
      stream.skipToEnd();
      return TokenTypes.COMMENT;
    }

    // Escape sequences
    if (ch === "\\") {
      stream.next(); // consume backslash
      stream.next(); // consume escaped character
      return null;
    }

    // Thought blocks: { }
    if (ch === "{") {
      stream.next();
      state.braceDepth++;
      state.inThoughtBlock = true;
      return TokenTypes.BRACE;
    }
    if (ch === "}") {
      stream.next();
      state.braceDepth--;
      if (state.braceDepth === 0) {
        state.inThoughtBlock = false;
      }
      return TokenTypes.BRACE;
    }

    // State markers: [decided], [exploring], [blocked], [parking]
    if (ch === "[") {
      stream.next();
      const word = stream.match(/^(decided|exploring|blocked|parking)/);
      if (word && Array.isArray(word)) {
        state.inStateBracket = true;
        const stateType = word[0];

        // Check for fields after state marker
        if (stream.peek() === "(") {
          stream.next(); // consume (
          // Consume until closing )
          while (stream.peek() && stream.peek() !== ")") {
            stream.next();
          }
          if (stream.peek() === ")") {
            stream.next(); // consume )
          }
        }

        // Check for closing ]
        if (stream.peek() === "]") {
          stream.next(); // consume ]
          state.inStateBracket = false;
        }

        return stateType === "decided" ? TokenTypes.DECIDED :
               stateType === "exploring" ? TokenTypes.EXPLORING :
               stateType === "blocked" ? TokenTypes.BLOCKED :
               TokenTypes.PARKING;
      }

      // Tension axis label: ><[axis]
      if (state.inTensionAxis) {
        // Consume until closing ]
        while (stream.peek() && stream.peek() !== "]") {
          stream.next();
        }
        if (stream.peek() === "]") {
          stream.next(); // consume ]
          state.inTensionAxis = false;
        }
        return TokenTypes.AXIS_LABEL;
      }

      // Generic bracket
      return TokenTypes.BRACKET;
    }

    if (ch === "]") {
      stream.next();
      state.inStateBracket = false;
      return TokenTypes.BRACKET;
    }

    // Scope marker: @project
    if (ch === "@") {
      stream.next();
      stream.match(/^\w+/);
      return TokenTypes.SCOPE;
    }

    // Multi-character operators (must check before single-character)

    // Bidirectional: <->
    if (stream.match("<->", true)) {
      return TokenTypes.BIDIRECTIONAL;
    }

    // Reverse causal: <-
    if (stream.match("<-", true)) {
      return TokenTypes.REVERSE_CAUSAL;
    }

    // Temporal: =>
    if (stream.match("=>", true)) {
      return TokenTypes.TEMPORAL;
    }

    // Causal: ->
    if (stream.match("->", true)) {
      return TokenTypes.CAUSAL;
    }

    // Not equivalent: !=
    if (stream.match("!=", true)) {
      return TokenTypes.NOT_EQUIVALENT;
    }

    // Tension: ><[axis]
    if (stream.match("><", true)) {
      state.inTensionAxis = true;
      return TokenTypes.TENSION;
    }

    // Positive modifier: ++
    if (stream.match("++", true)) {
      return TokenTypes.POSITIVE;
    }

    // Alternative: ||
    if (stream.match("||", true)) {
      return TokenTypes.ALTERNATIVE;
    }

    // Keywords with colons
    if (stream.match("thought:", true)) {
      return TokenTypes.THOUGHT;
    }
    if (stream.match("action:", true)) {
      return TokenTypes.ACTION;
    }

    // Single-character markers

    // Question: ?
    if (ch === "?") {
      stream.next();
      return TokenTypes.QUESTION;
    }

    // Completed: ✓
    if (ch === "✓") {
      stream.next();
      return TokenTypes.COMPLETED;
    }

    // Urgent: !
    if (ch === "!") {
      stream.next();
      return TokenTypes.URGENT;
    }

    // Confident: *
    if (ch === "*") {
      stream.next();
      return TokenTypes.CONFIDENT;
    }

    // Uncertain: ~
    if (ch === "~") {
      stream.next();
      return TokenTypes.UNCERTAIN;
    }

    // Equivalent: =
    if (ch === "=") {
      stream.next();
      return TokenTypes.EQUIVALENT;
    }

    // Regular text - consume until next marker
    while (stream.peek()) {
      const next = stream.peek();

      // Check if we're about to hit a marker
      if (
        next === "#" || next === "\\" || next === "{" || next === "}" ||
        next === "[" || next === "]" || next === "@" || next === "?" ||
        next === "✓" || next === "!" || next === "*" || next === "~" ||
        next === "=" || next === "|" || next === "+"
      ) {
        break;
      }

      // Check for multi-char markers (lookahead)
      if (stream.match("<->", false) || stream.match("<-", false) || stream.match("->", false) ||
          stream.match("=>", false) || stream.match("><", false) || stream.match("!=", false) ||
          stream.match("++", false) || stream.match("||", false)) {
        break;
      }

      // Check for keywords
      if (stream.match(/^(thought:|action:)/, false)) {
        break;
      }

      stream.next();
    }

    return null; // Regular text
  },

  startState(): TokenizerState {
    return {
      inStateBracket: false,
      inTensionAxis: false,
      inThoughtBlock: false,
      braceDepth: 0,
    };
  },
};
