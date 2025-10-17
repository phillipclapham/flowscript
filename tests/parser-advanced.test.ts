/**
 * Parser Tests - Advanced
 *
 * Tests for provenance tracking, IR structure, complex examples, content hashing
 */

import { Tokenizer } from '../src/tokenizer';
import { Parser } from '../src/parser';

describe('Parser - Advanced', () => {
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
