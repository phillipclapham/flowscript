/**
 * Tokenizer Tests
 *
 * Comprehensive test coverage for all 21 FlowScript markers
 */

import { Tokenizer } from '../src/tokenizer';
import { TokenType } from '../src/types';

describe('Tokenizer', () => {
  // =========================================================================
  // Core Relations
  // =========================================================================

  describe('Core Relations', () => {
    it('tokenizes causal relationship (->)', () => {
      const tokenizer = new Tokenizer('A -> B');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TEXT);
      expect(tokens[0].value).toBe('A');
      expect(tokens[1].type).toBe(TokenType.ARROW_RIGHT);
      expect(tokens[2].type).toBe(TokenType.TEXT);
      expect(tokens[2].value).toBe('B');
    });

    it('tokenizes reverse causal (<-)', () => {
      const tokenizer = new Tokenizer('A <- B');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].value).toBe('A');
      expect(tokens[1].type).toBe(TokenType.ARROW_LEFT);
      expect(tokens[2].value).toBe('B');
    });

    it('tokenizes bidirectional (<->)', () => {
      const tokenizer = new Tokenizer('A <-> B');
      const tokens = tokenizer.tokenize();

      expect(tokens[1].type).toBe(TokenType.ARROW_BI);
    });

    it('tokenizes temporal sequence (=>)', () => {
      const tokenizer = new Tokenizer('A => B');
      const tokens = tokenizer.tokenize();

      expect(tokens[1].type).toBe(TokenType.ARROW_TEMPORAL);
    });

    it('tokenizes tension (><)', () => {
      const tokenizer = new Tokenizer('A >< B');
      const tokens = tokenizer.tokenize();

      expect(tokens[1].type).toBe(TokenType.TENSION);
    });

    it('tokenizes tension with axis label', () => {
      const tokenizer = new Tokenizer('speed ><[velocity vs quality] quality');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].value).toBe('speed');
      expect(tokens[1].type).toBe(TokenType.TENSION);
      expect(tokens[2].value).toBe('[velocity vs quality]');
      expect(tokens[3].value).toBe('quality');
    });
  });

  // =========================================================================
  // Definitions
  // =========================================================================

  describe('Definitions', () => {
    it('tokenizes equals (=)', () => {
      const tokenizer = new Tokenizer('x = value');
      const tokens = tokenizer.tokenize();

      expect(tokens[1].type).toBe(TokenType.EQUALS);
    });

    it('tokenizes not equals (!=)', () => {
      const tokenizer = new Tokenizer('x != value');
      const tokens = tokenizer.tokenize();

      expect(tokens[1].type).toBe(TokenType.NOT_EQUALS);
    });
  });

  // =========================================================================
  // State Markers
  // =========================================================================

  describe('State Markers', () => {
    it('tokenizes [decided] without fields', () => {
      const tokenizer = new Tokenizer('[decided] Ship now');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DECIDED);
      expect(tokens[0].value).toBe('[decided]');
    });

    it('tokenizes [decided] with fields', () => {
      const tokenizer = new Tokenizer('[decided(rationale: "test", on: "2025-10-17")] Ship now');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DECIDED);
      expect(tokens[0].value).toContain('rationale');
      expect(tokens[0].value).toContain('on');
    });

    it('tokenizes [exploring]', () => {
      const tokenizer = new Tokenizer('[exploring] Multiple options');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.EXPLORING);
    });

    it('tokenizes [blocked] with fields', () => {
      const tokenizer = new Tokenizer('[blocked(reason: "waiting", since: "2025-10-17")] Task X');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.BLOCKED);
      expect(tokens[0].value).toContain('reason');
      expect(tokens[0].value).toContain('since');
    });

    it('tokenizes [parking] with fields', () => {
      const tokenizer = new Tokenizer('[parking(why: "low priority", until: "Q2")] Feature Y');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.PARKING);
    });

    it('does not tokenize random brackets as state', () => {
      const tokenizer = new Tokenizer('[random] text');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TEXT);
      expect(tokens[0].value).toContain('[random]');
    });
  });

  // =========================================================================
  // Insights & Questions
  // =========================================================================

  describe('Insights & Questions', () => {
    it('tokenizes thought:', () => {
      const tokenizer = new Tokenizer('thought: This is interesting');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.THOUGHT);
      expect(tokens[1].value).toBe('This is interesting');
    });

    it('tokenizes question (?)', () => {
      const tokenizer = new Tokenizer('? What is the best approach');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.QUESTION);
      expect(tokens[1].value).toBe('What is the best approach');
    });

    it('tokenizes checkmark (✓)', () => {
      const tokenizer = new Tokenizer('✓ Completed task');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.CHECKMARK);
    });
  });

  // =========================================================================
  // Commands
  // =========================================================================

  describe('Commands', () => {
    it('tokenizes action:', () => {
      const tokenizer = new Tokenizer('action: Run tests');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ACTION);
      expect(tokens[1].value).toBe('Run tests');
    });
  });

  // =========================================================================
  // Modifiers
  // =========================================================================

  describe('Modifiers', () => {
    it('tokenizes urgent (!)', () => {
      const tokenizer = new Tokenizer('! urgent task');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.URGENT);
      expect(tokens[1].value).toBe('urgent task');
    });

    it('tokenizes positive (++)', () => {
      const tokenizer = new Tokenizer('++ great idea');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.POSITIVE);
    });

    it('tokenizes confident (*)', () => {
      const tokenizer = new Tokenizer('* confident claim');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.CONFIDENT);
    });

    it('tokenizes uncertain (~)', () => {
      const tokenizer = new Tokenizer('~ uncertain claim');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.UNCERTAIN);
    });
  });

  // =========================================================================
  // Structure
  // =========================================================================

  describe('Structure', () => {
    it('tokenizes braces', () => {
      const tokenizer = new Tokenizer('{goal}');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.BRACE_OPEN);
      expect(tokens[1].value).toBe('goal');
      expect(tokens[2].type).toBe(TokenType.BRACE_CLOSE);
    });
  });

  // =========================================================================
  // Alternatives
  // =========================================================================

  describe('Alternatives', () => {
    it('tokenizes alternative (||)', () => {
      const tokenizer = new Tokenizer('|| Option B');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ALTERNATIVE);
    });
  });

  // =========================================================================
  // Complex Examples
  // =========================================================================

  describe('Complex Examples', () => {
    it('tokenizes decision with alternatives', () => {
      const input = `
? authentication strategy

|| JWT tokens
  -> stateless
  -> revocation hard

|| session tokens
  -> instant revocation
  -> server state

[decided(rationale: "security > complexity", on: "2025-10-17")]
session tokens
      `.trim();

      const tokenizer = new Tokenizer(input);
      const tokens = tokenizer.tokenize();

      // Should have question marker
      expect(tokens.some(t => t.type === TokenType.QUESTION)).toBe(true);

      // Should have alternatives
      const alternatives = tokens.filter(t => t.type === TokenType.ALTERNATIVE);
      expect(alternatives.length).toBe(2);

      // Should have causal relationships
      const arrows = tokens.filter(t => t.type === TokenType.ARROW_RIGHT);
      expect(arrows.length).toBeGreaterThan(0);

      // Should have decided state
      expect(tokens.some(t => t.type === TokenType.DECIDED)).toBe(true);
    });

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
