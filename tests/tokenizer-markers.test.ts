/**
 * Tokenizer Tests - Markers
 *
 * Tests for basic FlowScript markers (Core Relations, Definitions, States, etc.)
 */

import { Tokenizer } from '../src/tokenizer';
import { TokenType } from '../src/types';

describe('Tokenizer - Markers', () => {
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
});
