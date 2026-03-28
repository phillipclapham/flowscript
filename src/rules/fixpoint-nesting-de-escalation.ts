/**
 * E011: Fixpoint Nesting De-escalation
 *
 * A nested @fix MUST have a constraint level >= its enclosing @fix.
 * Nesting can only ESCALATE computational power, never de-escalate.
 *
 * VALID: L1 outer containing bounded L2 inner (the canonical metamaterial
 * pattern — deterministic outer spawns creative bounded inner). L2 inner
 * restricts itself regardless of outer environment.
 *
 * INVALID: L2 outer containing L1 inner. L1's closed-domain guarantee
 * requires that no new nodes can appear in its scope. But the L2 outer
 * can create nodes that the L1 inner's match patterns bind to, violating
 * the closed-domain assumption. The L1 guarantee is about what IT sees,
 * but the L2 environment changes what exists to be seen.
 *
 * In short: escalate or preserve, never de-escalate.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

const CONSTRAINT_ORDER: Record<string, number> = { 'L1': 1, 'L2': 2 };

function checkNestedConstraints(
  yieldElements: any[],
  outerConstraint: string,
  outerName: string,
  results: LintResult[],
  file: string,
  line: number
): void {
  if (!yieldElements) return;

  for (const elem of yieldElements) {
    if (elem.type === 'nested_fix' && elem.nested) {
      const innerConstraint = elem.nested.constraint;
      const innerName = elem.nested.name || 'anonymous';

      if (innerConstraint && outerConstraint &&
          (CONSTRAINT_ORDER[innerConstraint] || 0) < (CONSTRAINT_ORDER[outerConstraint] || 0)) {
        results.push({
          severity: 'ERROR',
          rule: 'E011',
          message: `Nested @fix "${innerName}" at constraint ${innerConstraint} inside @fix "${outerName}" at constraint ${outerConstraint}`,
          location: { file, line },
          suggestion: `Nested constraint must be >= outer constraint. ${innerConstraint} guarantees cannot hold inside a ${outerConstraint} environment.`
        });
      }

      // Recurse into nested yields
      checkNestedConstraints(
        elem.nested.yield || [],
        innerConstraint || outerConstraint,
        innerName,
        results,
        file,
        line
      );
    }
  }
}

export class FixpointNestingDeEscalationRule extends BaseLintRule {
  name = 'fixpoint-nesting-de-escalation';
  code = 'E011';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const node of ir.nodes) {
      if (node.type !== 'fixpoint') continue;

      const fix = (node.ext as any)?.fix;
      if (!fix) continue;

      checkNestedConstraints(
        fix.yield || [],
        fix.constraint,
        fix.name || 'anonymous',
        results,
        node.provenance.source_file,
        node.provenance.line_number
      );
    }

    return results;
  }
}
