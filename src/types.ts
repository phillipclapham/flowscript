/**
 * FlowScript Type Definitions
 *
 * Defines the type system for FlowScript tokens and IR (Intermediate Representation).
 * Types match the formal specification in /spec/ir.schema.json
 */

// ============================================================================
// Token Types (for tokenizer)
// ============================================================================

export enum TokenType {
  // Core Relations
  ARROW_RIGHT = '->',
  ARROW_LEFT = '<-',
  ARROW_BI = '<->',
  ARROW_TEMPORAL = '=>',
  TENSION = '><',

  // Definition
  EQUALS = '=',
  NOT_EQUALS = '!=',

  // States
  DECIDED = '[decided]',
  EXPLORING = '[exploring]',
  BLOCKED = '[blocked]',
  PARKING = '[parking]',

  // Insights & Questions
  THOUGHT = 'thought:',
  QUESTION = '?',
  CHECKMARK = '✓',

  // Commands
  ACTION = 'action:',

  // Modifiers
  URGENT = '!',
  POSITIVE = '++',
  CONFIDENT = '*',
  UNCERTAIN = '~',

  // Structure
  BRACE_OPEN = '{',
  BRACE_CLOSE = '}',

  // Alternative
  ALTERNATIVE = '||',

  // Special
  TEXT = 'TEXT',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// ============================================================================
// IR Types (matching ir.schema.json)
// ============================================================================

export interface Provenance {
  source_file: string;
  line_number: number;
  timestamp: string;  // ISO-8601 format
  author?: {
    agent: string;
    role: 'human' | 'ai';
  };
}

export type NodeType =
  | 'statement'
  | 'question'
  | 'thought'
  | 'action'
  | 'block'
  | 'decision'
  | 'blocker'
  | 'insight'
  | 'completion'
  | 'alternative'
  | 'exploring'
  | 'parking'
  | 'fixpoint';

export interface Node {
  id: string;  // content-hash (SHA-256)
  type: NodeType;
  content: string;
  provenance: Provenance;
  children?: string[];  // Array of child node IDs (not full Node objects)
  modifiers?: string[];  // Modifiers: "urgent", "strong_positive", "high_confidence", "low_confidence"
  ext?: Record<string, unknown>;
}

export type RelationType =
  | 'causes'
  | 'temporal'
  | 'derives_from'
  | 'bidirectional'
  | 'tension'
  | 'equivalent'
  | 'different'
  | 'alternative'
  | 'alternative_worse'
  | 'alternative_better'
  | 'fixpoint_derived';

export interface Relationship {
  id: string;  // content-hash (SHA-256)
  type: RelationType;
  source: string;  // Node.id
  target: string;  // Node.id
  axis_label?: string | null;  // REQUIRED for tension relationships
  feedback?: boolean;  // for causal cycles (default: false)
  provenance: Provenance;
  ext?: Record<string, unknown>;
}

export type StateType =
  | 'decided'
  | 'exploring'
  | 'blocked'
  | 'parking';

export interface State {
  id: string;  // content-hash (SHA-256)
  type: StateType;
  node_id: string;  // ID of node this state applies to
  fields: Record<string, string>;  // e.g., { rationale: "...", on: "2025-10-17" }
  provenance: Provenance;
}

export interface GraphInvariants {
  causal_acyclic?: boolean;
  all_nodes_reachable?: boolean;
  tension_axes_labeled?: boolean;
  state_fields_present?: boolean;
  fixpoint_constraint_valid?: boolean;
  fixpoint_convergence_valid?: boolean;
  fixpoint_bound_present?: boolean;
  fixpoint_nesting_monotone?: boolean;
  fixpoint_derivation_complete?: boolean;
}

// ============================================================================
// Fixpoint Types (@fix operator)
// ============================================================================

export type ConstraintLevel = 'L1' | 'L2';
export type FixpointStatus = 'declared' | 'converged' | 'bounded';

export interface FixpointMatchPattern {
  type: 'node' | 'path' | 'negation' | 'query_ref';
  variable?: string;
  node_type?: string;
  conditions?: FixpointPredicate[];
  // Path pattern fields
  steps?: FixpointPathStep[];
  // Negation fields
  negated?: FixpointMatchPattern;
  // Query reference fields
  query_name?: string;
  args?: string[];
}

export interface FixpointPathStep {
  type: 'node' | 'edge';
  variable?: string;
  node_type?: string;
  conditions?: FixpointPredicate[];
  edge_label?: string;
}

export interface FixpointPredicate {
  name: string;
  args: string[];
}

export interface FixpointYieldElement {
  type: 'relationship' | 'node' | 'node_relationship' | 'state' | 'builtin' | 'nested_fix';
  // Relationship production
  source_var?: string;
  edge_label?: string;
  target_var?: string;
  // Node production
  node_kind?: string;
  args?: string[];
  // State production
  action?: 'resolve' | 'annotate';
  variable?: string;
  // Annotations
  annotations?: Record<string, string>;
  // Nested fixpoint (stored as full FixpointExt)
  nested?: FixpointExt;
}

export interface FixpointTermination {
  type: 'stable' | 'max_iterations' | 'timeout' | 'measure' | 'compound';
  value?: number;
  unit?: string;
  measure_name?: string;
  conditions?: FixpointTermination[];
}

export interface FixpointExt {
  name: string | null;
  constraint: ConstraintLevel | null;
  status: FixpointStatus;
  match: FixpointMatchPattern[];
  yield: FixpointYieldElement[];
  until: FixpointTermination;
  // Populated after execution (not during parsing)
  iterations?: number;
  delta_sequence?: number[];
  initial_graph_hash?: string;
  final_graph_hash?: string;
  bound_type?: string;
  bound_value?: number;
  skolem_constants_created?: number;
  skolem_constants_grounded?: number;
  skolem_constants_unresolved?: number;
}

export interface IR {
  version: '1.0.0';
  nodes: Node[];
  relationships: Relationship[];
  states: State[];
  invariants: GraphInvariants;
  metadata?: {
    source_files?: string[];
    parsed_at?: string;
    parser?: string;
  };
}
