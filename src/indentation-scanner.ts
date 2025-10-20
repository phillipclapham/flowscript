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
 */

import { IndentationError } from './errors/indentation-error';

export interface IndentationScannerOptions {
  /** Number of spaces per indentation level (default: 2) */
  indentSize?: number;
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
   * @returns Transformed source with explicit { } blocks
   */
  process(input: string): string {
    const lines = input.split('\n');
    const output: string[] = [];

    // Reset state for new processing
    this.indentStack = [0];
    this.explicitBlockDepth = 0;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1; // 1-indexed for user-facing errors
      const processedLines = this.processLine(lines[i], lineNum);
      output.push(...processedLines);
    }

    // Close all remaining indentation levels at EOF
    const finalLines = this.finalize();
    output.push(...finalLines);

    return output.join('\n');
  }

  /**
   * Process a single line of input
   *
   * @param line - Line of FlowScript source
   * @param lineNum - Line number (1-indexed)
   * @returns Array of output lines (may include inserted { or })
   */
  private processLine(line: string, lineNum: number): string[] {
    // 1. Skip blank lines (whitespace-only or empty)
    if (line.trim() === '') {
      return [line];
    }

    // 2. Track explicit block depth
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    // Update depth BEFORE processing (matters for lines opening blocks)
    const depthBeforeLine = this.explicitBlockDepth;
    this.explicitBlockDepth += openBraces - closeBraces;

    // 3. Lines with braces pass through unchanged
    if (openBraces > 0 || closeBraces > 0) {
      // When exiting all explicit blocks, reset indent stack for future indentation
      if (depthBeforeLine > 0 && this.explicitBlockDepth === 0) {
        this.indentStack = [0];
      }
      return [line];
    }

    // 4. If inside explicit block (depth > 0), don't process indentation
    // But DO process indentation if we just entered a block (to handle nesting inside blocks)
    if (depthBeforeLine > 0) {
      // We're inside an explicit block, process indentation normally
      // (This handles "Indentation inside explicit blocks" test case)
    }

    // 4. Detect tabs (ERROR - not silent conversion)
    if (line.includes('\t')) {
      throw new IndentationError(
        `Tabs not allowed. Use ${this.indentSize} spaces for indentation.`,
        lineNum
      );
    }

    // 5. Calculate current indentation level
    const indent = this.countLeadingSpaces(line);

    // 6. First line must be at column 0
    if (lineNum === 1 && indent > 0) {
      throw new IndentationError('First line cannot be indented.', 1);
    }

    // Note: We don't enforce "multiple of indentSize" because Python-style indentation
    // allows any indentation amount, as long as dedents return to valid levels.
    // The spec examples (e.g., "Simple indentation") use 5 spaces which is not
    // a multiple of 2, confirming this flexible approach.

    const prevIndent = this.indentStack[this.indentStack.length - 1];
    const output: string[] = [];

    // 7. Compare current indent to previous level
    if (indent > prevIndent) {
      // INDENT: New nested level
      // Push new level onto stack and insert '{' at beginning of content
      this.indentStack.push(indent);

      // Insert '{' after the leading spaces
      const spaces = ' '.repeat(indent);
      const content = line.substring(indent);
      output.push(spaces + '{' + content);
    } else if (indent < prevIndent) {
      // DEDENT: Closing one or more levels
      // Pop stack until we reach the target level, emitting closing braces
      const closingBraces: string[] = [];
      while (
        this.indentStack.length > 1 &&
        this.indentStack[this.indentStack.length - 1] > indent
      ) {
        const closingIndent = this.indentStack[this.indentStack.length - 1];
        this.indentStack.pop();
        // Emit '}' at the indentation level being closed
        closingBraces.push(' '.repeat(closingIndent) + '}');
      }

      // Verify we dedented to a valid level (must exist in stack history)
      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        const validLevels = this.indentStack.join(', ');
        throw new IndentationError(
          `Invalid dedent to level ${indent}. Expected one of: [${validLevels}].`,
          lineNum
        );
      }

      output.push(...closingBraces);
      output.push(line);
    } else {
      // EQUAL: Same indentation level, no change needed
      output.push(line);
    }

    return output;
  }

  /**
   * Finalize processing by closing all remaining indentation levels
   *
   * Called at end of file to emit closing braces for any open indentation.
   * @returns Array of closing braces (one per remaining indent level)
   */
  private finalize(): string[] {
    const output: string[] = [];

    // Close all levels except the base level (0)
    while (this.indentStack.length > 1) {
      const closingIndent = this.indentStack[this.indentStack.length - 1];
      this.indentStack.pop();
      // Emit '}' at the indentation level being closed
      output.push(' '.repeat(closingIndent) + '}');
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
