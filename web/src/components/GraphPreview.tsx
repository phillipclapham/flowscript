/**
 * Graph Preview Component
 * Session 7b: Real-time graph visualization of FlowScript
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { parseFlowScript } from '../utils/fullFlowScriptParser';
import { irToGraphData } from '../utils/irToGraphData';
import type { GraphData, GraphNode, NodeType, EdgeType, NodeShape } from '../types/graph';
import { NODE_SHAPES, NODE_COLORS, EDGE_STYLES } from '../types/graph';
import { useTheme } from '../lib/theme/useTheme';
import { applyLayout, type LayoutType } from '../utils/graphLayouts';
import './GraphPreview.css';

export interface GraphPreviewProps {
  flowScriptCode: string;
  onNodeClick?: (lineNumber: number) => void;
}

export function GraphPreview({ flowScriptCode, onNodeClick }: GraphPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('force');
  const { theme } = useTheme();

  // Parse FlowScript code
  useEffect(() => {
    const result = parseFlowScript(flowScriptCode);

    if (result.error) {
      console.error('[GraphPreview] Parse error:', result.error);
      setParseError(result.error.message);
      setGraphData(null);
    } else if (result.ir) {
      setParseError(null);
      // Transform IR to GraphData (zero semantic loss)
      console.log('[GraphPreview] Parse successful! IR:', result.ir);
      const graphData = irToGraphData(result.ir);
      console.log('[GraphPreview] GraphData transformed:', {
        nodes: graphData.nodes.length,
        edges: graphData.edges.length,
        nodeTypes: [...new Set(graphData.nodes.map(n => n.type))],
        edgeTypes: [...new Set(graphData.edges.map(e => e.type))],
      });
      setGraphData(graphData);
    }
  }, [flowScriptCode]);

  // Render graph with D3
  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous render
    svg.selectAll('*').remove();

    // Set up SVG
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Define arrow markers for different edge types
    const defs = svg.append('defs');

    // Solid arrow (causal, default)
    defs
      .append('marker')
      .attr('id', `arrow-solid-${theme}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', theme === 'dark' ? '#4b5563' : '#9ca3af');

    // Dashed arrow (temporal)
    defs
      .append('marker')
      .attr('id', `arrow-dashed-${theme}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', theme === 'dark' ? '#6b7280' : '#9ca3af');

    // Double arrow (bidirectional)
    defs
      .append('marker')
      .attr('id', `arrow-double-${theme}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', theme === 'dark' ? '#60a5fa' : '#3b82f6');

    // Better arrow (alternative_better - green)
    defs
      .append('marker')
      .attr('id', `arrow-better-${theme}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10b981'); // Green for better alternative

    // Worse arrow (alternative_worse - red)
    defs
      .append('marker')
      .attr('id', `arrow-worse-${theme}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444'); // Red for worse alternative

    // Apply layout algorithm
    const simulation = applyLayout(layoutType, graphData.nodes, graphData.edges, {
      width,
      height,
    });

    // Create edges with enhanced styling (handles all 10 edge types)
    const linkGroup = g.append('g').attr('class', 'graph-edges');

    graphData.edges.forEach((edge) => {
      const edgeStyle = EDGE_STYLES[edge.type];
      const color = getEdgeColor(edge.type);

      // For double lines (equivalent, different), render two parallel lines
      if (edgeStyle.style === 'double') {
        const offset = 2; // Pixels apart
        // First line
        linkGroup
          .append('line')
          .datum(edge)
          .attr('class', 'graph-edge')
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('marker-end', `url(#${getEdgeMarker(edge.type, theme)})`)
          .attr('opacity', 0.7)
          .attr('data-offset', offset);
        // Second line (parallel)
        linkGroup
          .append('line')
          .datum(edge)
          .attr('class', 'graph-edge')
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.7)
          .attr('data-offset', -offset);
      } else {
        // Regular single line (solid, dashed, dotted, wavy)
        linkGroup
          .append('line')
          .datum(edge)
          .attr('class', 'graph-edge')
          .attr('stroke', color)
          .attr('stroke-width', edge.type === 'bidirectional' ? 2.5 : 2)
          .attr('stroke-dasharray', getEdgeStrokeDash(edge.type))
          .attr('marker-end', `url(#${getEdgeMarker(edge.type, theme)})`)
          .attr('opacity', 0.7);
      }
    });

    // Add labels for tension edges (axis labels)
    const edgeLabels = g
      .append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(graphData.edges.filter((e) => e.type === 'tension'))
      .join('text')
      .attr('class', 'edge-label')
      .attr('font-size', '9px')
      .attr('fill', theme === 'dark' ? '#fbbf24' : '#f59e0b')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text((d) => d.label || 'tension');

    const link = linkGroup.selectAll('line');

    // Create node groups for complex shapes
    const nodeGroup = g
      .append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'graph-node-group')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        if (onNodeClick) {
          onNodeClick(d.lineNumber);
        }
      })
      .call(
        d3
          .drag<any, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    // Create nodes with different shapes based on type (all 12 IR types)
    nodeGroup.each(function (d) {
      const group = d3.select(this);
      const shape = getNodeShape(d.type);
      const color = getNodeColor(d.type, theme);
      const strokeColor = d.state?.blocked
        ? '#ef4444' // red for blocked
        : theme === 'dark'
        ? '#1f2937'
        : '#ffffff';
      const strokeWidth = d.state?.blocked || d.state?.decided ? 3 : 2;

      // Render shape based on type
      if (shape === 'circle') {
        // thought nodes - basic circle
        group
          .append('circle')
          .attr('r', 12)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'diamond') {
        // question nodes - diamond shape
        group
          .append('path')
          .attr('d', 'M 0,-15 L 15,0 L 0,15 L -15,0 Z')
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'rect') {
        // action nodes - rectangle with small border radius
        group
          .append('rect')
          .attr('x', -12)
          .attr('y', -12)
          .attr('width', 24)
          .attr('height', 24)
          .attr('rx', 3)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'hexagon') {
        // decision nodes - hexagon
        group
          .append('path')
          .attr('d', 'M 0,-14 L 12,-7 L 12,7 L 0,14 L -12,7 L -12,-7 Z')
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'rounded-rect') {
        // statement nodes - rounded rectangle (larger border radius)
        group
          .append('rect')
          .attr('x', -14)
          .attr('y', -10)
          .attr('width', 28)
          .attr('height', 20)
          .attr('rx', 6)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'triangle') {
        // alternative nodes - triangle
        group
          .append('path')
          .attr('d', 'M 0,-13 L 11,10 L -11,10 Z')
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'rounded-square') {
        // parking nodes - rounded square
        group
          .append('rect')
          .attr('x', -12)
          .attr('y', -12)
          .attr('width', 24)
          .attr('height', 24)
          .attr('rx', 6)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'dashed-circle') {
        // exploring nodes - circle with dashed border
        group
          .append('circle')
          .attr('r', 12)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth)
          .attr('stroke-dasharray', '3,2');
      } else if (shape === 'octagon') {
        // blocker nodes - octagon (stop sign)
        const angle = Math.PI / 4; // 45 degrees
        const r = 13;
        const points = Array.from({ length: 8 }, (_, i) => {
          const a = angle * i - Math.PI / 2;
          return `${r * Math.cos(a)},${r * Math.sin(a)}`;
        }).join(' L ');
        group
          .append('path')
          .attr('d', `M ${points} Z`)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'star') {
        // insight nodes - 5-point star
        const outerR = 14;
        const innerR = 6;
        const points = Array.from({ length: 10 }, (_, i) => {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? outerR : innerR;
          return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
        }).join(' L ');
        group
          .append('path')
          .attr('d', `M ${points} Z`)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'circle-check') {
        // completion nodes - circle with checkmark
        group
          .append('circle')
          .attr('r', 12)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
        // Add checkmark
        group
          .append('path')
          .attr('d', 'M -5,0 L -2,5 L 6,-5')
          .attr('fill', 'none')
          .attr('stroke', theme === 'dark' ? '#1f2937' : '#ffffff')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');
      } else if (shape === 'cluster') {
        // block nodes - larger container with dashed border
        const size = 40; // Larger than regular nodes
        group
          .append('rect')
          .attr('x', -size/2)
          .attr('y', -size/2)
          .attr('width', size)
          .attr('height', size)
          .attr('rx', 8)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth)
          .attr('stroke-dasharray', '5,3');
        // Add child count label
        const childCount = d.children?.length || 0;
        if (childCount > 0) {
          group
            .append('text')
            .attr('y', 0)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('fill', theme === 'dark' ? '#1f2937' : '#ffffff')
            .style('pointer-events', 'none')
            .text(`${childCount}`);
        }
      }

      // Add state indicator for decided nodes
      if (d.state?.decided) {
        group
          .append('circle')
          .attr('cx', 8)
          .attr('cy', -8)
          .attr('r', 4)
          .attr('fill', '#10b981')
          .attr('stroke', theme === 'dark' ? '#1f2937' : '#ffffff')
          .attr('stroke-width', 1);
      }
    });

    // Add node labels
    const labels = g
      .append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .attr('class', 'graph-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('fill', theme === 'dark' ? '#9ca3af' : '#6b7280')
      .attr('font-size', '11px')
      .style('pointer-events', 'none')
      .text((d) => truncate(d.content, 20));

    // Add tooltips
    nodeGroup.append('title').text((d) => {
      let tooltip = `${d.type}: ${d.content}\nLine ${d.lineNumber}`;
      if (d.state?.blocked) {
        tooltip += `\n🚫 Blocked: ${d.state.blocked.reason}`;
      }
      if (d.state?.decided) {
        tooltip += `\n✓ Decided: ${d.state.decided.rationale}`;
      }
      return tooltip;
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      // Update edge positions (handles both single and double lines)
      link.each(function (d: any) {
        const line = d3.select(this);
        const offset = parseFloat(line.attr('data-offset') || '0');

        if (offset !== 0) {
          // Calculate perpendicular offset for parallel lines
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const offsetX = offset * (-dy / dist);
          const offsetY = offset * (dx / dist);

          line
            .attr('x1', d.source.x + offsetX)
            .attr('y1', d.source.y + offsetY)
            .attr('x2', d.target.x + offsetX)
            .attr('y2', d.target.y + offsetY);
        } else {
          // Regular single line
          line
            .attr('x1', d.source.x)
            .attr('y1', d.source.y)
            .attr('x2', d.target.x)
            .attr('y2', d.target.y);
        }
      });

      // Update tension edge labels (midpoint of edge)
      edgeLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);

      nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`);

      labels.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
    });

    // Drag functions
    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Fit to view: wait for simulation to settle, then zoom to fit all nodes
    simulation.on('end', () => {
      // Calculate bounding box of all nodes
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      graphData.nodes.forEach((d) => {
        if (d.x !== undefined && d.y !== undefined) {
          minX = Math.min(minX, d.x);
          maxX = Math.max(maxX, d.x);
          minY = Math.min(minY, d.y);
          maxY = Math.max(maxY, d.y);
        }
      });

      // Add padding
      const padding = 60;
      minX -= padding;
      maxX += padding;
      minY -= padding;
      maxY += padding;

      // Calculate scale to fit
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const scale = Math.min(width / graphWidth, height / graphHeight, 1.5);

      // Calculate translation to center
      const translateX = width / 2 - (minX + graphWidth / 2) * scale;
      const translateY = height / 2 - (minY + graphHeight / 2) * scale;

      // Apply transform
      const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
      svg.transition().duration(750).call(zoom.transform as any, transform);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData, theme, layoutType, onNodeClick]);

  // Show error state
  if (parseError) {
    return (
      <div className="graph-error">
        <h3>Parse Error</h3>
        <p>{parseError}</p>
      </div>
    );
  }

  // Show empty state
  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="graph-empty">
        <h3>No Graph Data</h3>
        <p>Start typing FlowScript to see the graph visualization</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="graph-preview">
      <div className="graph-controls">
        <label htmlFor="layout-select">Layout:</label>
        <select
          id="layout-select"
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value as LayoutType)}
          className="layout-select"
        >
          <option value="force">Force (Organic)</option>
          <option value="hierarchical">Hierarchical (Tree)</option>
          <option value="dag">DAG (Left-to-Right)</option>
        </select>
      </div>
      <svg ref={svgRef} className="graph-svg" />
      <div className="graph-stats">
        <span>{graphData.nodes.length} nodes</span>
        <span>{graphData.edges.length} edges</span>
      </div>
    </div>
  );
}

/**
 * Get node color based on IR-native node type and theme.
 * Uses NODE_COLORS palette from graph.ts for semantic consistency.
 */
function getNodeColor(type: NodeType, theme: 'light' | 'dark'): string {
  return NODE_COLORS[type][theme];
}

/**
 * Get node shape based on IR-native node type.
 * Uses NODE_SHAPES mapping from graph.ts for zero semantic loss.
 */
function getNodeShape(type: NodeType): NodeShape {
  return NODE_SHAPES[type];
}

/**
 * Get edge color based on IR-native edge type.
 * Uses EDGE_STYLES from graph.ts for consistent visualization.
 */
function getEdgeColor(type: EdgeType): string {
  return EDGE_STYLES[type].color;
}

/**
 * Get edge stroke dash pattern based on IR-native edge type.
 * Maps edge styles to SVG stroke-dasharray values.
 */
function getEdgeStrokeDash(type: EdgeType): string {
  const style = EDGE_STYLES[type].style;
  const patterns: Record<string, string> = {
    solid: '0',
    dashed: '5,5',
    dotted: '2,2',
    wavy: '0',      // Wavy uses path transformation, not dash
    double: '0',    // Double renders as two lines
  };
  return patterns[style] || '0';
}

/**
 * Get edge marker based on IR-native edge type.
 * Returns marker ID for SVG marker-end attribute.
 */
function getEdgeMarker(type: EdgeType, theme: 'light' | 'dark'): string {
  const marker = EDGE_STYLES[type].marker;
  const markerMap: Record<string, string> = {
    arrow: `arrow-solid-${theme}`,
    'double-arrow': `arrow-double-${theme}`,
    better: `arrow-better-${theme}`,
    worse: `arrow-worse-${theme}`,
  };
  return markerMap[marker] || `arrow-solid-${theme}`;
}

/**
 * Truncate text for labels
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
