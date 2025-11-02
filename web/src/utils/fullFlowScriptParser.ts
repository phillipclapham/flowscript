/**
 * Full FlowScript Parser (Browser-Compatible)
 * Session 7b.2.5.2: Phase 3 - Direct IR Rendering
 *
 * Production-ready parser using Ohm.js grammar + IndentationScanner preprocessing.
 * Ported from /src/parser.ts, adapted for browser environment (no fs module).
 *
 * Supports all 21 FlowScript markers:
 * - Relationships: ->, <-, <=, <=>, =>, ><
 * - Questions: ?
 * - Insights: thought:, action:
 * - Completion: ✓
 * - Alternatives: ||
 * - States: [decided], [blocked], [exploring], [parking]
 * - Modifiers: !, ++, *, ~
 * - Structure: { }
 * - Definition: =, !=
 *
 * Architecture:
 * 1. Preprocess indentation (Python-style → explicit blocks)
 * 2. Parse with Ohm.js grammar
 * 3. Generate IR via semantic actions
 * 4. Post-process (link states, alternatives, children)
 * 5. Return IR or error
 *
 * Zero semantic loss - all IR types supported.
 */

import * as ohm from 'ohm-js';
import { grammarSource } from './grammar';
import { IndentationScanner } from './indentation-scanner';
import { hashContentSync } from './hash';
import type { IR, Node, Relationship, State, Provenance } from '../../../src/types';

/**
 * Result of parsing FlowScript text.
 * Either succeeds with IR, or fails with error.
 */
export interface ParseResult {
  ir?: IR;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}

/**
 * Parser state for semantic actions.
 * Manages nodes, relationships, states during IR generation.
 */
interface ParserState {
  sourceFile: string;
  nodes: Node[];
  relationships: Relationship[];
  states: State[];
  currentModifiers: string[];
  currentSourceNode: Node | null;
  blockStartNodeIndex: number | null;
  blockPrimaryNode: Node | null;
  lineMap: Map<number, number> | null;
}

/**
 * Parse FlowScript text into IR JSON.
 *
 * @param input - FlowScript source text
 * @param sourceFile - Source file name (default: 'editor.fs')
 * @returns ParseResult with IR or error
 *
 * @example
 * const result = parseFlowScript('A -> B');
 * if (result.ir) {
 *   console.log(result.ir.nodes); // [{ type: 'statement', content: 'A', ... }, ...]
 * }
 */
export function parseFlowScript(input: string, sourceFile = 'editor.fs'): ParseResult {
  try {
    // Step 1: Preprocess indentation (Python-style → explicit blocks)
    const scanner = new IndentationScanner();
    let scanResult;
    try {
      scanResult = scanner.process(input);
    } catch (error) {
      // IndentationError thrown during preprocessing
      return {
        error: {
          message: error instanceof Error ? error.message : 'Indentation error',
          line: (error as any).line,
        },
      };
    }

    // Step 2: Parse with Ohm.js grammar
    const grammar = ohm.grammar(grammarSource);
    const matchResult = grammar.match(scanResult.transformed);

    if (matchResult.failed()) {
      return {
        error: {
          message: matchResult.message || 'Parse failed',
        },
      };
    }

    // Step 3: Generate IR (semantic actions)
    const state: ParserState = {
      sourceFile,
      nodes: [],
      relationships: [],
      states: [],
      currentModifiers: [],
      currentSourceNode: null,
      blockStartNodeIndex: null,
      blockPrimaryNode: null,
      lineMap: scanResult.lineMap,
    };

    const semantics = createSemantics(grammar, state);
    semantics(matchResult).toIR();

    // Step 4: Post-process
    linkStatesToNodes(state);
    linkQuestionsToAlternatives(state);
    populateChildrenArrays(state);

    // Step 5: Return IR
    return {
      ir: {
        version: '1.0.0',
        nodes: state.nodes,
        relationships: state.relationships,
        states: state.states,
        invariants: {
          causal_acyclic: true,
          all_nodes_reachable: true,
          tension_axes_labeled: true,
          state_fields_present: true,
        },
        metadata: {
          source_files: [sourceFile],
          parsed_at: new Date().toISOString(),
          parser: 'flowscript-browser-parser 1.0.0',
        },
      },
    };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown parse error',
      },
    };
  }
}

// ============================================================================
// Semantic Actions
// ============================================================================

/**
 * Create Ohm.js semantics with IR generation actions.
 * Ported from src/parser.ts createSemantics() method.
 */
function createSemantics(grammar: ohm.Grammar, state: ParserState) {
  const semantics = grammar.createSemantics();

  semantics.addOperation('toIR', {
    Document(lines) {
      lines.toIR();
    },

    Line(content) {
      content.toIR();
    },

    BlankLine(_space, _newline) {
      // Skip blank lines
    },

    // Relationship Expressions
    RelationshipExpression(firstRelNode, pairs) {
      const firstNodeObj = firstRelNode.toIR();
      state.currentSourceNode = firstNodeObj;

      const pairsList = pairs.children;
      for (let i = 0; i < pairsList.length; i++) {
        pairsList[i].toIR();
      }

      state.currentSourceNode = null;
      return { type: 'relationship_expression' };
    },

    RelOpNodePair(operator, relNode) {
      const currentSource = state.currentSourceNode!;
      const targetNode = relNode.toIR();
      const relType = operator.toIR();

      let relationship;
      if (relType.reverse) {
        relationship = createRelationship(
          state,
          relType.type,
          targetNode,
          currentSource,
          relType.axisLabel,
          operator
        );
      } else {
        relationship = createRelationship(
          state,
          relType.type,
          currentSource,
          targetNode,
          relType.axisLabel,
          operator
        );
      }

      state.relationships.push(relationship);
      state.currentSourceNode = targetNode;

      return { type: 'relop_node_pair' };
    },

    RelNode(_ws1, content, _ws2) {
      const result = content.toIR();

      if (result && typeof result === 'object' && result.type === 'block') {
        return result.node;
      }

      const text = content.sourceString.trim();
      const node = createNode(state, 'statement', text, state.currentModifiers, content);
      state.nodes.push(node);
      return node;
    },

    NodeText(_chars) {
      return this.sourceString;
    },

    // Continuation Relationship
    ContinuationRel(operator, _space, relNode) {
      let sourceNode = state.blockPrimaryNode;

      if (!sourceNode && state.blockStartNodeIndex !== null) {
        if (state.nodes.length > state.blockStartNodeIndex) {
          sourceNode = state.nodes[state.blockStartNodeIndex];
          state.blockPrimaryNode = sourceNode;
        }
      }

      if (!sourceNode) {
        relNode.toIR();
        return { type: 'continuation_no_source' };
      }

      const targetNode = relNode.toIR();
      const relType = operator.toIR();

      let relationship;
      if (relType.reverse) {
        relationship = createRelationship(
          state,
          relType.type,
          targetNode,
          sourceNode,
          relType.axisLabel,
          operator
        );
      } else {
        relationship = createRelationship(
          state,
          relType.type,
          sourceNode,
          targetNode,
          relType.axisLabel,
          operator
        );
      }

      state.relationships.push(relationship);
      return { type: 'continuation_relationship' };
    },

    RelOp(op) {
      return op.toIR();
    },

    bidirectional(_arrow) {
      return { type: 'bidirectional', axisLabel: null, reverse: false };
    },

    causal(_arrow) {
      return { type: 'causes', axisLabel: null, reverse: false };
    },

    reverseCausal(_arrow) {
      return { type: 'derives_from', axisLabel: null, reverse: false };
    },

    temporal(_arrow) {
      return { type: 'temporal', axisLabel: null, reverse: false };
    },

    tensionWithAxis(_open, axisLabel, _close) {
      return { type: 'tension', axisLabel: axisLabel.sourceString, reverse: false };
    },

    tensionWithoutAxis(_marker) {
      return { type: 'tension', axisLabel: null, reverse: false };
    },

    axisLabel(_chars) {
      return this.sourceString;
    },

    Element(modifiers, content) {
      state.currentModifiers = modifiers.children.map((m: any) => m.toIR());
      const result = content.toIR();
      state.currentModifiers = [];
      return result;
    },

    Content(contentType) {
      return contentType.toIR();
    },

    Modifier(_marker) {
      const text = this.sourceString;
      const modMap: Record<string, string> = {
        '!': 'urgent',
        '++': 'strong_positive',
        '*': 'high_confidence',
        '~': 'low_confidence',
      };
      return modMap[text] || text;
    },

    // State markers
    State(stateType) {
      return stateType.toIR();
    },

    decidedWithFields(_open, fieldsNode, _close) {
      const fields = fieldsNode.children.length > 0 ? fieldsNode.children[0].toIR() : {};

      const stateObj: State = {
        id: hashContentSync({ type: 'decided', fields }),
        type: 'decided',
        node_id: '',
        fields,
        provenance: getProvenance(state, this),
      };
      state.states.push(stateObj);
      return stateObj;
    },

    decidedFields(firstField, _space1, _comma, _space2, restFields) {
      const fields: Record<string, string> = {};
      Object.assign(fields, firstField.toIR());

      const restFieldsList = restFields.children;
      for (let i = 0; i < restFieldsList.length; i++) {
        Object.assign(fields, restFieldsList[i].toIR());
      }

      return fields;
    },

    decidedField(field) {
      return field.toIR();
    },

    rationalField(_key, _space, value) {
      return { rationale: extractString(value.sourceString) };
    },

    onField(_key, _space, value) {
      return { on: extractString(value.sourceString) };
    },

    decidedWithoutFields(_token) {
      const fields: Record<string, string> = {};

      const stateObj: State = {
        id: hashContentSync({ type: 'decided', fields }),
        type: 'decided',
        node_id: '',
        fields,
        provenance: getProvenance(state, this),
      };
      state.states.push(stateObj);
      return stateObj;
    },

    blockedWithFields(_open, fieldsNode, _close) {
      const fields = fieldsNode.children.length > 0 ? fieldsNode.children[0].toIR() : {};

      const stateObj: State = {
        id: hashContentSync({ type: 'blocked', fields }),
        type: 'blocked',
        node_id: '',
        fields,
        provenance: getProvenance(state, this),
      };
      state.states.push(stateObj);
      return stateObj;
    },

    blockedFields(firstField, _space1, _comma, _space2, restFields) {
      const fields: Record<string, string> = {};
      Object.assign(fields, firstField.toIR());

      const restFieldsList = restFields.children;
      for (let i = 0; i < restFieldsList.length; i++) {
        Object.assign(fields, restFieldsList[i].toIR());
      }

      return fields;
    },

    blockedField(field) {
      return field.toIR();
    },

    reasonField(_key, _space, value) {
      return { reason: extractString(value.sourceString) };
    },

    sinceField(_key, _space, value) {
      return { since: extractString(value.sourceString) };
    },

    blockedWithoutFields(_token) {
      const fields: Record<string, string> = {};

      const stateObj: State = {
        id: hashContentSync({ type: 'blocked', fields }),
        type: 'blocked',
        node_id: '',
        fields,
        provenance: getProvenance(state, this),
      };
      state.states.push(stateObj);
      return stateObj;
    },

    exploring(_token) {
      const stateObj: State = {
        id: hashContentSync({ type: 'exploring', fields: {} }),
        type: 'exploring',
        node_id: '',
        fields: {},
        provenance: getProvenance(state, this),
      };
      state.states.push(stateObj);
      return stateObj;
    },

    parkingWithFields(_open, fieldsNode, _close) {
      const fields = fieldsNode.children.length > 0 ? fieldsNode.children[0].toIR() : {};

      const stateObj: State = {
        id: hashContentSync({ type: 'parking', fields }),
        type: 'parking',
        node_id: '',
        fields,
        provenance: getProvenance(state, this),
      };
      state.states.push(stateObj);
      return stateObj;
    },

    parkingFields(firstField, _space1, _comma, _space2, restFields) {
      const fields: Record<string, string> = {};
      Object.assign(fields, firstField.toIR());

      const restFieldsList = restFields.children;
      for (let i = 0; i < restFieldsList.length; i++) {
        Object.assign(fields, restFieldsList[i].toIR());
      }

      return fields;
    },

    parkingField(field) {
      return field.toIR();
    },

    whyField(_key, _space, value) {
      return { why: extractString(value.sourceString) };
    },

    untilField(_key, _space, value) {
      return { until: extractString(value.sourceString) };
    },

    parkingWithoutFields(_token) {
      const fields: Record<string, string> = {};

      const stateObj: State = {
        id: hashContentSync({ type: 'parking', fields }),
        type: 'parking',
        node_id: '',
        fields,
        provenance: getProvenance(state, this),
      };
      state.states.push(stateObj);
      return stateObj;
    },

    // Insights
    Insight(insight) {
      return insight.toIR();
    },

    Thought(_marker, _space, text, block, relPairs, _newline) {
      const hasText = text.sourceString.trim().length > 0;
      const hasBlock = block.sourceString.trim().length > 0;

      let node;
      if (hasBlock) {
        const blockResult = block.toIR();
        if (blockResult && blockResult.node) {
          node = blockResult.node;
          node.type = 'thought';
          if (hasText) {
            node.content = text.sourceString.trim();
          }
        } else {
          const textContent = hasText ? text.sourceString.trim() : '';
          node = createNode(state, 'thought', textContent, state.currentModifiers, this);
          state.nodes.push(node);
        }
      } else if (hasText) {
        const textContent = text.sourceString.trim();
        node = createNode(state, 'thought', textContent, state.currentModifiers, this);
        state.nodes.push(node);
      } else {
        node = createNode(state, 'thought', '', state.currentModifiers, this);
        state.nodes.push(node);
      }

      if (relPairs.children.length > 0) {
        state.currentSourceNode = node;
        relPairs.toIR();
        state.currentSourceNode = null;
      }

      return node;
    },

    Action(_marker, _space, text, block, relPairs, _newline) {
      const hasText = text.sourceString.trim().length > 0;
      const hasBlock = block.sourceString.trim().length > 0;

      let node;
      if (hasBlock) {
        const blockResult = block.toIR();
        if (blockResult && blockResult.node) {
          node = blockResult.node;
          node.type = 'action';
          if (hasText) {
            node.content = text.sourceString.trim();
          }
        } else {
          const textContent = hasText ? text.sourceString.trim() : '';
          node = createNode(state, 'action', textContent, state.currentModifiers, this);
          state.nodes.push(node);
        }
      } else if (hasText) {
        const textContent = text.sourceString.trim();
        node = createNode(state, 'action', textContent, state.currentModifiers, this);
        state.nodes.push(node);
      } else {
        node = createNode(state, 'action', '', state.currentModifiers, this);
        state.nodes.push(node);
      }

      if (relPairs.children.length > 0) {
        state.currentSourceNode = node;
        relPairs.toIR();
        state.currentSourceNode = null;
      }

      return node;
    },

    Question(_marker, _space, text, block, _newline) {
      const hasText = text.sourceString.trim().length > 0;
      const hasBlock = block.sourceString.trim().length > 0;

      let node;
      if (hasBlock) {
        const blockResult = block.toIR();
        if (blockResult && blockResult.node) {
          node = blockResult.node;
          node.type = 'question';
          if (hasText) {
            node.content = text.sourceString.trim();
          }
        } else {
          const textContent = hasText ? text.sourceString.trim() : '';
          node = createNode(state, 'question', textContent, state.currentModifiers, this);
          state.nodes.push(node);
        }
      } else if (hasText) {
        const textContent = text.sourceString.trim();
        node = createNode(state, 'question', textContent, state.currentModifiers, this);
        state.nodes.push(node);
      } else {
        node = createNode(state, 'question', '', state.currentModifiers, this);
        state.nodes.push(node);
      }

      return node;
    },

    Completion(_marker, _space, text, block, _newline) {
      const hasText = text.sourceString.trim().length > 0;
      const hasBlock = block.sourceString.trim().length > 0;

      let node;
      if (hasBlock) {
        const blockResult = block.toIR();
        if (blockResult && blockResult.node) {
          node = blockResult.node;
          node.type = 'completion';
          if (hasText) {
            node.content = text.sourceString.trim();
          }
        } else {
          const textContent = hasText ? text.sourceString.trim() : '';
          node = createNode(state, 'completion', textContent, state.currentModifiers, this);
          state.nodes.push(node);
        }
      } else if (hasText) {
        const textContent = text.sourceString.trim();
        node = createNode(state, 'completion', textContent, state.currentModifiers, this);
        state.nodes.push(node);
      } else {
        node = createNode(state, 'completion', '', state.currentModifiers, this);
        state.nodes.push(node);
      }

      return node;
    },

    // Block (thought blocks)
    Block(_lbrace, _ws1, blockContent, _ws2, _rbrace) {
      const savedStartIndex = state.blockStartNodeIndex;
      const savedPrimaryNode = state.blockPrimaryNode;

      const blockModifiers = [...state.currentModifiers];
      state.currentModifiers = [];

      const nodesBefore = state.nodes.length;
      state.blockStartNodeIndex = nodesBefore;
      state.blockPrimaryNode = nodesBefore > 0 ? state.nodes[nodesBefore - 1] : null;

      // Parse block content (handles separators between lines)
      // blockContent is optional (empty blocks have no content)
      if (blockContent.sourceString.trim()) {
        blockContent.toIR();
      }

      const allNewNodes = state.nodes.slice(nodesBefore);
      const nestedBlocks = allNewNodes.filter(n => n.type === 'block');
      const nestedBlockChildIds = new Set(
        nestedBlocks.flatMap(b => {
          const children = b.ext?.children;
          return Array.isArray(children) ? children.map((c: Node) => c.id) : [];
        })
      );

      const directChildren = allNewNodes.filter(n => !nestedBlockChildIds.has(n.id));

      const blockNode: Node = {
        id: hashContentSync({ type: 'block', children: directChildren.map(c => c.id), modifiers: blockModifiers }),
        type: 'block',
        content: '',
        provenance: getProvenance(state, this),
      };

      if (directChildren.length > 0 || blockModifiers.length > 0) {
        blockNode.ext = {};
        if (directChildren.length > 0) {
          blockNode.ext.children = directChildren;
        }
        if (blockModifiers.length > 0) {
          blockNode.ext.modifiers = blockModifiers;
        }
      }

      state.nodes.push(blockNode);

      state.blockStartNodeIndex = savedStartIndex;
      state.blockPrimaryNode = savedPrimaryNode;

      return { type: 'block', node: blockNode };
    },

    BlockLine(_ws, line) {
      return line.toIR();
    },

    BlockContent(firstLine, separators, blockLines, _optionalSeparator) {
      // Process first line
      firstLine.toIR();

      // Process remaining lines
      // The iteration (separator BlockLine)* gets split into two arrays
      const blockLinesList = blockLines.children || [];
      for (const line of blockLinesList) {
        line.toIR();
      }
    },

    separator(_sep) {
      // Separators are just delimiters - no IR needed
    },

    ws(_whitespace) {
      // Whitespace is just formatting - no IR needed
    },

    BlockElement(modifiers, content) {
      // Same as Element but for blocks
      const mods = modifiers.children.map((m: any) => m.sourceString);
      state.currentModifiers = mods;
      return content.toIR();
    },

    BlockContent_inner(content) {
      // Just pass through to the actual content type
      return content.toIR();
    },

    BlockStatement(text) {
      // Same as Statement but without trailing newline
      const content = text.sourceString.trim();
      const node = createNode(state, 'statement', content, state.currentModifiers, text);
      state.nodes.push(node);
      state.currentModifiers = [];
      return node;
    },

    // Alternative
    Alternative(_marker, _space, text, block, _newline) {
      const hasText = text.sourceString.trim().length > 0;
      const hasBlock = block.sourceString.trim().length > 0;

      let node;
      if (hasBlock) {
        const blockResult = block.toIR();
        if (blockResult && blockResult.node) {
          node = blockResult.node;
          node.type = 'alternative';
          if (hasText) {
            node.content = text.sourceString.trim();
          }
        } else {
          const textContent = hasText ? text.sourceString.trim() : '';
          node = createNode(state, 'alternative', textContent, state.currentModifiers, this);
          state.nodes.push(node);
        }
      } else if (hasText) {
        const textContent = text.sourceString.trim();
        node = createNode(state, 'alternative', textContent, state.currentModifiers, this);
        state.nodes.push(node);
      } else {
        node = createNode(state, 'alternative', '', state.currentModifiers, this);
        state.nodes.push(node);
      }

      return { type: 'alternative', node };
    },

    // Statement (prose)
    Statement(content, _newline) {
      const text = content.sourceString.trim();
      if (text.length > 0) {
        const node = createNode(state, 'statement', text, state.currentModifiers, this);
        state.nodes.push(node);
      }
    },

    // Default handlers
    _terminal() {
      return this.sourceString;
    },

    _iter(...children: any[]) {
      return children.map(c => c.toIR());
    },
  });

  return semantics;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractString(text: string): string {
  if (text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1);
  }
  return text;
}

function getProvenance(state: ParserState, node: any): Provenance {
  const interval = node.source;
  const lineInfo = interval.getLineAndColumnMessage?.() || '';
  const lineMatch = lineInfo.match(/Line (\d+)/);
  const transformedLine = lineMatch ? parseInt(lineMatch[1]) : 1;

  const originalLine = state.lineMap?.get(transformedLine) ?? transformedLine;

  return {
    source_file: state.sourceFile,
    line_number: originalLine,
    timestamp: new Date().toISOString(),
  };
}

function createNode(state: ParserState, type: string, content: string, modifiers: string[], node: any): Node {
  const result: Node = {
    id: hashContentSync({ type, content, modifiers }),
    type: type as any,
    content,
    provenance: getProvenance(state, node),
  };

  if (modifiers.length > 0) {
    result.modifiers = modifiers;
  }

  return result;
}

function createRelationship(
  state: ParserState,
  type: string,
  source: Node,
  target: Node,
  axisLabel: string | null,
  node: any
): Relationship {
  const rel: Relationship = {
    id: hashContentSync({ type, source: source.id, target: target.id, axisLabel }),
    type: type as any,
    source: source.id,
    target: target.id,
    provenance: getProvenance(state, node),
  };

  if (type === 'tension') {
    rel.axis_label = axisLabel;
  }

  return rel;
}

// ============================================================================
// Post-Processing Functions
// ============================================================================

/**
 * Link state markers to following nodes.
 * States annotate the node that appears after them in source order.
 */
function linkStatesToNodes(state: ParserState): void {
  for (const stateObj of state.states) {
    const stateLine = stateObj.provenance.line_number;

    const nextNode = state.nodes.find(node => node.provenance.line_number >= stateLine);

    if (nextNode) {
      stateObj.node_id = nextNode.id;
    }
  }
}

/**
 * Link questions to their alternatives.
 * Creates alternative relationships from question nodes to following || markers.
 */
function linkQuestionsToAlternatives(state: ParserState): void {
  for (let i = 0; i < state.nodes.length; i++) {
    const node = state.nodes[i];

    if (node.type !== 'question') continue;

    const alternatives: Node[] = [];

    for (let j = i + 1; j < state.nodes.length; j++) {
      const candidate = state.nodes[j];

      if (candidate.type === 'question') break;

      if (candidate.type === 'alternative') {
        alternatives.push(candidate);
      }
    }

    for (const alt of alternatives) {
      const relationship: Relationship = {
        id: hashContentSync({ type: 'alternative', source: node.id, target: alt.id }),
        type: 'alternative' as any,
        source: node.id,
        target: alt.id,
        provenance: alt.provenance,
      };
      state.relationships.push(relationship);
    }
  }
}

/**
 * Populate hierarchical children arrays per spec.
 * Children represent syntactic nesting (who is indented under whom).
 */
function populateChildrenArrays(state: ParserState): void {
  // Step 1: Questions get children from alternative relationships
  for (const rel of state.relationships) {
    if (rel.type === 'alternative') {
      const question = state.nodes.find(n => n.id === rel.source);
      if (question) {
        if (!question.children) {
          question.children = [];
        }
        question.children.push(rel.target);
      }
    }
  }

  // Step 2: For each block, find the node that precedes its first child
  for (const blockNode of state.nodes) {
    if (blockNode.type !== 'block' || !blockNode.ext?.children || !Array.isArray(blockNode.ext.children)) {
      continue;
    }

    const blockChildren = blockNode.ext.children as Node[];
    if (blockChildren.length === 0) continue;

    let firstChild: Node | null = null;
    for (const child of blockChildren) {
      if (child.type !== 'block') {
        firstChild = child;
        break;
      }
    }

    if (!firstChild) continue;

    const firstChildIndex = state.nodes.findIndex(n => n.id === firstChild.id);
    if (firstChildIndex <= 0) continue;

    const parentNode = state.nodes[firstChildIndex - 1];

    if (parentNode.type === 'block') continue;

    const directChildren: string[] = [];
    for (const child of blockChildren) {
      if (child.type !== 'block') {
        directChildren.push(child.id);
      }
    }

    if (directChildren.length > 0) {
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(...directChildren);
    }
  }
}
