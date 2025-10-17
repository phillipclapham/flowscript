# FlowScript v1.0 - Formal Grammar Specification

**Status:** Canonical Definition
**Version:** 1.0.0
**Last Updated:** October 2025
**Purpose:** Complete formal grammar for parsing FlowScript to canonical IR

---

## Document Purpose

This document provides the **complete formal grammar** for FlowScript v1.0. It defines:

- **Lexical structure** - How text is tokenized
- **Syntax rules** - How tokens combine into valid FlowScript
- **Precedence** - How ambiguities are resolved
- **Composition** - How markers combine
- **Escaping** - How to use literal marker characters

**THIS IS THE PARSER CONTRACT.** All FlowScript parsers MUST conform to this grammar to ensure consistent interpretation across implementations.

---

## Usage Modes

FlowScript supports two modes of use:

### Informal Mode (Conversational)

Use 3-5 markers embedded in natural prose with any AI:
- `->` for causation
- `><[axis]` for tradeoffs
- `?` for questions
- `[blocked(reason, since)]` for blockers
- `thought:` for insights

**No formal validation.** Hybrid style. Zero barrier to entry. Works anywhere.

**Example:**
```
I'm thinking about authentication. JWT tokens -> stateless scaling, but
revocation is hard ><[security vs simplicity] simplicity. Session tokens
give instant revocation but add Redis complexity.

? Which matters more for v1 - security or simplicity?
```

### Formal Mode (Computable Substrate)

Use full specification for parseable, queryable thought graphs:
- All 21 markers available
- Linter enforces semantic correctness
- Compiles to canonical IR
- Enables computational queries
- Powers cognitive infrastructure

**This specification defines Formal Mode.** Informal mode is a subset that works anywhere without tooling.

---

## The 21 Markers

FlowScript v1.0 includes exactly **21 markers** organized into 7 categories:

### Category 1: Core Relations (6 markers)
- `->` - causal relationship, implication, dependency
- `=>` - temporal sequence (no causation)
- `<-` - reverse causal (derives from)
- `<->` - bidirectional, mutual influence, feedback loop
- `><[axis]` - tension, tradeoff (axis label REQUIRED)
- `||` - alternative, mutually exclusive option

### Category 2: Definition Operators (2 markers)
- `=` - equivalent to, defined as
- `!=` - different from, not equivalent to

### Category 3: State Markers (4 markers)
- `[decided(rationale, on)]` - committed decision (fields REQUIRED)
- `[exploring]` - investigating, not committed (fields OPTIONAL)
- `[blocked(reason, since)]` - waiting on dependency (fields REQUIRED)
- `[parking(why, until)]` - deferred (fields RECOMMENDED)

### Category 4: Insights & Questions (3 markers)
- `thought:` - insight, realization, learning
- `?` - question, decision point, uncertainty
- `✓` - completed, done, finished

### Category 5: Commands (1 marker)
- `action:` - specific action to execute

### Category 6: Modifiers (4 markers)
- `!` - urgent, time-sensitive, critical
- `++` - strong positive, emphatic agreement
- `*` - high confidence, proven, definite
- `~` - low confidence, uncertain, maybe

### Category 7: Structure (1 marker)
- `{ }` - thought blocks, atomic processing units

---

## Lexical Elements

### Whitespace

```ebnf
whitespace     = space | tab | newline
space          = U+0020
tab            = U+0009
newline        = U+000A | U+000D U+000A | U+000D
```

**Whitespace handling:**
- Spaces and tabs are flexible (multiple treated as one)
- Newlines are significant (separate logical lines)
- Indentation is preserved for nesting structure

### Comments

FlowScript does NOT have comment syntax. Use natural language prose - it's already hybrid.

### Identifiers

```ebnf
identifier     = letter (letter | digit | "_" | "-")*
letter         = "a".."z" | "A".."Z"
digit          = "0".."9"
```

### String Literals

Used in state field values:

```ebnf
string         = '"' string_char* '"'
string_char    = <any character except '"' or '\'>
               | escape_sequence

escape_sequence = '\"' | '\\' | '\n' | '\t' | '\r'
```

**Examples:**
```
"waiting on API keys"
"security > scaling for v1"
"quoted \"production\" keys"
```

### Date Literals

ISO-8601 format in state fields:

```ebnf
date_literal   = '"' iso_8601_date '"'
iso_8601_date  = year "-" month "-" day
               | year "-" month "-" day "T" hour ":" minute ":" second "Z"
```

**Examples:**
```
"2025-10-17"
"2025-10-17T14:23:15Z"
```

---

## Grammar Productions

### Top-Level Structure

```ebnf
document       = line*
line           = (element | prose) newline
element        = modifier* (state | insight | relationship | definition | structure | completion | alternative)
prose          = <natural language text without markers>
```

### Modifiers

Modifiers are **prefix operators** - they ALWAYS come before what they modify.

```ebnf
modifier       = "!" | "++" | "*" | "~"
```

**Precedence:** Highest (binds tightly to following marker)

**Examples:**
```
! ? urgent question
* [decided(...)] high-confidence decision
~ thought: uncertain insight
! ~ thought: urgent but uncertain
```

### State Markers

```ebnf
state          = decided | exploring | blocked | parking

decided        = "[decided("
                   "rationale:" string ","
                   "on:" date_literal
                 ")]"

exploring      = "[exploring" field_list? "]"

blocked        = "[blocked("
                   "reason:" string ","
                   "since:" date_literal
                 ")]"

parking        = "[parking" field_list? "]"

field_list     = "(" field ("," field)* ")"
field          = identifier ":" string
```

**Required fields:**
- `[decided]` - MUST have `rationale` and `on`
- `[blocked]` - MUST have `reason` and `since`
- `[exploring]` - fields OPTIONAL
- `[parking]` - fields RECOMMENDED (linter WARNING if missing)

**Examples:**
```
[decided(rationale: "user feedback validates need", on: "2025-10-15")]
[blocked(reason: "waiting on API keys", since: "2025-10-12")]
[exploring(hypothesis: "axis labeling improves clarity")]
[parking(why: "not needed until v2", until: "after MVP")]
```

### Insights and Questions

```ebnf
insight        = "thought:" content
question       = "?" content
completion     = "✓" content
command        = "action:" content

content        = <text until newline or marker>
```

**Examples:**
```
thought: FlowScript enables dimensional expansion
? Should we refactor now or ship first?
✓ Tests passing
action: commit and push to git
```

### Relationships

```ebnf
relationship   = causal | temporal | reverse_causal | bidirectional | tension

causal         = "->"
temporal       = "=>"
reverse_causal = "<-"
bidirectional  = "<->"
tension        = "><[" axis_label "]"

axis_label     = <text except ']'>
```

**Axis label REQUIRED for tension:**
```
VALID:   speed ><[velocity vs maintainability] quality
INVALID: speed >< quality     # ERROR: missing axis
```

**Examples:**
```
A -> B              # A causes B
A => B              # A then B (temporal)
A <- B              # A derives from B
A <-> B             # A and B mutually influence
A ><[axis] B        # A and B in tension along axis
```

### Alternatives

```ebnf
alternative    = "||" content
```

**Semantics:** Marks mutually exclusive option under consideration.

**Examples:**
```
? authentication strategy
  || JWT tokens
     -> stateless
     -> revocation hard
  || session + Redis
     -> instant revocation
     -> operational complexity

[decided(rationale: "security critical", on: "2025-10-15")] session + Redis
```

### Definitions

```ebnf
definition     = "=" | "!="
```

**Examples:**
```
MVP = minimal viable product
causal (->) != temporal (=>)
```

### Structure - Thought Blocks

```ebnf
structure      = "{" block_content "}"
block_content  = (element | prose | structure)*
```

**Nesting:** Blocks can nest recursively. WARNING at >5 levels.

**Examples:**
```
{simple block with content}

{
  nested block
  -> {child block 1}
  -> {child block 2}
}

thought: {
  main observation
  <- {context <- trigger}
  -> {implication}
}
```

---

## Operator Precedence

When multiple markers appear on the same line, **precedence determines binding** from highest to lowest:

1. **Escape sequences** (`\->`, `\?`, etc.) - highest precedence
2. **Modifiers** (`!`, `++`, `*`, `~`) - bind to next marker
3. **State markers** (`[decided]`, `[blocked]`, etc.)
4. **Insights/Questions** (`thought:`, `?`, `✓`, `action:`)
5. **Alternatives** (`||`)
6. **Relationships** (`->`, `=>`, `<-`, `<->`, `><[axis]`)
7. **Definitions** (`=`, `!=`)
8. **Structure** (`{ }`) - lowest precedence, groups everything

### Precedence Examples

```
! [blocked(reason: "...", since: "...")] A -> B

Parses as:
  ! (modifies [blocked])
  [blocked] (state of node A)
  A -> B (causal relationship)
```

```
* thought: A -> B -> C

Parses as:
  * (modifies thought:)
  thought: (insight marker)
  "A -> B -> C" (content of thought, contains relationships)
```

```
? [exploring] || option A || option B

Parses as:
  ? (question marker)
  [exploring] (state)
  || option A (first alternative)
  || option B (second alternative)
```

---

## Composition Rules

### Valid Compositions

**Modifiers + State:**
```
! [blocked(...)]     # Urgent blocker
* [decided(...)]     # High-confidence decision
~ [exploring]        # Uncertain exploration
```

**Modifiers + Insights:**
```
! thought:           # Urgent insight
~ thought:           # Uncertain thought
* ? definitely       # High-priority question
```

**Multiple Modifiers:**
```
! ~ thought:         # Urgent but uncertain
* ! [decided(...)]   # Highly confident urgent decision
```

**Order:** Modifiers can appear in any order (all prefix).

**State + Content + Relationships:**
```
[blocked(...)] Deploy -> Production
[decided(...)] Approach A
? option <- {context}
```

**Thought Blocks + Relations:**
```
{block A} -> {block B}
{option} ><[axis] {alternative}
thought: {content <- context -> implication}
```

### Invalid Compositions

```
->?                      # ERROR: markers don't merge
[decided blocked]        # ERROR: one state at a time
thought: action:         # ERROR: one insight/command marker
Deploy [blocked]         # ERROR: state must come before content
```

---

## Escape Sequences

To use markers **literally** in text (not as FlowScript syntax):

### Character Escaping

```ebnf
escape         = "\" marker_char
marker_char    = "-" | ">" | "<" | "=" | "!" | "?" | "✓"
               | "[" | "]" | "{" | "}" | "|" | "*" | "~" | "+" | "@"
               | "\"
```

### Escape Examples

```
\->          # Literal arrow (not causal marker)
\?           # Literal question mark (not question marker)
\\           # Literal backslash
\[           # Literal left bracket
\{           # Literal left brace
\||          # Literal pipes (not alternative)
```

**In prose:**
```
To create a causal link, type A \-> B in your document.
The \? marker indicates a question.
Use double backslash \\ for literal backslash.
```

**In string literals:**
```
[blocked(reason: "waiting for \"production\" keys", since: "2025-10-12")]
                           ^^^^^^^^^^^^^^^^^^^^
                           escaped quotes in string
```

---

## Whitespace and Formatting

### Horizontal Whitespace

**Flexible:** Multiple spaces/tabs treated as single separator.

```
A->B              # Valid (no spaces)
A -> B            # Valid (spaces around arrow)
A  ->  B          # Valid (multiple spaces)
A	->	B           # Valid (tabs)
```

**Recommendation:** Single space around operators for readability.

### Vertical Whitespace (Newlines)

**Significant:** Newlines separate logical elements.

```
A -> B
C -> D

Parses as two separate relationships.
```

**Line continuation:** Natural within thought blocks.

```
{
  multi-line
  thought
  content
}
```

### Indentation

**Preserved:** Indicates nesting structure.

```
? question
  || option A
     -> detail 1
     -> detail 2
  || option B
     -> different approach
```

**Parser behavior:**
- Indentation is VISUAL (aids readability)
- Nesting determined by `{ }` blocks and logical structure
- Inconsistent indentation = WARNING (style issue, not error)

### Blank Lines

**Allowed:** Blank lines improve readability, no semantic meaning.

```
thought: important insight

-> leads to this

-> and this
```

---

## Complete Grammar (EBNF)

```ebnf
(* FlowScript v1.0 Complete Grammar *)

(* Document Structure *)
document       = line*
line           = element | prose | blank_line
element        = modifier* (state | insight | relationship | definition |
                           structure | alternative)
prose          = text_without_markers
blank_line     = whitespace* newline

(* Modifiers *)
modifier       = urgent | strong_positive | high_confidence | low_confidence
urgent         = "!"
strong_positive= "++"
high_confidence= "*"
low_confidence = "~"

(* State Markers *)
state          = decided | exploring | blocked | parking

decided        = "[decided("
                   "rationale:" string ","
                   "on:" date_literal
                 ")]"

exploring      = "[exploring" ("(" field_list ")")? "]"

blocked        = "[blocked("
                   "reason:" string ","
                   "since:" date_literal
                 ")]"

parking        = "[parking" ("(" field_list ")")? "]"

field_list     = field ("," field)*
field          = identifier ":" (string | date_literal)

(* Insights, Questions, Commands *)
insight        = ("thought:" | "action:") content
question       = "?" content
completion     = "✓" content

(* Relationships *)
relationship   = causal | temporal | reverse_causal | bidirectional | tension
causal         = "->"
temporal       = "=>"
reverse_causal = "<-"
bidirectional  = "<->"
tension        = "><[" axis_label "]"
axis_label     = text_except_close_bracket

(* Alternatives *)
alternative    = "||" content

(* Definitions *)
definition     = equivalent | not_equivalent
equivalent     = "="
not_equivalent = "!="

(* Structure *)
structure      = "{" block_content "}"
block_content  = (element | prose | structure | newline)*

(* Lexical *)
content        = text_until_newline_or_marker
string         = '"' string_char* '"'
string_char    = <any char except " or \> | escape_sequence
escape_sequence= '\"' | '\\' | '\n' | '\t' | '\r'
date_literal   = '"' iso_8601_date '"'
iso_8601_date  = year "-" month "-" day ("T" time "Z")?
identifier     = letter (letter | digit | "_" | "-")*
letter         = "a".."z" | "A".."Z"
digit          = "0".."9"
whitespace     = space | tab | newline
newline        = "\n" | "\r\n" | "\r"
```

---

## Parsing Guidelines

### Tokenization Strategy

**Two-phase approach recommended:**

1. **Lexical analysis:** Identify marker tokens, strings, identifiers
2. **Syntactic analysis:** Build parse tree following precedence rules

**Ambiguity resolution:**
- Longest match wins (e.g., `<->` not `<` + `-` + `>`)
- Precedence table resolves conflicts
- Escaped characters never interpreted as markers

### Error Recovery

**On syntax errors:**
- Report line number and column
- Suggest likely fix (e.g., "missing axis label")
- Continue parsing if possible (collect multiple errors)

**Example error:**
```
Line 42: Tension marker missing axis label
  Found: speed >< quality
  Expected: speed ><[axis] quality
  Suggestion: Specify dimension of tradeoff (e.g., "velocity vs maintainability")
```

### Parser Output

**Target:** Canonical IR conforming to ir.schema.json

**Each element produces:**
- Node with content-hash ID
- Relationships to other nodes
- State annotations where applicable
- Provenance (source file, line number, timestamp)

---

## Examples

### Example 1: Simple Causation

**Input:**
```
poor sleep -> reduced focus -> mistakes
```

**Parse tree:**
```
node("poor sleep")
  -> relationship(causes)
  -> node("reduced focus")
  -> relationship(causes)
  -> node("mistakes")
```

### Example 2: Decision with Alternatives

**Input:**
```
? authentication strategy
  || JWT tokens
     -> stateless (scales well)
     -> revocation hard
  || session + Redis
     -> instant revocation
     -> operational complexity

[decided(rationale: "security critical for v1", on: "2025-10-15")]
session + Redis
```

**Parse tree:**
```
question("authentication strategy")
  -> alternative("JWT tokens")
       -> causal("stateless (scales well)")
       -> causal("revocation hard")
  -> alternative("session + Redis")
       -> causal("instant revocation")
       -> causal("operational complexity")

decided(
  node: "session + Redis",
  rationale: "security critical for v1",
  on: "2025-10-15"
)
```

### Example 3: Complex Nesting with Modifiers

**Input:**
```
! [blocked(reason: "API keys pending", since: "2025-10-12")]
Deploy to production

* thought: {
  Code review process
  <- {strict requirements <- security audit findings}
  -> improved code quality ><[velocity vs quality] slower shipping
}
```

**Parse tree:**
```
modifier(urgent)
  -> state(blocked, reason="API keys pending", since="2025-10-12")
  -> node("Deploy to production")

modifier(high_confidence)
  -> insight("thought:")
  -> block(
       node("Code review process")
         <- block(
              node("strict requirements")
                <- node("security audit findings")
            )
         -> relationship(causes) -> node("improved code quality")
         -> tension(axis="velocity vs quality") -> node("slower shipping")
     )
```

### Example 4: Escaped Markers in Prose

**Input:**
```
To use FlowScript markers literally, escape them:
- Type \-> for a literal arrow
- Type \? for a literal question mark
- Type \\ for a backslash

The marker \[blocked\] indicates waiting.
```

**Parse tree:**
```
prose("To use FlowScript markers literally, escape them:")
prose("- Type -> for a literal arrow")
prose("- Type ? for a literal question mark")
prose("- Type \ for a backslash")
prose("")
prose("The marker [blocked] indicates waiting.")
```

(All escaped sequences render as literal text)

---

## Implementation Notes

### For Parser Developers

**Character encoding:** UTF-8 assumed. Support Unicode in content.

**Line endings:** Normalize to `\n` internally. Accept `\r\n` (Windows) and `\r` (old Mac).

**Marker detection:** Use longest-match tokenization:
- `<->` is bidirectional (not `<` + `-` + `>`)
- `><[` starts tension (not `>` + `<` + `[`)
- `||` is alternative (not two `|` characters)

**State field parsing:** Use mini-parser for field lists:
1. Split on commas (respecting quotes)
2. Split on colons (key: value)
3. Unescape string values
4. Validate required fields

**Content hash generation:** See semantics.md for algorithm.

### For Tool Developers

**Syntax highlighting:** Use precedence for coloring priority.

**Autocomplete:** Suggest closing brackets, required fields.

**Formatting:** Preserve user's whitespace choices (don't auto-format aggressively).

**Error messages:** Cite this grammar in explanations.

### For Users

**Learning path:**
1. Start with 3 markers in prose (informal mode)
2. Add states when tracking work
3. Use modifiers for emphasis
4. Add structure for complex thinking
5. Validate formally when compiling

**Best practices:**
- Hybrid style (prose + selective markers) is most natural
- Use `{ }` blocks for multi-line thoughts
- Indent alternatives for readability
- Add whitespace for visual clarity

---

## Validation Against IR Schema

Every production in this grammar MUST map to valid IR per ir.schema.json:

| Grammar Element | IR Element | Notes |
|-----------------|------------|-------|
| `modifier*` | `node.modifiers[]` | Array of modifier types |
| `state` | `state` object | With required fields |
| `insight`, `question` | `node` with type | Type: thought, question, etc. |
| `relationship` | `relationship` object | With source, target, type |
| `alternative` | `relationship` type="alternative" | Links to question |
| `structure` | `node.children[]` | Hierarchical nesting |

**Parser contract:** Output MUST validate against ir.schema.json.

---

## Grammar Evolution

### Adding Markers (Future)

**Process:**
1. Evidence of friction with existing markers
2. Natural pattern emerging in usage
3. Proposal with rationale
4. Update this grammar specification
5. Update ir.schema.json
6. Update semantics.md
7. Version increment (1.0 → 1.1)

### Grammar Errata

**If ambiguity or error found:**
1. Document in GitHub issue
2. Propose fix with examples
3. Community discussion
4. Update specification
5. Patch version increment (1.0.0 → 1.0.1)

---

## Conclusion

This grammar specification provides the **complete formal syntax** for FlowScript v1.0. Every valid FlowScript document can be parsed unambiguously using these rules.

**Parser developers:** Implement this grammar exactly. Your output IR must validate against ir.schema.json.

**Tool developers:** Use this grammar for syntax highlighting, validation, formatting.

**Users:** This defines what's valid FlowScript. Linter errors cite these rules.

**Next steps:**
- See [semantics.md](semantics.md) for marker meanings
- See [ir.schema.json](ir.schema.json) for IR structure
- See [linter-rules.md](linter-rules.md) for validation rules

---

**FlowScript v1.0 Formal Grammar**
**Parser Contract**
**October 2025**
