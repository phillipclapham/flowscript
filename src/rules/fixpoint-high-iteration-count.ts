/**
 * W004: Fixpoint High Iteration Count
 *
 * An @fix computation with max_iterations exceeding 100 SHOULD be reviewed.
 * Not an error — some computations legitimately require many iterations.
 * But high counts may indicate incorrect match/yield patterns.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

const HIGH_ITERATION_THRESHOLD = 100;

function getMaxIterations(until: any): number | null {
  if (!until) return null;
  if (until.type === 'max_iterations') return until.value;
  if (until.type === 'compound' && until.conditions) {
    for (const c of until.conditions) {
      const val = getMaxIterations(c);
      if (val !== null) return val;
    }
  }
  return null;
}

export class FixpointHighIterationCountRule extends BaseLintRule {
  name = 'fixpoint-high-iteration-count';
  code = 'W004';
  severity = 'WARNING' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const node of ir.nodes) {
      if (node.type !== 'fixpoint') continue;

      const fix = (node.ext as any)?.fix;
      if (!fix) continue;

      const maxIter = getMaxIterations(fix.until);
      if (maxIter !== null && maxIter > HIGH_ITERATION_THRESHOLD) {
        results.push(this.createResult(
          `@fix "${fix.name || 'anonymous'}" has max_iterations: ${maxIter} (exceeds ${HIGH_ITERATION_THRESHOLD})`,
          {
            file: node.provenance.source_file,
            line: node.provenance.line_number
          },
          'High iteration counts may indicate incorrect match/yield patterns. Review if intentional.'
        ));
      }
    }

    return results;
  }
}
