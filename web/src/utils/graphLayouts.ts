/**
 * Graph Layout Algorithms
 * Session 7b.2: Multiple layout strategies for FlowScript graphs
 */

import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '../types/graph';

export type LayoutType = 'force' | 'hierarchical' | 'dag';

export interface LayoutConfig {
  width: number;
  height: number;
}

/**
 * Force-directed layout (organic, relationship-focused)
 * Best for: Small-medium graphs (5-40 nodes)
 */
export function applyForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
) {
  const simulation = d3
    .forceSimulation<GraphNode>(nodes)
    .force(
      'link',
      d3
        .forceLink<GraphNode, GraphEdge>(edges)
        .id((d) => d.id)
        .distance(60)
    )
    .force('charge', d3.forceManyBody().strength(-150))
    .force('center', d3.forceCenter(config.width / 2, config.height / 2).strength(0.05))
    .force('collision', d3.forceCollide().radius(40));

  return simulation;
}

/**
 * Hierarchical layout (top-down tree)
 * Best for: Clear hierarchy, decision trees
 */
export function applyHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
) {
  // Build adjacency map
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();

  edges.forEach((edge) => {
    const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
    const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

    if (!children.has(sourceId)) children.set(sourceId, []);
    children.get(sourceId)!.push(targetId);

    if (!parents.has(targetId)) parents.set(targetId, []);
    parents.get(targetId)!.push(sourceId);
  });

  // Find root nodes (nodes with no parents)
  const roots = nodes.filter((node) => !parents.has(node.id) || parents.get(node.id)!.length === 0);

  // If no roots found, pick nodes with most outgoing edges
  if (roots.length === 0) {
    const outgoingCount = new Map<string, number>();
    edges.forEach((edge) => {
      const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
      outgoingCount.set(sourceId, (outgoingCount.get(sourceId) || 0) + 1);
    });

    const sorted = [...nodes].sort((a, b) =>
      (outgoingCount.get(b.id) || 0) - (outgoingCount.get(a.id) || 0)
    );
    roots.push(sorted[0]);
  }

  // Assign levels using BFS
  const levels = new Map<string, number>();
  const queue: Array<{ id: string; level: number }> = [];

  roots.forEach((root) => {
    levels.set(root.id, 0);
    queue.push({ id: root.id, level: 0 });
  });

  const visited = new Set<string>();
  let maxLevel = 0;

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    maxLevel = Math.max(maxLevel, level);

    const childIds = children.get(id) || [];
    childIds.forEach((childId) => {
      if (!levels.has(childId)) {
        levels.set(childId, level + 1);
      }
      queue.push({ id: childId, level: level + 1 });
    });
  }

  // Assign positions to unvisited nodes (disconnected components)
  nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, maxLevel + 1);
      maxLevel = maxLevel + 1;
    }
  });

  // Group nodes by level
  const nodesByLevel = new Map<number, GraphNode[]>();
  nodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level)!.push(node);
  });

  // Calculate positions
  const levelHeight = config.height / (maxLevel + 2);

  nodesByLevel.forEach((levelNodes, level) => {
    const levelWidth = config.width / (levelNodes.length + 1);
    levelNodes.forEach((node, index) => {
      node.x = levelWidth * (index + 1);
      node.y = levelHeight * (level + 1);
      node.fx = node.x;
      node.fy = node.y;
    });
  });

  // Return a dummy simulation that doesn't move nodes
  return d3
    .forceSimulation<GraphNode>(nodes)
    .force('link', null)
    .force('charge', null)
    .force('center', null)
    .alphaDecay(1); // Stop immediately
}

/**
 * DAG layout (left-to-right, minimize crossings)
 * Best for: Causal chains, linear narratives
 */
export function applyDAGLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
) {
  // Build adjacency map for topological sort
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach((node) => {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
    const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

    adjacency.get(sourceId)!.push(targetId);
    inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
  });

  // Topological sort (Kahn's algorithm)
  const queue: string[] = [];
  const sorted: string[] = [];

  // Find all nodes with no incoming edges
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // If cycle detected, add remaining nodes
  nodes.forEach((node) => {
    if (!sorted.includes(node.id)) {
      sorted.push(node.id);
    }
  });

  // Assign layers (similar to hierarchical but horizontal)
  const layers = new Map<string, number>();
  const processed = new Set<string>();

  sorted.forEach((nodeId) => {
    if (processed.has(nodeId)) return;

    // Find max layer of predecessors
    let maxPredLayer = -1;
    edges.forEach((edge) => {
      const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
      const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

      if (targetId === nodeId && layers.has(sourceId)) {
        maxPredLayer = Math.max(maxPredLayer, layers.get(sourceId)!);
      }
    });

    layers.set(nodeId, maxPredLayer + 1);
    processed.add(nodeId);
  });

  const maxLayer = Math.max(...Array.from(layers.values()));

  // Group nodes by layer
  const nodesByLayer = new Map<number, GraphNode[]>();
  nodes.forEach((node) => {
    const layer = layers.get(node.id) || 0;
    if (!nodesByLayer.has(layer)) nodesByLayer.set(layer, []);
    nodesByLayer.get(layer)!.push(node);
  });

  // Calculate positions (left-to-right)
  const layerWidth = config.width / (maxLayer + 2);

  nodesByLayer.forEach((layerNodes, layer) => {
    const layerHeight = config.height / (layerNodes.length + 1);
    layerNodes.forEach((node, index) => {
      node.x = layerWidth * (layer + 1);
      node.y = layerHeight * (index + 1);
      node.fx = node.x;
      node.fy = node.y;
    });
  });

  // Return a dummy simulation that doesn't move nodes
  return d3
    .forceSimulation<GraphNode>(nodes)
    .force('link', null)
    .force('charge', null)
    .force('center', null)
    .alphaDecay(1); // Stop immediately
}

/**
 * Apply the specified layout algorithm
 */
export function applyLayout(
  layoutType: LayoutType,
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
) {
  // Clear fixed positions for force layout
  if (layoutType === 'force') {
    nodes.forEach((node) => {
      node.fx = null;
      node.fy = null;
    });
  }

  switch (layoutType) {
    case 'force':
      return applyForceLayout(nodes, edges, config);
    case 'hierarchical':
      return applyHierarchicalLayout(nodes, edges, config);
    case 'dag':
      return applyDAGLayout(nodes, edges, config);
    default:
      return applyForceLayout(nodes, edges, config);
  }
}
