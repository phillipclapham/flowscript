# FlowScript Toolchain

**Production-quality parser, linter, and CLI tools for FlowScript**

Status: Phase 3 Complete ✅ (100% test coverage)

---

## Overview

The FlowScript toolchain compiles FlowScript notation into queryable IR JSON:

```
FlowScript text (.fs)
  ↓ parse (PEG grammar)
Canonical IR JSON (.json)
  ↓ validate (JSON Schema)
Validated graph
  ↓ lint (semantic rules)
Quality-checked cognitive graph
```

## Installation

```bash
# Install dependencies
npm install

# Build toolchain
npm run build

# Verify installation
./bin/flowscript --help
```

## CLI Commands

### parse - Compile FlowScript → IR JSON

```bash
# Parse to stdout (pretty JSON)
flowscript parse input.fs

# Parse to file
flowscript parse input.fs -o output.json

# Parse to compact JSON
flowscript parse input.fs -o output.json --compact
```

**What it does:**
- Parses FlowScript text using PEG grammar (Ohm.js)
- Generates content-hash IDs (SHA-256) for deduplication
- Adds provenance metadata (source file, line number, timestamp)
- Emits canonical IR JSON

**Exit codes:**
- `0` = Success
- `1` = Parse error (syntax issue)

**Example:**
```bash
$ flowscript parse examples/test.fs -o examples/test.json
✓ Parsed examples/test.fs → examples/test.json
```

### lint - Validate semantic correctness

```bash
# Lint with human-readable output
flowscript lint input.fs

# Lint with JSON output (for tools)
flowscript lint input.fs --json
```

**What it does:**
- Parses FlowScript and runs 9 semantic rules
- **6 ERROR rules** (MUST fix):
  - E001: Unlabeled tension (><[axis] required)
  - E002: Missing required fields ([decided], [blocked])
  - E003: Invalid syntax (multiple states)
  - E004: Orphaned nodes (no relationships)
  - E005: Causal cycles (-> without feedback:true)
  - E006: Alternatives without decision (|| branches)
- **3 WARNING rules** (SHOULD fix):
  - W001: Missing recommended fields ([parking])
  - W002: Deep nesting (>5 levels)
  - W003: Long causal chains (>10 steps)

**Exit codes:**
- `0` = No errors (warnings OK)
- `1` = Errors found

**Example:**
```bash
$ flowscript lint examples/test.fs

Linting examples/test.fs:

✗ E004: Orphaned node detected (no relationships): "How do we test?"
  at examples/test.fs:7
  Suggestion: Connect with relationship: How do we test? -> {target}

15 error(s), 0 warning(s)
```

### validate - Verify IR JSON against schema

```bash
# Validate with summary
flowscript validate graph.json

# Validate with detailed errors
flowscript validate graph.json --verbose
```

**What it does:**
- Loads IR JSON file
- Validates against canonical schema (spec/ir.schema.json)
- Reports validation errors

**Exit codes:**
- `0` = Valid IR
- `1` = Invalid IR

**Example:**
```bash
$ flowscript validate examples/test.json
✓ examples/test.json: Valid IR
```

## Workflow Examples

### Basic workflow: FlowScript → IR JSON

```bash
# 1. Write FlowScript
cat > example.fs << 'EOF'
? What is the goal?

The goal:
  -> Build working toolchain
  -> Validate architecture

[decided(rationale: "foundation must be solid", on: "2025-10-20")]
EOF

# 2. Parse to IR JSON
flowscript parse example.fs -o example.json

# 3. Validate IR
flowscript validate example.json

# 4. Lint for quality
flowscript lint example.fs
```

### Integration with other tools

```bash
# Pipe to jq for JSON processing
flowscript parse input.fs | jq '.nodes[] | select(.type=="question")'

# Lint and exit on errors (CI/CD)
flowscript lint document.fs || exit 1

# Parse all .fs files in directory
for file in *.fs; do
  flowscript parse "$file" -o "${file%.fs}.json"
done
```

## Programmatic Usage

The toolchain can be used as a library:

```typescript
import { Parser, Linter, validateIR } from 'flowscript';

// Parse FlowScript
const parser = new Parser('input.fs');
const ir = parser.parse(flowscriptText);

// Lint
const linter = new Linter();
const results = linter.lint(ir);

// Validate
const validation = validateIR(ir);
console.log(validation.valid); // true/false
```

## Architecture

### Components

- **Parser** (src/parser.ts)
  - PEG grammar (src/grammar.ohm)
  - Ohm.js semantic actions
  - 77/77 tests passing (100% coverage)

- **Linter** (src/linter.ts)
  - 9 rules (src/rules/*.ts)
  - Graph analysis (DFS, degree)
  - 19/19 tests passing

- **Validator** (src/validate.ts)
  - JSON Schema (spec/ir.schema.json)
  - AJV validator

- **CLI** (src/cli.ts)
  - Commander.js framework
  - 3 commands: parse, lint, validate

### Build Process

```bash
# TypeScript compilation
tsc

# Copy grammar file to dist/
cp src/grammar.ohm dist/grammar.ohm
```

The `npm run build` script handles both steps automatically.

### Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm test:watch

# Test specific suite
npm test -- parser-core.test.ts
```

## Troubleshooting

### "Parse error: Expected..."

Your FlowScript has syntax errors. Check:
- Matching braces `{ }`
- Valid operators: `->`, `=>`, `<->`, `><[axis]`
- State marker fields: `[decided(rationale: "...", on: "...")]`

### "Orphaned node" errors

All nodes must be connected via relationships. To fix:
- Add relationships: `A -> B`
- Or wrap in blocks: `{ ... }`
- Or mark as intentional: `[parking]`

### "File not found: dist/grammar.ohm"

Run `npm run build` to compile TypeScript and copy grammar file.

### Schema validation warnings

Warnings about "unknown format" are non-critical. Validation still works correctly.

## Next Steps

### Phase 4: Golden Examples

With the toolchain complete, Phase 4 will create canonical examples:

```bash
# Will create:
examples/decision.fs + .json + .mermaid + README.md
examples/debug.fs + .json + .mermaid + README.md
examples/research.fs + .json + .mermaid + README.md
examples/design.fs + .json + .mermaid + README.md
```

Each example demonstrates:
- Pattern usage (decision under tension, debug triage, research plan, design RFC)
- FlowScript → IR compilation
- Mermaid graph visualization
- Critical queries (why?, what_if?, open_questions, etc.)

### Phase 6: Continuity Demo

After golden examples, implement the 5 critical queries:

1. **why(nodeId)** - Causal justification
2. **what_if(nodeId)** - Impact analysis
3. **open_questions()** - Lifecycle automation
4. **blocked_tasks()** - Dependency chains
5. **recent_decisions()** - Evolution tracking

These queries prove the "computable substrate" architecture.

---

## Specifications

Complete specifications available in `/spec`:

- **semantics.md** - Marker definitions and compilation rules
- **ir.schema.json** - Canonical JSON schema
- **grammar.md** - EBNF formal grammar
- **linter-rules.md** - All 9 linter rules
- **golden_examples_spec.md** - Example patterns
- **critical_queries_spec.md** - Query specifications

---

**Status:** Phase 3 COMPLETE ✅
**Test Coverage:** 100% (77/77 parser tests + 19/19 linter tests)
**Ready for:** Phase 4 (Golden Examples)

*Built with PEG (Ohm.js), TypeScript, Commander.js*
*Last updated: 2025-10-20*
