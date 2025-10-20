# Golden Example: Decision Pattern

**Pattern:** Architectural decision-making with explicit tradeoffs
**Use Cases:** RFC decisions, architecture choices, technology selection
**Complexity:** Medium (25-30 lines, 2 alternatives, 9 relationships)
**Key Features:** `?`, `||`, `->`, `><[axis]`, `[decided]`

---

## Purpose

The decision pattern captures architectural decision-making where multiple options exist with explicit tradeoffs. It demonstrates FlowScript's ability to:
- Present alternatives clearly (`||` marker)
- Trace implications of each choice (`->` causal relationships)
- Articulate tensions explicitly (`><[axis]` tension markers)
- Document final decisions with rationale (`[decided]` state marker)

This pattern answers the critical question: **"Why did we choose X over Y?"**

---

## When to Use

Use the decision pattern when:
- **Making architectural choices** (database selection, authentication strategy, deployment approach)
- **Evaluating alternatives** with different tradeoffs (performance vs simplicity, cost vs reliability)
- **Documenting RFC decisions** that require clear rationale for future reference
- **Explaining technology choices** to stakeholders or future team members

**Don't use** for:
- Simple yes/no decisions without tradeoffs
- Decisions already made without exploring alternatives
- Trivial implementation details

---

## FlowScript Breakdown

### Structure

```flowscript
? [question describing the decision]

|| [Alternative 1]
  -> [implication 1]
    -> [deeper implication]
  -> [implication 2] ><[axis] [tradeoff articulation]

|| [Alternative 2]
  -> [implication 1]
  -> [implication 2] ><[axis] [tradeoff articulation]

* [decided(rationale: "...", on: "YYYY-MM-DD")] [chosen alternative]
  action: [concrete next step 1]
  action: [concrete next step 2]
```

### Components Explained

**Question (`?`)**: Frames the decision space
- Must be specific enough to evaluate alternatives
- Example: `? authentication strategy for v1 launch`

**Alternatives (`||`)**: Each option being considered
- Use indentation to show implications
- Example: `|| JWT tokens` vs `|| session tokens + Redis`

**Causal Relationships (`->`)**: Show consequences of each choice
- Chain them to show deeper implications
- Example: `-> stateless architecture` `-> scales horizontally`

**Tension Markers (`><[axis]`)**: Articulate explicit tradeoffs
- **MUST include axis label** (linter enforces this)
- Shows competing concerns
- Example: `><[security vs simplicity] implementation complexity`

**Decision Marker (`[decided]`)**: Documents the final choice
- **MUST include rationale and date** (forcing function for complete decisions)
- Example: `[decided(rationale: "security > scaling complexity for v1", on: "2025-10-15")]`

**Action Items (`action:`)**: Concrete next steps
- Make decisions actionable
- Example: `action: provision Redis cluster on AWS ElastiCache`

---

## Example: Authentication Strategy

[See [decision.fs](decision.fs) for the complete example]

**Scenario**: Choosing between JWT tokens (stateless, simple) and session tokens with Redis (secure revocation, added complexity).

**Key Insights**:
1. **Explicit tradeoffs**: Security vs simplicity, scaling vs security
2. **Rationale captured**: "security > scaling complexity for v1"
3. **Actionable**: Two concrete action items for implementation

---

## Compiled IR Structure

When parsed, `decision.fs` generates:
- **13 nodes** (1 question, 2 alternatives, statements, actions, blocks)
- **9 relationships**:
  - 2 alternative relationships (question → each `||`)
  - 5 causes relationships (from `->` operators)
  - 2 tension relationships (from `><[axis]` markers)
- **1 state** (decided marker linked to chosen alternative)

The IR preserves all semantic richness for querying.

---

## Query Operations

Once compiled to IR, the decision graph enables powerful queries:

### 1. `alternatives(question_id)` - Find all options

```javascript
alternatives("auth_strategy_question")
// Returns:
// [
//   { id: "jwt_tokens", content: "JWT tokens" },
//   { id: "session_redis", content: "session tokens + Redis" }
// ]
```

### 2. `why(decision_id)` - Trace decision rationale

```javascript
why("session_redis_decision")
// Returns:
// {
//   rationale: "security > scaling complexity for v1",
//   date: "2025-10-15",
//   supporting_evidence: [
//     { content: "instant revocation capability" },
//     { content: "battle-tested approach" }
//   ]
// }
```

### 3. `tensions()` - Find all articulated tradeoffs

```javascript
tensions()
// Returns:
// [
//   {
//     axis: "security vs simplicity",
//     nodes: ["revocation difficult", "implementation complexity"]
//   },
//   {
//     axis: "scaling vs security",
//     nodes: ["server-side state required", "operational complexity"]
//   }
// ]
```

### 4. `what_if(alternative_id)` - Explore implications

```javascript
what_if("jwt_tokens")
// Returns implications graph:
// JWT tokens -> stateless architecture -> scales horizontally
//            -> revocation difficult ><[security vs simplicity]
```

---

## Teaching Value

This pattern demonstrates:

**1. Forcing Functions**: FlowScript's syntax enforces completeness
- Tension markers MUST have axis labels (E001 linter rule)
- Decided markers MUST have rationale and date (E002 linter rule)
- Can't hide behind vague articulations

**2. Queryable Memory**: Structure enables computational operations
- Trace "why we chose X" programmatically
- Compare alternatives across decisions
- Detect patterns in tradeoffs

**3. Partnership Quality**: AI can reconstruct decision context
- Future conversations can reference decision rationale
- No need to re-explain "why we did this"
- Decisions become computable knowledge, not buried text

---

## Variations

**Simple Decision** (binary choice):
- 2 alternatives, minimal implications
- ~15 lines

**Complex RFC** (3+ alternatives, deep analysis):
- Multiple tension axes
- Deep implication chains (3+ levels)
- ~40-60 lines

**Incremental Decision** (evolving over time):
- Start with `[exploring]`
- Add alternatives as discovered
- Conclude with `[decided]` when ready

---

## Integration with Other Patterns

**Combine with Debug Pattern**: If decision proves wrong, trace backward
**Combine with Research Pattern**: Explore domain before deciding
**Combine with Design Pattern**: Use decisions to drive RFC structure

---

## Validation

To verify your decision pattern works:

```bash
# Parse to IR
./bin/flowscript parse decision.fs -o decision.json

# Lint for semantic errors
./bin/flowscript lint decision.fs

# Validate IR structure
./bin/flowscript validate decision.json
```

**Expected**:
- ✅ Parse succeeds
- ✅ Lint passes (or 1 minor warning for root statement)
- ✅ Validate passes
- ✅ Relationships array populated with alternative, causes, and tension types

---

## Next Steps

1. **Try it yourself**: Copy `decision.fs` and adapt to your own decision
2. **Explore queries**: Build queries to extract decision rationale
3. **Study other patterns**: See `debug.fs`, `research.fs`, `design.fs` for different use cases

---

**Last Updated**: 2025-10-20
**Session**: 4a-continued-5
**Status**: Complete golden example with full IR validation
