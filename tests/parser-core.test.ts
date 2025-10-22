/**
 * Parser Tests (PEG)
 *
 * Comprehensive test coverage for FlowScript → IR compilation
 */

import { Parser } from '../src/parser';

describe('Parser', () => {
  // =========================================================================
  // Basic Parsing
  // =========================================================================

  describe('Basic Parsing', () => {
    it('parses simple statement', () => {
      const input = 'This is a statement';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.version).toBe('1.0.0');
      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('statement');
      expect(ir.nodes[0].content).toBe('This is a statement');
      expect(ir.nodes[0].id).toMatch(/^[a-f0-9]{64}$/);  // SHA-256 hash
    });

    it('parses question', () => {
      const input = '? What is the best approach';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('question');
      expect(ir.nodes[0].content).toBe('What is the best approach');
    });

    it('parses thought', () => {
      const input = 'thought: This is interesting';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('thought');
      expect(ir.nodes[0].content).toBe('This is interesting');
    });

    it('parses action', () => {
      const input = 'action: Run tests';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('action');
      expect(ir.nodes[0].content).toBe('Run tests');
    });

    it('parses completion (checkmark)', () => {
      const input = '✓ Completed task';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('completion');
      expect(ir.nodes[0].content).toBe('Completed task');
    });
  });

  // =========================================================================
  // Relationships
  // =========================================================================

  describe('Relationships', () => {
    it('parses causal relationship (->)', () => {
      const input = 'A -> B';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(2);
      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('causes');
      expect(ir.relationships[0].source).toBe(ir.nodes[0].id);
      expect(ir.relationships[0].target).toBe(ir.nodes[1].id);
    });

    it('parses reverse causal (<-)', () => {
      const input = 'A <- B';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('derives_from');
      // A <- B means "A derives_from B"
      expect(ir.relationships[0].source).toBe(ir.nodes[0].id); // A
      expect(ir.relationships[0].target).toBe(ir.nodes[1].id); // B
    });

    it('parses bidirectional (<->)', () => {
      const input = 'A <-> B';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('bidirectional');
    });

    it('parses temporal sequence (=>)', () => {
      const input = 'A => B';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('temporal');
    });

    it('parses tension without axis', () => {
      const input = 'speed >< quality';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('tension');
      expect(ir.relationships[0].axis_label).toBeNull();
    });

    it('parses tension with axis label', () => {
      const input = 'speed ><[velocity vs quality] quality';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('tension');
      expect(ir.relationships[0].axis_label).toBe('velocity vs quality');
    });

    it('parses causal chain (A -> B -> C)', () => {
      const input = 'A -> B -> C';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

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
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('decided');
      expect(ir.states[0].node_id).toBe(ir.nodes[0].id);
      expect(ir.states[0].fields).toEqual({});
    });

    it('parses [decided] with fields', () => {
      const input = '[decided(rationale: "test reason", on: "2025-10-17")] Ship now';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('decided');
      expect(ir.states[0].fields.rationale).toBe('test reason');
      expect(ir.states[0].fields.on).toBe('2025-10-17');
    });

    it('parses [blocked] with fields', () => {
      const input = '[blocked(reason: "waiting for API", since: "2025-10-17")] Task X';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('blocked');
      expect(ir.states[0].fields.reason).toBe('waiting for API');
      expect(ir.states[0].fields.since).toBe('2025-10-17');
    });

    it('parses [exploring]', () => {
      const input = '[exploring] Multiple approaches';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('exploring');
    });

    it('parses [parking] with fields', () => {
      const input = '[parking(why: "low priority", until: "Q2")] Feature Y';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

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
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].modifiers).toContain('urgent');
    });

    it('parses positive modifier (++)', () => {
      const input = '++ great idea';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].modifiers).toContain('strong_positive');
    });

    it('parses confident modifier (*)', () => {
      const input = '* confident claim';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].modifiers).toContain('high_confidence');
    });

    it('parses uncertain modifier (~)', () => {
      const input = '~ uncertain claim';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].modifiers).toContain('low_confidence');
    });

    it('parses multiple modifiers', () => {
      const input = '! * critical and certain';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].modifiers).toContain('urgent');
      expect(ir.nodes[0].modifiers).toContain('high_confidence');
    });
  });

  // =========================================================================
  // Alternative Marker
  // =========================================================================

  describe('Alternative Marker', () => {
    it('parses single alternative', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse('|| Option A');

      expect(ir.nodes.length).toBe(1);
      expect(ir.nodes[0].type).toBe('alternative');
      expect(ir.nodes[0].content).toBe('Option A');
    });

    it('parses multiple alternatives', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse(`? Which option?
  || Option A
  || Option B
  || Option C`);

      const alternatives = ir.nodes.filter(n => n.type === 'alternative');
      expect(alternatives.length).toBe(3);
      expect(alternatives[0].content).toBe('Option A');
      expect(alternatives[1].content).toBe('Option B');
      expect(alternatives[2].content).toBe('Option C');
    });

    it('parses alternatives with analysis', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse(`? auth strategy
  || JWT tokens
     -> stateless
  || session + Redis
     -> instant revocation`);

      const alternatives = ir.nodes.filter(n => n.type === 'alternative');
      expect(alternatives.length).toBe(2);
      expect(alternatives[0].content).toBe('JWT tokens');
      expect(alternatives[1].content).toBe('session + Redis');

      // Should have relationship nodes too
      const stmts = ir.nodes.filter(n => n.type === 'statement');
      expect(stmts.length).toBeGreaterThan(0);
    });

    it('alternative marker works with modifiers', () => {
      const parser = new Parser('test.fs');
      const ir = parser.parse('! || urgent alternative');

      expect(ir.nodes[0].type).toBe('alternative');
      // Note: modifiers stored in parser state, check ext field
      expect(ir.nodes[0].modifiers).toContain('urgent');
    });
  });

  // =========================================================================
});
