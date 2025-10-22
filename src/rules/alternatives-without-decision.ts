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

    // Find all alternative nodes
    const alternatives = ir.nodes.filter(n => n.type === 'alternative');

    if (alternatives.length === 0) return results;  // No alternatives

    // Check if any [decided] state exists
    // Note: We don't require the decided content to match an alternative exactly,
    // as hybrid decisions that synthesize multiple alternatives are valid (see spec Pattern 4)
    const hasDecision = ir.states.some(s => s.type === 'decided');

    // Also check if question has [parking] state (spec allows this)
    const hasParking = ir.states.some(s => {
      if (s.type !== 'parking') return false;

      // Check if parking is on a question node
      const node = ir.nodes.find(n => n.id === s.node_id);
      return node && node.type === 'question';
    });

    if (!hasDecision && !hasParking) {
      // Find the question (if any) that these alternatives relate to
      const questions = ir.nodes.filter(n => n.type === 'question');
      const questionContent = questions.length > 0 ? questions[0].content : 'alternatives';

      results.push(this.createResult(
        `Alternatives without decision: "${questionContent}"`,
        {
          file: alternatives[0].provenance.source_file,
          line: alternatives[0].provenance.line_number
        },
        `Mark chosen alternative with [decided(rationale: "...", on: "...")] or mark question with [parking(why: "...", until: "...")]`
      ));
    }

    return results;
  }
}
