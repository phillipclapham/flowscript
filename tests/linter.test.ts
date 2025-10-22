/**
 * FlowScript Linter Tests
 *
 * Comprehensive test suite for all 9 linter rules (6 ERROR + 3 WARNING)
 */

import { Linter } from '../src/linter';
import { Parser } from '../src/parser';

describe('FlowScript Linter', () => {
  // ========================================================================
  // ERROR RULES (6 total)
  // ========================================================================

  describe('E001: Unlabeled Tension', () => {
    it('detects tension without axis label', () => {
      const input = 'speed >< quality';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      expect(errors.length).toBeGreaterThan(0);
      const e001Errors = errors.filter(e => e.rule === 'E001');
      expect(e001Errors.length).toBeGreaterThan(0);
      expect(e001Errors[0].message).toContain('axis label');
    });

    it('passes tension with axis label', () => {
      const input = 'speed ><[velocity vs quality] quality';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e001Errors = errors.filter(e => e.rule === 'E001');
      expect(e001Errors).toHaveLength(0);
    });
  });

  describe('E002: Missing Required Fields', () => {
    it('detects [decided] without rationale', () => {
      const input = '[decided(on: "2025-10-17")] Ship now';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e002Errors = errors.filter(e => e.rule === 'E002');
      expect(e002Errors.length).toBeGreaterThan(0);
      expect(e002Errors[0].message).toContain('rationale');
    });

    it('detects [blocked] without reason', () => {
      const input = '[blocked(since: "2025-10-17")] Deploy';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e002Errors = errors.filter(e => e.rule === 'E002');
      expect(e002Errors.length).toBeGreaterThan(0);
      expect(e002Errors[0].message).toContain('reason');
    });

    it('passes [decided] with all required fields', () => {
      const input = '[decided(rationale: "user feedback", on: "2025-10-17")] Ship now';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e002Errors = errors.filter(e => e.rule === 'E002');
      expect(e002Errors).toHaveLength(0);
    });

    it('passes [blocked] with all required fields', () => {
      const input = '[blocked(reason: "waiting on keys", since: "2025-10-17")] Deploy';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e002Errors = errors.filter(e => e.rule === 'E002');
      expect(e002Errors).toHaveLength(0);
    });
  });

  describe('E003: Invalid Syntax', () => {
    // Note: Most invalid syntax is caught by parser
    // This rule checks for semantic issues like multiple states

    it('passes valid single state', () => {
      const input = '[decided(rationale: "good idea", on: "2025-10-17")] Task';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e003Errors = errors.filter(e => e.rule === 'E003');
      expect(e003Errors).toHaveLength(0);
    });
  });

  describe('E004: Orphaned Nodes', () => {
    it('detects isolated node', () => {
      const input = `A -> B

Orphaned thought

C -> D`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e004Errors = errors.filter(e => e.rule === 'E004');
      expect(e004Errors.length).toBeGreaterThan(0);
      expect(e004Errors[0].message).toContain('Orphaned');
    });

    it('passes connected graph', () => {
      const input = 'A -> B -> C';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e004Errors = errors.filter(e => e.rule === 'E004');
      expect(e004Errors).toHaveLength(0);
    });

    it('allows orphaned action nodes (todo list pattern)', () => {
      const input = `thought: incident analysis
  -> root cause identified

action: fix the bug
action: add tests
action: deploy fix`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e004Errors = errors.filter(e => e.rule === 'E004');
      expect(e004Errors).toHaveLength(0); // No E004 for orphaned actions
    });

    it('allows orphaned completion nodes', () => {
      const input = `A -> B

✓ wrote documentation
✓ reviewed code
✓ deployed to production`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e004Errors = errors.filter(e => e.rule === 'E004');
      expect(e004Errors).toHaveLength(0); // No E004 for orphaned completions
    });

    it('still catches orphaned thought nodes', () => {
      const input = `A -> B

Random orphaned thought here

C -> D`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e004Errors = errors.filter(e => e.rule === 'E004');
      expect(e004Errors.length).toBeGreaterThan(0); // Still catches real orphans
      expect(e004Errors[0].message).toContain('Orphaned');
    });
  });

  describe('E005: Causal Cycles', () => {
    it('detects cycle in causal graph', () => {
      const input = `A -> B
B -> C
C -> A`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e005Errors = errors.filter(e => e.rule === 'E005');
      expect(e005Errors.length).toBeGreaterThan(0);
      expect(e005Errors[0].message).toContain('cycle');
    });

    it('passes with bidirectional (feedback)', () => {
      const input = 'A <-> B';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e005Errors = errors.filter(e => e.rule === 'E005');
      expect(e005Errors).toHaveLength(0);
    });

    it('passes acyclic graph', () => {
      const input = 'A -> B -> C';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e005Errors = errors.filter(e => e.rule === 'E005');
      expect(e005Errors).toHaveLength(0);
    });
  });

  describe('E006: Alternatives Without Decision', () => {
    it('detects alternatives without decision', () => {
      const input = `? Choose option
  || Option A
  || Option B`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Verify alternatives were created
      const alts = ir.nodes.filter(n => n.type === 'alternative');
      expect(alts.length).toBe(2);

      // Verify linter catches missing decision
      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e006Errors = errors.filter(e => e.rule === 'E006');
      expect(e006Errors.length).toBeGreaterThan(0);
    });

    it('passes when alternative has decision', () => {
      const input = `? Choose option
  || Option A
  || Option B

[decided(rationale: "best choice", on: "2025-10-20")] Option A`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e006Errors = errors.filter(e => e.rule === 'E006');
      expect(e006Errors.length).toBe(0);
    });

    it('passes simple statements without alternatives', () => {
      const input = 'A -> B';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e006Errors = errors.filter(e => e.rule === 'E006');
      expect(e006Errors).toHaveLength(0);
    });

    it('passes when decision synthesizes alternatives (hybrid)', () => {
      const input = `? caching strategy
  || client-side caching
  || Redis cache
  || CDN caching

* [decided(rationale: "hybrid approach", on: "2025-10-22")] hybrid CDN + Redis architecture`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Verify alternatives were created
      const alts = ir.nodes.filter(n => n.type === 'alternative');
      expect(alts.length).toBe(3);

      // Verify decision exists but doesn't match any alternative exactly
      const decided = ir.states.filter(s => s.type === 'decided');
      expect(decided.length).toBe(1);

      // Verify linter passes (hybrid decisions are valid per spec Pattern 4)
      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e006Errors = errors.filter(e => e.rule === 'E006');
      expect(e006Errors.length).toBe(0);
    });

    it('passes when question has parking state', () => {
      const input = `[parking(why: "need more data", until: "Q2 2025")]
? authentication strategy
  || JWT tokens
  || session + Redis`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      // Verify alternatives were created
      const alts = ir.nodes.filter(n => n.type === 'alternative');
      expect(alts.length).toBe(2);

      // Verify question has parking state
      const parking = ir.states.filter(s => s.type === 'parking');
      expect(parking.length).toBe(1);

      // Verify linter passes (parking is valid per spec)
      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      const e006Errors = errors.filter(e => e.rule === 'E006');
      expect(e006Errors.length).toBe(0);
    });
  });

  // ========================================================================
  // WARNING RULES (3 total)
  // ========================================================================

  describe('W001: Missing Recommended Fields', () => {
    it('warns on [parking] without why', () => {
      const input = '[parking] Feature idea';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const warnings = linter.getWarnings(results);

      const w001Warnings = warnings.filter(w => w.rule === 'W001');
      expect(w001Warnings.length).toBeGreaterThan(0);
      expect(w001Warnings[0].message).toContain('why');
    });

    it('passes [parking] with recommended fields', () => {
      const input = '[parking(why: "not ready", until: "after v1")] Feature';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const warnings = linter.getWarnings(results);

      const w001Warnings = warnings.filter(w => w.rule === 'W001');
      expect(w001Warnings).toHaveLength(0);
    });
  });

  describe('W002: Deep Nesting', () => {
    it('warns on blocks nested >5 levels', () => {
      const input = '{ { { { { { too deep } } } } } }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const warnings = linter.getWarnings(results);

      const w002 = warnings.filter(w => w.rule === 'W002');
      expect(w002.length).toBeGreaterThan(0);
      expect(w002[0].message).toContain('nested 6 levels');
    });

    it('passes blocks at 5 levels', () => {
      const input = '{ { { { { ok } } } } }';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const warnings = linter.getWarnings(results);

      const w002 = warnings.filter(w => w.rule === 'W002');
      expect(w002).toHaveLength(0);
    });

    it('passes flat structure', () => {
      const input = 'A -> B -> C';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const warnings = linter.getWarnings(results);

      const w002Warnings = warnings.filter(w => w.rule === 'W002');
      expect(w002Warnings).toHaveLength(0);
    });
  });

  describe('W003: Long Causal Chains', () => {
    it('warns on chain longer than 10 steps', () => {
      const input = 'A -> B -> C -> D -> E -> F -> G -> H -> I -> J -> K -> L';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const warnings = linter.getWarnings(results);

      const w003Warnings = warnings.filter(w => w.rule === 'W003');
      expect(w003Warnings.length).toBeGreaterThan(0);
      expect(w003Warnings[0].message).toContain('Long causal chain');
    });

    it('passes short causal chain', () => {
      const input = 'A -> B -> C';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const warnings = linter.getWarnings(results);

      const w003Warnings = warnings.filter(w => w.rule === 'W003');
      expect(w003Warnings).toHaveLength(0);
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Linter Integration', () => {
    it('formats results correctly', () => {
      const input = 'speed >< quality';  // Missing axis label
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const formatted = linter.formatResults(results);

      expect(formatted).toContain('ERROR');
      expect(formatted).toContain('E001');
    });

    it('sorts errors before warnings', () => {
      const input = `speed >< quality
[parking] Feature`;
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);

      expect(results.length).toBeGreaterThan(0);
      const firstError = results.find(r => r.severity === 'ERROR');
      const firstWarning = results.find(r => r.severity === 'WARNING');

      if (firstError && firstWarning) {
        const errorIndex = results.indexOf(firstError);
        const warningIndex = results.indexOf(firstWarning);
        expect(errorIndex).toBeLessThan(warningIndex);
      }
    });

    it('reports no issues for clean FlowScript', () => {
      const input = '[decided(rationale: "best option", on: "2025-10-17")] A -> B';
      const parser = new Parser('test.fs');
      const ir = parser.parse(input);

      const linter = new Linter();
      const results = linter.lint(ir);
      const errors = linter.getErrors(results);

      expect(errors).toHaveLength(0);
    });
  });
});
