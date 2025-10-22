# Golden Example: Research Pattern

**Pattern:** Knowledge mapping with hierarchical branching and exploratory thinking
**Use Cases:** Literature review, technology assessment, domain exploration, research notes
**Complexity:** High (35-40 lines, deep nesting, multiple tension axes, exploratory modifier)
**Key Features:** `->`, `><[axis]`, `~`, deep hierarchical structure (4-5 levels)

---

## Purpose

The research pattern captures complex domain exploration where understanding branches across multiple dimensions. It demonstrates FlowScript's ability to:
- Model deep hierarchical knowledge structures (4-5 levels of nesting)
- Articulate multiple competing constraints (`><[axis]` tension markers)
- Mark speculative vs confident thinking (`~` exploratory modifier)
- Trace causal chains across complex technical domains

This pattern answers the critical question: **"What are the key challenges and tradeoffs in this domain?"**

---

## When to Use

Use the research pattern when:
- **Exploring complex technical domains** (quantum computing, distributed systems, ML architectures)
- **Mapping competing constraints** with multiple tension axes (cost vs performance, theory vs practice)
- **Documenting literature reviews** with branching insights and uncertainty
- **Capturing evolving understanding** as research progresses

**Don't use** for:
- Simple linear cause-effect chains (use basic `->` instead)
- Shallow domain overviews without branching
- Completed knowledge without speculation
- Decision-making (use decision pattern instead)

---

## FlowScript Breakdown

### Structure

```flowscript
[root topic statement]

  -> [major challenge 1]
    -> [sub-challenge]
      -> [deeper insight]
        -> [implementation detail]
          ><[axis] [tradeoff articulation]
    -> [another sub-challenge]
      -> [branching approach 1]
      -> [branching approach 2]

  -> [major challenge 2]
    -> [scaling consideration]
      -> [constraint detail]

  -> [major challenge 3]
    -> [timeline factor]
    -> [standard/regulation]

thought: [conclusion or synthesis]
  -> [implication]

~ thought: [speculative idea marked as exploratory]
  -> [what this would enable]
  -> [monitoring strategy]
```

### Components Explained

**Root Statement**: Frames the research domain
- Example: `quantum computing viability for cryptography`
- Establishes scope for exploration

**Deep Hierarchical Nesting**: Shows multi-level causal chains
- 4-5 levels of indentation demonstrate complex dependencies
- Example: decoherence → noise → isolation → temperature → cost
- Each level adds specificity and detail

**Causal Relationships (`->`)**: Trace implications through layers
- Show how high-level challenges break down into specific constraints
- Chain them to reveal deep dependencies
- Example: `-> quantum error correction needed` → `-> topological qubits approach`

**Tension Markers (`><[axis]`)**: Articulate explicit tradeoffs
- **MUST include axis label** (linter enforces this)
- Multiple tension axes show competing constraints
- Example: `><[physics vs economics]`, `><[efficiency vs reliability]`

**Exploratory Modifier (`~`)**: Mark speculative thinking
- Indicates uncertainty or forward-looking speculation
- Example: `~ thought: might quantum networking solve connectivity before computing scales?`
- Signals "monitor this" rather than "act on this"

**Branching Structure**: Multiple paths from single node
- Shows alternative approaches or parallel considerations
- Example: topological qubits vs surface codes (two approaches to error correction)

---

## Example: Quantum Computing Viability

[See [research.fs](research.fs) for the complete example]

**Scenario**: Assessing whether quantum computers will threaten current cryptography, mapping three major challenge domains (decoherence, scaling, timeline).

**Key Insights**:
1. **Deep dependencies**: Isolation requirements → temperature → cryogenic cost ($10M+)
2. **Multiple tensions**: Physics vs economics, efficiency vs reliability
3. **Branching approaches**: Two error correction strategies with different maturity
4. **Speculative thinking**: Quantum networking as alternative path (marked with `~`)
5. **Practical conclusion**: Current action is PQC migration, not waiting

---

## Compiled IR Structure

When parsed, `research.fs` generates:
- **41 nodes** (1 root statement, thoughts across 3 major branches)
- **25 relationships**:
  - 23 causes relationships (from `->` operators showing causal chains)
  - 2 tension relationships (from `><[axis]` markers showing competing constraints)
- **13 nodes with children arrays** (showing hierarchical structure)
- **1 exploratory modifier** (on speculative quantum networking thought)

The IR preserves deep hierarchical structure and uncertainty markers for querying.

---

## Query Operations

Once compiled to IR, the research graph enables powerful analysis:

### 1. `what_if(node_id)` - Explore consequences

```javascript
what_if("quantum_networking_node")
// Returns:
// {
//   direct_consequences: [
//     { content: "quantum internet enables distributed computation" },
//     { content: "separate research track to monitor" }
//   ],
//   related_tensions: [],
//   confidence: "exploratory",  // from ~ modifier
//   impact_assessment: "Speculative - requires continued monitoring"
// }
```

### 2. `tensions()` - Map tradeoff landscape

```javascript
tensions()
// Returns:
// [
//   {
//     axis: "physics vs economics",
//     nodes: [
//       { content: "requires extreme isolation (millikelvin temperatures)" },
//       { content: "cryogenic infrastructure cost ($10M+ per system)" }
//     ],
//     context: "decoherence problem"
//   },
//   {
//     axis: "efficiency vs reliability",
//     nodes: [
//       { content: "1000:1 physical-to-logical qubit ratio" },
//       { content: "error tolerance" }
//     ],
//     context: "surface codes approach"
//   }
// ]
```

### 3. `depth(node_id)` - Measure nesting complexity

```javascript
depth("quantum_computing_root")
// Returns:
// {
//   max_depth: 5,
//   deepest_paths: [
//     ["quantum computing", "decoherence problem", "environmental noise",
//      "requires extreme isolation", "cryogenic infrastructure cost"],
//     ["quantum computing", "decoherence problem", "quantum error correction",
//      "topological qubits", "Microsoft Azure Quantum bet"]
//   ],
//   complexity_assessment: "High complexity - deep dependencies"
// }
```

### 4. `branches(node_id)` - Find alternative approaches

```javascript
branches("quantum_error_correction_node")
// Returns:
// [
//   {
//     path: "topological qubits approach",
//     status: "still theoretical (no working prototype)",
//     backing: "Microsoft Azure Quantum"
//   },
//   {
//     path: "surface codes approach",
//     status: "Google Sycamore implementation",
//     tradeoff: "1000:1 physical-to-logical qubit ratio"
//   }
// ]
```

---

## Teaching Value

This pattern demonstrates:

**1. Deep Dependency Modeling**: Complex causal chains
- Shows how surface-level challenges (decoherence) trace to concrete constraints (millikelvin temperatures, $10M cost)
- Enables "why is this hard?" queries that traverse multiple levels
- Structure preserves reasoning chain for future reference

**2. Multi-Dimensional Tradeoffs**: Multiple tension axes simultaneously
- Not just one tradeoff, but competing constraints across domains
- Physics vs economics (hardware requirements vs budget)
- Efficiency vs reliability (qubit ratios vs error tolerance)
- Computational queries can compare tension landscapes

**3. Uncertainty Representation**: Exploratory modifier marks speculation
- Distinguishes confident knowledge from speculative ideas
- Enables filtering by confidence level in queries
- Shows "monitor this" vs "act on this" thinking explicitly

**4. Branching Exploration**: Alternative approaches captured structurally
- Multiple paths from single challenge point
- Enables "what are the alternatives?" queries
- Preserves reasoning about why different approaches exist

---

## Nesting Depth Note

This example demonstrates **deep hierarchical nesting (4-5 levels)** but does not trigger the W002 linter warning (which activates at >5 levels). This is intentional:
- The structure is complex enough to show capability
- Not so deep that it becomes unreadable
- W002 warning would trigger if any path reached 6+ levels
- Deep nesting is a feature here, not a problem

For extremely complex domains (6+ levels), the W002 warning serves as a "consider restructuring" signal, but is not an error.

---

## Variations

**Shallow Research** (2-3 levels, quick exploration):
- ~15-20 lines
- Single tension axis
- No exploratory markers
- Quick domain overview

**Comprehensive Analysis** (5-6 levels, multiple papers):
- ~60-80 lines
- 3+ tension axes
- Multiple exploratory branches
- May trigger W002 (acceptable for comprehensive research)
- Include citations in provenance

**Evolving Understanding** (incremental addition):
- Start with simple structure
- Add depth as research progresses
- Mark early thoughts with `~` (exploratory)
- Update to confident statements as evidence accumulates

---

## Integration with Other Patterns

**Combine with Decision Pattern**: Research → identify options → decide
**Combine with Debug Pattern**: Deep dive into specific failure mode
**Feed into Design Pattern**: Research conclusions inform RFC decisions

---

## Validation

To verify your research pattern works:

```bash
# Parse to IR
./bin/flowscript parse research.fs -o research.json

# Lint for semantic errors
./bin/flowscript lint research.fs

# Validate IR structure
./bin/flowscript validate research.json
```

**Expected**:
- ✅ Parse succeeds
- ✅ Lint passes (0 errors, 0 warnings for 4-5 levels; W002 warning at 6+ levels)
- ✅ Validate passes
- ✅ Relationships array populated with causes and tension types
- ✅ Children arrays show hierarchical structure
- ✅ Exploratory modifier captured on speculative nodes

---

## Next Steps

1. **Try it yourself**: Copy `research.fs` and adapt to your research domain
2. **Experiment with depth**: See how deep nesting clarifies vs obscures
3. **Map tensions**: Practice articulating competing constraints explicitly
4. **Study other patterns**: See `decision.fs`, `debug.fs`, `design.fs` for different use cases

---

**Last Updated**: 2025-10-22
**Session**: 4a-continued-5g
**Status**: Complete golden example with full IR validation (Pattern 3)
