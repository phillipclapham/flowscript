/**
 * Block Parsing Tests
 *
 * Tests for `{ }` thought blocks - atomic processing units that enable
 * hierarchical structure, nesting, and complex relationship expression.
 *
 * Spec: /spec/semantics.md lines 746-800
 */

import { Parser } from '../src/parser';
import { Node } from '../src/types';

describe('Parser - Block Parsing', () => {
  describe('Basic Blocks', () => {
    it('parses empty block', () => {
      const input = '{}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('block');
      expect(ir.nodes[0].content).toBe('');
      expect(ir.nodes[0].ext?.children || []).toHaveLength(0);
    });

    it('parses block with single statement', () => {
      const input = '{ simple thought }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should have: 1 statement node + 1 block node
      expect(ir.nodes).toHaveLength(2);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();
      expect(blockNode.ext?.children).toHaveLength(1);
      expect(blockNode.ext?.children[0].type).toBe('statement');
      expect(blockNode.ext?.children[0].content).toBe('simple thought');
    });

    it('parses block with multiple statements', () => {
      const input = `{
  first thought
  second thought
  third thought
}`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();
      expect(blockNode.ext?.children).toHaveLength(3);
      expect(blockNode.ext?.children[0].content).toBe('first thought');
      expect(blockNode.ext?.children[1].content).toBe('second thought');
      expect(blockNode.ext?.children[2].content).toBe('third thought');
    });

    it('parses block with question', () => {
      const input = '{ ? What is this }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();
      expect(blockNode.ext?.children).toHaveLength(1);
      expect(blockNode.ext?.children[0].type).toBe('question');
      expect(blockNode.ext?.children[0].content).toBe('What is this');
    });

    it('parses block with thought marker', () => {
      const input = '{ thought: interesting observation }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();
      expect(blockNode.ext?.children).toHaveLength(1);
      expect(blockNode.ext?.children[0].type).toBe('thought');
      expect(blockNode.ext?.children[0].content).toBe('interesting observation');
    });

    it('parses block with action marker', () => {
      const input = '{ action: do something }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();
      expect(blockNode.ext?.children).toHaveLength(1);
      expect(blockNode.ext?.children[0].type).toBe('action');
      expect(blockNode.ext?.children[0].content).toBe('do something');
    });

    it('parses block with completion', () => {
      const input = '{ ✓ task done }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();
      expect(blockNode.ext?.children).toHaveLength(1);
      expect(blockNode.ext?.children[0].type).toBe('completion');
      expect(blockNode.ext?.children[0].content).toBe('task done');
    });
  });

  describe('Nested Blocks', () => {
    it('parses nested block (2 levels)', () => {
      const input = '{ outer { inner } }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Find outer block (should be last, as it's added after children)
      const outerBlock = ir.nodes[ir.nodes.length - 1];
      expect(outerBlock.type).toBe('block');

      // Outer block should have 2 children: "outer" statement + inner block
      expect(outerBlock.ext?.children).toHaveLength(2);
      expect(outerBlock.ext?.children[0].type).toBe('statement');
      expect(outerBlock.ext?.children[0].content).toBe('outer');
      expect(outerBlock.ext?.children[1].type).toBe('block');

      // Inner block should have 1 child
      const innerBlock = outerBlock.ext?.children[1];
      expect(innerBlock.ext?.children).toHaveLength(1);
      expect(innerBlock.ext?.children[0].content).toBe('inner');
    });

    it('parses deeply nested blocks (3 levels)', () => {
      const input = '{ level1 { level2 { level3 } } }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const level1Block = ir.nodes[ir.nodes.length - 1];
      expect(level1Block.type).toBe('block');

      const level2Block = level1Block.ext?.children[1];
      expect(level2Block.type).toBe('block');

      const level3Block = level2Block.ext?.children[1];
      expect(level3Block.type).toBe('block');
      expect(level3Block.ext?.children[0].content).toBe('level3');
    });

    it('parses blocks nested 5 levels (readable depth)', () => {
      const input = '{ { { { { deepest } } } } }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Walk down the nesting
      let currentBlock = ir.nodes[ir.nodes.length - 1];
      let depth = 1;

      while (currentBlock.ext?.children?.[0]?.type === 'block') {
        currentBlock = currentBlock.ext.children[0];
        depth++;
      }

      expect(depth).toBe(5);
      expect(currentBlock.ext?.children[0].content).toBe('deepest');
    });

    it('parses blocks nested 6 levels (too deep - W002 should warn)', () => {
      const input = '{ { { { { { too deep } } } } } }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Walk down the nesting
      let currentBlock = ir.nodes[ir.nodes.length - 1];
      let depth = 1;

      while (currentBlock.ext?.children?.[0]?.type === 'block') {
        currentBlock = currentBlock.ext.children[0];
        depth++;
      }

      expect(depth).toBe(6);
      expect(currentBlock.ext?.children[0].content).toBe('too deep');
      // Note: W002 linter rule will warn about this depth
    });
  });

  describe('Blocks with Relationships', () => {
    it('parses block with causal relationship inside', () => {
      const input = '{ A -> B }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();

      // Block should contain 2 nodes: A and B
      expect(blockNode.ext?.children).toHaveLength(2);

      // Should have 1 relationship: A -> B
      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('causes');
    });

    it('parses block with multiple relationships', () => {
      const input = `{
  A -> B
  B -> C
  C -> D
}`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();

      // Block should contain all relationship nodes
      expect(blockNode.ext?.children.length).toBeGreaterThan(0);

      // Should have 3 relationships
      expect(ir.relationships).toHaveLength(3);
    });

    it('parses nested block as relationship target', () => {
      const input = 'main -> { detail }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should have: main node, detail node, block node
      expect(ir.nodes.length).toBeGreaterThan(2);

      // Should have 1 relationship
      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('causes');
    });

    it('parses block with tension operator', () => {
      const input = '{ option A } ><[speed vs reliability] { option B }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should have 2 blocks plus their content nodes
      const blocks = ir.nodes.filter(n => n.type === 'block');
      expect(blocks).toHaveLength(2);

      // Should have 1 tension relationship
      const tensions = ir.relationships.filter(r => r.type === 'tension');
      expect(tensions).toHaveLength(1);
      expect(tensions[0].ext?.axis_label).toBe('speed vs reliability');
    });
  });

  describe('Real Patterns from ADVANCED_PATTERNS.md', () => {
    it('parses inline commentary with sidebar', () => {
      const input = `thought: {
  observation
  <- { context <- trigger }
  -> implication
}`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should successfully parse nested structure
      const thoughtNode = ir.nodes.find(n => n.type === 'thought');
      expect(thoughtNode).toBeDefined();

      // Block should be attached to thought
      const blockNodes = ir.nodes.filter(n => n.type === 'block');
      expect(blockNodes.length).toBeGreaterThan(0);
    });

    it('parses hierarchical structure', () => {
      const input = `{
  main idea
  -> { supporting detail 1 }
  -> { supporting detail 2 }
  -> conclusion
}`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();

      // Should have causal relationships
      expect(ir.relationships.filter(r => r.type === 'causes').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('parses block with modifiers', () => {
      const input = '! { urgent thought }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();

      // The block itself should have the modifier
      // (handled by Element = Modifier* Content grammar rule)
      expect(blockNode.ext?.modifiers || []).toContain('urgent');
    });

    it('parses block with state marker', () => {
      const input = '[decided] { chosen option }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();

      // State should be linked to block
      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('decided');
    });

    it('parses multiline block with whitespace', () => {
      const input = `{

  line 1

  line 2

  line 3

}`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block')!;
      expect(blockNode).toBeDefined();
      expect(blockNode.ext?.children).toHaveLength(3);
    });

    it('parses blocks on same line', () => {
      const input = '{ first } -> { second }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blocks = ir.nodes.filter(n => n.type === 'block');
      expect(blocks).toHaveLength(2);

      // Should have relationship between blocks
      expect(ir.relationships).toHaveLength(1);
    });
  });
});
