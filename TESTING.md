# Testing the FlowScript Tokenizer

**Status:** Session 2a complete - Tokenizer implemented and working ✅
**Note:** There's a memory issue with complex inputs (will fix in Session 2b)

## Quick Start

### 1. Run Simple Tests
```bash
node simple-test.js
```

This runs basic tokenization tests on simple FlowScript patterns.

### 2. Test in Node REPL

```bash
node
```

Then in the REPL:
```javascript
const { Tokenizer } = require('./dist/tokenizer');

// Test basic causal
new Tokenizer('A -> B').tokenize();

// Test tension
new Tokenizer('speed >< quality').tokenize();

// Test state marker
new Tokenizer('[decided] Ship it').tokenize();

// Test question
new Tokenizer('? What next').tokenize();
```

### 3. Add Your Own Tests

Edit `simple-test.js` and add your test cases:

```javascript
// Add after the existing tests
console.log('\nMy Test: Custom FlowScript');
tokens = new Tokenizer('your flowscript here').tokenize();
console.log('Tokens:', tokens.map(t => `${t.type}(${t.value})`).join(' '));
```

## What Works

✅ All 21 FlowScript markers are recognized:
- **Relations:** `->`, `<-`, `<->`, `=>`, `><`
- **Definitions:** `=`, `!=`
- **States:** `[decided]`, `[exploring]`, `[blocked]`, `[parking]`
- **States with fields:** `[decided(rationale: "...", on: "...")]`
- **Questions:** `?`, `thought:`, `action:`, `✓`
- **Modifiers:** `!`, `++`, `*`, `~`
- **Structure:** `{`, `}`, `||`

✅ Line and column tracking
✅ Proper tokenization of text content
✅ TypeScript types for full type safety

## Known Issues

⚠️ **Memory Issue:** Complex multi-line inputs cause memory errors
- **Cause:** Likely infinite loop in tokenizer's whitespace/newline handling
- **Impact:** Can't test full examples yet
- **Fix:** Will address in Session 2b (Parser Core)
- **Workaround:** Test simple one-line patterns only

## File Structure

```
flowscript/
├── src/
│   ├── types.ts         # Type definitions (Token, IR types)
│   └── tokenizer.ts     # Tokenizer implementation
├── dist/                # Compiled JavaScript (npm run build)
│   ├── types.js
│   └── tokenizer.js
├── tests/
│   └── tokenizer.test.ts  # Comprehensive test suite (Jest)
└── simple-test.js       # Quick manual tests (works now)
```

## Commands

```bash
# Build TypeScript → JavaScript
npm run build

# Run simple tests
node simple-test.js

# Interactive testing
node
> const { Tokenizer } = require('./dist/tokenizer');
> new Tokenizer('A -> B').tokenize();
```

## Example Output

```javascript
> new Tokenizer('A -> B').tokenize()
[
  { type: 'TEXT', value: 'A', line: 1, column: 1 },
  { type: '->', value: '->', line: 1, column: 3 },
  { type: 'TEXT', value: 'B', line: 1, column: 6 },
  { type: 'EOF', value: '', line: 1, column: 6 }
]
```

## Next Steps

**Session 2b** will build:
- Parser (tokenizer → AST → IR JSON)
- Fix tokenizer memory issue
- Full end-to-end compilation working

---

*Testing guide for FlowScript Phase 2a*
*Last updated: 2025-10-17*
