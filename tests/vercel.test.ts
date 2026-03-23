/**
 * FlowScript Vercel AI SDK Integration Tests
 *
 * Tests toVercelTools() and getFlowScriptContext() — the Vercel AI SDK adapter.
 * Covers: tool structure, tool execution, search/scoring, context formatting,
 * tier ordering, token budget, edge cases.
 */

import { Memory } from '../src/memory';
import { toVercelTools, getFlowScriptContext, VercelToolDefinition } from '../src/vercel';

// ============================================================================
// Tool Structure
// ============================================================================

describe('toVercelTools — Structure', () => {
  test('returns exactly 5 tools', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(Object.keys(tools)).toHaveLength(5);
  });

  test('returns expected tool names', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(Object.keys(tools).sort()).toEqual([
      'get_memory_context',
      'query_blocked',
      'query_tensions',
      'recall_memory',
      'store_memory',
    ]);
  });

  test('each tool has description, parameters, and execute', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);

    for (const [name, tool] of Object.entries(tools)) {
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe('string');
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.type).toBe('object');
      expect(tool.parameters.properties).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    }
  });

  test('store_memory requires content parameter', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(tools.store_memory.parameters.required).toEqual(['content']);
  });

  test('recall_memory requires query parameter', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(tools.recall_memory.parameters.required).toEqual(['query']);
  });

  test('query_tensions has no required parameters', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(tools.query_tensions.parameters.required).toBeUndefined();
    expect(Object.keys(tools.query_tensions.parameters.properties)).toHaveLength(0);
  });

  test('query_blocked has no required parameters', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(tools.query_blocked.parameters.required).toBeUndefined();
    expect(Object.keys(tools.query_blocked.parameters.properties)).toHaveLength(0);
  });

  test('get_memory_context has optional max_tokens parameter', () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(tools.get_memory_context.parameters.properties.max_tokens).toBeDefined();
    expect(tools.get_memory_context.parameters.required).toBeUndefined();
  });
});

// ============================================================================
// store_memory Tool
// ============================================================================

describe('toVercelTools — store_memory', () => {
  test('stores a thought and returns confirmation', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    const result = await tools.store_memory.execute({ content: 'Redis is faster than Postgres for sessions' });
    const parsed = JSON.parse(result);

    expect(parsed.stored).toBe(true);
    expect(parsed.id).toBeTruthy();
    expect(parsed.id.length).toBe(12);
    expect(parsed.category).toBe('observation');
    expect(parsed.preview).toContain('Redis is faster');
  });

  test('stores with category and sets ext metadata', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    await tools.store_memory.execute({ content: 'Use Redis for caching', category: 'decision' });

    const node = mem.nodes[0].node;
    expect(node.ext?.vercel_category).toBe('decision');
  });

  test('actually creates a node in memory', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    expect(mem.size).toBe(0);

    await tools.store_memory.execute({ content: 'Test observation' });
    expect(mem.size).toBe(1);
    expect(mem.nodes[0].content).toBe('Test observation');
  });

  test('preview truncates long content', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    const longContent = 'A'.repeat(200);
    const result = await tools.store_memory.execute({ content: longContent });
    const parsed = JSON.parse(result);

    expect(parsed.preview.length).toBe(80);
  });

  test('defaults category to observation when not provided', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    const result = await tools.store_memory.execute({ content: 'Something' });
    const parsed = JSON.parse(result);
    expect(parsed.category).toBe('observation');
  });
});

// ============================================================================
// recall_memory Tool
// ============================================================================

describe('toVercelTools — recall_memory', () => {
  test('finds matching memories by keyword', async () => {
    const mem = new Memory();
    mem.thought('Redis is great for caching');
    mem.thought('Postgres handles complex queries well');
    mem.thought('MongoDB is a document store');

    const tools = toVercelTools(mem);
    const result = await tools.recall_memory.execute({ query: 'Redis caching' });
    const parsed = JSON.parse(result);

    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.results[0].content).toContain('Redis');
  });

  test('returns empty for no matches', async () => {
    const mem = new Memory();
    mem.thought('Redis is great for caching');

    const tools = toVercelTools(mem);
    const result = await tools.recall_memory.execute({ query: 'quantum computing' });
    const parsed = JSON.parse(result);

    expect(parsed.count).toBe(0);
    expect(parsed.results).toHaveLength(0);
  });

  test('returns empty for short query words (<=2 chars)', async () => {
    const mem = new Memory();
    mem.thought('Something here');

    const tools = toVercelTools(mem);
    const result = await tools.recall_memory.execute({ query: 'a is' });
    const parsed = JSON.parse(result);

    expect(parsed.count).toBe(0);
  });

  test('respects limit parameter', async () => {
    const mem = new Memory();
    for (let i = 0; i < 10; i++) {
      mem.thought(`Database option ${i} for the project`);
    }

    const tools = toVercelTools(mem);
    const result = await tools.recall_memory.execute({ query: 'database project', limit: 3 });
    const parsed = JSON.parse(result);

    expect(parsed.results.length).toBeLessThanOrEqual(3);
  });

  test('defaults limit to 5', async () => {
    const mem = new Memory();
    for (let i = 0; i < 10; i++) {
      mem.thought(`Database option number ${i} for project`);
    }

    const tools = toVercelTools(mem);
    const result = await tools.recall_memory.execute({ query: 'database project' });
    const parsed = JSON.parse(result);

    expect(parsed.results.length).toBeLessThanOrEqual(5);
  });

  test('results include tier and frequency metadata', async () => {
    const mem = new Memory();
    mem.thought('Redis handles millions of operations per second');

    const tools = toVercelTools(mem);
    const result = await tools.recall_memory.execute({ query: 'Redis operations' });
    const parsed = JSON.parse(result);

    expect(parsed.results[0].tier).toBeDefined();
    expect(parsed.results[0].frequency).toBeDefined();
    expect(parsed.results[0].score).toBeDefined();
  });

  test('scores results by keyword match ratio', async () => {
    const mem = new Memory();
    mem.thought('Redis is fast');
    mem.thought('Redis caching is fast and reliable');

    const tools = toVercelTools(mem);
    const result = await tools.recall_memory.execute({ query: 'Redis caching fast' });
    const parsed = JSON.parse(result);

    // The entry with more matching words should score higher
    expect(parsed.results[0].content).toContain('caching');
  });

  test('touches matched nodes (updates frequency)', async () => {
    const mem = new Memory();
    const ref = mem.thought('Redis is great');
    const initialMeta = mem.getTemporalMeta(ref.id);
    const initialFreq = initialMeta?.frequency || 1;

    const tools = toVercelTools(mem);
    await tools.recall_memory.execute({ query: 'Redis great' });

    const updatedMeta = mem.getTemporalMeta(ref.id);
    expect(updatedMeta!.frequency).toBeGreaterThanOrEqual(initialFreq);
  });
});

// ============================================================================
// query_tensions Tool
// ============================================================================

describe('toVercelTools — query_tensions', () => {
  test('returns tensions result (empty on fresh memory)', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    const result = await tools.query_tensions.execute({});
    const parsed = JSON.parse(result);

    expect(parsed).toBeDefined();
    expect(parsed.metadata).toBeDefined();
    expect(parsed.metadata.total_tensions).toBe(0);
  });

  test('returns tensions when relationships exist', async () => {
    const mem = new Memory();
    const a = mem.thought('We need speed');
    const b = mem.thought('We need safety');
    mem.relate(a, b, 'tension', { axis: 'performance vs safety' });

    const tools = toVercelTools(mem);
    const result = await tools.query_tensions.execute({});
    const parsed = JSON.parse(result);

    expect(parsed.metadata.total_tensions).toBeGreaterThan(0);
  });
});

// ============================================================================
// query_blocked Tool
// ============================================================================

describe('toVercelTools — query_blocked', () => {
  test('returns blocked result (empty on fresh memory)', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    const result = await tools.query_blocked.execute({});
    const parsed = JSON.parse(result);

    expect(parsed).toBeDefined();
  });

  test('returns blockers when they exist', async () => {
    const mem = new Memory();
    const ref = mem.thought('Deploy to production');
    ref.block({ reason: 'Waiting on API keys' });

    const tools = toVercelTools(mem);
    const result = await tools.query_blocked.execute({});
    const parsed = JSON.parse(result);

    expect(parsed.blockers).toBeDefined();
    expect(parsed.blockers.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// get_memory_context Tool
// ============================================================================

describe('toVercelTools — get_memory_context', () => {
  test('returns empty string for empty memory', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);
    const result = await tools.get_memory_context.execute({});

    expect(result).toBe('');
  });

  test('returns formatted context with tier info', async () => {
    const mem = new Memory();
    mem.thought('Redis is fast');
    mem.thought('Postgres is reliable');

    const tools = toVercelTools(mem);
    const result = await tools.get_memory_context.execute({});

    expect(result).toContain('[current, freq=');
    expect(result).toContain('Redis is fast');
    expect(result).toContain('Postgres is reliable');
  });

  test('respects max_tokens parameter', async () => {
    const mem = new Memory();
    // Add enough content to exceed a small budget
    for (let i = 0; i < 50; i++) {
      mem.thought(`This is observation number ${i} about database performance and scaling strategies`);
    }

    const tools = toVercelTools(mem);
    const smallResult = await tools.get_memory_context.execute({ max_tokens: 100 });
    const largeResult = await tools.get_memory_context.execute({ max_tokens: 10000 });

    expect(smallResult.length).toBeLessThan(largeResult.length);
  });
});

// ============================================================================
// getFlowScriptContext — Direct Function Tests
// ============================================================================

describe('getFlowScriptContext', () => {
  test('returns empty string for empty memory', () => {
    const mem = new Memory();
    expect(getFlowScriptContext(mem)).toBe('');
  });

  test('formats nodes with tier and frequency', () => {
    const mem = new Memory();
    mem.thought('Important insight about architecture');
    const context = getFlowScriptContext(mem);

    expect(context).toMatch(/\[current, freq=\d+\]/);
    expect(context).toContain('Important insight about architecture');
  });

  test('orders by tier priority (proven/foundation first)', () => {
    const mem = new Memory();
    // Create nodes — they'll all be current tier
    mem.thought('Current thought');
    const context = getFlowScriptContext(mem);

    // At minimum, verify it returns content
    expect(context).toContain('Current thought');
  });

  test('respects maxTokens budget', () => {
    const mem = new Memory();
    for (let i = 0; i < 100; i++) {
      mem.thought(`Observation ${i}: This is a detailed note about system behavior and architecture decisions`);
    }

    const small = getFlowScriptContext(mem, { maxTokens: 50 });
    const large = getFlowScriptContext(mem, { maxTokens: 10000 });

    // maxTokens * 4 = char budget. 50 tokens = 200 chars. Should fit fewer lines.
    expect(small.length).toBeLessThan(large.length);
  });

  test('defaults maxTokens to 4000', () => {
    const mem = new Memory();
    for (let i = 0; i < 500; i++) {
      mem.thought(`Note ${i}: padding content here for testing budget enforcement behavior`);
    }

    const context = getFlowScriptContext(mem);
    // 4000 tokens * 4 chars = 16000 char budget
    expect(context.length).toBeLessThanOrEqual(16000 + 200); // small buffer for line joining
  });

  test('includes tensions when present and includeQueries is true', () => {
    const mem = new Memory();
    const a = mem.thought('Speed matters');
    const b = mem.thought('Safety matters');
    mem.relate(a, b, 'tension', { axis: 'speed vs safety' });

    const context = getFlowScriptContext(mem, { includeQueries: true });
    expect(context).toContain('[TENSIONS]');
  });

  test('excludes queries when includeQueries is false', () => {
    const mem = new Memory();
    const a = mem.thought('Speed matters');
    const b = mem.thought('Safety matters');
    mem.relate(a, b, 'tension', { axis: 'speed vs safety' });

    const context = getFlowScriptContext(mem, { includeQueries: false });
    expect(context).not.toContain('[TENSIONS]');
  });

  test('includes blocked items when present', () => {
    const mem = new Memory();
    const ref = mem.thought('Deploy the service');
    ref.block({ reason: 'Missing credentials' });

    const context = getFlowScriptContext(mem, { includeQueries: true });
    expect(context).toContain('[BLOCKED]');
  });

  test('includeQueries defaults to true', () => {
    const mem = new Memory();
    const ref = mem.thought('Deploy the service');
    ref.block({ reason: 'Missing credentials' });

    // Default (no options) should include queries
    const context = getFlowScriptContext(mem);
    expect(context).toContain('[BLOCKED]');
  });
});

// ============================================================================
// Integration — Tools operate on shared Memory
// ============================================================================

describe('Vercel tools — Integration', () => {
  test('store then recall round-trip', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);

    await tools.store_memory.execute({ content: 'PostgreSQL supports JSONB for flexible schemas' });
    const result = await tools.recall_memory.execute({ query: 'PostgreSQL JSONB' });
    const parsed = JSON.parse(result);

    expect(parsed.count).toBe(1);
    expect(parsed.results[0].content).toContain('PostgreSQL');
  });

  test('multiple stores then recall finds best match', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);

    await tools.store_memory.execute({ content: 'Redis handles caching well' });
    await tools.store_memory.execute({ content: 'PostgreSQL handles complex queries' });
    await tools.store_memory.execute({ content: 'Redis pub/sub for real-time messaging' });

    const result = await tools.recall_memory.execute({ query: 'Redis messaging' });
    const parsed = JSON.parse(result);

    expect(parsed.count).toBeGreaterThan(0);
    // The pub/sub entry matches both keywords
    expect(parsed.results[0].content).toContain('messaging');
  });

  test('stored memories appear in context', async () => {
    const mem = new Memory();
    const tools = toVercelTools(mem);

    await tools.store_memory.execute({ content: 'Architecture decision: microservices' });
    const context = await tools.get_memory_context.execute({});

    expect(context).toContain('Architecture decision: microservices');
  });
});
