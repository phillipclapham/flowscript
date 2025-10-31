/**
 * IndentationScanner - Python-style indentation preprocessor for FlowScript
 *
 * Transforms indentation-based syntax into explicit block syntax by inserting
 * implicit { } around indented sections. Uses stack-based INDENT/DEDENT algorithm
 * proven in Python, Haskell, and F# implementations.
 *
 * Example transformation:
 *   INPUT:          TRANSFORMED:
 *   A               A
 *     B               {B
 *     C               C
 *                     }
 *
 * Specification: See /spec/indentation.md
 * Session: 4a-continued-2 (Preprocessor Core Implementation)
 *
 * NOTE: Copied from /src/indentation-scanner.ts (temporary duplication)
 * TODO (Phase 8): Refactor to shared monorepo package
 */

import { IndentationError } from './indentation-error';

export interface IndentationScannerOptions {
  /** Number of spaces per indentation level (default: 2) */
  indentSize?: number;
}

/**
 * Result of indentation preprocessing
 */
export interface IndentationScannerResult {
  /** Transformed source with explicit { } blocks */
  transformed: string;
  /** Maps transformed line number → original line number */
  lineMap: Map<number, number>;
}

/**
 * IndentationScanner preprocessor
 *
 * Transforms indentation-based FlowScript syntax into explicit block syntax
 * by inserting { } around indented sections. This allows the existing parser
 * to handle indented code without grammar changes.
 */
export class IndentationScanner {
  private indentStack: number[] = [0]; // Stack of active indentation levels
  private readonly indentSize: number;
  private explicitBlockDepth: number = 0; // Track nesting depth of explicit {} blocks
  private blockBaseIndent: number | null = null; // Base indentation when inside explicit block
  private savedIndentStack: number[][] = []; // Stack of indent stacks for nested explicit blocks

  /**
   * Create a new IndentationScanner
   * @param options - Configuration options
   */
  constructor(options: IndentationScannerOptions = {}) {
    this.indentSize = options.indentSize ?? 2;
  }

  /**
   * Process FlowScript input and transform indentation to explicit blocks
   *
   * @param input - FlowScript source code with indentation
   * @returns Transformed source with explicit { } blocks and line mapping
   */
  process(input: string): IndentationScannerResult {
    // Handle empty input specially
    if (input === '') {
      return {
        transformed: '',
        lineMap: new Map<number, number>()
      };
    }

    const lines = input.split('\n');
    const transformedLines: string[] = [];
    const lineMap = new Map<number, number>();

    // Reset state for new processing
    this.indentStack = [0];
    this.explicitBlockDepth = 0;
    this.blockBaseIndent = null;
    this.savedIndentStack = [];

    // Track the last non-blank original line for EOF closing
    let lastOriginalLine = lines.length;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const originalLineNum = i + 1; // 1-indexed for user-facing errors
      const processedLines = this.processLine(lines[i], originalLineNum);

      // Track last non-blank line
      if (lines[i].trim() !== '') {
        lastOriginalLine = originalLineNum;
      }

      // Add each processed line with its original line mapping
      for (const { line, originalLine } of processedLines) {
        const outputLineNum = transformedLines.length + 1;
        lineMap.set(outputLineNum, originalLine);
        transformedLines.push(line);
      }
    }

    // Close all remaining indentation levels at EOF
    const finalLines = this.finalize(lastOriginalLine);
    for (const { line, originalLine } of finalLines) {
      const outputLineNum = transformedLines.length + 1;
      lineMap.set(outputLineNum, originalLine);
      transformedLines.push(line);
    }

    return {
      transformed: transformedLines.join('\n'),
      lineMap
    };
  }

  /**
   * Process a single line of input
   *
   * @param line - Line of FlowScript source
   * @param lineNum - Line number (1-indexed) in original source
   * @returns Array of output lines with original line numbers (may include inserted { or })
   */
  private processLine(line: string, lineNum: number): Array<{ line: string; originalLine: number }> {
    // 1. Skip blank lines (whitespace-only or empty)
    if (line.trim() === '') {
      return [{ line, originalLine: lineNum }];
    }

    // 2. Track explicit block depth
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    // Update depth and track transitions
    const depthBeforeLine = this.explicitBlockDepth;
    this.explicitBlockDepth += openBraces - closeBraces;

    // 3. Handle lines with braces
    if (openBraces > 0 || closeBraces > 0) {
      const output: Array<{ line: string; originalLine: number }> = [];

      // FIRST: Check if this line's indentation needs implicit blocks
      // (before handling the explicit braces)
      if (depthBeforeLine === 0) {
        // We're not inside an explicit block, check for indentation change
        const indent = this.countLeadingSpaces(line);
        const prevIndent = this.indentStack[this.indentStack.length - 1];

        if (indent > prevIndent) {
          // INDENT: Indentation increased - add implicit opening brace
          this.indentStack.push(indent);

          // PREFIX '{' to the current line (same line, not separate!)
          const currentIndent = this.countLeadingSpaces(line);
          const content = line.trimStart();
          output.push({ line: ' '.repeat(currentIndent) + '{' + content, originalLine: lineNum });

          // Now handle the explicit brace on this line
          if (openBraces > closeBraces) {
            // Save stack and reset for explicit block
            this.savedIndentStack.push([...this.indentStack]);
            this.indentStack = [0];
            this.blockBaseIndent = null;
          }
          return output;
        } else if (indent < prevIndent) {
          // DEDENT: Close implicit blocks before processing this line
          while (
            this.indentStack.length > 1 &&
            this.indentStack[this.indentStack.length - 1] > indent
          ) {
            const closingIndent = this.indentStack[this.indentStack.length - 1];
            this.indentStack.pop();
            // Closing braces credit to the line that caused the dedent
            output.push({ line: ' '.repeat(closingIndent) + '}', originalLine: lineNum });
          }

          // Verify dedent to valid level
          if (this.indentStack[this.indentStack.length - 1] !== indent) {
            const validLevels = this.indentStack.join(', ');
            throw new IndentationError(
              `Invalid dedent to level ${indent}. Expected one of: [${validLevels}].`,
              lineNum
            );
          }

          // The line itself
          output.push({ line, originalLine: lineNum });

          // Now handle the explicit brace on this line
          if (openBraces > closeBraces) {
            // Save stack and reset for explicit block
            this.savedIndentStack.push([...this.indentStack]);
            this.indentStack = [0];
            this.blockBaseIndent = null;
          }
          return output;
        }
      }

      // SECOND: Handle explicit block exits (close implicit blocks first)
      if (closeBraces > openBraces && this.blockBaseIndent !== null) {
        // Close all implicit blocks opened within this explicit block
        while (
          this.indentStack.length > 1 &&
          this.indentStack[this.indentStack.length - 1] > this.blockBaseIndent
        ) {
          const closingIndent = this.indentStack[this.indentStack.length - 1];
          this.indentStack.pop();
          // Credit to current line (the explicit close brace line)
          output.push({ line: ' '.repeat(closingIndent) + '}', originalLine: lineNum });
        }
        // Restore indent stack from before entering the explicit block
        if (this.savedIndentStack.length > 0) {
          this.indentStack = this.savedIndentStack.pop()!;
        } else {
          this.indentStack = [0];
        }
        this.blockBaseIndent = null;
      }

      // THIRD: Handle explicit block entries
      if (openBraces > closeBraces) {
        // Save current indent stack before entering explicit block
        this.savedIndentStack.push([...this.indentStack]);
        this.indentStack = [0];
        this.blockBaseIndent = null; // Will be set by next non-brace line
      }

      // Finally: The line with braces itself passes through
      output.push({ line, originalLine: lineNum });
      return output;
    }

    // 4. Inside explicit block: establish base indentation on first content line
    if (this.explicitBlockDepth > 0 && this.blockBaseIndent === null) {
      const indent = this.countLeadingSpaces(line);
      this.blockBaseIndent = indent;
      this.indentStack = [indent]; // Base level for this block
      return [{ line, originalLine: lineNum }]; // First line in block passes through unchanged
    }

    // 5. Detect tabs (ERROR - not silent conversion)
    if (line.includes('\t')) {
      throw new IndentationError(
        `Tabs not allowed. Use ${this.indentSize} spaces for indentation.`,
        lineNum
      );
    }

    // 6. Calculate current indentation level
    const indent = this.countLeadingSpaces(line);

    // 7. First line must be at column 0
    if (lineNum === 1 && indent > 0) {
      throw new IndentationError('First line cannot be indented.', 1);
    }

    // Note: We don't enforce "multiple of indentSize" because Python-style indentation
    // allows any indentation amount, as long as dedents return to valid levels.
    // The spec examples (e.g., "Simple indentation") use 5 spaces which is not
    // a multiple of 2, confirming this flexible approach.

    const prevIndent = this.indentStack[this.indentStack.length - 1];
    const output: Array<{ line: string; originalLine: number }> = [];

    // 8. Compare current indent to previous level
    if (indent > prevIndent) {
      // INDENT: New nested level
      // Push new level onto stack and prefix '{' to current line
      this.indentStack.push(indent);

      // PREFIX '{' to the current line (same line, not separate!)
      // Spec Example 2: "  {B" not "  {\n  B"
      const currentIndent = this.countLeadingSpaces(line);
      const content = line.trimStart();
      output.push({ line: ' '.repeat(currentIndent) + '{' + content, originalLine: lineNum });
    } else if (indent < prevIndent) {
      // DEDENT: Closing one or more levels
      // Pop stack until we reach the target level, emitting closing braces
      while (
        this.indentStack.length > 1 &&
        this.indentStack[this.indentStack.length - 1] > indent
      ) {
        const closingIndent = this.indentStack[this.indentStack.length - 1];
        this.indentStack.pop();
        // Emit '}' at the indentation level being closed
        // Credit to the line that caused the dedent
        output.push({ line: ' '.repeat(closingIndent) + '}', originalLine: lineNum });
      }

      // Verify we dedented to a valid level (must exist in stack history)
      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        const validLevels = this.indentStack.join(', ');
        throw new IndentationError(
          `Invalid dedent to level ${indent}. Expected one of: [${validLevels}].`,
          lineNum
        );
      }

      // The current line itself
      output.push({ line, originalLine: lineNum });
    } else {
      // EQUAL: Same indentation level, no change needed
      output.push({ line, originalLine: lineNum });
    }

    return output;
  }

  /**
   * Finalize processing by closing all remaining indentation levels
   *
   * Called at end of file to emit closing braces for any open indentation.
   * @param lastOriginalLine - The last non-blank original line number (for provenance)
   * @returns Array of closing braces with original line mapping
   */
  private finalize(lastOriginalLine: number): Array<{ line: string; originalLine: number }> {
    const output: Array<{ line: string; originalLine: number }> = [];

    // Close all levels except the base level (0)
    while (this.indentStack.length > 1) {
      const closingIndent = this.indentStack[this.indentStack.length - 1];
      this.indentStack.pop();
      // Emit '}' at the indentation level being closed
      // Credit to the last non-blank line (EOF closing)
      output.push({ line: ' '.repeat(closingIndent) + '}', originalLine: lastOriginalLine });
    }

    return output;
  }

  /**
   * Count leading spaces in a line
   *
   * Stops at first non-space character or tab.
   * @param line - Line to count spaces in
   * @returns Number of leading spaces
   */
  private countLeadingSpaces(line: string): number {
    let count = 0;
    for (const char of line) {
      if (char === ' ') {
        count++;
      } else {
        break; // Stop at first non-space (tab check happens separately)
      }
    }
    return count;
  }
}
