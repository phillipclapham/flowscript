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
import { Tag } from "@lezer/highlight";

/**
 * Custom Lezer tags for FlowScript syntax highlighting
 * Each of the 21 markers gets its own unique tag
 */
export const flowScriptTags = {
  // Core Relations
  causal: Tag.define(),
  temporal: Tag.define(),
  reverseCausal: Tag.define(),
  bidirectional: Tag.define(),
  tension: Tag.define(),
  axisLabel: Tag.define(),

  // Definition Operators
  equivalent: Tag.define(),
  notEquivalent: Tag.define(),

  // State Markers
  decided: Tag.define(),
  exploring: Tag.define(),
  blocked: Tag.define(),
  parking: Tag.define(),

  // Insights & Questions
  thought: Tag.define(),
  question: Tag.define(),
  completed: Tag.define(),
  alternative: Tag.define(),

  // Commands
  action: Tag.define(),

  // Modifiers
  urgent: Tag.define(),
  positive: Tag.define(),
  confident: Tag.define(),
  uncertain: Tag.define(),

  // Structure
  brace: Tag.define(),
  bracket: Tag.define(),
  scope: Tag.define(),

  // Comments
  comment: Tag.define(),
};

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
 * Helper: Check if character is whitespace or boundary
 */
function isWhitespaceOrBoundary(char: string | undefined): boolean {
  return !char || /\s/.test(char);
}

/**
 * Helper: Check if stream is at line start (only whitespace before current position)
 */
function isLineStart(stream: any): boolean {
  // Check if we're at position 0, or if all characters before us are whitespace
  for (let i = 0; i < stream.pos; i++) {
    if (!/\s/.test(stream.string[i])) {
      return false;
    }
  }
  return true;
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

    // Multi-character operators (Tier 2: must have whitespace before AND after)

    // Bidirectional: <->
    if (stream.match("<->", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar)) {
        stream.match("<->", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.BIDIRECTIONAL;
        }
      }
    }

    // Reverse causal: <-
    if (stream.match("<-", false) && !stream.match("<->", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar)) {
        stream.match("<-", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.REVERSE_CAUSAL;
        }
      }
    }

    // Temporal: =>
    if (stream.match("=>", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar)) {
        stream.match("=>", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.TEMPORAL;
        }
      }
    }

    // Causal: ->
    if (stream.match("->", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar)) {
        stream.match("->", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.CAUSAL;
        }
      }
    }

    // Not equivalent: !=
    if (stream.match("!=", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar)) {
        stream.match("!=", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.NOT_EQUIVALENT;
        }
      }
    }

    // Tension: ><[axis]
    if (stream.match("><", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar)) {
        stream.match("><", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          state.inTensionAxis = true;
          return TokenTypes.TENSION;
        }
      }
    }

    // Positive modifier: ++ (Tier 1: line-start only)
    if (stream.match("++", false)) {
      if (isLineStart(stream)) {
        stream.match("++", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.POSITIVE;
        }
      }
    }

    // Alternative: || (Tier 1: line-start only)
    if (stream.match("||", false)) {
      if (isLineStart(stream)) {
        stream.match("||", true);
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.ALTERNATIVE;
        }
      }
    }

    // Keywords with colons (Tier 3: must have whitespace before OR be at line start)
    if (stream.match("thought:", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar) || isLineStart(stream)) {
        stream.match("thought:", true);
        return TokenTypes.THOUGHT;
      }
    }
    if (stream.match("action:", false)) {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar) || isLineStart(stream)) {
        stream.match("action:", true);
        return TokenTypes.ACTION;
      }
    }

    // Single-character markers

    // Question: ? (Tier 1: line-start only)
    if (ch === "?") {
      if (isLineStart(stream)) {
        stream.next();
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.QUESTION;
        }
      }
      // Not at line start or no whitespace after - treat as regular text
      stream.next();
      return null;
    }

    // Completed: ✓ (Tier 4: flexible, can appear anywhere)
    if (ch === "✓") {
      stream.next();
      return TokenTypes.COMPLETED;
    }

    // Urgent: ! (Tier 1: line-start only)
    if (ch === "!") {
      if (isLineStart(stream)) {
        stream.next();
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.URGENT;
        }
      }
      // Not at line start or no whitespace after - treat as regular text
      stream.next();
      return null;
    }

    // Confident: * (Tier 1: line-start only)
    if (ch === "*") {
      if (isLineStart(stream)) {
        stream.next();
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.CONFIDENT;
        }
      }
      // Not at line start or no whitespace after - treat as regular text
      stream.next();
      return null;
    }

    // Uncertain: ~ (Tier 1: line-start only)
    if (ch === "~") {
      if (isLineStart(stream)) {
        stream.next();
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.UNCERTAIN;
        }
      }
      // Not at line start or no whitespace after - treat as regular text
      stream.next();
      return null;
    }

    // Equivalent: = (Tier 2: whitespace-bounded)
    if (ch === "=") {
      const prevChar = stream.string[stream.pos - 1];
      if (isWhitespaceOrBoundary(prevChar)) {
        stream.next();
        const nextChar = stream.peek();
        if (isWhitespaceOrBoundary(nextChar)) {
          return TokenTypes.EQUIVALENT;
        }
      }
      // No whitespace boundary - treat as regular text
      stream.next();
      return null;
    }

    // Regular text - MUST consume at least one character to avoid infinite loop
    // Save starting position to ensure we advance
    const startPos = stream.pos;

    while (stream.peek()) {
      const next = stream.peek();

      // Check if we're about to hit a marker
      if (
        next === "#" || next === "\\" || next === "{" || next === "}" ||
        next === "[" || next === "]" || next === "@" || next === "?" ||
        next === "✓" || next === "!" || next === "*" || next === "~" ||
        next === "=" || next === "|" || next === "+"
      ) {
        // If we haven't consumed anything yet, consume this character
        if (stream.pos === startPos) {
          stream.next();
        }
        break;
      }

      // Check for multi-char markers (lookahead)
      if (stream.match("<->", false) || stream.match("<-", false) || stream.match("->", false) ||
          stream.match("=>", false) || stream.match("><", false) || stream.match("!=", false) ||
          stream.match("++", false) || stream.match("||", false)) {
        // If we haven't consumed anything yet, consume this character
        if (stream.pos === startPos) {
          stream.next();
        }
        break;
      }

      // Check for keywords
      if (stream.match(/^(thought:|action:)/, false)) {
        // If we haven't consumed anything yet, consume this character
        if (stream.pos === startPos) {
          stream.next();
        }
        break;
      }

      stream.next();
    }

    // Safety check: ensure we ALWAYS advance at least one character
    if (stream.pos === startPos && stream.peek()) {
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
