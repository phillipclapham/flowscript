/**
 * FlowScript PEG Parser (Ohm.js)
 *
 * Compiles FlowScript text → IR JSON using PEG grammar.
 * Minimal working version - incrementally building up functionality.
 */

import * as ohm from 'ohm-js';
import * as fs from 'fs';
import * as path from 'path';
import { Node, Relationship, State, IR, Provenance } from './types';
import { hashContent } from './hash';
import { IndentationScanner } from './indentation-scanner';

// Load grammar
const grammarPath = path.join(__dirname, 'grammar.ohm');
const grammarSource = fs.readFileSync(grammarPath, 'utf-8');
const grammar = ohm.grammar(grammarSource);

export class Parser {
  private sourceFile: string;
  private nodes: Node[] = [];
  private relationships: Relationship[] = [];
  private states: State[] = [];
  private currentModifiers: string[] = [];
  private currentSourceNode: Node | null = null;
  private blockStartNodeIndex: number | null = null;  // Track where block nodes start
  private blockPrimaryNode: Node | null = null;        // Cache first node in block
  private lineMap: Map<number, number> | null = null; // Maps transformed → original line numbers

  constructor(sourceFile: string) {
    this.sourceFile = sourceFile;
  }

  parse(input: string): IR {
    // Preprocess: Transform indentation to explicit blocks
    const scanner = new IndentationScanner();
    const { transformed, lineMap } = scanner.process(input);

    // Store lineMap for provenance mapping
    this.lineMap = lineMap;

    // Parse transformed source with Ohm
    const match = grammar.match(transformed);

    if (match.failed()) {
      throw new Error(`Parse error: ${match.message}`);
    }

    // Reset state
    this.nodes = [];
    this.relationships = [];
    this.states = [];

    // Build IR using semantics
    const semantics = this.createSemantics();
    semantics(match).toIR();

    // Link state markers to following nodes
    this.linkStatesToNodes();

    // Link questions to their alternatives
    this.linkQuestionsToAlternatives();

    // Populate hierarchical children arrays
    this.populateChildrenArrays();

    return {
      version: '1.0.0',
      nodes: this.nodes,
      relationships: this.relationships,
      states: this.states,
      invariants: {
        causal_acyclic: true,
        all_nodes_reachable: true,
        tension_axes_labeled: true,
        state_fields_present: true
      },
      metadata: {
        source_files: [this.sourceFile],
        parsed_at: new Date().toISOString(),
        parser: 'flowscript-peg-parser 1.0.0'
      }
    };
  }

  private extractString(text: string): string {
    // Remove quotes if present
    if (text.startsWith('"') && text.endsWith('"')) {
      return text.slice(1, -1);
    }
    return text;
  }

  private getProvenance(node: any): Provenance {
    const interval = node.source;
    const lineInfo = interval.getLineAndColumnMessage?.() || '';
    const lineMatch = lineInfo.match(/Line (\d+)/);
    const transformedLine = lineMatch ? parseInt(lineMatch[1]) : 1;

    // Map transformed line number back to original line number
    const originalLine = this.lineMap?.get(transformedLine) ?? transformedLine;

    return {
      source_file: this.sourceFile,
      line_number: originalLine,
      timestamp: new Date().toISOString()
    };
  }

  private createNode(type: string, content: string, modifiers: string[], node: any): Node {
    const result: Node = {
      id: hashContent({ type, content, modifiers }),
      type: type as any,
      content,
      provenance: this.getProvenance(node)
    };

    // Store modifiers at top level per ir.schema.json
    if (modifiers.length > 0) {
      result.modifiers = modifiers;
    }

    return result;
  }

  private createRelationship(
    type: string,
    source: Node,
    target: Node,
    axisLabel: string | null,
    node: any
  ): Relationship {
    const rel: Relationship = {
      id: hashContent({ type, source: source.id, target: target.id, axisLabel }),
      type: type as any,
      source: source.id,
      target: target.id,
      provenance: this.getProvenance(node)
    };

    // Always set axis_label (null for non-tension or tension without axis)
    if (type === 'tension') {
      rel.axis_label = axisLabel;
    }

    return rel;
  }

  private createSemantics() {
    const self = this;

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
        // Parse first node (can be Block or NodeText)
        const firstNodeObj = firstRelNode.toIR();

        // Set as current source for RelOpNodePair processing
        self.currentSourceNode = firstNodeObj;

        // Process each RelOpNodePair
        const pairsList = pairs.children;
        for (let i = 0; i < pairsList.length; i++) {
          pairsList[i].toIR();
        }

        // Clear state
        self.currentSourceNode = null;

        return { type: 'relationship_expression' };
      },

      RelOpNodePair(operator, relNode) {
        // Get current source from parser state
        const currentSource = self.currentSourceNode!;

        // Parse target node (can be Block or NodeText)
        const targetNode = relNode.toIR();

        // Create relationship based on operator type
        const relType = operator.toIR();

        // Handle reverse causal (swap source and target)
        let relationship;
        if (relType.reverse) {
          relationship = self.createRelationship(
            relType.type,
            targetNode,  // target becomes source
            currentSource,  // source becomes target
            relType.axisLabel,
            operator
          );
        } else {
          relationship = self.createRelationship(
            relType.type,
            currentSource,
            targetNode,
            relType.axisLabel,
            operator
          );
        }

        self.relationships.push(relationship);

        // Update current source for next pair (enables chaining)
        self.currentSourceNode = targetNode;

        return { type: 'relop_node_pair' };
      },

      RelNode(_ws1, content, _ws2) {
        // content is either Block or NodeText
        const result = content.toIR();

        // If it's a block, result will be { type: 'block', node: blockNode }
        if (result && typeof result === 'object' && result.type === 'block') {
          return result.node;  // Return the block node
        }

        // It's NodeText - create a statement node
        const text = content.sourceString.trim();
        const node = self.createNode('statement', text, self.currentModifiers, content);
        self.nodes.push(node);
        return node;
      },

      NodeText(chars) {
        return this.sourceString;
      },

      // Continuation Relationship (block-scoped implicit source)
      ContinuationRel(operator, _space, relNode) {
        // Get or find the block's primary node (first node in block)
        let sourceNode = self.blockPrimaryNode;

        // Lazy evaluation: if primary node not cached, find it
        if (!sourceNode && self.blockStartNodeIndex !== null) {
          if (self.nodes.length > self.blockStartNodeIndex) {
            sourceNode = self.nodes[self.blockStartNodeIndex];
            self.blockPrimaryNode = sourceNode;  // Cache for subsequent continuations
          }
        }

        // If no source node available, skip relationship creation
        if (!sourceNode) {
          // Still parse the target node so it gets created
          relNode.toIR();
          return { type: 'continuation_no_source' };
        }

        // Parse target node
        const targetNode = relNode.toIR();

        // Get relationship type from operator
        const relType = operator.toIR();

        // Create relationship (handle reverse operators)
        let relationship;
        if (relType.reverse) {
          // Reverse causal: target -> source (swap)
          relationship = self.createRelationship(
            relType.type,
            targetNode,    // target becomes source
            sourceNode,    // source becomes target
            relType.axisLabel,
            operator
          );
        } else {
          // Normal: source -> target
          relationship = self.createRelationship(
            relType.type,
            sourceNode,
            targetNode,
            relType.axisLabel,
            operator
          );
        }

        self.relationships.push(relationship);

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

      axisLabel(chars) {
        return this.sourceString;
      },

      Element(modifiers, content) {
        // Extract modifiers and store in parser state
        self.currentModifiers = modifiers.children.map((m: any) => m.toIR());

        // Call content semantic action WITHOUT passing modifiers
        const result = content.toIR();

        // Clear modifiers after use
        self.currentModifiers = [];

        return result;
      },

      Content(contentType) {
        return contentType.toIR();
      },

      Modifier(marker) {
        const text = this.sourceString;
        const modMap: Record<string, string> = {
          '!': 'urgent',
          '++': 'strong_positive',
          '*': 'high_confidence',
          '~': 'low_confidence'
        };
        return modMap[text] || text;
      },

      // State markers
      State(state) {
        return state.toIR();
      },

      decidedWithFields(_open, fieldsNode, _close) {
        const fields = fieldsNode.children.length > 0 ? fieldsNode.children[0].toIR() : {};

        const state: State = {
          id: hashContent({ type: 'decided', fields }),
          type: 'decided',
          node_id: '',
          fields,
          provenance: self.getProvenance(this)
        };
        self.states.push(state);
        return state;
      },

      decidedFields(firstField, _space1, _comma, _space2, restFields) {
        const fields: Record<string, string> = {};

        // Process first field
        const firstFieldData = firstField.toIR();
        Object.assign(fields, firstFieldData);

        // Process rest of fields (iteration node)
        const restFieldsList = restFields.children;
        for (let i = 0; i < restFieldsList.length; i++) {
          const fieldData = restFieldsList[i].toIR();
          Object.assign(fields, fieldData);
        }

        return fields;
      },

      decidedField(field) {
        return field.toIR();
      },

      rationalField(_key, _space, value) {
        return { rationale: self.extractString(value.sourceString) };
      },

      onField(_key, _space, value) {
        return { on: self.extractString(value.sourceString) };
      },

      decidedWithoutFields(_token) {
        const fields: Record<string, string> = {} as Record<string, string>;

        const state: State = {
          id: hashContent({ type: 'decided', fields }),
          type: 'decided',
          node_id: '',
          fields,
          provenance: self.getProvenance(this)
        };
        self.states.push(state);
        return state;
      },

      blockedWithFields(_open, fieldsNode, _close) {
        const fields = fieldsNode.children.length > 0 ? fieldsNode.children[0].toIR() : {};

        const state: State = {
          id: hashContent({ type: 'blocked', fields }),
          type: 'blocked',
          node_id: '',
          fields,
          provenance: self.getProvenance(this)
        };
        self.states.push(state);
        return state;
      },

      blockedFields(firstField, _space1, _comma, _space2, restFields) {
        const fields: Record<string, string> = {};

        // Process first field
        const firstFieldData = firstField.toIR();
        Object.assign(fields, firstFieldData);

        // Process rest of fields (iteration node)
        const restFieldsList = restFields.children;
        for (let i = 0; i < restFieldsList.length; i++) {
          const fieldData = restFieldsList[i].toIR();
          Object.assign(fields, fieldData);
        }

        return fields;
      },

      blockedField(field) {
        return field.toIR();
      },

      reasonField(_key, _space, value) {
        return { reason: self.extractString(value.sourceString) };
      },

      sinceField(_key, _space, value) {
        return { since: self.extractString(value.sourceString) };
      },

      blockedWithoutFields(_token) {
        const fields: Record<string, string> = {} as Record<string, string>;

        const state: State = {
          id: hashContent({ type: 'blocked', fields }),
          type: 'blocked',
          node_id: '',
          fields,
          provenance: self.getProvenance(this)
        };
        self.states.push(state);
        return state;
      },

      exploring(_token) {
        const state: State = {
          id: hashContent({ type: 'exploring', fields: {} }),
          type: 'exploring',
          node_id: '',
          fields: {},
          provenance: self.getProvenance(this)
        };
        self.states.push(state);
        return state;
      },

      parkingWithFields(_open, fieldsNode, _close) {
        const fields = fieldsNode.children.length > 0 ? fieldsNode.children[0].toIR() : {};

        const state: State = {
          id: hashContent({ type: 'parking', fields }),
          type: 'parking',
          node_id: '',
          fields,
          provenance: self.getProvenance(this)
        };
        self.states.push(state);
        return state;
      },

      parkingFields(firstField, _space1, _comma, _space2, restFields) {
        const fields: Record<string, string> = {};

        // Process first field
        const firstFieldData = firstField.toIR();
        Object.assign(fields, firstFieldData);

        // Process rest of fields (iteration node)
        const restFieldsList = restFields.children;
        for (let i = 0; i < restFieldsList.length; i++) {
          const fieldData = restFieldsList[i].toIR();
          Object.assign(fields, fieldData);
        }

        return fields;
      },

      parkingField(field) {
        return field.toIR();
      },

      whyField(_key, _space, value) {
        return { why: self.extractString(value.sourceString) };
      },

      untilField(_key, _space, value) {
        return { until: self.extractString(value.sourceString) };
      },

      parkingWithoutFields(_token) {
        const fields: Record<string, string> = {} as Record<string, string>;

        const state: State = {
          id: hashContent({ type: 'parking', fields }),
          type: 'parking',
          node_id: '',
          fields,
          provenance: self.getProvenance(this)
        };
        self.states.push(state);
        return state;
      },

      // Insights
      Insight(insight) {
        return insight.toIR();
      },

      Thought(_marker, _space, content, relPairs) {
        // Parse content (can be Block or text)
        const contentResult = content.toIR();

        // Create thought node
        let node;
        if (contentResult && typeof contentResult === 'object' && contentResult.type === 'block') {
          // Content is a block - use the block node directly as thought content
          node = contentResult.node;
          node.type = 'thought';  // Change type from 'block' to 'thought'
        } else {
          // Content is text
          const text = typeof contentResult === 'string' ? contentResult : content.sourceString.trim();
          node = self.createNode('thought', text, self.currentModifiers, this);
          self.nodes.push(node);
        }

        // If relationship pairs present, process them using existing RelOpNodePair logic
        if (relPairs.children.length > 0) {
          self.currentSourceNode = node;
          relPairs.toIR(); // Reuses existing relationship chain logic
          self.currentSourceNode = null;
        }

        return node;
      },

      Action(_marker, _space, content, relPairs) {
        // Parse content (can be Block or text)
        const contentResult = content.toIR();

        // Create action node
        let node;
        if (contentResult && typeof contentResult === 'object' && contentResult.type === 'block') {
          // Content is a block - use the block node directly as action content
          node = contentResult.node;
          node.type = 'action';  // Change type from 'block' to 'action'
        } else {
          // Content is text
          const text = typeof contentResult === 'string' ? contentResult : content.sourceString.trim();
          node = self.createNode('action', text, self.currentModifiers, this);
          self.nodes.push(node);
        }

        // If relationship pairs present, process them
        if (relPairs.children.length > 0) {
          self.currentSourceNode = node;
          relPairs.toIR();
          self.currentSourceNode = null;
        }

        return node;
      },

      Question(_marker, content) {
        const node = self.createNode('question', content.sourceString.trim(), self.currentModifiers, this);
        self.nodes.push(node);
        return node;
      },

      Completion(_marker, content) {
        const node = self.createNode('completion', content.sourceString.trim(), self.currentModifiers, this);
        self.nodes.push(node);
        return node;
      },

      // Block (thought blocks)
      Block(_lbrace, _ws1, blockLines, _ws2, _rbrace) {
        // Save state for nested blocks
        const savedStartIndex = self.blockStartNodeIndex;
        const savedPrimaryNode = self.blockPrimaryNode;

        // Save modifiers before parsing block contents (they'll be cleared during parsing)
        const blockModifiers = [...self.currentModifiers];
        self.currentModifiers = [];  // Clear for child elements

        // Track nodes and blocks before parsing block content
        const nodesBefore = self.nodes.length;

        // Set block start index
        self.blockStartNodeIndex = nodesBefore;

        // Set block primary node to the parent node (node immediately before block)
        // This enables continuation relationships to reference the correct parent
        // If no parent exists, set to null (standalone blocks will use first child as fallback)
        self.blockPrimaryNode = nodesBefore > 0 ? self.nodes[nodesBefore - 1] : null;

        // Parse block lines (recursively processes all nested elements)
        blockLines.toIR();

        // Collect ALL nodes created since block started
        const allNewNodes = self.nodes.slice(nodesBefore);

        // Filter to get only DIRECT children (exclude nodes that are children of nested blocks)
        const nestedBlocks = allNewNodes.filter(n => n.type === 'block');
        const nestedBlockChildIds = new Set(
          nestedBlocks.flatMap(b => {
            const children = b.ext?.children;
            return Array.isArray(children) ? children.map((c: Node) => c.id) : [];
          })
        );

        const directChildren = allNewNodes.filter(n => {
          // Keep if it's not a child of a nested block
          return !nestedBlockChildIds.has(n.id);
        });

        // Create block node (using saved modifiers)
        const blockNode: Node = {
          id: hashContent({ type: 'block', children: directChildren.map(c => c.id), modifiers: blockModifiers }),
          type: 'block',
          content: '',  // Blocks have no direct content
          provenance: self.getProvenance(this)
        };

        // Add children and modifiers to block node
        if (directChildren.length > 0 || blockModifiers.length > 0) {
          blockNode.ext = {};
          if (directChildren.length > 0) {
            blockNode.ext.children = directChildren;
          }
          if (blockModifiers.length > 0) {
            blockNode.ext.modifiers = blockModifiers;
          }
        }

        // Add block node to nodes list
        self.nodes.push(blockNode);

        // Restore state for nested blocks
        self.blockStartNodeIndex = savedStartIndex;
        self.blockPrimaryNode = savedPrimaryNode;

        return { type: 'block', node: blockNode };
      },

      BlockLine(_ws1, line, _ws2) {
        return line.toIR();
      },

      // Alternative
      Alternative(_marker, content) {
        const node = self.createNode('alternative', content.sourceString.trim(), self.currentModifiers, this);
        self.nodes.push(node);
        return { type: 'alternative', node };
      },

      // Statement (prose)
      Statement(content, _newline) {
        const text = content.sourceString.trim();
        if (text.length > 0) {
          const node = self.createNode('statement', text, self.currentModifiers, this);
          self.nodes.push(node);
        }
      },

      // Default handlers
      _terminal() {
        return this.sourceString;
      },

      _iter(...children: any[]) {
        return children.map(c => c.toIR());
      }
    });

    return semantics;
  }

  /**
   * Link state markers to following nodes.
   * States annotate the node that appears after them in source order.
   */
  private linkStatesToNodes(): void {
    for (const state of this.states) {
      const stateLine = state.provenance.line_number;

      // Find first node at or after this line
      // Handle same-line case: [decided] Ship now (both on line N)
      const nextNode = this.nodes.find(node =>
        node.provenance.line_number >= stateLine
      );

      if (nextNode) {
        state.node_id = nextNode.id;
      }
      // If no following node, leave node_id as empty string
      // (edge case: state at end of document with no following content)
    }
  }

  /**
   * Link questions to their alternatives.
   * Creates alternative relationships from question nodes to following || markers.
   */
  private linkQuestionsToAlternatives(): void {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      if (node.type !== 'question') continue;

      // Find all alternatives that follow this question (before next question or EOF)
      const questionLine = node.provenance.line_number;
      const alternatives: Node[] = [];

      for (let j = i + 1; j < this.nodes.length; j++) {
        const candidate = this.nodes[j];

        // Stop if we hit another question (end of this question's scope)
        if (candidate.type === 'question') break;

        // Collect alternatives
        if (candidate.type === 'alternative') {
          alternatives.push(candidate);
        }
      }

      // Create alternative relationships
      for (const alt of alternatives) {
        const relationship: Relationship = {
          id: hashContent({ type: 'alternative', source: node.id, target: alt.id }),
          type: 'alternative' as any,
          source: node.id,
          target: alt.id,
          provenance: alt.provenance // Use alternative's provenance (line where || appears)
        };
        this.relationships.push(relationship);
      }
    }
  }

  /**
   * Populate hierarchical children arrays per spec.
   * Children represent syntactic nesting (who is indented under whom).
   *
   * Two-step process:
   * 1. Questions get children from alternative relationships
   * 2. Any node followed by a block inherits that block's children
   */
  private populateChildrenArrays(): void {
    // Step 1: Questions have children = their alternatives (from relationships)
    for (const rel of this.relationships) {
      if (rel.type === 'alternative') {
        const question = this.nodes.find(n => n.id === rel.source);
        if (question) {
          if (!question.children) {
            question.children = [];
          }
          question.children.push(rel.target);
        }
      }
    }

    // Step 2: For each block, find the node that precedes its first child
    // and assign the block's children to that node
    // (e.g., alternative followed by indented implications)
    for (const blockNode of this.nodes) {
      if (blockNode.type !== 'block' || !blockNode.ext?.children || !Array.isArray(blockNode.ext.children)) {
        continue;
      }

      const blockChildren = blockNode.ext.children as Node[];
      if (blockChildren.length === 0) continue;

      // Find the first non-block child in this block
      let firstChild: Node | null = null;
      for (const child of blockChildren) {
        if (child.type !== 'block') {
          firstChild = child;
          break;
        }
      }

      if (!firstChild) continue;

      // Find the index of this first child in the main nodes array
      const firstChildIndex = this.nodes.findIndex(n => n.id === firstChild.id);
      if (firstChildIndex <= 0) continue; // No preceding node

      // The node right before the first child is the parent
      const parentNode = this.nodes[firstChildIndex - 1];

      // Skip if parent is a block
      if (parentNode.type === 'block') continue;

      // Get DIRECT children only (exclude nested blocks, don't flatten recursively)
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
        // Append to existing children (e.g., question might already have alternatives)
        parentNode.children.push(...directChildren);
      }
    }
  }

  /**
   * Recursively flatten block children to get all descendant node IDs.
   * Nested blocks are expanded to include their children.
   *
   * @param children - Array of child nodes from block.ext.children
   * @returns Array of node IDs (excludes block nodes themselves)
   */
  private flattenBlockChildren(children: Node[]): string[] {
    const result: string[] = [];

    for (const child of children) {
      if (child.type === 'block' && child.ext?.children && Array.isArray(child.ext.children)) {
        // Recursively flatten nested blocks
        result.push(...this.flattenBlockChildren(child.ext.children as Node[]));
      } else {
        // Regular node: add its ID
        result.push(child.id);
      }
    }

    return result;
  }
}
