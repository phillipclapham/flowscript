/**
 * E003: Invalid Marker Syntax Rule
 *
 * Specification: spec/linter-rules.md lines 246-344
 *
 * Markers must follow valid composition rules:
 * - One state at a time: [decided blocked] invalid
 * - One insight/command marker: thought: action: invalid
 * - State before content: Deploy [blocked] invalid
 *
 * Most syntax validation is handled by parser.
 * This rule catches semantic composition issues.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class InvalidSyntaxRule extends BaseLintRule {
  name = 'invalid-syntax';
  code = 'E003';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    // Check for multiple states on same node
    const nodeStates = new Map<string, string[]>();

    for (const state of ir.states) {
      if (!state.node_id) continue;

      if (!nodeStates.has(state.node_id)) {
        nodeStates.set(state.node_id, []);
      }
      nodeStates.get(state.node_id)!.push(state.type);
    }

    for (const [nodeId, states] of nodeStates.entries()) {
      if (states.length > 1) {
        const node = ir.nodes.find(n => n.id === nodeId);
        if (node) {
          results.push(this.createResult(
            `Node has multiple states: ${states.join(', ')} - only one state allowed per node`,
            {
              file: node.provenance.source_file,
              line: node.provenance.line_number
            },
            `Choose one state marker`
          ));
        }
      }
    }

    return results;
  }
}
