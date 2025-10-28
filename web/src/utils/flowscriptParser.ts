/**
 * Lightweight FlowScript Parser for Visualization
 * Session 7b.1: Basic graph extraction
 *
 * This is a simplified parser for extracting nodes and relationships
 * for visualization purposes. Full IR parser integration comes later.
 */

import type { GraphData, GraphNode, GraphEdge, NodeType, EdgeType, ParseError } from '../types/graph';

// Marker patterns for node types
const NODE_PATTERNS: Array<[RegExp, NodeType]> = [
  [/^\?/, 'question'],
  [/^action:/, 'action'],
  [/^thought:/, 'thought'],
  [/^\*/, 'milestone'],
  [/^!/, 'important'],
  [/^~/, 'note'],
  [/^✓/, 'check'],
  [/^…/, 'wip'],
  [/^@/, 'reference'],
];

// Relationship patterns
const EDGE_PATTERNS: Array<[RegExp, EdgeType]> = [
  [/->/, 'causal'],
  [/=>/, 'temporal'],
  [/<->/, 'bidirectional'],
  [/::/, 'definition'],
  [/⟲/, 'feedback'],
  [/></, 'alternative'],
  [/\.\.\.>/, 'indirection'],
];

/**
 * Parse FlowScript text into graph data structure
 */
export function parseFlowScript(input: string): { data?: GraphData; error?: ParseError } {
  try {
    const lines = input.split('\n');
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIdMap = new Map<number, string>(); // lineNumber -> nodeId

    // First pass: extract nodes
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      // Check for node markers
      for (const [pattern, type] of NODE_PATTERNS) {
        if (pattern.test(trimmed)) {
          const node = extractNode(trimmed, lineNumber, type);
          if (node) {
            nodes.push(node);
            nodeIdMap.set(lineNumber, node.id);
          }
          return;
        }
      }

      // Lines with indentation might be continuations or relationships
      if (line.startsWith('  ') && trimmed) {
        // Check if it has relationship markers
        const hasEdgeMarker = EDGE_PATTERNS.some(([pattern]) => pattern.test(trimmed));

        if (hasEdgeMarker) {
          // This is a relationship line, will be processed in second pass
          return;
        }

        // Otherwise, treat as a generic thought node
        const node = extractNode(trimmed, lineNumber, 'thought');
        if (node) {
          nodes.push(node);
          nodeIdMap.set(lineNumber, node.id);
        }
      }

      // Alternative syntax (||)
      if (trimmed.startsWith('||')) {
        const content = trimmed.slice(2).trim();
        if (content) {
          const node: GraphNode = {
            id: `node-${lineNumber}`,
            type: 'decision',
            content,
            lineNumber,
          };
          nodes.push(node);
          nodeIdMap.set(lineNumber, node.id);
        }
        return;
      }

      // Fallback: treat any remaining non-empty line as implicit thought node
      // This catches root nodes and unmarked lines (e.g., "quantum computing viability for cryptography")
      if (!nodeIdMap.has(lineNumber) && trimmed && !trimmed.startsWith('#')) {
        const node = extractNode(trimmed, lineNumber, 'thought');
        if (node) {
          nodes.push(node);
          nodeIdMap.set(lineNumber, node.id);
        }
      }
    });

    // Second pass: extract relationships
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      // Check for relationship markers
      for (const [pattern, type] of EDGE_PATTERNS) {
        if (pattern.test(trimmed)) {
          const edge = extractEdge(trimmed, lineNumber, type, nodeIdMap, nodes);
          if (edge) {
            edges.push(edge);
          }
          return;
        }
      }

      // Check for indented lines under a parent (hierarchy)
      if (line.match(/^  +[^\s]/) && !trimmed.startsWith('#')) {
        // Find parent node (previous non-indented line)
        for (let i = index - 1; i >= 0; i--) {
          const prevLine = lines[i];
          if (prevLine && !prevLine.startsWith('  ') && prevLine.trim()) {
            const parentId = nodeIdMap.get(i + 1);
            const childId = nodeIdMap.get(lineNumber);

            if (parentId && childId && parentId !== childId) {
              // Create implicit causal relationship
              edges.push({
                source: parentId,
                target: childId,
                type: 'causal',
              });
            }
            break;
          }
        }
      }
    });

    return {
      data: {
        nodes,
        edges,
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

/**
 * Extract a node from a line
 */
function extractNode(line: string, lineNumber: number, type: NodeType): GraphNode | null {
  let content = line;

  // Remove marker prefix
  content = content.replace(/^[?*!~✓…@]/, '').trim();
  content = content.replace(/^(action|thought):/, '').trim();

  // Extract state markers (simplified)
  let state: GraphNode['state'];

  // Check for [decided(...)]
  const decidedMatch = content.match(/\[decided\(rationale:\s*"([^"]+)",\s*on:\s*"([^"]+)"\)\]/);
  if (decidedMatch) {
    state = {
      decided: {
        rationale: decidedMatch[1],
        on: decidedMatch[2],
      },
    };
    content = content.replace(/\[decided\([^)]+\)\]/, '').trim();
  }

  // Check for [blocked(...)]
  const blockedMatch = content.match(/\[blocked\(reason:\s*"([^"]+)",\s*since:\s*"([^"]+)"\)\]/);
  if (blockedMatch) {
    state = {
      blocked: {
        reason: blockedMatch[1],
        since: blockedMatch[2],
      },
    };
    content = content.replace(/\[blocked\([^)]+\)\]/, '').trim();
  }

  // Extract goal/label from {...}
  const goalMatch = content.match(/\{([^}]+)\}/);
  if (goalMatch) {
    content = goalMatch[1];
  }

  if (!content) {
    return null;
  }

  return {
    id: `node-${lineNumber}`,
    type,
    content,
    lineNumber,
    state,
  };
}

/**
 * Extract an edge from a relationship line
 */
function extractEdge(
  line: string,
  lineNumber: number,
  type: EdgeType,
  nodeIdMap: Map<number, string>,
  nodes: GraphNode[]
): GraphEdge | null {
  // Find the nearest node before this line (source)
  let sourceId: string | undefined;
  for (let i = lineNumber - 1; i > 0; i--) {
    sourceId = nodeIdMap.get(i);
    if (sourceId) break;
  }

  if (!sourceId) {
    return null;
  }

  // For now, create target node from the relationship line itself
  // This is simplified - full parser will handle complex relationships
  const content = line.replace(/^.*?(->|=>|<->|::|⟲|><|\.\.\.>)/, '').trim();

  if (!content) {
    return null;
  }

  // Create implicit target node
  const targetId = `node-${lineNumber}`;

  // Check if target node already exists
  const existingNode = nodes.find(n => n.lineNumber === lineNumber);

  if (!existingNode) {
    // Create target node
    const targetNode: GraphNode = {
      id: targetId,
      type: 'thought',
      content,
      lineNumber,
    };
    nodes.push(targetNode);
    nodeIdMap.set(lineNumber, targetId);
  }

  return {
    source: sourceId,
    target: existingNode ? existingNode.id : targetId,
    type,
  };
}

