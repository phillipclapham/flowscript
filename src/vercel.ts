/**
 * FlowScript Vercel AI SDK Integration.
 *
 * Provides FlowScript memory tools and middleware compatible with
 * the Vercel AI SDK (`ai` package). First memory provider with
 * Vercel AI SDK integration.
 *
 * Usage with generateText/streamText:
 * ```typescript
 * import { Memory } from 'flowscript-core';
 * import { toVercelTools } from 'flowscript-core/vercel';
 * import { tool, jsonSchema, generateText, stepCountIs } from 'ai';
 *
 * const mem = Memory.loadOrCreate('./agent-memory.json');
 * const fsTools = toVercelTools(mem);
 *
 * // Wrap with Vercel's tool() helper
 * const tools = Object.fromEntries(
 *   Object.entries(fsTools).map(([name, def]) => [
 *     name,
 *     tool({
 *       description: def.description,
 *       // AI SDK v6: use inputSchema, not parameters (bug #13460)
 *       inputSchema: jsonSchema(def.parameters),
 *       execute: def.execute,
 *     }),
 *   ])
 * );
 *
 * // AI SDK v6: use stopWhen, not maxSteps (maxSteps was removed)
 * const result = await generateText({ model, tools, stopWhen: stepCountIs(10), prompt: "..." });
 * ```
 *
 * Usage with context injection (middleware pattern):
 * ```typescript
 * const context = getFlowScriptContext(mem, { maxTokens: 4000 });
 * const result = await generateText({
 *   model,
 *   system: `You are an assistant.\n\n${context}`,
 *   tools,
 *   prompt: "...",
 * });
 * ```
 *
 * Note: Does NOT require 'ai' as a dependency. Users bring their own
 * Vercel AI SDK and use our tool definitions with tool() + jsonSchema().
 */

import { Memory } from './memory';

/**
 * A tool definition compatible with Vercel AI SDK's tool() helper.
 * Users wrap with: tool({ description, parameters: jsonSchema(parameters), execute })
 */
export interface VercelToolDefinition {
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (args: Record<string, any>) => Promise<string>;
}

/**
 * Convert a FlowScript Memory into Vercel AI SDK-compatible tool definitions.
 *
 * Returns a record of tool name → definition objects ready to be wrapped
 * with the Vercel AI SDK's tool() + jsonSchema() helpers.
 *
 * Tools provided:
 * - store_memory: Store observations, decisions, insights
 * - recall_memory: Search memory with word-level matching
 * - query_tensions: Find active tradeoffs
 * - query_blocked: Find blockers and impact
 * - get_memory_context: Get formatted memory summary
 */
export function toVercelTools(memory: Memory): Record<string, VercelToolDefinition> {
  return {
    store_memory: {
      description:
        'Store an observation, decision, or insight in persistent reasoning memory. ' +
        'Use this to remember important context across sessions.',
      parameters: {
        type: 'object' as const,
        properties: {
          content: {
            type: 'string',
            description: 'What to remember — observation, decision, insight, or concern.',
          },
          category: {
            type: 'string',
            description: 'Type of memory: observation, decision, concern, or insight.',
            default: 'observation',
          },
        },
        required: ['content'],
      },
      execute: async (args: Record<string, any>) => {
        const ref = memory.thought(args.content);
        if (args.category) {
          const node = ref.node;
          node.ext = node.ext || {};
          node.ext.vercel_category = args.category;
        }
        return JSON.stringify({
          stored: true,
          id: ref.id.slice(0, 12),
          category: args.category || 'observation',
          preview: args.content.slice(0, 80),
        });
      },
    },

    recall_memory: {
      description:
        'Search persistent memory for relevant past context. Returns memories ' +
        'with their tier (current/developing/proven) and engagement frequency.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description: 'What to search for in memory.',
          },
          limit: {
            type: 'number',
            description: 'Maximum results to return.',
            default: 5,
          },
        },
        required: ['query'],
      },
      execute: async (args: Record<string, any>) => {
        const limit = args.limit || 5;
        const queryWords = (args.query as string)
          .split(/\s+/)
          .filter((w: string) => w.length > 2)
          .map((w: string) => w.toLowerCase());

        if (queryWords.length === 0) {
          return JSON.stringify({ results: [], count: 0 });
        }

        const scored: Array<{ ref: any; score: number }> = [];
        for (const ref of memory.nodes) {
          const contentLower = ref.content.toLowerCase();
          const hits = queryWords.filter((w: string) => contentLower.includes(w)).length;
          if (hits > 0) {
            scored.push({ ref, score: hits / queryWords.length });
          }
        }
        scored.sort((a, b) => b.score - a.score);
        const matches = scored.slice(0, limit);

        if (matches.length > 0) {
          memory.touchNodes(matches.map((m) => m.ref.id));
        }

        const results = matches.map((m) => {
          const meta = memory.getTemporalMeta(m.ref.id);
          return {
            content: m.ref.content,
            tier: meta?.tier || 'current',
            frequency: meta?.frequency || 1,
            score: m.score,
          };
        });

        return JSON.stringify({ results, count: results.length });
      },
    },

    query_tensions: {
      description:
        'Find active tradeoffs and tensions in memory. Returns tensions ' +
        'grouped by axis. Requires relationships built via resolve().',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
      execute: async () => {
        const tensions = memory.query.tensions();
        return JSON.stringify(tensions);
      },
    },

    query_blocked: {
      description:
        'Find blockers and their downstream impact in memory. Returns ' +
        'blocked items with reasons and affected dependencies.',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
      execute: async () => {
        const blocked = memory.query.blocked();
        return JSON.stringify(blocked);
      },
    },

    get_memory_context: {
      description:
        'Get a formatted summary of all persistent memory with tier info. ' +
        'Use at session start to orient on past context.',
      parameters: {
        type: 'object' as const,
        properties: {
          max_tokens: {
            type: 'number',
            description: 'Maximum tokens for the context summary.',
            default: 4000,
          },
        },
      },
      execute: async (args: Record<string, any>) => {
        const maxTokens = args.max_tokens || 4000;
        return getFlowScriptContext(memory, { maxTokens });
      },
    },
  };
}

export interface ContextOptions {
  /** Maximum tokens for the context. Default: 4000 */
  maxTokens?: number;
  /** Include semantic query results (tensions, blocked). Default: true */
  includeQueries?: boolean;
}

/**
 * Get FlowScript memory context formatted for system prompt injection.
 *
 * Use this with Vercel AI SDK's system parameter:
 * ```typescript
 * const context = getFlowScriptContext(mem);
 * await generateText({
 *   model,
 *   system: `You are an assistant.\n\nPast context:\n${context}`,
 *   prompt: "...",
 * });
 * ```
 */
export function getFlowScriptContext(memory: Memory, options?: ContextOptions): string {
  const maxTokens = options?.maxTokens ?? 4000;
  const includeQueries = options?.includeQueries ?? true;

  if (memory.size === 0) return '';

  const charBudget = maxTokens * 4;
  let used = 0;
  const lines: string[] = [];

  // Order by tier priority
  const tierOrder: Record<string, number> = { proven: 0, foundation: 0, developing: 1, current: 2 };
  const nodesWithTier: Array<{ content: string; tier: string; freq: number; id: string }> = [];

  for (const ref of memory.nodes) {
    const meta = memory.getTemporalMeta(ref.id);
    nodesWithTier.push({
      content: ref.content,
      tier: meta?.tier || 'current',
      freq: meta?.frequency || 1,
      id: ref.id,
    });
  }
  nodesWithTier.sort((a, b) => (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3) || b.freq - a.freq);

  for (const node of nodesWithTier) {
    const line = `[${node.tier}, freq=${node.freq}] ${node.content}`;
    if (used + line.length > charBudget) break;
    lines.push(line);
    used += line.length;
  }

  if (includeQueries && lines.length > 0) {
    try {
      const tensions = memory.query.tensions();
      if ((tensions as any).metadata?.total_tensions > 0) {
        const tLine = `\n[TENSIONS] ${JSON.stringify(tensions)}`;
        if (used + tLine.length < charBudget) {
          lines.push(tLine);
          used += tLine.length;
        }
      }
    } catch { /* empty */ }

    try {
      const blocked = memory.query.blocked();
      if ((blocked as any).blockers?.length > 0) {
        const bLine = `\n[BLOCKED] ${JSON.stringify(blocked)}`;
        if (used + bLine.length < charBudget) {
          lines.push(bLine);
          used += bLine.length;
        }
      }
    } catch { /* empty */ }
  }

  return lines.join('\n');
}
