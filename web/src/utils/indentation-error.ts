/**
 * Custom error class for indentation-related errors
 *
 * Thrown when indentation rules are violated (tabs, inconsistent spacing, etc.)
 * Includes line number for helpful error messages
 *
 * NOTE: Copied from /src/errors/indentation-error.ts (temporary duplication)
 * TODO (Phase 8): Refactor to shared monorepo package
 */
export class IndentationError extends Error {
  public readonly lineNumber: number;

  constructor(message: string, lineNumber: number) {
    super(`${message} (Line ${lineNumber})`);
    this.name = 'IndentationError';
    this.lineNumber = lineNumber;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, IndentationError);
    }
  }
}
