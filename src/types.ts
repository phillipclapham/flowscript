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
  | 'exploring'
  | 'parking';

export interface Node {
  id: string;  // content-hash (SHA-256)
  type: NodeType;
  content: string;
  provenance: Provenance;
  children?: Node[];
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
  | 'alternative_better';

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
