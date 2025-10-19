/**
 * W002: Deep Nesting Rule
 *
 * Specification: spec/linter-rules.md lines 806-895
 *
 * Thought blocks { } nested deeper than 5 levels may indicate over-complexity.
 *
 * Deep nesting becomes hard to read and understand.
 * Often indicates need to refactor into multiple separate structures.
 *
 * Readable:  {{{{{ }}}}}      # 5 levels - OK
 * Too deep:  {{{{{{ }}}}}}    # 6 levels - WARNING
 */

import { IR, Node } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class DeepNestingRule extends BaseLintRule {
  name = 'deep-nesting';
  code = 'W002';
  severity = 'WARNING' as const;

  private maxDepth = 5;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    const checkDepth = (node: Node, depth: number): void => {
      if (depth > this.maxDepth) {
        results.push(this.createResult(
          `Thought block nested ${depth} levels deep (max recommended: ${this.maxDepth})`,
          {
            file: node.provenance.source_file,
            line: node.provenance.line_number
          },
          `Consider: (1) Breaking into multiple blocks OR (2) Using flat relationships instead of nesting`
        ));
      }

      // Recursively check children
      const children = node.ext?.children;
      if (Array.isArray(children)) {
        for (const child of children) {
          if (child.type === 'block') {
            checkDepth(child, depth + 1);
          }
        }
      }
    };

    // Check all block nodes
    for (const node of ir.nodes) {
      if (node.type === 'block') {
        checkDepth(node, 1);
      }
    }

    return results;
  }
}
