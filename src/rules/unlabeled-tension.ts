/**
 * E001: Unlabeled Tension Rule
 *
 * Specification: spec/linter-rules.md lines 69-146
 *
 * Tension marker ><` MUST include axis label in brackets.
 * This forcing function ensures explicit articulation of tradeoff dimension.
 *
 * INVALID: A >< B
 * VALID:   A ><[axis label] B
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class UnlabeledTensionRule extends BaseLintRule {
  name = 'unlabeled-tension';
  code = 'E001';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const rel of ir.relationships) {
      if (rel.type === 'tension' && !rel.axis_label) {
        results.push(this.createResult(
          'Tension marker >< missing required axis label',
          {
            file: rel.provenance.source_file,
            line: rel.provenance.line_number
          },
          'Add axis label: ><[dimension of tradeoff]'
        ));
      }
    }

    return results;
  }
}
