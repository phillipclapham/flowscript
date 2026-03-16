/**
 * FlowScript IR → .fs Serializer
 *
 * Converts an IR (Intermediate Representation) back to valid FlowScript text.
 * The produced text, when re-parsed, should produce a semantically equivalent IR.
 *
 * Design:
 * - Walks the node graph in provenance order (line numbers)
 * - Reconstructs nesting from children arrays
 * - Renders relationships as continuation lines (-> target) under source nodes
 * - Places state markers before their annotated nodes (separate line if provenance differs)
 * - Preserves modifiers, axis labels, and state fields
 * - Typed relationship targets preserve both operator and type (-> thought: content)
 *
 * KNOWN LIMITATION — Cross-Reference Drops (Graph vs Tree):
 * .fs text is indentation-based (tree structure). The IR is a graph (nodes can have
 * multiple incoming edges). When a node is the target of relationships from multiple
 * sources, only the parent-child relationship is rendered. Cross-cutting relationships
 * (A -> B where B is already a child of C) are silently dropped during serialization.
 *
 * This is a fundamental format limitation, not a bug. The IR JSON preserves the full
 * graph; .fs is a lossy tree projection. This MUST be addressed when building the
 * Memory class — the Memory API will produce cross-cutting graphs that need either:
 *   (a) ID-based reference syntax in .fs (grammar extension)
 *   (b) Accepting .fs as lossy with JSON as canonical
 *   (c) A cross-references section at the end of .fs output
 * See: https://github.com/phillipclapham/flowscript — design decision pending.
 */

import { IR, Node, Relationship, State, RelationType, NodeType } from './types';

export interface SerializeOptions {
  /** Indentation string per level (default: '  ' — two spaces) */
  indent?: string;
  /** Whether to include blank lines between top-level elements (default: true) */
  blankLinesBetween?: boolean;
}

/**
 * Serialize an IR back to FlowScript text.
 */
export function serialize(ir: IR, options: SerializeOptions = {}): string {
  const indent = options.indent ?? '  ';
  const blankLinesBetween = options.blankLinesBetween ?? true;

  // Build lookup maps
  const nodeMap = new Map<string, Node>();
  for (const node of ir.nodes) {
    // Skip block nodes — they're structural containers, not content
    if (node.type === 'block') continue;
    nodeMap.set(node.id, node);
  }

  // Relationships by source node
  const relsBySource = new Map<string, Relationship[]>();
  for (const rel of ir.relationships) {
    const existing = relsBySource.get(rel.source) ?? [];
    existing.push(rel);
    relsBySource.set(rel.source, existing);
  }

  // States by node
  const statesByNode = new Map<string, State[]>();
  for (const state of ir.states) {
    if (!state.node_id) continue;
    const existing = statesByNode.get(state.node_id) ?? [];
    existing.push(state);
    statesByNode.set(state.node_id, existing);
  }

  // Track which nodes are children of other nodes
  const isChild = new Set<string>();

  for (const node of ir.nodes) {
    if (node.type === 'block') continue;
    if (node.children) {
      for (const childId of node.children) {
        isChild.add(childId);
      }
    }
  }

  // Build set of relationship targets from each source, so we know which
  // children should be rendered with relationship operators
  const childRelFromParent = new Map<string, Relationship>();
  for (const [sourceId, rels] of relsBySource) {
    const sourceNode = nodeMap.get(sourceId);
    if (!sourceNode?.children) continue;
    const childSet = new Set(sourceNode.children);
    for (const rel of rels) {
      if (childSet.has(rel.target)) {
        childRelFromParent.set(rel.target, rel);
      }
    }
  }

  // Find root nodes: not children of any non-block node, sorted by provenance line
  const roots: Node[] = [];
  for (const node of ir.nodes) {
    if (node.type === 'block') continue;
    if (!isChild.has(node.id)) {
      roots.push(node);
    }
  }
  roots.sort((a, b) => a.provenance.line_number - b.provenance.line_number);

  // Serialize — shared context across all roots so rendered tracking works
  const lines: string[] = [];
  const ctx: SerializeContext = {
    indent,
    nodeMap,
    relsBySource,
    statesByNode,
    childRelFromParent,
    isChild,
    rendered: new Set<string>(),
  };

  let renderedRootCount = 0;
  for (const root of roots) {
    // Skip roots that were already rendered as relationship targets
    if (ctx.rendered.has(root.id)) continue;
    // Blank line between top-level elements
    if (blankLinesBetween && renderedRootCount > 0) {
      lines.push('');
    }
    serializeNode(root, 0, lines, ctx);
    renderedRootCount++;
  }

  return lines.join('\n') + '\n';
}

interface SerializeContext {
  indent: string;
  nodeMap: Map<string, Node>;
  relsBySource: Map<string, Relationship[]>;
  statesByNode: Map<string, State[]>;
  childRelFromParent: Map<string, Relationship>;
  isChild: Set<string>;
  rendered: Set<string>; // Track rendered node IDs to prevent duplicates
}

function serializeNode(
  node: Node,
  depth: number,
  lines: string[],
  ctx: SerializeContext
): void {
  ctx.rendered.add(node.id);
  const prefix = ctx.indent.repeat(depth);

  // State markers: render on separate line if provenance shows they were
  // originally on a different line than their target node, otherwise inline
  const states = ctx.statesByNode.get(node.id) ?? [];
  const separateStates: State[] = [];
  const inlineStates: State[] = [];

  for (const state of states) {
    if (state.provenance.line_number < node.provenance.line_number) {
      separateStates.push(state);
    } else {
      inlineStates.push(state);
    }
  }

  // Render separate state markers on their own lines
  for (const state of separateStates) {
    lines.push(prefix + renderState(state));
  }

  // Build the node line
  const modifiers = renderModifiers(node.modifiers);
  const inlineStateStr = renderStates(inlineStates);
  const typePrefix = renderTypePrefix(node.type);
  const content = node.content;

  // Compose the line
  let line = prefix;
  line += modifiers;
  line += inlineStateStr;
  line += typePrefix;
  line += content;

  lines.push(line);

  // Render children
  if (node.children && node.children.length > 0) {
    for (const childId of node.children) {
      const childNode = ctx.nodeMap.get(childId);
      if (!childNode) continue;

      // Check if this child has a relationship from its parent
      const rel = ctx.childRelFromParent.get(childId);
      if (rel) {
        // Render as continuation relationship
        serializeChildWithRelationship(childNode, rel, depth + 1, lines, ctx);
      } else {
        // Render as plain indented child
        serializeNode(childNode, depth + 1, lines, ctx);
      }
    }
  }

  // Render non-child outgoing relationships
  renderNonChildRelationships(node, depth, prefix, lines, ctx);
}

/**
 * Render a node's outgoing relationships where the target is NOT a child.
 * Shared by serializeNode and serializeChildWithRelationship for chain support.
 */
function renderNonChildRelationships(
  node: Node,
  depth: number,
  prefix: string,
  lines: string[],
  ctx: SerializeContext
): void {
  const rels = ctx.relsBySource.get(node.id) ?? [];
  const childSet = new Set(node.children ?? []);
  const nonChildRels = rels.filter(r => !childSet.has(r.target));

  // Skip alternative relationships — handled by children rendering
  const meaningfulRels = nonChildRels.filter(r => r.type !== 'alternative');

  for (const rel of meaningfulRels) {
    const targetNode = ctx.nodeMap.get(rel.target);
    if (!targetNode) continue;
    // Skip if target is a child (handled above) or already rendered elsewhere
    if (ctx.isChild.has(rel.target) || ctx.rendered.has(rel.target)) continue;
    // Recursively render target with its own children and relationships
    serializeChildWithRelationship(targetNode, rel, depth + 1, lines, ctx);
  }
}

function serializeChildWithRelationship(
  node: Node,
  rel: Relationship,
  depth: number,
  lines: string[],
  ctx: SerializeContext
): void {
  ctx.rendered.add(node.id);
  const prefix = ctx.indent.repeat(depth);

  // State markers: separate vs inline based on provenance
  const states = ctx.statesByNode.get(node.id) ?? [];
  const separateStates: State[] = [];
  const inlineStates: State[] = [];

  for (const state of states) {
    if (state.provenance.line_number < node.provenance.line_number) {
      separateStates.push(state);
    } else {
      inlineStates.push(state);
    }
  }

  // Render separate state markers on their own lines
  for (const state of separateStates) {
    lines.push(prefix + renderState(state));
  }

  // Modifiers
  const modifiers = renderModifiers(node.modifiers);
  const inlineStateStr = renderStates(inlineStates);

  // For continuation relationships, render both the relationship operator AND
  // the type prefix when the node has one. The grammar supports typed targets
  // in relationship expressions (e.g., `-> thought: content`, `-> action: do X`).
  const typePrefix = renderTypePrefix(node.type);
  const relOp = renderRelOp(rel);

  let line: string;
  if (rel.type === 'alternative' && node.type === 'alternative') {
    // Alternative relationships: || serves as both relationship AND type prefix
    // Render just the type prefix to avoid `|| || content`
    line = prefix + modifiers + inlineStateStr + typePrefix + node.content;
  } else if (typePrefix && node.type !== 'statement') {
    // Typed node with relationship: render both operator and type prefix
    // e.g., `-> thought: content`, `-> action: do X`, `-> ✓ done`
    line = prefix + modifiers + inlineStateStr + relOp + ' ' + typePrefix + node.content;
  } else {
    // Plain statement: render with relationship operator only
    line = prefix + modifiers + inlineStateStr + relOp + ' ' + node.content;
  }

  lines.push(line);

  // Recursively render this node's children
  if (node.children && node.children.length > 0) {
    for (const childId of node.children) {
      const childNode = ctx.nodeMap.get(childId);
      if (!childNode) continue;
      const childRel = ctx.childRelFromParent.get(childId);
      if (childRel) {
        serializeChildWithRelationship(childNode, childRel, depth + 1, lines, ctx);
      } else {
        serializeNode(childNode, depth + 1, lines, ctx);
      }
    }
  }

  // Render this node's own non-child outgoing relationships (for chaining: A -> B -> C)
  renderNonChildRelationships(node, depth, prefix, lines, ctx);
}

/**
 * Render modifier prefixes.
 * Modifiers: "urgent" → "!", "strong_positive" → "++", etc.
 */
function renderModifiers(modifiers?: string[]): string {
  if (!modifiers || modifiers.length === 0) return '';
  return modifiers.map(m => {
    switch (m) {
      case 'urgent': return '! ';
      case 'strong_positive': return '++ ';
      case 'high_confidence': return '* ';
      case 'low_confidence': return '~ ';
      default: return m + ' ';
    }
  }).join('');
}

/**
 * Render state markers.
 */
function renderStates(states: State[]): string {
  if (states.length === 0) return '';
  return states.map(renderState).join(' ') + ' ';
}

function renderState(state: State): string {
  switch (state.type) {
    case 'decided': {
      const fields = renderStateFields(state, ['rationale', 'on']);
      return fields ? `[decided(${fields})]` : '[decided]';
    }
    case 'blocked': {
      const fields = renderStateFields(state, ['reason', 'since']);
      return fields ? `[blocked(${fields})]` : '[blocked]';
    }
    case 'parking': {
      const fields = renderStateFields(state, ['why', 'until']);
      return fields ? `[parking(${fields})]` : '[parking]';
    }
    case 'exploring':
      return '[exploring]';
    default: {
      // Generic passthrough for unknown state types (e.g., 'completed')
      // Preserves all fields rather than silently dropping them
      const fields = renderGenericStateFields(state);
      return fields ? `[${state.type}(${fields})]` : `[${state.type}]`;
    }
  }
}

function renderStateFields(state: State, fieldOrder: string[]): string {
  const parts: string[] = [];
  for (const key of fieldOrder) {
    const value = state.fields[key];
    if (value !== undefined) {
      parts.push(`${key}: "${value}"`);
    }
  }
  return parts.join(', ');
}

/**
 * Render all fields generically (for unknown state types).
 */
function renderGenericStateFields(state: State): string {
  const entries = Object.entries(state.fields);
  if (entries.length === 0) return '';
  return entries.map(([key, value]) => `${key}: "${value}"`).join(', ');
}

/**
 * Render the type prefix for a node.
 * Known types that have no FlowScript syntax render as plain text (empty prefix).
 */
function renderTypePrefix(type: NodeType): string {
  switch (type) {
    case 'question': return '? ';
    case 'thought': return 'thought: ';
    case 'action': return 'action: ';
    case 'completion': return '✓ ';
    case 'alternative': return '|| ';
    case 'statement': return '';
    case 'block': return '';
    case 'decision': return '';
    case 'blocker': return '';
    case 'insight': return '';
    case 'exploring': return '';
    case 'parking': return '';
    default: return '';
  }
}

/**
 * Render a relationship operator.
 */
function renderRelOp(rel: Relationship): string {
  switch (rel.type) {
    case 'causes': return '->';
    case 'temporal': return '=>';
    case 'derives_from': return '<-';
    case 'bidirectional': return '<->';
    case 'tension':
      return rel.axis_label ? `><[${rel.axis_label}]` : '><';
    case 'equivalent': return '=';
    case 'different': return '!=';
    case 'alternative': return '||';
    // No distinct syntax exists yet for worse/better alternatives — serialize as ||
    // Programmatic IRs using these types will lose the distinction on round-trip
    case 'alternative_worse': return '||';
    case 'alternative_better': return '||';
    default:
      throw new Error(`Unknown relationship type: ${rel.type}. Update serializer to handle this type.`);
  }
}
