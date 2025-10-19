/**
 * W001: Missing Recommended State Fields Rule
 *
 * Specification: spec/linter-rules.md lines 747-803
 *
 * State marker [parking] SHOULD include recommended fields:
 * - why - Why is this parked?
 * - until - When to revisit?
 *
 * Missing these fields doesn't break semantics, but reduces clarity.
 * Parking without explanation = easy to forget why.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class MissingRecommendedFieldsRule extends BaseLintRule {
  name = 'missing-recommended-fields';
  code = 'W001';
  severity = 'WARNING' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const state of ir.states) {
      if (state.type === 'parking') {
        const missing: string[] = [];

        if (!state.fields.why) missing.push('why');
        if (!state.fields.until) missing.push('until');

        if (missing.length > 0) {
          results.push(this.createResult(
            `[parking] missing recommended field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
            {
              file: state.provenance.source_file,
              line: state.provenance.line_number
            },
            `Add recommended fields: ${missing.map(f => `${f}: "..."`).join(', ')}`
          ));
        }
      }
    }

    return results;
  }
}
