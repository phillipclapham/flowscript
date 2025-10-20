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

    // Check if any alternative has [decided] state
    // Match by either:
    // 1. Direct node ID match
    // 2. Content match (for when [decided] creates a new node with same content)
    const alternativeNodeIds = alternatives.map(a => a.id);
    const alternativeContents = alternatives.map(a => a.content);

    const hasDecision = ir.states.some(s => {
      if (s.type !== 'decided') return false;

      // Direct ID match
      if (alternativeNodeIds.includes(s.node_id || '')) return true;

      // Content match
      const decidedNode = ir.nodes.find(n => n.id === s.node_id);
      if (decidedNode && alternativeContents.includes(decidedNode.content)) {
        return true;
      }

      return false;
    });

    if (!hasDecision) {
      // Find the question (if any) that these alternatives relate to
      const questions = ir.nodes.filter(n => n.type === 'question');
      const questionContent = questions.length > 0 ? questions[0].content : 'alternatives';

      results.push(this.createResult(
        `Alternatives without decision: "${questionContent}"`,
        {
          file: alternatives[0].provenance.source_file,
          line: alternatives[0].provenance.line_number
        },
        `Mark chosen alternative with [decided(rationale: "...", on: "...")]`
      ));
    }

    return results;
  }
}
