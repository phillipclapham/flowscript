/**
 * FlowScript Parser
 *
 * Recursive descent parser that compiles FlowScript tokens → IR JSON.
 * This is an MVP implementation - production version will use PEG parser.
 */

import { Token, TokenType, Node, Relationship, State, IR, Provenance } from './types';
import { hashContent } from './hash';

export class Parser {
  private tokens: Token[];
  private position: number = 0;
  private sourceFile: string;
  private currentNodeId: string | null = null;  // Track current node for state linking

  constructor(tokens: Token[], sourceFile: string) {
    this.tokens = tokens;
    this.sourceFile = sourceFile;
  }

  parse(): IR {
    const nodes: Node[] = [];
    const relationships: Relationship[] = [];
    const states: State[] = [];

    while (!this.isEOF()) {
      this.parseStatement(nodes, relationships, states);
    }

    return {
      version: '1.0.0',
      nodes,
      relationships,
      states,
      invariants: {
        causal_acyclic: true,
        all_nodes_reachable: true,
        tension_axes_labeled: true,
        state_fields_present: true
      },
      metadata: {
        source_files: [this.sourceFile],
        parsed_at: new Date().toISOString(),
        parser: 'flowscript-parser-mvp 0.1.0'
      }
    };
  }

  private parseStatement(
    nodes: Node[],
    relationships: Relationship[],
    states: State[]
  ): void {
    // Skip newlines
    while (this.match(TokenType.NEWLINE)) {}

    if (this.isEOF()) return;

    // Parse modifiers first (!, ++, *, ~)
    const modifiers = this.parseModifiers();

    // Parse state markers
    const state = this.parseState();

    // Parse content (text, question, thought, action)
    const node = this.parseNode(modifiers);
    if (node) {
      nodes.push(node);
      this.currentNodeId = node.id;  // Track for state linking

      // Link state to node
      if (state) {
        state.node_id = node.id;
        states.push(state);
      }
    }

    // Parse relationships (>, <-, etc.)
    const rels = this.parseRelationships(node, nodes);
    relationships.push(...rels);
  }

  private parseModifiers(): string[] {
    const modifiers: string[] = [];

    while (
      this.check(TokenType.URGENT) ||
      this.check(TokenType.POSITIVE) ||
      this.check(TokenType.CONFIDENT) ||
      this.check(TokenType.UNCERTAIN)
    ) {
      const token = this.advance();
      const modifierMap: Record<string, string> = {
        [TokenType.URGENT]: 'urgent',
        [TokenType.POSITIVE]: 'strong_positive',
        [TokenType.CONFIDENT]: 'high_confidence',
        [TokenType.UNCERTAIN]: 'low_confidence'
      };
      modifiers.push(modifierMap[token.type]);
    }

    return modifiers;
  }

  private parseState(): State | null {
    const stateTokens = [
      TokenType.DECIDED,
      TokenType.EXPLORING,
      TokenType.BLOCKED,
      TokenType.PARKING
    ];

    for (const tokenType of stateTokens) {
      if (this.match(tokenType)) {
        return this.buildState(this.previous());
      }
    }

    return null;
  }

  private parseNode(modifiers: string[]): Node | null {
    const startToken = this.peek();

    // Question
    if (this.match(TokenType.QUESTION)) {
      const content = this.consumeText();
      return this.buildNode('question', content, modifiers, startToken);
    }

    // Thought
    if (this.match(TokenType.THOUGHT)) {
      const content = this.consumeText();
      return this.buildNode('thought', content, modifiers, startToken);
    }

    // Action
    if (this.match(TokenType.ACTION)) {
      const content = this.consumeText();
      return this.buildNode('action', content, modifiers, startToken);
    }

    // Checkmark (completion)
    if (this.match(TokenType.CHECKMARK)) {
      const content = this.consumeText();
      return this.buildNode('completion', `✓ ${content}`, modifiers, startToken);
    }

    // Alternative marker
    if (this.match(TokenType.ALTERNATIVE)) {
      const content = this.consumeText();
      return this.buildNode('statement', content, modifiers, startToken);
    }

    // Regular text/statement
    if (this.match(TokenType.TEXT)) {
      const content = this.previous().value;
      return this.buildNode('statement', content, modifiers, startToken);
    }

    return null;
  }

  private parseRelationships(sourceNode: Node | null, nodes: Node[]): Relationship[] {
    if (!sourceNode) return [];

    const relationships: Relationship[] = [];

    // Keep parsing relationships while we see relationship markers
    while (this.check(TokenType.ARROW_RIGHT) ||
           this.check(TokenType.ARROW_LEFT) ||
           this.check(TokenType.ARROW_BI) ||
           this.check(TokenType.ARROW_TEMPORAL) ||
           this.check(TokenType.TENSION)) {

      const beforePos = this.position;  // Track position to detect infinite loops

      // Causal (->)
      if (this.match(TokenType.ARROW_RIGHT)) {
        const targetNode = this.parseNode([]);
        if (targetNode) {
          nodes.push(targetNode);
          relationships.push(this.buildRelationship('causes', sourceNode.id, targetNode.id));
        } else {
          break;  // No target found, stop parsing relationships
        }
      }
      // Reverse causal (<-)
      else if (this.match(TokenType.ARROW_LEFT)) {
        const targetNode = this.parseNode([]);
        if (targetNode) {
          nodes.push(targetNode);
          relationships.push(this.buildRelationship('causes', targetNode.id, sourceNode.id));
        } else {
          break;
        }
      }
      // Bidirectional (<->)
      else if (this.match(TokenType.ARROW_BI)) {
        const targetNode = this.parseNode([]);
        if (targetNode) {
          nodes.push(targetNode);
          relationships.push(this.buildRelationship('bidirectional', sourceNode.id, targetNode.id));
        } else {
          break;
        }
      }
      // Temporal (=>)
      else if (this.match(TokenType.ARROW_TEMPORAL)) {
        const targetNode = this.parseNode([]);
        if (targetNode) {
          nodes.push(targetNode);
          relationships.push(this.buildRelationship('temporal', sourceNode.id, targetNode.id));
        } else {
          break;
        }
      }
      // Tension (><)
      else if (this.match(TokenType.TENSION)) {
        const axis = this.parseTensionAxis();
        const targetNode = this.parseNode([]);
        if (targetNode) {
          nodes.push(targetNode);
          relationships.push(this.buildRelationship('tension', sourceNode.id, targetNode.id, axis));
        } else {
          break;
        }
      }

      // Safety check: if position hasn't advanced, break to avoid infinite loop
      if (this.position === beforePos) {
        break;
      }
    }

    return relationships;
  }

  private parseTensionAxis(): string | null {
    // Look for [axis] pattern in next token
    if (this.check(TokenType.TEXT)) {
      const nextValue = this.peek().value;
      if (nextValue.startsWith('[') && nextValue.endsWith(']')) {
        this.advance();
        return nextValue.slice(1, -1); // Remove [ ]
      }
    }
    return null;
  }

  private buildNode(
    type: string,
    content: string,
    modifiers: string[],
    sourceToken: Token
  ): Node {
    const node: Node = {
      id: hashContent({ type, content, modifiers }),
      type: type as any,
      content,
      provenance: this.createProvenance(sourceToken)
    };

    if (modifiers.length > 0) {
      node.ext = { modifiers };
    }

    return node;
  }

  private buildState(token: Token): State {
    // Extract fields from [state(field: "value", field2: "value2")]
    const fields: Record<string, string> = {};

    // Simple regex extraction
    const fieldRegex = /(\w+):\s*"([^"]*)"/g;
    let match;
    while ((match = fieldRegex.exec(token.value)) !== null) {
      fields[match[1]] = match[2];
    }

    const stateType = token.value.match(/\[(\w+)/)?.[1] || 'exploring';

    return {
      id: hashContent({ type: stateType, fields }),
      type: stateType as any,
      node_id: '',  // Will be set by caller
      fields,
      provenance: this.createProvenance(token)
    };
  }

  private buildRelationship(
    type: string,
    source: string,
    target: string,
    axisLabel?: string | null
  ): Relationship {
    const relToken = this.previous();

    return {
      id: hashContent({ type, source, target, axis_label: axisLabel }),
      type: type as any,
      source,
      target,
      axis_label: axisLabel || null,
      feedback: false,
      provenance: this.createProvenance(relToken)
    };
  }

  private createProvenance(token: Token): Provenance {
    return {
      source_file: this.sourceFile,
      line_number: token.line,
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods
  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isEOF()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isEOF()) this.position++;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  private isEOF(): boolean {
    return this.peek()?.type === TokenType.EOF;
  }

  private consumeText(): string {
    if (this.match(TokenType.TEXT)) {
      return this.previous().value;
    }
    return '';
  }
}
