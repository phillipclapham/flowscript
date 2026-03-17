/**
 * FlowScript asTools() Tests
 *
 * Tests the auto-generated function calling tool definitions from the Memory API.
 * Covers: tool schema structure, all 11 tools (core + query + memory),
 * handler execution, error handling, options (include, prefix), and integration.
 */

import { Memory, MemoryTool, NodeRef } from '../src/memory';

// ============================================================================
// Tool Schema Structure
// ============================================================================

describe('asTools — Schema Structure', () => {
  test('returns all 11 tools by default', () => {
    const mem = new Memory();
    const tools = mem.asTools();

    expect(tools.length).toBe(12);
  });

  test('each tool has valid schema structure', () => {
    const mem = new Memory();
    const tools = mem.asTools();

    for (const tool of tools) {
      expect(tool.type).toBe('function');
      expect(tool.function).toBeDefined();
      expect(tool.function.name).toBeTruthy();
      expect(tool.function.description).toBeTruthy();
      expect(tool.function.parameters).toBeDefined();
      expect(tool.function.parameters.type).toBe('object');
      expect(tool.function.parameters.properties).toBeDefined();
      expect(typeof tool.handler).toBe('function');
    }
  });

  test('tool names are unique', () => {
    const mem = new Memory();
    const tools = mem.asTools();
    const names = tools.map(t => t.function.name);
    const unique = new Set(names);

    expect(unique.size).toBe(names.length);
  });

  test('all tool names are snake_case', () => {
    const mem = new Memory();
    const tools = mem.asTools();

    for (const tool of tools) {
      expect(tool.function.name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

// ============================================================================
// Options: include
// ============================================================================

describe('asTools — include option', () => {
  test('include core only', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });

    expect(tools.length).toBe(5);
    const names = tools.map(t => t.function.name);
    expect(names).toContain('add_node');
    expect(names).toContain('add_alternative');
    expect(names).toContain('relate_nodes');
    expect(names).toContain('set_state');
    expect(names).toContain('remove_state');
  });

  test('include query only', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['query'] });

    expect(tools.length).toBe(5);
    const names = tools.map(t => t.function.name);
    expect(names).toContain('query_why');
    expect(names).toContain('query_what_if');
    expect(names).toContain('query_tensions');
    expect(names).toContain('query_blocked');
    expect(names).toContain('query_alternatives');
  });

  test('include memory only', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['memory'] });

    expect(tools.length).toBe(2);
    const names = tools.map(t => t.function.name);
    expect(names).toContain('get_memory');
    expect(names).toContain('search_nodes');
  });

  test('include multiple categories', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core', 'query'] });

    expect(tools.length).toBe(10);
  });
});

// ============================================================================
// Options: prefix
// ============================================================================

describe('asTools — prefix option', () => {
  test('applies prefix to all tool names', () => {
    const mem = new Memory();
    const tools = mem.asTools({ prefix: 'memory_' });

    for (const tool of tools) {
      expect(tool.function.name).toMatch(/^memory_/);
    }
    expect(tools.map(t => t.function.name)).toContain('memory_add_node');
    expect(tools.map(t => t.function.name)).toContain('memory_query_why');
  });

  test('no prefix by default', () => {
    const mem = new Memory();
    const tools = mem.asTools();

    expect(tools[0].function.name).not.toMatch(/^memory_/);
  });
});

// ============================================================================
// Core Tools: add_node
// ============================================================================

describe('asTools — add_node', () => {
  function getAddNode(mem: Memory): MemoryTool {
    return mem.asTools({ include: ['core'] }).find(t => t.function.name === 'add_node')!;
  }

  test('creates a thought node', () => {
    const mem = new Memory();
    const tool = getAddNode(mem);

    const result = tool.handler({ type: 'thought', content: 'Redis is fast' });

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('thought');
    expect(result.data.content).toBe('Redis is fast');
    expect(result.data.nodeId).toBeTruthy();
    expect(mem.size).toBe(1);
  });

  test('creates all supported node types', () => {
    const mem = new Memory();
    const tool = getAddNode(mem);
    const types = ['statement', 'thought', 'question', 'action', 'insight', 'completion'];

    for (const type of types) {
      const result = tool.handler({ type, content: `test ${type}` });
      expect(result.success).toBe(true);
      expect(result.data.type).toBe(type);
    }
    expect(mem.size).toBe(6);
  });

  test('returns error for unknown node type', () => {
    const mem = new Memory();
    const tool = getAddNode(mem);

    const result = tool.handler({ type: 'invalid', content: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown node type');
  });

  test('applies modifiers when specified', () => {
    const mem = new Memory();
    const tool = getAddNode(mem);

    const result = tool.handler({ type: 'thought', content: 'critical insight', modifiers: ['urgent', 'confident'] });

    expect(result.success).toBe(true);
    expect(result.data.modifiers).toEqual(['urgent', 'confident']);

    // Verify modifiers actually applied to the node
    const node = mem.getNode(result.data.nodeId);
    expect(node?.modifiers).toContain('urgent');
    expect(node?.modifiers).toContain('high_confidence');
  });

  test('works without modifiers (optional)', () => {
    const mem = new Memory();
    const tool = getAddNode(mem);

    const result = tool.handler({ type: 'thought', content: 'plain idea' });

    expect(result.success).toBe(true);
    expect(result.data.modifiers).toEqual([]);
  });

  test('deduplicates identical nodes', () => {
    const mem = new Memory();
    const tool = getAddNode(mem);

    const r1 = tool.handler({ type: 'thought', content: 'same idea' });
    const r2 = tool.handler({ type: 'thought', content: 'same idea' });

    expect(r1.data.nodeId).toBe(r2.data.nodeId);
    expect(mem.size).toBe(1);
  });
});

// ============================================================================
// Core Tools: add_alternative
// ============================================================================

describe('asTools — add_alternative', () => {
  test('creates alternative linked to question', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const addAlt = tools.find(t => t.function.name === 'add_alternative')!;

    const q = addNode.handler({ type: 'question', content: 'Which database?' });
    const alt = addAlt.handler({ questionId: q.data.nodeId, content: 'Redis' });

    expect(alt.success).toBe(true);
    expect(alt.data.type).toBe('alternative');
    expect(alt.data.questionId).toBe(q.data.nodeId);
  });

  test('returns error for non-question node', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const addAlt = tools.find(t => t.function.name === 'add_alternative')!;

    const t = addNode.handler({ type: 'thought', content: 'not a question' });
    const result = addAlt.handler({ questionId: t.data.nodeId, content: 'bad' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('non-question');
  });
});

// ============================================================================
// Core Tools: relate_nodes
// ============================================================================

describe('asTools — relate_nodes', () => {
  test('creates causal relationship', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const relate = tools.find(t => t.function.name === 'relate_nodes')!;

    const a = addNode.handler({ type: 'thought', content: 'cause' });
    const b = addNode.handler({ type: 'thought', content: 'effect' });

    const result = relate.handler({ source: a.data.nodeId, target: b.data.nodeId, type: 'causes' });

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('causes');

    // Verify relationship exists in IR
    const ir = mem.toIR();
    const rel = ir.relationships.find(r => r.type === 'causes');
    expect(rel).toBeDefined();
  });

  test('creates tension with axis', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const relate = tools.find(t => t.function.name === 'relate_nodes')!;

    const a = addNode.handler({ type: 'thought', content: 'speed' });
    const b = addNode.handler({ type: 'thought', content: 'safety' });

    const result = relate.handler({
      source: a.data.nodeId, target: b.data.nodeId,
      type: 'tension', axis: 'performance vs reliability'
    });

    expect(result.success).toBe(true);
    expect(result.data.axis).toBe('performance vs reliability');
  });

  test('creates equivalent relationship', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const relate = tools.find(t => t.function.name === 'relate_nodes')!;

    const a = addNode.handler({ type: 'thought', content: 'concept A' });
    const b = addNode.handler({ type: 'thought', content: 'concept B' });

    const result = relate.handler({
      source: a.data.nodeId, target: b.data.nodeId, type: 'equivalent'
    });

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('equivalent');
  });

  test('creates different relationship', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const relate = tools.find(t => t.function.name === 'relate_nodes')!;

    const a = addNode.handler({ type: 'thought', content: 'approach X' });
    const b = addNode.handler({ type: 'thought', content: 'approach Y' });

    const result = relate.handler({
      source: a.data.nodeId, target: b.data.nodeId, type: 'different'
    });

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('different');
  });

  test('returns error when tension missing axis', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const relate = tools.find(t => t.function.name === 'relate_nodes')!;

    const a = addNode.handler({ type: 'thought', content: 'A' });
    const b = addNode.handler({ type: 'thought', content: 'B' });

    const result = relate.handler({
      source: a.data.nodeId, target: b.data.nodeId, type: 'tension'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('axis');
  });
});

// ============================================================================
// Core Tools: set_state
// ============================================================================

describe('asTools — set_state', () => {
  test('marks node as decided and echoes fields', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const n = addNode.handler({ type: 'question', content: 'Which approach?' });
    const result = setState.handler({
      nodeId: n.data.nodeId, state: 'decided', rationale: 'simpler implementation', on: '2026-03-16'
    });

    expect(result.success).toBe(true);
    expect(result.data.state).toBe('decided');
    expect(result.data.fields.rationale).toBe('simpler implementation');
    expect(result.data.fields.on).toBe('2026-03-16');
  });

  test('marks node as blocked', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const n = addNode.handler({ type: 'action', content: 'Deploy service' });
    const result = setState.handler({
      nodeId: n.data.nodeId, state: 'blocked', reason: 'Waiting on API keys'
    });

    expect(result.success).toBe(true);
  });

  test('marks node as exploring', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const n = addNode.handler({ type: 'thought', content: 'Maybe Redis?' });
    const result = setState.handler({ nodeId: n.data.nodeId, state: 'exploring' });

    expect(result.success).toBe(true);
  });

  test('marks node as parked with why and until', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const n = addNode.handler({ type: 'action', content: 'Refactor auth module' });
    const result = setState.handler({
      nodeId: n.data.nodeId, state: 'parked', why: 'Higher priorities', until: '2026-04-01'
    });

    expect(result.success).toBe(true);
    expect(result.data.state).toBe('parked');
  });

  test('returns error when parked missing why', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const n = addNode.handler({ type: 'thought', content: 'test' });
    const result = setState.handler({ nodeId: n.data.nodeId, state: 'parked' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('why');
  });

  test('returns error when decided missing rationale', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const n = addNode.handler({ type: 'thought', content: 'test' });
    const result = setState.handler({ nodeId: n.data.nodeId, state: 'decided' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('rationale');
  });

  test('returns error when blocked missing reason', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const n = addNode.handler({ type: 'thought', content: 'test' });
    const result = setState.handler({ nodeId: n.data.nodeId, state: 'blocked' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('reason');
  });

  test('returns error for nonexistent node', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const result = setState.handler({ nodeId: 'nonexistent', state: 'exploring' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

// ============================================================================
// Core Tools: remove_state
// ============================================================================

describe('asTools — remove_state', () => {
  test('unblocks a blocked node', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core', 'query'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;
    const removeState = tools.find(t => t.function.name === 'remove_state')!;
    const queryBlocked = tools.find(t => t.function.name === 'query_blocked')!;

    // Block a node
    const n = addNode.handler({ type: 'action', content: 'Deploy to prod' });
    setState.handler({ nodeId: n.data.nodeId, state: 'blocked', reason: 'No API keys' });

    // Verify it shows as blocked
    const before = queryBlocked.handler({});
    expect(before.data.blockers.length).toBeGreaterThan(0);

    // Unblock it
    const result = removeState.handler({ nodeId: n.data.nodeId, state: 'blocked' });
    expect(result.success).toBe(true);
    expect(result.data.count).toBe(1);

    // Verify it no longer shows as blocked
    const after = queryBlocked.handler({});
    expect(after.data.blockers.length).toBe(0);
  });

  test('removes all states when no type specified', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;
    const removeState = tools.find(t => t.function.name === 'remove_state')!;

    const n = addNode.handler({ type: 'thought', content: 'test' });
    setState.handler({ nodeId: n.data.nodeId, state: 'blocked', reason: 'waiting' });
    setState.handler({ nodeId: n.data.nodeId, state: 'exploring' });

    const result = removeState.handler({ nodeId: n.data.nodeId });
    expect(result.success).toBe(true);
    expect(result.data.count).toBe(2);
    expect(result.data.stateRemoved).toBe('all');
  });

  test('returns error for nonexistent node', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const removeState = tools.find(t => t.function.name === 'remove_state')!;

    const result = removeState.handler({ nodeId: 'nonexistent' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('returns count 0 when no matching states', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const removeState = tools.find(t => t.function.name === 'remove_state')!;

    const n = addNode.handler({ type: 'thought', content: 'no states' });
    const result = removeState.handler({ nodeId: n.data.nodeId, state: 'blocked' });

    expect(result.success).toBe(true);
    expect(result.data.count).toBe(0);
  });
});

// ============================================================================
// Query Tools
// ============================================================================

describe('asTools — query tools', () => {
  /** Build a graph with causal chain, tension, blocker, and alternatives */
  function buildTestGraph(mem: Memory) {
    const tools = mem.asTools({ include: ['core'] });
    const addNode = tools.find(t => t.function.name === 'add_node')!;
    const addAlt = tools.find(t => t.function.name === 'add_alternative')!;
    const relate = tools.find(t => t.function.name === 'relate_nodes')!;
    const setState = tools.find(t => t.function.name === 'set_state')!;

    const cause = addNode.handler({ type: 'thought', content: 'Need fast reads' });
    const effect = addNode.handler({ type: 'action', content: 'Use Redis' });
    relate.handler({ source: cause.data.nodeId, target: effect.data.nodeId, type: 'causes' });

    const a = addNode.handler({ type: 'thought', content: 'Speed matters' });
    const b = addNode.handler({ type: 'thought', content: 'Durability matters' });
    relate.handler({ source: a.data.nodeId, target: b.data.nodeId, type: 'tension', axis: 'speed vs durability' });

    const blocked = addNode.handler({ type: 'action', content: 'Deploy to prod' });
    setState.handler({ nodeId: blocked.data.nodeId, state: 'blocked', reason: 'No API keys' });

    const question = addNode.handler({ type: 'question', content: 'Which database?' });
    const redis = addAlt.handler({ questionId: question.data.nodeId, content: 'Redis' });
    const pg = addAlt.handler({ questionId: question.data.nodeId, content: 'PostgreSQL' });
    setState.handler({ nodeId: redis.data.nodeId, state: 'decided', rationale: 'speed critical' });

    return { cause, effect, a, b, blocked, question, redis, pg };
  }

  test('query_why returns causal chain', () => {
    const mem = new Memory();
    const refs = buildTestGraph(mem);
    const tools = mem.asTools({ include: ['query'] });
    const queryWhy = tools.find(t => t.function.name === 'query_why')!;

    const result = queryWhy.handler({ nodeId: refs.effect.data.nodeId });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('query_what_if returns impact analysis', () => {
    const mem = new Memory();
    const refs = buildTestGraph(mem);
    const tools = mem.asTools({ include: ['query'] });
    const queryWhatIf = tools.find(t => t.function.name === 'query_what_if')!;

    const result = queryWhatIf.handler({ nodeId: refs.cause.data.nodeId });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('query_tensions finds tension relationships', () => {
    const mem = new Memory();
    buildTestGraph(mem);
    const tools = mem.asTools({ include: ['query'] });
    const queryTensions = tools.find(t => t.function.name === 'query_tensions')!;

    const result = queryTensions.handler({});

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('query_tensions filters by axis', () => {
    const mem = new Memory();
    buildTestGraph(mem);
    const tools = mem.asTools({ include: ['query'] });
    const queryTensions = tools.find(t => t.function.name === 'query_tensions')!;

    const result = queryTensions.handler({ axis: 'speed vs durability' });

    expect(result.success).toBe(true);
  });

  test('query_blocked finds blocked nodes', () => {
    const mem = new Memory();
    buildTestGraph(mem);
    const tools = mem.asTools({ include: ['query'] });
    const queryBlocked = tools.find(t => t.function.name === 'query_blocked')!;

    const result = queryBlocked.handler({});

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('query_alternatives analyzes decision', () => {
    const mem = new Memory();
    const refs = buildTestGraph(mem);
    const tools = mem.asTools({ include: ['query'] });
    const queryAlts = tools.find(t => t.function.name === 'query_alternatives')!;

    const result = queryAlts.handler({ questionId: refs.question.data.nodeId });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('query_why returns error for nonexistent node', () => {
    const mem = new Memory();
    const tools = mem.asTools({ include: ['query'] });
    const queryWhy = tools.find(t => t.function.name === 'query_why')!;

    const result = queryWhy.handler({ nodeId: 'nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ============================================================================
// Memory Tools
// ============================================================================

describe('asTools — memory tools', () => {
  test('get_memory returns flowscript format', () => {
    const mem = new Memory();
    mem.thought('test idea');
    const tools = mem.asTools({ include: ['memory'] });
    const getMem = tools.find(t => t.function.name === 'get_memory')!;

    const result = getMem.handler({ format: 'flowscript' });

    expect(result.success).toBe(true);
    expect(result.data.format).toBe('flowscript');
    expect(result.data.text).toContain('thought:');
    expect(result.data.estimatedTokens).toBeGreaterThan(0);
    expect(result.data.nodeCount).toBe(1);
  });

  test('get_memory returns json format', () => {
    const mem = new Memory();
    mem.thought('test idea');
    const tools = mem.asTools({ include: ['memory'] });
    const getMem = tools.find(t => t.function.name === 'get_memory')!;

    const result = getMem.handler({ format: 'json' });

    expect(result.success).toBe(true);
    expect(result.data.format).toBe('json');
    const parsed = JSON.parse(result.data.text);
    expect(parsed.flowscript_memory).toBe('1.0.0');
  });

  test('get_memory supports token budget', () => {
    const mem = new Memory();
    for (let i = 0; i < 20; i++) {
      mem.statement(`statement number ${i} with some extra content to fill the budget`);
    }

    const tools = mem.asTools({ include: ['memory'] });
    const getMem = tools.find(t => t.function.name === 'get_memory')!;

    const full = getMem.handler({ format: 'flowscript' });
    const budgeted = getMem.handler({ format: 'flowscript', maxTokens: 50 });

    expect(budgeted.data.estimatedTokens).toBeLessThanOrEqual(full.data.estimatedTokens);
  });

  test('search_nodes finds matching content', () => {
    const mem = new Memory();
    mem.thought('Redis is fast');
    mem.thought('PostgreSQL is reliable');
    mem.action('Deploy Redis to production');

    const tools = mem.asTools({ include: ['memory'] });
    const search = tools.find(t => t.function.name === 'search_nodes')!;

    const result = search.handler({ query: 'Redis' });

    expect(result.success).toBe(true);
    expect(result.data.count).toBe(2);
    expect(result.data.matches.every((m: any) => m.content.includes('Redis'))).toBe(true);
  });

  test('search_nodes filters by type', () => {
    const mem = new Memory();
    mem.thought('Redis thought');
    mem.action('Redis action');

    const tools = mem.asTools({ include: ['memory'] });
    const search = tools.find(t => t.function.name === 'search_nodes')!;

    const result = search.handler({ query: 'Redis', type: 'thought' });

    expect(result.success).toBe(true);
    expect(result.data.count).toBe(1);
    expect(result.data.matches[0].type).toBe('thought');
  });

  test('search_nodes respects limit parameter', () => {
    const mem = new Memory();
    for (let i = 0; i < 10; i++) {
      mem.thought(`Redis idea number ${i}`);
    }

    const tools = mem.asTools({ include: ['memory'] });
    const search = tools.find(t => t.function.name === 'search_nodes')!;

    const result = search.handler({ query: 'Redis', limit: 3 });

    expect(result.success).toBe(true);
    expect(result.data.count).toBe(3);
    expect(result.data.totalMatches).toBe(10);
  });

  test('search_nodes defaults to limit 20', () => {
    const mem = new Memory();
    for (let i = 0; i < 25; i++) {
      mem.thought(`item ${i}`);
    }

    const tools = mem.asTools({ include: ['memory'] });
    const search = tools.find(t => t.function.name === 'search_nodes')!;

    const result = search.handler({ query: 'item' });

    expect(result.data.count).toBe(20);
    expect(result.data.totalMatches).toBe(25);
  });

  test('search_nodes returns empty for no matches', () => {
    const mem = new Memory();
    mem.thought('something unrelated');

    const tools = mem.asTools({ include: ['memory'] });
    const search = tools.find(t => t.function.name === 'search_nodes')!;

    const result = search.handler({ query: 'nonexistent' });

    expect(result.success).toBe(true);
    expect(result.data.count).toBe(0);
    expect(result.data.matches).toEqual([]);
  });
});

// ============================================================================
// Error Handling
// ============================================================================

describe('asTools — error handling', () => {
  test('all handlers catch errors and return structured result', () => {
    const mem = new Memory();
    const tools = mem.asTools();

    // Tools that take nodeId/questionId should return errors for bad IDs
    for (const tool of tools) {
      if (tool.function.parameters.required?.includes('nodeId') ||
          tool.function.parameters.required?.includes('questionId')) {
        const result = tool.handler({ nodeId: 'bad_id', questionId: 'bad_id', state: 'exploring' });
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// Integration: Full Agent Workflow
// ============================================================================

describe('asTools — integration', () => {
  test('complete agent reasoning workflow using only tools', () => {
    const mem = new Memory();
    const tools = mem.asTools();

    // Helper to find tool by name
    const t = (name: string) => tools.find(tool => tool.function.name === name)!;

    // 1. Agent creates thoughts
    const t1 = t('add_node').handler({ type: 'thought', content: 'We need sub-100ms reads' });
    const t2 = t('add_node').handler({ type: 'thought', content: 'Data consistency is critical' });
    expect(t1.success).toBe(true);
    expect(t2.success).toBe(true);

    // 2. Agent identifies tension
    t('relate_nodes').handler({
      source: t1.data.nodeId, target: t2.data.nodeId,
      type: 'tension', axis: 'speed vs consistency'
    });

    // 3. Agent poses question
    const q = t('add_node').handler({ type: 'question', content: 'Which database for session storage?' });

    // 4. Agent creates alternatives
    const redis = t('add_alternative').handler({ questionId: q.data.nodeId, content: 'Redis (in-memory, fast)' });
    const pg = t('add_alternative').handler({ questionId: q.data.nodeId, content: 'PostgreSQL (ACID, reliable)' });

    // 5. Agent makes decision
    t('set_state').handler({
      nodeId: redis.data.nodeId,
      state: 'decided',
      rationale: 'Speed requirement dominates for session data',
      on: '2026-03-16'
    });

    // 6. Agent links cause
    t('relate_nodes').handler({
      source: t1.data.nodeId, target: redis.data.nodeId, type: 'causes'
    });

    // 7. Agent queries its own reasoning
    const tensions = t('query_tensions').handler({});
    expect(tensions.success).toBe(true);

    const alts = t('query_alternatives').handler({ questionId: q.data.nodeId });
    expect(alts.success).toBe(true);

    // 8. Agent serializes memory
    const snapshot = t('get_memory').handler({ format: 'flowscript' });
    expect(snapshot.success).toBe(true);
    expect(snapshot.data.text).toContain('Which database');
    expect(snapshot.data.nodeCount).toBeGreaterThanOrEqual(5);

    // 9. Agent searches its memory
    const search = t('search_nodes').handler({ query: 'Redis' });
    expect(search.success).toBe(true);
    expect(search.data.count).toBeGreaterThanOrEqual(1);
  });

  test('tools operate on shared Memory instance', () => {
    const mem = new Memory();
    const tools1 = mem.asTools();
    const tools2 = mem.asTools(); // Second call, same Memory

    const addNode1 = tools1.find(t => t.function.name === 'add_node')!;
    const search2 = tools2.find(t => t.function.name === 'search_nodes')!;

    // Create via first tool set
    addNode1.handler({ type: 'thought', content: 'shared state' });

    // Find via second tool set (same Memory)
    const result = search2.handler({ query: 'shared' });
    expect(result.data.count).toBe(1);
  });
});
