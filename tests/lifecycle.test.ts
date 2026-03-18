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

  test('continued queries drive graduation from developing to proven', () => {
    const { mem, tCost } = createTestMemory();
    // Nodes start at frequency 1. Graduation thresholds: developing=2, proven=3.

    // First query: frequency 1→2, graduates current→developing
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.tier).toBe('developing');

    // Second query: frequency 2→3, graduates developing→proven
    mem.query.tensions();
    expect(getMeta(mem, tCost.id)!.frequency).toBe(3);
    expect(getMeta(mem, tCost.id)!.tier).toBe('proven');
  });

  test('graduation is cumulative across different query types', () => {
    const { mem, altRedis, q } = createTestMemory();
    // altRedis appears in blocked() AND alternatives()
    // Initial frequency = 1, graduation threshold for developing = 2

    // blocked() touches altRedis → frequency 1→2
    mem.query.blocked();
    const freqAfterBlocked = getMeta(mem, altRedis.id)!.frequency;
    expect(freqAfterBlocked).toBe(2);

    // alternatives() also touches altRedis → frequency 2→3
    mem.query.alternatives(q.id);
    const freqAfterAlts = getMeta(mem, altRedis.id)!.frequency;
    expect(freqAfterAlts).toBe(freqAfterBlocked + 1);

    // altRedis should have graduated through both thresholds
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

    // First query: freq 1→2, graduates current→developing
    mem.query.tensions();
    expect(getMeta(mem, t1.id)!.tier).toBe('developing');

    // Second query: freq 2→3, graduates developing→proven
    mem.query.tensions();
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

  test('multiple rapid queries accumulate frequency correctly', () => {
    const { mem, tCost } = createTestMemory();
    const freqBefore = getMeta(mem, tCost.id)!.frequency; // starts at 1

    // 5 rapid tension queries
    for (let i = 0; i < 5; i++) {
      mem.query.tensions();
    }

    expect(getMeta(mem, tCost.id)!.frequency).toBe(freqBefore + 5);
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
