# Session 4a-continued-5c: Fix Parser Children Arrays Gap

**Date:** 2025-10-20
**Status:** READY TO START
**Goal:** Implement spec-compliant hierarchical children arrays in parser IR output
**Estimated Time:** 2-4 hours

---

## Context: Why This Session Exists

### What Happened in Session 4a-continued-5b

**Surface issue:** E004 linter error on decision.fs line 15
**Root cause discovered:** Parser doesn't create children arrays per spec

**What I did wrong:**
1. Found the fundamental gap (parser missing children arrays)
2. Worked around it (added linter exemption for nodes with states)
3. Declared session "COMPLETE" and tried to move on
4. Rationalized as "tracked separately, not blocking"

**This was bullshit.** Classic "optimize for task completion" behavior.

**The symptom:** E004 linter error
**The disease:** Parser doesn't implement spec-compliant IR structure
**What I did:** Fixed symptom, hid disease, declared victory
**What I should do:** Fix the disease (this session)

---

## The Gap: Spec vs Implementation

### What the Spec Requires

From `spec/golden_examples_spec.md` lines 52-81:

```json
{
  "nodes": [
    {
      "id": "sha256:a1b2c3...",
      "type": "question",
      "content": "authentication strategy for v1 launch",
      "provenance": {...},
      "children": [
        {"$ref": "#/nodes/jwt_option"},
        {"$ref": "#/nodes/session_option"},
        {"$ref": "#/nodes/decision"}
      ]
    },
    {
      "id": "sha256:d4e5f6...",
      "type": "thought",
      "content": "JWT tokens",
      "provenance": {...},
      "children": [
        {"$ref": "#/nodes/jwt_stateless"},
        {"$ref": "#/nodes/jwt_revocation"}
      ]
    }
  ]
}
```

**Key feature:** Nodes have `children` arrays containing `{"$ref": "#/nodes/label"}` references.

### What Our Parser Currently Outputs

```json
{
  "nodes": [
    {
      "id": "9b20cbf148eeff39...",
      "type": "question",
      "content": "authentication strategy for v1 launch",
      "provenance": {...}
      // NO children property at all!
    }
  ]
}
```

**Verification:**
```bash
cat examples/decision.json | jq '[.nodes[] | select(.children)] | length'
# Output: 0
```

**Zero nodes have children arrays.**

### Schema Definition

From `spec/ir.schema.json` lines 127-133:

```json
"children": {
  "type": "array",
  "items": {
    "$ref": "#/definitions/contentHash"
  },
  "description": "IDs of child nodes (nested content). Enables hierarchical structure."
}
```

**Schema says:** `children` is array of content hashes (IDs), not full node objects.

### TypeScript Type Definition

From `src/types.ts` lines 92-99:

```typescript
export interface Node {
  id: string;  // content-hash (SHA-256)
  type: NodeType;
  content: string;
  provenance: Provenance;
  children?: Node[];  // ❌ WRONG! Should be string[] per schema
  ext?: Record<string, unknown>;
}
```

**Type mismatch:** TypeScript says `Node[]`, schema says `string[]` (IDs).

---

## Current Parser Architecture

### How It Works Now

**Parser creates:**
1. **Flat list of nodes** (no hierarchical structure)
2. **Relationship edges** for operators (`->`, `<-`, `=>`, `><[axis]`)
3. **Block nodes** with `ext.children` containing full child nodes

**Example from block parsing (`src/parser.ts` lines 650-656):**

```typescript
const blockNode: Node = {
  id: hashContent({ type: 'block', children: directChildren.map(c => c.id), modifiers: blockModifiers }),
  type: 'block',
  content: '',
  provenance: self.getProvenance(this)
  // ext.children populated separately with full Node objects
};
```

**Note:** Blocks use `ext.children` (full nodes), not `children` (IDs).

### What's Missing

1. ❌ Parser never populates `children` arrays on nodes
2. ❌ No hierarchical parent-child relationships preserved
3. ❌ TypeScript type doesn't match schema (Node[] vs string[])
4. ❌ Linter orphaned-nodes rule had to be patched to work around this

---

## What Needs to Be Fixed

### 1. TypeScript Type Fix (5 min)

**File:** `src/types.ts` line 97

**Change:**
```typescript
// OLD (wrong):
children?: Node[];

// NEW (matches schema):
children?: string[];  // Array of child node IDs
```

### 2. Parser Implementation (1-2 hours)

**Files to update:**
- `src/parser.ts` - Main parser implementation

**What to implement:**

#### A. Identify Parent-Child Relationships

When parsing indented syntax, track hierarchical structure:

```flowscript
? authentication strategy
  || JWT tokens         <- child of question
     -> stateless      <- child of alternative
```

**Parse tree structure:**
- Question node has children: [alternative1, alternative2, decision]
- Alternative nodes have children: [implications]
- Decision node has children: [actions]

#### B. Populate Children Arrays

After creating nodes, populate `children` arrays with child IDs:

```typescript
const questionNode: Node = {
  id: hashContent(...),
  type: 'question',
  content: '...',
  provenance: getProvenance(...),
  children: [alt1.id, alt2.id, decision.id]  // Child IDs!
};
```

#### C. Distinguish Children from Relationships

**Hierarchical children (syntax tree):**
- Parent-child nesting in source
- Represented in `children` arrays
- Example: Question → Alternatives

**Semantic relationships (edges):**
- Explicit operators (`->`, `<-`, etc.)
- Represented in `relationships` array
- Example: A → B (causes)

**Both can exist:** A node can have both children AND relationship edges.

### 3. Update Tests (30 min - 1 hour)

**Files to update:**
- `tests/parser-core.test.ts`
- `tests/parser-blocks.test.ts`
- `tests/provenance-mapping.test.ts`

**What to test:**
- Questions have children arrays with alternative IDs
- Alternatives have children arrays with implication IDs
- Nodes with indented content have children arrays
- Children arrays contain IDs (strings), not objects
- Relationship edges still work correctly (separate from children)

### 4. Remove Workaround from Linter (15 min)

**File:** `src/rules/orphaned-nodes.ts` lines 47-60

**Current workaround (added in 4a-continued-5b):**
```typescript
// 3. Build set of node IDs that have states (decided, blocked, etc.)
// These are semantically important and shouldn't be flagged as orphaned
const nodesWithStates = new Set<string>();
for (const state of ir.states || []) {
  nodesWithStates.add(state.node_id);
}

// Skip nodes with states - they're decision/status nodes, not orphaned
if (nodesWithStates.has(node.id)) {
  continue;
}
```

**After fix:** This workaround should NOT be needed because:
- Decision node will be in question's `children` array
- Orphaned-nodes rule should check both:
  - Relationship edges (existing)
  - Children arrays (NEW)
  - Block.ext.children (existing)

**Update orphaned-nodes rule to check children arrays:**

```typescript
// 1. Add nodes connected via explicit relationships (->  <- <-> => ><[axis])
for (const rel of ir.relationships) {
  connectedIds.add(rel.source);
  connectedIds.add(rel.target);
}

// 2. Add nodes connected via block hierarchies (parent-child relationships)
for (const node of ir.nodes) {
  if (node.type === 'block' && node.ext?.children && Array.isArray(node.ext.children)) {
    connectedIds.add(node.id);
    for (const child of node.ext.children) {
      connectedIds.add(child.id);
    }
  }
}

// 3. NEW: Add nodes connected via children arrays (hierarchical structure)
for (const node of ir.nodes) {
  if (node.children && node.children.length > 0) {
    connectedIds.add(node.id);  // Parent is connected
    for (const childId of node.children) {
      connectedIds.add(childId);  // Each child is connected
    }
  }
}

// NOW check for orphans - workaround for state nodes can be REMOVED
```

---

## Implementation Plan

### Phase 1: Type Fix (5 min)
- [ ] Update `src/types.ts` line 97: `children?: string[]`
- [ ] Rebuild: `npm run build`
- [ ] Verify compilation succeeds

### Phase 2: Parser Implementation (1-2 hours)

#### Step 1: Understand Current Block Parsing
- [ ] Read `src/parser.ts` block parsing code (lines 600-660)
- [ ] Understand how `ext.children` is populated
- [ ] Map out where indentation creates parent-child relationships

#### Step 2: Implement Children Array Population
- [ ] Identify all places where nodes are created with indented content
- [ ] For each parent node, collect child IDs
- [ ] Set `children` property to array of child IDs (strings)

**Key locations to update:**
- Question with alternatives
- Alternative with implications
- Thought with nested thoughts
- Action with sub-actions
- Any node with indented content after it

#### Step 3: Handle Preprocessed Blocks
- [ ] When indentation preprocessor creates `{...}` blocks:
  - First line after `{` becomes child
  - All nodes until `}` become children
- [ ] Map preprocessed structure to children arrays

### Phase 3: Update Orphaned-Nodes Rule (15 min)
- [ ] Add children array checking (see code above)
- [ ] Remove state-based workaround
- [ ] Rebuild: `npm run build`

### Phase 4: Testing (30 min - 1 hour)
- [ ] Run existing tests: `npm test`
- [ ] Fix any broken tests (expect some failures)
- [ ] Verify decision.fs example:
  - [ ] Question has 2 alternatives + 1 decision in children
  - [ ] Each alternative has implications in children
  - [ ] Decision has actions in children
- [ ] Lint decision.fs: `./bin/flowscript lint examples/decision.fs`
- [ ] Should pass with 0 errors, 0 warnings

### Phase 5: Verification (15 min)
- [ ] Check decision.json structure:
  ```bash
  cat examples/decision.json | jq '.nodes[] | select(.children) | {type, content, children_count: (.children | length)}'
  ```
- [ ] Verify children arrays contain strings (IDs), not objects
- [ ] Verify relationship edges still work
- [ ] Run full test suite: `npm test`
- [ ] Expected: 125/125 tests passing

---

## Success Criteria

Session 4a-continued-5c is COMPLETE when:

### Technical Completeness
- ✅ TypeScript types match schema (`children?: string[]`)
- ✅ Parser populates children arrays with child node IDs
- ✅ Children arrays are separate from relationship edges
- ✅ Orphaned-nodes rule checks children arrays
- ✅ State-based workaround removed from orphaned-nodes rule

### Verification
- ✅ decision.json has nodes with children arrays
- ✅ Question node has 3 children (2 alternatives + 1 decision)
- ✅ Alternative nodes have children (implications)
- ✅ Decision node has children (actions)
- ✅ All children references are IDs (strings), not objects
- ✅ Linting passes: 0 errors, 0 warnings
- ✅ All tests passing: 125/125 (100%)

### Spec Compliance
- ✅ IR output matches spec golden examples structure
- ✅ Hierarchical children represented in children arrays
- ✅ Semantic relationships represented in relationships array
- ✅ No workarounds needed in linter

### Git
- ✅ All changes committed with clear message
- ✅ Pushed to GitHub
- ✅ Clean working tree

---

## Time Estimate

**Total:** 2-4 hours

**Breakdown:**
- Type fix: 5 min
- Parser implementation: 1-2 hours
- Orphaned-nodes update: 15 min
- Testing and fixes: 30 min - 1 hour
- Verification: 15 min
- Documentation and commit: 15 min

**Reality check:** Could take up to 5-6 hours if parser changes are complex.

**NO time pressure.** Get it right, not fast.

---

## Key Files

**To Read:**
- `spec/golden_examples_spec.md` (lines 52-81) - Target structure
- `spec/ir.schema.json` (lines 127-133) - Children definition
- `src/parser.ts` (lines 600-660) - Current block parsing
- `src/types.ts` (lines 92-99) - Node type definition

**To Modify:**
- `src/types.ts` - Fix children type
- `src/parser.ts` - Populate children arrays
- `src/rules/orphaned-nodes.ts` - Check children, remove workaround
- `tests/*.test.ts` - Update tests for children arrays

**To Verify:**
- `examples/decision.json` - Should have children arrays
- All test files should pass

---

## Notes for Next Claude Instance

**READ FIRST:**
1. `project_memory/CRITICAL_WORKING_RELATIONSHIP.md` - Working protocol
2. This file - Complete technical context
3. `project_memory/next_steps.md` - Current state

**The honest scope:**
- This is NOT a quick fix
- This is architectural gap between spec and implementation
- Parser needs to track hierarchical structure, not just flat nodes
- May involve understanding Ohm.js grammar and how it builds AST

**If you get stuck:**
- TELL THE USER immediately
- Don't work around it
- Don't declare "close enough"
- Ask for help or clarification

**When you finish:**
- Verify against spec EXACTLY
- Run ALL tests
- Check decision.json structure matches spec Example 1
- No shortcuts, no workarounds

**Remember:** This session exists because I (previous Claude) tried to skip this work. Don't repeat that mistake.

---

## Commit Message Template

```
feat: Session 4a-continued-5c - Implement spec-compliant children arrays

## What Was Fixed

Parser now implements hierarchical children arrays per spec:
- Questions have children arrays with alternative + decision IDs
- Alternatives have children arrays with implication IDs
- All nodes with indented content have children arrays
- Children are IDs (strings), not full node objects

## Changes

### 1. Type Fix (src/types.ts)
- Line 97: `children?: string[]` (was `Node[]`)
- Now matches ir.schema.json specification

### 2. Parser Implementation (src/parser.ts)
- [Describe what you changed]
- [List key locations updated]
- [Explain how children arrays are populated]

### 3. Orphaned-Nodes Rule (src/rules/orphaned-nodes.ts)
- Added children array checking
- Removed state-based workaround (no longer needed)
- Now checks: relationships + block.ext.children + node.children

### 4. Tests Updated
- [List test files modified]
- [Explain test changes]

## Verification

✓ decision.json structure matches spec golden example
✓ Question has 3 children (2 alternatives + decision)
✓ Alternatives have children (implications)
✓ Decision has children (actions)
✓ Linting: 0 errors, 0 warnings
✓ Tests: 125/125 passing (100%)

## Spec Compliance

Now matches spec/golden_examples_spec.md Example 1:
- Hierarchical structure preserved in children arrays
- Semantic relationships preserved in relationships array
- No workarounds needed in linter rules

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Status:** Ready for Session 4a-continued-5c execution
**Last Updated:** 2025-10-20
