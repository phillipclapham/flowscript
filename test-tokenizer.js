#!/usr/bin/env node

/**
 * Interactive tokenizer test script
 *
 * Usage:
 *   node test-tokenizer.js
 *   node test-tokenizer.js "your flowscript here"
 */

const { Tokenizer } = require('./dist/tokenizer');
const { TokenType } = require('./dist/types');

// Get input from command line or use default examples
const input = process.argv[2];

if (!input) {
  console.log('🧪 FlowScript Tokenizer Test\n');
  console.log('Usage: node test-tokenizer.js "your flowscript here"\n');
  console.log('Running example tests...\n');

  runExamples();
} else {
  console.log('Input:', input);
  console.log('\nTokens:');
  const tokens = new Tokenizer(input).tokenize();
  printTokens(tokens);
}

function runExamples() {
  const examples = [
    {
      name: 'Basic causal',
      input: 'A -> B'
    },
    {
      name: 'Tension with axis',
      input: 'speed ><[velocity vs quality] quality'
    },
    {
      name: 'State marker',
      input: '[decided(rationale: "test", on: "2025-10-17")] Ship it'
    },
    {
      name: 'Question',
      input: '? What is the best approach'
    },
    {
      name: 'Alternatives with decision',
      input: `? choose approach

|| Option A
  -> fast
  -> risky

|| Option B
  -> slow
  -> safe

[decided(rationale: "safety first", on: "2025-10-17")]
Option B`
    }
  ];

  examples.forEach(example => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Example: ${example.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log('Input:');
    console.log(example.input);
    console.log('\nTokens:');
    const tokens = new Tokenizer(example.input).tokenize();
    printTokens(tokens);
  });
}

function printTokens(tokens) {
  // Filter out EOF for cleaner output
  const filtered = tokens.filter(t => t.type !== TokenType.EOF);

  console.table(filtered.map(t => ({
    Type: t.type,
    Value: t.value.substring(0, 40), // Truncate long values
    Line: t.line,
    Col: t.column
  })));

  console.log(`\nTotal tokens: ${filtered.length}`);
}
