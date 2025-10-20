/**
 * Custom error class for indentation-related errors
 *
 * Thrown when indentation rules are violated (tabs, inconsistent spacing, etc.)
 * Includes line number for helpful error messages
 */
export class IndentationError extends Error {
  public readonly lineNumber: number;

  constructor(message: string, lineNumber: number) {
    super(`${message} (Line ${lineNumber})`);
    this.name = 'IndentationError';
    this.lineNumber = lineNumber;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IndentationError);
    }
  }
}
