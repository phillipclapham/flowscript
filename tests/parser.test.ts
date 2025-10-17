/**
 * Parser Tests
 *
 * Comprehensive test coverage for FlowScript → IR compilation
 */

import { Tokenizer } from '../src/tokenizer';
import { Parser } from '../src/parser';
import { TokenType } from '../src/types';

describe('Parser', () => {
  // =========================================================================
  // Basic Parsing
  // =========================================================================

  describe('Basic Parsing', () => {
    it('parses simple statement', () => {
      const input = 'This is a statement';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.version).toBe('1.0.0');
      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('statement');
      expect(ir.nodes[0].content).toBe('This is a statement');
      expect(ir.nodes[0].id).toMatch(/^[a-f0-9]{64}$/);  // SHA-256 hash
    });

    it('parses question', () => {
      const input = '? What is the best approach';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('question');
      expect(ir.nodes[0].content).toBe('What is the best approach');
    });

    it('parses thought', () => {
      const input = 'thought: This is interesting';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('thought');
      expect(ir.nodes[0].content).toBe('This is interesting');
    });

    it('parses action', () => {
      const input = 'action: Run tests';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('action');
      expect(ir.nodes[0].content).toBe('Run tests');
    });

    it('parses completion (checkmark)', () => {
      const input = '✓ Completed task';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('completion');
      expect(ir.nodes[0].content).toContain('✓');
    });
  });

  // =========================================================================
  // Relationships
  // =========================================================================

  describe('Relationships', () => {
    it('parses causal relationship (->)', () => {
      const input = 'A -> B';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(2);
      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('causes');
      expect(ir.relationships[0].source).toBe(ir.nodes[0].id);
      expect(ir.relationships[0].target).toBe(ir.nodes[1].id);
    });

    it('parses reverse causal (<-)', () => {
      const input = 'A <- B';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('causes');
      // Source and target should be swapped for <-
      expect(ir.relationships[0].source).toBe(ir.nodes[1].id);
      expect(ir.relationships[0].target).toBe(ir.nodes[0].id);
    });

    it('parses bidirectional (<->)', () => {
      const input = 'A <-> B';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('bidirectional');
    });

    it('parses temporal sequence (=>)', () => {
      const input = 'A => B';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('temporal');
    });

    it('parses tension without axis', () => {
      const input = 'speed >< quality';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('tension');
      expect(ir.relationships[0].axis_label).toBeNull();
    });

    it('parses tension with axis label', () => {
      const input = 'speed ><[velocity vs quality] quality';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('tension');
      expect(ir.relationships[0].axis_label).toBe('velocity vs quality');
    });

    it('parses causal chain (A -> B -> C)', () => {
      const input = 'A -> B -> C';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(3);
      expect(ir.relationships).toHaveLength(2);
      expect(ir.relationships[0].type).toBe('causes');
      expect(ir.relationships[1].type).toBe('causes');
    });
  });

  // =========================================================================
  // State Markers
  // =========================================================================

  describe('State Markers', () => {
    it('parses [decided] without fields', () => {
      const input = '[decided] Ship now';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('decided');
      expect(ir.states[0].node_id).toBe(ir.nodes[0].id);
      expect(ir.states[0].fields).toEqual({});
    });

    it('parses [decided] with fields', () => {
      const input = '[decided(rationale: "test reason", on: "2025-10-17")] Ship now';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('decided');
      expect(ir.states[0].fields.rationale).toBe('test reason');
      expect(ir.states[0].fields.on).toBe('2025-10-17');
    });

    it('parses [blocked] with fields', () => {
      const input = '[blocked(reason: "waiting for API", since: "2025-10-17")] Task X';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('blocked');
      expect(ir.states[0].fields.reason).toBe('waiting for API');
      expect(ir.states[0].fields.since).toBe('2025-10-17');
    });

    it('parses [exploring]', () => {
      const input = '[exploring] Multiple approaches';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('exploring');
    });

    it('parses [parking] with fields', () => {
      const input = '[parking(why: "low priority", until: "Q2")] Feature Y';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('parking');
      expect(ir.states[0].fields.why).toBe('low priority');
      expect(ir.states[0].fields.until).toBe('Q2');
    });
  });

  // =========================================================================
  // Modifiers
  // =========================================================================

  describe('Modifiers', () => {
    it('parses urgent modifier (!)', () => {
      const input = '! urgent task';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].ext?.modifiers).toContain('urgent');
    });

    it('parses positive modifier (++)', () => {
      const input = '++ great idea';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].ext?.modifiers).toContain('strong_positive');
    });

    it('parses confident modifier (*)', () => {
      const input = '* confident claim';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].ext?.modifiers).toContain('high_confidence');
    });

    it('parses uncertain modifier (~)', () => {
      const input = '~ uncertain claim';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].ext?.modifiers).toContain('low_confidence');
    });

    it('parses multiple modifiers', () => {
      const input = '! * critical and certain';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].ext?.modifiers).toContain('urgent');
      expect(ir.nodes[0].ext?.modifiers).toContain('high_confidence');
    });
  });

  // =========================================================================
  // Provenance Tracking
  // =========================================================================

  describe('Provenance', () => {
    it('tracks source file in nodes', () => {
      const input = 'Test statement';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'example.fs').parse();

      expect(ir.nodes[0].provenance.source_file).toBe('example.fs');
    });

    it('tracks line numbers', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes[0].provenance.line_number).toBe(1);
      expect(ir.nodes[1].provenance.line_number).toBe(2);
      expect(ir.nodes[2].provenance.line_number).toBe(3);
    });

    it('includes timestamp in provenance', () => {
      const input = 'Test';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes[0].provenance.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // =========================================================================
  // IR Structure
  // =========================================================================

  describe('IR Structure', () => {
    it('includes version', () => {
      const input = 'Test';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.version).toBe('1.0.0');
    });

    it('includes invariants', () => {
      const input = 'Test';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.invariants).toBeDefined();
      expect(ir.invariants.causal_acyclic).toBe(true);
      expect(ir.invariants.all_nodes_reachable).toBe(true);
      expect(ir.invariants.tension_axes_labeled).toBe(true);
      expect(ir.invariants.state_fields_present).toBe(true);
    });

    it('includes metadata', () => {
      const input = 'Test';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.metadata).toBeDefined();
      expect(ir.metadata?.source_files).toContain('test.fs');
      expect(ir.metadata?.parsed_at).toBeDefined();
      expect(ir.metadata?.parser).toBeDefined();
    });
  });

  // =========================================================================
  // Complex Examples
  // =========================================================================

  describe('Complex Examples', () => {
    it('parses decision with alternatives', () => {
      const input = `
? authentication strategy

|| JWT tokens
|| session tokens

[decided(rationale: "security wins", on: "2025-10-17")]
session tokens
      `.trim();

      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      // Should have question + 2 alternatives + decided option
      expect(ir.nodes.length).toBeGreaterThanOrEqual(3);

      // Should have decided state
      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('decided');
    });

    it('parses thought with causal chain', () => {
      const input = 'thought: performance issue -> slow queries -> missing indexes';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes).toHaveLength(3);
      expect(ir.relationships).toHaveLength(2);
      expect(ir.nodes[0].type).toBe('thought');
    });

    it('parses multi-line document', () => {
      const input = `
? How to optimize

thought: Current bottleneck is database
slow queries -> missing indexes

[decided(rationale: "add indexes", on: "2025-10-17")]
Add indexes to users table
      `.trim();

      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes.length).toBeGreaterThan(0);
      expect(ir.relationships.length).toBeGreaterThan(0);
      expect(ir.states).toHaveLength(1);
    });
  });

  // =========================================================================
  // Content Hash Deduplication
  // =========================================================================

  describe('Content Hash', () => {
    it('generates same ID for identical content', () => {
      const input1 = 'Test statement';
      const input2 = 'Test statement';

      const tokens1 = new Tokenizer(input1).tokenize();
      const ir1 = new Parser(tokens1, 'test.fs').parse();

      const tokens2 = new Tokenizer(input2).tokenize();
      const ir2 = new Parser(tokens2, 'test.fs').parse();

      expect(ir1.nodes[0].id).toBe(ir2.nodes[0].id);
    });

    it('generates different IDs for different content', () => {
      const input = 'A\nB';
      const tokens = new Tokenizer(input).tokenize();
      const ir = new Parser(tokens, 'test.fs').parse();

      expect(ir.nodes[0].id).not.toBe(ir.nodes[1].id);
    });
  });
});
