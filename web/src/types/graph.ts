/**
 * Graph Data Types for D3 Visualization
 * Session 7b: Graph Preview
 */

export type NodeType =
  | 'question'
  | 'decision'
  | 'thought'
  | 'tension'
  | 'action'
  | 'milestone'
  | 'reference'
  | 'important'
  | 'note'
  | 'check'
  | 'wip'
  | 'placeholder';

export type EdgeType =
  | 'causal'
  | 'temporal'
  | 'bidirectional'
  | 'definition'
  | 'feedback'
  | 'alternative'
  | 'indirection';

export interface GraphNode {
  id: string;
  type: NodeType;
  content: string;
  lineNumber: number;
  state?: {
    decided?: { rationale: string; on: string };
    blocked?: { reason: string; since: string };
  };
  // D3 will add these during simulation
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}
