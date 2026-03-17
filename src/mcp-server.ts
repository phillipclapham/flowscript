#!/usr/bin/env node
/**
 * FlowScript MCP Server
 *
 * Exposes FlowScript's decision intelligence as MCP tools for
 * Claude Code, Cursor, and other MCP-compatible AI assistants.
 *
 * Usage:
 *   flowscript-mcp ./agent-memory.json
 *
 * In Claude Code MCP config (~/.claude/settings.json):
 *   {
 *     "mcpServers": {
 *       "flowscript": {
 *         "command": "npx",
 *         "args": ["flowscript-mcp", "./agent-memory.json"]
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Memory } from './memory';
import type { RelationType } from './types';

// Version from package.json
const VERSION: string = require('../package.json').version;

// Parse memory file path from args
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.error(`FlowScript MCP Server v${VERSION}`);
  console.error('');
  console.error('Usage: flowscript-mcp <memory-file.json>');
  console.error('');
  console.error('Exposes FlowScript decision intelligence as MCP tools.');
  console.error('Memory file is created if it does not exist.');
  process.exit(0);
}

let memoryPath = './memory.json';
for (const arg of args) {
  if (!arg.startsWith('-')) {
    memoryPath = arg;
    break;
  }
}

// Load or create memory
const memory = Memory.loadOrCreate(memoryPath);

// Auto-save on exit signals
function gracefulSave() {
  try { memory.save(); } catch { /* best effort */ }
  process.exit(0);
}
process.on('SIGTERM', gracefulSave);
process.on('SIGINT', gracefulSave);

// Helper: validate required args exist
function requireArgs(args: Record<string, unknown> | undefined, ...keys: string[]): string | null {
  if (!args) return `Missing arguments: ${keys.join(', ')}`;
  for (const key of keys) {
    if (args[key] === undefined || args[key] === null) {
      return `Missing required argument: ${key}`;
    }
  }
  return null;
}

// Helper: error response with isError flag
function toolError(message: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: message }) }],
    isError: true,
  };
}

// Helper: success response
function toolSuccess(data: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

// Node ID hint used in multiple tool descriptions
const NODE_ID_HINT = 'Node IDs are hex hashes returned by add_node, add_alternative, and search_nodes.';

// Create MCP server
const server = new Server(
  { name: 'flowscript', version: VERSION },
  { capabilities: { tools: {} } }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // === Query tools ===
    {
      name: 'query_tensions',
      description:
        'Find all tradeoffs and tensions in the reasoning graph. Returns typed tension pairs with named axes (e.g., "performance vs cost"). No arguments needed — scans the entire graph.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          axis: {
            type: 'string',
            description: 'Optional: filter tensions by axis name',
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: 'query_blocked',
      description:
        'Find all blocked items with reasons, duration, and downstream impact scores. Shows what is stuck and what breaks because of it.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: 'query_why',
      description:
        `Trace the causal chain backward from a node. Returns a typed ancestry showing every factor that led to this decision or observation. ${NODE_ID_HINT}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          node_id: { type: 'string', description: 'ID of the node to trace causes for' },
        },
        required: ['node_id'],
        additionalProperties: false,
      },
    },
    {
      name: 'query_what_if',
      description:
        `Project forward consequences from a node. Shows what downstream effects would propagate if this node changes. ${NODE_ID_HINT}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          node_id: { type: 'string', description: 'ID of the node to project consequences for' },
        },
        required: ['node_id'],
        additionalProperties: false,
      },
    },
    {
      name: 'query_alternatives',
      description:
        `Reconstruct the decision rationale for a question node. Shows all alternatives considered, which was chosen and why, and what was rejected. ${NODE_ID_HINT}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          question_id: { type: 'string', description: 'ID of the question node' },
        },
        required: ['question_id'],
        additionalProperties: false,
      },
    },
    // === Memory tools ===
    {
      name: 'get_memory',
      description:
        'Get the full memory graph as FlowScript notation or JSON. Use format "flowscript" for human-readable or "json" for structured data.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          format: {
            type: 'string',
            enum: ['flowscript', 'json'],
            description: 'Output format (default: flowscript)',
          },
          max_tokens: {
            type: 'number',
            description: 'Optional token budget for FlowScript output',
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: 'search_nodes',
      description:
        'Search for nodes by content. Returns matching nodes with their types, IDs, and states. Use the returned node_id values with query and relationship tools.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search term to match against node content' },
          type: {
            type: 'string',
            enum: ['thought', 'question', 'action', 'insight', 'statement', 'completion', 'alternative'],
            description: 'Optional: filter by node type',
          },
          limit: { type: 'number', description: 'Maximum results to return (default: 20)' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    // === Builder tools ===
    {
      name: 'add_node',
      description:
        'Add a reasoning node to the memory graph. Returns the node_id for use with other tools. Changes are in-memory until save_memory is called. Types: thought (observation), question (decision point), action (task), insight (derived understanding), statement (fact), completion (done item).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          content: { type: 'string', description: 'The content of the node' },
          type: {
            type: 'string',
            enum: ['thought', 'question', 'action', 'insight', 'statement', 'completion'],
            description: 'Node type (default: thought)',
          },
        },
        required: ['content'],
        additionalProperties: false,
      },
    },
    {
      name: 'add_alternative',
      description:
        `Add an alternative option to a question node. Changes are in-memory until save_memory is called. ${NODE_ID_HINT}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          question_id: { type: 'string', description: 'ID of the question node' },
          content: { type: 'string', description: 'The alternative option' },
        },
        required: ['question_id', 'content'],
        additionalProperties: false,
      },
    },
    {
      name: 'relate_nodes',
      description:
        `Create a typed relationship between two nodes. Changes are in-memory until save_memory is called. ${NODE_ID_HINT}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          source_id: { type: 'string', description: 'Source node ID' },
          target_id: { type: 'string', description: 'Target node ID' },
          type: {
            type: 'string',
            enum: ['causes', 'tension', 'temporal', 'derives_from', 'bidirectional', 'equivalent', 'different'],
            description: 'Relationship type: causes (A→B), tension (A><B, requires axis), temporal (A then B), derives_from, bidirectional, equivalent, different',
          },
          axis: {
            type: 'string',
            description: 'Required for tension type: the named axis (e.g., "speed vs cost")',
          },
        },
        required: ['source_id', 'target_id', 'type'],
        additionalProperties: false,
      },
    },
    {
      name: 'set_state',
      description:
        `Set a state on a node. Changes are in-memory until save_memory is called. ${NODE_ID_HINT}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          node_id: { type: 'string', description: 'Node to set state on' },
          state: {
            type: 'string',
            enum: ['decided', 'blocked', 'exploring', 'parked'],
            description: 'State type',
          },
          rationale: { type: 'string', description: 'Required for decided' },
          reason: { type: 'string', description: 'Required for blocked' },
          why: { type: 'string', description: 'Required for parked' },
          until: { type: 'string', description: 'Optional for parked' },
        },
        required: ['node_id', 'state'],
        additionalProperties: false,
      },
    },
    {
      name: 'save_memory',
      description:
        'Persist all changes to disk. Mutations from add_node, relate_nodes, and set_state are held in memory until this is called. Auto-saves on server shutdown.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        additionalProperties: false,
      },
    },
  ],
}));

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // === Query handlers ===
      case 'query_tensions': {
        const result = memory.query.tensions(args?.axis ? { filterByAxis: [args.axis as string] } : undefined);
        return toolSuccess(result as any);
      }
      case 'query_blocked': {
        const result = memory.query.blocked();
        return toolSuccess(result as any);
      }
      case 'query_why': {
        const err = requireArgs(args, 'node_id');
        if (err) return toolError(err);
        const result = memory.query.why(args!.node_id as string);
        return toolSuccess(result as any);
      }
      case 'query_what_if': {
        const err = requireArgs(args, 'node_id');
        if (err) return toolError(err);
        const result = memory.query.whatIf(args!.node_id as string);
        return toolSuccess(result as any);
      }
      case 'query_alternatives': {
        const err = requireArgs(args, 'question_id');
        if (err) return toolError(err);
        const result = memory.query.alternatives(args!.question_id as string);
        return toolSuccess(result as any);
      }

      // === Memory handlers ===
      case 'get_memory': {
        const format = (args?.format as string) || 'flowscript';
        if (format === 'json') {
          return { content: [{ type: 'text' as const, text: memory.toJSONString() }] };
        }
        const maxTokens = args?.max_tokens as number | undefined;
        const fs = memory.toFlowScript(maxTokens ? { maxTokens } : undefined);
        return { content: [{ type: 'text' as const, text: fs || '(empty memory)' }] };
      }
      case 'search_nodes': {
        const err = requireArgs(args, 'query');
        if (err) return toolError(err);
        const queryLower = (args!.query as string).toLowerCase();
        const limit = (args?.limit as number) || 20;
        const typeFilter = args?.type as string | undefined;
        const matches = memory.findNodes((n: any) => {
          if (typeFilter && n.type !== typeFilter) return false;
          return n.content.toLowerCase().includes(queryLower);
        });
        const limited = matches.slice(0, limit);
        return toolSuccess({
          success: true,
          matches: limited.map(ref => ({
            node_id: ref.id,
            type: ref.type,
            content: ref.content,
          })),
          count: limited.length,
          total_matches: matches.length,
        });
      }

      // === Builder handlers ===
      case 'add_node': {
        const err = requireArgs(args, 'content');
        if (err) return toolError(err);
        const nodeType = (args!.type as string) || 'thought';
        const content = args!.content as string;
        let ref;
        switch (nodeType) {
          case 'thought': ref = memory.thought(content); break;
          case 'question': ref = memory.question(content); break;
          case 'action': ref = memory.action(content); break;
          case 'insight': ref = memory.insight(content); break;
          case 'statement': ref = memory.statement(content); break;
          case 'completion': ref = memory.completion(content); break;
          default:
            return toolError(`Unknown node type: ${nodeType}. Use: thought, question, action, insight, statement, completion.`);
        }
        return toolSuccess({ success: true, node_id: ref.id, type: ref.type, content: ref.content });
      }
      case 'add_alternative': {
        const err = requireArgs(args, 'question_id', 'content');
        if (err) return toolError(err);
        const ref = memory.alternative(args!.question_id as string, args!.content as string);
        return toolSuccess({ success: true, node_id: ref.id, content: ref.content });
      }
      case 'relate_nodes': {
        const err = requireArgs(args, 'source_id', 'target_id', 'type');
        if (err) return toolError(err);
        const relType = args!.type as string;
        const sourceId = args!.source_id as string;
        const targetId = args!.target_id as string;

        // Tension requires axis
        if (relType === 'tension' && !args?.axis) {
          return toolError('axis is required for tension relationships');
        }

        // Use NodeRef methods for common types, Memory.relate for all types
        const sourceRef = memory.ref(sourceId);
        const targetRef = memory.ref(targetId);

        switch (relType) {
          case 'causes': sourceRef.causes(targetRef); break;
          case 'tension': sourceRef.vs(targetRef, args!.axis as string); break;
          case 'temporal': sourceRef.then(targetRef); break;
          case 'derives_from': targetRef.derivesFrom(sourceRef); break;
          case 'bidirectional': sourceRef.bidirectional(targetRef); break;
          case 'equivalent':
          case 'different':
            // These valid RelationTypes don't have NodeRef shortcuts — use Memory internal
            memory['_addRelationship'](sourceId, targetId, relType as any);
            break;
          default:
            return toolError(`Unknown relationship type: ${relType}`);
        }
        return toolSuccess({
          success: true,
          type: relType,
          source: sourceId,
          target: targetId,
          ...(args?.axis ? { axis: args.axis } : {}),
        });
      }
      case 'set_state': {
        const err = requireArgs(args, 'node_id', 'state');
        if (err) return toolError(err);
        const nodeRef = memory.ref(args!.node_id as string);
        const state = args!.state as string;

        switch (state) {
          case 'decided':
            if (!args?.rationale) return toolError('rationale is required for decided state');
            nodeRef.decide({ rationale: args.rationale as string });
            break;
          case 'blocked':
            if (!args?.reason) return toolError('reason is required for blocked state');
            nodeRef.block({ reason: args.reason as string });
            break;
          case 'exploring':
            nodeRef.explore();
            break;
          case 'parked':
            if (!args?.why) return toolError('why is required for parked state');
            nodeRef.park({ why: args.why as string, until: args?.until as string | undefined });
            break;
          default:
            return toolError(`Unknown state: ${state}. Use: decided, blocked, exploring, parked.`);
        }
        return toolSuccess({ success: true, node_id: args!.node_id, state });
      }
      case 'save_memory': {
        memory.save();
        return toolSuccess({ success: true, path: memory.filePath });
      }

      default:
        return {
          content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: error.message }) }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`FlowScript MCP server v${VERSION} — memory: ${memoryPath}`);
}

main().catch((error) => {
  console.error('FlowScript MCP server error:', error);
  process.exit(1);
});
