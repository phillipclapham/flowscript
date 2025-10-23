#!/usr/bin/env node

/**
 * FlowScript CLI
 *
 * Command-line interface for FlowScript toolchain:
 * - parse: Compile FlowScript text → IR JSON
 * - lint: Validate FlowScript semantics
 * - validate: Verify IR JSON against schema
 * - query: Query IR for cognitive insights (5 queries)
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from './parser';
import { Linter } from './linter';
import { validateIR } from './validate';
import { IR } from './types';
import { FlowScriptQueryEngine } from './query-engine';

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

/**
 * Helper: Load IR from file
 */
function loadIR(file: string): IR {
  if (!fs.existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }

  const json = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(json) as IR;
  } catch (error) {
    console.error(`Error: Invalid JSON in ${file}`);
    process.exit(1);
  }
}

/**
 * Query command group: Query FlowScript IR for insights
 */
const query = program
  .command('query')
  .description('Query FlowScript IR for cognitive insights');

/**
 * Query: why - Trace causal ancestry
 */
query
  .command('why')
  .description('Trace causal ancestry backward from a node')
  .argument('<node-id>', 'Node ID to query')
  .argument('<ir-file>', 'IR JSON file')
  .option('-f, --format <format>', 'Output format: chain|tree|minimal', 'chain')
  .option('-d, --max-depth <depth>', 'Maximum depth to traverse', parseInt)
  .addHelpText('after', `
Examples:
  $ flowscript query why decision-001 examples/decision.json
  $ flowscript query why node-123 output.json --format=tree
  $ flowscript query why node-456 output.json --max-depth=3`)
  .action((nodeId: string, irFile: string, options: { format?: string; maxDepth?: number }) => {
    try {
      const ir = loadIR(irFile);
      const engine = new FlowScriptQueryEngine();
      engine.load(ir);

      const result = engine.why(nodeId, {
        format: options.format as 'chain' | 'tree' | 'minimal',
        maxDepth: options.maxDepth
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Query error: ${error.message}`);
      } else {
        console.error('Query error:', error);
      }
      process.exit(1);
    }
  });

/**
 * Query: what-if - Calculate impact analysis
 */
query
  .command('what-if')
  .description('Calculate forward impact analysis from a node')
  .argument('<node-id>', 'Node ID to query')
  .argument('<ir-file>', 'IR JSON file')
  .option('-f, --format <format>', 'Output format: tree|list|summary', 'tree')
  .option('-d, --max-depth <depth>', 'Maximum depth to traverse', parseInt)
  .addHelpText('after', `
Examples:
  $ flowscript query what-if decision-001 examples/decision.json
  $ flowscript query what-if node-123 output.json --format=summary
  $ flowscript query what-if node-456 output.json --max-depth=2`)
  .action((nodeId: string, irFile: string, options: { format?: string; maxDepth?: number }) => {
    try {
      const ir = loadIR(irFile);
      const engine = new FlowScriptQueryEngine();
      engine.load(ir);

      const result = engine.whatIf(nodeId, {
        format: options.format as 'tree' | 'list' | 'summary',
        maxDepth: options.maxDepth
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Query error: ${error.message}`);
      } else {
        console.error('Query error:', error);
      }
      process.exit(1);
    }
  });

/**
 * Query: tensions - Extract all tradeoffs
 */
query
  .command('tensions')
  .description('Extract and group all tension/tradeoff nodes')
  .argument('<ir-file>', 'IR JSON file')
  .option('-g, --group-by <grouping>', 'Grouping: axis|node|none', 'axis')
  .option('-a, --axis <axis>', 'Filter by specific axis')
  .option('-c, --with-context', 'Include parent context')
  .addHelpText('after', `
Examples:
  $ flowscript query tensions examples/decision.json
  $ flowscript query tensions output.json --group-by=node
  $ flowscript query tensions output.json --axis="speed vs quality"
  $ flowscript query tensions output.json --with-context`)
  .action((irFile: string, options: { groupBy?: string; axis?: string; withContext?: boolean }) => {
    try {
      const ir = loadIR(irFile);
      const engine = new FlowScriptQueryEngine();
      engine.load(ir);

      const result = engine.tensions({
        groupBy: options.groupBy as 'axis' | 'node' | 'none',
        filterByAxis: options.axis ? [options.axis] : undefined,
        includeContext: options.withContext
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Query error: ${error.message}`);
      } else {
        console.error('Query error:', error);
      }
      process.exit(1);
    }
  });

/**
 * Query: blocked - Find blocked tasks with impact analysis
 */
query
  .command('blocked')
  .description('Find all blocked nodes with dependency chains and impact scoring')
  .argument('<ir-file>', 'IR JSON file')
  .option('-s, --since <date>', 'Filter by blocked since date (YYYY-MM-DD)')
  .option('-f, --format <format>', 'Output format: detailed|summary', 'detailed')
  .addHelpText('after', `
Examples:
  $ flowscript query blocked examples/decision.json
  $ flowscript query blocked output.json --since=2025-10-01
  $ flowscript query blocked output.json --format=summary`)
  .action((irFile: string, options: { since?: string; format?: string }) => {
    try {
      const ir = loadIR(irFile);
      const engine = new FlowScriptQueryEngine();
      engine.load(ir);

      const result = engine.blocked({
        since: options.since,
        format: options.format as 'detailed' | 'summary'
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Query error: ${error.message}`);
      } else {
        console.error('Query error:', error);
      }
      process.exit(1);
    }
  });

/**
 * Query: alternatives - Reconstruct decision from alternatives
 */
query
  .command('alternatives')
  .description('Reconstruct decision rationale from alternative nodes')
  .argument('<question-id>', 'Question node ID to analyze')
  .argument('<ir-file>', 'IR JSON file')
  .option('-f, --format <format>', 'Output format: comparison|simple', 'comparison')
  .addHelpText('after', `
Examples:
  $ flowscript query alternatives question-001 examples/decision.json
  $ flowscript query alternatives node-123 output.json --format=simple`)
  .action((questionId: string, irFile: string, options: { format?: string }) => {
    try {
      const ir = loadIR(irFile);
      const engine = new FlowScriptQueryEngine();
      engine.load(ir);

      const result = engine.alternatives(questionId, {
        format: options.format as 'comparison' | 'simple'
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Query error: ${error.message}`);
      } else {
        console.error('Query error:', error);
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
