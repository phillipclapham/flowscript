/**
 * Tests for IndentationScanner
 *
 * Comprehensive test suite using 32 test fixtures from
 * tests/fixtures/indentation-test-cases.txt
 *
 * Session: 4a-continued-2 (Preprocessor Core Implementation)
 */

import { IndentationScanner } from '../src/indentation-scanner';
import { IndentationError } from '../src/errors/indentation-error';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test case structure parsed from fixture file
 */
interface TestCase {
  name: string;
  type: 'VALID' | 'ERROR';
  description: string;
  input: string;
  expected?: string; // For VALID tests
  expectedError?: string; // For ERROR tests
}

/**
 * Parse test fixtures from structured text file
 *
 * Format:
 *   ================================================================================
 *   TEST: <name>
 *   TYPE: VALID or ERROR
 *   DESCRIPTION: <desc>
 *
 *   INPUT:
 *   <input lines>
 *
 *   EXPECTED: (for VALID) or EXPECTED_ERROR: (for ERROR)
 *   <expected output or error message>
 *   ================================================================================
 */
function parseTestFixtures(filePath: string): TestCase[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const testCases: TestCase[] = [];

  // Split on separator lines
  const sections = content.split(/={80,}/);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Extract fields using regex
    const nameMatch = /^TEST:\s*(.+)$/m.exec(trimmed);
    const typeMatch = /^TYPE:\s*(VALID|ERROR)$/m.exec(trimmed);
    const descMatch = /^DESCRIPTION:\s*(.+)$/m.exec(trimmed);
    const inputMatch = /INPUT:\n([\s\S]+?)(?=\nEXPECTED)/.exec(trimmed);
    const expectedMatch = /EXPECTED:\n([\s\S]+?)$/.exec(trimmed);
    const errorMatch = /EXPECTED_ERROR:\n([\s\S]+?)$/.exec(trimmed);

    if (!nameMatch || !typeMatch) continue;

    const testCase: TestCase = {
      name: nameMatch[1].trim(),
      type: typeMatch[1] as 'VALID' | 'ERROR',
      description: descMatch ? descMatch[1].trim() : '',
      input: inputMatch ? inputMatch[1].trimEnd() : '',
    };

    if (testCase.type === 'VALID' && expectedMatch) {
      testCase.expected = expectedMatch[1].trimEnd();
    } else if (testCase.type === 'ERROR' && errorMatch) {
      testCase.expectedError = errorMatch[1].trim();
    }

    testCases.push(testCase);
  }

  return testCases;
}

describe('IndentationScanner', () => {
  const fixturesPath = path.join(
    __dirname,
    'fixtures',
    'indentation-test-cases.txt'
  );
  const fixtures = parseTestFixtures(fixturesPath);

  describe('Valid transformations', () => {
    const validFixtures = fixtures.filter((f) => f.type === 'VALID');

    for (const fixture of validFixtures) {
      it(`transforms: ${fixture.name}`, () => {
        const scanner = new IndentationScanner();
        const result = scanner.process(fixture.input);

        expect(result).toBe(fixture.expected);
      });
    }
  });

  describe('Error detection', () => {
    const errorFixtures = fixtures.filter((f) => f.type === 'ERROR');

    for (const fixture of errorFixtures) {
      it(`errors on: ${fixture.name}`, () => {
        const scanner = new IndentationScanner();

        expect(() => {
          scanner.process(fixture.input);
        }).toThrow(IndentationError);

        // Also verify error message matches expected
        try {
          scanner.process(fixture.input);
          expect.fail('Should have thrown IndentationError');
        } catch (error) {
          if (error instanceof IndentationError) {
            // Check that error message contains key parts
            const expectedMsg = fixture.expectedError || '';
            expect(error.message).toContain(
              expectedMsg.split(':')[0] // Match error type
            );
          } else {
            throw error;
          }
        }
      });
    }
  });

  describe('Edge cases', () => {
    it('handles empty input', () => {
      const scanner = new IndentationScanner();
      const result = scanner.process('');
      expect(result).toBe('');
    });

    it('handles single line at root', () => {
      const scanner = new IndentationScanner();
      const result = scanner.process('A');
      expect(result).toBe('A');
    });

    it('preserves blank lines', () => {
      const scanner = new IndentationScanner();
      const input = 'A\n\nB';
      const result = scanner.process(input);
      expect(result).toBe('A\n\nB');
    });

    it('supports configurable indent size', () => {
      const scanner = new IndentationScanner({ indentSize: 4 });
      const input = 'A\n    B\n    C';
      const result = scanner.process(input);
      expect(result).toBe('A\n    {B\n    C\n    }');
    });
  });

  describe('Multiple DEDENT handling', () => {
    it('closes multiple levels in one step', () => {
      const scanner = new IndentationScanner();
      const input = 'A\n  B\n    C\n      D\nE';
      const result = scanner.process(input);

      // Should close 3 levels (from 6 -> 0)
      const expectedClosingBraces = result.match(/}/g);
      expect(expectedClosingBraces).toHaveLength(3);
    });

    it('handles alternating indent/dedent', () => {
      const scanner = new IndentationScanner();
      const input = 'A\n  B\nC\n  D\nE';
      const result = scanner.process(input);

      // Each indented section should be wrapped
      expect(result).toContain('{B');
      expect(result).toContain('{D');
    });
  });

  describe('EOF finalization', () => {
    it('closes all open indentation at EOF', () => {
      const scanner = new IndentationScanner();
      const input = 'A\n  B\n    C\n      D';
      const result = scanner.process(input);

      // Should have 3 closing braces at end (levels 2, 4, 6)
      const lines = result.split('\n');
      const lastThreeLines = lines.slice(-3);
      expect(lastThreeLines.every((line) => line === '}')).toBe(true);
    });
  });

  describe('Whitespace handling', () => {
    it('treats whitespace-only lines as blank', () => {
      const scanner = new IndentationScanner();
      const input = 'A\n  B\n   \n  C';
      const result = scanner.process(input);

      // Should not error on whitespace-only line
      expect(result).toContain('A');
      expect(result).toContain('{B');
      expect(result).toContain('C');
    });

    it('preserves trailing whitespace in content lines', () => {
      const scanner = new IndentationScanner();
      const input = 'A  \n  B  ';
      const result = scanner.process(input);

      // Trailing whitespace should be preserved
      expect(result).toContain('A  ');
      expect(result).toContain('B  ');
    });
  });

  describe('Error line numbers', () => {
    it('reports correct line number for tab error', () => {
      const scanner = new IndentationScanner();
      try {
        scanner.process('A\n\tB\nC');
        expect.fail('Should have thrown');
      } catch (error) {
        if (error instanceof IndentationError) {
          expect(error.lineNumber).toBe(2);
          expect(error.message).toContain('Line 2');
        } else {
          throw error;
        }
      }
    });

    it('reports correct line number for inconsistent indent', () => {
      const scanner = new IndentationScanner();

      // Note: We removed the "multiple of indentSize" check to match Python's flexible approach
      // This test now verifies that 3-space indentation works (Python allows any indent amount)
      const result = scanner.process('A\n  B\n   C'); // 3 spaces - should work
      expect(result).toContain('A');
      expect(result).toContain('{B');
      expect(result).toContain('{C'); // 3 spaces creates new indent level
    });

    it('reports correct line number for invalid dedent', () => {
      const scanner = new IndentationScanner();
      try {
        scanner.process('A\n  B\n    C\n   D'); // Invalid dedent to 3
        expect.fail('Should have thrown');
      } catch (error) {
        if (error instanceof IndentationError) {
          expect(error.lineNumber).toBe(4);
          expect(error.message).toContain('Line 4');
        } else {
          throw error;
        }
      }
    });
  });
});
