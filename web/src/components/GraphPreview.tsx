/**
 * Graph Preview Component
 * Session 7b: Real-time graph visualization of FlowScript
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { parseFlowScript } from '../utils/flowscriptParser';
import type { GraphData, GraphNode } from '../types/graph';
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
      setParseError(result.error.message);
      setGraphData(null);
    } else if (result.data) {
      setParseError(null);
      setGraphData(result.data);
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

    // Apply layout algorithm
    const simulation = applyLayout(layoutType, graphData.nodes, graphData.edges, {
      width,
      height,
    });

    // Create edges with enhanced styling
    const link = g
      .append('g')
      .selectAll('line')
      .data(graphData.edges)
      .join('line')
      .attr('class', 'graph-edge')
      .attr('stroke', (d) => getEdgeColor(d.type, theme))
      .attr('stroke-width', (d) => (d.type === 'bidirectional' ? 2.5 : 2))
      .attr('stroke-dasharray', (d) => getEdgeStrokeDash(d.type))
      .attr('marker-end', (d) => `url(#${getEdgeMarker(d.type, theme)})`)
      .attr('opacity', 0.7);

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

    // Create nodes with different shapes based on type
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

      if (shape === 'circle') {
        group
          .append('circle')
          .attr('r', 12)
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'diamond') {
        group
          .append('path')
          .attr('d', 'M 0,-15 L 15,0 L 0,15 L -15,0 Z')
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else if (shape === 'rect') {
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
        group
          .append('path')
          .attr(
            'd',
            'M 0,-14 L 12,-7 L 12,7 L 0,14 L -12,7 L -12,-7 Z'
          )
          .attr('fill', color)
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
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
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

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
 * Get node color based on type and theme
 */
function getNodeColor(type: string, theme: 'light' | 'dark'): string {
  const colors = {
    light: {
      question: '#3b82f6',
      decision: '#10b981',
      thought: '#6b7280',
      tension: '#f59e0b',
      action: '#8b5cf6',
      milestone: '#ec4899',
      reference: '#06b6d4',
      important: '#ef4444',
      note: '#84cc16',
      check: '#10b981',
      wip: '#f59e0b',
      placeholder: '#9ca3af',
    },
    dark: {
      question: '#60a5fa',
      decision: '#34d399',
      thought: '#9ca3af',
      tension: '#fbbf24',
      action: '#a78bfa',
      milestone: '#f472b6',
      reference: '#22d3ee',
      important: '#f87171',
      note: '#a3e635',
      check: '#34d399',
      wip: '#fbbf24',
      placeholder: '#6b7280',
    },
  };

  return colors[theme][type as keyof typeof colors.light] || colors[theme].thought;
}

/**
 * Get node shape based on type
 */
function getNodeShape(type: string): 'circle' | 'diamond' | 'rect' | 'hexagon' {
  const shapes: Record<string, 'circle' | 'diamond' | 'rect' | 'hexagon'> = {
    question: 'circle',
    decision: 'diamond',
    thought: 'circle',
    tension: 'hexagon',
    action: 'rect',
    milestone: 'diamond',
    reference: 'rect',
    important: 'circle',
    note: 'circle',
    check: 'circle',
    wip: 'circle',
    placeholder: 'circle',
  };
  return shapes[type] || 'circle';
}

/**
 * Get edge color based on type and theme
 */
function getEdgeColor(type: string, theme: 'light' | 'dark'): string {
  const colors = {
    light: {
      causal: '#9ca3af',
      temporal: '#9ca3af',
      bidirectional: '#3b82f6',
      definition: '#6b7280',
      feedback: '#f59e0b',
      alternative: '#8b5cf6',
      indirection: '#6b7280',
    },
    dark: {
      causal: '#4b5563',
      temporal: '#4b5563',
      bidirectional: '#60a5fa',
      definition: '#6b7280',
      feedback: '#fbbf24',
      alternative: '#a78bfa',
      indirection: '#6b7280',
    },
  };
  return colors[theme][type as keyof typeof colors.light] || colors[theme].causal;
}

/**
 * Get edge stroke dash pattern based on type
 */
function getEdgeStrokeDash(type: string): string {
  const patterns: Record<string, string> = {
    causal: '0',
    temporal: '5,5',
    bidirectional: '0',
    definition: '0',
    feedback: '3,3',
    alternative: '5,5',
    indirection: '2,2',
  };
  return patterns[type] || '0';
}

/**
 * Get edge marker based on type and theme
 */
function getEdgeMarker(type: string, theme: 'light' | 'dark'): string {
  const markers: Record<string, string> = {
    causal: `arrow-solid-${theme}`,
    temporal: `arrow-dashed-${theme}`,
    bidirectional: `arrow-double-${theme}`,
    definition: `arrow-solid-${theme}`,
    feedback: `arrow-solid-${theme}`,
    alternative: `arrow-dashed-${theme}`,
    indirection: `arrow-dashed-${theme}`,
  };
  return markers[type] || `arrow-solid-${theme}`;
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
