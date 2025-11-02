# FlowScript Visualization Test
# Demonstrates all 12 node types and all 10 edge types

## All Node Types Test

This is a statement node [statement:1]
  -> Regular statement with rounded-rect shape

? What about questions [question:2]
  -> Questions render as diamonds

~ Thoughts are gray circles [thought:3]
  -> Reflective notes with circle shape

! Action items look different [action:4]
  -> Actions are rectangles

✓ Completed tasks have checkmarks [completion:5] [decided(rationale: "Task finished", on: "2025-11-02")]
  -> Circle with checkmark overlay

× Blocked work shows alerts [blocker:6] [blocked(reason: "Waiting for approval", since: "2025-11-01")]
  -> Octagon shape (stop sign)

※ Insights are highlighted [insight:7]
  -> Star shape for emphasis

⊙ Decisions are resolved [decision:8] [decided(rationale: "Best approach identified", on: "2025-11-02")]
  -> Hexagon shape with green indicator

|| Alternative option A [alternative:9]
  -> Triangle shape

⧗ Exploring new approaches [exploring:10] [exploring(since: "2025-11-01")]
  -> Dashed circle border

⊞ Parked for later [parking:11] [parking(why: "Low priority", until: "2025-12-01")]
  -> Rounded square

{Block container [block:12]
  ~  Child node 1 [child:1]
  ~ Child node 2 [child:2]
  ~Child node 3 [child:3]
}
  -> Larger dashed border container with child count

## All Edge Types Test

### Causal Relationships (solid blue)
statement:1 <- question:2

### Temporal Relationships (dashed gray)
statement:1 then question:2

### Logical Derivation (dotted purple)
question:2 derives_from thought:3

### Bidirectional Dependencies (solid teal, double arrow)
action:4 <-> completion:5

### Tension/Tradeoffs (amber with axis label)
blocker:6 >< insight:7 [speed vs quality]

### Equivalence (double green line)
decision:8 === alternative:9

### Distinction (double red line)
alternative:9 !== exploring:10

### Alternative Relationships (purple)
question:2 >> alternative:9

### Better Alternative (green arrow)
alternative:9 >>> exploring:10

### Worse Alternative (red arrow)
exploring:10 <<< parking:11

## Complex Patterns

### Decision Tree
? Should we proceed [root-question:100]
  || Option A: Fast but risky [alt-a:101]
    ! Implement quickly [action-fast:102]
      × Risk: Technical debt [blocker-debt:103] [blocked(reason: "Needs review", since: "2025-11-02")]
  || Option B: Slow but safe [alt-b:104]
    ! Implement carefully [action-safe:105]
      ✓ Quality assured [completion-qa:106]

root-question:100 >> alt-a:101
root-question:100 >> alt-b:104
alt-a:101 <- action-fast:102
action-fast:102 <- blocker-debt:103
alt-b:104 <- action-safe:105
action-safe:105 <- completion-qa:106
alt-a:101 <<< alt-b:104

### Hierarchical Block
{Project Phase 1 [phase1:200]
  {Sprint 1 [sprint1:201]
    ! Task 1 [task1:202]
    ! Task 2 [task2:203]
  }
  {Sprint 2 [sprint2:204]
    ! Task 3 [task3:205]
  }
}

phase1:200 <- sprint1:201
phase1:200 <- sprint2:204
sprint1:201 <- task1:202
sprint1:201 <- task2:203
sprint2:204 <- task3:205

### State Combinations
! Active task [active:300]
! Blocked task [blocked-task:301] [blocked(reason: "Dependency missing", since: "2025-11-01")]
! Decided approach [decided-task:302] [decided(rationale: "Best option", on: "2025-11-02")]
! Exploring options [exploring-task:303] [exploring(since: "2025-10-30")]
! Parked idea [parked-task:304] [parking(why: "Not urgent", until: "2025-12-01")]

active:300 then blocked-task:301
blocked-task:301 then decided-task:302
decided-task:302 then exploring-task:303
exploring-task:303 then parked-task:304
