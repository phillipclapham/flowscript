/**
 * E007: Fixpoint Constraint Violation
 *
 * An @fix computation at constraint L1 MUST NOT produce new node IDs.
 * L1's termination guarantee depends on a finite, closed domain.
 *
 * Detection: Check if yield contains node productions (type: 'node' or
 * 'node_relationship') while constraint is L1.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class FixpointConstraintViolationRule extends BaseLintRule {
  name = 'fixpoint-constraint-violation';
  code = 'E007';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const node of ir.nodes) {
      if (node.type !== 'fixpoint') continue;

      const fix = (node.ext as any)?.fix;
      if (!fix || fix.constraint !== 'L1') continue;

      // Check yield for node productions (creating new nodes)
      const yieldElements = fix.yield || [];
      for (const elem of yieldElements) {
        if (elem.type === 'node' || elem.type === 'node_relationship') {
          results.push(this.createResult(
            `@fix "${fix.name || 'anonymous'}" at constraint L1 contains node creation in yield`,
            {
              file: node.provenance.source_file,
              line: node.provenance.line_number
            },
            'L1 computations must operate on existing nodes only. To create new nodes, use constraint: L2 with explicit bounds.'
          ));
          break; // One error per fixpoint is sufficient
        }
      }
    }

    return results;
  }
}
