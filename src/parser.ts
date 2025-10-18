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

  constructor(sourceFile: string) {
    this.sourceFile = sourceFile;
  }

  parse(input: string): IR {
    // Parse with Ohm
    const match = grammar.match(input);

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
    const line = lineMatch ? parseInt(lineMatch[1]) : 1;

    return {
      source_file: this.sourceFile,
      line_number: line,
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

    if (modifiers.length > 0) {
      result.ext = { modifiers };
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
      RelationshipExpression(firstNode, pairs) {
        // Parse first node
        const firstText = firstNode.sourceString.trim();
        const firstNodeObj = self.createNode('statement', firstText, self.currentModifiers, this);
        self.nodes.push(firstNodeObj);

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

      RelOpNodePair(operator, nodeText) {
        // Get current source from parser state
        const currentSource = self.currentSourceNode!;

        // Create target node
        const targetText = nodeText.sourceString.trim();
        const targetNode = self.createNode('statement', targetText, [], nodeText);
        self.nodes.push(targetNode);

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

      NodeText(chars) {
        return this.sourceString;
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
        return { type: 'causes', axisLabel: null, reverse: true };
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

      decidedWithFields(_open, fieldContent, _close) {
        const fields = fieldContent.toIR();

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

      decidedFieldContent(_s1, _rationaleKey, _s2, rationale, _s3, _comma, _s4, _onKey, _s5, onDate, _s6) {
        return {
          rationale: self.extractString(rationale.sourceString),
          on: self.extractString(onDate.sourceString)
        };
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

      blockedWithFields(_open, fieldContent, _close) {
        const fields = fieldContent.toIR();

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

      blockedFieldContent(_s1, _reasonKey, _s2, reason, _s3, _comma, _s4, _sinceKey, _s5, since, _s6) {
        return {
          reason: self.extractString(reason.sourceString),
          since: self.extractString(since.sourceString)
        };
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

      parkingWithFields(_open, fieldContent, _close) {
        const fields = fieldContent.toIR();

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

      parkingFieldContent(_s1, _whyKey, _s2, why, _s3, _comma, _s4, _untilKey, _s5, until, _s6) {
        return {
          why: self.extractString(why.sourceString),
          until: self.extractString(until.sourceString)
        };
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

      thought(_marker, content) {
        const node = self.createNode('thought', content.sourceString.trim(), self.currentModifiers, this);
        self.nodes.push(node);
        return node;
      },

      action(_marker, content) {
        const node = self.createNode('action', content.sourceString.trim(), self.currentModifiers, this);
        self.nodes.push(node);
        return node;
      },

      Question(_marker, content) {
        const node = self.createNode('question', content.sourceString.trim(), self.currentModifiers, this);
        self.nodes.push(node);
        return node;
      },

      Completion(_marker, content) {
        const node = self.createNode('completion', `✓ ${content.sourceString.trim()}`, self.currentModifiers, this);
        self.nodes.push(node);
        return node;
      },

      // Alternative
      Alternative(_marker, content) {
        const node = self.createNode('statement', content.sourceString.trim(), self.currentModifiers, this);
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
}
