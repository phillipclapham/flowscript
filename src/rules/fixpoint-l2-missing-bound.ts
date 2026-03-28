/**
 * E008: Fixpoint L2 Missing Bound
 *
 * An @fix computation at constraint L2 MUST include an explicit termination
 * bound: max_iterations, timeout, or measure. The "stable" condition alone
 * is insufficient at L2 because convergence is not guaranteed (Turing-complete).
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

function hasExplicitBound(until: any): boolean {
  if (!until) return false;
  if (until.type === 'max_iterations' || until.type === 'timeout' || until.type === 'measure') {
    return true;
  }
  if (until.type === 'compound' && until.conditions) {
    return until.conditions.some((c: any) => hasExplicitBound(c));
  }
  return false;
}

export class FixpointL2MissingBoundRule extends BaseLintRule {
  name = 'fixpoint-l2-missing-bound';
  code = 'E008';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const node of ir.nodes) {
      if (node.type !== 'fixpoint') continue;

      const fix = (node.ext as any)?.fix;
      if (!fix || fix.constraint !== 'L2') continue;

      if (!hasExplicitBound(fix.until)) {
        results.push(this.createResult(
          `@fix "${fix.name || 'anonymous'}" at constraint L2 has no explicit termination bound`,
          {
            file: node.provenance.source_file,
            line: node.provenance.line_number
          },
          'L2 computations MUST include: max_iterations, timeout, or measure. Use: until: stable or max_iterations: N'
        ));
      }
    }

    return results;
  }
}
