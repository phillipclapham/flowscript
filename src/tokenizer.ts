/**
 * FlowScript Tokenizer
 *
 * Regex-based tokenizer that identifies 21 FlowScript markers in source text.
 * This is an MVP implementation - production version will use PEG parser (Phase 3).
 */

import { Token, TokenType } from './types';

export class Tokenizer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isEOF()) {
      const token = this.nextToken();
      if (token) tokens.push(token);
    }

    tokens.push(this.createToken(TokenType.EOF, ''));
    return tokens;
  }

  private nextToken(): Token | null {
    this.skipWhitespace();

    if (this.isEOF()) return null;

    // Try multi-character markers first (order matters!)
    if (this.match('<->')) return this.createToken(TokenType.ARROW_BI, '<->');
    if (this.match('->')) return this.createToken(TokenType.ARROW_RIGHT, '->');
    if (this.match('<-')) return this.createToken(TokenType.ARROW_LEFT, '<-');
    if (this.match('=>')) return this.createToken(TokenType.ARROW_TEMPORAL, '=>');
    if (this.match('><')) return this.createToken(TokenType.TENSION, '><');
    if (this.match('!=')) return this.createToken(TokenType.NOT_EQUALS, '!=');
    if (this.match('++')) return this.createToken(TokenType.POSITIVE, '++');
    if (this.match('||')) return this.createToken(TokenType.ALTERNATIVE, '||');

    // State markers (look for pattern [word])
    if (this.peek() === '[') {
      const stateToken = this.tryStateMarker();
      if (stateToken) return stateToken;
    }

    // Keywords
    if (this.match('thought:')) return this.createToken(TokenType.THOUGHT, 'thought:');
    if (this.match('action:')) return this.createToken(TokenType.ACTION, 'action:');

    // Single character markers
    if (this.peek() === '?') {
      this.advance();
      return this.createToken(TokenType.QUESTION, '?');
    }
    if (this.peek() === '!') {
      this.advance();
      return this.createToken(TokenType.URGENT, '!');
    }
    if (this.peek() === '*') {
      this.advance();
      return this.createToken(TokenType.CONFIDENT, '*');
    }
    if (this.peek() === '~') {
      this.advance();
      return this.createToken(TokenType.UNCERTAIN, '~');
    }
    if (this.peek() === '=') {
      this.advance();
      return this.createToken(TokenType.EQUALS, '=');
    }
    if (this.peek() === '{') {
      this.advance();
      return this.createToken(TokenType.BRACE_OPEN, '{');
    }
    if (this.peek() === '}') {
      this.advance();
      return this.createToken(TokenType.BRACE_CLOSE, '}');
    }
    if (this.peek() === '✓') {
      this.advance();
      return this.createToken(TokenType.CHECKMARK, '✓');
    }

    // Newlines
    if (this.peek() === '\n') {
      this.advance();
      this.line++;
      this.column = 1;
      return this.createToken(TokenType.NEWLINE, '\n');
    }

    // Text content (everything else)
    return this.readText();
  }

  private tryStateMarker(): Token | null {
    const start = this.position;
    const startCol = this.column;
    const startLine = this.line;

    if (this.peek() !== '[') return null;
    this.advance(); // consume '['

    // Read until ']' or '(' to get the state type
    let stateType = '';
    while (!this.isEOF() && this.peek() !== ']' && this.peek() !== '(') {
      stateType += this.peek();
      this.advance();
    }

    // Check if valid state marker
    const validStates = ['decided', 'exploring', 'blocked', 'parking'];
    if (!validStates.includes(stateType)) {
      // Not a state marker, reset and return null
      this.position = start;
      this.column = startCol;
      this.line = startLine;
      return null;
    }

    // Read until closing ']' (capturing any fields like (field: "value"))
    let fullMarker = '[' + stateType;
    while (!this.isEOF() && this.peek() !== ']') {
      fullMarker += this.peek();
      this.advance();
    }

    if (this.peek() === ']') {
      fullMarker += ']';
      this.advance();
    }

    const tokenType = {
      'decided': TokenType.DECIDED,
      'exploring': TokenType.EXPLORING,
      'blocked': TokenType.BLOCKED,
      'parking': TokenType.PARKING
    }[stateType];

    return {
      type: tokenType!,
      value: fullMarker,
      line: startLine,
      column: startCol
    };
  }

  private readText(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let content = '';

    while (!this.isEOF() && !this.isMarkerStart()) {
      if (this.peek() === '\n') break;
      content += this.peek();
      this.advance();
    }

    return {
      type: TokenType.TEXT,
      value: content.trim(),
      line: startLine,
      column: startCol
    };
  }

  private isMarkerStart(): boolean {
    const char = this.peek();
    const twoChar = this.input.substr(this.position, 2);

    // Check for multi-character markers
    if (twoChar === '->' || twoChar === '<-' || twoChar === '<>' ||
        twoChar === '=>' || twoChar === '><' || twoChar === '!=' ||
        twoChar === '++' || twoChar === '||') {
      return true;
    }

    // Check for single-character markers
    const markers = ['-', '<', '>', '=', '!', '?', '*', '~', '{', '}', '[', '|', '+', '✓'];
    return markers.includes(char);
  }

  private match(expected: string): boolean {
    if (this.input.substr(this.position, expected.length) === expected) {
      const startCol = this.column;
      for (let i = 0; i < expected.length; i++) {
        this.advance();
      }
      return true;
    }
    return false;
  }

  private peek(): string {
    return this.input[this.position] || '';
  }

  private advance(): void {
    this.position++;
    this.column++;
  }

  private skipWhitespace(): void {
    while (!this.isEOF() && /[ \t\r]/.test(this.peek())) {
      this.advance();
    }
  }

  private isEOF(): boolean {
    return this.position >= this.input.length;
  }

  private createToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - value.length
    };
  }
}
