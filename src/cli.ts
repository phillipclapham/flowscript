#!/usr/bin/env node

/**
 * FlowScript CLI
 *
 * Command-line interface for FlowScript toolchain:
 * - parse: Compile FlowScript text → IR JSON
 * - lint: Validate FlowScript semantics
 * - validate: Verify IR JSON against schema
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from './parser';
import { Linter } from './linter';
import { validateIR } from './validate';
import { IR } from './types';

const program = new Command();

program
  .name('flowscript')
  .description('FlowScript toolchain - parser, linter, and validator for cognitive graphs')
  .version('1.0.0');

/**
 * Parse command: FlowScript text → IR JSON
 */
program
  .command('parse')
  .description('Parse FlowScript text and emit IR JSON')
  .argument('<file>', 'FlowScript file to parse (.fs)')
  .option('-o, --output <file>', 'Output file for IR JSON (default: stdout)')
  .option('-c, --compact', 'Compact JSON output (no formatting)')
  .action((file: string, options: { output?: string; compact?: boolean }) => {
    try {
      // Read input file
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      const input = fs.readFileSync(file, 'utf-8');

      // Parse
      const parser = new Parser(file);
      const ir = parser.parse(input);

      // Format output
      const json = options.compact
        ? JSON.stringify(ir)
        : JSON.stringify(ir, null, 2);

      // Write output
      if (options.output) {
        fs.writeFileSync(options.output, json, 'utf-8');
        console.log(`✓ Parsed ${file} → ${options.output}`);
      } else {
        console.log(json);
      }

      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Parse error: ${error.message}`);
      } else {
        console.error('Parse error:', error);
      }
      process.exit(1);
    }
  });

/**
 * Lint command: Validate FlowScript semantics
 */
program
  .command('lint')
  .description('Lint FlowScript for semantic errors and warnings')
  .argument('<file>', 'FlowScript file to lint (.fs)')
  .option('-j, --json', 'Output results as JSON')
  .action((file: string, options: { json?: boolean }) => {
    try {
      // Read and parse input file
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      const input = fs.readFileSync(file, 'utf-8');
      const parser = new Parser(file);
      const ir = parser.parse(input);

      // Run linter
      const linter = new Linter();
      const results = linter.lint(ir);

      // Get counts
      const errors = linter.getErrors(results);
      const warnings = linter.getWarnings(results);

      // Output results
      if (options.json) {
        console.log(JSON.stringify({
          file,
          errors: errors.length,
          warnings: warnings.length,
          results
        }, null, 2));
      } else {
        // Human-readable output
        if (results.length === 0) {
          console.log(`✓ ${file}: No issues found`);
        } else {
          console.log(`\nLinting ${file}:\n`);

          for (const result of results) {
            const prefix = result.severity === 'ERROR' ? '✗' : '⚠';
            const location = result.location
              ? `${result.location.file}:${result.location.line}`
              : file;

            console.log(`${prefix} ${result.rule}: ${result.message}`);
            console.log(`  at ${location}`);

            if (result.suggestion) {
              console.log(`  Suggestion: ${result.suggestion}`);
            }
            console.log('');
          }

          console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
        }
      }

      // Exit code: 0 if no errors, 1 if errors found (warnings OK)
      process.exit(errors.length > 0 ? 1 : 0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Lint error: ${error.message}`);
      } else {
        console.error('Lint error:', error);
      }
      process.exit(1);
    }
  });

/**
 * Validate command: Verify IR JSON against schema
 */
program
  .command('validate')
  .description('Validate IR JSON against canonical schema')
  .argument('<file>', 'IR JSON file to validate (.json)')
  .option('-v, --verbose', 'Show detailed validation errors')
  .action((file: string, options: { verbose?: boolean }) => {
    try {
      // Read IR JSON file
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      const json = fs.readFileSync(file, 'utf-8');
      const ir: IR = JSON.parse(json);

      // Validate against schema
      const result = validateIR(ir);

      if (result.valid) {
        console.log(`✓ ${file}: Valid IR`);
        process.exit(0);
      } else {
        console.log(`✗ ${file}: Invalid IR`);
        console.log(`  ${result.errors.length} validation error(s)\n`);

        if (options.verbose) {
          for (const error of result.errors) {
            console.log(`  - ${error.instancePath || '/'}: ${error.message}`);
            if (error.params) {
              console.log(`    Params: ${JSON.stringify(error.params)}`);
            }
          }
        } else {
          console.log('  Use --verbose to see detailed errors');
        }

        process.exit(1);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Validation error: ${error.message}`);
      } else {
        console.error('Validation error:', error);
      }
      process.exit(1);
    }
  });

// Parse arguments and run
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
