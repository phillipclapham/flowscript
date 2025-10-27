/**
 * Graph Preview Component
 * Session 7b: Real-time graph visualization of FlowScript
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { parseFlowScript } from '../utils/flowscriptParser';
import type { GraphData, GraphNode, GraphEdge } from '../types/graph';
import { useTheme } from '../lib/theme/useTheme';
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

    // Define arrow markers for edges
    svg
      .append('defs')
      .append('marker')
      .attr('id', `arrowhead-${theme}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', theme === 'dark' ? '#4b5563' : '#9ca3af');

    // Create force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(graphData.nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphEdge>(graphData.edges)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create edges
    const link = g
      .append('g')
      .selectAll('line')
      .data(graphData.edges)
      .join('line')
      .attr('class', 'graph-edge')
      .attr('stroke', theme === 'dark' ? '#4b5563' : '#9ca3af')
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#arrowhead-${theme})`);

    // Create nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('class', 'graph-node')
      .attr('r', 12)
      .attr('fill', (d) => getNodeColor(d.type, theme))
      .attr('stroke', theme === 'dark' ? '#1f2937' : '#ffffff')
      .attr('stroke-width', 2)
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
    node.append('title').text((d) => `${d.type}: ${d.content}\nLine ${d.lineNumber}`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

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
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData, theme, onNodeClick]);

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
 * Truncate text for labels
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
