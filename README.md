# FlowScript

**Semantic notation that makes technical thought structure visible.**

When explaining complex systems, natural language buries the relationships in prose. FlowScript makes dependencies, tradeoffs, and causal chains immediately visible through simple markers like `->` `><` and `{ }`.

---

## The Problem

You're planning a technical system with an AI. You type:

> "The auth bug is causing login failures. It might be related to the session changes. We need to rollback but Jenkins is down. Should take 30 minutes. Then we can debug in staging."

The AI has to parse relationships from prose. What causes what? What's blocked? What's decided vs uncertain?

---

## The Solution

Same information with FlowScript:

```
! auth bug -> login failures
<- session changes (possible cause)

[decided] Rollback to restore service
! [blocked] Jenkins down (ETA: 30min)

After rollback:
[exploring] Debug root cause in staging
```

**Everything's explicit:**

- `!` = urgent
- `->` = causation
- `<-` = context/origin
- `[decided]` = committed action
- `[blocked]` = waiting on dependency
- `[exploring]` = uncertainty

---

## Why It Works

**FlowScript maps to how technical thinking already happens.** You're not learning arbitrary symbols - you're making your existing thought patterns visible.

**Validated across architectures:**

- ✓ Claude (Sonnet, Code) - Independent analysis: "reduced parsing time, made dependencies explicit"
- ✓ ChatGPT - "Meta-syntax exposing topology of reasoning"
- ✓ Fresh AI instances - Spontaneous adoption from spec alone
- ✓ Real technical work - Debugging sessions, architecture planning, code reviews

**20 markers. Start with 3. Add more as needed.**

---

## Quick Start

### The Basics (Learn These First)

```
->     shows what leads to what
<-     shows where something comes from
<->    shows mutual influence
><     shows tension/tradeoff
{ }    wraps complete thoughts
```

**That's enough to start.**

### Simple Example

```
users want speed -> performance matters
performance >< code simplicity
-> need to balance both

{Redis option: ++ fast risk: complex}
><
{Postgres option: ++ simple ~ speed}

[decided] Start simple, optimize later
```

---

## Documentation

**→ [Learning Guide](FLOWSCRIPT_LEARNING.md)** - Start here
**→ [Syntax Reference](FLOWSCRIPT_SYNTAX.md)** - Complete marker guide
**→ [Examples & Patterns](FLOWSCRIPT_EXAMPLES.md)** - Real-world scenarios

---

## Use Cases

**FlowScript helps when:**

- Planning system architecture (tradeoffs and dependencies)
- Debugging complex issues (showing causal chains)
- Making technical decisions (comparing options)
- Coordinating team work (blockers and timelines)
- Code reviews (design rationale)
- Technical documentation (structure over prose)

**Skip it when:**

- Natural language flows fine
- Casual conversation
- Relationships are obvious
- You'd be forcing it

**Mix them naturally** - that's the sweet spot. Mostly prose + FlowScript where it helps.

---

## Quick Reference

### Core Relations

```
->      leads to / causes
<-      comes from / context
<->     bidirectional / mutual
><      tension / tradeoff
=       equivalent to
!=      different from
```

### Common States

```
[decided]    committed, execute
[exploring]  investigating
[blocked]    waiting on dependency
[parking]    shelve for later
```

### Useful Extras

```
thought:     insight to preserve
?            question needing answer
!            urgent
++           strong agreement
{ }          thought block
```

**Start with the first 5. Add more when they're useful.**

---

## Status

**v1.0 - Minimal Release**

FlowScript emerged from real technical collaboration, refined through evidence-based testing. This is a starting point, not a finished product.

**What's included:**

- Complete syntax reference (20 markers)
- Comprehensive learning guide
- 50+ real-world examples
- This README

**What's next:**

- Community feedback
- More examples from real use
- Patterns people discover
- Syntax evolution based on friction

**Open questions:**

- Does it help others or just specific thinkers?
- What examples are missing?
- Where does it create burden vs value?

Let real usage guide evolution.

---

## Contributing

**This project needs:**

- **Real usage reports** - Does FlowScript help your technical work? Share your experience
- **Examples** - Found a great use case? Add it to the examples doc
- **Friction reports** - Where does FlowScript slow you down or confuse?
- **Pattern discoveries** - Found useful marker combinations? Document them
- **Questions** - Unclear about anything? Open an issue

**How to contribute:**

1. Try FlowScript in your technical work
2. Notice what helps vs what doesn't
3. Open an issue or PR with your findings
4. Be specific - examples beat theory

**Not needed yet:**

- Syntax highlighting (maybe later)
- IDE plugins (prove value first)
- Marketing or promotion
- Complex tooling

Keep it simple. Focus on utility.

---

## Philosophy

**FlowScript is:**

- Optional tool for technical collaboration
- Evidence-based (emerged from real use)
- Minimal by design (20 markers, start with 3)
- Hybrid by nature (mix with natural language)
- Community-driven (evolves through usage)

**FlowScript is NOT:**

- Required for AI interaction
- Complete or perfect (v1.0 = starting point)
- For everyone or everything
- Revolutionary infrastructure (just useful notation)

**The goal:** Make technical thought structure visible when it helps. Skip it when it doesn't.

---

## License

MIT License - Use freely, modify freely, share freely.

See [LICENSE](LICENSE) file for details.

---

## Credits

**Created by:**
Phillip Clapham ([@phillipclapham](https://github.com/phillipclapham)) + Claude (Anthropic AI)

**Validation:**
Cross-architecture testing with Claude (Sonnet 4.5, Claude Code), ChatGPT, and multiple AI instances. Refined through evidence-based pruning.

---

## Try It

**1. Read the [Learning Guide](FLOWSCRIPT_LEARNING.md)** (5 minutes)

**2. Start with three markers:** `->` `><` `{ }`

**3. Use them in your next technical conversation with an AI**

**4. Add more markers as they become useful**

**5. Share what you discover**

---

**Questions? Issues? Discoveries?**
→ [Open an issue](https://github.com/phillclapham/flowscript/issues)
→ Share your experience
→ Help evolve FlowScript through real use

**FlowScript works when relationships matter more than prose.**

Try it. See if it helps. Let us know.

---

*FlowScript v1.0 - October 2025*
