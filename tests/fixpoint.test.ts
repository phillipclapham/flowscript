/**
 * FlowScript @fix Operator Tests
 *
 * Comprehensive test suite for the fixpoint combinator:
 * - Grammar parsing (L1, L2, nested, various patterns)
 * - IR structure (fixpoint nodes, ext.fix data)
 * - Linter rules (E007-E011, W004)
 * - Edge cases and mixed content
 */

import { Parser } from '../src/parser';
import { Linter } from '../src/linter';

// Helper: parse and get fixpoint node (optionally by name)
function parseFixpoint(input: string, name?: string) {
  const parser = new Parser('test.fs');
  const ir = parser.parse(input);
  const fixNode = name
    ? ir.nodes.find(n => n.type === 'fixpoint' && (n.ext as any)?.fix?.name === name)
    : ir.nodes.find(n => n.type === 'fixpoint');
  return { ir, fixNode, fix: (fixNode?.ext as any)?.fix };
}

// Helper: parse and lint, return specific rule results
function lintFor(input: string, ruleCode: string) {
  const parser = new Parser('test.fs');
  const ir = parser.parse(input);
  const linter = new Linter();
  const results = linter.lint(ir);
  return results.filter(r => r.rule === ruleCode);
}

describe('@fix Operator', () => {
  // =========================================================================
  // Grammar & Parsing
  // =========================================================================

  describe('Grammar - Basic Parsing', () => {
    it('parses L1 fixpoint with path patterns', () => {
      const { fixNode, fix } = parseFixpoint(
        '@fix propagate_trust {\n' +
        '  match: { A: node -> trusts -> B: node, B: node -> believes -> P: thought }\n' +
        '  yield: { A -> believes -> P | confidence: derived }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fixNode).toBeDefined();
      expect(fixNode!.type).toBe('fixpoint');
      expect(fix.name).toBe('propagate_trust');
      expect(fix.constraint).toBe('L1');
      expect(fix.status).toBe('declared');
    });

    it('parses L2 fixpoint with explicit bound', () => {
      const { fix } = parseFixpoint(
        '@fix generate {\n' +
        '  match: { X: node }\n' +
        '  yield: { new hypothesis(X) -> resolves -> X }\n' +
        '  until: stable or max_iterations: 50\n' +
        '  constraint: L2\n' +
        '}\n'
      );

      expect(fix.constraint).toBe('L2');
      expect(fix.until.type).toBe('compound');
      expect(fix.until.conditions).toHaveLength(2);
      expect(fix.until.conditions[0].type).toBe('stable');
      expect(fix.until.conditions[1].type).toBe('max_iterations');
      expect(fix.until.conditions[1].value).toBe(50);
    });

    it('parses anonymous fixpoint (no name)', () => {
      const { fix } = parseFixpoint(
        '@fix {\n' +
        '  match: tensions()\n' +
        '  yield: resolve(matched)\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.name).toBeNull();
      expect(fix.constraint).toBe('L1');
    });

    it('parses fixpoint with query ref match', () => {
      const { fix } = parseFixpoint(
        '@fix resolve_tensions {\n' +
        '  match: tensions()\n' +
        '  yield: resolve(matched) | strategy: newer_supersedes\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.match).toHaveLength(1);
      expect(fix.match[0].type).toBe('query_ref');
      expect(fix.match[0].query_name).toBe('tensions');
    });

    it('parses timeout termination', () => {
      const { fix } = parseFixpoint(
        '@fix slow {\n' +
        '  match: { X: node }\n' +
        '  yield: { X -> derived -> X }\n' +
        '  until: stable or timeout: 5000ms\n' +
        '  constraint: L2\n' +
        '}\n'
      );

      expect(fix.until.type).toBe('compound');
      const timeout = fix.until.conditions.find((c: any) => c.type === 'timeout');
      expect(timeout).toBeDefined();
      expect(timeout.value).toBe(5000);
      expect(timeout.unit).toBe('ms');
    });

    it('parses measure termination', () => {
      const { fix } = parseFixpoint(
        '@fix bounded {\n' +
        '  match: { X: node }\n' +
        '  yield: { X -> extends -> X }\n' +
        '  until: measure: graph_size\n' +
        '  constraint: L2\n' +
        '}\n'
      );

      expect(fix.until.type).toBe('measure');
      expect(fix.until.measure_name).toBe('graph_size');
    });
  });

  describe('Grammar - Match Patterns', () => {
    it('parses path pattern with edge labels', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { A: node -> trusts -> B: node }\n' +
        '  yield: { A -> believes -> B }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.match[0].type).toBe('path');
      expect(fix.match[0].steps).toHaveLength(3);
      expect(fix.match[0].steps[0]).toEqual({ type: 'node', variable: 'A', node_type: 'node' });
      expect(fix.match[0].steps[1]).toEqual({ type: 'edge', edge_label: 'trusts' });
      expect(fix.match[0].steps[2]).toEqual({ type: 'node', variable: 'B', node_type: 'node' });
    });

    it('parses node pattern with conditions', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { X: node(blocked(X)) }\n' +
        '  yield: { X -> resolved -> X }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.match[0].type).toBe('node');
      expect(fix.match[0].variable).toBe('X');
      expect(fix.match[0].node_type).toBe('node');
      expect(fix.match[0].conditions).toHaveLength(1);
      expect(fix.match[0].conditions[0].name).toBe('blocked');
      expect(fix.match[0].conditions[0].args).toEqual(['X']);
    });

    it('parses negation pattern with query ref', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { X: node, not alternatives(X) }\n' +
        '  yield: { X -> resolved -> X }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.match[1].type).toBe('negation');
      expect(fix.match[1].negated.type).toBe('query_ref');
      expect(fix.match[1].negated.query_name).toBe('alternatives');
    });

    it('parses typed node patterns (thought, decision, etc.)', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { P: decision -> blocks -> G: node }\n' +
        '  yield: { P -> resolved -> G }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.match[0].steps[0].node_type).toBe('decision');
      expect(fix.match[0].steps[2].node_type).toBe('node');
    });
  });

  describe('Grammar - Yield Productions', () => {
    it('parses relationship production with annotations', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { A: node, B: node }\n' +
        '  yield: { A -> believes -> B | confidence: derived }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.yield[0].type).toBe('relationship');
      expect(fix.yield[0].source_var).toBe('A');
      expect(fix.yield[0].edge_label).toBe('believes');
      expect(fix.yield[0].target_var).toBe('B');
      expect(fix.yield[0].annotations).toEqual({ confidence: 'derived' });
    });

    it('parses node+relationship production', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { X: node }\n' +
        '  yield: { new hypothesis(X) -> resolves -> X | source: abductive }\n' +
        '  until: stable or max_iterations: 10\n' +
        '  constraint: L2\n' +
        '}\n'
      );

      expect(fix.yield[0].type).toBe('node_relationship');
      expect(fix.yield[0].node_kind).toBe('hypothesis');
      expect(fix.yield[0].args).toEqual(['X']);
      expect(fix.yield[0].edge_label).toBe('resolves');
      expect(fix.yield[0].target_var).toBe('X');
      expect(fix.yield[0].annotations).toEqual({ source: 'abductive' });
    });

    it('parses builtin resolve(matched) action', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: tensions()\n' +
        '  yield: resolve(matched) | strategy: newer_supersedes\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.yield[0].type).toBe('builtin');
      expect(fix.yield[0].action).toBe('resolve');
      expect(fix.yield[0].variable).toBe('matched');
      expect(fix.yield[0].annotations).toEqual({ strategy: 'newer_supersedes' });
    });

    it('parses state production (resolve/annotate)', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { X: node }\n' +
        '  yield: { resolve(X) | method: consensus }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.yield[0].type).toBe('state');
      expect(fix.yield[0].action).toBe('resolve');
      expect(fix.yield[0].variable).toBe('X');
    });
  });

  describe('Grammar - Nested @fix', () => {
    it('parses nested @fix in yield body (braced)', () => {
      const { fix } = parseFixpoint(
        '@fix resolve_policy {\n' +
        '  match: { P: decision -> blocks -> G: node }\n' +
        '  yield: {\n' +
        '    @fix hypothesize {\n' +
        '      match: { P: node }\n' +
        '      yield: { new candidate(P) -> grounds -> P | source: abductive }\n' +
        '      until: max_iterations: 10\n' +
        '      constraint: L2\n' +
        '    }\n' +
        '  }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n',
        'resolve_policy'
      );

      expect(fix.name).toBe('resolve_policy');
      expect(fix.constraint).toBe('L1');
      // Yield contains nested fix
      expect(fix.yield[0].type).toBe('nested_fix');
      expect(fix.yield[0].nested.name).toBe('hypothesize');
      expect(fix.yield[0].nested.constraint).toBe('L2');
    });

    it('parses nested @fix in yield body (direct)', () => {
      const { fix } = parseFixpoint(
        '@fix outer {\n' +
        '  match: { X: node }\n' +
        '  yield: @fix inner {\n' +
        '    match: { X: node }\n' +
        '    yield: { X -> derived -> X }\n' +
        '    until: max_iterations: 5\n' +
        '    constraint: L2\n' +
        '  }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n',
        'outer'
      );

      expect(fix.yield[0].type).toBe('nested_fix');
      expect(fix.yield[0].nested.name).toBe('inner');
    });
  });

  describe('Grammar - Mixed Content', () => {
    it('parses @fix among regular statements', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse(
        'This is a statement\n' +
        '@fix resolve {\n' +
        '  match: tensions()\n' +
        '  yield: resolve(matched)\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n' +
        'Another statement\n'
      );

      expect(ir.nodes).toHaveLength(3);
      expect(ir.nodes[0].type).toBe('statement');
      expect(ir.nodes[1].type).toBe('fixpoint');
      expect(ir.nodes[2].type).toBe('statement');
    });

    it('does not interfere with existing relationship parsing', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse('A -> B\n');
      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('causes');
    });
  });

  // =========================================================================
  // IR Structure
  // =========================================================================

  describe('IR Structure', () => {
    it('creates fixpoint node with content-hash ID', () => {
      const { fixNode } = parseFixpoint(
        '@fix test {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n'
      );

      expect(fixNode!.id).toMatch(/^[a-f0-9]{64}$/);
    });

    it('stores fix data in ext.fix', () => {
      const { fixNode } = parseFixpoint(
        '@fix test {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n'
      );

      expect(fixNode!.ext).toBeDefined();
      expect((fixNode!.ext as any).fix).toBeDefined();
      expect((fixNode!.ext as any).fix.name).toBe('test');
      expect((fixNode!.ext as any).fix.constraint).toBe('L1');
      expect((fixNode!.ext as any).fix.status).toBe('declared');
    });

    it('produces human-readable content', () => {
      const { fixNode } = parseFixpoint(
        '@fix propagate {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n'
      );

      expect(fixNode!.content).toContain('propagate');
      expect(fixNode!.content).toContain('L1');
      expect(fixNode!.content).toContain('declared');
    });

    it('same @fix produces same content hash', () => {
      const input = '@fix test {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n';
      const { fixNode: fp1 } = parseFixpoint(input);
      const { fixNode: fp2 } = parseFixpoint(input);

      expect(fp1!.id).toBe(fp2!.id);
    });

    it('different @fix produces different content hash', () => {
      const { fixNode: fp1 } = parseFixpoint(
        '@fix a {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n'
      );
      const { fixNode: fp2 } = parseFixpoint(
        '@fix b {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n'
      );

      expect(fp1!.id).not.toBe(fp2!.id);
    });
  });

  // =========================================================================
  // Linter Rules
  // =========================================================================

  describe('E007: fixpoint-constraint-violation', () => {
    it('detects L1 with node creation (node_relationship)', () => {
      const results = lintFor(
        '@fix bad {\n  match: { X: node }\n  yield: { new hypothesis(X) -> resolves -> X }\n  until: stable\n  constraint: L1\n}\n',
        'E007'
      );
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('L1');
      expect(results[0].message).toContain('node creation');
    });

    it('detects L1 with standalone node creation', () => {
      // Construct IR with standalone node production (type: 'node')
      const ir = {
        version: '1.0.0' as const,
        nodes: [{
          id: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
          type: 'fixpoint' as const,
          content: 'bad: L1 fixpoint (declared)',
          provenance: { source_file: 'test.fs', line_number: 1, timestamp: new Date().toISOString() },
          ext: { fix: { name: 'bad', constraint: 'L1', status: 'declared', match: [], yield: [{ type: 'node', node_kind: 'hypothesis', args: ['X'] }], until: { type: 'stable' } } }
        }],
        relationships: [],
        states: [],
        invariants: {}
      };
      const linter = new Linter();
      const results = linter.lint(ir).filter(r => r.rule === 'E007');
      expect(results).toHaveLength(1);
    });

    it('does not flag L2 with node creation', () => {
      const results = lintFor(
        '@fix ok {\n  match: { X: node }\n  yield: { new hypothesis(X) -> resolves -> X }\n  until: stable or max_iterations: 10\n  constraint: L2\n}\n',
        'E007'
      );
      expect(results).toHaveLength(0);
    });

    it('does not flag L1 without node creation', () => {
      const results = lintFor(
        '@fix ok {\n  match: { A: node, B: node }\n  yield: { A -> trusts -> B }\n  until: stable\n  constraint: L1\n}\n',
        'E007'
      );
      expect(results).toHaveLength(0);
    });
  });

  describe('E008: fixpoint-l2-missing-bound', () => {
    it('detects L2 with only stable (no explicit bound)', () => {
      const results = lintFor(
        '@fix bad {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: stable\n  constraint: L2\n}\n',
        'E008'
      );
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('no explicit termination bound');
    });

    it('accepts L2 with max_iterations', () => {
      const results = lintFor(
        '@fix ok {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: stable or max_iterations: 50\n  constraint: L2\n}\n',
        'E008'
      );
      expect(results).toHaveLength(0);
    });

    it('accepts L2 with timeout', () => {
      const results = lintFor(
        '@fix ok {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: timeout: 5000ms\n  constraint: L2\n}\n',
        'E008'
      );
      expect(results).toHaveLength(0);
    });

    it('accepts L2 with measure', () => {
      const results = lintFor(
        '@fix ok {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: measure: graph_size\n  constraint: L2\n}\n',
        'E008'
      );
      expect(results).toHaveLength(0);
    });

    it('does not flag L1 (always terminates)', () => {
      const results = lintFor(
        '@fix ok {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n',
        'E008'
      );
      expect(results).toHaveLength(0);
    });
  });

  describe('E009: fixpoint-missing-constraint', () => {
    it('detects missing constraint (manually constructed IR)', () => {
      // Construct IR directly with a fixpoint node missing constraint
      const ir = {
        version: '1.0.0' as const,
        nodes: [{
          id: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
          type: 'fixpoint' as const,
          content: 'test: ? fixpoint (declared)',
          provenance: { source_file: 'test.fs', line_number: 1, timestamp: new Date().toISOString() },
          ext: { fix: { name: 'test', constraint: null, status: 'declared', match: [], yield: [], until: null } }
        }],
        relationships: [],
        states: [],
        invariants: {}
      };

      const linter = new Linter();
      const results = linter.lint(ir).filter(r => r.rule === 'E009');
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('no constraint level');
    });
  });

  describe('E010: fixpoint-unstratifiable-negation (WARNING)', () => {
    it('warns on negated graph-reading query with yield', () => {
      const results = lintFor(
        '@fix test {\n  match: { X: node, not alternatives(X) }\n  yield: { new hypothesis(X) -> resolves -> X }\n  until: stable or max_iterations: 10\n  constraint: L2\n}\n',
        'E010'
      );
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('WARNING');
      expect(results[0].message).toContain('alternatives');
    });

    it('does not warn when no negation in match', () => {
      const results = lintFor(
        '@fix test {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: stable\n  constraint: L1\n}\n',
        'E010'
      );
      expect(results).toHaveLength(0);
    });
  });

  describe('E011: fixpoint-nesting-de-escalation', () => {
    it('detects L1 nested inside L2 (de-escalation)', () => {
      // Create IR with nested fix where inner constraint < outer
      const ir = {
        version: '1.0.0' as const,
        nodes: [{
          id: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
          type: 'fixpoint' as const,
          content: 'outer: L2 fixpoint (declared)',
          provenance: { source_file: 'test.fs', line_number: 1, timestamp: new Date().toISOString() },
          ext: {
            fix: {
              name: 'outer',
              constraint: 'L2',
              status: 'declared',
              match: [],
              yield: [{
                type: 'nested_fix',
                nested: {
                  name: 'inner',
                  constraint: 'L1',
                  status: 'declared',
                  match: [],
                  yield: [],
                  until: { type: 'stable' }
                }
              }],
              until: { type: 'compound', conditions: [{ type: 'stable' }, { type: 'max_iterations', value: 50 }] }
            }
          }
        }],
        relationships: [],
        states: [],
        invariants: {}
      };

      const linter = new Linter();
      const results = linter.lint(ir).filter(r => r.rule === 'E011');
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('L1');
      expect(results[0].message).toContain('L2');
    });

    it('accepts L2 nested inside L1 (valid escalation)', () => {
      const { ir } = parseFixpoint(
        '@fix outer {\n' +
        '  match: { X: node }\n' +
        '  yield: {\n' +
        '    @fix inner {\n' +
        '      match: { X: node }\n' +
        '      yield: { new candidate(X) -> grounds -> X }\n' +
        '      until: max_iterations: 10\n' +
        '      constraint: L2\n' +
        '    }\n' +
        '  }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      const linter = new Linter();
      const results = linter.lint(ir).filter(r => r.rule === 'E011');
      expect(results).toHaveLength(0);
    });
  });

  describe('W004: fixpoint-high-iteration-count', () => {
    it('warns on max_iterations > 100', () => {
      const results = lintFor(
        '@fix slow {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: stable or max_iterations: 500\n  constraint: L2\n}\n',
        'W004'
      );
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('WARNING');
      expect(results[0].message).toContain('500');
    });

    it('does not warn on max_iterations <= 100', () => {
      const results = lintFor(
        '@fix ok {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: stable or max_iterations: 50\n  constraint: L2\n}\n',
        'W004'
      );
      expect(results).toHaveLength(0);
    });

    it('does not warn on exactly 100', () => {
      const results = lintFor(
        '@fix ok {\n  match: { X: node }\n  yield: { X -> derived -> X }\n  until: stable or max_iterations: 100\n  constraint: L2\n}\n',
        'W004'
      );
      expect(results).toHaveLength(0);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('handles multiple @fix in same document', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse(
        '@fix first {\n  match: tensions()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n' +
        '@fix second {\n  match: blocked()\n  yield: resolve(matched)\n  until: stable\n  constraint: L1\n}\n'
      );

      const fixNodes = ir.nodes.filter(n => n.type === 'fixpoint');
      expect(fixNodes).toHaveLength(2);
      expect((fixNodes[0].ext as any).fix.name).toBe('first');
      expect((fixNodes[1].ext as any).fix.name).toBe('second');
    });

    it('handles multiple yield elements', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { A: node, B: node }\n' +
        '  yield: { A -> trusts -> B, B -> trusts -> A }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.yield).toHaveLength(2);
      expect(fix.yield[0].source_var).toBe('A');
      expect(fix.yield[1].source_var).toBe('B');
    });

    it('handles multiple match patterns', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { A: node, B: thought, C: decision }\n' +
        '  yield: { A -> relates -> B }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.match).toHaveLength(3);
    });

    it('preserves existing parser functionality (regression check)', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse(
        'thought: This is a thought\n' +
        '? What about this\n' +
        '✓ Done\n' +
        'A -> B\n' +
        'speed ><[performance] quality\n'
      );

      expect(ir.nodes.length).toBeGreaterThanOrEqual(4);
      expect(ir.relationships.length).toBeGreaterThanOrEqual(2);
    });

    it('handles clause ordering flexibility (constraint first)', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  constraint: L1\n' +
        '  until: stable\n' +
        '  yield: resolve(matched)\n' +
        '  match: tensions()\n' +
        '}\n'
      );

      expect(fix.constraint).toBe('L1');
      expect(fix.match[0].query_name).toBe('tensions');
      expect(fix.until.type).toBe('stable');
    });

    it('handles annotate state production', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { X: node }\n' +
        '  yield: { annotate(X) | status: reviewed }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.yield[0].type).toBe('state');
      expect(fix.yield[0].action).toBe('annotate');
      expect(fix.yield[0].annotations).toEqual({ status: 'reviewed' });
    });

    it('handles fixpoint node type in match patterns', () => {
      const { fix } = parseFixpoint(
        '@fix meta {\n' +
        '  match: { F: fixpoint }\n' +
        '  yield: { F -> analyzed -> F }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.match[0].node_type).toBe('fixpoint');
    });

    it('handles multiple annotations on yield element', () => {
      const { fix } = parseFixpoint(
        '@fix test {\n' +
        '  match: { A: node, B: node }\n' +
        '  yield: { A -> trusts -> B | confidence: high | source: derived | round: 3 }\n' +
        '  until: stable\n' +
        '  constraint: L1\n' +
        '}\n'
      );

      expect(fix.yield[0].annotations).toEqual({
        confidence: 'high',
        source: 'derived',
        round: '3'
      });
    });
  });
});
