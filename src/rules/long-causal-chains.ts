/**
 * W003: Long Causal Chains Rule
 *
 * Specification: spec/linter-rules.md lines 898-981
 *
 * Causal chains (->) longer than 10 steps without branching may indicate:
 * - Over-simplification (missing nuance)
 * - OR over-analysis (diminishing returns)
 *
 * Very long causal chains often miss branching factors or intermediate nuance.
 * Encouraging branching improves analysis quality.
 *
 * OK:     A -> B -> C -> D -> E -> F -> G -> H -> I -> J      # 10 steps
 * WARN:   A -> B -> ... -> K                                   # 11 steps
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class LongCausalChainsRule extends BaseLintRule {
  name = 'long-causal-chains';
  code = 'W003';
  severity = 'WARNING' as const;

  private maxChainLength = 10;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    // Build adjacency list for causal relationships
    const adj = new Map<string, string[]>();

    for (const rel of ir.relationships) {
      if (rel.type === 'causes') {
        if (!adj.has(rel.source)) {
          adj.set(rel.source, []);
        }
        adj.get(rel.source)!.push(rel.target);
      }
    }

    // Find longest path from each node (DFS)
    const visited = new Set<string>();

    const findLongestPath = (node: string, path: string[]): number => {
      visited.add(node);
      path.push(node);

      let maxLength = path.length;

      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const length = findLongestPath(neighbor, [...path]);
          maxLength = Math.max(maxLength, length);
        }
      }

      visited.delete(node);
      return maxLength;
    };

    // Check each potential start node
    for (const nodeId of adj.keys()) {
      visited.clear();
      const chainLength = findLongestPath(nodeId, []);

      if (chainLength > this.maxChainLength) {
        const node = ir.nodes.find(n => n.id === nodeId);

        if (node) {
          results.push(this.createResult(
            `Long causal chain detected (${chainLength} steps, max recommended: ${this.maxChainLength})`,
            {
              file: node.provenance.source_file,
              line: node.provenance.line_number
            },
            `Consider: (1) Adding branching to show parallel effects OR (2) Breaking into multiple related chains`
          ));
        }

        break;  // Report first long chain found
      }
    }

    return results;
  }
}
