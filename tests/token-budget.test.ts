/**
 * FlowScript Token-Budgeted Serialization Tests
 *
 * Tests the Memory.toFlowScript({ maxTokens, strategy, ... }) feature.
 * Covers: all 4 strategies, preserveTiers, excludeDormant, relevance query,
 * custom token estimator, edge cases, and budget correctness.
 */

import { Memory, NodeRef, TemporalTier } from '../src/memory';

// ============================================================================
// Test Helpers
// ============================================================================

/** Helper: ISO timestamp N hours ago from now */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** Create a Memory with nodes at different tiers for testing */
function buildTieredMemory(): Memory {
  const mem = new Memory();

  // Foundation tier (highest priority in tier-priority strategy)
  const f1 = mem.statement('foundation principle one');
  const f2 = mem.statement('foundation principle two');

  // Proven tier
  const p1 = mem.thought('proven pattern alpha');
  const p2 = mem.thought('proven pattern beta');

  // Developing tier
  const d1 = mem.insight('developing observation gamma');
  const d2 = mem.insight('developing observation delta');

  // Current tier
  const c1 = mem.action('current task epsilon');
  const c2 = mem.action('current task zeta');
  const c3 = mem.action('current task eta');

  // Use relative timestamps to avoid wall-clock fragility
  // Foundation: old but preserved by default
  setTier(mem, f1.id, 'foundation', 10, hoursAgo(720)); // 30 days ago
  setTier(mem, f2.id, 'foundation', 8, hoursAgo(696));  // 29 days ago
  // Proven: old but preserved by default
  setTier(mem, p1.id, 'proven', 6, hoursAgo(480));      // 20 days ago
  setTier(mem, p2.id, 'proven', 4, hoursAgo(360));      // 15 days ago
  // Developing: recent enough to not be dormant (< 7 days)
  setTier(mem, d1.id, 'developing', 3, hoursAgo(48));   // 2 days ago
  setTier(mem, d2.id, 'developing', 2, hoursAgo(24));   // 1 day ago
  // Current: very recent
  setTier(mem, c1.id, 'current', 1, hoursAgo(12));
  setTier(mem, c2.id, 'current', 1, hoursAgo(6));
  setTier(mem, c3.id, 'current', 1, hoursAgo(1));

  return mem;
}

/** Set temporal metadata for a node (testing helper — reaches into internals) */
function setTier(
  mem: Memory,
  nodeId: string,
  tier: TemporalTier,
  frequency: number,
  lastTouched: string
): void {
  // Access the private temporalMap via any cast (test helper only)
  const temporalMap = (mem as any).temporalMap as Map<string, any>;
  const meta = temporalMap.get(nodeId);
  if (meta) {
    meta.tier = tier;
    meta.frequency = frequency;
    meta.lastTouched = lastTouched;
  }
}

/** Count approximate tokens using the default estimator (chars / 4) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ============================================================================
// Basic Behavior
// ============================================================================

describe('Token Budget — Basic', () => {
  test('no maxTokens returns full serialization', () => {
    const mem = buildTieredMemory();
    const full = mem.toFlowScript();
    const withoutBudget = mem.toFlowScript({});

    expect(full).toBe(withoutBudget);
  });

  test('very large budget returns full serialization', () => {
    const mem = buildTieredMemory();
    const full = mem.toFlowScript();
    const budgeted = mem.toFlowScript({ maxTokens: 100000 });

    expect(budgeted).toBe(full);
  });

  test('output respects maxTokens', () => {
    const mem = buildTieredMemory();
    const maxTokens = 50;
    const budgeted = mem.toFlowScript({ maxTokens });
    const tokens = estimateTokens(budgeted);

    expect(tokens).toBeLessThanOrEqual(maxTokens);
  });

  test('budget smaller than content produces truncated output', () => {
    const mem = buildTieredMemory();
    const full = mem.toFlowScript();
    const fullTokens = estimateTokens(full);

    // Budget is half of full
    const budgeted = mem.toFlowScript({ maxTokens: Math.floor(fullTokens / 2) });
    const budgetedTokens = estimateTokens(budgeted);

    expect(budgetedTokens).toBeLessThan(fullTokens);
    expect(budgeted.length).toBeLessThan(full.length);
  });

  test('empty memory returns minimal output regardless of budget', () => {
    const mem = new Memory();
    const result = mem.toFlowScript({ maxTokens: 10 });

    expect(result).toBe('\n');
  });

  test('maxTokens: 0 returns full serialization (no budget)', () => {
    const mem = new Memory();
    mem.statement('content');
    const full = mem.toFlowScript();
    const zeroBudget = mem.toFlowScript({ maxTokens: 0 });

    expect(zeroBudget).toBe(full);
  });

  test('negative maxTokens returns full serialization (no budget)', () => {
    const mem = new Memory();
    mem.statement('content');
    const full = mem.toFlowScript();
    const negativeBudget = mem.toFlowScript({ maxTokens: -1 });

    expect(negativeBudget).toBe(full);
  });
});

// ============================================================================
// Tier-Priority Strategy
// ============================================================================

describe('Token Budget — tier-priority strategy', () => {
  test('preserves foundation and proven by default', () => {
    const mem = buildTieredMemory();

    // Give a tight budget that can't fit everything
    const budgeted = mem.toFlowScript({ maxTokens: 60, strategy: 'tier-priority' });

    // Foundation and proven nodes should be present
    expect(budgeted).toContain('foundation principle one');
    expect(budgeted).toContain('foundation principle two');
    expect(budgeted).toContain('proven pattern alpha');
    expect(budgeted).toContain('proven pattern beta');
  });

  test('includes developing before current when budget allows', () => {
    const mem = buildTieredMemory();

    // Budget big enough for preserved + some developing, not all current
    const full = mem.toFlowScript();
    const fullTokens = estimateTokens(full);
    const budgeted = mem.toFlowScript({
      maxTokens: Math.floor(fullTokens * 0.8),
      strategy: 'tier-priority'
    });

    // Developing should be included (higher priority than current)
    expect(budgeted).toContain('developing observation gamma');
  });

  test('within same tier, higher frequency nodes come first', () => {
    const mem = new Memory();
    const a = mem.statement('low freq item');
    const b = mem.statement('high freq item');

    setTier(mem, a.id, 'developing', 1, hoursAgo(2));
    setTier(mem, b.id, 'developing', 5, hoursAgo(2));

    // Tight budget that can only fit one developing node
    // (no preserved tiers in this test)
    const budgeted = mem.toFlowScript({
      maxTokens: 15,
      strategy: 'tier-priority',
      preserveTiers: []
    });

    // High frequency node should be included
    expect(budgeted).toContain('high freq item');
  });
});

// ============================================================================
// Recency Strategy
// ============================================================================

describe('Token Budget — recency strategy', () => {
  test('most recent nodes included first', () => {
    const mem = new Memory();
    const old = mem.statement('old content from a long time ago now');
    const recent = mem.statement('recent content from just a moment ago');

    setTier(mem, old.id, 'current', 1, hoursAgo(2));
    setTier(mem, recent.id, 'current', 1, hoursAgo(0.1));

    // Budget for about one node (~12 tokens each)
    const budgeted = mem.toFlowScript({
      maxTokens: 14,
      strategy: 'recency',
      preserveTiers: []
    });

    expect(budgeted).toContain('recent content');
    expect(budgeted).not.toContain('old content');
  });

  test('preserved tiers still included even if old', () => {
    const mem = new Memory();
    const oldProven = mem.statement('ancient proven wisdom from the past');
    const newCurrent = mem.statement('brand new observation just recorded');

    setTier(mem, oldProven.id, 'proven', 5, hoursAgo(720)); // 30 days ago
    setTier(mem, newCurrent.id, 'current', 1, hoursAgo(1));

    const budgeted = mem.toFlowScript({
      maxTokens: 200,
      strategy: 'recency',
      preserveTiers: ['proven']
    });

    expect(budgeted).toContain('ancient proven wisdom');
    expect(budgeted).toContain('brand new observation');
  });
});

// ============================================================================
// Frequency Strategy
// ============================================================================

describe('Token Budget — frequency strategy', () => {
  test('most frequently touched nodes included first', () => {
    const mem = new Memory();
    const lowFreq = mem.statement('this is the rarely mentioned item in memory');
    const highFreq = mem.statement('this is the constantly referenced pattern');

    setTier(mem, lowFreq.id, 'current', 1, hoursAgo(1));
    setTier(mem, highFreq.id, 'current', 15, hoursAgo(1));

    // Budget for ~one node (each is ~12 tokens)
    const budgeted = mem.toFlowScript({
      maxTokens: 14,
      strategy: 'frequency',
      preserveTiers: []
    });

    expect(budgeted).toContain('constantly referenced');
    expect(budgeted).not.toContain('rarely mentioned');
  });
});

// ============================================================================
// Relevance Strategy
// ============================================================================

describe('Token Budget — relevance strategy', () => {
  test('nodes matching query included first', () => {
    const mem = new Memory();
    const redis = mem.statement('Redis is an in-memory database with fast reads');
    const postgres = mem.statement('Postgres handles complex queries well');
    const cooking = mem.statement('The recipe calls for two cups of flour');

    setTier(mem, redis.id, 'current', 1, hoursAgo(1));
    setTier(mem, postgres.id, 'current', 1, hoursAgo(1));
    setTier(mem, cooking.id, 'current', 1, hoursAgo(1));

    const budgeted = mem.toFlowScript({
      maxTokens: 30,
      strategy: 'relevance',
      relevanceQuery: 'database queries',
      preserveTiers: []
    });

    // Both database-related nodes should score higher than cooking
    expect(budgeted).toContain('database');
    expect(budgeted).not.toContain('flour');
  });

  test('falls back to frequency when no query provided', () => {
    const mem = new Memory();
    const lowFreq = mem.statement('low frequency node');
    const highFreq = mem.statement('high frequency node');

    setTier(mem, lowFreq.id, 'current', 1, hoursAgo(1));
    setTier(mem, highFreq.id, 'current', 10, hoursAgo(1));

    const budgeted = mem.toFlowScript({
      maxTokens: 15,
      strategy: 'relevance',
      // no relevanceQuery — should fall back to frequency
      preserveTiers: []
    });

    expect(budgeted).toContain('high frequency node');
  });
});

// ============================================================================
// preserveTiers Option
// ============================================================================

describe('Token Budget — preserveTiers', () => {
  test('custom preserveTiers changes which tiers are protected', () => {
    const mem = new Memory();
    const foundation = mem.statement('foundation item');
    const developing = mem.statement('developing item');

    setTier(mem, foundation.id, 'foundation', 10, hoursAgo(720));
    setTier(mem, developing.id, 'developing', 1, hoursAgo(1));

    // Only preserve developing, not foundation
    const budgeted = mem.toFlowScript({
      maxTokens: 15,
      preserveTiers: ['developing']
    });

    expect(budgeted).toContain('developing item');
  });

  test('empty preserveTiers means nothing is auto-preserved', () => {
    const mem = new Memory();
    const foundation = mem.statement('foundation item');
    const current = mem.statement('current item');

    setTier(mem, foundation.id, 'foundation', 10, hoursAgo(720));
    setTier(mem, current.id, 'current', 1, hoursAgo(1));

    // Very tight budget with no preserved tiers
    const budgeted = mem.toFlowScript({
      maxTokens: 10,
      preserveTiers: [],
      strategy: 'tier-priority'
    });

    // With tier-priority, foundation should still come first in sort order
    // but nothing is auto-preserved — budget applies to all
    const tokens = estimateTokens(budgeted);
    expect(tokens).toBeLessThanOrEqual(10);
  });
});

// ============================================================================
// excludeDormant Option
// ============================================================================

describe('Token Budget — excludeDormant', () => {
  test('dormant nodes excluded by default', () => {
    const mem = new Memory({
      temporal: { dormancy: { resting: '3d', dormant: '7d', archive: '30d' } }
    });

    const active = mem.statement('active recent node');
    const dormant = mem.statement('old dormant node');

    setTier(mem, active.id, 'current', 1, new Date().toISOString());
    // Set lastTouched to 30 days ago (well past dormant threshold)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    setTier(mem, dormant.id, 'current', 1, thirtyDaysAgo);

    const budgeted = mem.toFlowScript({ maxTokens: 200 });

    expect(budgeted).toContain('active recent node');
    expect(budgeted).not.toContain('old dormant node');
  });

  test('excludeDormant: false includes dormant nodes', () => {
    const mem = new Memory({
      temporal: { dormancy: { resting: '3d', dormant: '7d', archive: '30d' } }
    });

    const active = mem.statement('active node');
    const dormant = mem.statement('dormant node');

    setTier(mem, active.id, 'current', 1, new Date().toISOString());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    setTier(mem, dormant.id, 'current', 1, thirtyDaysAgo);

    const budgeted = mem.toFlowScript({ maxTokens: 200, excludeDormant: false });

    expect(budgeted).toContain('active node');
    expect(budgeted).toContain('dormant node');
  });
});

// ============================================================================
// Custom Token Estimator
// ============================================================================

describe('Token Budget — custom tokenEstimator', () => {
  test('uses custom estimator when provided', () => {
    const mem = new Memory();
    mem.statement('short');
    mem.statement('a much longer statement that uses more tokens');
    mem.statement('another long statement with plenty of content here');

    // Custom estimator: 1 token per character (very aggressive)
    const budgeted = mem.toFlowScript({
      maxTokens: 20,
      tokenEstimator: (text) => text.length,
      preserveTiers: []
    });

    // With 1 char = 1 token, budget of 20 chars should be very tight
    expect(budgeted.length).toBeLessThanOrEqual(25); // small margin for newlines
  });

  test('generous custom estimator includes more than default would', () => {
    const mem = new Memory();
    mem.statement('a somewhat lengthy statement for estimation testing');
    mem.statement('another statement with similar length content here');
    mem.statement('third statement also with reasonable content length');

    // Default estimator (chars/4) would be ~50 tokens for all 3.
    // Custom estimator (chars/8) = half the default = fits more in same budget.
    const defaultBudget = mem.toFlowScript({
      maxTokens: 20,
      preserveTiers: []
    });

    const customBudget = mem.toFlowScript({
      maxTokens: 20,
      tokenEstimator: (text) => Math.ceil(text.length / 8),
      preserveTiers: []
    });

    // Custom (more generous) estimator should include at least as much
    expect(customBudget.length).toBeGreaterThanOrEqual(defaultBudget.length);
  });
});

// ============================================================================
// Relationship and State Handling
// ============================================================================

describe('Token Budget — relationships and states', () => {
  test('relationships between included nodes are preserved', () => {
    const mem = new Memory();
    const a = mem.statement('cause of something');
    const b = mem.statement('effect of something');
    a.causes(b);

    const budgeted = mem.toFlowScript({ maxTokens: 200, preserveTiers: [] });

    // Both nodes + relationship should be in output
    expect(budgeted).toContain('cause of something');
    expect(budgeted).toContain('effect of something');
    expect(budgeted).toContain('->');
  });

  test('relationships to excluded nodes are dropped', () => {
    const mem = new Memory();
    const a = mem.statement('important node');
    const b = mem.statement('unimportant node that will be cut');
    a.causes(b);

    setTier(mem, a.id, 'current', 10, hoursAgo(1));
    setTier(mem, b.id, 'current', 1, hoursAgo(2));

    // Very tight budget — only room for one node
    const budgeted = mem.toFlowScript({
      maxTokens: 15,
      strategy: 'frequency',
      preserveTiers: []
    });

    expect(budgeted).toContain('important node');
    expect(budgeted).not.toContain('unimportant node');
    // No dangling relationship operator
    expect(budgeted).not.toContain('->');
  });

  test('states on included nodes are preserved', () => {
    const mem = new Memory();
    const q = mem.question('Which database?');
    const alt = mem.alternative(q, 'Redis');
    alt.decide({ rationale: 'speed critical', on: '2026-03-16' });

    const budgeted = mem.toFlowScript({ maxTokens: 200, preserveTiers: [] });

    expect(budgeted).toContain('[decided');
    expect(budgeted).toContain('speed critical');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Token Budget — edge cases', () => {
  test('budget of 1 token produces minimal or empty output', () => {
    const mem = new Memory();
    mem.statement('this is some content');

    const budgeted = mem.toFlowScript({ maxTokens: 1, preserveTiers: [] });
    const tokens = estimateTokens(budgeted);

    // Should be at most 1 token (might be empty or just a newline)
    expect(tokens).toBeLessThanOrEqual(1);
  });

  test('single node within budget', () => {
    const mem = new Memory();
    mem.statement('hello');

    const budgeted = mem.toFlowScript({ maxTokens: 100, preserveTiers: [] });

    expect(budgeted).toContain('hello');
  });

  test('preserved tiers exceed budget — includes what fits', () => {
    const mem = new Memory();
    // Create many foundation nodes
    for (let i = 0; i < 10; i++) {
      const n = mem.statement(`foundation principle number ${i} with some extra detail`);
      setTier(mem, n.id, 'foundation', 10, hoursAgo(720));
    }

    // Budget that can't fit all 10 foundation nodes
    const budgeted = mem.toFlowScript({
      maxTokens: 30,
      preserveTiers: ['foundation']
    });

    const tokens = estimateTokens(budgeted);
    // The safety net trims even preserved tiers if they exceed budget
    // (preserved tiers are "always included" but budget is the hard constraint)
    expect(tokens).toBeLessThanOrEqual(30);
  });

  test('nodes with modifiers are budgeted correctly', () => {
    const mem = new Memory();
    const n = mem.statement('urgent thing');
    n.urgent();
    n.confident();

    const budgeted = mem.toFlowScript({ maxTokens: 200, preserveTiers: [] });

    expect(budgeted).toContain('!');
    expect(budgeted).toContain('*');
    expect(budgeted).toContain('urgent thing');
  });

  test('block nodes are skipped in budgeting', () => {
    const mem = new Memory();
    mem.group('container');
    mem.statement('real content');

    const budgeted = mem.toFlowScript({ maxTokens: 200, preserveTiers: [] });

    // Block nodes are structural — serializer skips them too
    expect(budgeted).toContain('real content');
  });
});

// ============================================================================
// Integration: Full Round-Trip with Budget
// ============================================================================

describe('Token Budget — integration', () => {
  test('budgeted output is valid FlowScript that can be re-parsed', () => {
    const mem = buildTieredMemory();
    const budgeted = mem.toFlowScript({ maxTokens: 80, strategy: 'tier-priority' });

    // Should be parseable
    const reparsed = Memory.parse(budgeted);
    expect(reparsed.size).toBeGreaterThan(0);
    expect(reparsed.size).toBeLessThanOrEqual(mem.size);
  });

  test('all strategies produce valid FlowScript', () => {
    const mem = buildTieredMemory();
    const strategies = ['tier-priority', 'recency', 'frequency', 'relevance'] as const;

    for (const strategy of strategies) {
      const budgeted = mem.toFlowScript({
        maxTokens: 60,
        strategy,
        relevanceQuery: strategy === 'relevance' ? 'pattern' : undefined
      });

      // Every strategy should produce parseable output
      const reparsed = Memory.parse(budgeted);
      expect(reparsed.size).toBeGreaterThanOrEqual(0);
    }
  });

  test('queries work on budgeted (pruned) Memory', () => {
    const mem = new Memory();
    const q = mem.question('Which approach?');
    const alt1 = mem.alternative(q, 'Approach A');
    const alt2 = mem.alternative(q, 'Approach B');
    alt1.decide({ rationale: 'simpler' });

    // Serialize with budget, reparse, query
    const budgeted = mem.toFlowScript({ maxTokens: 200, preserveTiers: [] });
    const reparsed = Memory.parse(budgeted);

    // Find the question node in the reparsed graph (IDs differ after reparse)
    const questions = reparsed.findNodes(n => n.type === 'question');
    expect(questions.length).toBeGreaterThan(0);

    // Blocked query should work without crashing on the pruned graph
    const blocked = reparsed.query.blocked();
    expect(blocked).toBeDefined();
  });
});
