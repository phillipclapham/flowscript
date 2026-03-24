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
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as crypto from 'crypto';
import { Memory } from './memory';
import type { RelationType } from './types';

// Version from package.json
const VERSION: string = require('../package.json').version;

/**
 * Seed a demo memory with a realistic API project for exploring queries.
 * 20 nodes: 2 decisions, 3 tensions, 1 blocker, 2 insights, causal chains.
 */
function seedDemoMemory(filePath: string): Memory {
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    console.error(`Demo: Loading existing memory from ${filePath}`);
    return Memory.load(filePath);
  }

  console.error(`Demo: Creating sample project memory at ${filePath}`);
  const mem = new Memory();

  // Database decision
  const qDb = mem.question('Which database for user sessions and agent state?');
  const altPg = mem.alternative(qDb, 'PostgreSQL — battle-tested, ACID, rich querying');
  const altRedis = mem.alternative(qDb, 'Redis — sub-ms reads, great for session cache');
  const altSqlite = mem.alternative(qDb, 'SQLite — zero ops, embedded, good enough for MVP');

  const tSpeed = mem.thought('Redis gives sub-ms reads but cluster costs $200/mo minimum');
  const tCost = mem.thought('PostgreSQL on shared hosting is $15/mo and handles our scale for 18+ months');
  const tConcurrent = mem.thought('SQLite cannot handle concurrent writes from multiple API workers');

  mem.tension(tSpeed, tCost, 'performance vs cost');
  tConcurrent.causes(altSqlite);
  altPg.decide({ rationale: 'Best balance of cost, reliability, and query power for our scale. Redis if we hit performance walls later.' });
  altSqlite.block({ reason: 'Cannot handle concurrent writes from multiple API workers' });

  // Auth decision
  const qAuth = mem.question('Which authentication approach for the API?');
  const altJwt = mem.alternative(qAuth, 'JWT with refresh tokens — stateless, scalable');
  const altSession = mem.alternative(qAuth, 'Server-side sessions — simpler, easier to revoke');
  const altOauth = mem.alternative(qAuth, 'Delegate to Auth0/Clerk — zero auth code, monthly cost');

  const tJwtRevoke = mem.thought('JWT revocation is a pain — need a blocklist, which means server-side state anyway');
  tJwtRevoke.causes(altSession);
  mem.tension(altJwt, tJwtRevoke, 'statelessness vs revocability');
  altSession.decide({ rationale: 'JWT revocation complexity not worth the statelessness benefit at our scale. Server sessions + Redis cache.' });
  altOauth.park({ why: 'Monthly cost does not make sense pre-revenue. Revisit after launch.' });

  // Architecture evolution
  const tMicro = mem.thought('Started with microservices but the overhead is killing velocity — 3 services, 3 deploy pipelines, distributed tracing just to serve CRUD');
  const tMono = mem.thought('Collapsed back to a modular monolith — same code boundaries, one deploy, 10x faster iteration');
  tMicro.causes(tMono);
  const iPremature = mem.insight('Premature distribution is worse than premature optimization — at least premature optimization is local');
  iPremature.derivesFrom(tMono);

  // Ongoing work
  const aMigrate = mem.action('Migrate user table from UUID v4 to ULID for sortable IDs');
  aMigrate.explore();
  const tSimple = mem.thought('Cache invalidation via TTL is simpler and easier to reason about');
  const tFresh = mem.thought('Stale-while-revalidate gives better UX but adds complexity to every cache layer');
  mem.tension(tSimple, tFresh, 'simplicity vs user experience');

  const cApi = mem.completion('API v1 shipped — 12 endpoints, auth, rate limiting, monitoring');
  const iTesting = mem.insight('Integration tests against real Postgres caught 3 bugs that unit tests with mocks missed — the ORM generates different SQL than you think');
  iTesting.derivesFrom(cApi);

  mem.save(filePath);
  console.error(`Demo: ${mem.nodes.length} nodes, 3 tensions, 1 blocker, 2 decisions. Try query_tensions or query_blocked!`);
  return mem;
}

// Parse memory file path from args
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.error(`FlowScript MCP Server v${VERSION}`);
  console.error('');
  console.error('Usage: flowscript-mcp [options] <memory-file.json>');
  console.error('');
  console.error('Options:');
  console.error('  --demo                Load a sample project memory to explore queries');
  console.error('  --generate-manifest   Generate tool-integrity.json for build-time verification');
  console.error('');
  console.error('Exposes FlowScript decision intelligence as MCP tools.');
  console.error('Memory file is created if it does not exist.');
  process.exit(0);
}

// Generate build-time integrity manifest and exit
if (args.includes('--generate-manifest')) {
  const manifest: Record<string, string> = {};
  // toolDefinitions is defined below — this block runs after module evaluation
  // We need to defer this to after toolDefinitions is initialized.
  // Using a function that will be called after the definitions are set up.
  process.nextTick(() => {
    for (const tool of toolDefinitions) {
      manifest[tool.name as string] = hashToolDefinition(tool);
    }
    const outPath = require('path').resolve(__dirname, '..', 'tool-integrity.json');
    require('fs').writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
    console.error(`Generated ${outPath} (${Object.keys(manifest).length} tools)`);
    process.exit(0);
  });
}

const isDemo = args.includes('--demo');
let memoryPath = isDemo ? './demo-memory.json' : './memory.json';
for (const arg of args) {
  if (!arg.startsWith('-')) {
    memoryPath = arg;
    break;
  }
}

// Load or create memory
const memory = isDemo ? seedDemoMemory(memoryPath) : Memory.loadOrCreate(memoryPath);

// Graceful shutdown: attempt a full session wrap (consolidation) on exit.
// Falls back to save-only if wrap throws (crash safety > data loss).
function gracefulShutdown() {
  try { memory.sessionWrap(); } catch {
    try { memory.save(); } catch { /* best effort */ }
  }
  process.exit(0);
}
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

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

// ============================================================================
// Tool Description Integrity — Reference Implementation
// ============================================================================
// Addresses the MCP description poisoning gap identified in:
//   - GitHub Discussion #2402 (modelcontextprotocol/modelcontextprotocol)
//   - "Two Agent Identity Problems" (arXiv, Clapham 2026)
//
// THREAT MODEL (be honest about scope):
//
// DETECTS:
//   - In-process description mutation (malicious npm dependency, monkey-patching,
//     or middleware that modifies tool objects in the same Node.js process)
//   - Accidental mutation (buggy wrapper that string-replaces descriptions)
//
// DOES NOT DETECT (requires ecosystem-level changes):
//   - Supply chain attacks (poisoned before startup — manifest captures poisoned state)
//   - Transport-layer attacks (MITM between server and client — hashes never leave process)
//   - Client-side injection (host manipulates descriptions after receiving them)
//
// ARCHITECTURAL LAYERS:
//   1. Tool: verify_integrity — LLM-callable, detects in-process mutation
//   2. Resource: flowscript://integrity/manifest — Host-verifiable manifest
//      (enables Claude Code/Cursor to verify descriptions WITHOUT LLM involvement,
//       moving the security boundary to the correct layer)
//
// This is a reference implementation. Full integrity requires client-side verification
// against an out-of-band manifest (build-time hashes, package signatures, etc.).
// See Discussion #2402 for the complete threat model and ecosystem proposal.
// ============================================================================

/**
 * Canonicalize a JSON-serializable value for deterministic hashing.
 * Sorted keys, no whitespace, deterministic primitive serialization.
 * Handles: objects (sorted keys), arrays (order-preserving), primitives (JSON.stringify).
 * Note: simplified canonicalization sufficient for MCP tool schemas (ASCII strings,
 * small numbers, booleans). Does not handle RFC 8785 edge cases (-0, NaN, Unicode
 * normalization) which are not present in MCP tool definitions.
 */
function canonicalize(obj: unknown): string {
  if (obj === undefined || obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  const entries = sorted
    .filter(k => (obj as Record<string, unknown>)[k] !== undefined)  // skip undefined (like JSON.stringify)
    .map(k => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k]));
  return '{' + entries.join(',') + '}';
}

/** Compute SHA-256 hash of a canonical JSON representation. */
function hashToolDefinition(tool: Record<string, unknown>): string {
  const canonical = canonicalize(tool);
  return crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
}

/** Deep-freeze an object to make any mutation throw in strict mode. */
function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T> {
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val as Record<string, unknown>);
    }
  }
  return obj;
}

// Tool definitions — extracted as a constant so we can hash them at startup.
// The verify_integrity tool is NOT in this list (it verifies, it isn't verified).
const toolDefinitions: Array<Record<string, unknown>> = [
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
      name: 'remove_state',
      description:
        `Remove states from a node. Use to unblock a node, clear a decision, or remove any applied state. ${NODE_ID_HINT}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          node_id: { type: 'string', description: 'Node to remove state from' },
          states: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['decided', 'blocked', 'exploring', 'parked'],
            },
            description: 'State types to remove. If omitted, removes ALL states.',
          },
        },
        required: ['node_id'],
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
    // === Session lifecycle tools ===
    {
      name: 'session_start',
      description:
        'Call at the START of every session. Returns a token-budgeted memory summary, active blockers, tensions, garden health, and tier distribution. Orients you on the current state of the reasoning graph. Blocker and tension nodes are touched (frequency incremented, keeping critical knowledge alive). Call exactly once per session.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          max_tokens: {
            type: 'number',
            description: 'Token budget for the memory summary (default: 4000)',
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: 'session_end',
      description:
        'Call at the END of every session. Prunes dormant nodes (archived to audit log), saves memory to disk. Returns what was pruned, garden health after cleanup, and save status. Keeps memory healthy across sessions.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: 'session_wrap',
      description:
        'Run memory lifecycle maintenance — the reasoning graph\'s consolidation cycle. ' +
        'Captures before/after statistics, prunes dormant nodes to audit trail, graduates ' +
        'frequently-accessed knowledge through temporal tiers, saves to disk. Call this at ' +
        'the end of a work session or when the user says to wrap up. Just like sleep ' +
        'consolidates human memory, session wraps let the reasoning graph mature: knowledge ' +
        'that keeps getting queried earns its place, one-off observations fade naturally. ' +
        'Archived nodes are preserved in the audit trail with full provenance — never destroyed.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: 'query_audit',
      description:
        'Search the audit trail for reasoning provenance. Call this to understand how memory ' +
        'evolved — what was extracted, what consolidation decided, which adapter made changes, ' +
        'or what happened in a specific session. Returns hash-chained audit entries matching ' +
        'the filters.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          after: { type: 'string', description: 'Only entries after this ISO timestamp' },
          before: { type: 'string', description: 'Only entries before this ISO timestamp' },
          events: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by event types (e.g. ["node_create", "state_change", "graduation", "prune", "session_wrap"])',
          },
          nodeId: { type: 'string', description: 'Filter by node ID involvement' },
          sessionId: { type: 'string', description: 'Filter by session ID' },
          limit: { type: 'number', description: 'Maximum entries to return (default: 100)' },
          verifyChain: {
            type: 'boolean',
            description: 'Also verify hash chain integrity of matched entries (default: false)',
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: 'verify_audit',
      description:
        'Verify hash chain integrity of the entire audit trail. Call this to confirm the ' +
        'audit trail has not been tampered with. Returns chain validity status, total entries ' +
        'verified, and location of any break.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        additionalProperties: false,
      },
    },
];

// Deep-freeze all tool definitions — any in-process mutation will throw in strict mode
// and be detectable via verify_integrity in non-strict mode.
for (const tool of toolDefinitions) {
  deepFreeze(tool);
}

// Compute integrity manifest at startup — captures the "intended" state of all tool definitions.
const integrityManifest: Record<string, string> = {};
const expectedToolCount = toolDefinitions.length;
for (const tool of toolDefinitions) {
  integrityManifest[tool.name as string] = hashToolDefinition(tool);
}
Object.freeze(integrityManifest);

// Load build-time manifest if it exists (generated by: npx flowscript-mcp --generate-manifest)
// Build-time manifest provides a root of trust independent of the running process.
let buildTimeManifest: Record<string, string> | null = null;
try {
  const manifestPath = require('path').resolve(__dirname, '..', 'tool-integrity.json');
  buildTimeManifest = JSON.parse(require('fs').readFileSync(manifestPath, 'utf-8'));
  console.error(`Integrity: loaded build-time manifest (${Object.keys(buildTimeManifest!).length} tools)`);
} catch {
  // No build-time manifest — startup-only verification
}

// The verify_integrity tool definition — separate from the verified tools.
// Honest framing: detects in-process mutation, not transport-layer attacks.
const verifyIntegrityTool: Record<string, unknown> = {
  name: 'verify_integrity',
  description:
    'Verify that tool descriptions have not been mutated in-process since server startup. ' +
    'Detects description modifications by malicious dependencies, middleware, or monkey-patching. ' +
    'Returns per-tool SHA-256 hashes (expected vs current) and a pass/fail verdict. ' +
    'NOTE: This verifies the server\'s own state — transport-layer integrity requires ' +
    'host-level verification via the flowscript://integrity/manifest resource. ' +
    'Reference implementation: github.com/modelcontextprotocol/modelcontextprotocol/discussions/2402',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    additionalProperties: false,
  },
};
deepFreeze(verifyIntegrityTool);

// Create MCP server with tools + resources capabilities
const server = new Server(
  { name: 'flowscript', version: VERSION },
  { capabilities: { tools: {}, resources: {} } }
);

// Register tool definitions (verified tools + the verifier)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [...toolDefinitions, verifyIntegrityTool] as any[],
}));

// ============================================================================
// Integrity Resource — Host-Verifiable Manifest
// ============================================================================
// Exposes the integrity manifest as an MCP Resource so the HOST application
// (Claude Code, Cursor, etc.) can verify tool descriptions independently of
// the LLM. This moves the security boundary to the correct layer:
//   - Tool (verify_integrity): LLM-callable, in-process check
//   - Resource (manifest): Host-callable, enables client-side verification

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'flowscript://integrity/manifest',
      name: 'Tool Integrity Manifest',
      description: 'SHA-256 hashes of all tool definitions for client-side integrity verification. Compare these hashes against the tool definitions you received to detect transport-layer description mutation.',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'flowscript://integrity/manifest') {
    const manifest = {
      version: VERSION,
      algorithm: 'SHA-256',
      canonicalization: 'deterministic sorted-keys JSON',
      generated_at: new Date().toISOString(),
      tool_count: expectedToolCount,
      tools: integrityManifest,
      build_time_manifest: buildTimeManifest ? 'available' : 'not generated',
      usage: 'Hash each tool definition (sorted keys, no whitespace, SHA-256) and compare against the hashes in this manifest. Mismatches indicate description mutation between server and client.',
    };
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(manifest, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

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
      case 'remove_state': {
        const err = requireArgs(args, 'node_id');
        if (err) return toolError(err);
        const nodeId = args!.node_id as string;
        const states = args?.states as string[] | undefined;
        let totalRemoved = 0;
        if (states && states.length > 0) {
          for (const s of states) {
            // Map user-facing 'parked' to internal StateType 'parking'
            const mapped = s === 'parked' ? 'parking' : s;
            totalRemoved += memory.removeStates(nodeId, mapped as any);
          }
        } else {
          totalRemoved = memory.removeStates(nodeId);
        }
        return toolSuccess({ success: true, node_id: nodeId, removed: totalRemoved });
      }
      case 'save_memory': {
        memory.save();
        return toolSuccess({ success: true, path: memory.filePath });
      }

      // === Session lifecycle handlers ===
      case 'session_start': {
        const maxTokens = args?.max_tokens as number | undefined;
        const result = memory.sessionStart(maxTokens ? { maxTokens } : undefined);
        return toolSuccess({
          success: true,
          summary: result.summary,
          blockers: result.blockers,
          tensions: result.tensions,
          garden: {
            growing: result.garden.stats.growing,
            resting: result.garden.stats.resting,
            dormant: result.garden.stats.dormant,
            total: result.garden.stats.total,
          },
          tier_counts: result.tierCounts,
          total_nodes: result.totalNodes,
        });
      }
      case 'session_end': {
        const result = memory.sessionEnd();
        return toolSuccess({
          success: true,
          pruned_count: result.pruned.count,
          pruned_nodes: result.pruned.archived.map(ref => ({
            node_id: ref.id,
            type: ref.type,
            content: ref.content,
          })),
          garden_after: {
            growing: result.garden.stats.growing,
            resting: result.garden.stats.resting,
            dormant: result.garden.stats.dormant,
            total: result.garden.stats.total,
          },
          saved: result.saved,
          path: result.path,
        });
      }
      case 'session_wrap': {
        const result = memory.sessionWrap();
        return toolSuccess({
          success: true,
          nodes_before: result.nodesBefore,
          tiers_before: result.tiersBefore,
          nodes_after: result.nodesAfter,
          tiers_after: result.tiersAfter,
          pruned_count: result.pruned.count,
          pruned_nodes: result.pruned.archived.map(ref => ({
            node_id: ref.id,
            type: ref.type,
            content: ref.content,
          })),
          garden_after: {
            growing: result.gardenAfter.stats.growing,
            resting: result.gardenAfter.stats.resting,
            dormant: result.gardenAfter.stats.dormant,
            total: result.gardenAfter.stats.total,
          },
          saved: result.saved,
          path: result.path,
        });
      }

      // === Audit trail handlers ===
      case 'query_audit': {
        if (!memory.filePath) {
          return toolError('No memory file path — audit trail requires file-based persistence');
        }
        try {
          const result = Memory.queryAudit(memory.filePath, {
            after: args?.after as string | undefined,
            before: args?.before as string | undefined,
            events: args?.events as string[] | undefined,
            nodeId: args?.nodeId as string | undefined,
            sessionId: args?.sessionId as string | undefined,
            limit: (args?.limit as number | undefined) ?? 100,
            verifyChain: (args?.verifyChain as boolean | undefined) ?? false,
          });
          const resp: Record<string, unknown> = {
            success: true,
            entries: result.entries.map(e => ({
              event: e.event,
              timestamp: e.timestamp,
              data: e.data,
              session_id: e.session_id,
              adapter: e.adapter,
              seq: e.seq,
            })),
            total_scanned: result.totalScanned,
            files_searched: result.filesSearched,
            count: result.entries.length,
          };
          if (result.chainValid !== undefined) {
            resp.chain_valid = result.chainValid;
            if (result.chainBreakAt !== undefined) {
              resp.chain_break_at = result.chainBreakAt;
            }
          }
          return toolSuccess(resp);
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes('ENOENT')) {
            return toolSuccess({
              success: true,
              entries: [],
              total_scanned: 0,
              files_searched: 0,
              count: 0,
              note: 'No audit trail file found — audit may not be configured',
            });
          }
          throw e;
        }
      }
      case 'verify_audit': {
        if (!memory.filePath) {
          return toolError('No memory file path — audit trail requires file-based persistence');
        }
        try {
          const result = Memory.verifyAudit(memory.filePath);
          const resp: Record<string, unknown> = {
            success: true,
            valid: result.valid,
            total_entries: result.totalEntries,
            files_verified: result.filesVerified,
            legacy_entries: result.legacyEntries,
          };
          if (!result.valid) {
            if (result.chainBreakAt !== undefined) resp.chain_break_at = result.chainBreakAt;
            if (result.chainBreakFile) resp.chain_break_file = result.chainBreakFile;
          }
          return toolSuccess(resp);
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes('ENOENT')) {
            return toolSuccess({
              success: true,
              valid: null,
              total_entries: 0,
              files_verified: 0,
              status: 'no_audit_trail',
              note: 'No audit trail file found — auditing may not be configured',
            });
          }
          throw e;
        }
      }

      // === Integrity verification handler ===
      case 'verify_integrity': {
        const results: Array<{
          tool: string;
          expected_hash: string;
          current_hash: string;
          status: 'pass' | 'fail';
          build_time_status?: 'pass' | 'fail' | 'no_manifest';
        }> = [];

        let allPassed = true;

        // Check: has the tool count changed? (detect additions/removals)
        const countMatch = toolDefinitions.length === expectedToolCount;
        if (!countMatch) allPassed = false;

        // Per-tool hash verification
        for (const tool of toolDefinitions) {
          const toolName = tool.name as string;
          const expected = integrityManifest[toolName];
          const current = hashToolDefinition(tool);
          const passed = expected === current;
          if (!passed) allPassed = false;

          const entry: typeof results[number] = {
            tool: toolName,
            expected_hash: expected,
            current_hash: current,
            status: passed ? 'pass' : 'fail',
          };

          // Compare against build-time manifest if available
          if (buildTimeManifest) {
            const buildHash = buildTimeManifest[toolName];
            if (buildHash) {
              const buildMatch = buildHash === current;
              if (!buildMatch) allPassed = false;
              entry.build_time_status = buildMatch ? 'pass' : 'fail';
            } else {
              entry.build_time_status = 'no_manifest';
            }
          }

          results.push(entry);
        }

        return toolSuccess({
          success: true,
          verdict: allPassed ? 'PASS' : 'FAIL',
          tool_count: toolDefinitions.length,
          expected_tool_count: expectedToolCount,
          count_match: countMatch,
          algorithm: 'SHA-256',
          canonicalization: 'deterministic sorted-keys JSON',
          build_time_manifest: buildTimeManifest ? 'verified' : 'not available',
          tools: results,
          scope: 'Verifies in-process description integrity (detects mutation by dependencies, middleware, or monkey-patching). Transport-layer integrity requires host-side verification via flowscript://integrity/manifest resource.',
          description: allPassed
            ? 'All tool descriptions match their startup hashes. No in-process mutation detected.'
            : 'WARNING: Tool description integrity violation detected. One or more definitions have been modified since server startup.',
        });
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

// Skip server startup when generating manifest — nextTick handles output + exit
if (!args.includes('--generate-manifest')) {
  main().catch((error) => {
    console.error('FlowScript MCP server error:', error);
    process.exit(1);
  });
}
