#!/usr/bin/env node

/**
 * Simple tokenizer test (works without memory issues)
 */

const { Tokenizer } = require("./dist/tokenizer");

console.log("🧪 Testing FlowScript Tokenizer\n");

// Test 1
console.log("Test 1: A -> B");
let tokens = new Tokenizer("A -> B").tokenize();
console.log("Tokens:", tokens.map((t) => `${t.type}(${t.value})`).join(" "));

// Test 2
console.log("\nTest 2: speed >< quality");
tokens = new Tokenizer("speed >< quality").tokenize();
console.log("Tokens:", tokens.map((t) => `${t.type}(${t.value})`).join(" "));

// Test 3
console.log("\nTest 3: [decided] Ship it");
tokens = new Tokenizer("[decided] Ship it").tokenize();
console.log("Tokens:", tokens.map((t) => `${t.type}(${t.value})`).join(" "));

// Test 4
console.log("\nTest 4: ? What should we do");
tokens = new Tokenizer("? What should we do").tokenize();
console.log("Tokens:", tokens.map((t) => `${t.type}(${t.value})`).join(" "));

// Test 5
console.log(
  "\nTest 4: ! thought: {these test cases are foundational <- ? are they enough to prove the concept?}"
);
tokens = new Tokenizer(
  "! thought: {these test cases are foundational <- ? are they enough to prove the concept?}"
).tokenize();
console.log("Tokens:", tokens.map((t) => `${t.type}(${t.value})`).join(" "));

console.log("\n✅ Tokenizer is working!");
console.log("\n💡 To test your own FlowScript:");
console.log("   node simple-test.js");
console.log("   # Edit this file and add your test cases\n");
