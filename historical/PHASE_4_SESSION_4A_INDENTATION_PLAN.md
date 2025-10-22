# Phase 4 - Session 4a: Indentation Implementation Plan

**Created:** 2025-10-20
**Status:** READY TO EXECUTE (Session 4a-continued-1)
**Estimated Time:** 13-19 hours across 6 subsessions
**Priority:** CRITICAL - blocks all golden examples delivery

---

## Executive Summary

During Session 4a execution, discovered **critical spec-implementation gap**: Parser creates nodes but NO relationships for indentation-based syntax. Golden examples specification uses indentation throughout (Python-style), but current parser only supports explicit `{}` blocks for continuation relationships.

**Impact:** Cannot create golden examples as specified. Spec is canonical, so parser must be fixed.

**Solution:** Implement Python-style indentation preprocessor with INDENT/DEDENT tokens (proven algorithm). Transform indented syntax to explicit blocks before parsing, preserving line number provenance.

**Timeline:** 6 subsessions (4a-continued-1 through 4a-continued-6), 13-19 hours total. NO time constraints - quality and correctness are paramount.

---

## Problem Analysis

### What We Discovered

**Attempted to create decision.fs from spec:**
```flowscript
? authentication strategy for v1 launch
  || JWT tokens
     -> stateless architecture
        -> scales horizontally
```

**Expected behavior:** Parser creates relationships (`->` causes edges in graph)

**Actual behavior:**
- ✅ Nodes created (question, alternatives, statements)
- ❌ `"relationships": []` (EMPTY!)
- ❌ Linter reports all nodes "orphaned"
- ❌ `->` treated as statement CONTENT, not relationship operator

### Root Cause

**Grammar limitation (src/grammar.ohm line 22):**
```ohm
ContinuationRel = RelOp space* RelNode
```

Continuation relationships (lines starting with `->`, `<-`, etc.) are only valid **inside explicit `{}` blocks**, not with indentation alone.

**What works:**
```flowscript
{ A
  -> B  // ContinuationRel creates relationship
}
```

**What doesn't work:**
```flowscript
A
  -> B  // Parsed as separate statements, NO relationship
```

### Why This Matters

**Spec examples use indentation consistently:**
- spec/golden_examples_spec.md: All 4 patterns use indentation
- spec/critical_queries_spec.md: Examples use indentation
- spec/grammar.md line 115: "Indentation is preserved for nesting structure"

**User's actual usage (from this conversation):**
```flowscript
? how do I like writing FlowScript: {
  || {I like using the '{}' thought blocks...}
  || I am an example of a simple thought without need for additional structure
}
```

User uses **both** explicit `{}` AND indentation. Both must work.

### The Evidence

**Test that "passes" but proves nothing:**
```javascript
it('parses alternatives with analysis', () => {
  const ir = parser.parse(`? auth strategy
  || JWT tokens
     -> stateless`);

  expect(alternatives.length).toBe(2);  // ✅ Nodes exist
  // But DOESN'T check relationships!
});
```

Test verifies nodes created, but NOT that relationships exist. This hid the bug.

**Actual JSON output (decision.json line 145):**
```json
"relationships": []  // ❌ EMPTY
```

---

## Solution Architecture

### Approach: Indentation Preprocessor

**Why this approach:**
1. ✅ **Proven pattern** - Python, Haskell, F# all use this
2. ✅ **Preserves existing grammar** - No risky grammar changes
3. ✅ **Backward compatible** - Explicit `{}` blocks continue working
4. ✅ **Clear separation** - Indentation logic isolated from parsing
5. ✅ **Provenance safe** - Can map transformed lines back to originals

**How it works:**
```
Input FlowScript (indented)
  ↓
IndentationScanner (NEW)
  - Tracks indentation levels with stack
  - Inserts implicit { } around indented sections
  - Generates INDENT/DEDENT tokens
  - Preserves line number mapping
  ↓
Transformed FlowScript (explicit blocks)
  ↓
Existing Parser (UNCHANGED)
  ↓
IR JSON with correct relationships
```

**Example transformation:**
```flowscript
// INPUT (indented)
? question
  || alternative
     -> implication

// TRANSFORMED (explicit blocks)
? question
  {|| alternative
     {-> implication
     }
  }

// IR (relationships created!)
"relationships": [
  {"type": "alternative", "source": "question", "target": "alternative"},
  {"type": "causes", "source": "alternative", "target": "implication"}
]
```

### Stack-Based Algorithm (INDENT/DEDENT)

**Core algorithm from Python/PEP 8:**

```typescript
class IndentationScanner {
  indentStack: number[] = [0];  // Stack of indent levels

  processLine(line: string, lineNum: number): string[] {
    // 1. Skip blank lines (ignore indentation)
    if (line.trim() === '') return [line];

    // 2. Calculate current indentation
    const indent = countLeadingSpaces(line);

    // 3. Detect tabs (ERROR)
    if (line.includes('\t')) {
      throw new Error(`Tabs not allowed. Use 2 spaces. (Line ${lineNum})`);
    }

    // 4. Validate consistent spacing (must be multiple of 2)
    if (indent % 2 !== 0) {
      throw new Error(`Inconsistent indentation. Expected multiple of 2 spaces, found ${indent}. (Line ${lineNum})`);
    }

    const prevIndent = indentStack[indentStack.length - 1];
    const output: string[] = [];

    // 5. Compare to stack top
    if (indent > prevIndent) {
      // INDENT: push new level, emit '{'
      indentStack.push(indent);
      output.push('{');
      output.push(line);
    }
    else if (indent < prevIndent) {
      // DEDENT: pop until match, emit '}'
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
        indentStack.pop();
        output.push('}');
      }

      // Verify dedent to valid level
      if (indentStack[indentStack.length - 1] !== indent) {
        throw new Error(`Invalid dedent to level ${indent}. Expected ${indentStack[indentStack.length - 1]}. (Line ${lineNum})`);
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
    // Emit remaining DEDENTs at end of file
    const output: string[] = [];
    while (indentStack.length > 1) {
      indentStack.pop();
      output.push('}');
    }
    return output;
  }
}
```

---

## Indentation Standard (PEP 8 Best Practices)

### Research Summary

**Sources:**
- Python PEP 8 (official style guide)
- Indentation-sensitive parser implementations (Lark, Langium, ANTLR4)
- Academic papers on layout parsing

**Best practices:**
1. ✅ **Spaces only** (strongly recommended for new projects)
2. ✅ **4 spaces per level** (Python standard)
3. ✅ **Tabs cause ERROR** (Python 3 disallows mixing tabs/spaces)
4. ✅ **Consistent indentation = ERROR if violated** (Python 3 enforces)
5. ✅ **Blank lines ignore indentation** (standard practice)

### FlowScript Standard

**Based on user preferences + spec examples:**

**1. Indentation Amount:**
- ✅ **2 spaces per indentation level** (matches spec examples, more compact than Python's 4)
- Configurable in linter settings (default: 2)
- Must be consistent throughout document

**2. Tab Handling:**
- ❌ **Tabs cause ERROR** (better than silent conversion)
- Error message: `"Tabs not allowed. Use 2 spaces for indentation. (Line X)"`
- Rationale: Follows Python 3 best practice (no mixing), prevents display inconsistencies

**3. Inconsistent Indentation:**
- ❌ **ERROR if not exact multiple of 2 spaces**
- Must indent by exactly 2 spaces (or configured amount)
- Must dedent to previous valid level
- Error message: `"Inconsistent indentation. Expected multiple of 2 spaces, found X. (Line Y)"`
- Rationale: Follows Python 3, prevents ambiguity

**4. Blank Lines:**
- ✅ **Ignore indentation** (standard practice)
- Blank lines don't affect indent level tracking
- Rationale: Common in all indentation-sensitive languages

**5. First Line:**
- ❌ **ERROR if indented** (file must start at column 0)
- Error message: `"First line cannot be indented. (Line 1)"`
- Rationale: No parent context for indented first line

---

## Session Breakdown

### Session 4a-continued-1: Indentation Specification (2-3 hours)

**Goal:** Complete formal specification of indentation semantics

**Tasks:**

1. **Create `/spec/indentation.md`** (complete specification document):
   - Indentation rules (2 spaces per level, configurable)
   - Tab handling (ERROR with helpful message)
   - Inconsistent indentation (ERROR with line number)
   - Blank line handling (ignore indentation)
   - First line handling (must be at column 0)
   - Mixed syntax (explicit `{}` + indentation together)
   - PEP 8 research summary with citations

2. **Define implicit block boundaries:**
   - When INDENT creates implicit `{` (indentation increase)
   - When DEDENT creates implicit `}` (indentation decrease)
   - Multiple DEDENT handling (closing multiple levels in one step)
   - Example transformations for each case

3. **Create test fixtures** (`/tests/fixtures/indentation-test-cases.txt`):
   - ✅ Simple indentation (2 levels)
   - ✅ Deep nesting (5+ levels)
   - ✅ Multiple dedent in one step (from level 4 → level 1)
   - ✅ Blank lines within indented sections
   - ❌ Tabs (should error)
   - ❌ Inconsistent spacing (3 spaces, 5 spaces - should error)
   - ❌ First line indented (should error)
   - ❌ Dedent to non-existent level (should error)
   - ✅ Mixed explicit blocks + indentation
   - ✅ Empty indented sections
   - ✅ All relationship operators (`->`, `<-`, `<->`, `=>`, `><[axis]`)
   - **15+ test cases total**

4. **Edge case specifications:**
   - Dedent to non-existent level (e.g., from 4 spaces to 3 spaces when only 0, 2, 4 exist)
   - First line indented (no parent context)
   - Empty indented sections (valid or error?)
   - Comments/blank lines between indented blocks (how to handle?)
   - Mixed indentation styles in different blocks (each block independent or global?)

5. **Update `decisions.md`:**
   - Decision 8: Indentation-Based Syntax Support
   - Context (spec uses indentation, parser doesn't support)
   - Decision (implement Python-style indentation everywhere)
   - Standard (2 spaces, tabs error, consistent required)
   - Approach (preprocessor with INDENT/DEDENT)
   - Rationale (spec is canonical, PEP 8 best practices)
   - Alternatives considered (fix grammar directly, adapt spec - rejected)

**Deliverables:**
- `/spec/indentation.md` (complete specification, ~300-400 lines)
- `/tests/fixtures/indentation-test-cases.txt` (15+ test cases)
- Updated `decisions.md` (Decision 8)

**Success Criteria:**
- ✅ Indentation rules completely specified
- ✅ All edge cases documented
- ✅ Test fixtures cover all cases
- ✅ Specification clear enough to implement from

---

### Session 4a-continued-2: Preprocessor Core (3-4 hours)

**Goal:** Working indentation → explicit blocks transformer

**Tasks:**

1. **Create `src/indentation-scanner.ts`:**
   - `IndentationScanner` class
   - Constructor options (indentSize: number = 2)
   - Line-by-line processing method
   - Indentation level stack (number[])
   - INDENT/DEDENT token generation
   - Implicit `{` `}` insertion logic

2. **Implement core algorithm:**
   ```typescript
   class IndentationScanner {
     private indentStack: number[] = [0];
     private indentSize: number;

     constructor(options: { indentSize?: number } = {}) {
       this.indentSize = options.indentSize ?? 2;
     }

     process(input: string): { transformed: string; lineMap: Map<number, number> } {
       const lines = input.split('\n');
       const output: string[] = [];
       const lineMap = new Map<number, number>();

       for (let i = 0; i < lines.length; i++) {
         const lineNum = i + 1;
         const line = lines[i];

         const transformed = this.processLine(line, lineNum);
         output.push(...transformed);

         // Track line mapping for provenance
         for (const tLine of transformed) {
           lineMap.set(output.length, lineNum);
         }
       }

       // Emit remaining DEDENTs at EOF
       output.push(...this.finalize());

       return {
         transformed: output.join('\n'),
         lineMap
       };
     }

     private processLine(line: string, lineNum: number): string[] {
       // Implementation as shown in algorithm section above
     }

     private finalize(): string[] {
       // Emit remaining '}' for all open indents
     }

     private countLeadingSpaces(line: string): number {
       let count = 0;
       for (const char of line) {
         if (char === ' ') count++;
         else if (char === '\t') throw new Error(`Tab detected`);
         else break;
       }
       return count;
     }
   }
   ```

3. **Error handling:**
   - Tab detection: `throw new IndentationError("Tabs not allowed. Use 2 spaces for indentation.", lineNum)`
   - Inconsistent spacing: `throw new IndentationError("Expected multiple of 2 spaces, found ${indent}.", lineNum)`
   - Invalid dedent: `throw new IndentationError("Invalid dedent to level ${indent}. Expected ${expected}.", lineNum)`
   - First line indented: `throw new IndentationError("First line cannot be indented.", 1)`
   - Custom `IndentationError` class with line number

4. **Unit tests** (`tests/indentation-scanner.test.ts`):
   - All 15+ test fixtures from 4a-continued-1
   - Verify transformed output has correct `{}`
   - Verify error cases throw with correct messages
   - Verify line numbers in error messages
   - **20+ test cases total**

**Deliverables:**
- `src/indentation-scanner.ts` (~200-300 lines)
- `src/errors/indentation-error.ts` (custom error class)
- `tests/indentation-scanner.test.ts` (20+ tests)
- All tests passing ✅

**Success Criteria:**
- ✅ Preprocessor transforms indentation to explicit blocks correctly
- ✅ All error cases caught with helpful messages
- ✅ All 20+ unit tests passing
- ✅ Code follows project style (TypeScript strict mode)

---

### Session 4a-continued-3: Provenance Preservation (2-3 hours)

**Goal:** Accurate line number mapping after transformation

**Tasks:**

1. **Create line mapping system:**
   - Track original line → transformed line mapping
   - Account for inserted `{` `}` lines
   - Preserve original line numbers in provenance
   - Handle multiple insertions per original line

2. **Update `IndentationScanner`:**
   - Return type: `{ transformed: string; lineMap: Map<number, number> }`
   - `lineMap`: maps transformed line number → original line number
   - Track all synthetic lines (inserted `{` `}`)
   - Example:
     ```
     Original:           Transformed:        LineMap:
     1: A                1: A                1→1
     2:   B              2: {                2→2 (synthetic)
                         3:   B              3→2
                         4: }                4→2 (synthetic)
     ```

3. **Update `Parser` class:**
   - Accept optional `lineMap` parameter
   - Method signature: `parse(input: string, lineMap?: Map<number, number>): IR`
   - When creating provenance, check lineMap:
     ```typescript
     const originalLineNum = lineMap?.get(currentLine) ?? currentLine;
     provenance: {
       source_file: this.sourceFile,
       line_number: originalLineNum,  // Use original, not transformed
       timestamp: new Date().toISOString()
     }
     ```

4. **Integration point:**
   - Update parser entry point to use preprocessor:
     ```typescript
     parse(input: string): IR {
       // 1. Run IndentationScanner
       const scanner = new IndentationScanner();
       const { transformed, lineMap } = scanner.process(input);

       // 2. Parse transformed text
       const ir = this.parseWithGrammar(transformed, lineMap);

       return ir;
     }
     ```

5. **Verification tests** (`tests/provenance-mapping.test.ts`):
   - Parse indented FlowScript
   - Check IR provenance line numbers
   - Confirm they match ORIGINAL source, not transformed
   - Example:
     ```typescript
     const input = `A\n  B\n  C`;
     const ir = parser.parse(input);

     // B and C should have line 2 and 3, NOT transformed line numbers
     expect(ir.nodes.find(n => n.content === 'B').provenance.line_number).toBe(2);
     expect(ir.nodes.find(n => n.content === 'C').provenance.line_number).toBe(3);
     ```
   - **10+ test cases**

**Deliverables:**
- Updated `src/indentation-scanner.ts` (line mapping)
- Updated `src/parser.ts` (accepts lineMap, uses for provenance)
- `tests/provenance-mapping.test.ts` (10+ tests)
- All provenance accurate ✅

**Success Criteria:**
- ✅ Line numbers in IR provenance match ORIGINAL source
- ✅ Synthetic lines don't create provenance errors
- ✅ All 10+ provenance tests passing
- ✅ Error messages reference original line numbers

---

### Session 4a-continued-4: Parser Integration (2-3 hours)

**Goal:** Integrated system with all tests passing

**Tasks:**

1. **Integrate preprocessor into `Parser.parse()`:**
   - Update parse method to use IndentationScanner
   - Make preprocessing ALWAYS run (not optional)
   - Ensure backward compatibility with explicit `{}` syntax
   - Code:
     ```typescript
     parse(input: string): IR {
       // 1. Preprocess indentation
       const scanner = new IndentationScanner({ indentSize: 2 });
       const { transformed, lineMap } = scanner.process(input);

       // 2. Parse transformed text with existing grammar
       const matchResult = this.grammar.match(transformed);
       if (matchResult.failed()) {
         throw new ParseError(matchResult.message);
       }

       // 3. Generate IR with correct provenance
       const ir = this.semantics(matchResult).eval(lineMap);

       return ir;
     }
     ```

2. **Backward compatibility verification:**
   - Run ALL 83 existing tests
   - Tests use explicit `{}` blocks and inline `A -> B` syntax
   - All MUST pass unchanged
   - If any fail, investigate and fix WITHOUT changing test expectations

3. **New indentation tests** (`tests/indentation-integration.test.ts`):
   - Question with alternatives + indented implications (spec pattern)
   - Deep nesting (5 levels)
   - Mixed explicit blocks + indentation
   - All relationship operators working with indentation:
     - `->` (causal)
     - `<-` (reverse causal)
     - `<->` (bidirectional)
     - `=>` (temporal)
     - `><[axis]` (tension)
   - Alternative marker `||` with indented children
   - State markers with indentation
   - Modifiers with indentation
   - **15+ new test cases**

4. **Linter integration:**
   - Verify linter works with indented syntax
   - E004 (orphaned nodes) should NOT fire for indented relationships
   - Relationships correctly detected in indented code
   - No false positives

5. **CLI testing:**
   - `./bin/flowscript parse examples/decision.fs` (indented syntax)
   - `./bin/flowscript lint examples/decision.fs` (should pass clean)
   - `./bin/flowscript validate examples/decision.json`
   - Error messages reference correct original line numbers
   - Manual testing with various indented inputs

**Deliverables:**
- Updated `src/parser.ts` (integrated preprocessor)
- `tests/indentation-integration.test.ts` (15+ tests)
- **ALL 98+ tests passing** (83 existing + 15+ new)
- Linter works correctly with indentation
- CLI commands work with indented files

**Success Criteria:**
- ✅ All 83 existing tests pass (ZERO regressions)
- ✅ All 15+ new indentation tests pass
- ✅ Total: 98+ tests at 100% pass rate
- ✅ Linter correctly handles indented syntax
- ✅ CLI tools work end-to-end
- ✅ Error messages accurate and helpful

---

### Session 4a-continued-5: Golden Example - decision.fs (1-2 hours)

**Goal:** First canonical example working perfectly

**Tasks:**

1. **Create `examples/decision.fs`:**
   - Use spec syntax (indentation-based, NO explicit `{}`)
   - Authentication strategy example from spec
   - Structure:
     - Question: `? authentication strategy for v1 launch`
     - Alternative 1: `|| JWT tokens` with indented implications
     - Alternative 2: `|| session tokens + Redis` with indented implications
     - Tensions: `><[security vs simplicity]` and `><[scaling vs security]`
     - Decision: `* [decided(...)] session tokens + Redis`
     - Actions: indented under decision
   - ~25-30 lines total
   - Follows spec/golden_examples_spec.md Pattern 1 exactly

2. **Generate IR:**
   - Run: `./bin/flowscript parse examples/decision.fs -o examples/decision.json`
   - Verify parse completes successfully
   - Check file generated

3. **Verify IR structure:**
   - **CRITICAL**: `"relationships": []` must NOT be empty!
   - All nodes present:
     - 1 question node
     - 2 alternative nodes
     - ~10 statement nodes (implications)
     - 2 action nodes
   - Relationships created:
     - 2 alternative relationships (question → alternatives)
     - ~8 causes relationships (alternatives → implications, implications → sub-implications)
     - 2 tension relationships (with axis labels)
   - States correct:
     - 1 decided state attached to decision node
   - Provenance accurate:
     - All line numbers match original source
     - Timestamps present

4. **Linting:**
   - Run: `./bin/flowscript lint examples/decision.fs`
   - **Expected:** Clean pass (no errors, no warnings)
   - E004 (orphaned nodes) should NOT fire
   - E001 (unlabeled tensions) should NOT fire (axes are labeled)
   - E006 (alternatives without decision) should NOT fire (decision present)

5. **Validation:**
   - Run: `./bin/flowscript validate examples/decision.json`
   - Should pass schema validation
   - All required fields present
   - No schema violations

6. **Create `examples/decision-README.md`** (~150-200 lines):

   **Structure:**
   - **Title:** Pattern 1: Decision Under Tension with Alternatives
   - **Purpose:** Architectural decision-making with explicit tradeoffs
   - **When to use:**
     - RFC decisions
     - Architecture choices
     - Design discussions
     - Any decision with multiple options and tradeoffs

   - **Key FlowScript features demonstrated:**
     - `?` Question marker (decision point)
     - `||` Alternative marker (mutually exclusive options)
     - `><[axis]` Tension marker with labeled axis
     - `[decided(rationale, on)]` State marker with required fields
     - `->` Causal relationships (implications)
     - Indentation-based hierarchy
     - `action:` Command marker

   - **FlowScript breakdown:** (explain each section)
     ```flowscript
     ? authentication strategy for v1 launch    ← Decision point
       || JWT tokens                            ← Alternative 1
          -> stateless architecture             ← Implication (indented)
             -> scales horizontally             ← Sub-implication
     ```

   - **Query examples with sample outputs:**

     **1. `alternatives(question_id)` - Find decision options:**
     ```javascript
     alternatives("sha256:a1b2c3...")
     // Returns:
     {
       options: [
         {id: "sha256:...", content: "JWT tokens"},
         {id: "sha256:...", content: "session tokens + Redis"}
       ],
       chosen: {id: "sha256:...", content: "session tokens + Redis"}
     }
     ```

     **2. `why(decision_id)` - Trace decision rationale:**
     ```javascript
     why("sha256:n4o5p6...")
     // Returns:
     {
       rationale: "security > scaling complexity for v1",
       supporting_evidence: [
         {id: "sha256:...", content: "instant revocation capability"},
         {id: "sha256:...", content: "battle-tested approach"}
       ],
       tradeoffs: [
         {axis: "security vs simplicity", ...},
         {axis: "scaling vs security", ...}
       ]
     }
     ```

     **3. `tensions()` - Find all tradeoffs:**
     ```javascript
     tensions()
     // Returns:
     [
       {
         axis: "security vs simplicity",
         nodes: [
           {content: "revocation difficult"},
           {content: "implementation complexity"}
         ]
       },
       {
         axis: "scaling vs security",
         nodes: [
           {content: "server-side state required"},
           {content: "operational complexity"}
         ]
       }
     ]
     ```

   - **Teaching value:**
     - Shows best practice for capturing "why we chose X over Y"
     - Demonstrates how to make tradeoffs explicit
     - Illustrates action items flowing from decisions
     - Proves that FlowScript preserves reasoning structure

   - **IR structure notes:**
     - How alternatives create relationship edges
     - How indentation creates causes edges
     - How tensions preserve tradeoff dimensions
     - How decisions connect to alternatives

7. **Validation against spec:**
   - Compare generated JSON to spec/golden_examples_spec.md Pattern 1
   - Verify node types match
   - Verify relationship types match
   - Confirm all semantic richness preserved
   - Document any differences (should be none)

**Deliverables:**
- `examples/decision.fs` (~25-30 lines, canonical syntax)
- `examples/decision.json` (generated, relationships NOT empty!)
- `examples/decision-README.md` (~150-200 lines, comprehensive)

**Success Criteria:**
- ✅ decision.fs uses indentation (no explicit `{}`)
- ✅ Parses successfully with NO errors
- ✅ JSON has relationships array with ~10+ entries (NOT empty!)
- ✅ Lints clean (0 errors, 0 warnings)
- ✅ Validates against ir.schema.json
- ✅ README comprehensive and teachable
- ✅ All provenance line numbers correct
- ✅ Matches spec Pattern 1 structure

---

### Session 4a-continued-6: Remaining Golden Examples (3-4 hours)

**Goal:** Complete all 4 patterns + index README

**Tasks:**

**Pattern 2: debug.fs** (45-60 min)

1. **Create `examples/debug.fs`:**
   - API timeout incident with reverse causation
   - Use `<-` (reverse causal) to trace backward from symptom to root cause
   - Features:
     - `!` urgent modifier
     - `<-` reverse causal chains (effect ← cause ← deeper cause)
     - `[blocked(reason, since)]` state with required fields
     - `++` strong positive modifier
     - `action:` markers
     - `thought:` insights
   - Structure:
     ```flowscript
     ! timeout errors in production API (500ms+ response times)
       <- database connection pool exhausted (max 20 connections)
         <- connection.release() missing in error handlers
           <- copy-paste bug from legacy user_controller.js
             <- no connection pooling tests in CI
     ```
   - ~30-35 lines total

2. **Generate and verify:**
   - Parse: `./bin/flowscript parse examples/debug.fs -o examples/debug.json`
   - Verify relationships include reverse causal edges
   - Lint: should pass clean
   - Validate: should pass schema

3. **Create `examples/debug-README.md`** (~125-150 lines):
   - **Purpose:** Root cause analysis and incident triage
   - **When to use:** Production incidents, debugging, post-mortems
   - **Key features:** Reverse causation, urgent marker, blocked state
   - **Query examples:** `why()` (backward trace), `blocked()`, `what_if()`
   - **Teaching value:** Documenting investigative process with timestamps

**Pattern 3: research.fs** (60-75 min) *MOST COMPLEX STRUCTURE*

1. **Create `examples/research.fs`:**
   - Quantum computing research with deep hierarchical nesting
   - Features:
     - 5-level deep nesting (will trigger W002 warning - EXPECTED)
     - Multiple tension operators at different levels
     - `~` low confidence modifier (exploratory)
     - `thought:` insights at multiple levels
   - Structure:
     ```flowscript
     ? evaluate quantum computing for cryptography workloads
       || gate-based quantum computers (IBM, Google)
          -> requires cryogenic cooling
             -> infrastructure cost $10M+ ><[capability vs cost] budget constraints
                -> limits to research institutions only
                   -> not viable for commercial deployment (5+ year timeline)
     ```
   - ~35-40 lines total
   - Deepest nesting in all examples

2. **Generate and verify:**
   - Parse: `./bin/flowscript parse examples/research.fs -o examples/research.json`
   - Lint: **EXPECT W002 warning** (deep nesting >5 levels - this is OK!)
   - Should have 0 errors, 1 warning (W002)
   - Validate: should pass schema

3. **Create `examples/research-README.md`** (~175-200 lines):
   - **Purpose:** Complex domain exploration with deep hierarchical structure
   - **When to use:** Literature review, technology assessment, strategic planning
   - **Key features:** Deep nesting, multiple tensions, exploratory modifier
   - **Query examples:** `what_if()`, `tensions()`, `depth()`
   - **Teaching value:** Mapping complex domains with uncertainty
   - **Note about W002:** Explain why deep nesting is intentional here

**Pattern 4: design.fs** (60-75 min) *MOST COMPREHENSIVE*

1. **Create `examples/design.fs`:**
   - Caching strategy RFC with evolution and completion tracking
   - Features:
     - Multiple alternatives (3 options)
     - Temporal sequence `=>` (implementation timeline)
     - Completion marker `✓` (done states)
     - Multiple state markers ([decided], [blocked])
     - Most comprehensive example
   - Structure:
     ```flowscript
     ? caching strategy for read-heavy API endpoints
       || client-side caching (browser cache headers)
          -> reduces server load significantly
          -> stale data risk ><[performance vs freshness] user experience
       || Redis cache layer
          -> centralized cache invalidation
          -> additional infrastructure ><[cost vs control] operational complexity
       || CDN edge caching (CloudFront)
          -> geographic distribution (lower latency)
          -> expensive for cache misses ><[latency vs cost] budget constraints

       * [decided(rationale: "hybrid approach: CDN for static, Redis for dynamic", on: "2025-10-14")]

       Implementation timeline:
       => Phase 1: Redis layer
          action: provision Redis cluster
          ✓ action: implement cache middleware
       => Phase 2: CDN integration
          [blocked(reason: "waiting on CDN vendor approval", since: "2025-10-15")]
     ```
   - ~45-50 lines total
   - Longest and most feature-rich example

2. **Generate and verify:**
   - Parse: `./bin/flowscript parse examples/design.fs -o examples/design.json`
   - Verify all relationship types: alternative, causes, temporal, tension
   - Lint: should pass clean
   - Validate: should pass schema
   - Verify completion markers and multiple states

3. **Create `examples/design-README.md`** (~175-200 lines):
   - **Purpose:** Design RFC with evolution and completion tracking
   - **When to use:** RFCs, project planning, implementation tracking
   - **Key features:** Alternatives, temporal sequence, completion, multiple states
   - **Query examples:** `alternatives()`, `blocked()`, `completed()`, `timeline()`
   - **Teaching value:** Complete lifecycle from decision → implementation → validation

**Index README** (30 min)

4. **Create `examples/README.md`:**
   - **Overview section:**
     - What are golden examples?
     - Why they matter (validation targets, teaching materials, architecture proof)
     - How to use them (parse, lint, validate workflow)

   - **Quick reference table:**
     | Pattern | Use Case | Complexity | Features | Lines |
     |---------|----------|------------|----------|-------|
     | decision.fs | Architecture decisions, RFCs | Medium | alternatives, tensions, decision state | ~25-30 |
     | debug.fs | Incident triage, debugging | Medium | reverse causation, urgent, blocked | ~30-35 |
     | research.fs | Domain exploration, research | High | deep nesting (5 levels), exploratory | ~35-40 |
     | design.fs | Design RFCs, project planning | Very High | temporal, completion, multiple states | ~45-50 |

   - **Links to pattern READMEs:**
     - [Pattern 1: Decision Under Tension](decision-README.md)
     - [Pattern 2: Debug/Incident Triage](debug-README.md)
     - [Pattern 3: Research Exploration](research-README.md)
     - [Pattern 4: Design RFC](design-README.md)

   - **Workflow examples:**
     ```bash
     # Parse FlowScript to IR
     ./bin/flowscript parse examples/decision.fs -o examples/decision.json

     # Lint for semantic errors
     ./bin/flowscript lint examples/decision.fs

     # Validate IR against schema
     ./bin/flowscript validate examples/decision.json
     ```

   - **When to use which pattern:**
     - Need to document a decision? → decision.fs
     - Debugging an incident? → debug.fs
     - Exploring complex domain? → research.fs
     - Planning implementation? → design.fs

   - **Next steps:**
     - Phase 5: Documentation updates
     - Phase 6: Continuity demo (query operations)
     - Phase 7: Editor UI

**Final validation:**

5. **Comprehensive verification:**
   - All 4 .fs files exist and parse successfully
   - All 4 .json files have non-empty relationships arrays
   - All 4 lint results are clean (or expected warnings only)
   - All 4 validate successfully against ir.schema.json
   - All 4 READMEs are comprehensive (100-200 lines each)
   - Index README complete and links work
   - **13 files total:** 4 .fs + 4 .json + 5 READMEs

6. **Quality check:**
   - Are these canonical? (permanent reference quality)
   - Are they comprehensive? (teach best practices)
   - Are they teachable? (READMEs explain when/why/how)
   - Do queries demonstrate computational operations?
   - Do examples reference spec but stand alone?

**Deliverables:**
- `examples/debug.fs` + JSON + README
- `examples/research.fs` + JSON + README
- `examples/design.fs` + JSON + README
- `examples/README.md` (index with quick reference table)
- **13 files total**
- All examples canonical quality

**Success Criteria:**
- ✅ All 4 .fs files use indentation syntax (no explicit `{}`)
- ✅ All 4 .json files have relationships (NOT empty!)
- ✅ All 4 lint clean (or expected warnings documented)
- ✅ All 4 validate against schema
- ✅ All 5 READMEs comprehensive and teachable
- ✅ Examples demonstrate core FlowScript value proposition
- ✅ Canonical quality (permanent reference materials)

---

## Completion Criteria (Entire 4a-continued Series)

**Session 4a-continued series is COMPLETE when:**

### Technical Completeness
- ✅ Indentation works everywhere (not just alternatives)
- ✅ All relationship operators work with indentation (`->`, `<-`, `<->`, `=>`, `><[axis]`)
- ✅ Preprocessor correctly handles all edge cases
- ✅ Provenance line numbers accurate (original source, not transformed)
- ✅ All 98+ tests passing (83 existing + 15+ new indentation tests)
- ✅ **ZERO regressions** (existing tests unchanged and passing)

### Quality Assurance
- ✅ Error messages helpful and accurate (reference original line numbers)
- ✅ Tabs cause clear error (not silent conversion)
- ✅ Inconsistent indentation caught and reported
- ✅ Linter works correctly with indented syntax (no false orphaned node errors)
- ✅ CLI tools work end-to-end (parse, lint, validate)

### Golden Examples Delivered
- ✅ All 4 .fs files created with spec syntax (indentation-based)
- ✅ All 4 .json files generated with correct relationships (NOT empty!)
- ✅ All 4 pattern READMEs comprehensive (100-200 lines each)
- ✅ Index README complete with quick reference table
- ✅ **13 files total delivered**
- ✅ Examples demonstrate core FlowScript value
- ✅ Examples are canonical quality (permanent reference materials)

### Spec Alignment
- ✅ Spec examples work as written (no modifications needed)
- ✅ Implementation matches specification exactly
- ✅ No spec-implementation gaps remaining
- ✅ Indentation specification documented (`/spec/indentation.md`)

### Documentation Complete
- ✅ `/spec/indentation.md` created (complete specification)
- ✅ `decisions.md` updated (Decision 8: Indentation Support)
- ✅ Test fixtures documented
- ✅ All code commented and clear
- ✅ README files comprehensive

### Git Hygiene
- ✅ Commits after each subsession
- ✅ Descriptive commit messages
- ✅ All changes pushed to GitHub
- ✅ No uncommitted work
- ✅ Clean working tree

---

## Success Metrics

### Quantitative
- **Tests:** 98+ passing (100% pass rate, 0 regressions)
- **Coverage:** 100% maintained (all new code tested)
- **Files:** 13 delivered (4 .fs + 4 .json + 5 READMEs)
- **Spec alignment:** 100% (all spec examples work)
- **Relationships:** 4/4 examples have non-empty relationships arrays

### Qualitative
- **Code quality:** TypeScript strict mode, well-commented, clear
- **Error messages:** Helpful, accurate, reference correct line numbers
- **Documentation:** Comprehensive, teachable, canonical quality
- **Architecture:** Clean separation (preprocessor isolated), maintainable
- **User experience:** Indentation "just works" like Python

---

## Risk Mitigation

### Known Risks

**1. Preprocessor complexity**
- **Risk:** Algorithm bugs, edge cases missed
- **Mitigation:**
  - Stack algorithm proven (Python, Haskell use this)
  - Extensive test fixtures (15+ cases)
  - Unit tests before integration (20+ tests)
  - Incremental development (test each piece)

**2. Provenance accuracy**
- **Risk:** Line numbers incorrect after transformation
- **Mitigation:**
  - Dedicated session for line mapping (4a-continued-3)
  - Verification tests (10+ cases)
  - Manual testing with examples
  - Check provenance in generated JSON

**3. Breaking existing tests**
- **Risk:** Grammar changes or preprocessing breaks 83 existing tests
- **Mitigation:**
  - Run test suite after each change
  - Backward compatibility priority (explicit `{}` must still work)
  - No grammar changes needed (preprocessing only)
  - Incremental integration (test at each step)

**4. Time overrun**
- **Risk:** Sessions take longer than estimated
- **Mitigation:**
  - NO time constraints (quality > speed)
  - Can extend sessions as needed
  - User protocol: "take what it takes"
  - Realistic estimates (13-19 hours total)

**5. Spec-implementation drift**
- **Risk:** Implementation doesn't match spec after changes
- **Mitigation:**
  - Spec is canonical (implementation must match)
  - Validation against spec in 4a-continued-5
  - Compare generated JSON to spec examples
  - Test with spec syntax throughout

### Rollback Plan

**If catastrophic issue:**
- Git commits after each subsession (safe rollback points)
- Can revert to previous subsession if needed
- **But commitment: fix forward, not rollback**

**If stuck on subsession:**
- Document blocker in next_steps.md
- Research solutions
- Ask user for guidance if needed
- NO moving on until resolved

---

## Timeline Estimates

### Conservative Estimates
- **4a-continued-1:** 2-3 hours (specification, test fixtures, decisions.md)
- **4a-continued-2:** 3-4 hours (preprocessor core, unit tests)
- **4a-continued-3:** 2-3 hours (provenance mapping, verification)
- **4a-continued-4:** 2-3 hours (integration, all tests passing)
- **4a-continued-5:** 1-2 hours (decision.fs example)
- **4a-continued-6:** 3-4 hours (remaining 3 examples + index)

**Total: 13-19 hours**

### Reality Check
- Phase 3 ran 1.5x estimate (15.5h vs 8-10h)
- Apply same factor: 13-19h × 1.5 = 19.5-28.5h realistic
- But: indentation is isolated change, less risk than Phase 3 parser rewrite
- Estimate confidence: Medium-high (stack algorithm well-understood)

### No Time Constraints
- User protocol: "take what it takes"
- Quality and correctness paramount
- Speed secondary
- Better to take 30 hours and get it perfect than rush and break things

---

## Next Steps

**To begin Session 4a-continued-1:**

1. Clear this conversation
2. Start fresh conversation
3. Load memory: `[!read-memory]`
4. Begin: "Begin Session 4a-continued-1: Indentation Specification"
5. Read this plan: `project_memory/PHASE_4_SESSION_4A_INDENTATION_PLAN.md`
6. Execute tasks from this specification
7. Update next_steps.md as work progresses
8. Commit when session complete
9. Update memory for next session

**Files to read in next conversation:**
- `project_memory/projectbrief.md` (project context)
- `project_memory/next_steps.md` (current session details)
- `project_memory/PHASE_4_SESSION_4A_INDENTATION_PLAN.md` (THIS FILE - technical spec)
- `spec/golden_examples_spec.md` (reference for examples)
- `spec/grammar.md` (understand current parser)

**User's directive:**
> "It doesn't matter what it takes to fix this -> it must be 100% fixed and we cannot and will not move on until it is done"

**Commitment:** Fix indentation support everywhere, take as long as needed, deliver golden examples at canonical quality.

---

**Plan Status:** READY TO EXECUTE
**Next Session:** 4a-continued-1 (Indentation Specification)
**Estimated Completion:** 6 subsessions, 13-19 hours (realistic: 20-30h)
**Quality Bar:** 100% correct, spec-aligned, zero regressions, canonical examples

---

*This plan created: 2025-10-20 during Session 4a analysis*
*Last updated: 2025-10-20*
*Lines: ~1100 (comprehensive technical specification)*
