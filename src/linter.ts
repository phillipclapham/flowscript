/**
 * FlowScript Semantic Linter
 *
 * Enforces semantic correctness beyond syntax validation.
 * Implements 6 ERROR + 3 WARNING rules from spec/linter-rules.md
 *
 * Architecture: Two-pass validation
 * - Pass 1: Syntax validation (handled by parser)
 * - Pass 2: Semantic validation (this linter)
 */

import { IR } from './types';

export type Severity = 'ERROR' | 'WARNING';

export interface LintResult {
  severity: Severity;
  rule: string;
  message: string;
  location?: {
    file: string;
    line: number;
  };
  suggestion?: string;
}

export interface LintRule {
  name: string;
  code: string;  // E001, E002, W001, etc.
  severity: Severity;
  check(ir: IR): LintResult[];
}

/**
 * Base class for lint rules - provides helper methods
 */
export abstract class BaseLintRule implements LintRule {
  abstract name: string;
  abstract code: string;
  abstract severity: Severity;

  abstract check(ir: IR): LintResult[];

  protected createResult(
    message: string,
    location?: { file: string; line: number },
    suggestion?: string
  ): LintResult {
    return {
      severity: this.severity,
      rule: this.code,
      message,
      location,
      suggestion
    };
  }
}

/**
 * Main linter class - orchestrates all validation rules
 */
export class Linter {
  private rules: LintRule[] = [];

  constructor() {
    this.registerRules();
  }

  private registerRules(): void {
    // Import all rules
    const {
      UnlabeledTensionRule,
      MissingRequiredFieldsRule,
      InvalidSyntaxRule,
      OrphanedNodesRule,
      CausalCyclesRule,
      AlternativesWithoutDecisionRule,
      MissingRecommendedFieldsRule,
      DeepNestingRule,
      LongCausalChainsRule
    } = require('./rules');

    // ERROR rules (6 total)
    this.rules.push(new UnlabeledTensionRule());
    this.rules.push(new MissingRequiredFieldsRule());
    this.rules.push(new InvalidSyntaxRule());
    this.rules.push(new OrphanedNodesRule());
    this.rules.push(new CausalCyclesRule());
    this.rules.push(new AlternativesWithoutDecisionRule());

    // WARNING rules (3 total)
    this.rules.push(new MissingRecommendedFieldsRule());
    this.rules.push(new DeepNestingRule());
    this.rules.push(new LongCausalChainsRule());
  }

  /**
   * Register a single rule (for testing or custom rules)
   */
  addRule(rule: LintRule): void {
    this.rules.push(rule);
  }

  /**
   * Main linting entry point
   */
  lint(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    for (const rule of this.rules) {
      try {
        const ruleResults = rule.check(ir);
        results.push(...ruleResults);
      } catch (error) {
        // Rule execution failed - log but continue with other rules
        console.error(`Rule ${rule.code} failed:`, error);
      }
    }

    // Sort: ERRORs first, then by line number
    results.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'ERROR' ? -1 : 1;
      }
      const aLine = a.location?.line || 0;
      const bLine = b.location?.line || 0;
      return aLine - bLine;
    });

    return results;
  }

  /**
   * Filter results by severity
   */
  getErrors(results: LintResult[]): LintResult[] {
    return results.filter(r => r.severity === 'ERROR');
  }

  getWarnings(results: LintResult[]): LintResult[] {
    return results.filter(r => r.severity === 'WARNING');
  }

  /**
   * Check if linting passed (no errors)
   */
  hasErrors(results: LintResult[]): boolean {
    return this.getErrors(results).length > 0;
  }

  /**
   * Format results for display
   */
  formatResults(results: LintResult[]): string {
    if (results.length === 0) {
      return 'No issues found ✓';
    }

    const lines: string[] = [];

    for (const result of results) {
      const location = result.location
        ? `${result.location.file}:${result.location.line}`
        : 'unknown';

      lines.push(`${result.severity}: ${result.rule} - ${result.message}`);
      lines.push(`  at ${location}`);

      if (result.suggestion) {
        lines.push(`  Suggestion: ${result.suggestion}`);
      }

      lines.push(''); // blank line between results
    }

    return lines.join('\n');
  }
}
