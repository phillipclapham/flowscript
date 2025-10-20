# FlowScript Indentation Specification

**Version:** 1.0
**Status:** Complete
**Created:** 2025-10-20 (Session 4a-continued-1)
**Purpose:** Formal specification of Python-style indentation semantics for FlowScript

---

## Overview

FlowScript supports **indentation-based syntax** for hierarchical structure, following Python/PEP 8 best practices. Indentation creates implicit block boundaries, allowing natural expression of relationships without explicit `{}` delimiters.

This specification defines:
1. Indentation rules and standards
2. Error conditions and handling
3. Transformation algorithm (indentation → explicit blocks)
4. Interaction with explicit `{}` syntax
5. Implementation guidance

---

## Motivation

### Problem

The FlowScript specification (see `spec/golden_examples_spec.md`) uses indentation-based syntax throughout:

```flowscript
? authentication strategy for v1 launch
  || JWT tokens
     -> stateless architecture
        -> scales horizontally
```

However, the initial parser implementation only recognized continuation relationships inside explicit `{}` blocks:

```flowscript
{ A
  -> B  // Creates relationship ✓
}

A
  -> B  // Parsed as separate statements, NO relationship ✗
```

**Result:** Cannot create golden examples as specified. Spec is canonical, so parser must support indentation.

### Solution

Implement **Python-style indentation preprocessing** with INDENT/DEDENT tokens. Transform indented syntax to explicit blocks before parsing, preserving line number provenance.

**Architecture:**
```
Input FlowScript (indented)
  ↓
IndentationScanner (preprocessor)
  - Stack-based INDENT/DEDENT tracking
  - Inserts implicit { } around indented sections
  - Preserves line number mapping
  ↓
Transformed FlowScript (explicit blocks)
  ↓
Existing Parser (unchanged)
  ↓
IR JSON with correct relationships
```

---

## Indentation Standard

### 1. Indentation Amount

**Default:** 2 spaces per indentation level

**Rationale:**
- Matches spec examples (see `spec/golden_examples_spec.md`)
- More compact than Python's 4 spaces
- Balances readability with vertical space efficiency
- Common in web development (JavaScript, TypeScript conventions)

**Configuration:**
```typescript
// Configurable in linter settings
{
  "indentSize": 2  // default
}
```

**Rule:** Indentation MUST be consistent throughout a document. All indented lines must be exact multiples of `indentSize`.

**Examples:**
```flowscript
// ✓ Valid (2 spaces per level)
A
  B
    C
      D

// ✓ Valid (4 spaces per level, if configured)
A
    B
        C

// ✗ Invalid (inconsistent: 2 then 3 spaces)
A
  B
   C  // ERROR: Expected 0, 2, or 4 spaces, found 3
```

### 2. Tab Handling

**Rule:** Tabs are **ERROR** (not warning, not silent conversion).

**Rationale:**
- Follows Python 3 best practice (PEP 8: no mixing tabs/spaces)
- Prevents display inconsistencies across editors
- Eliminates ambiguity in indentation level calculation
- Clear error better than silent conversion (principle of least surprise)

**Error Message:**
```
IndentationError: Tabs not allowed. Use 2 spaces for indentation. (Line X)
```

**Implementation:**
```typescript
if (line.includes('\t')) {
  throw new IndentationError(
    `Tabs not allowed. Use 2 spaces for indentation.`,
    lineNum
  );
}
```

**Examples:**
```flowscript
// ✗ Invalid (contains tab character)
A
→B  // ERROR: Tabs not allowed. Use 2 spaces. (Line 2)

// ✓ Valid (spaces only)
A
  B
```

### 3. Inconsistent Indentation

**Rule:** Indentation MUST be exact multiple of `indentSize`. Dedentation MUST return to a previous valid indentation level.

**Rationale:**
- Follows Python 3 enforcement (not just warning)
- Prevents ambiguity in structure
- Catches copy-paste errors early
- Forces consistent formatting

**Error Cases:**

**Case 1: Not multiple of indentSize**
```flowscript
A
  B
   C  // ERROR: Expected multiple of 2 spaces, found 3
```

**Error Message:**
```
IndentationError: Inconsistent indentation. Expected multiple of 2 spaces, found 3. (Line 3)
```

**Case 2: Dedent to non-existent level**
```flowscript
A        // level 0
  B      // level 2
    C    // level 4
   D     // ERROR: level 3 never existed
```

**Error Message:**
```
IndentationError: Invalid dedent to level 3. Expected one of: [0, 2, 4]. (Line 4)
```

**Implementation:**
```typescript
// Check for multiple
if (indent % this.indentSize !== 0) {
  throw new IndentationError(
    `Expected multiple of ${this.indentSize} spaces, found ${indent}.`,
    lineNum
  );
}

// Check dedent to valid level
if (indent < prevIndent && !this.indentStack.includes(indent)) {
  const validLevels = this.indentStack.join(', ');
  throw new IndentationError(
    `Invalid dedent to level ${indent}. Expected one of: [${validLevels}].`,
    lineNum
  );
}
```

### 4. Blank Lines

**Rule:** Blank lines (empty or whitespace-only) ignore indentation checking.

**Rationale:**
- Standard practice in all indentation-sensitive languages (Python, Haskell, F#)
- Allows visual separation without affecting structure
- Whitespace-only lines treated same as empty

**Behavior:**
- Blank lines don't change `indentStack`
- Don't trigger INDENT or DEDENT
- Don't affect subsequent line's parent context

**Examples:**
```flowscript
// ✓ Valid (blank line ignored)
A
  B

  C  // Still child of A, not error

// ✓ Valid (whitespace-only line ignored)
A
  B

  C  // C is still child of A

// ✓ Valid (multiple blank lines)
A


  B  // B is child of A
```

**Implementation:**
```typescript
if (line.trim() === '') {
  return [line];  // Pass through, don't process
}
```

### 5. First Line Handling

**Rule:** First line of document MUST be at column 0 (no indentation).

**Rationale:**
- No parent context exists for indented first line
- Prevents ambiguous document structure
- Standard in all indentation-sensitive languages

**Error Message:**
```
IndentationError: First line cannot be indented. (Line 1)
```

**Examples:**
```flowscript
// ✗ Invalid (first line indented)
  A  // ERROR: First line cannot be indented

// ✓ Valid (starts at column 0)
A
  B
```

**Implementation:**
```typescript
if (lineNum === 1 && indent > 0) {
  throw new IndentationError(
    `First line cannot be indented.`,
    1
  );
}
```

### 6. Mixed Syntax Support

**Rule:** Explicit `{}` blocks work alongside indentation-based syntax.

**Rationale:**
- User evidence shows both styles in use
- Backward compatibility with existing code
- Allows choice of style per context

**Behavior:**
- Explicit `{}` blocks pass through preprocessor unchanged
- Indentation-based sections transform to `{}`
- Both styles can coexist in same document

**Examples:**
```flowscript
// ✓ Valid (mixed: explicit {} + indentation)
A {
  B
  C
}
D
  E  // Indentation creates implicit { E }
  F

// ✓ Valid (nested: indentation inside explicit block)
A {
  B
    C  // Indentation inside block works
}

// ✓ Valid (inline relationship, no indentation needed)
A -> B -> C
```

**Implementation Note:**
Preprocessor only inserts `{}` around indented sections. Existing `{}` blocks remain untouched.

---

## Transformation Algorithm

### Stack-Based INDENT/DEDENT

The preprocessor uses a **stack-based algorithm** (proven pattern from Python, Haskell, F#).

**Core Data Structure:**
```typescript
indentStack: number[] = [0];  // Stack of active indentation levels
```

**Algorithm:**

```typescript
class IndentationScanner {
  private indentStack: number[] = [0];
  private indentSize: number;

  constructor(options: { indentSize?: number } = {}) {
    this.indentSize = options.indentSize ?? 2;
  }

  processLine(line: string, lineNum: number): string[] {
    // 1. Skip blank lines
    if (line.trim() === '') {
      return [line];
    }

    // 2. Calculate indentation
    const indent = this.countLeadingSpaces(line);

    // 3. Detect tabs (ERROR)
    if (line.includes('\t')) {
      throw new IndentationError(
        `Tabs not allowed. Use ${this.indentSize} spaces for indentation.`,
        lineNum
      );
    }

    // 4. Check first line
    if (lineNum === 1 && indent > 0) {
      throw new IndentationError(
        `First line cannot be indented.`,
        1
      );
    }

    // 5. Validate consistency
    if (indent % this.indentSize !== 0) {
      throw new IndentationError(
        `Expected multiple of ${this.indentSize} spaces, found ${indent}.`,
        lineNum
      );
    }

    const prevIndent = this.indentStack[this.indentStack.length - 1];
    const output: string[] = [];

    // 6. Compare to stack top
    if (indent > prevIndent) {
      // INDENT: push new level, emit '{'
      this.indentStack.push(indent);
      output.push('{');
      output.push(line);
    }
    else if (indent < prevIndent) {
      // DEDENT: pop until match, emit '}'
      while (this.indentStack.length > 1 &&
             this.indentStack[this.indentStack.length - 1] > indent) {
        this.indentStack.pop();
        output.push('}');
      }

      // Verify dedent to valid level
      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        const validLevels = this.indentStack.join(', ');
        throw new IndentationError(
          `Invalid dedent to level ${indent}. Expected one of: [${validLevels}].`,
          lineNum
        );
      }

      output.push(line);
    }
    else {
      // EQUAL: no change
      output.push(line);
    }

    return output;
  }

  finalize(): string[] {
    // Emit remaining DEDENTs at EOF
    const output: string[] = [];
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      output.push('}');
    }
    return output;
  }

  private countLeadingSpaces(line: string): number {
    let count = 0;
    for (const char of line) {
      if (char === ' ') count++;
      else if (char === '\t') break;  // Will error above
      else break;
    }
    return count;
  }
}
```

### Implicit Block Boundaries

**When INDENT creates `{`:**

```flowscript
// INPUT
A
  B

// Stack: [0] → [0, 2]
// TRANSFORMED
A
  {B
  }
```

**When DEDENT creates `}`:**

```flowscript
// INPUT
A
  B
C

// Stack: [0, 2] → [0]
// TRANSFORMED
A
  {B
  }
C
```

**When multiple DEDENT in one step:**

```flowscript
// INPUT
A
  B
    C
      D
E

// Stack: [0, 2, 4, 6] → [0]
// TRANSFORMED (emit 3 closing braces)
A
  {B
    {C
      {D
      }
    }
  }
E
```

**End-of-file handling:**

```flowscript
// INPUT
A
  B
    C
// EOF

// Stack: [0, 2, 4] → [0]
// TRANSFORMED (finalize emits remaining })
A
  {B
    {C
    }
  }
```

---

## Transformation Examples

### Example 1: Simple Nesting (2 levels)

**Input:**
```flowscript
? authentication strategy
  || JWT tokens
     -> stateless architecture
```

**Transformation:**
```flowscript
? authentication strategy
  {|| JWT tokens
     {-> stateless architecture
     }
  }
```

**Stack Evolution:**
```
Line 1: indent=0, stack=[0]        → no change
Line 2: indent=2, stack=[0] → [0,2] → emit '{'
Line 3: indent=5, stack=[0,2] → [0,2,5] → emit '{'
EOF:    stack=[0,2,5] → [0]       → emit '}' twice
```

### Example 2: Deep Nesting (5 levels)

**Input:**
```flowscript
A
  B
    C
      D
        E
          F
```

**Transformation:**
```flowscript
A
  {B
    {C
      {D
        {E
          {F
          }
        }
      }
    }
  }
```

**Stack Evolution:**
```
Line 1: indent=0,  stack=[0]
Line 2: indent=2,  stack=[0,2]          → emit '{'
Line 3: indent=4,  stack=[0,2,4]        → emit '{'
Line 4: indent=6,  stack=[0,2,4,6]      → emit '{'
Line 5: indent=8,  stack=[0,2,4,6,8]    → emit '{'
Line 6: indent=10, stack=[0,2,4,6,8,10] → emit '{'
EOF:    stack=[0,2,4,6,8,10] → [0]     → emit '}' 5 times
```

### Example 3: Multiple Dedent in One Step

**Input:**
```flowscript
A
  B
    C
      D
E
```

**Transformation:**
```flowscript
A
  {B
    {C
      {D
      }
    }
  }
E
```

**Stack Evolution:**
```
Line 1: indent=0, stack=[0]
Line 2: indent=2, stack=[0,2]      → emit '{'
Line 3: indent=4, stack=[0,2,4]    → emit '{'
Line 4: indent=6, stack=[0,2,4,6]  → emit '{'
Line 5: indent=0, stack=[0,2,4,6] → [0] → emit '}' 3 times
```

### Example 4: Blank Lines

**Input:**
```flowscript
A
  B

  C
```

**Transformation:**
```flowscript
A
  {B

  C
  }
```

**Stack Evolution:**
```
Line 1: indent=0, stack=[0]
Line 2: indent=2, stack=[0,2]    → emit '{'
Line 3: blank    → skip processing
Line 4: indent=2, stack=[0,2]    → no change (equal)
EOF:    stack=[0,2] → [0]        → emit '}'
```

### Example 5: Mixed Explicit Blocks + Indentation

**Input:**
```flowscript
A {
  B
  C
}
D
  E
  F
```

**Transformation:**
```flowscript
A {
  B
  C
}
D
  {E
  F
  }
```

**Note:** Explicit `{}` blocks pass through unchanged. Preprocessor only adds `{}` for indented sections.

### Example 6: All Relationship Operators

**Input:**
```flowscript
? question
  || alternative
     -> causes implication
     <- reverse causal
     <-> bidirectional
     => temporal sequence
     ><[axis] tension
```

**Transformation:**
```flowscript
? question
  {|| alternative
     {-> causes implication
     <- reverse causal
     <-> bidirectional
     => temporal sequence
     ><[axis] tension
     }
  }
```

**Result:** All relationship operators work with indentation. Parser creates edges correctly.

---

## Error Cases with Examples

### Error 1: Tab Character

**Input:**
```flowscript
A
→B  // Tab character
```

**Error:**
```
IndentationError: Tabs not allowed. Use 2 spaces for indentation. (Line 2)
```

### Error 2: Inconsistent Spacing (Not Multiple)

**Input:**
```flowscript
A
  B
   C  // 3 spaces (not multiple of 2)
```

**Error:**
```
IndentationError: Expected multiple of 2 spaces, found 3. (Line 3)
```

### Error 3: Dedent to Non-Existent Level

**Input:**
```flowscript
A        // level 0
  B      // level 2
    C    // level 4
   D     // level 3 (never existed)
```

**Error:**
```
IndentationError: Invalid dedent to level 3. Expected one of: [0, 2, 4]. (Line 4)
```

### Error 4: First Line Indented

**Input:**
```flowscript
  A  // First line indented
  B
```

**Error:**
```
IndentationError: First line cannot be indented. (Line 1)
```

---

## Provenance Preservation

### Line Number Mapping

**Problem:** Transformation inserts synthetic `{` `}` lines. IR provenance must reference **original source** line numbers, not transformed.

**Solution:** Maintain line mapping during transformation.

**Implementation:**
```typescript
interface TransformResult {
  transformed: string;
  lineMap: Map<number, number>;  // transformed line → original line
}

process(input: string): TransformResult {
  const lines = input.split('\n');
  const output: string[] = [];
  const lineMap = new Map<number, number>();

  for (let i = 0; i < lines.length; i++) {
    const originalLineNum = i + 1;
    const transformedLines = this.processLine(lines[i], originalLineNum);

    for (const tLine of transformedLines) {
      output.push(tLine);
      const transformedLineNum = output.length;
      lineMap.set(transformedLineNum, originalLineNum);
    }
  }

  return {
    transformed: output.join('\n'),
    lineMap
  };
}
```

**Usage in Parser:**
```typescript
parse(input: string): IR {
  // 1. Preprocess
  const { transformed, lineMap } = scanner.process(input);

  // 2. Parse transformed text
  const matchResult = this.grammar.match(transformed);

  // 3. Generate IR with correct provenance
  const semantics = this.semantics(matchResult);
  const ir = semantics.eval(lineMap);

  // 4. Provenance uses original line numbers
  return ir;
}
```

**Example:**
```flowscript
// ORIGINAL
A
  B

// TRANSFORMED
A
{
  B
}

// LINE MAP
1 → 1  (A)
2 → 2  ({  - synthetic, maps to line 2)
3 → 2  (  B)
4 → 2  (}  - synthetic, maps to line 2)

// IR PROVENANCE (uses lineMap)
{
  "id": "sha256:...",
  "content": "B",
  "provenance": {
    "line_number": 2  // Original line, not 3
  }
}
```

---

## Research Summary: PEP 8 & Indentation-Sensitive Parsing

### Python PEP 8 Style Guide

**Source:** [PEP 8 - Style Guide for Python Code](https://www.python.org/dev/peps/pep-0008/)

**Key Principles:**
1. **Spaces, not tabs:** "Use spaces for indentation."
2. **4 spaces per level:** "Use 4 spaces per indentation level."
3. **Never mix:** "Python 3 disallows mixing tabs and spaces."
4. **Consistency required:** "Python 3 raises IndentationError for inconsistent indentation."

**FlowScript Adaptations:**
- ✓ Spaces only (same as PEP 8)
- ✓ Tabs cause ERROR (same as Python 3)
- ✓ Consistency enforced (same as Python 3)
- ✗ 2 spaces per level (Python uses 4, we chose 2 for compactness)

### Indentation-Sensitive Parser Implementations

**Lark (Python parser framework):**
- Uses preprocessing stage with INDENT/DEDENT tokens
- Stack-based algorithm
- [Lark Indentation Documentation](https://lark-parser.readthedocs.io/en/latest/features.html#automatic-indentation)

**Langium (language workbench):**
- Supports indentation-sensitive grammars
- Preprocessor transforms to block-based syntax
- [Langium Indentation Guide](https://langium.org/docs/grammar-language/#indentation-sensitive-languages)

**ANTLR4 (parser generator):**
- Lexer hack: inject INDENT/DEDENT tokens during lexing
- Stack maintained in lexer state
- [ANTLR4 Python Grammar](https://github.com/antlr/grammars-v4/tree/master/python/python3)

**Common Pattern:**
All implementations use **preprocessing** (not grammar modifications) for indentation. Proven, battle-tested approach.

---

## Implementation Guidance

### Phase 1: Core Scanner (Session 4a-continued-2)

**Deliverables:**
- `src/indentation-scanner.ts` - IndentationScanner class
- `src/errors/indentation-error.ts` - Custom error class
- `tests/indentation-scanner.test.ts` - 20+ unit tests

**Key Methods:**
```typescript
class IndentationScanner {
  constructor(options?: { indentSize?: number });
  process(input: string): TransformResult;
  private processLine(line: string, lineNum: number): string[];
  private finalize(): string[];
  private countLeadingSpaces(line: string): number;
}
```

### Phase 2: Provenance Mapping (Session 4a-continued-3)

**Deliverables:**
- Updated `IndentationScanner` with line mapping
- Updated `Parser` to accept lineMap parameter
- `tests/provenance-mapping.test.ts` - 10+ tests

**Key Changes:**
```typescript
// Return line mapping
process(input: string): { transformed: string; lineMap: Map<number, number> }

// Parser uses mapping
parse(input: string): IR {
  const { transformed, lineMap } = scanner.process(input);
  return this.parseWithGrammar(transformed, lineMap);
}
```

### Phase 3: Integration (Session 4a-continued-4)

**Deliverables:**
- Integrated `Parser.parse()` with preprocessor
- All 83 existing tests passing (ZERO regressions)
- `tests/indentation-integration.test.ts` - 15+ new tests

**Success Criteria:**
- All existing functionality preserved
- Indentation syntax works everywhere
- Linter handles indented code correctly
- CLI tools work end-to-end

---

## Test Coverage Requirements

### Valid Cases (MUST work correctly)

1. **Simple indentation (2 levels)**
2. **Deep nesting (5+ levels)**
3. **Multiple dedent in one step (4 → 1)**
4. **Blank lines within indented sections**
5. **Mixed explicit blocks + indentation**
6. **Empty indented sections**
7. **All relationship operators:** `->`, `<-`, `<->`, `=>`, `><[axis]`
8. **Alternative marker `||` with indented children**
9. **State markers with indentation**
10. **Modifiers with indentation**

### Error Cases (MUST throw with helpful messages)

1. **Tab character detected**
2. **Inconsistent spacing (3 spaces, 5 spaces)**
3. **First line indented**
4. **Dedent to non-existent level**

### Edge Cases

1. **Whitespace-only lines (treated as blank)**
2. **Multiple blank lines in sequence**
3. **EOF with open indentation (finalize emits `}`)**
4. **Indentation inside explicit `{}` blocks**

**Total:** 15+ test cases minimum

---

## Success Criteria

Session 4a-continued-1 complete when:

- ✅ `/spec/indentation.md` created (~300-400 lines)
- ✅ All indentation rules completely specified
- ✅ All edge cases documented with examples
- ✅ Transformation algorithm specified
- ✅ Error conditions and messages defined
- ✅ PEP 8 research summary included
- ✅ Provenance preservation specified
- ✅ Implementation guidance clear
- ✅ Test fixtures created (15+ cases)
- ✅ Specification clear enough to implement from
- ✅ Decision 8 in decisions.md (already complete)
- ✅ Committed to git

---

## References

1. **PEP 8 - Style Guide for Python Code**
   https://www.python.org/dev/peps/pep-0008/

2. **Lark Parser - Indentation Handling**
   https://lark-parser.readthedocs.io/en/latest/features.html#automatic-indentation

3. **Langium - Indentation-Sensitive Grammars**
   https://langium.org/docs/grammar-language/#indentation-sensitive-languages

4. **ANTLR4 Python Grammar (reference implementation)**
   https://github.com/antlr/grammars-v4/tree/master/python/python3

5. **FlowScript Specification Files:**
   - `spec/semantics.md` - Marker semantics
   - `spec/grammar.md` - Formal grammar (line 116: indentation note)
   - `spec/golden_examples_spec.md` - Target syntax examples

---

**Specification Status:** COMPLETE
**Version:** 1.0
**Last Updated:** 2025-10-20 (Session 4a-continued-1)
**Lines:** ~650 (comprehensive specification)
**Next Session:** 4a-continued-2 (Preprocessor Core Implementation)
