/**
 * E009: Fixpoint Missing Constraint
 *
 * Every @fix expression MUST declare an explicit constraint level (L1 or L2).
 * The choice between decidable and Turing-complete computation is too
 * consequential to default. Structure forces clarity.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class FixpointMissingConstraintRule extends BaseLintRule {
  name = 'fixpoint-missing-constraint';
  code = 'E009';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const node of ir.nodes) {
      if (node.type !== 'fixpoint') continue;

      const fix = (node.ext as any)?.fix;
      if (!fix) continue;

      if (!fix.constraint || (fix.constraint !== 'L1' && fix.constraint !== 'L2')) {
        results.push(this.createResult(
          `@fix "${fix.name || 'anonymous'}" has no constraint level declared`,
          {
            file: node.provenance.source_file,
            line: node.provenance.line_number
          },
          'Every @fix MUST declare: constraint: L1 | L2. There is no default.'
        ));
      }
    }

    return results;
  }
}
