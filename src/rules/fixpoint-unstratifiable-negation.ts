/**
 * E010: Fixpoint Unstratifiable Negation
 *
 * If match contains "not" patterns, the negation dependencies must be
 * stratifiable. Cyclic negation dependency makes semantics undefined.
 *
 * Detection at IR level: Heuristic check — flags when match negates a
 * graph-reading query (tensions/blocked/alternatives) while yield modifies
 * the graph. This is a SIMPLIFIED check, not sound stratification analysis.
 *
 * Known false-negative class: Negated NODE PATTERNS (not X: thought) are
 * not checked. If yield creates nodes of the same type as the negated
 * pattern, this creates genuine non-stratifiable semantics that E010
 * won't catch. Full stratification requires runtime graph context.
 *
 * When FixpointEngine is built, runtime stratification analysis should
 * replace this heuristic for L1 computations (where stratification is
 * required for correctness, not just a recommendation).
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

function hasNegation(patterns: any[]): boolean {
  if (!patterns) return false;
  return patterns.some((p: any) => p.type === 'negation');
}

function getYieldEdgeLabels(yieldElements: any[]): Set<string> {
  const labels = new Set<string>();
  if (!yieldElements) return labels;
  for (const elem of yieldElements) {
    if (elem.edge_label) labels.add(elem.edge_label);
  }
  return labels;
}

function getNegatedQueryNames(patterns: any[]): Set<string> {
  const names = new Set<string>();
  if (!patterns) return names;
  for (const p of patterns) {
    if (p.type === 'negation' && p.negated?.type === 'query_ref') {
      names.add(p.negated.query_name);
    }
  }
  return names;
}

export class FixpointUnstratifiableNegationRule extends BaseLintRule {
  name = 'fixpoint-unstratifiable-negation';
  code = 'E010';
  severity = 'WARNING' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const node of ir.nodes) {
      if (node.type !== 'fixpoint') continue;

      const fix = (node.ext as any)?.fix;
      if (!fix) continue;

      const matchPatterns = fix.match || [];
      if (!hasNegation(matchPatterns)) continue;

      // Check for potential cyclic negation:
      // If yield produces relationships of the same type as negated queries
      const yieldLabels = getYieldEdgeLabels(fix.yield || []);
      const negatedQueries = getNegatedQueryNames(matchPatterns);

      // Structural check: if negated queries overlap with the built-in
      // query names that operate on the same graph being modified
      // (tensions, blocked, alternatives all read from the graph that
      // yield writes to), flag potential stratification issues
      for (const qName of negatedQueries) {
        if (['tensions', 'blocked', 'alternatives'].includes(qName)) {
          // These queries read from the graph. If yield modifies the graph
          // (any yield at all), there's a potential stratification concern.
          if ((fix.yield || []).length > 0) {
            results.push(this.createResult(
              `@fix "${fix.name || 'anonymous'}" negates query "${qName}" while yield modifies the graph`,
              {
                file: node.provenance.source_file,
                line: node.provenance.line_number
              },
              'Negation of graph-reading queries in match while yield modifies the graph may create cyclic negation. Ensure rules are stratifiable.'
            ));
            break;
          }
        }
      }
    }

    return results;
  }
}
