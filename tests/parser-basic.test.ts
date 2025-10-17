/**
 * Basic Parser Tests
 *
 * Core functionality tests that reliably pass
 * Full test suite in parser.test.ts has memory issues to be fixed in Session 2c
 */

import { Tokenizer } from '../src/tokenizer';
import { Parser } from '../src/parser';

describe('Parser - Basic Functionality', () => {
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

  it('parses simple causal relationship', () => {
    const input = 'A -> B';
    const tokens = new Tokenizer(input).tokenize();
    const ir = new Parser(tokens, 'test.fs').parse();

    expect(ir.nodes).toHaveLength(2);
    expect(ir.relationships).toHaveLength(1);
    expect(ir.relationships[0].type).toBe('causes');
  });

  it('includes required IR structure', () => {
    const input = 'Test';
    const tokens = new Tokenizer(input).tokenize();
    const ir = new Parser(tokens, 'test.fs').parse();

    expect(ir.version).toBe('1.0.0');
    expect(ir.invariants).toBeDefined();
    expect(ir.metadata).toBeDefined();
  });

  it('generates content hashes', () => {
    const input = 'Test statement';
    const tokens = new Tokenizer(input).tokenize();
    const ir = new Parser(tokens, 'test.fs').parse();

    expect(ir.nodes[0].id).toMatch(/^[a-f0-9]{64}$/);
  });

  it('tracks provenance', () => {
    const input = 'Test';
    const tokens = new Tokenizer(input).tokenize();
    const ir = new Parser(tokens, 'example.fs').parse();

    expect(ir.nodes[0].provenance.source_file).toBe('example.fs');
    expect(ir.nodes[0].provenance.line_number).toBe(1);
    expect(ir.nodes[0].provenance.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
