/**
 * E002: Missing Required State Fields Rule
 *
 * Specification: spec/linter-rules.md lines 150-243
 *
 * State markers with REQUIRED fields must include them:
 * - [decided] → MUST have 'rationale' and 'on'
 * - [blocked] → MUST have 'reason' and 'since'
 *
 * This forcing function prevents "we decided" without explaining why,
 * or "blocked" without tracking when/why.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class MissingRequiredFieldsRule extends BaseLintRule {
  name = 'missing-required-fields';
  code = 'E002';
  severity = 'ERROR' as const;

  private requiredFields: Record<string, string[]> = {
    'decided': ['rationale', 'on'],
    'blocked': ['reason', 'since']
  };

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const state of ir.states) {
      const required = this.requiredFields[state.type];
      if (!required) continue;  // No required fields for this type

      const missing = required.filter(field => !state.fields[field]);

      if (missing.length > 0) {
        results.push(this.createResult(
          `[${state.type}] state missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
          {
            file: state.provenance.source_file,
            line: state.provenance.line_number
          },
          `Add required fields: ${missing.map(f => `${f}: "..."`).join(', ')}`
        ));
      }
    }

    return results;
  }
}
