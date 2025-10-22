# FlowScript Golden Examples

**Purpose:** Canonical reference implementations demonstrating FlowScript → IR compilation
**Use:** Validation targets for parser/linter + teaching materials for users
**Status:** Complete - 4 patterns with full IR validation

---

## Overview

This directory contains four **golden examples** that demonstrate FlowScript's core capabilities. Each example is:

1. **A validation target** - Parser and linter implementations must handle these correctly
2. **A teaching tool** - Shows best practices for different cognitive partnership scenarios
3. **A proof of architecture** - Demonstrates that FlowScript → IR compilation preserves semantic richness for computational queries

Each example includes:
- **`.fs` file** - FlowScript source using indentation syntax
- **`.json` file** - Compiled Intermediate Representation (IR)
- **`-README.md` file** - Comprehensive pattern guide (~150-200 lines)

**Total: 13 files** providing complete golden example suite for FlowScript v1.0.

---

## Quick Reference Table

| Pattern | Use Case | Lines | Complexity | Key Features | When to Use |
|---------|----------|-------|------------|--------------|-------------|
| **Decision** | Architecture choices | ~25-30 | Medium | `?`, `||`, `><[axis]`, `[decided]` | RFC decisions, tech selection |
| **Debug** | Root cause analysis | ~30-35 | Medium | `<-`, `!`, `[blocked]`, `++` | Incident response, debugging |
| **Research** | Domain exploration | ~35-40 | High | Deep nesting, `~`, multiple tensions | Literature review, assessment |
| **Design** | RFC lifecycle | ~40-45 | High | `=>`, `✓`, state evolution | Project planning, tracking |

---

## Pattern 1: Decision (Architecture Choices)

**File:** [decision.fs](decision.fs) | **Guide:** [decision-README.md](decision-README.md)

**Purpose:** Architectural decision-making with explicit tradeoffs

**Use when:**
- Making RFC decisions with multiple valid options
- Evaluating alternatives with competing constraints
- Documenting "why we chose X over Y"
- Technology selection requiring rationale

**Key features:**
- `?` question marker frames decision space
- `||` alternative marker for each option
- `><[axis]` tension marker (forced axis labeling)
- `[decided(rationale: "...", on: "...")]` state (forcing function)
- `action:` items make decisions actionable

**Example query:** `alternatives()` finds all options, `why()` traces rationale

---

## Pattern 2: Debug (Root Cause Analysis)

**File:** [debug.fs](debug.fs) | **Guide:** [debug-README.md](debug-README.md)

**Purpose:** Incident triage and root cause analysis with backward tracing

**Use when:**
- Debugging production issues
- Post-mortem documentation
- Tracing errors back to root cause
- Documenting investigative process

**Key features:**
- `<-` reverse causation (effect ← cause)
- `!` urgent modifier marks critical issues
- `[blocked(reason: "...", since: "...")]` documents blockers
- `++` strong positive modifier for high-priority actions
- Thought nodes capture insights during investigation

**Example query:** `why()` traces backward through causal chain, `blocked()` finds blockers

---

## Pattern 3: Research (Knowledge Mapping)

**File:** [research.fs](research.fs) | **Guide:** [research-README.md](research-README.md)

**Purpose:** Complex domain exploration with hierarchical branching

**Use when:**
- Conducting literature reviews
- Assessing new technologies
- Mapping complex technical domains
- Documenting evolving understanding

**Key features:**
- **Deep hierarchical nesting** (4-5 levels) shows dependencies
- Multiple tension axes across domains
- `~` exploratory modifier marks speculation
- Branching structure (multiple paths from single node)
- Thought nodes synthesize findings

**Example query:** `tensions()` maps tradeoff landscape, `what_if()` explores consequences

---

## Pattern 4: Design (RFC Lifecycle)

**File:** [design.fs](design.fs) | **Guide:** [design-README.md](design-README.md)

**Purpose:** Complete RFC lifecycle from decision through deployment

**Use when:**
- Writing RFCs with implementation tracking
- Project planning across multiple phases
- Documenting progress over time
- Tracking blockers and completions

**Key features:**
- Multiple alternatives (can include hybrid approaches)
- `[decided]` state documents choice with rationale
- `✓` completion markers track finished tasks
- `[completed(on: "...")]` state with dates
- `[blocked(reason: "...", since: "...")]` documents blockers
- `=>` temporal operators (distinct from `->` causal)
- Evolution over time with state changes

**Example query:** `timeline()` reconstructs project timeline, `blocked()` finds blockers, `completed()` shows progress

---

## Learning Path

### For New Users

**Start here:** Pattern 1 (Decision)
- Simplest structure to learn
- Immediate practical value
- Introduces core concepts

**Next:** Pattern 2 (Debug)
- Adds reverse causation (`<-`)
- Shows state tracking in practice
- Demonstrates modifiers

**Advanced:** Pattern 3 (Research)
- Deep hierarchical structures
- Multiple competing constraints
- Exploratory thinking marker

**Expert:** Pattern 4 (Design)
- Combines all previous concepts
- Adds temporal dimension
- Shows complete lifecycle tracking

### For Tool Developers

**Use all 4 as regression test suite:**
- Parser must compile all correctly
- Linter must catch violations (or expected warnings)
- Queries must return correct results
- IR JSON must validate against schema

---

## Workflow Examples

### Parse FlowScript to IR

```bash
# Parse any example
./bin/flowscript parse examples/decision.fs -o examples/decision.json
./bin/flowscript parse examples/debug.fs -o examples/debug.json
./bin/flowscript parse examples/research.fs -o examples/research.json
./bin/flowscript parse examples/design.fs -o examples/design.json
```

### Lint for Semantic Errors

```bash
# Lint examples
./bin/flowscript lint examples/decision.fs
# Expected: ✓ No issues found

./bin/flowscript lint examples/debug.fs
# Expected: ✓ No issues found

./bin/flowscript lint examples/research.fs
# Expected: ✓ No issues found (4-5 levels, no W002 warning)

./bin/flowscript lint examples/design.fs
# Expected: ✓ No issues found
```

### Validate IR Structure

```bash
# Validate compiled IR
./bin/flowscript validate examples/decision.json
./bin/flowscript validate examples/debug.json
./bin/flowscript validate examples/research.json
./bin/flowscript validate examples/design.json
# All should pass ✓
```

---

## Pattern Selection Guide

**"Which pattern should I use?"**

```
Do you need to make a decision?
  └─ Yes, evaluating options
     └─ Implementation tracking needed?
        ├─ Yes → Pattern 4 (Design RFC)
        └─ No → Pattern 1 (Decision)

  └─ No, analyzing existing system
     └─ Is it broken/buggy?
        ├─ Yes, need root cause → Pattern 2 (Debug)
        └─ No, exploring domain → Pattern 3 (Research)
```

**Common scenarios:**

- **"Should we use Redis or Memcached?"** → Decision pattern
- **"Why is production timing out?"** → Debug pattern
- **"Is quantum computing a threat to our cryptography?"** → Research pattern
- **"Track our caching implementation from decision to deployment"** → Design pattern

---

## Common Features Across All Patterns

### 1. Indentation Syntax
All examples use Python-style indentation (2 spaces per level):
- `->` indented child = causal relationship with implicit block
- No explicit `{}` brackets needed
- Preprocessor transforms to explicit blocks for parser

### 2. Provenance Tracking
Every node includes:
- `source_file` - Which .fs file it came from
- `line_number` - Original source line (before preprocessing)
- `timestamp` - When it was parsed

Enables "show me the source" queries.

### 3. Children Arrays
Hierarchical structure preserved:
- Questions have children (alternatives)
- Alternatives have children (implications)
- Thoughts have children (consequences)
- Enables tree traversal and depth queries

### 4. Relationship Types
Five types of relationships:
- `alternative` - from `||` markers under questions
- `causes` - from `->` forward causation
- `derives_from` - from `<-` reverse causation
- `tension` - from `><[axis]` tradeoff markers
- `temporal` - from `=>` time-based sequence

### 5. State Markers
Three state types (stored in top-level `states` array):
- `decided` - choices made with rationale and date
- `blocked` - progress stopped with reason and since date
- `completed` - tasks finished with date

### 6. Forcing Functions
Linter enforces completeness:
- Tension markers MUST have axis labels (E001 error if missing)
- State markers MUST have required fields (E002 error if missing)
- Alternatives MUST have decision or parking (E006 error)

Can't hide behind vague articulations - structure forces clarity.

---

## Query Operations (Phase 6 Preview)

These examples are designed to enable computational queries. Future phases will implement:

**Decision queries:**
- `alternatives(question_id)` - Find all options considered
- `why(decision_id)` - Trace decision rationale
- `tensions()` - Map all tradeoffs

**Debug queries:**
- `why(error_id)` - Backward trace to root cause
- `what_if(fix_id)` - Forward trace impact of fix
- `blocked()` - Find current blockers

**Research queries:**
- `depth(node_id)` - Measure complexity
- `branches(node_id)` - Find alternative approaches
- `tensions()` - Map competing constraints

**Design queries:**
- `timeline(root_id)` - Reconstruct temporal sequence
- `completed(since)` - Track progress
- `blocked(since)` - Find blockers

**See Phase 6 (Continuity Demo) for query implementations.**

---

## Files in This Directory

```
examples/
├── README.md                    # This file - navigation guide
├── decision.fs                  # Pattern 1 source (FlowScript)
├── decision.json                # Pattern 1 IR (compiled)
├── decision-README.md           # Pattern 1 guide (~200 lines)
├── debug.fs                     # Pattern 2 source
├── debug.json                   # Pattern 2 IR
├── debug-README.md              # Pattern 2 guide (~150 lines)
├── research.fs                  # Pattern 3 source
├── research.json                # Pattern 3 IR
├── research-README.md           # Pattern 3 guide (~200 lines)
├── design.fs                    # Pattern 4 source
├── design.json                  # Pattern 4 IR
└── design-README.md             # Pattern 4 guide (~200 lines)
```

**13 files total** - Complete golden example suite.

---

## Next Steps

### For Users

1. **Start with decision.fs** - Simplest pattern, immediate value
2. **Read the pattern READMEs** - Comprehensive guides with examples
3. **Try parsing** - Use CLI to compile your own FlowScript
4. **Explore IR structure** - See how FlowScript compiles to JSON
5. **Create your own** - Adapt patterns to your use cases

### For Developers

1. **Study all 4 patterns** - Understand full feature set
2. **Validate parser** - All examples must parse correctly
3. **Test linter** - Must catch violations, pass valid examples
4. **Implement queries** - Use IR to build computational operations
5. **Add test coverage** - Use patterns as regression tests

### Documentation References

- **Spec folder** (`/spec/`) - Formal FlowScript specifications
  - `semantics.md` - Complete marker definitions
  - `grammar.md` - EBNF grammar
  - `ir.schema.json` - JSON schema for IR
  - `linter-rules.md` - Complete linter rule definitions
  - `golden_examples_spec.md` - Detailed pattern specifications

- **Toolchain** (`TOOLCHAIN.md`) - CLI usage guide
  - Parse command
  - Lint command
  - Validate command

---

## For Tool Developers: Validation Checklist

**Parser requirements** (all must pass):
- ✅ Parse all 4 .fs files without errors
- ✅ Generate relationships arrays (NOT empty)
- ✅ Extract states into top-level states array
- ✅ Populate children arrays for hierarchical nodes
- ✅ Preserve provenance (source file, line numbers, timestamps)
- ✅ Handle all relationship types (alternative, causes, derives_from, tension, temporal)
- ✅ Extract modifiers (urgent, exploratory, locked, etc.)

**Linter requirements** (all must pass):
- ✅ decision.fs: 0 errors, 0 warnings
- ✅ debug.fs: 0 errors, 0 warnings
- ✅ research.fs: 0 errors, 0 warnings
- ✅ design.fs: 0 errors, 0 warnings
- ✅ Enforce E001 (tension axis required)
- ✅ Enforce E006 (alternatives need decision)
- ✅ Detect E004 (orphaned nodes) - with exemptions for actions/completions

**IR validation** (all must pass):
- ✅ All .json files validate against ir.schema.json
- ✅ Content-hash IDs consistent
- ✅ Provenance preserved
- ✅ Relationships bidirectional (source → target)
- ✅ States array populated with required fields

---

## Philosophy

These golden examples embody FlowScript's core mission:

**Not just notation** - Computable substrate for memory
**Not just documentation** - Queryable knowledge graphs
**Not just syntax** - Forcing functions for cognitive clarity

Each pattern demonstrates:
- Structure → clarity (can't hide in vague prose)
- Compilation → computation (queries on semantic graphs)
- Forcing functions → completeness (required fields force thinking)

**The goal:** Enable AI partners to understand context deeply, not just read text linearly.

---

**Last Updated:** 2025-10-22
**Session:** 4a-continued-5g
**Phase:** 4 (Golden Examples) COMPLETE
**Status:** All 4 patterns validated - parser 100% functional, linter spec-aligned, 130/130 tests passing

**Ready for Phase 5:** Documentation updates using these canonical examples.
