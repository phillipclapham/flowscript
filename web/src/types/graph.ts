/**
 * IR-Native Graph Data Types for D3 Visualization
 * Session 7b.2.5: Full Parser Integration
 *
 * ARCHITECTURE DECISION: GraphData types ARE IR types + visualization metadata.
 *
 * Why IR-native?
 * - Zero semantic loss (all 12 node types + 10 relationship types preserved)
 * - No transformation layer complexity
 * - Future-proof (IR changes auto-flow to visualization)
 * - Single source of truth (IR schema defines types)
 *
 * This is infrastructure thinking: Fix architecture, not symptoms.
 */

// ============================================================================
// IR-Native Node Types (ALL 12 types from IR schema)
// ============================================================================

/**
 * Node types match FlowScript IR exactly.
 * Each type has distinct semantic meaning and visual representation.
 */
export type NodeType =
  | 'statement'     // Declarative assertion
  | 'question'      // Open inquiry
  | 'thought'       // Reflective note
  | 'action'        // Executable task
  | 'block'         // Hierarchical container
  | 'decision'      // Resolved choice
  | 'blocker'       // Impediment to progress
  | 'insight'       // Realization/breakthrough
  | 'completion'    // Finished task
  | 'alternative'   // Option in decision space
  | 'exploring'     // Work in progress
  | 'parking';      // Deferred item

// ============================================================================
// IR-Native Relationship Types (ALL 10 types from IR schema)
// ============================================================================

/**
 * Relationship types match FlowScript IR exactly.
 * Maps IR relationship names to GraphData edge types.
 *
 * Note: "causes" in IR → "causal" in GraphData for consistency
 */
export type EdgeType =
  | 'causal'              // Causal dependency (IR: "causes")
  | 'temporal'            // Temporal sequence
  | 'derives_from'        // Logical derivation
  | 'bidirectional'       // Mutual dependency
  | 'tension'             // Tradeoff relationship (with axis label)
  | 'equivalent'          // Semantic equivalence
  | 'different'           // Semantic distinction
  | 'alternative'         // Option relationship
  | 'alternative_worse'   // Dominated option
  | 'alternative_better'; // Superior option

// ============================================================================
// Visualization Metadata Layer
// ============================================================================

/**
 * Shape types for node rendering.
 * Each NodeType maps to a distinct shape for visual distinction.
 */
export type NodeShape =
  | 'rounded-rect'      // statement
  | 'diamond'           // question
  | 'circle'            // thought
  | 'rect'              // action
  | 'cluster'           // block (container)
  | 'hexagon'           // decision
  | 'octagon'           // blocker (stop sign)
  | 'star'              // insight (emphasis)
  | 'circle-check'      // completion (circle with checkmark)
  | 'triangle'          // alternative
  | 'dashed-circle'     // exploring
  | 'rounded-square';   // parking

/**
 * Edge line styles for relationship rendering.
 */
export type EdgeStyle =
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'wavy'    // For tension relationships
  | 'double'; // For equivalent/different relationships

/**
 * Arrow marker types for relationship direction.
 */
export type EdgeMarker =
  | 'arrow'          // Standard directional arrow
  | 'double-arrow'   // Bidirectional
  | 'better'         // Green arrow (superior alternative)
  | 'worse';         // Red arrow (inferior alternative)

/**
 * Visualization metadata for a node.
 * Separates semantic type from visual presentation.
 */
export interface VisualizationMetadata {
  shape: NodeShape;
  color: {
    light: string;  // Color in light theme
    dark: string;   // Color in dark theme
  };
  size?: number;    // Optional size hint (default: depends on shape)
  collapsed?: boolean; // For block nodes (hierarchical containers)
}

/**
 * Visualization metadata for an edge.
 */
export interface EdgeVisualization {
  style: EdgeStyle;
  color: string;
  marker: EdgeMarker;
  width?: number; // Optional stroke width (default: 2)
}

// ============================================================================
// Graph Node (IR-native with visualization)
// ============================================================================

/**
 * Graph node for D3 visualization.
 *
 * Structure:
 * - Core fields match IR schema (id, type, content, provenance)
 * - State joined from IR.states array (O(1) lookup during transformation)
 * - Visualization metadata cleanly separated
 * - D3 simulation fields (x, y, fx, fy) added during rendering
 */
export interface GraphNode {
  // Core IR fields
  id: string;                    // Content hash from IR
  type: NodeType;                // IR-native type
  content: string;               // Text content
  lineNumber: number;            // From provenance.line_number

  // Visualization metadata
  visualization: VisualizationMetadata;

  // State (joined from IR.states)
  state?: {
    decided?: {
      rationale: string;
      on: string;  // ISO-8601 datetime
    };
    blocked?: {
      reason: string;
      since: string;  // ISO-8601 datetime
    };
    exploring?: {
      since: string;  // ISO-8601 datetime
      hypothesis?: string;
    };
    parking?: {
      why: string;
      until: string;
    };
  };

  // Hierarchical structure (for block nodes)
  children?: string[];  // Array of child node IDs

  // D3 simulation fields (added during rendering)
  x?: number;
  y?: number;
  fx?: number | null;  // Fixed x position (null = not fixed)
  fy?: number | null;  // Fixed y position (null = not fixed)
}

// ============================================================================
// Graph Edge (IR-native with visualization)
// ============================================================================

/**
 * Graph edge for D3 visualization.
 *
 * Structure:
 * - Core fields match IR schema (source, target, type)
 * - Label for tension relationships (axis of tradeoff)
 * - Visualization metadata cleanly separated
 */
export interface GraphEdge {
  source: string;                // Node ID (hash) or node object (D3 adds)
  target: string;                // Node ID (hash) or node object (D3 adds)
  type: EdgeType;                // IR-native type
  label?: string;                // For tension relationships (axis label)
  visualization: EdgeVisualization;
}

// ============================================================================
// Graph Data Container
// ============================================================================

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================================================
// Parser Error
// ============================================================================

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

// ============================================================================
// Visualization Palette Constants
// ============================================================================

/**
 * Node shape mapping.
 * Each NodeType gets a distinct shape for visual distinction.
 */
export const NODE_SHAPES: Record<NodeType, NodeShape> = {
  statement:     'rounded-rect',
  question:      'diamond',
  thought:       'circle',
  action:        'rect',
  block:         'cluster',
  decision:      'hexagon',
  blocker:       'octagon',
  insight:       'star',
  completion:    'circle-check',
  alternative:   'triangle',
  exploring:     'dashed-circle',
  parking:       'rounded-square',
};

/**
 * Node color palette.
 * Semantic colors for light and dark themes.
 */
export const NODE_COLORS: Record<NodeType, { light: string; dark: string }> = {
  statement:     { light: '#3b82f6', dark: '#60a5fa' },  // Blue
  question:      { light: '#8b5cf6', dark: '#a78bfa' },  // Purple
  thought:       { light: '#6b7280', dark: '#9ca3af' },  // Gray
  action:        { light: '#10b981', dark: '#34d399' },  // Green
  block:         { light: '#f59e0b', dark: '#fbbf24' },  // Amber (container)
  decision:      { light: '#14b8a6', dark: '#5eead4' },  // Teal
  blocker:       { light: '#ef4444', dark: '#f87171' },  // Red (alert)
  insight:       { light: '#f59e0b', dark: '#fbbf24' },  // Amber (highlight)
  completion:    { light: '#22c55e', dark: '#4ade80' },  // Light green (done)
  alternative:   { light: '#a855f7', dark: '#c084fc' },  // Purple variant
  exploring:     { light: '#06b6d4', dark: '#22d3ee' },  // Cyan (in progress)
  parking:       { light: '#64748b', dark: '#94a3b8' },  // Slate (deferred)
};

/**
 * Edge style mapping.
 * Each EdgeType gets distinct visual style.
 */
export const EDGE_STYLES: Record<EdgeType, EdgeVisualization> = {
  causal:            { style: 'solid',  color: '#3b82f6', marker: 'arrow' },
  temporal:          { style: 'dashed', color: '#6b7280', marker: 'arrow' },
  derives_from:      { style: 'dotted', color: '#8b5cf6', marker: 'arrow' },
  bidirectional:     { style: 'solid',  color: '#14b8a6', marker: 'double-arrow' },
  tension:           { style: 'wavy',   color: '#f59e0b', marker: 'arrow' },
  equivalent:        { style: 'double', color: '#10b981', marker: 'arrow' },
  different:         { style: 'double', color: '#ef4444', marker: 'arrow' },
  alternative:       { style: 'solid',  color: '#a855f7', marker: 'arrow' },
  alternative_worse: { style: 'solid',  color: '#ef4444', marker: 'worse' },
  alternative_better:{ style: 'solid',  color: '#10b981', marker: 'better' },
};

/**
 * Get visualization metadata for a node type.
 * Used during IR → GraphData transformation.
 */
export function getNodeVisualization(nodeType: NodeType): VisualizationMetadata {
  return {
    shape: NODE_SHAPES[nodeType],
    color: NODE_COLORS[nodeType],
  };
}

/**
 * Get visualization metadata for an edge type.
 * Used during IR → GraphData transformation.
 */
export function getEdgeVisualization(edgeType: EdgeType): EdgeVisualization {
  return EDGE_STYLES[edgeType];
}
