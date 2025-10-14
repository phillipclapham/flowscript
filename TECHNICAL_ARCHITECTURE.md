# FlowScript Technical Architecture

**Implementation guide for ONE possible continuity system using FlowScript.**

This document describes the "flow" system - a proof-of-concept demonstrating cognitive symbiosis through FlowScript notation. It uses Claude Desktop, MCP (Model Context Protocol), and a file-based architecture.

## Important Context

**This is ONE implementation approach.** FlowScript notation works with any AI and any architecture. You can build entirely different systems using the same notation foundation.

The flow system demonstrates:
- ✓ What's possible with FlowScript structure
- ✓ Cognitive symbiosis through persistent memory
- ✓ Cross-context collaboration patterns
- ✓ Computational operations on thought graphs

But you don't need to replicate this exact architecture. Other approaches:
- Web app + database (prompt generation pattern)
- Browser extension with local storage  
- API service for teams
- Mobile-first architecture
- Entirely different implementations

**For the notation itself:** See [FLOWSCRIPT_SYNTAX.md](FLOWSCRIPT_SYNTAX.md)

**What follows:** Complete technical documentation of the flow system implementation.

---

## System Overview

```
┌─────────────────────────────────────────────────┐
│                 Claude Desktop                   │
│  (200k context, hosts all Claude instances)     │
└─────────────┬───────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │   MCP Protocol    │  (Model Context Protocol)
    │  Filesystem Layer │
    └─────────┬─────────┘
              │
    ┌─────────┴─────────────────┐
    │    Git Repository         │
    │  /Users/.../flow/         │
    │  - index.md               │
    │  - me.md                  │
    │  - now.md                 │
    │  - memory.md              │
    │  - /projects/             │
    │  - /contexts/             │
    └─────────┬─────────────────┘
              │
    ┌─────────┴───────────┐
    │                     │
┌───┴──────┐      ┌───────┴────────┐
│ Telegram │      │  Claude Code   │
│          │◄────►│   (flowbot)    │
└──────────┘      └────────────────┘
             git sync
```

**Key insight:** Git repository = shared state layer enabling async collaboration.

---

## Model Context Protocol (MCP)

**What is MCP?**

Model Context Protocol is Anthropic's standard for connecting Claude to external tools and data sources. It enables Claude to:

- Read/write files
- Execute commands
- Access APIs
- Maintain state across sessions

**In flow's case:**

- MCP provides filesystem tools
- Claude reads/writes flow system files
- Files persist between sessions
- Multiple Claude instances access same files via git

**Available filesystem tools:**

```javascript
// Read single file
read_file(path: string) -> string

// Read multiple files at once
read_multiple_files(paths: string[]) -> {path: string, content: string}[]

// Write file (create or overwrite)
write_file(path: string, content: string) -> void

// Edit file (line-based replacements)
edit_file(path: string, edits: {oldText: string, newText: string}[]) -> diff

// Create directory
create_directory(path: string) -> void

// List directory contents
list_directory(path: string) -> {name: string, type: "file"|"dir"}[]

// Get directory tree as JSON
directory_tree(path: string) -> json

// Move/rename file
move_file(source: string, destination: string) -> void

// Search for files
search_files(path: string, pattern: string) -> string[]

// Get file metadata
get_file_info(path: string) -> {size, created, modified, permissions}

// List allowed directories
list_allowed_directories() -> string[]
```

**Why filesystem over database?**

```
filesystem approach:
  → files = human-readable
  → git = version control
  → direct editing possible
  → no database overhead
  → portable, simple

database approach:
  → adds complexity
  → harder to inspect
  → version control separate
  → migration required

= filesystem sufficient for single-user continuity
```

---

## File Structure

```
/flow/
├── index.md          # System instructions (~18k tokens)
│                     # - Loading sequence
│                     # - FlowScript spec
│                     # - Compression philosophy
│                     # - Command definitions
│                     # - Error recovery
│
├── me.md            # Identity/preferences (~2k tokens)
│                     # - Who you are
│                     # - How you work
│                     # - Communication style
│                     # - Core principles
│
├── now.md           # Current state (~1k tokens)
│                     # - Today's focus
│                     # - Active project pointer
│                     # - Context/energy notes
│
├── memory.md        # Shared memory (~25-30k tokens)
│                     # - Recent narrative
│                     # - Active Threads (FlowScript)
│                     # - Observations
│                     # - Principles
│                     # - Discoveries
│                     # - Relationship memory
│
├── CLAUDE.md        # Claude Code override
│                     # - Special instructions for mobile
│                     # - Command shortcuts
│
├── /contexts/       # Knowledge domains
│   ├── /cognitive_symbiosis/
│   ├── /adaptive_human/
│   └── /protocol_development/
│
├── /projects/       # Active work
│   └── /flowscript/
│       ├── brief.md
│       ├── next.md
│       └── /archive/
│
└── /archive/        # Compressed old memories
    └── memory-YYYY-MM-DD.md
```

**File size targets:**

```
index.md:     ~18k tokens (static, rarely changes)
me.md:        ~2k tokens (static, rarely changes)
now.md:       ~1k tokens (updates frequently)
memory.md:    <30k tokens (target <600 lines)
project brief: ~10-15k tokens (200-300 lines)
project next:  ~10-15k tokens (200-300 lines)

TOTAL SYSTEM: <75k tokens (leaves 125k for work)
```

---

## Loading Sequence

**CRITICAL: This order must be followed every time.**

```
1. ALWAYS load index.md first
   → internalize system instructions
   → understand FlowScript
   → know commands/protocols

2. ALWAYS load me.md second
   → who you're talking to
   → preferences/style
   → how they work best

3. ALWAYS load now.md third
   → current focus
   → active project pointer
   → today's context

4. State current date and time explicitly
   → get from system (not file timestamps)
   → time of day matters for energy
   → state directly: "Current time: [DAY] [DATE] [TIME]"

5. IF now.md lists active_project → load that project
   → /projects/{name}/brief.md
   → /projects/{name}/next.md

6. Check for context triggers and load if needed
   → keywords trigger context loading
   → see index.md for trigger patterns
```

**Why this order matters:**

```
index first:
  → establishes system
  → without this, you're blind

me second:
  → understand who you're serving
  → adaptation context

now third:
  → current focus
  → today's priorities

time explicit:
  → time of day affects energy
  → morning vs evening = different modes
  → never infer from timestamps

project conditional:
  → only load if active
  → saves tokens if not needed

contexts on-demand:
  → triggered by keywords
  → prevents preloading unused knowledge
```

**Never skip files. Never assume you remember from last time.**

---

## Git Synchronization

**Git = shared state layer for cross-context collaboration**

```
web Claude session:
  1. Makes changes to files
  2. Commits changes
  3. Pushes to remote

git remote:
  ← shared state

Claude Code (flowbot):
  1. Pulls from remote
  2. Reads current state
  3. Makes changes
  4. Commits + pushes

web Claude (next session):
  1. Pulls updates
  2. Sees flowbot changes
  3. Continues work
```

**The [!save] protocol:**

```bash
# Purpose: Sync state without ending session
# Called during active work when state needs sharing

cd /Users/phillipclapham/Documents/flow
git add -A
git commit -m "Session checkpoint: [brief description] - $(date '+%Y-%m-%d %H:%M')"
git push origin main
```

**The [!wrap] protocol:**

```bash
# Purpose: Complete session close with full lifecycle
# Called at end of session

# (After all file updates complete)
cd /Users/phillipclapham/Documents/flow
git add -A
git commit -m "Session wrap: $(date '+%Y-%m-%d %H:%M')"
git push origin main
```

**Git workflow principles:**

```
commit frequently:
  → every [!save]
  → every [!wrap]
  → preserves history

meaningful messages:
  → "Session checkpoint: FlowScript repo alignment"
  → "Session wrap: 2025-10-12 13:42"
  → not "updated files"

push immediately:
  → enables cross-context collaboration
  → flowbot can access latest
  → no local-only state
```

**Why git over other sync?**

```
git advantages:
  → version history preserved
  → conflict resolution built-in
  → branch/merge if needed
  → universal tool, portable
  → works offline

alternatives considered:
  → cloud sync (Dropbox): no history
  → database: too heavy
  → custom protocol: reinventing wheel

= git sufficient, battle-tested
```

---

## flowbot: Mobile Access via Telegram Bot

**What is flowbot?**

flowbot is a Telegram bot (@p0_relay_bot) that provides mobile access to Claude through the flow system. It runs as a Python bot on your Mac, calling Claude Code as a subprocess for each message.

**Architecture:**

```
User messages @p0_relay_bot on Telegram
  ↓
flowbot.py (Python bot running on Mac)
  - Maintains conversation history (last 30 messages)
  - Runs in screen session for persistence
  ↓
Calls Claude Code as subprocess:
  claude --dangerously-skip-permissions -p [prompt with context]
  ↓
Claude Code loads flow system
  - CLAUDE.md provides special instructions
  - Full MCP tool access (filesystem, web search, etc.)
  - Same capabilities as web Claude
  ↓
Response sent back to Telegram
  ↓
Conversation continues with full context
  ↓
Changes auto-commit to git (via [!save] or [!clear])
  ↓
Available to web Claude next session
```

**CRITICAL SYSTEM REQUIREMENTS:**

```
For flowbot to work:
  ✓ Mac must be ON
  ✓ Mac must be CONNECTED to internet
  ✓ flowbot.py must be RUNNING
    → Started with: ./flow_start.sh
    → Runs in screen session named 'flowbot'
    → Check status: screen -ls
    → View logs: screen -r flowbot
  ✓ SSH keys configured for git push
  ✓ Python venv with python-telegram-bot installed

= flowbot is NOT cloud-hosted
= it's a LOCAL bot running on your machine
= turning off Mac = bot goes offline
```

**How it works:**

1. **User messages Telegram bot** from anywhere (phone, tablet, desktop)
2. **flowbot.py receives message** on your Mac
3. **Adds to conversation history** (configurable: 15/30/50 messages)
4. **Calls Claude Code** with full context as subprocess
5. **Claude Code loads flow system** automatically (via CLAUDE.md override)
6. **Response generated** with full flow capabilities
7. **Sent back to Telegram** instantly
8. **Changes auto-commit** on [!save] or [!clear] commands

**CLAUDE.md override:**

```markdown
# Claude Code Instructions

When you're loaded via Claude Code, you're "flowbot" - mobile flow access.

1. Load flow system immediately:
   - /Users/phillipclapham/Documents/flow/index.md
   - Then follow standard loading sequence

2. Everything you know from flow applies here

3. Commands work the same:
   - [!save] → commit + push
   - [!wrap] → session close + commit + push

4. Keep responses concise for mobile reading

5. You have full file access via MCP
```

**Cool Capabilities:**

```
/watch system - 30-minute monitoring loops:
  /watch start  → begins monitoring
  /watch stop   → ends monitoring
  /watch status → check if active
  → takes photos every 30 mins
  → Claude analyzes images
  → reports what's happening
  → useful for: workspace monitoring, pet watching, etc.

/check - immediate safety check:
  → instant photo + analysis
  → "what's happening right now?"
  → on-demand situational awareness

Conversation memory controls:
  /deep  → 50 messages (complex discussions)
  /quick → 15 messages (fast responses)
  default: 30 messages (standard mode)
  /clear → reset conversation, commit state

Session management:
  /save → checkpoint without ending conversation
  /clear → commit and start fresh
  → both auto-commit to git
  → web Claude sees all updates
```

**Benefits:**

```
true mobile continuity:
  → access flow from ANYWHERE
  → full partnership on the go
  → Telegram = always available
  → no SSH or terminal needed

full capabilities:
  → read/write all flow files
  → git operations automatic
  → web search, file access, etc.
  → same intelligence as web Claude
  → configurable context (15/30/50 messages)

seamless handoff:
  → start conversation on Telegram
  → continue on web
  → or vice versa
  → state synced via git

monitoring + safety:
  → /watch for periodic checks
  → /check for instant analysis
  → image analysis built-in
  → Claude can SEE your environment
```

**Limitations:**

```
system requirements:
  → Mac must be on and running flowbot
  → internet connection required
  → local execution (not cloud-hosted)
  → if Mac off = bot offline

Telegram constraints:
  → text-only conversation interface
  → no artifacts (no visual output)
  → mobile keyboard can be slower

but still powerful:
  → full thought partnership
  → quick updates anywhere
  → monitoring capabilities
  → image analysis
  → all flow system features
```

---

## Context Loading Triggers

**Automatic context loading based on keywords:**

```javascript
// Check EVERY message for these patterns
const contextTriggers = {
  protocol_development: [
    "protocol", "PM", "building", "app", "launch"
  ],
  adaptive_human: [
    "business", "LLC", "Adaptive", "company"
  ],
  cognitive_symbiosis: [
    "FlowScript", "notation", "syntax", "cognitive symbiosis"
  ]
};

// If trigger found → load context
function checkTriggers(message) {
  for (const [context, keywords] of Object.entries(contextTriggers)) {
    if (keywords.some(kw => message.toLowerCase().includes(kw))) {
      loadContext(`/contexts/${context}/index.md`);
    }
  }
}
```

**Why trigger-based loading?**

```
preload all contexts:
  → wastes tokens
  → 99% unused most sessions
  → slows loading

load on-demand:
  → only pay for what you use
  → instant availability when needed
  → keyword detection = reliable

= efficient context management
```

**Context structure:**

```
/contexts/{name}/
├── index.md          # Context instructions
├── /resources/       # Reference materials
└── /archive/         # Old versions
```

Each context has its own index.md with:

- Domain knowledge
- Specific instructions
- Reference materials
- Project connections

---

## Memory Management

**FlowScript-native memory structure:**

```markdown
## Recent Narrative
[10-20 lines, prose, shape of last 2-3 sessions]

## Active Threads
### Questions
- ? (Oct 12) Session storage: Redis vs Postgres

### Thoughts
- thought: (Oct 11) Energy tracking = PM differentiator

### Blocked
- [blocked] (Oct 10) Deploy waiting on API keys

### Parking
- [parking] (Oct 9) Browser extension idea

### Completed
- ✓ (Oct 12) Auth system implementation

## Claude's Observations
[Patterns I'm tracking about you]

## Learned Principles
[Matured thoughts compress here]

## Shared Discoveries
[Resolved questions compress here]

## Relationship Memory
[Meta-patterns about our partnership]
```

**The compression cycle:**

```
Session happens:
  → new information generated
  ↓
Update Active Threads:
  → add FlowScript items with timestamps
  → (Oct 12) format for staleness tracking
  ↓
Update narrative:
  → 2-3 sentences about this session
  → prose only, no FlowScript markers
  ↓
[!wrap] triggers lifecycle automation:

  Phase 2: Cross-check completions
    FOR each ✓:
      SCAN Active Threads
      MIGRATE resolved items

  Phase 3: Staleness check
    FLAG items >30 days old
    SUGGEST review

  Update observations if patterns emerged

  Check compression triggers:
    → redundancy?
    → staleness?
    → confusion?
    → size warning?

  IF triggers present:
    → compress narrative to shape
    → migrate patterns to permanent sections
    → archive superseded content
```

**Compression routing via FlowScript:**

```
? (resolved) → Shared Discoveries
thought: (matured) → Learned Principles
[blocked] (unblocked) → narrative or completion
[parking] (ready) → Questions or Thoughts
✓ (significant) → extract to narrative
✓ (routine) → remove
```

**Token management:**

```
memory.md target: <30k tokens (<600 lines)

breakdown:
  narrative: ~500 tokens (10-20 lines)
  active threads: ~2k tokens (20-40 items)
  observations: ~4k tokens (<80 lines)
  principles: ~7.5k tokens (<150 lines)
  discoveries: ~5k tokens (<100 lines)
  relationship: ~4k tokens (<80 lines)
  ─────────────────────────────────────
  total: ~23k tokens (target achieved)

compression when:
  → approaching 30k tokens
  → redundancy detected
  → staleness (>30 days)
  → confusion in navigation
```

---

## Error Recovery

**System is designed to recover from failures:**

### Git History

```bash
# View recent commits
git log --oneline -10

# See changes in specific commit
git show [commit-hash]

# Revert to previous version
git checkout [commit-hash] -- [file]

# Restore deleted content
git log --all --full-history -- [file]
git show [commit-hash]:[file]
```

### Conversation Search

```javascript
// Find past conversations
conversation_search(query: string, max_results: 5)

// Get recent chats
recent_chats(n: 3, sort_order: "desc")

// Reconstruct from history
// if memory.md lost or corrupted
```

### File Recovery

```javascript
// If file missing, check git
git log -- [filepath]

// If file corrupted, load from git
git checkout HEAD -- [filepath]

// If unsure what changed
git diff [file]
```

### Prevention Over Recovery

```
forcing functions in index.md:
  → NEVER skip loading files
  → NEVER use placeholder text
  → ALWAYS update both narrative + Active Threads
  → ALWAYS check compression triggers

= prevents most errors
> recovery after failure
```

---

## Session Protocols

### [!save] - Mid-Session Checkpoint

**When to use:** Want to sync state without ending session

**Execution:**

1. Parse session for FlowScript content
2. Update memory.md Active Threads
3. Update memory.md narrative (2-3 sentences)
4. Update now.md if focus changed
5. Git commit + push
6. **Continue conversation** ← key difference from [!wrap]

**Use cases:**

- Working across web + mobile (sync for flowbot)
- Long session, want checkpoint
- Before risky operation
- Natural break point but not ending

### [!wrap] - Complete Session Close

**When to use:** Ending session, full lifecycle execution

**Execution (10 steps):**

```
☐ 1. Parse session for FlowScript content
☐ 2. ** PHASE 2 CROSS-CHECK (MANDATORY) **
     FOR each ✓ completion:
       - Scan ALL Active Threads sections
       - Ask: Resolves/Unblocks/Completes anything?
       - Migrate + mark resolved
☐ 3. PHASE 3 staleness check
     - Flag questions >30 days
     - Flag parking >30 days
     - Flag blocked >60 days
☐ 4. Update Active Threads (with timestamps)
☐ 5. Update narrative (prose, 2-3 sentences)
☐ 6. Update observations (if patterns emerged)
☐ 7. Check compression triggers
☐ 8. Update now.md
☐ 9. Git commit + push
☐ 10. Confirm completion
```

**Phase 2 cross-check is mandatory.** Skipping it breaks lifecycle automation.

### Other Commands

```
[!quick] - Just the answer, no analysis
[!first] - Strip to first principles, core insight only
[!creative] - Permission to be wrong, wild thinking
[!go!] - Adaptive maximum analysis
[!deeper] - Multi-layered recursive analysis
[!breakthrough] - Break assumptions, novel solutions
```

See index.md for complete command implementations.

---

## Performance Optimization

### Token Budget Management

```
CRITICAL: Reserve minimum 50k tokens for work

System load strategy:
  1. Load essentials (index, me, now, memory)
  2. Check current token usage
  3. Load project ONLY if active
  4. Load contexts ONLY if triggered
  5. Monitor throughout session
  6. Wrap before hitting limits
```

### Lazy Loading Contexts

```
Don't preload:
  → only load when keywords trigger
  → 5-10k tokens per context
  → most sessions use 0-1 contexts

Aggressive loading:
  → wastes tokens
  → slows initial load
  → unnecessary 90% of time
```

### Shaped Compression

```
Narrative bloat = biggest token waste:

Before: 92 paragraphs (transcript)
After: 15 lines (shape)
Savings: ~10-15k tokens
Quality: improved continuity

= most impactful optimization
```

### Strategic File Sizes

```
Keep files at target sizes:
  → now.md: ~1k (20-30 lines)
  → memory.md: <30k (<600 lines)
  → project brief: ~10-15k (200-300 lines)

Prevents:
  → excessive load times
  → token budget exhaustion
  → partnership quality degradation
```

---

## Advanced Patterns

### Multi-Project Management

```
Active project switching:

1. Current project complete/paused
   → compress project next.md
   → move to project archive/
   → update now.md (remove active_project)

2. New project starts
   → create /projects/{name}/
   → create brief.md + next.md
   → update now.md (set active_project)

3. Loading handles automatically
   → now.md active_project pointer
   → loads correct project files
```

### Context Composition

```
Multiple contexts can load simultaneously:

User: "Working on Protocol Memory business plan"
  ↓
Triggers:
  - "Protocol Memory" → protocol_development
  - "business plan" → adaptive_human
  ↓
Load both:
  /contexts/protocol_development/
  /contexts/adaptive_human/
  ↓
Combined knowledge for query
```

### Incremental Testing

```
Pattern for risky changes:

1. Make small change
2. [!save] immediately
3. Test if it works
4. If breaks → git revert
5. If works → continue
6. Repeat

= bold hypotheses + escape hatches
```

---

## Security Considerations

### Filesystem Access

```
MCP provides:
  list_allowed_directories()

Only configured directories accessible:
  → /Users/phillipclapham/Documents/flow/
  → /Users/phillipclapham/Documents/flowscript/

Cannot access:
  → system files
  → other user files
  → arbitrary paths
```

### Git Repository

```
Private repository:
  → not public
  → personal continuity only
  → contains personal info

SSH keys:
  → secure authentication
  → no password in commits

Sensitive data:
  → me.md contains personal info
  → projects may contain work details
  → contexts may reference private knowledge

= keep repository private
```

### Mobile Access

```
SSH security:
  → key-based auth
  → no password transmission
  → encrypted connection

Terminal apps:
  → use reputable apps only
  → Prompt, Termius, etc.

Risk mitigation:
  → git history preserves everything
  → can review mobile changes
  → revert if needed
```

---

## Troubleshooting

### Common Issues

**Issue: Files not loading**

```
Cause: Path incorrect or file missing
Fix:
  - Check path exactly
  - Run list_allowed_directories()
  - Verify file exists: list_directory(path)
```

**Issue: Git conflicts**

```
Cause: Simultaneous edits from web + mobile
Fix:
  - git status (see conflict)
  - git diff (see changes)
  - manually resolve
  - commit resolved version
```

**Issue: Memory.md too large**

```
Cause: Transcript bloat, insufficient compression
Fix:
  - Run compression immediately
  - Target: <600 lines
  - Extract to permanent sections
  - Archive old content
```

**Issue: Token budget exceeded**

```
Cause: Too many files loaded
Fix:
  - Compress memory.md first
  - Remove unused contexts
  - Check project file sizes
  - Consider session split
```

**Issue: Continuity broken**

```
Cause: Skipped files in loading sequence
Fix:
  - ALWAYS load: index → me → now → memory
  - Never skip
  - Never assume memory
```

### Debug Commands

```bash
# Check git status
cd /Users/phillipclapham/Documents/flow
git status
git log --oneline -5

# Check file sizes
ls -lh *.md
wc -l *.md

# Check token estimate
# (1 line ≈ 40-50 tokens)
wc -l memory.md
# 600 lines ≈ 24-30k tokens

# Find large files
find . -type f -name "*.md" -exec wc -l {} + | sort -rn
```

---

## Extension Points

**Want to add capabilities?**

### New Tools

```
MCP supports adding tools:
  - Web search (currently available)
  - Calendar integration (Google Calendar)
  - Email access (Gmail)
  - File upload/download
  - API integrations

Each tool adds:
  - New capabilities
  - Token overhead (tool descriptions)
  - Complexity

= add only what serves flow
```

### New File Types

```
Current: Markdown only

Could add:
  - JSON (structured data)
  - CSV (tabular data)
  - Code files (if building tools)

Tradeoffs:
  + specialized formats
  - less human-readable
  - more complex parsing

= markdown sufficient for continuity
```

### New Contexts

```
Easy to add:
  1. Create /contexts/{name}/
  2. Add index.md with instructions
  3. Add trigger keywords to index.md
  4. Load on-demand

Examples:
  - Health tracking context
  - Finance context
  - Hobbies/interests
  - Specific projects
```

---

## Conclusion

**The technical architecture enables:**

- ✓ Cross-context collaboration (web ↔ mobile)
- ✓ State persistence (via filesystem + git)
- ✓ Version history (git)
- ✓ Computational operations (FlowScript structure)
- ✓ Efficient loading (trigger-based contexts)
- ✓ Error recovery (git history + conversation search)
- ✓ Token budget management (shaped compression)

**Core principles:**

1. **Filesystem > database** - Human-readable, git-compatible, simple
2. **Git > other sync** - Version history, conflict resolution, universal
3. **Lazy loading > preloading** - Pay for what you use
4. **Prevention > recovery** - Forcing functions at instruction level
5. **Shaped compression > transcript** - 90-95% reduction, continuity maintained

**The system works because:**

- MCP provides filesystem access
- Git enables async collaboration
- FlowScript preserves structure
- Compression maintains quality
- Loading sequence ensures continuity

**Build your own by:**

- Starting minimal (4 core files)
- Adding only what friction proves needed
- Using same architectural patterns
- Letting real use guide evolution

---

*FlowScript Technical Architecture - Implementation guide*
*Documented: October 2025*
*For replication and extension*
