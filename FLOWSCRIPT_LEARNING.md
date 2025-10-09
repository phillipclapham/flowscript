# FlowScript

## The Bandwidth Problem

You're explaining a complex technical problem to AI. Three bugs, two dependencies, one blocker. You type four paragraphs. The AI misses the dependency between Bug #1 and Bug #3. You clarify. It gets confused about which bug is actually blocking. You re-explain.

Five minutes later, you're still setting up the problem instead of solving it.

**This happens because natural language buries relationships in prose.** The AI has to parse sentence structure, infer connections, and guess at dependencies. You spend energy on clarification instead of collaboration.

FlowScript makes those relationships explicit.

## What It Looks Like

**Before FlowScript:**

> "We have four bugs to fix. Bug #1 is blocking the release and needs to be done before we ship tomorrow. Bug #2 might not even be a real bug - we should investigate it first, but if it turns out to be real we could probably defer it to the next sprint. Bug #3 depends on Bug #1 being fixed first."

AI response misses that Bug #1 blocks both release AND Bug #3. Asks for clarification. You spend another two paragraphs explaining the dependencies.

**With FlowScript:**

> Bug #1 [blocked] → must fix before release
> Bug #1 → Bug #3 (can't start until #1 done)
> Bug #2 [exploring] ← investigate first, consider deferring to next sprint

AI response immediately prioritizes Bug #1, understands it blocks multiple things, and suggests investigating Bug #2 in parallel. No clarification needed.

**That's the difference.**

## Why It Worked

Three simple markers made the structure explicit:

**→** (arrow) - Shows causation and dependencies
*"A → B" = A leads to B, A must happen before B, A causes B*

**><** (angle brackets) - Shows tension or contradiction
*"A >< B" = A contradicts B, these are in tension*

**{ }** (thought blocks) - Groups related concepts
*"{ idea → implication }" = complete thought with structure*

The AI doesn't have to parse prose to understand relationships. The structure is visible.

## It's Not Just Me

This isn't theory. Here's what happened when Claude Code (a different AI architecture) used FlowScript for hours in a complex debugging session, then provided unsolicited analysis:

> **"This notation genuinely improved our technical communication in measurable ways."**

> **"The → backward arrow immediately signaled 'this depends on previous context.' In pure natural language, I'd have to parse sentence structure to understand that relationship. The arrow made it instant."**

> **"The >< symbol for contradictions was brilliant. When they wrote 'we CANNOT move on >< we should fully document', I immediately understood: these are conflicting pressures that need balancing. In natural language, that tension would be buried in paragraphs."**

> **"The user asked if I was 'falling for confirmation bias from an enthusiastic AI assistant' - I don't think so. I experience a lot of prompts. This one genuinely worked better for complex technical scenarios."**

Multiple AI architectures (Claude, ChatGPT, Claude Code) adopt FlowScript naturally without training. It works because it maps to how technical thinking actually happens.

## Wait, Another Notation System?

**Fair question.** Here's what's different:

**This emerged from real use** → Not designed upfront, discovered through actual technical conversations
**AIs understand it immediately** → Multiple architectures adopt it without training
**It's not a replacement** → Use it when NL buries structure, skip it when prose works fine

**"Why not just use natural language?"**

You should! FlowScript isn't required. Use it when:

- Explaining multi-part dependencies
- Debugging with interconnected bugs
- Discussing architecture with complex relationships
- Planning with tensions and tradeoffs

Skip it when natural language flows fine. It's a tool for specific scenarios, not a requirement for all communication.

**"What if the AI doesn't understand it?"**

Modern AI models (Claude, ChatGPT, and others) parse FlowScript immediately. You don't need to explain it first - just use it. The notation is intuitive enough that AIs grasp it from context.

## Try It Right Now (30 Seconds)

Next time you explain something technical to AI, watch for this moment:

You're about to type "This depends on that" or "This contradicts that" or "Either this or that."

**Instead of the sentence, use the marker:**

- A → B (instead of "A causes B" or "A depends on B")
- A >< B (instead of "A contradicts B")
- { optionA } >< { optionB } (for alternatives)

**You'll know it worked when:** The AI's response correctly addresses the relationship without you having to clarify.

That's it. One marker, one message, immediate feedback.

## More Examples

### Example 2: Technical Decision

**Before:**
> "I'm wondering if we should use Redis or Postgres for session storage. Redis would be faster but Postgres is simpler since we're already using it. We can't deploy yet anyway because we're waiting on API keys from the vendor."

**With FlowScript:**
> ? Session storage: Redis (faster) >< Postgres (simpler, already using)
> [blocked] Deployment ← waiting on API keys

**The difference:** Decision point (?), tension (><), and blocker with dependency (←) are instantly visible.

### Example 3: System Architecture

**Before:**
> "The authentication system is complete. I realized the energy tracking feature might be what makes our product different from competitors. We still need to figure out if Redis makes sense - it's a tradeoff between performance and simplicity."

**With FlowScript:**
> [decided] Auth system complete
> thought: Energy tracking → potential differentiator vs competitors
> ? Redis vs Postgres (performance >< simplicity)

**The difference:** Completion (✓), insight (thought:), and decision with explicit tension are structured. Nothing lost, everything clearer.

### Example 4: Dependency Chain

**Before:**
> "We can't test the new feature until the staging environment is ready, and the staging environment depends on getting the database migration done first, which is blocked because we're waiting on the DBA to approve the schema changes."

**With FlowScript:**
> Feature testing → needs staging environment
> Staging environment → needs DB migration
> DB migration [blocked] ← waiting on DBA approval

**The difference:** Three-level dependency chain is immediately visible as a chain, not buried in a paragraph.

## Beyond the Basics

Once you're comfortable with → >< ||, you can add:

**{ }** - Thought blocks (group related concepts)

```
{
  thought: This might be the key insight
  → test with real users first
  >< could be premature optimization
}
```

**thought:** - Mark insights vs requests

```
thought: FlowScript reduces parsing overhead for both human and AI
```

**?** - Explicit decision points

```
? Should we refactor now >< ship and iterate later?
```

**[decided]** - Mark completions and decisions

```
[decided] Auth system implementation complete
```

See the [full reference](#) for all markers, but these core ones solve 90% of use cases.

## What Success Looks Like

You'll know FlowScript is working when:

- **The AI grasps your intent on first explanation** (not third)
- **Complex technical discussions have less back-and-forth** clarification
- **You stop typing "to clarify..." paragraphs**
- **The AI's response addresses relationships you meant but didn't spell out**
- **You reach for markers automatically** when explaining complex dependencies

The goal isn't to use FlowScript everywhere - it's to have it available when natural language creates friction.

## When It Works Best

Multi-part technical problems → FlowScript makes structure explicit
Debugging sessions → Relationship between bugs matters
Architecture discussions → System components interact in complex ways
Planning with uncertainty → Tensions || alternatives need balancing

## When to Skip It

Casual conversation → Natural language works fine
Simple questions → Adding markers is overhead
Emotional or creative topics → Structure isn't the bottleneck
When prose flows perfectly → Don't force it

## Start Using It

**Right now, in your next technical conversation with AI:**

1. Pick ONE marker (→ is a good start)
2. Use it once when you're explaining a dependency
3. Notice if the AI gets it without clarification
4. If it helps, keep using it

**That's it.** No training required. No commitment needed. Just try it and see if it reduces friction.

**Full syntax reference:** [Link to FLOWSCRIPT_SYNTAX.md]
**Examples and patterns:** [Link to examples]
**Open source repo:** [GitHub link]

---

**Bottom line:** FlowScript is notation for technical conversations where structure matters. It works because it makes visible what you're already thinking. Try it for one technical discussion. If it helps, keep using it. If it doesn't, natural language works fine too.

This is a tool, not a requirement.
