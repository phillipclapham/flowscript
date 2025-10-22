/**
 * Tests for Provenance Line Number Mapping
 *
 * Verifies that line numbers in IR provenance reference the ORIGINAL source lines,
 * not the transformed lines after indentation preprocessing.
 *
 * Session: 4a-continued-3 (Provenance Preservation)
 */

import { Parser } from '../src/parser';
import { IR } from '../src/types';

describe('Provenance Line Number Mapping', () => {
  describe('Simple indentation', () => {
    it('maps simple 2-level indentation correctly', () => {
      const input = `A
  B
  C`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      // Find nodes by content
      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');

      // Verify original line numbers (not transformed line numbers)
      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(2); // NOT line 2 of transformed ({B)
      expect(nodeC?.provenance.line_number).toBe(3); // NOT line 3 or 4
    });

    it('maps 3-level indentation correctly', () => {
      const input = `A
  B
    C
      D`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');
      const nodeD = ir.nodes.find(n => n.content === 'D');

      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(2);
      expect(nodeC?.provenance.line_number).toBe(3);
      expect(nodeD?.provenance.line_number).toBe(4);
    });
  });

  describe('Deep nesting', () => {
    it('maps 5 levels of nesting correctly', () => {
      const input = `level 0
  level 1
    level 2
      level 3
        level 4`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodes = ir.nodes.filter(n => n.type === 'statement');

      expect(nodes[0]?.provenance.line_number).toBe(1); // level 0
      expect(nodes[1]?.provenance.line_number).toBe(2); // level 1
      expect(nodes[2]?.provenance.line_number).toBe(3); // level 2
      expect(nodes[3]?.provenance.line_number).toBe(4); // level 3
      expect(nodes[4]?.provenance.line_number).toBe(5); // level 4
    });
  });

  describe('Multiple dedents', () => {
    it('maps multiple dedents in one step correctly', () => {
      const input = `A
  B
    C
      D
E`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');
      const nodeD = ir.nodes.find(n => n.content === 'D');
      const nodeE = ir.nodes.find(n => n.content === 'E');

      // All nodes should reference original line numbers
      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(2);
      expect(nodeC?.provenance.line_number).toBe(3);
      expect(nodeD?.provenance.line_number).toBe(4);
      expect(nodeE?.provenance.line_number).toBe(5); // NOT some higher number from closing braces
    });
  });

  describe('Blank lines', () => {
    it('maps line numbers correctly with blank lines', () => {
      const input = `A

  B

  C`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');

      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(3); // Line 3 in original (blank on line 2)
      expect(nodeC?.provenance.line_number).toBe(5); // Line 5 in original (blank on line 4)
    });
  });

  describe('Relationship operators', () => {
    it('maps causal relationships with indentation', () => {
      const input = `A
  -> B
  -> C`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');

      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(2);
      expect(nodeC?.provenance.line_number).toBe(3);

      // Verify relationships were created (A -> B and B -> C is continuation chaining)
      expect(ir.relationships.length).toBeGreaterThanOrEqual(1);
    });

    it('maps all relationship operators correctly', () => {
      const input = `A
  -> causes
  <- reverse
  <-> bidirectional
  => temporal
  ><[axis] tension`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodes = ir.nodes.filter(n => n.type === 'statement');

      expect(nodes[0]?.provenance.line_number).toBe(1); // A
      expect(nodes[1]?.provenance.line_number).toBe(2); // causes
      expect(nodes[2]?.provenance.line_number).toBe(3); // reverse
      expect(nodes[3]?.provenance.line_number).toBe(4); // bidirectional
      expect(nodes[4]?.provenance.line_number).toBe(5); // temporal
      expect(nodes[5]?.provenance.line_number).toBe(6); // tension

      // Verify relationships were created
      expect(ir.relationships.length).toBeGreaterThan(0);
    });
  });

  describe('Alternative markers', () => {
    it('maps alternative markers with indented children', () => {
      const input = `? question
  || option A
     -> implication A
  || option B
     -> implication B`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const question = ir.nodes.find(n => n.type === 'question');
      const altA = ir.nodes.find(n => n.content === 'option A');
      const implA = ir.nodes.find(n => n.content === 'implication A');
      const altB = ir.nodes.find(n => n.content === 'option B');
      const implB = ir.nodes.find(n => n.content === 'implication B');

      // Verify all line numbers are correct
      expect(question?.provenance.line_number).toBe(1);
      expect(altA?.provenance.line_number).toBe(2);
      expect(implA?.provenance.line_number).toBe(3);
      expect(altB?.provenance.line_number).toBe(4);
      expect(implB?.provenance.line_number).toBe(5);

      // Verify alternative nodes created (line numbers are correct regardless of relationships)
      const alternatives = ir.nodes.filter(n => n.type === 'alternative');
      expect(alternatives.length).toBe(2);

      // Note: Continuation relationships with alternatives may not work in current parser
      // This is a separate issue from provenance mapping. For this session, we only verify
      // that line numbers are correct (which they are above).
    });
  });

  describe('State markers', () => {
    it('maps state markers correctly', () => {
      const input = `[decided(rationale: "test", on: "2025-01-01")] A
[blocked(reason: "waiting", since: "2025-01-01")] B
  -> C`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');

      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(2);
      expect(nodeC?.provenance.line_number).toBe(3);

      // Verify states created
      expect(ir.states.length).toBe(2);
      const decidedState = ir.states.find(s => s.type === 'decided');
      const blockedState = ir.states.find(s => s.type === 'blocked');

      expect(decidedState?.provenance.line_number).toBe(1);
      expect(blockedState?.provenance.line_number).toBe(2);
    });
  });

  describe('Mixed explicit blocks and indentation', () => {
    it('maps mixed syntax correctly', () => {
      const input = `A {
  B
  C
}
D
  E`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');
      const nodeD = ir.nodes.find(n => n.content === 'D');
      const nodeE = ir.nodes.find(n => n.content === 'E');

      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(2);
      expect(nodeC?.provenance.line_number).toBe(3);
      expect(nodeD?.provenance.line_number).toBe(5);
      expect(nodeE?.provenance.line_number).toBe(6);
    });
  });

  describe('EOF scenarios', () => {
    it('maps EOF with open indentation correctly', () => {
      const input = `A
  B
    C`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const nodeA = ir.nodes.find(n => n.content === 'A');
      const nodeB = ir.nodes.find(n => n.content === 'B');
      const nodeC = ir.nodes.find(n => n.content === 'C');

      // All nodes should reference original lines
      expect(nodeA?.provenance.line_number).toBe(1);
      expect(nodeB?.provenance.line_number).toBe(2);
      expect(nodeC?.provenance.line_number).toBe(3);

      // No node should have a line number beyond the input
      const maxLine = Math.max(...ir.nodes.map(n => n.provenance.line_number));
      expect(maxLine).toBeLessThanOrEqual(3);
    });
  });

  describe('Modifiers with indentation', () => {
    it('maps modifiers with indented content', () => {
      const input = `! urgent task
  -> must do this
++ strong positive
  -> very confident`;
      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      const urgent = ir.nodes.find(n => n.content === 'urgent task');
      const mustDo = ir.nodes.find(n => n.content === 'must do this');
      const positive = ir.nodes.find(n => n.content === 'strong positive');
      const confident = ir.nodes.find(n => n.content === 'very confident');

      expect(urgent?.provenance.line_number).toBe(1);
      expect(mustDo?.provenance.line_number).toBe(2);
      expect(positive?.provenance.line_number).toBe(3);
      expect(confident?.provenance.line_number).toBe(4);

      // Verify modifiers attached
      expect(urgent?.modifiers).toContain('urgent');
      expect(positive?.modifiers).toContain('strong_positive');
    });
  });

  describe('Complete example - decision pattern', () => {
    it('maps complete decision example with correct line numbers', () => {
      const input = `? authentication strategy for v1
  || JWT tokens
     -> stateless architecture
        -> scales horizontally
     -> revocation difficult
  || session tokens + Redis
     -> instant revocation
     -> operational complexity
[decided(rationale: "security", on: "2025-01-20")] session tokens + Redis
  action: implement session store
  action: setup Redis cluster`;

      const parser = new Parser('test.fs');
      const ir: IR = parser.parse(input);

      // Verify all nodes have correct line numbers
      const question = ir.nodes.find(n => n.type === 'question');
      expect(question?.provenance.line_number).toBe(1);

      const jwtAlt = ir.nodes.find(n => n.content === 'JWT tokens');
      expect(jwtAlt?.provenance.line_number).toBe(2);

      const stateless = ir.nodes.find(n => n.content === 'stateless architecture');
      expect(stateless?.provenance.line_number).toBe(3);

      const scales = ir.nodes.find(n => n.content === 'scales horizontally');
      expect(scales?.provenance.line_number).toBe(4);

      const revocation = ir.nodes.find(n => n.content === 'revocation difficult');
      expect(revocation?.provenance.line_number).toBe(5);

      const sessionAlt = ir.nodes.find(n => n.content === 'session tokens + Redis');
      expect(sessionAlt?.provenance.line_number).toBe(6);

      const instant = ir.nodes.find(n => n.content === 'instant revocation');
      expect(instant?.provenance.line_number).toBe(7);

      const operational = ir.nodes.find(n => n.content === 'operational complexity');
      expect(operational?.provenance.line_number).toBe(8);

      const decision = ir.nodes.find(n => n.content === 'session tokens + Redis' && n.provenance.line_number === 9);
      expect(decision?.provenance.line_number).toBe(9);

      const actions = ir.nodes.filter(n => n.type === 'action');
      expect(actions[0]?.provenance.line_number).toBe(10);
      expect(actions[1]?.provenance.line_number).toBe(11);

      // Verify relationships created
      expect(ir.relationships.length).toBeGreaterThan(0);

      // Verify alternative nodes created
      const alternatives = ir.nodes.filter(n => n.type === 'alternative');
      expect(alternatives.length).toBe(2);
      expect(alternatives[0].content).toBe('JWT tokens');
      expect(alternatives[1].content).toBe('session tokens + Redis');

      // Verify causal relationships created (from continuation syntax)
      const causesRels = ir.relationships.filter(r => r.type === 'causes');
      expect(causesRels.length).toBeGreaterThan(0);

      // Verify state marker
      expect(ir.states.length).toBe(1);
      expect(ir.states[0].type).toBe('decided');
      expect(ir.states[0].provenance.line_number).toBe(9);
    });
  });
});
