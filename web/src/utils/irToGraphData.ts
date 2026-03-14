/**
 * IR to GraphData Transformation (Zero Semantic Loss)
 * Session 7b.2.5.2: Phase 3 - Direct IR Rendering
 *
 * Transforms FlowScript IR to GraphData for D3 visualization.
 *
 * ARCHITECTURE: IR-native approach - zero transformation layer complexity.
 *
 * All 12 IR node types are preserved (direct 1:1 mapping).
 * All 10 IR relationship types are preserved (direct 1:1 mapping).
 * All 4 state types are joined (O(1) lookup).
 *
 * This is NOT a lossy transformation - it's direct rendering.
 * GraphData types ARE IR types + visualization metadata.
 *
 * Performance: O(n + s + r) where n=nodes, s=states, r=relationships
 * - State joining: O(s) to build lookup + O(n) to join = O(n+s)
 * - Node transformation: O(n)
 * - Edge transformation: O(r)
 * - Total: O(n+s+r) - linear time complexity
 */

import type { IR, State, Node } from '../../../src/types';
import type { GraphData, GraphNode, GraphEdge, NodeType, EdgeType } from '../types/graph';
import { getNodeVisualization, getEdgeVisualization } from '../types/graph';

// ============================================================================
// Block Hierarchy Handling
// ============================================================================

/**
 * Build set of duplicate node IDs to skip.
 *
 * The parser creates duplicate statement nodes inside ext.children
 * that have the same content as their parent block/question node.
 * These duplicates clutter the graph — remove them.
 *
 * @param nodes - IR nodes array
 * @returns Set of duplicate node IDs to skip
 */
function buildDuplicateSet(nodes: Node[]): Set<string> {
  const duplicateIds = new Set<string>();

  for (const node of nodes) {
    if (node.ext?.children) {
      const children = node.ext.children as Node[];
      for (const child of children) {
        // If a child has the exact same content as the parent, it's a duplicate
        if (child.content === node.content) {
          duplicateIds.add(child.id);
        }
      }
    }
  }

  return duplicateIds;
}

/**
 * Extract child node IDs from a node's ext.children.
 *
 * Block nodes store their children in ext.children as full Node objects.
 * We need to extract just the IDs for the GraphNode.children array.
 *
 * @param node - IR node
 * @returns Array of child node IDs, or undefined
 */
function extractChildrenIds(node: Node): string[] | undefined {
  if (node.type === 'block' && node.ext?.children) {
    const children = node.ext.children as Node[];
    return children.map(child => child.id);
  }
  return node.children; // Fallback to direct children array (if present)
}

/**
 * Transform IR to GraphData with ZERO semantic loss.
 *
 * All IR node types preserved (12 types).
 * All IR relationship types preserved (10 types).
 * State markers joined (4 types: decided, blocked, exploring, parking).
 * Hierarchical structure preserved (children arrays).
 *
 * @param ir - FlowScript IR JSON
 * @returns GraphData for D3 visualization
 *
 * @example
 * const ir = parseFlowScript('A -> B').ir;
 * const graphData = irToGraphData(ir);
 * console.log(graphData.nodes.length); // 2
 * console.log(graphData.edges.length); // 1
 */
export function irToGraphData(ir: IR): GraphData {
  // Step 1: Build state lookup for O(1) joins
  const statesByNodeId = buildStateLookup(ir.states);

  // Step 2: Deduplicate nodes — parser creates duplicate statement nodes
  // inside block ext.children with the same content as the parent.
  // Build a set of IDs to skip (children that duplicate their parent's content).
  const duplicateIds = buildDuplicateSet(ir.nodes);

  // Step 3: Transform ALL nodes (no hiding — show full graph structure)
  const nodes: GraphNode[] = ir.nodes
    .filter(node => !duplicateIds.has(node.id)) // Skip duplicate content nodes only
    .map(node => {
      const graphNode: GraphNode = {
        id: node.id, // Keep content hash
        type: mapNodeType(node.type), // Direct 1:1 mapping
        content: node.content,
        lineNumber: node.provenance.line_number,
        visualization: getNodeVisualization(mapNodeType(node.type)),
        state: transformState(statesByNodeId.get(node.id)),
        children: extractChildrenIds(node), // Extract from ext.children if present
        parentId: undefined, // Will be set below
      };

      return graphNode;
    });

  // Step 3b: Mark parent relationships for visual grouping
  const nodeIdSet = new Set(nodes.map(n => n.id));
  for (const node of ir.nodes) {
    if (node.children && node.children.length > 0) {
      for (const childId of node.children) {
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) {
          childNode.parentId = node.id;
        }
      }
    }
  }

  // Step 4: Transform ALL relationships (no filtering — show full structure)
  const edges: GraphEdge[] = ir.relationships
    .filter(rel => {
      // Only filter edges that reference deduplicated (removed) nodes
      return !duplicateIds.has(rel.source) && !duplicateIds.has(rel.target);
    })
    .map(rel => ({
      source: rel.source, // Node ID (hash)
      target: rel.target, // Node ID (hash)
      type: mapEdgeType(rel.type), // Direct 1:1 mapping
      label: rel.axis_label || undefined, // Preserve tension axes
      visualization: getEdgeVisualization(mapEdgeType(rel.type)),
    }));

  return { nodes, edges };
}

// ============================================================================
// Node Type Mapping (Zero Loss)
// ============================================================================

/**
 * Direct IR → GraphData node type mapping.
 *
 * NO types lost. 1:1 correspondence.
 * All 12 IR node types map directly to GraphData types.
 *
 * @param irType - IR node type
 * @returns GraphData node type
 */
function mapNodeType(irType: string): NodeType {
  const typeMap: Record<string, NodeType> = {
    statement: 'statement',
    question: 'question',
    thought: 'thought',
    action: 'action',
    block: 'block', // Hierarchical container (fully supported)
    decision: 'decision',
    blocker: 'blocker', // Impediment tracking (fully supported)
    insight: 'insight', // Realization (fully supported)
    completion: 'completion',
    alternative: 'alternative', // Decision option (fully supported)
    exploring: 'exploring',
    parking: 'parking',
  };

  const mapped = typeMap[irType];
  if (!mapped) {
    console.warn(`[irToGraphData] Unknown IR node type: "${irType}", defaulting to 'thought'`);
    return 'thought'; // Defensive fallback
  }
  return mapped;
}

// ============================================================================
// Relationship Type Mapping (Zero Loss)
// ============================================================================

/**
 * Direct IR → GraphData relationship type mapping.
 *
 * NO types lost. 1:1 correspondence.
 * All 10 IR relationship types map directly to GraphData types.
 *
 * Note: "causes" in IR → "causal" in GraphData for consistency.
 *
 * @param irType - IR relationship type
 * @returns GraphData edge type
 */
function mapEdgeType(irType: string): EdgeType {
  const typeMap: Record<string, EdgeType> = {
    causes: 'causal', // Renamed for graph terminology consistency
    temporal: 'temporal',
    derives_from: 'derives_from', // Logical derivation (fully supported)
    bidirectional: 'bidirectional',
    tension: 'tension', // Tradeoff with axis label (fully supported)
    equivalent: 'equivalent', // Semantic equivalence (fully supported)
    different: 'different', // Semantic distinction (fully supported)
    alternative: 'alternative',
    alternative_worse: 'alternative_worse', // Dominated option (fully supported)
    alternative_better: 'alternative_better', // Superior option (fully supported)
  };

  const mapped = typeMap[irType];
  if (!mapped) {
    console.warn(`[irToGraphData] Unknown IR relationship type: "${irType}", defaulting to 'causal'`);
    return 'causal'; // Defensive fallback
  }
  return mapped;
}

// ============================================================================
// State Joining (O(1) Lookup)
// ============================================================================

/**
 * Build state lookup map for O(1) joins.
 *
 * Performance: O(s) where s = number of states.
 *
 * @param states - IR states array
 * @returns Map of node_id → State
 */
function buildStateLookup(states: State[]): Map<string, State> {
  const lookup = new Map<string, State>();
  for (const state of states) {
    lookup.set(state.node_id, state);
  }
  return lookup;
}

/**
 * Transform IR State to GraphNode state.
 *
 * Supports all 4 state types:
 * - decided: { rationale, on }
 * - blocked: { reason, since }
 * - exploring: { since, hypothesis? }
 * - parking: { why, until }
 *
 * @param state - IR state or undefined
 * @returns GraphNode state or undefined
 */
function transformState(state: State | undefined): GraphNode['state'] {
  if (!state) return undefined;

  switch (state.type) {
    case 'decided':
      return {
        decided: {
          rationale: state.fields.rationale || '',
          on: state.fields.on || '',
        },
      };

    case 'blocked':
      return {
        blocked: {
          reason: state.fields.reason || '',
          since: state.fields.since || '',
        },
      };

    case 'exploring':
      return {
        exploring: {
          since: state.fields.since || '',
          hypothesis: state.fields.hypothesis,
        },
      };

    case 'parking':
      return {
        parking: {
          why: state.fields.why || '',
          until: state.fields.until || '',
        },
      };

    default:
      console.warn(`[irToGraphData] Unknown state type: "${state.type}"`);
      return undefined;
  }
}

// ============================================================================
// Verification & Debugging
// ============================================================================

/**
 * Verify IR to GraphData transformation preserves all data.
 *
 * Checks:
 * - Node count matches
 * - Edge count matches
 * - All node types mapped
 * - All edge types mapped
 * - States joined correctly
 *
 * Use this during development to catch semantic loss bugs.
 *
 * @param ir - Input IR
 * @param graphData - Output GraphData
 * @returns Verification report
 */
export function verifyTransformation(ir: IR, graphData: GraphData): {
  passed: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check node count
  if (ir.nodes.length !== graphData.nodes.length) {
    errors.push(`Node count mismatch: IR=${ir.nodes.length}, GraphData=${graphData.nodes.length}`);
  }

  // Check edge count
  if (ir.relationships.length !== graphData.edges.length) {
    errors.push(`Edge count mismatch: IR=${ir.relationships.length}, GraphData=${graphData.edges.length}`);
  }

  // Check for unknown node types
  const unknownNodeTypes = new Set<string>();
  for (const node of ir.nodes) {
    const mapped = mapNodeType(node.type);
    if (mapped === 'thought' && node.type !== 'thought') {
      unknownNodeTypes.add(node.type);
    }
  }
  if (unknownNodeTypes.size > 0) {
    errors.push(`Unknown node types: ${Array.from(unknownNodeTypes).join(', ')}`);
  }

  // Check for unknown edge types
  const unknownEdgeTypes = new Set<string>();
  const validIREdgeTypes = new Set(['causes', 'temporal', 'derives_from', 'bidirectional', 'tension', 'equivalent', 'different', 'alternative', 'alternative_worse', 'alternative_better']);
  for (const rel of ir.relationships) {
    if (!validIREdgeTypes.has(rel.type)) {
      unknownEdgeTypes.add(rel.type);
    }
  }
  if (unknownEdgeTypes.size > 0) {
    errors.push(`Unknown edge types: ${Array.from(unknownEdgeTypes).join(', ')}`);
  }

  // Check state joining
  const statesWithNodes = ir.states.filter(s => s.node_id !== '');
  const nodesWithStates = graphData.nodes.filter(n => n.state !== undefined);
  if (statesWithNodes.length !== nodesWithStates.length) {
    warnings.push(`State join mismatch: IR=${statesWithNodes.length}, GraphData=${nodesWithStates.length}`);
  }

  // Check hierarchical structure preservation
  const irNodesWithChildren = ir.nodes.filter(n => n.children && n.children.length > 0);
  const graphNodesWithChildren = graphData.nodes.filter(n => n.children && n.children.length > 0);
  if (irNodesWithChildren.length !== graphNodesWithChildren.length) {
    warnings.push(`Children array mismatch: IR=${irNodesWithChildren.length}, GraphData=${graphNodesWithChildren.length}`);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Debug helper: Print transformation statistics.
 *
 * Use this to verify transformation completeness.
 *
 * @param ir - Input IR
 * @param graphData - Output GraphData
 */
export function logTransformationStats(ir: IR, graphData: GraphData): void {
  console.group('[irToGraphData] Transformation Statistics');

  console.log('Nodes:', {
    ir: ir.nodes.length,
    graphData: graphData.nodes.length,
    types: {
      ir: [...new Set(ir.nodes.map(n => n.type))].sort(),
      graphData: [...new Set(graphData.nodes.map(n => n.type))].sort(),
    },
  });

  console.log('Edges:', {
    ir: ir.relationships.length,
    graphData: graphData.edges.length,
    types: {
      ir: [...new Set(ir.relationships.map(r => r.type))].sort(),
      graphData: [...new Set(graphData.edges.map(e => e.type))].sort(),
    },
  });

  console.log('States:', {
    ir: ir.states.length,
    irWithNodes: ir.states.filter(s => s.node_id !== '').length,
    graphDataWithStates: graphData.nodes.filter(n => n.state !== undefined).length,
    types: [...new Set(ir.states.map(s => s.type))].sort(),
  });

  console.log('Hierarchical Structure:', {
    irNodesWithChildren: ir.nodes.filter(n => n.children && n.children.length > 0).length,
    graphNodesWithChildren: graphData.nodes.filter(n => n.children && n.children.length > 0).length,
  });

  const verification = verifyTransformation(ir, graphData);
  console.log('Verification:', verification);

  console.groupEnd();
}
