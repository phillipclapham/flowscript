/**
 * E005: Causal Cycles Rule
 *
 * Specification: spec/linter-rules.md lines 486-618
 *
 * Causal relationships (->) must form a Directed Acyclic Graph (DAG).
 *
 * Cycles are invalid unless ALL edges in the cycle have feedback: true flag
 * (set automatically by <-> bidirectional marker).
 *
 * INVALID: A -> B -> C -> A (cycle without feedback)
 * VALID:   A <-> B (bidirectional with feedback: true)
 * VALID:   A => B => C => A (temporal sequence, not causal)
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class CausalCyclesRule extends BaseLintRule {
  name = 'causal-cycles';
  code = 'E005';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    // Build adjacency list (causal edges only, exclude feedback)
    const adj = new Map<string, string[]>();

    for (const rel of ir.relationships) {
      if (rel.type === 'causes' && !rel.feedback) {
        if (!adj.has(rel.source)) {
          adj.set(rel.source, []);
        }
        adj.get(rel.source)!.push(rel.target);
      }
    }

    // DFS cycle detection with recursion stack
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const findCycle = (node: string, path: string[]): string[] | null => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = adj.get(node) || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const cycle = findCycle(neighbor, [...path]);
          if (cycle) return cycle;
        } else if (recStack.has(neighbor)) {
          // Cycle found!
          return [...path, neighbor];
        }
      }

      recStack.delete(node);
      return null;
    };

    // Check for cycles from each node
    for (const node of adj.keys()) {
      if (!visited.has(node)) {
        const cycle = findCycle(node, []);

        if (cycle) {
          // Build readable cycle description
          const cycleContent = cycle.map(id => {
            const n = ir.nodes.find(node => node.id === id);
            return n?.content || id.substring(0, 8);
          });

          const cycleStr = cycleContent.join(' -> ');

          results.push(this.createResult(
            `Causal cycle detected: ${cycleStr}`,
            {
              file: ir.nodes[0]?.provenance.source_file || 'unknown',
              line: 0
            },
            `Fix: Use <-> for feedback loops, or use => for temporal sequence, or break the cycle`
          ));

          break;  // Report first cycle found
        }
      }
    }

    return results;
  }
}
