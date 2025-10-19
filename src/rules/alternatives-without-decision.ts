/**
 * E006: Alternatives Without Decision Rule
 *
 * Specification: spec/linter-rules.md lines 621-743
 *
 * When alternatives (||) are used under a question (?), at least ONE must
 * eventually be marked with [decided] OR the question must be marked [parking].
 *
 * Alternatives represent decision in progress.
 * The thought must complete:
 * - Either make decision ([decided])
 * - Or explicitly defer ([parking])
 *
 * Leaving alternatives dangling indicates incomplete thinking.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class AlternativesWithoutDecisionRule extends BaseLintRule {
  name = 'alternatives-without-decision';
  code = 'E006';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    // Find questions with alternatives
    const questions = ir.nodes.filter(n => n.type === 'question');

    for (const question of questions) {
      // Find alternatives related to this question
      const alternatives = ir.relationships.filter(
        r => r.type === 'alternative' && r.source === question.id
      );

      if (alternatives.length === 0) continue;  // No alternatives

      // Check if any alternative has [decided] state
      const alternativeNodeIds = alternatives.map(a => a.target);
      const hasDecision = ir.states.some(
        s => s.type === 'decided' &&
             alternativeNodeIds.includes(s.node_id || '')
      );

      // OR check if question itself is [parking]
      const questionParked = ir.states.some(
        s => s.type === 'parking' && s.node_id === question.id
      );

      if (!hasDecision && !questionParked) {
        results.push(this.createResult(
          `Question has alternatives but no decision: "${question.content}"`,
          {
            file: question.provenance.source_file,
            line: question.provenance.line_number
          },
          `Either: (1) Mark chosen alternative with [decided(rationale: "...", on: "...")] OR (2) Park question with [parking(why: "...", until: "...")]`
        ));
      }
    }

    return results;
  }
}
