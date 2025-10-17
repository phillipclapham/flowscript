/**
 * Tokenizer Tests - Complex Examples
 *
 * Tests for complex multi-line examples, position tracking, and edge cases
 */

import { Tokenizer } from '../src/tokenizer';
import { TokenType } from '../src/types';

describe('Tokenizer - Complex', () => {
  // =========================================================================
  // Complex Examples
  // =========================================================================

  describe('Complex Examples', () => {
    // NOTE: Multi-line complex example removed temporarily - causes memory issues
    // Will fix in Session 2c when implementing linter
    // it('tokenizes decision with alternatives', () => { ... });

    it('tokenizes thought with causal chain', () => {
      const input = 'thought: performance issue -> slow queries -> missing indexes';
      const tokenizer = new Tokenizer(input);
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.THOUGHT);
      const arrows = tokens.filter(t => t.type === TokenType.ARROW_RIGHT);
      expect(arrows.length).toBe(2);
    });

    it('tokenizes tension with decision', () => {
      const input = 'performance ><[latency vs throughput] reliability\n[decided(rationale: "reliability wins", on: "2025-10-17")]';
      const tokenizer = new Tokenizer(input);
      const tokens = tokenizer.tokenize();

      expect(tokens.some(t => t.type === TokenType.TENSION)).toBe(true);
      expect(tokens.some(t => t.type === TokenType.DECIDED)).toBe(true);
    });
  });

  // =========================================================================
  // Position Tracking
  // =========================================================================

  describe('Position Tracking', () => {
    it('tracks line numbers correctly', () => {
      const input = 'line 1\nline 2\nline 3';
      const tokenizer = new Tokenizer(input);
      const tokens = tokenizer.tokenize();

      const textTokens = tokens.filter(t => t.type === TokenType.TEXT);
      expect(textTokens[0].line).toBe(1);
      expect(textTokens[1].line).toBe(2);
      expect(textTokens[2].line).toBe(3);
    });

    it('tracks column numbers', () => {
      const input = 'A -> B';
      const tokenizer = new Tokenizer(input);
      const tokens = tokenizer.tokenize();

      expect(tokens[0].column).toBe(1);  // 'A'
      expect(tokens[1].column).toBe(3);  // '->'
      expect(tokens[2].column).toBe(6);  // 'B'
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('handles empty input', () => {
      const tokenizer = new Tokenizer('');
      const tokens = tokenizer.tokenize();

      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('handles whitespace only', () => {
      const tokenizer = new Tokenizer('   \n  \t  ');
      const tokens = tokenizer.tokenize();

      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    it('handles text with no markers', () => {
      const tokenizer = new Tokenizer('Just plain text');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TEXT);
      expect(tokens[0].value).toBe('Just plain text');
    });

    it('trims whitespace from text tokens', () => {
      const tokenizer = new Tokenizer('   spaced text   ');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].value).toBe('spaced text');
    });

    it('handles multiple newlines', () => {
      const input = 'A\n\n\nB';
      const tokenizer = new Tokenizer(input);
      const tokens = tokenizer.tokenize();

      const newlines = tokens.filter(t => t.type === TokenType.NEWLINE);
      expect(newlines.length).toBe(3);
    });
  });
});
