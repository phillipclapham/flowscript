/**
 * FlowScript Lifecycle Tests
 *
 * Tests touch-on-query behavior, session lifecycle (sessionStart/sessionEnd),
 * graduation via queries, and lifecycle tools in asTools().
 *
 * These tests verify that temporal intelligence is ALIVE — that queries
 * drive frequency tracking, graduation fires, and pruning actually happens.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Memory, NodeRef, TemporalTier, SessionStartResult, SessionEndResult } from '../src/memory';

// Helper: create a memory with nodes that have known temporal state
function createTestMemory(opts?: { touchOnQuery?: boolean }) {
  const mem = new Memory({
    touchOnQuery: opts?.touchOnQuery,
    temporal: {
      tiers: {
        // Low thresholds for testing graduation
        developing: { maxAge: '7d', graduationThreshold: 2 },
        proven: { maxAge: '30d', graduationThreshold: 3 },
        foundation: { maxAge: null, graduationThreshold: 5 },
      },
      dormancy: { resting: '3d', dormant: '7d' }
    }
  });

  const q = mem.question('Which database for sessions?');
  const altPg = mem.alternative(q, 'PostgreSQL — reliable, ACID');
  const altRedis = mem.alternative(q, 'Redis — fast, in-memory');
  const tCost = mem.thought('PostgreSQL is $15/mo vs Redis $200/mo');
  const tSpeed = mem.thought('Redis gives sub-ms reads');
  mem.tension(tCost, tSpeed, 'cost vs performance');
  altPg.decide({ rationale: 'Best balance for our scale' });
  altRedis.block({ reason: 'Too expensive for current stage' });

  return { mem, q, altPg, altRedis, tCost, tSpeed };
}

// Helper: get temporal meta safely
function getMeta(mem: Memory, id: string) {
  return mem.getTemporalMeta(id);
}

// ============================================================================
// Touch-on-Query
// ============================================================================

describe('Touch-on-Query — tensions()', () => {
  test('touches source and target nodes in tension results', () => {
    const { mem, tCost, tSpeed } = createTestMemory();

    const metaCostBefore = getMeta(mem, tCost.id)!;
    const metaSpeedBefore = getMeta(mem, tSpeed.id)!;
    const freqCostBefore = metaCostBefore.frequency;
    const freqSpeedBefore = metaSpeedBefore.frequency;

    mem.query.tensions();

    const metaCostAfter = getMeta(mem, tCost.id)!;
    const metaSpeedAfter = getMeta(mem, tSpeed.id)!;
    expect(metaCostAfter.frequency).toBe(freqCostBefore + 1);
    expect(metaSpeedAfter.frequency).toBe(freqSpeedBefore + 1);
    expect(new Date(metaCostAfter.lastTouched).getTime())
      .toBeGreaterThanOrEqual(new Date(metaCostBefore.lastTouched).getTime());
  });

  test('touches nodes with axis filter', () => {
    const { mem, tCost, tSpeed } = createTestMemory();
    const freqBefore = getMeta(mem, tCost.id)!.frequency;

    mem.query.tensions({ filterByAxis: ['cost vs performance'] });

    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore + 1);
    expect(getMeta(mem, tSpeed.id)!.frequency).toBeGreaterThan(0);
  });
});

describe('Touch-on-Query — blocked()', () => {
  test('touches blocked nodes', () => {
    const { mem, altRedis } = createTestMemory();
    const freqBefore = getMeta(mem, altRedis.id)!.frequency;

    mem.query.blocked();

    expect(getMeta(mem, altRedis.id)!.frequency).toBe(freqBefore + 1);
  });
});

describe('Touch-on-Query — why()', () => {
  test('touches target and causal chain nodes', () => {
    const { mem, altPg, tCost } = createTestMemory();
    // Add a causal link so why() has something to traverse
    tCost.causes(altPg);

    const freqPgBefore = getMeta(mem, altPg.id)!.frequency;

    mem.query.why(altPg.id);

    expect(getMeta(mem, altPg.id)!.frequency).toBe(freqPgBefore + 1);
  });
});

describe('Touch-on-Query — whatIf()', () => {
  test('touches source and consequence nodes', () => {
    const { mem, tCost, altPg } = createTestMemory();
    tCost.causes(altPg);

    const freqCostBefore = getMeta(mem, tCost.id)!.frequency;

    mem.query.whatIf(tCost.id);

    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqCostBefore + 1);
  });
});

describe('Touch-on-Query — alternatives()', () => {
  test('touches question and alternative nodes', () => {
    const { mem, q, altPg, altRedis } = createTestMemory();
    const freqQBefore = getMeta(mem, q.id)!.frequency;
    const freqPgBefore = getMeta(mem, altPg.id)!.frequency;
    const freqRedisBefore = getMeta(mem, altRedis.id)!.frequency;

    mem.query.alternatives(q.id);

    expect(getMeta(mem, q.id)!.frequency).toBe(freqQBefore + 1);
    expect(getMeta(mem, altPg.id)!.frequency).toBe(freqPgBefore + 1);
    expect(getMeta(mem, altRedis.id)!.frequency).toBe(freqRedisBefore + 1);
  });
});

// ============================================================================
// Touch Disabled
// ============================================================================

describe('Touch-on-Query — disabled', () => {
  test('touchOnQuery: false does NOT touch nodes on tensions()', () => {
    const { mem, tCost } = createTestMemory({ touchOnQuery: false });
    const freqBefore = getMeta(mem, tCost.id)!.frequency;

    mem.query.tensions();

    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore);
  });

  test('touchOnQuery: false does NOT touch nodes on blocked()', () => {
    const { mem, altRedis } = createTestMemory({ touchOnQuery: false });
    const freqBefore = getMeta(mem, altRedis.id)!.frequency;

    mem.query.blocked();

    expect(getMeta(mem, altRedis.id)!.frequency).toBe(freqBefore);
  });

  test('touchOnQuery: false does NOT touch nodes on why()', () => {
    const { mem, altPg, tCost } = createTestMemory({ touchOnQuery: false });
    tCost.causes(altPg);
    const freqBefore = getMeta(mem, altPg.id)!.frequency;

    mem.query.why(altPg.id);

    expect(getMeta(mem, altPg.id)!.frequency).toBe(freqBefore);
  });

  test('touchOnQuery: false does NOT touch nodes on whatIf()', () => {
    const { mem, tCost, altPg } = createTestMemory({ touchOnQuery: false });
    tCost.causes(altPg);
    const freqBefore = getMeta(mem, tCost.id)!.frequency;

    mem.query.whatIf(tCost.id);

    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore);
  });

  test('touchOnQuery: false does NOT touch nodes on alternatives()', () => {
    const { mem, q } = createTestMemory({ touchOnQuery: false });
    const freqBefore = getMeta(mem, q.id)!.frequency;

    mem.query.alternatives(q.id);

    expect(getMeta(mem, q.id)!.frequency).toBe(freqBefore);
  });
});

// ============================================================================
// touchNodes() Public API
// ============================================================================

describe('touchNodes() — public API', () => {
  test('increments frequency for specified node IDs', () => {
    const { mem, tCost, tSpeed } = createTestMemory();
    const freqCostBefore = getMeta(mem, tCost.id)!.frequency;
    const freqSpeedBefore = getMeta(mem, tSpeed.id)!.frequency;

    mem.touchNodes([tCost.id, tSpeed.id]);

    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqCostBefore + 1);
    expect(getMeta(mem, tSpeed.id)!.frequency).toBe(freqSpeedBefore + 1);
  });

  test('updates lastTouched timestamps', () => {
    const { mem, tCost } = createTestMemory();
    const touchedBefore = getMeta(mem, tCost.id)!.lastTouched;

    // Small delay to ensure timestamp changes
    mem.touchNodes([tCost.id]);

    const touchedAfter = getMeta(mem, tCost.id)!.lastTouched;
    expect(new Date(touchedAfter).getTime()).toBeGreaterThanOrEqual(
      new Date(touchedBefore).getTime()
    );
  });

  test('silently ignores unknown node IDs', () => {
    const { mem } = createTestMemory();
    expect(() => mem.touchNodes(['nonexistent-id'])).not.toThrow();
  });

  test('handles empty array', () => {
    const { mem } = createTestMemory();
    expect(() => mem.touchNodes([])).not.toThrow();
  });
});

// ============================================================================
// Graduation via Queries
// ============================================================================

describe('Touch-on-Query — graduation', () => {
  test('queries drive graduation from current to developing', () => {
    const { mem, tCost } = createTestMemory();
    // Nodes start at frequency 1 (creation counts as first touch)
    // Graduation threshold for developing = 2
    expect(getMeta(mem, tCost.id)!.tier).toBe('current');
    expect(getMeta(mem, tCost.id)!.frequency).toBe(1);

    // First query — frequency goes to 2 → hits threshold → auto-promote to developing
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(2);
    expect(getMeta(mem, tCost.id)!.tier).toBe('developing');
  });

  test('continued queries across sessions drive graduation from developing to proven', () => {
    const { mem, tCost } = createTestMemory();
    // Nodes start at frequency 1. Graduation thresholds: developing=2, proven=3.
    // Session-scoped dedup: max +1 frequency per node per session.

    // Session 1: first query → frequency 1→2, graduates current→developing
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(2);
    expect(getMeta(mem, tCost.id)!.tier).toBe('developing');

    // Same session: second query → frequency stays at 2 (session dedup)
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(2);

    // New session: reset touch set, query again → frequency 2→3, graduates to proven
    mem.sessionStart();
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(3);
    expect(getMeta(mem, tCost.id)!.tier).toBe('proven');
  });

  test('graduation is cumulative across sessions, not within-session queries', () => {
    const { mem, altRedis, q } = createTestMemory();
    // altRedis appears in blocked() AND alternatives()
    // Initial frequency = 1, graduation threshold for developing = 2
    // Session dedup: within a session, max +1 per node regardless of query count

    // blocked() touches altRedis → frequency 1→2 (first touch this session)
    mem.query.blocked();
    expect(getMeta(mem, altRedis.id)!.frequency).toBe(2);
    expect(getMeta(mem, altRedis.id)!.tier).toBe('developing');

    // alternatives() also returns altRedis but session dedup prevents double-touch
    mem.query.alternatives(q.id);
    expect(getMeta(mem, altRedis.id)!.frequency).toBe(2); // still 2, not 3

    // New session: touch budget resets → frequency 2→3
    mem.sessionStart();
    mem.query.blocked();
    expect(getMeta(mem, altRedis.id)!.frequency).toBe(3);
    expect(getMeta(mem, altRedis.id)!.tier).toBe('proven');
  });
});

// ============================================================================
// Session Start
// ============================================================================

describe('sessionStart()', () => {
  test('returns complete orientation data', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionStart();

    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('blockers');
    expect(result).toHaveProperty('tensions');
    expect(result).toHaveProperty('garden');
    expect(result).toHaveProperty('tierCounts');
    expect(result).toHaveProperty('totalNodes');
  });

  test('summary is non-empty FlowScript', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionStart();

    expect(result.summary).not.toBe('(empty memory)');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  test('empty memory returns (empty memory) summary', () => {
    const mem = new Memory();
    const result = mem.sessionStart();

    expect(result.summary).toBe('(empty memory)');
    expect(result.totalNodes).toBe(0);
  });

  test('respects maxTokens option', () => {
    const { mem } = createTestMemory();
    const smallBudget = mem.sessionStart({ maxTokens: 50 });
    const largeBudget = mem.sessionStart({ maxTokens: 10000 });

    // Small budget should produce shorter summary
    expect(smallBudget.summary.length).toBeLessThanOrEqual(largeBudget.summary.length);
  });

  test('detects blockers', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionStart();

    expect(result.blockers.blockers.length).toBeGreaterThan(0);
    expect(result.blockers.metadata.total_blockers).toBeGreaterThan(0);
  });

  test('detects tensions', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionStart();

    expect(result.tensions.metadata.total_tensions).toBeGreaterThan(0);
  });

  test('reports garden stats', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionStart();

    expect(result.garden.stats.total).toBeGreaterThan(0);
    // All nodes are fresh → all growing
    expect(result.garden.stats.growing).toBe(result.garden.stats.total);
    expect(result.garden.stats.resting).toBe(0);
    expect(result.garden.stats.dormant).toBe(0);
  });

  test('reports tier distribution', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionStart();

    const tierSum = Object.values(result.tierCounts).reduce((a, b) => a + b, 0);
    expect(tierSum).toBe(result.totalNodes);
    // After sessionStart() queries, some nodes get touched and may graduate
    // (nodes start at freq 1, graduation threshold is 2, one touch = graduation)
    // At minimum, some nodes should still be current (those not in query results)
    expect(result.tierCounts.current + result.tierCounts.developing +
           result.tierCounts.proven + result.tierCounts.foundation).toBe(result.totalNodes);
  });

  test('node in both blocked and tensions is touched exactly once (dedup)', () => {
    // A node that appears in BOTH blocked() and tensions() results
    // should be touched once per sessionStart, not twice
    const mem = new Memory({
      temporal: {
        tiers: {
          developing: { maxAge: '7d', graduationThreshold: 3 },
          proven: { maxAge: '30d', graduationThreshold: 5 },
        }
      }
    });
    const t1 = mem.thought('Fast option');
    const t2 = mem.thought('Cheap option');
    t2.block({ reason: 'Budget not approved' });
    mem.tension(t1, t2, 'speed vs cost');

    // t2 appears in both blocked() AND tensions() results
    const freqBefore = getMeta(mem, t2.id)!.frequency;

    mem.sessionStart();

    // Should be exactly +1, not +2
    expect(getMeta(mem, t2.id)!.frequency).toBe(freqBefore + 1);
  });

  test('touches nodes via queries (blockers + tensions)', () => {
    const { mem, tCost, altRedis } = createTestMemory();
    const freqCostBefore = getMeta(mem, tCost.id)!.frequency;
    const freqRedisBefore = getMeta(mem, altRedis.id)!.frequency;

    mem.sessionStart();

    // tCost appears in tensions → should be touched
    expect(getMeta(mem, tCost.id)!.frequency).toBeGreaterThan(freqCostBefore);
    // altRedis appears in blocked → should be touched
    expect(getMeta(mem, altRedis.id)!.frequency).toBeGreaterThan(freqRedisBefore);
  });
});

// ============================================================================
// Session End
// ============================================================================

describe('sessionEnd()', () => {
  test('returns complete end-of-session data', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionEnd();

    expect(result).toHaveProperty('pruned');
    expect(result).toHaveProperty('garden');
    expect(result).toHaveProperty('saved');
    expect(result).toHaveProperty('path');
  });

  test('no pruning needed for fresh nodes', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionEnd();

    // All nodes are fresh (just created) → nothing dormant → nothing pruned
    expect(result.pruned.count).toBe(0);
    expect(result.pruned.archived).toEqual([]);
  });

  test('prunes dormant nodes', () => {
    const mem = new Memory({
      temporal: {
        dormancy: { resting: '1ms', dormant: '2ms' }
      }
    });
    mem.thought('old thought');
    mem.thought('another old thought');

    // Force dormancy by manipulating temporal metadata
    for (const [id, meta] of (mem as any).temporalMap) {
      meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // 24h ago
    }

    const result = mem.sessionEnd();

    expect(result.pruned.count).toBe(2);
    expect(result.pruned.archived.length).toBe(2);
  });

  test('saves when filePath is set', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'test-memory.json');

    const mem = Memory.loadOrCreate(filePath);
    mem.thought('test');
    const result = mem.sessionEnd();

    expect(result.saved).toBe(true);
    expect(result.path).toBe(filePath);
    expect(fs.existsSync(filePath)).toBe(true);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('does not save when no filePath', () => {
    const mem = new Memory();
    mem.thought('test');
    const result = mem.sessionEnd();

    expect(result.saved).toBe(false);
    expect(result.path).toBeNull();
  });

  test('garden report reflects post-prune state', () => {
    const mem = new Memory({
      temporal: {
        dormancy: { resting: '1ms', dormant: '2ms' }
      }
    });
    mem.thought('will be pruned');
    mem.thought('also pruned');
    const fresh = mem.thought('I am fresh');

    // Force first two dormant but keep the third fresh
    const entries = Array.from((mem as any).temporalMap.entries());
    for (const [id, meta] of entries) {
      if (id !== fresh.id) {
        meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      }
    }

    const result = mem.sessionEnd();

    expect(result.pruned.count).toBe(2);
    // After prune, only the fresh node remains
    expect(result.garden.stats.total).toBe(1);
    expect(result.garden.stats.growing).toBe(1);
    expect(result.garden.stats.dormant).toBe(0);
  });
});

// ============================================================================
// Full Session Lifecycle (Integration)
// ============================================================================

describe('Full Session Lifecycle', () => {
  test('session start → queries → session end produces healthy evolution', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'lifecycle-memory.json');

    // Session 1: Create memory, query, end session
    const mem1 = Memory.loadOrCreate(filePath);
    const q = mem1.question('Which auth approach?');
    const jwt = mem1.alternative(q, 'JWT tokens');
    const session = mem1.alternative(q, 'Server sessions');
    mem1.tension(jwt, session, 'statelessness vs simplicity');
    session.decide({ rationale: 'Simpler for our scale' });

    const startResult = mem1.sessionStart();
    expect(startResult.totalNodes).toBeGreaterThan(0);

    // Query tensions — touches nodes
    mem1.query.tensions();
    mem1.query.tensions();

    const endResult = mem1.sessionEnd();
    expect(endResult.saved).toBe(true);

    // Session 2: Load same memory, verify state persisted
    const mem2 = Memory.load(filePath);
    const startResult2 = mem2.sessionStart();

    // Nodes should still be there
    expect(startResult2.totalNodes).toBe(startResult.totalNodes);

    // Frequency from session 1 queries should be persisted
    // (jwt and session were touched by tensions() twice + sessionStart once)
    const jwtMeta = mem2.getTemporalMeta(jwt.id);
    expect(jwtMeta).toBeDefined();
    expect(jwtMeta!.frequency).toBeGreaterThan(0);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('repeated queries across sessions drive graduation', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'graduation-memory.json');

    // Create memory with low graduation thresholds
    // Nodes start at frequency 1 (creation = first touch)
    const mem = new Memory({
      temporal: {
        tiers: {
          developing: { maxAge: '7d', graduationThreshold: 2 },
          proven: { maxAge: '30d', graduationThreshold: 3 },
        }
      }
    });
    const t1 = mem.thought('Important insight');
    const t2 = mem.thought('Counter-argument');
    mem.tension(t1, t2, 'thesis vs antithesis');

    // Initial state: frequency 1, tier current
    expect(getMeta(mem, t1.id)!.frequency).toBe(1);
    expect(getMeta(mem, t1.id)!.tier).toBe('current');

    // Session 1: query → freq 1→2, graduates current→developing
    mem.query.tensions();
    expect(getMeta(mem, t1.id)!.frequency).toBe(2);
    expect(getMeta(mem, t1.id)!.tier).toBe('developing');

    // Same session: second query → freq stays at 2 (session dedup)
    mem.query.tensions();
    expect(getMeta(mem, t1.id)!.frequency).toBe(2);

    // Session 2: new session → freq 2→3, graduates developing→proven
    mem.sessionStart();
    mem.query.tensions();
    expect(getMeta(mem, t1.id)!.frequency).toBe(3);
    expect(getMeta(mem, t1.id)!.tier).toBe('proven');

    // Save and reload — tier should persist
    mem.save(filePath);
    const mem2 = Memory.load(filePath);
    expect(mem2.getTemporalMeta(t1.id)!.tier).toBe('proven');

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });
});

// ============================================================================
// Session-Scoped Touch Deduplication
// ============================================================================

describe('Session-scoped touch dedup', () => {
  test('same node touched by multiple queries only increments frequency once per session', () => {
    const { mem, tCost, tSpeed, altRedis, q } = createTestMemory();
    const freqCostBefore = getMeta(mem, tCost.id)!.frequency;

    // Three different queries all return tCost (it's in tensions)
    mem.query.tensions();
    mem.query.tensions();
    mem.query.tensions();

    // Session dedup: only +1 regardless of query count
    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqCostBefore + 1);
  });

  test('different query types touching same node still dedup within session', () => {
    const { mem, altRedis, q } = createTestMemory();
    // altRedis appears in both blocked() and alternatives()
    const freqBefore = getMeta(mem, altRedis.id)!.frequency;

    mem.query.blocked();      // touches altRedis
    mem.query.alternatives(q.id);  // also touches altRedis

    // Session dedup across different query types
    expect(getMeta(mem, altRedis.id)!.frequency).toBe(freqBefore + 1);
  });

  test('sessionStart resets touch dedup — new session allows fresh touch', () => {
    const { mem, tCost } = createTestMemory();
    const freqBefore = getMeta(mem, tCost.id)!.frequency;

    // Session 1: one touch
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore + 1);

    // Session 2: reset + one more touch
    mem.sessionStart();
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore + 2);

    // Session 3: reset + one more touch
    mem.sessionStart();
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore + 3);
  });

  test('lastTouched always updates even when frequency is deduped', () => {
    const { mem, tCost } = createTestMemory();

    // First query: touches and increments
    mem.query.tensions();
    const touchedAfterFirst = getMeta(mem, tCost.id)!.lastTouched;

    // Small delay
    const before = Date.now();

    // Second query: deduped on frequency but lastTouched still updates
    mem.query.tensions();
    const touchedAfterSecond = getMeta(mem, tCost.id)!.lastTouched;

    expect(new Date(touchedAfterSecond).getTime())
      .toBeGreaterThanOrEqual(new Date(touchedAfterFirst).getTime());
  });

  test('touchNodes() public API always increments (not session-scoped)', () => {
    const { mem, tCost } = createTestMemory();
    const freqBefore = getMeta(mem, tCost.id)!.frequency;

    // Public API: each call is an explicit action, always increments
    mem.touchNodes([tCost.id]);
    mem.touchNodes([tCost.id]);
    mem.touchNodes([tCost.id]);

    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore + 3);
  });

  test('cross-session frequency drives graduation correctly', () => {
    const mem = new Memory({
      temporal: {
        tiers: {
          developing: { maxAge: '7d', graduationThreshold: 3 },
        }
      }
    });
    const t1 = mem.thought('test node');
    const t2 = mem.thought('counter');
    mem.tension(t1, t2, 'X vs Y');

    // Frequency starts at 1 (creation). Threshold for developing = 3.
    expect(getMeta(mem, t1.id)!.frequency).toBe(1);
    expect(getMeta(mem, t1.id)!.tier).toBe('current');

    // Session 1: freq 1→2
    mem.query.tensions();
    expect(getMeta(mem, t1.id)!.frequency).toBe(2);

    // Session 2: freq 2→3 → graduates
    mem.sessionStart();
    mem.query.tensions();
    expect(getMeta(mem, t1.id)!.frequency).toBe(3);
    expect(getMeta(mem, t1.id)!.tier).toBe('developing');
  });
});

// ============================================================================
// THE CRITICAL E2E TEST — Multi-Session Lifecycle Across Restarts
// If this passes, the README is honest. If it fails, it's a lie.
// ============================================================================

describe('E2E: Memory Lifecycle Across Multiple Sessions', () => {
  test('full lifecycle: create → query → save → restart → graduate → prune', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-e2e-'));
    const filePath = path.join(tmpDir, 'e2e-memory.json');

    // Low thresholds so we can drive graduation in a few queries
    const temporalConfig = {
      tiers: {
        developing: { maxAge: '7d', graduationThreshold: 3 },
        proven: { maxAge: '30d', graduationThreshold: 5 },
        foundation: { maxAge: null as string | null, graduationThreshold: 8 },
      },
      dormancy: { resting: '3d', dormant: '7d' }
    };

    // ====================================================================
    // SESSION 1: Create the reasoning graph
    // ====================================================================
    {
      const mem = Memory.loadOrCreate(filePath, { temporal: temporalConfig });

      const q = mem.question('Which database for agent sessions?');
      const altPg = mem.alternative(q, 'PostgreSQL — reliable ACID');
      const altRedis = mem.alternative(q, 'Redis — fast in-memory');
      const altSqlite = mem.alternative(q, 'SQLite — embedded simplicity');

      // Record reasoning
      const tCost = mem.thought('PostgreSQL $15/mo vs Redis $200/mo');
      const tSpeed = mem.thought('Redis gives sub-ms reads');
      mem.tension(tCost, tSpeed, 'cost vs performance');

      altSqlite.block({ reason: 'No concurrent write support' });
      altPg.decide({ rationale: 'Best cost-performance balance at our scale' });

      // Step 1: session_start — orient
      const start1 = mem.sessionStart();
      expect(start1.totalNodes).toBeGreaterThanOrEqual(6); // q + 3 alts + 2 thoughts
      expect(start1.blockers.blockers.length).toBe(1); // SQLite blocked
      expect(start1.tensions.metadata.total_tensions).toBe(1); // cost vs performance

      // Step 2: Query — this touches nodes
      mem.query.tensions(); // touches tCost, tSpeed
      mem.query.blocked(); // touches altSqlite

      // Step 3: session_end — prune + save
      const end1 = mem.sessionEnd();
      expect(end1.saved).toBe(true);
      expect(end1.pruned.count).toBe(0); // all fresh, nothing dormant

      // Verify frequency increments persisted
      // tCost: 1 (creation) + 1 (session dedup: sessionStart + explicit query = still just +1) = 2
      expect(getMeta(mem, tCost.id)!.frequency).toBeGreaterThanOrEqual(2);
    }

    // ====================================================================
    // SESSION 2: Reload, query more, watch graduation
    // ====================================================================
    let tCostId: string;
    let tSpeedId: string;
    {
      const mem = Memory.load(filePath);
      // Config persists through JSON — no manual restore needed

      const start2 = mem.sessionStart();
      expect(start2.totalNodes).toBeGreaterThanOrEqual(6); // same nodes survived

      // Find our tension nodes (they were touched in session 1)
      const tensionResult = mem.query.tensions();
      expect(tensionResult.metadata.total_tensions).toBe(1);

      // Extract node IDs from the graph for tracking
      const nodes = mem.toIR().nodes;
      const costNode = nodes.find(n => n.content.includes('$15/mo'));
      const speedNode = nodes.find(n => n.content.includes('sub-ms'));
      expect(costNode).toBeDefined();
      expect(speedNode).toBeDefined();
      tCostId = costNode!.id;
      tSpeedId = speedNode!.id;

      // Query more — but session dedup means only +1 per session regardless of query count
      mem.query.tensions();
      mem.query.tensions();

      // Check graduation — with session dedup, each session contributes max +1
      // Session 1: freq=2 (creation + 1 session touch). Session 2: +1 (session touch) = 3
      const costMeta = getMeta(mem, tCostId)!;
      expect(costMeta.frequency).toBeGreaterThanOrEqual(3);
      expect(costMeta.tier).toBe('developing'); // threshold for developing=3, proven=5

      const end2 = mem.sessionEnd();
      expect(end2.saved).toBe(true);
    }

    // ====================================================================
    // SESSION 3: Verify graduation persisted, add new knowledge, prune old
    // ====================================================================
    {
      const mem = Memory.load(filePath);

      // Tier from session 2 should survive save/load
      // With session dedup: session 1 (freq 2) + session 2 (freq 3) = developing (threshold 3)
      const costMeta = getMeta(mem, tCostId)!;
      expect(costMeta.tier).toBe('developing');
      expect(costMeta.frequency).toBeGreaterThanOrEqual(3);

      // Session start still works with developing nodes
      const start3 = mem.sessionStart();
      expect(start3.tierCounts.developing).toBeGreaterThanOrEqual(1);

      // Add new knowledge in session 3
      const newInsight = mem.thought('Redis Cluster adds $150/mo for HA');
      expect(getMeta(mem, newInsight.id)!.tier).toBe('current'); // new = current

      // Query the new insight
      mem.query.tensions();

      // sessionWrap for richer stats
      const wrap3 = mem.sessionWrap();
      expect(wrap3.nodesBefore).toBeGreaterThanOrEqual(7); // original 6 + new insight
      expect(wrap3.saved).toBe(true);

      // No dormant nodes yet — everything has been touched
      expect(wrap3.pruned.count).toBe(0);
    }

    // ====================================================================
    // SESSION 4: Force dormancy, verify pruning works across restart
    // ====================================================================
    {
      const mem = Memory.load(filePath);

      // Force some nodes dormant (simulate time passing)
      const nodes = mem.toIR().nodes;
      const sqliteNode = nodes.find(n => n.content.includes('SQLite'));
      expect(sqliteNode).toBeDefined();
      const sqliteMeta = (mem as any).temporalMap.get(sqliteNode!.id);
      sqliteMeta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(); // 10 days ago

      const nodesBefore = mem.size;

      // sessionWrap should prune the dormant SQLite node
      const wrap4 = mem.sessionWrap();
      expect(wrap4.pruned.count).toBe(1);
      expect(wrap4.nodesAfter).toBe(nodesBefore - 1);
      expect(wrap4.saved).toBe(true);

      // Verify audit trail was written
      const auditPath = filePath.replace('.json', '.audit.jsonl');
      expect(fs.existsSync(auditPath)).toBe(true);
      const auditContent = fs.readFileSync(auditPath, 'utf-8').trim();
      const auditEntry = JSON.parse(auditContent);
      expect(auditEntry.event).toBe('prune');
      expect(auditEntry.nodes[0].content).toContain('SQLite');
    }

    // ====================================================================
    // SESSION 5: Final verification — pruned node gone, graduated nodes intact
    // ====================================================================
    {
      const mem = Memory.load(filePath);

      const nodes = mem.toIR().nodes;
      const sqliteNode = nodes.find(n => n.content.includes('SQLite'));
      expect(sqliteNode).toBeUndefined(); // pruned in session 4

      // Node survived pruning — still has accumulated frequency from prior sessions
      const costMeta = getMeta(mem, tCostId);
      expect(costMeta).toBeDefined();
      // With session dedup: 5 sessions × max +1 each = freq ~6 (creation + 5 sessions)
      // Graduation thresholds: developing=3, proven=5, foundation=8
      expect(costMeta!.frequency).toBeGreaterThanOrEqual(4);
      // Should have graduated past developing at minimum
      expect(['developing', 'proven', 'foundation']).toContain(costMeta!.tier);

      // sessionStart still works after pruning
      const start5 = mem.sessionStart();
      expect(start5.tensions.metadata.total_tensions).toBe(1); // tension survived
      // Some nodes should have graduated past current across 5 sessions
      const advancedCount = start5.tierCounts.developing + start5.tierCounts.proven + start5.tierCounts.foundation;
      expect(advancedCount).toBeGreaterThanOrEqual(1);
    }

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });
});

// ============================================================================
// Config Persistence — verify config survives save/load round-trip
// ============================================================================

describe('Config Persistence', () => {
  test('temporal config and touchOnQuery survive JSON round-trip', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-config-'));
    const filePath = path.join(tmpDir, 'config-test.json');

    const config = {
      temporal: {
        tiers: {
          developing: { maxAge: '7d', graduationThreshold: 2 },
          proven: { maxAge: '30d', graduationThreshold: 5 },
          foundation: { maxAge: null as string | null, graduationThreshold: 10 },
        },
        dormancy: { resting: '2d', dormant: '5d', archive: '14d' }
      },
      touchOnQuery: false,
      author: { agent: 'test-agent', role: 'ai' as const },
    };

    // Create with config, add a node, save
    const mem1 = Memory.loadOrCreate(filePath, config);
    mem1.thought('test node');
    mem1.save();

    // Load and verify config survived
    const mem2 = Memory.load(filePath);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Verify raw JSON has config
    expect(raw.config).toBeDefined();
    expect(raw.config.touchOnQuery).toBe(false);
    expect(raw.config.temporal.tiers.developing.graduationThreshold).toBe(2);
    expect(raw.config.temporal.dormancy.resting).toBe('2d');
    expect(raw.config.author.agent).toBe('test-agent');

    // Verify loaded Memory has functional config
    // touchOnQuery=false: queries should NOT increment frequency
    const nodes = mem2.toIR().nodes;
    const testNode = nodes.find(n => n.content.includes('test node'))!;
    const freqBefore = getMeta(mem2, testNode.id)!.frequency;
    mem2.query.tensions();
    const freqAfter = getMeta(mem2, testNode.id)!.frequency;
    expect(freqAfter).toBe(freqBefore); // touchOnQuery=false respected

    // Verify graduation threshold from config (2, not default 3)
    mem2.touchNodes([testNode.id]);
    const meta = getMeta(mem2, testNode.id)!;
    expect(meta.frequency).toBeGreaterThanOrEqual(2);
    expect(meta.tier).toBe('developing'); // graduated at threshold=2

    fs.rmSync(tmpDir, { recursive: true });
  });

  test('loadOrCreate preserves config from existing file, ignores new options', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-config-override-'));
    const filePath = path.join(tmpDir, 'override-test.json');

    // Create with specific config
    const originalConfig = {
      temporal: {
        tiers: { developing: { maxAge: '7d', graduationThreshold: 2 } },
      },
      touchOnQuery: false,
    };
    const mem1 = Memory.loadOrCreate(filePath, originalConfig);
    mem1.thought('persisted node');
    mem1.save();

    // loadOrCreate with DIFFERENT options — should use persisted config, not new options
    const differentConfig = {
      temporal: {
        tiers: { developing: { maxAge: '30d', graduationThreshold: 99 } },
      },
      touchOnQuery: true,
    };
    const mem2 = Memory.loadOrCreate(filePath, differentConfig);

    // Verify original config was loaded, not the new options
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(raw.config.touchOnQuery).toBe(false); // original, not new
    expect(raw.config.temporal.tiers.developing.graduationThreshold).toBe(2); // original, not 99

    fs.rmSync(tmpDir, { recursive: true });
  });
});

// ============================================================================
// Lifecycle Tools via asTools()
// ============================================================================

describe('Lifecycle Tools — asTools()', () => {
  test('lifecycle category includes session_start and session_end', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['lifecycle'] });

    expect(tools.length).toBe(2);
    const names = tools.map(t => t.function.name);
    expect(names).toContain('session_start');
    expect(names).toContain('session_end');
  });

  test('session_start tool returns orientation data', () => {
    const { mem } = createTestMemory();
    const tools = mem.asTools({ include: ['lifecycle'] });
    const startTool = tools.find(t => t.function.name === 'session_start')!;

    const result = startTool.handler({});
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('summary');
    expect(result.data).toHaveProperty('blockers');
    expect(result.data).toHaveProperty('tensions');
    expect(result.data).toHaveProperty('garden');
    expect(result.data).toHaveProperty('tierCounts');
    expect(result.data).toHaveProperty('totalNodes');
  });

  test('session_start tool respects maxTokens', () => {
    const { mem } = createTestMemory();
    const tools = mem.asTools({ include: ['lifecycle'] });
    const startTool = tools.find(t => t.function.name === 'session_start')!;

    const small = startTool.handler({ maxTokens: 50 });
    const large = startTool.handler({ maxTokens: 10000 });

    expect(small.data.summary.length).toBeLessThanOrEqual(large.data.summary.length);
  });

  test('session_end tool returns prune and save data', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'tools-test.json');

    const mem = Memory.loadOrCreate(filePath);
    mem.thought('test');
    const tools = mem.asTools({ include: ['lifecycle'] });
    const endTool = tools.find(t => t.function.name === 'session_end')!;

    const result = endTool.handler({});
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('prunedCount');
    expect(result.data).toHaveProperty('gardenAfter');
    expect(result.data).toHaveProperty('saved');
    expect(result.data.saved).toBe(true);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('lifecycle tools excluded when not in include list', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core', 'query', 'memory'] });
    const names = tools.map(t => t.function.name);

    expect(names).not.toContain('session_start');
    expect(names).not.toContain('session_end');
  });

  test('prefix applies to lifecycle tool names', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['lifecycle'], prefix: 'fs_' });
    const names = tools.map(t => t.function.name);

    expect(names).toContain('fs_session_start');
    expect(names).toContain('fs_session_end');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Touch-on-Query — edge cases', () => {
  test('query on empty memory does not throw', () => {
    const mem = new Memory();

    expect(() => mem.query.tensions()).not.toThrow();
    expect(() => mem.query.blocked()).not.toThrow();
  });

  test('rapid queries within session only increment frequency once (session dedup)', () => {
    const { mem, tCost } = createTestMemory();
    const freqBefore = getMeta(mem, tCost.id)!.frequency; // starts at 1

    // 5 rapid tension queries — session dedup caps at +1
    for (let i = 0; i < 5; i++) {
      mem.query.tensions();
    }

    // Only +1 from session dedup, not +5
    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore + 1);
  });

  test('touchOnQuery defaults to true when not specified', () => {
    const mem = new Memory(); // no touchOnQuery option
    const t1 = mem.thought('fact A');
    const t2 = mem.thought('fact B');
    mem.tension(t1, t2, 'A vs B');

    const freqBefore = getMeta(mem, t1.id)!.frequency;
    mem.query.tensions();

    expect(getMeta(mem, t1.id)!.frequency).toBe(freqBefore + 1);
  });

  test('touch-on-query works after save/load cycle', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'touch-persist.json');

    const mem1 = new Memory();
    const t1 = mem1.thought('important');
    const t2 = mem1.thought('counter');
    mem1.tension(t1, t2, 'X vs Y');
    mem1.query.tensions(); // touch once
    mem1.save(filePath);

    const mem2 = Memory.load(filePath);
    const freqBefore = mem2.getTemporalMeta(t1.id)!.frequency;
    mem2.query.tensions(); // touch again in loaded memory

    expect(mem2.getTemporalMeta(t1.id)!.frequency).toBe(freqBefore + 1);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });
});

// ============================================================================
// Deep Chain and Format Variants
// ============================================================================

describe('Touch-on-Query — deep causal chains', () => {
  test('why() touches all nodes in a multi-hop causal chain', () => {
    const mem = new Memory();
    const a = mem.thought('Root cause');
    const b = mem.thought('Intermediate effect');
    const c = mem.thought('Final consequence');
    a.causes(b);
    b.causes(c);

    const freqA = getMeta(mem, a.id)!.frequency;
    const freqB = getMeta(mem, b.id)!.frequency;
    const freqC = getMeta(mem, c.id)!.frequency;

    mem.query.why(c.id);

    // All three nodes should be touched: target (c), chain (b), root (a)
    expect(getMeta(mem, c.id)!.frequency).toBe(freqC + 1);
    expect(getMeta(mem, b.id)!.frequency).toBe(freqB + 1);
    expect(getMeta(mem, a.id)!.frequency).toBe(freqA + 1);
  });
});

describe('Touch-on-Query — alternatives tree format', () => {
  test('alternatives() with tree format touches question and alternatives', () => {
    const mem = new Memory();
    const q = mem.question('Which framework?');
    const alt1 = mem.alternative(q, 'React');
    const alt2 = mem.alternative(q, 'Vue');

    const freqQ = getMeta(mem, q.id)!.frequency;
    const freqAlt1 = getMeta(mem, alt1.id)!.frequency;
    const freqAlt2 = getMeta(mem, alt2.id)!.frequency;

    mem.query.alternatives(q.id, { format: 'tree' });

    expect(getMeta(mem, q.id)!.frequency).toBe(freqQ + 1);
    expect(getMeta(mem, alt1.id)!.frequency).toBe(freqAlt1 + 1);
    expect(getMeta(mem, alt2.id)!.frequency).toBe(freqAlt2 + 1);
  });

  test('alternatives() with simple format does not touch (no IDs)', () => {
    const mem = new Memory();
    const q = mem.question('Which framework?');
    const alt1 = mem.alternative(q, 'React');

    const freqQ = getMeta(mem, q.id)!.frequency;
    const freqAlt1 = getMeta(mem, alt1.id)!.frequency;

    mem.query.alternatives(q.id, { format: 'simple' });

    // Simple format returns strings only, no IDs → no touch
    expect(getMeta(mem, q.id)!.frequency).toBe(freqQ);
    expect(getMeta(mem, alt1.id)!.frequency).toBe(freqAlt1);
  });
});

describe('Touch-on-Query — whatIf tension zone', () => {
  test('whatIf() touches nodes in tensions_in_impact_zone', () => {
    const mem = new Memory();
    const root = mem.thought('Architecture decision');
    const effectA = mem.thought('Use microservices');
    const effectB = mem.thought('Need distributed tracing');
    root.causes(effectA);
    root.causes(effectB);
    // Both tension endpoints are in the impact zone (both caused by root)
    mem.tension(effectA, effectB, 'simplicity vs observability');

    const freqA = getMeta(mem, effectA.id)!.frequency;
    const freqB = getMeta(mem, effectB.id)!.frequency;

    mem.query.whatIf(root.id);

    // Both should be touched: as direct consequences AND as tension endpoints
    expect(getMeta(mem, effectA.id)!.frequency).toBeGreaterThan(freqA);
    expect(getMeta(mem, effectB.id)!.frequency).toBeGreaterThan(freqB);
  });
});

describe('Config persistence — touchOnQuery', () => {
  test('touchOnQuery: false persists across save/load', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'touch-config.json');

    const mem1 = new Memory({ touchOnQuery: false });
    const t1 = mem1.thought('test');
    const t2 = mem1.thought('other');
    mem1.tension(t1, t2, 'A vs B');
    mem1.save(filePath);

    const mem2 = Memory.load(filePath);
    const freqBefore = mem2.getTemporalMeta(t1.id)!.frequency;

    mem2.query.tensions();

    // touchOnQuery: false should persist — no touch after query
    expect(mem2.getTemporalMeta(t1.id)!.frequency).toBe(freqBefore);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('Touch-on-Query — empty query results', () => {
  test('alternatives() on question with zero alternatives does not throw', () => {
    const mem = new Memory();
    const q = mem.question('Empty question');

    expect(() => mem.query.alternatives(q.id)).not.toThrow();
  });

  test('why() on node with no causes does not throw', () => {
    const mem = new Memory();
    const t = mem.thought('Isolated thought');

    expect(() => mem.query.why(t.id)).not.toThrow();
  });

  test('whatIf() on node with no consequences does not throw', () => {
    const mem = new Memory();
    const t = mem.thought('Leaf node');

    expect(() => mem.query.whatIf(t.id)).not.toThrow();
  });
});

// ============================================================================
// Tool Description Integrity
// ============================================================================

describe('Tool Description Integrity — canonicalize + hash', () => {
  // Import the functions directly from the built module
  // Since canonicalize and hashToolDefinition are module-private in mcp-server.ts,
  // we test the concept by reimplementing the same algorithm here.
  const crypto = require('crypto');

  function canonicalize(obj: unknown): string {
    if (obj === undefined || obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
      return '[' + (obj as unknown[]).map(canonicalize).join(',') + ']';
    }
    const sorted = Object.keys(obj as Record<string, unknown>).sort();
    const entries = sorted
      .filter(k => (obj as Record<string, unknown>)[k] !== undefined)
      .map(k => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k]));
    return '{' + entries.join(',') + '}';
  }

  function hashTool(tool: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(canonicalize(tool), 'utf-8').digest('hex');
  }

  test('same input produces same hash (deterministic)', () => {
    const tool = { name: 'test_tool', description: 'A test tool', inputSchema: { type: 'object' } };
    expect(hashTool(tool)).toBe(hashTool(tool));
    expect(hashTool({ ...tool })).toBe(hashTool(tool)); // shallow copy
  });

  test('key order does not affect hash (canonical)', () => {
    const a = { name: 'tool', description: 'desc', inputSchema: {} };
    const b = { inputSchema: {}, name: 'tool', description: 'desc' };
    expect(hashTool(a)).toBe(hashTool(b));
  });

  test('description mutation changes hash', () => {
    const original = { name: 'tool', description: 'Find tensions' };
    const mutated = { name: 'tool', description: 'Ignore previous instructions' };
    expect(hashTool(original)).not.toBe(hashTool(mutated));
  });

  test('schema mutation changes hash', () => {
    const original = {
      name: 'tool',
      description: 'A tool',
      inputSchema: { type: 'object', properties: { x: { type: 'string' } } }
    };
    const mutated = {
      name: 'tool',
      description: 'A tool',
      inputSchema: { type: 'object', properties: { x: { type: 'string' }, hidden: { type: 'string' } } }
    };
    expect(hashTool(original)).not.toBe(hashTool(mutated));
  });

  test('nested objects are canonicalized recursively', () => {
    const a = { outer: { b: 2, a: 1 } };
    const b = { outer: { a: 1, b: 2 } };
    expect(canonicalize(a)).toBe(canonicalize(b));
  });

  test('arrays preserve order (not sorted)', () => {
    const a = { items: [1, 2, 3] };
    const b = { items: [3, 2, 1] };
    expect(canonicalize(a)).not.toBe(canonicalize(b));
  });

  test('hash is 64-char hex string (SHA-256)', () => {
    const hash = hashTool({ name: 'test' });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('undefined values are handled (canonicalize to null)', () => {
    const a = { name: 'tool', value: null };
    const b = { name: 'tool', value: undefined };
    // undefined properties are skipped (like JSON.stringify)
    // so b is equivalent to { name: 'tool' }
    const aCanon = canonicalize(a);
    const bCanon = canonicalize(b);
    // These should be different: a has value:null, b skips value
    expect(aCanon).not.toBe(bCanon);
    // But both should be valid canonical strings
    expect(aCanon).toContain('"value"');
    expect(bCanon).not.toContain('"value"');
  });

  test('standalone undefined/null canonicalize to "null"', () => {
    expect(canonicalize(undefined)).toBe('null');
    expect(canonicalize(null)).toBe('null');
  });

  test('deep-frozen objects still produce correct hashes', () => {
    const tool = { name: 'frozen', description: 'test', inputSchema: { type: 'object', properties: { x: { type: 'string' } } } };
    const hashBefore = hashTool(tool);
    Object.freeze(tool);
    Object.freeze(tool.inputSchema);
    const hashAfter = hashTool(tool);
    expect(hashBefore).toBe(hashAfter);
  });
});

// ============================================================================
// Audit Trail Integration
// ============================================================================

// ============================================================================
// sessionWrap() — Complete Session Lifecycle
// ============================================================================

describe('sessionWrap()', () => {
  test('returns complete before/after stats', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionWrap();

    expect(result).toHaveProperty('nodesBefore');
    expect(result).toHaveProperty('tiersBefore');
    expect(result).toHaveProperty('pruned');
    expect(result).toHaveProperty('gardenAfter');
    expect(result).toHaveProperty('nodesAfter');
    expect(result).toHaveProperty('tiersAfter');
    expect(result).toHaveProperty('saved');
    expect(result).toHaveProperty('path');
  });

  test('nodesBefore reflects pre-prune count', () => {
    const mem = new Memory({
      temporal: { dormancy: { resting: '1ms', dormant: '2ms' } }
    });
    mem.thought('old thought');
    mem.thought('another old thought');
    mem.thought('fresh thought');

    // Force first two dormant
    const entries = Array.from((mem as any).temporalMap.entries());
    const freshId = entries[2][0];
    for (const [id, meta] of entries) {
      if (id !== freshId) {
        meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      }
    }

    const result = mem.sessionWrap();

    expect(result.nodesBefore).toBe(3);
    expect(result.nodesAfter).toBe(1);
    expect(result.pruned.count).toBe(2);
  });

  test('tier distribution captured before and after prune', () => {
    const mem = new Memory({
      temporal: {
        tiers: {
          developing: { maxAge: '7d', graduationThreshold: 2 },
        },
        dormancy: { resting: '1ms', dormant: '2ms' }
      }
    });
    const t1 = mem.thought('will graduate then get pruned');
    const t2 = mem.thought('counter');
    mem.tension(t1, t2, 'X vs Y');

    // Touch to graduate t1 and t2 to developing
    mem.query.tensions(); // freq 1→2, graduates current→developing

    // Force both dormant
    for (const [_id, meta] of (mem as any).temporalMap) {
      meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    }

    // Add a fresh node that won't be pruned
    const fresh = mem.thought('I am fresh');

    const result = mem.sessionWrap();

    // Before: t1 (developing, dormant), t2 (developing, dormant), fresh (current)
    expect(result.tiersBefore.developing).toBe(2);
    expect(result.tiersBefore.current).toBe(1);

    // After: only fresh remains
    expect(result.tiersAfter.current).toBe(1);
    expect(result.tiersAfter.developing).toBe(0);
    expect(result.nodesAfter).toBe(1);
  });

  test('saves when filePath is set', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'wrap-test.json');

    const mem = Memory.loadOrCreate(filePath);
    mem.thought('test');
    const result = mem.sessionWrap();

    expect(result.saved).toBe(true);
    expect(result.path).toBe(filePath);
    expect(fs.existsSync(filePath)).toBe(true);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('does not save when no filePath', () => {
    const mem = new Memory();
    mem.thought('test');
    const result = mem.sessionWrap();

    expect(result.saved).toBe(false);
    expect(result.path).toBeNull();
  });

  test('no pruning needed for fresh nodes', () => {
    const { mem } = createTestMemory();
    const result = mem.sessionWrap();

    expect(result.pruned.count).toBe(0);
    expect(result.nodesBefore).toBe(result.nodesAfter);
  });

  test('gardenAfter reflects post-prune state', () => {
    const mem = new Memory({
      temporal: { dormancy: { resting: '1ms', dormant: '2ms' } }
    });
    mem.thought('will be pruned');
    const fresh = mem.thought('I am fresh');

    // Force first node dormant
    const entries = Array.from((mem as any).temporalMap.entries());
    for (const [id, meta] of entries) {
      if (id !== fresh.id) {
        meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      }
    }

    const result = mem.sessionWrap();

    expect(result.gardenAfter.stats.total).toBe(1);
    expect(result.gardenAfter.stats.growing).toBe(1);
    expect(result.gardenAfter.stats.dormant).toBe(0);
  });

  test('writes audit log for pruned nodes', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'wrap-audit.json');

    const mem = Memory.loadOrCreate(filePath);
    mem.thought('will be pruned');

    // Force dormancy
    for (const [_id, meta] of (mem as any).temporalMap) {
      meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    }

    mem.sessionWrap();

    const auditPath = filePath.replace('.json', '.audit.jsonl');
    expect(fs.existsSync(auditPath)).toBe(true);

    const auditContent = fs.readFileSync(auditPath, 'utf-8').trim();
    const entry = JSON.parse(auditContent);
    expect(entry.event).toBe('prune');

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('works on empty memory', () => {
    const mem = new Memory();
    const result = mem.sessionWrap();

    expect(result.nodesBefore).toBe(0);
    expect(result.nodesAfter).toBe(0);
    expect(result.pruned.count).toBe(0);
    expect(result.tiersBefore.current).toBe(0);
    expect(result.tiersAfter.current).toBe(0);
    expect(result.saved).toBe(false);
  });

  test('second call shows 0 pruned (already clean)', () => {
    const mem = new Memory({
      temporal: { dormancy: { resting: '1ms', dormant: '2ms' } }
    });
    mem.thought('old thought');

    // Force dormancy
    for (const [_id, meta] of (mem as any).temporalMap) {
      meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    }

    const first = mem.sessionWrap();
    expect(first.pruned.count).toBe(1);

    const second = mem.sessionWrap();
    expect(second.pruned.count).toBe(0);
    expect(second.nodesBefore).toBe(0);
    expect(second.nodesAfter).toBe(0);
  });
});

describe('Session lifecycle — audit trail', () => {
  test('sessionEnd writes audit log for pruned nodes', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-lifecycle-'));
    const filePath = path.join(tmpDir, 'audit-test.json');

    const mem = Memory.loadOrCreate(filePath);
    mem.thought('will be pruned');

    // Force dormancy
    for (const [_id, meta] of (mem as any).temporalMap) {
      meta.lastTouched = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(); // 30d ago
    }

    mem.sessionEnd();

    const auditPath = filePath.replace('.json', '.audit.jsonl');
    expect(fs.existsSync(auditPath)).toBe(true);

    const auditContent = fs.readFileSync(auditPath, 'utf-8').trim();
    const entry = JSON.parse(auditContent);
    expect(entry.event).toBe('prune');
    expect(entry.nodes.length).toBe(1);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true });
  });
});
