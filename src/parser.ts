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

  /**
   * Parse fixpoint annotation iterations into a key-value record.
   */
  private _parseAnnotations(annotationsNode: any): Record<string, string> {
    const result: Record<string, string> = {};
    if (annotationsNode && annotationsNode.children) {
      for (const child of annotationsNode.children) {
        const data = child.toIR();
        if (data && data.key) {
          result[data.key] = data.value;
        }
      }
    }
    return result;
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
        // content is Block, TypedRelTarget, or NodeText
        const result = content.toIR();

        // If it's a block, result will be { type: 'block', node: blockNode }
        if (result && typeof result === 'object' && result.type === 'block') {
          return result.node;
        }

        // If it's an alternative wrapper, extract the node
        if (result && typeof result === 'object' && result.type === 'alternative') {
          return result.node;
        }

        // If it's a Node (from TypedRelTarget), return directly
        if (result && typeof result === 'object' && result.id) {
          return result;
        }

        // It's NodeText - create a statement node
        const text = content.sourceString.trim();
        const node = self.createNode('statement', text, self.currentModifiers, content);
        self.nodes.push(node);
        return node;
      },

      // TypedRelTarget: delegates to specific typed target rules
      TypedRelTarget(target) {
        return target.toIR();
      },

      // Typed targets inside relationship expressions
      // These are like Thought/Action/Question/Completion/Alternative but without
      // RelOpNodePair* chaining — the outer expression handles that
      ThoughtTarget(_marker, _space, text, block) {
        const textContent = text.sourceString.trim();
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0] : null;
          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'thought';
            if (textContent) node.content = textContent;
          } else {
            node = self.createNode('thought', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else {
          node = self.createNode('thought', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        }
        self.currentModifiers = [];
        return node;
      },

      ActionTarget(_marker, _space, text, block) {
        const textContent = text.sourceString.trim();
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0] : null;
          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'action';
            if (textContent) node.content = textContent;
          } else {
            node = self.createNode('action', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else {
          node = self.createNode('action', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        }
        self.currentModifiers = [];
        return node;
      },

      QuestionTarget(_marker, _space, text, block) {
        const textContent = text.sourceString.trim();
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0] : null;
          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'question';
            if (textContent) node.content = textContent;
          } else {
            node = self.createNode('question', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else {
          node = self.createNode('question', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        }
        self.currentModifiers = [];
        return node;
      },

      CompletionTarget(_marker, _space, text, block) {
        const textContent = text.sourceString.trim();
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0] : null;
          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'completion';
            if (textContent) node.content = textContent;
          } else {
            node = self.createNode('completion', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else {
          node = self.createNode('completion', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        }
        self.currentModifiers = [];
        return node;
      },

      AlternativeTarget(_marker, _space, text, block) {
        const textContent = text.sourceString.trim();
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0] : null;
          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'alternative';
            if (textContent) node.content = textContent;
          } else {
            node = self.createNode('alternative', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else {
          node = self.createNode('alternative', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        }
        self.currentModifiers = [];
        return { type: 'alternative', node };
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

      Thought(_marker, _space, text, block, relPairs, _newline) {
        // Handle three cases: text+block, just block, or just text
        const hasText = text.sourceString.trim().length > 0;
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          // Save modifiers before block parsing (block will clear them)
          const savedModifiers = [...self.currentModifiers];

          // Has a block (with or without text)
          // block.toIR() returns an array because Block? is optional (iteration node)
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0]
            : null;

          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'thought';

            // Move modifiers from block's ext to root level
            if (savedModifiers.length > 0) {
              node.modifiers = savedModifiers;
              // Remove from ext (block had them there)
              if (node.ext?.modifiers) {
                delete node.ext.modifiers;
              }
            }

            // If there's also text, set it as the content
            if (hasText) {
              node.content = text.sourceString.trim();
            } else if (node.content === '' && node.ext?.children && Array.isArray(node.ext.children)) {
              // No text provided - use first child's content as the thought content
              const firstChild = node.ext.children[0];
              if (firstChild && firstChild.content) {
                node.content = firstChild.content;
              }
            }
          } else {
            // Block parsing failed, fall back to text-only
            const textContent = hasText ? text.sourceString.trim() : '';
            node = self.createNode('thought', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else if (hasText) {
          // Just text, no block
          const textContent = text.sourceString.trim();
          node = self.createNode('thought', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        } else {
          // Neither text nor block - create empty thought
          node = self.createNode('thought', '', self.currentModifiers, this);
          self.nodes.push(node);
        }

        // If relationship pairs present, process them using existing RelOpNodePair logic
        if (relPairs.children.length > 0) {
          self.currentSourceNode = node;
          relPairs.toIR();
          self.currentSourceNode = null;
        }

        return node;
      },

      Action(_marker, _space, text, block, relPairs, _newline) {
        // Handle three cases: text+block, just block, or just text
        const hasText = text.sourceString.trim().length > 0;
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          // Save modifiers before block parsing (block will clear them)
          const savedModifiers = [...self.currentModifiers];

          // Has a block (with or without text)
          // block.toIR() returns an array because Block? is optional (iteration node)
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0]
            : null;

          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'action';

            // Move modifiers from block's ext to root level
            if (savedModifiers.length > 0) {
              node.modifiers = savedModifiers;
              // Remove from ext (block had them there)
              if (node.ext?.modifiers) {
                delete node.ext.modifiers;
              }
            }

            // If there's also text, set it as the content
            if (hasText) {
              node.content = text.sourceString.trim();
            } else if (node.content === '' && node.ext?.children && Array.isArray(node.ext.children)) {
              // No text provided - use first child's content as the action content
              const firstChild = node.ext.children[0];
              if (firstChild && firstChild.content) {
                node.content = firstChild.content;
              }
            }
          } else {
            // Block parsing failed, fall back to text-only
            const textContent = hasText ? text.sourceString.trim() : '';
            node = self.createNode('action', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else if (hasText) {
          // Just text, no block
          const textContent = text.sourceString.trim();
          node = self.createNode('action', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        } else {
          // Neither text nor block - create empty action
          node = self.createNode('action', '', self.currentModifiers, this);
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

      Question(_marker, _space, text, block, _newline) {
        // Handle three cases: text+block, just block, or just text
        const hasText = text.sourceString.trim().length > 0;
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          // Save modifiers before block parsing (block will clear them)
          const savedModifiers = [...self.currentModifiers];

          // Has a block (with or without text)
          // block.toIR() returns an array because Block? is optional (iteration node)
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0]
            : null;

          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'question';

            // Move modifiers from block's ext to root level
            if (savedModifiers.length > 0) {
              node.modifiers = savedModifiers;
              // Remove from ext (block had them there)
              if (node.ext?.modifiers) {
                delete node.ext.modifiers;
              }
            }

            // If there's also text, set it as the content
            if (hasText) {
              node.content = text.sourceString.trim();
            } else if (node.content === '' && node.ext?.children && Array.isArray(node.ext.children)) {
              // No text provided - use first child's content as the question content
              const firstChild = node.ext.children[0];
              if (firstChild && firstChild.content) {
                node.content = firstChild.content;
              }
            }
          } else {
            // Block parsing failed, fall back to text-only
            const textContent = hasText ? text.sourceString.trim() : '';
            node = self.createNode('question', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else if (hasText) {
          // Just text, no block
          const textContent = text.sourceString.trim();
          node = self.createNode('question', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        } else {
          // Neither text nor block - create empty question
          node = self.createNode('question', '', self.currentModifiers, this);
          self.nodes.push(node);
        }

        return node;
      },

      Completion(_marker, _space, text, block, _newline) {
        // Handle three cases: text+block, just block, or just text
        const hasText = text.sourceString.trim().length > 0;
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          // Save modifiers before block parsing (block will clear them)
          const savedModifiers = [...self.currentModifiers];

          // Has a block (with or without text)
          // block.toIR() returns an array because Block? is optional (iteration node)
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0]
            : null;

          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'completion';

            // Move modifiers from block's ext to root level
            if (savedModifiers.length > 0) {
              node.modifiers = savedModifiers;
              // Remove from ext (block had them there)
              if (node.ext?.modifiers) {
                delete node.ext.modifiers;
              }
            }

            // If there's also text, set it as the content
            if (hasText) {
              node.content = text.sourceString.trim();
            } else if (node.content === '' && node.ext?.children && Array.isArray(node.ext.children)) {
              // No text provided - use first child's content as the completion content
              const firstChild = node.ext.children[0];
              if (firstChild && firstChild.content) {
                node.content = firstChild.content;
              }
            }
          } else {
            // Block parsing failed, fall back to text-only
            const textContent = hasText ? text.sourceString.trim() : '';
            node = self.createNode('completion', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else if (hasText) {
          // Just text, no block
          const textContent = text.sourceString.trim();
          node = self.createNode('completion', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        } else {
          // Neither text nor block - create empty completion
          node = self.createNode('completion', '', self.currentModifiers, this);
          self.nodes.push(node);
        }

        return node;
      },

      // Block (thought blocks)
      Block(_lbrace, _ws1, blockContent, _ws2, _rbrace) {
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

        // Parse block content (handles separators between lines)
        // blockContent is optional (empty blocks have no content)
        if (blockContent.sourceString.trim()) {
          blockContent.toIR();
        }

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
        self.currentModifiers = mods;
        return content.toIR();
      },

      BlockContent_inner(content) {
        // Just pass through to the actual content type
        return content.toIR();
      },

      BlockStatement(text) {
        // Same as Statement but without trailing newline
        const content = text.sourceString.trim();
        const node = self.createNode('statement', content, self.currentModifiers, text);
        self.nodes.push(node);
        self.currentModifiers = [];
        return node;
      },

      // Alternative
      Alternative(_marker, _space, text, block, _newline) {
        // Handle three cases: text+block, just block, or just text
        const hasText = text.sourceString.trim().length > 0;
        const hasBlock = block.sourceString.trim().length > 0;

        let node;
        if (hasBlock) {
          // Save modifiers before block parsing (block will clear them)
          const savedModifiers = [...self.currentModifiers];

          // Has a block (with or without text)
          // block.toIR() returns an array because Block? is optional (iteration node)
          const blockResultArray = block.toIR();
          const blockResult = Array.isArray(blockResultArray) && blockResultArray.length > 0
            ? blockResultArray[0]
            : null;

          if (blockResult && blockResult.node) {
            node = blockResult.node;
            node.type = 'alternative';

            // Move modifiers from block's ext to root level
            if (savedModifiers.length > 0) {
              node.modifiers = savedModifiers;
              // Remove from ext (block had them there)
              if (node.ext?.modifiers) {
                delete node.ext.modifiers;
              }
            }

            // If there's also text, set it as the content
            if (hasText) {
              node.content = text.sourceString.trim();
            } else if (node.content === '' && node.ext?.children && Array.isArray(node.ext.children)) {
              // No text provided - use first child's content as the alternative content
              const firstChild = node.ext.children[0];
              if (firstChild && firstChild.content) {
                node.content = firstChild.content;
              }
            }
          } else {
            // Block parsing failed, fall back to text-only
            const textContent = hasText ? text.sourceString.trim() : '';
            node = self.createNode('alternative', textContent, self.currentModifiers, this);
            self.nodes.push(node);
          }
        } else if (hasText) {
          // Just text, no block
          const textContent = text.sourceString.trim();
          node = self.createNode('alternative', textContent, self.currentModifiers, this);
          self.nodes.push(node);
        } else {
          // Neither text nor block - create empty alternative
          node = self.createNode('alternative', '', self.currentModifiers, this);
          self.nodes.push(node);
        }

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

      // =====================================================================
      // Fixpoint Expression (@fix) semantic actions
      // =====================================================================

      fixpointExpression(expr: any) {
        return expr.toIR();
      },

      fixpointExpression_named(_atfix: any, _sp: any, name: any, _ws1: any, _lbrace: any, _ws2: any, clauses: any, _ws3: any, _rbrace: any) {
        const fixName = name.sourceString.trim();
        const clauseData = clauses.toIR();

        const ext: any = {
          fix: {
            name: fixName || null,
            constraint: clauseData.constraint || null,
            status: 'declared',
            match: clauseData.match || [],
            yield: clauseData.yield || [],
            until: clauseData.until || null
          }
        };

        const content = `${fixName}: ${clauseData.constraint || '?'} fixpoint (declared)`;
        const node = self.createNode('fixpoint', content, self.currentModifiers, this);
        node.ext = ext;
        self.nodes.push(node);
        self.currentModifiers = [];
        return node;
      },

      fixpointExpression_anon(_atfix: any, _ws1: any, _lbrace: any, _ws2: any, clauses: any, _ws3: any, _rbrace: any) {
        const clauseData = clauses.toIR();

        const ext: any = {
          fix: {
            name: null,
            constraint: clauseData.constraint || null,
            status: 'declared',
            match: clauseData.match || [],
            yield: clauseData.yield || [],
            until: clauseData.until || null
          }
        };

        const content = `anonymous: ${clauseData.constraint || '?'} fixpoint (declared)`;
        const node = self.createNode('fixpoint', content, self.currentModifiers, this);
        node.ext = ext;
        self.nodes.push(node);
        self.currentModifiers = [];
        return node;
      },

      fixpointClauses(first: any, _ws: any, rest: any) {
        const result: any = {};
        const firstData = first.toIR();
        Object.assign(result, firstData);
        for (const child of rest.children) {
          const data = child.toIR();
          Object.assign(result, data);
        }
        return result;
      },

      fixpointClause(clause: any) {
        return clause.toIR();
      },

      fixMatchClause(_match: any, _ws1: any, _colon: any, _ws2: any, body: any) {
        return { match: body.toIR() };
      },

      fixYieldClause(_yield: any, _ws1: any, _colon: any, _ws2: any, body: any) {
        return { yield: body.toIR() };
      },

      fixUntilClause(_until: any, _ws1: any, _colon: any, _ws2: any, cond: any) {
        return { until: cond.toIR() };
      },

      fixConstraintClause(_constraint: any, _ws1: any, _colon: any, _ws2: any, level: any) {
        return { constraint: level.sourceString.trim() };
      },

      constraintLevel(_: any) {
        return this.sourceString.trim();
      },

      // Match patterns
      fixMatchBody(body: any) {
        return body.toIR();
      },

      fixMatchBody_braced(_lbrace: any, _ws1: any, list: any, _ws2: any, _rbrace: any) {
        return list.toIR();
      },

      fixMatchBody_query(ref: any) {
        return [ref.toIR()];
      },

      fixPatternList(first: any, _ws: any, _commas: any, _ws2: any, rest: any) {
        const patterns = [first.toIR()];
        for (const child of rest.children) {
          patterns.push(child.toIR());
        }
        return patterns;
      },

      fixPatternElement(elem: any) {
        return elem.toIR();
      },

      fixPathPattern(firstNode: any, _ws1: any, _arrow1: any, _ws2: any, edgeLabelIter: any, _ws3: any, _arrow2: any, _ws4: any, targetNodeIter: any) {
        // Build path: node -> edge -> node -> edge -> node ...
        const pathSteps: any[] = [];
        const firstNodeData = firstNode.toIR();
        pathSteps.push({ type: 'node', ...firstNodeData });

        // Iterations have same length — one per path step
        const edgeLabels = edgeLabelIter.children;
        const targetNodes = targetNodeIter.children;
        for (let i = 0; i < edgeLabels.length; i++) {
          pathSteps.push({ type: 'edge', edge_label: edgeLabels[i].sourceString.trim() });
          pathSteps.push({ type: 'node', ...targetNodes[i].toIR() });
        }

        return { type: 'path', steps: pathSteps };
      },

      fixNodePattern(variable: any, _ws1: any, _colon: any, _ws2: any, nodeType: any, condition: any) {
        const result: any = {
          type: 'node',
          variable: variable.sourceString.trim(),
          node_type: nodeType.sourceString.trim()
        };
        const condData = condition.children;
        if (condData.length > 0) {
          result.conditions = condData[0].toIR();
        }
        return result;
      },

      fixMatchCondition(_lparen: any, _ws1: any, list: any, _ws2: any, _rparen: any) {
        return list.toIR();
      },

      fixPredicateList(first: any, _ws: any, _commas: any, _ws2: any, rest: any) {
        const preds = [first.toIR()];
        for (const child of rest.children) {
          preds.push(child.toIR());
        }
        return preds;
      },

      fixPredicate(name: any, _lparen: any, _ws1: any, args: any, _ws2: any, _rparen: any) {
        const argData = args.children.length > 0 ? args.children[0].toIR() : [];
        return { name: name.sourceString.trim(), args: argData };
      },

      fixNegationPattern(neg: any) {
        return neg.toIR();
      },

      fixNegationPattern_node(_not: any, _sp: any, pattern: any) {
        return { type: 'negation', negated: pattern.toIR() };
      },

      fixNegationPattern_query(_not: any, _sp: any, query: any) {
        return { type: 'negation', negated: query.toIR() };
      },

      fixQueryRef(name: any, _lparen: any, _ws1: any, args: any, _ws2: any, _rparen: any) {
        const argData = args.children.length > 0 ? args.children[0].toIR() : [];
        return { type: 'query_ref', query_name: name.sourceString.trim(), args: argData };
      },

      fixQueryName(_: any) {
        return this.sourceString.trim();
      },

      fixArgList(first: any, _ws: any, _commas: any, _ws2: any, rest: any) {
        const args = [first.toIR()];
        for (const child of rest.children) {
          args.push(child.toIR());
        }
        return args;
      },

      fixArg(arg: any) {
        const text = arg.sourceString.trim();
        // Remove quotes from strings
        if (text.startsWith('"') && text.endsWith('"')) {
          return text.slice(1, -1);
        }
        return text;
      },

      fixEdgeLabel(_first: any, _rest: any) {
        return this.sourceString.trim();
      },

      fixPredicateName(_first: any, _rest: any) {
        return this.sourceString.trim();
      },

      // Yield productions
      fixYieldBody(body: any) {
        return body.toIR();
      },

      fixYieldBody_braced(_lbrace: any, _ws1: any, list: any, _ws2: any, _rbrace: any) {
        return list.toIR();
      },

      fixYieldBody_nested(fix: any) {
        const node = fix.toIR();
        return [{ type: 'nested_fix', nested: node.ext?.fix }];
      },

      fixYieldBody_builtin(action: any) {
        return [action.toIR()];
      },

      fixYieldList(first: any, _ws: any, _commas: any, _ws2: any, rest: any) {
        const elems = [first.toIR()];
        for (const child of rest.children) {
          elems.push(child.toIR());
        }
        return elems;
      },

      fixYieldElement(elem: any) {
        const result = elem.toIR();
        // If a nested fixpoint was matched inside a yield list, wrap it
        if (result && result.type === 'fixpoint' && result.ext?.fix) {
          return { type: 'nested_fix', nested: result.ext.fix };
        }
        return result;
      },

      fixNodeRelProduction(_new: any, _sp: any, kind: any, _lparen: any, _ws1: any, args: any, _ws2: any, _rparen: any, _ws3: any, _arrow1: any, _ws4: any, edge: any, _ws5: any, _arrow2: any, _ws6: any, target: any, annotations: any) {
        const argData = args.children.length > 0 ? args.children[0].toIR() : [];
        const annots = self._parseAnnotations(annotations);
        return {
          type: 'node_relationship',
          node_kind: kind.sourceString.trim(),
          args: argData,
          edge_label: edge.sourceString.trim(),
          target_var: target.sourceString.trim(),
          annotations: annots
        };
      },

      fixNodeProduction(_new: any, _sp: any, kind: any, _lparen: any, _ws1: any, args: any, _ws2: any, _rparen: any, annotations: any) {
        const argData = args.children.length > 0 ? args.children[0].toIR() : [];
        const annots = self._parseAnnotations(annotations);
        return {
          type: 'node',
          node_kind: kind.sourceString.trim(),
          args: argData,
          annotations: annots
        };
      },

      fixRelProduction(source: any, _ws1: any, _arrow1: any, _ws2: any, edge: any, _ws3: any, _arrow2: any, _ws4: any, target: any, annotations: any) {
        const annots = self._parseAnnotations(annotations);
        return {
          type: 'relationship',
          source_var: source.sourceString.trim(),
          edge_label: edge.sourceString.trim(),
          target_var: target.sourceString.trim(),
          annotations: annots
        };
      },

      fixStateProduction(action: any, _lparen: any, _ws1: any, variable: any, _ws2: any, _rparen: any, annotations: any) {
        const annots = self._parseAnnotations(annotations);
        return {
          type: 'state',
          action: action.sourceString.trim(),
          variable: variable.sourceString.trim(),
          annotations: annots
        };
      },

      fixBuiltinAction(_resolve: any, _lparen: any, _ws1: any, _matched: any, _ws2: any, _rparen: any, annotations: any) {
        const annots = self._parseAnnotations(annotations);
        return {
          type: 'builtin',
          action: 'resolve',
          variable: 'matched',
          annotations: annots
        };
      },

      fixStateAction(_: any) {
        return this.sourceString.trim();
      },

      fixAnnotation(_ws: any, _pipe: any, _ws2: any, key: any, _ws3: any, _colon: any, _ws4: any, value: any) {
        return { key: key.sourceString.trim(), value: value.toIR() };
      },

      fixAnnotationKey(_first: any, _rest: any) {
        return this.sourceString.trim();
      },

      fixAnnotationValue(val: any) {
        const text = val.sourceString.trim();
        if (text.startsWith('"') && text.endsWith('"')) {
          return text.slice(1, -1);
        }
        return text;
      },

      fixAnnotationIdent(_first: any, _rest: any) {
        return this.sourceString.trim();
      },

      fixNodeKind(_first: any, _rest: any) {
        return this.sourceString.trim();
      },

      // Termination conditions
      fixTerminationCondition(first: any, _ws: any, _ors: any, _ws2: any, rest: any) {
        const firstCond = first.toIR();
        if (rest.children.length === 0) {
          return firstCond;
        }
        const conditions = [firstCond];
        for (const child of rest.children) {
          conditions.push(child.toIR());
        }
        return { type: 'compound', conditions };
      },

      fixSimpleTermCondition(cond: any) {
        return cond.toIR();
      },

      fixStableCondition(_: any) {
        return { type: 'stable' };
      },

      fixIterationBound(_maxIter: any, _ws1: any, _colon: any, _ws2: any, value: any) {
        return { type: 'max_iterations', value: parseInt(value.sourceString.trim(), 10) };
      },

      fixTimeoutBound(_timeout: any, _ws1: any, _colon: any, _ws2: any, value: any, unit: any) {
        return { type: 'timeout', value: parseInt(value.sourceString.trim(), 10), unit: unit.sourceString.trim() };
      },

      fixMeasureBound(_measure: any, _ws1: any, _colon: any, _ws2: any, name: any) {
        return { type: 'measure', measure_name: name.sourceString.trim() };
      },

      fixTimeUnit(_: any) {
        return this.sourceString.trim();
      },

      fixMeasureName(_first: any, _rest: any) {
        return this.sourceString.trim();
      },

      // Fixpoint lexical primitives
      fixVariable(_first: any, _rest: any) {
        return this.sourceString.trim();
      },

      fixInteger(_digits: any) {
        return this.sourceString.trim();
      },

      fixNodeType(_: any) {
        return this.sourceString.trim();
      },

      fixName(_first: any, _rest: any) {
        return this.sourceString.trim();
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
    // Track redundant blocks (blocks whose children were assigned to a parent)
    const redundantBlockIds = new Set<string>();

    // Build set of block IDs that are referenced in relationships
    // These blocks should NOT be removed even if their children are attached to a parent
    const blocksInRelationships = new Set<string>();
    for (const rel of this.relationships) {
      const sourceNode = this.nodes.find(n => n.id === rel.source);
      const targetNode = this.nodes.find(n => n.id === rel.target);
      if (sourceNode?.type === 'block') {
        blocksInRelationships.add(sourceNode.id);
      }
      if (targetNode?.type === 'block') {
        blocksInRelationships.add(targetNode.id);
      }
    }

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
        // Append to existing children, but avoid duplicates
        // (e.g., question might already have alternatives from relationships)
        for (const childId of directChildren) {
          if (!parentNode.children.includes(childId)) {
            parentNode.children.push(childId);
          }
        }

        // Mark this block as redundant ONLY if it's not referenced in relationships
        if (!blocksInRelationships.has(blockNode.id)) {
          redundantBlockIds.add(blockNode.id);
        }
      }
    }

    // Step 3: Remove redundant blocks from nodes array
    // These blocks served their purpose (grouping indented content) but are no longer needed
    // Blocks that are referenced in relationships are kept (e.g., "main -> {block}")
    if (redundantBlockIds.size > 0) {
      this.nodes = this.nodes.filter(n => !redundantBlockIds.has(n.id));
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
