/**
 * Horizontal Syntax Tests
 *
 * Tests for horizontal/inline FlowScript syntax with semicolons and braces.
 * Verifies that horizontal syntax (braces + semicolons) produces identical IR
 * to vertical syntax (indentation + newlines).
 *
 * Implementation: Session 7b.2.5.2b (commit 9624b94)
 * Spec: Grammar supports `;` and `\n` as separators, text+block patterns
 */

import { Parser } from '../src/parser';
import { FlowScriptIR } from '../src/types';

describe('Parser - Horizontal Syntax', () => {
  // =========================================================================
  // Basic Semicolon Separators
  // =========================================================================

  describe('Basic Semicolon Separators', () => {
    it('parses single semicolon separator', () => {
      const input = '{-> a; -> b}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should have block with 2 children (a, b) and 1 relationship
      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode).toBeDefined();
      expect(blockNode?.ext?.children).toHaveLength(2);
      expect(ir.relationships).toHaveLength(1);
      expect(ir.relationships[0].type).toBe('causes');
    });

    it('parses multiple semicolons in sequence', () => {
      const input = '{-> a; -> b; -> c}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode?.ext?.children).toHaveLength(3);
      expect(ir.relationships).toHaveLength(2);
    });

    it('parses semicolons with whitespace variations', () => {
      const input = '{->a;->b}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode?.ext?.children).toHaveLength(2);
      expect(ir.relationships).toHaveLength(1);
    });

    it('parses semicolons with extra spaces', () => {
      const input = '{ -> a  ;  -> b }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode?.ext?.children).toHaveLength(2);
      expect(ir.relationships).toHaveLength(1);
    });

    it('handles trailing semicolon gracefully', () => {
      const input = '{-> a; -> b;}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Trailing semicolon should be consumed as separator, not create extra node
      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode?.ext?.children).toHaveLength(2);
    });

    it('handles multiple trailing semicolons', () => {
      const input = '{-> a; -> b;;}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Multiple trailing semicolons should not create extra nodes
      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode?.ext?.children).toHaveLength(2);
    });
  });

  // =========================================================================
  // Text + Block Patterns
  // =========================================================================

  describe('Text + Block Patterns', () => {
    it('parses thought with text + block', () => {
      const input = 'thought: main insight {-> impl one; -> impl two}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should have thought node with content "main insight"
      const thoughtNode = ir.nodes.find(n => n.type === 'thought');
      expect(thoughtNode).toBeDefined();
      expect(thoughtNode?.content).toBe('main insight');

      // Thought reuses the block (no separate block node)
      expect(thoughtNode?.ext?.children).toHaveLength(2);

      // Should have 1 causal relationship inside block
      expect(ir.relationships).toHaveLength(1);
    });

    it('parses action with text + block', () => {
      const input = 'action: refactor code {-> extract function; -> add tests}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const actionNode = ir.nodes.find(n => n.type === 'action');
      expect(actionNode).toBeDefined();
      expect(actionNode?.content).toBe('refactor code');

      // Action reuses the block (no separate block node)
      expect(actionNode?.ext?.children).toHaveLength(2);
    });

    it('parses question with text + block', () => {
      const input = '? authentication strategy {|| JWT; || session tokens}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const questionNode = ir.nodes.find(n => n.type === 'question');
      expect(questionNode).toBeDefined();
      expect(questionNode?.content).toBe('authentication strategy');

      // Should have 2 alternatives
      const alternatives = ir.nodes.filter(n => n.type === 'alternative');
      expect(alternatives).toHaveLength(2);
    });

    it('parses completion with text + block', () => {
      const input = '✓ task completed {-> verified; -> deployed}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const completionNode = ir.nodes.find(n => n.type === 'completion');
      expect(completionNode).toBeDefined();
      expect(completionNode?.content).toBe('task completed');

      // Completion reuses the block (no separate block node)
      expect(completionNode?.ext?.children).toHaveLength(2);
    });

    it('parses alternative with text + block', () => {
      const input = '|| option A {-> pro one; -> pro two}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const altNode = ir.nodes.find(n => n.type === 'alternative');
      expect(altNode).toBeDefined();
      expect(altNode?.content).toBe('option A');

      // Alternative reuses the block (no separate block node)
      expect(altNode?.ext?.children).toHaveLength(2);
    });

    it('parses marker with block only (no text)', () => {
      const input = 'thought: {-> impl one; -> impl two}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const thoughtNode = ir.nodes.find(n => n.type === 'thought');
      expect(thoughtNode).toBeDefined();
      expect(thoughtNode?.content).toBe(''); // No text, just block

      // Thought reuses the block (no separate block node)
      expect(thoughtNode?.ext?.children).toHaveLength(2);
    });
  });

  // =========================================================================
  // Horizontal Nesting
  // =========================================================================

  describe('Horizontal Nesting', () => {
    it('parses adjacent nested blocks without separators', () => {
      const input = '{outer {inner}}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Outer block should contain statement "outer" + inner block
      const outerBlock = ir.nodes[ir.nodes.length - 1];
      expect(outerBlock.type).toBe('block');
      expect(outerBlock.ext?.children).toHaveLength(2);
      expect(outerBlock.ext?.children[0].content).toBe('outer');
      expect(outerBlock.ext?.children[1].type).toBe('block');
    });

    it('parses deeply nested horizontal blocks', () => {
      const input = '{level1 {level2 {level3}}}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const level1 = ir.nodes[ir.nodes.length - 1];
      const level2 = level1.ext?.children[1];
      const level3 = level2.ext?.children[1];

      expect(level1.type).toBe('block');
      expect(level2.type).toBe('block');
      expect(level3.type).toBe('block');
      expect(level3.ext?.children[0].content).toBe('level3');
    });

    it('parses horizontal blocks with relationships', () => {
      const input = '{A -> B -> C}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should have 3 nodes (A, B, C) and 2 relationships
      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode?.ext?.children).toHaveLength(3);
      expect(ir.relationships).toHaveLength(2);
      expect(ir.relationships[0].type).toBe('causes');
      expect(ir.relationships[1].type).toBe('causes');
    });

    it('parses nested horizontal in relationship chains', () => {
      const input = 'main -> {detail one; detail two}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should have main node + block with 2 children + 1 relationship
      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode?.ext?.children).toHaveLength(2);
      expect(ir.relationships).toHaveLength(1);
    });
  });

  // =========================================================================
  // Mixed Horizontal + Vertical
  // =========================================================================

  describe('Mixed Horizontal + Vertical', () => {
    it('parses document with both horizontal and vertical syntax', () => {
      const input = `thought: top level
  -> vertical child one
  -> vertical child two {-> horizontal nested}`;

      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Should successfully parse mixed syntax
      expect(ir.nodes.length).toBeGreaterThan(0);
      expect(ir.relationships.length).toBeGreaterThan(0);
    });

    it('parses vertical blocks containing horizontal syntax', () => {
      const input = `{
  first line
  {-> a; -> b}
  last line
}`;

      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const outerBlock = ir.nodes[ir.nodes.length - 1];
      expect(outerBlock.type).toBe('block');
      expect(outerBlock.ext?.children.length).toBeGreaterThan(2);
    });

    it('parses horizontal blocks containing vertical syntax', () => {
      const input = `{outer {
  inner line one
  inner line two
}}`;

      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const outerBlock = ir.nodes[ir.nodes.length - 1];
      const innerBlock = outerBlock.ext?.children.find((c: any) => c.type === 'block');
      expect(innerBlock).toBeDefined();
      expect(innerBlock.ext?.children).toHaveLength(2);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('rejects empty block with lone semicolon', () => {
      const input = '{;}';
      const parser = new Parser('test.fs');

      // Empty block with lone semicolon should fail parsing
      // Semicolons are separators - they separate content
      // No content = no valid use of separator
      expect(() => parser.parse(input)).toThrow(/Parse error/);
    });

    it('handles whitespace-only block', () => {
      const input = '{   }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const blockNode = ir.nodes.find(n => n.type === 'block');
      expect(blockNode).toBeDefined();
      expect(blockNode?.ext?.children || []).toHaveLength(0);
    });

    it('handles modifiers with horizontal syntax', () => {
      const input = '! thought: urgent {-> act quickly}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const thoughtNode = ir.nodes.find(n => n.type === 'thought');
      expect(thoughtNode).toBeDefined();
      expect(thoughtNode?.modifiers).toContain('urgent');
    });

    it('handles state markers with horizontal syntax', () => {
      const input = '[decided] thought: chosen {-> impl one; -> impl two}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const thoughtNode = ir.nodes.find(n => n.type === 'thought');
      expect(thoughtNode).toBeDefined();

      expect(ir.states).toHaveLength(1);
      expect(ir.states[0].type).toBe('decided');
    });

    it('handles tension operators in horizontal syntax', () => {
      const input = '{option A} ><[speed vs quality] {option B}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const tensions = ir.relationships.filter(r => r.type === 'tension');
      expect(tensions).toHaveLength(1);
      expect(tensions[0].axis_label).toBe('speed vs quality');
    });

    it('handles all relationship types in horizontal syntax', () => {
      const input = '{A -> B; C => D; E <-> F}';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      expect(ir.relationships.length).toBe(3);
      expect(ir.relationships.find(r => r.type === 'causes')).toBeDefined();
      expect(ir.relationships.find(r => r.type === 'temporal')).toBeDefined();
      expect(ir.relationships.find(r => r.type === 'bidirectional')).toBeDefined();
    });
  });

  // =========================================================================
  // IR Equivalence (Vertical vs Horizontal)
  // =========================================================================

  describe('IR Equivalence', () => {
    it('produces identical node count for vertical vs horizontal', () => {
      const vertical = `{
  -> a
  -> b
}`;
      const horizontal = '{-> a; -> b}';

      const parser1 = new Parser('test.fs');
      const parser2 = new Parser('test.fs');

      const ir1 = parser1.parse(vertical);
      const ir2 = parser2.parse(horizontal);

      // Same number of nodes
      expect(ir1.nodes.length).toBe(ir2.nodes.length);

      // Same number of relationships
      expect(ir1.relationships.length).toBe(ir2.relationships.length);
    });

    it('produces identical relationship structures', () => {
      const vertical = `{
  A -> B
  B -> C
}`;
      const horizontal = '{A -> B; B -> C}';

      const parser1 = new Parser('test.fs');
      const parser2 = new Parser('test.fs');

      const ir1 = parser1.parse(vertical);
      const ir2 = parser2.parse(horizontal);

      // Same relationship types
      expect(ir1.relationships.length).toBe(ir2.relationships.length);
      expect(ir1.relationships.every(r => r.type === 'causes')).toBe(true);
      expect(ir2.relationships.every(r => r.type === 'causes')).toBe(true);
    });

    it('produces identical content hashes for equivalent nodes', () => {
      const vertical = `{
  test node
}`;
      const horizontal = '{test node}';

      const parser1 = new Parser('test.fs');
      const parser2 = new Parser('test.fs');

      const ir1 = parser1.parse(vertical);
      const ir2 = parser2.parse(horizontal);

      // Find statement nodes in both
      const stmt1 = ir1.nodes.find(n => n.type === 'statement' && n.content === 'test node');
      const stmt2 = ir2.nodes.find(n => n.type === 'statement' && n.content === 'test node');

      expect(stmt1).toBeDefined();
      expect(stmt2).toBeDefined();

      // Content hashes should match (proving semantic equivalence)
      expect(stmt1?.id).toBe(stmt2?.id);
    });

    it('produces identical IR for complex nested structures', () => {
      const vertical = `thought: main idea
  -> {
    detail one
    detail two
  }`;

      const horizontal = `thought: main idea
  -> {detail one; detail two}`;

      const parser1 = new Parser('test.fs');
      const parser2 = new Parser('test.fs');

      const ir1 = parser1.parse(vertical);
      const ir2 = parser2.parse(horizontal);

      // Same number of nodes
      expect(ir1.nodes.length).toBe(ir2.nodes.length);

      // Same thought node
      const thought1 = ir1.nodes.find(n => n.type === 'thought');
      const thought2 = ir2.nodes.find(n => n.type === 'thought');
      expect(thought1?.content).toBe(thought2?.content);

      // Same block structure
      const block1 = ir1.nodes.find(n => n.type === 'block');
      const block2 = ir2.nodes.find(n => n.type === 'block');
      expect(block1?.ext?.children.length).toBe(block2?.ext?.children.length);
    });
  });

  // =========================================================================
  // Real-World Patterns
  // =========================================================================

  describe('Real-World Patterns', () => {
    it('parses decision with horizontal alternatives', () => {
      const input = `? authentication
{|| JWT {-> stateless; -> revocation hard}; || sessions {-> Redis needed; -> instant revoke}}`;

      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const questionNode = ir.nodes.find(n => n.type === 'question');
      expect(questionNode).toBeDefined();

      const alternatives = ir.nodes.filter(n => n.type === 'alternative');
      expect(alternatives).toHaveLength(2);

      // Each alternative should have a block with children
      const blocks = ir.nodes.filter(n => n.type === 'block');
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('parses thought with inline causal chain', () => {
      const input = 'thought: performance issue {slow queries -> missing indexes -> need migration}';

      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const thoughtNode = ir.nodes.find(n => n.type === 'thought');
      expect(thoughtNode).toBeDefined();

      // Should have causal chain in block
      expect(ir.relationships.filter(r => r.type === 'causes').length).toBeGreaterThan(0);
    });

    it('parses action with horizontal subtasks', () => {
      const input = 'action: refactor auth {-> extract JWT logic; -> add tests; -> update docs}';

      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const actionNode = ir.nodes.find(n => n.type === 'action');
      expect(actionNode).toBeDefined();
      expect(actionNode?.content).toBe('refactor auth');

      // Action reuses the block (no separate block node)
      expect(actionNode?.ext?.children).toHaveLength(3);
    });
  });
});
