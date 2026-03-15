/**
 * Query Panel Component
 * Session 7c: Interactive query execution for FlowScript IR
 *
 * Runs 5 queries on parsed FlowScript:
 * - tensions(): Tradeoff mapping
 * - blocked(): Blocker tracking
 * - alternatives(): Decision reconstruction
 * - why(nodeId): Causal ancestry
 * - whatIf(nodeId): Impact analysis
 */

import { useState, useMemo } from 'react';
import { FlowScriptQueryEngine } from '../../../src/query-engine';
import type { IR } from '../../../src/types';
import { useTheme } from '../lib/theme/useTheme';
import './QueryPanel.css';

type QueryType = 'tensions' | 'blocked' | 'alternatives' | 'why' | 'whatIf';

export interface QueryPanelProps {
  ir: IR | null;
  parseError: string | null;
}

export function QueryPanel({ ir, parseError }: QueryPanelProps) {
  const [activeQuery, setActiveQuery] = useState<QueryType>('tensions');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const { theme } = useTheme();

  // Build query engine from IR (no parsing here — App.tsx owns that)
  const engine = useMemo(() => {
    if (!ir) return null;
    const eng = new FlowScriptQueryEngine();
    eng.load(ir);
    return eng;
  }, [ir]);

  // Get node lists for dropdowns
  const { questionNodes, allNodes } = useMemo(() => {
    if (!ir) return { questionNodes: [], allNodes: [] };
    return {
      questionNodes: ir.nodes.filter(n => n.type === 'question'),
      allNodes: ir.nodes.filter(n => n.content.length > 0),
    };
  }, [ir]);

  // Determine if current query needs a node selector
  const needsNodeId = activeQuery === 'why' || activeQuery === 'whatIf' || activeQuery === 'alternatives';
  const nodeList = activeQuery === 'alternatives' ? questionNodes : allNodes;

  // Auto-select first node when switching queries
  const effectiveNodeId = selectedNodeId || (nodeList.length > 0 ? nodeList[0].id : '');

  // Execute query
  const queryResult = useMemo(() => {
    if (!engine || !ir) return null;
    try {
      switch (activeQuery) {
        case 'tensions':
          return engine.tensions({ groupBy: 'axis', includeContext: true });
        case 'blocked':
          return engine.blocked({ includeTransitiveCauses: true, includeTransitiveEffects: true });
        case 'alternatives': {
          if (!effectiveNodeId) return { empty: true, message: 'No question nodes found' };
          return engine.alternatives(effectiveNodeId, {
            includeRationale: true,
            includeConsequences: true,
            format: 'comparison',
          });
        }
        case 'why': {
          if (!effectiveNodeId) return { empty: true, message: 'No nodes available' };
          return engine.why(effectiveNodeId, { format: 'chain' });
        }
        case 'whatIf': {
          if (!effectiveNodeId) return { empty: true, message: 'No nodes available' };
          return engine.whatIf(effectiveNodeId, { format: 'tree' });
        }
      }
    } catch (err: any) {
      return { error: true, message: err.message };
    }
  }, [engine, ir, activeQuery, effectiveNodeId]);

  if (parseError) {
    return <div className="query-panel query-error">Parse error: {parseError}</div>;
  }

  return (
    <div className={`query-panel ${theme}`}>
      <div className="query-tabs">
        {(['tensions', 'blocked', 'alternatives', 'why', 'whatIf'] as QueryType[]).map(q => (
          <button
            key={q}
            className={`query-tab ${activeQuery === q ? 'active' : ''}`}
            onClick={() => { setActiveQuery(q); setSelectedNodeId(''); }}
          >
            {q === 'whatIf' ? 'whatIf()' : `${q}()`}
          </button>
        ))}
      </div>

      {needsNodeId && nodeList.length > 0 && (
        <div className="query-node-picker">
          <label htmlFor="node-select">
            {activeQuery === 'alternatives' ? 'Question:' : 'Node:'}
          </label>
          <select
            id="node-select"
            value={effectiveNodeId}
            onChange={e => setSelectedNodeId(e.target.value)}
            className="node-select"
          >
            {nodeList.map(n => (
              <option key={n.id} value={n.id}>
                {n.content.length > 60 ? n.content.slice(0, 57) + '...' : n.content}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="query-results">
        {queryResult && <QueryResultView result={queryResult} queryType={activeQuery} />}
      </div>
    </div>
  );
}

// ============================================================================
// Result Rendering
// ============================================================================

function QueryResultView({ result, queryType }: { result: any; queryType: QueryType }) {
  if (result.error) {
    return <div className="result-error">{result.message}</div>;
  }
  if (result.empty) {
    return <div className="result-empty">{result.message}</div>;
  }

  switch (queryType) {
    case 'tensions': return <TensionsView result={result} />;
    case 'blocked': return <BlockedView result={result} />;
    case 'alternatives': return <AlternativesView result={result} />;
    case 'why': return <WhyView result={result} />;
    case 'whatIf': return <WhatIfView result={result} />;
    default: return <pre>{JSON.stringify(result, null, 2)}</pre>;
  }
}

function TensionsView({ result }: { result: any }) {
  const { metadata } = result;
  if (metadata.total_tensions === 0) {
    return <div className="result-empty">No tensions found in the graph.</div>;
  }

  return (
    <div className="result-section">
      <div className="result-meta">
        {metadata.total_tensions} tension{metadata.total_tensions !== 1 ? 's' : ''} across {metadata.unique_axes.length} {metadata.unique_axes.length !== 1 ? 'axes' : 'axis'}
      </div>
      {result.tensions_by_axis && Object.entries(result.tensions_by_axis).map(([axis, tensions]: [string, any]) => (
        <div key={axis} className="tension-group">
          <div className="tension-axis">{axis}</div>
          {tensions.map((t: any, i: number) => (
            <div key={i} className="tension-pair">
              <span className="tension-source">{t.source.content}</span>
              <span className="tension-vs">vs</span>
              <span className="tension-target">{t.target.content}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function BlockedView({ result }: { result: any }) {
  const { blockers, metadata } = result;
  if (metadata.total_blockers === 0) {
    return <div className="result-empty">No blocked nodes found.</div>;
  }

  return (
    <div className="result-section">
      <div className="result-meta">
        {metadata.total_blockers} blocker{metadata.total_blockers !== 1 ? 's' : ''} | avg {metadata.average_days_blocked} days blocked
      </div>
      {blockers.map((b: any, i: number) => (
        <div key={i} className="blocker-card">
          <div className="blocker-header">
            <span className="blocker-icon">&#x1F6AB;</span>
            <span className="blocker-content">{b.node.content}</span>
          </div>
          <div className="blocker-details">
            <div>Reason: {b.blocked_state.reason}</div>
            <div>Since: {b.blocked_state.since} ({b.blocked_state.days_blocked} days)</div>
            {b.transitive_effects && b.transitive_effects.length > 0 && (
              <div>Blocks {b.transitive_effects.length} downstream node{b.transitive_effects.length !== 1 ? 's' : ''}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AlternativesView({ result }: { result: any }) {
  if (!result.question) {
    return <div className="result-empty">No decision data.</div>;
  }

  return (
    <div className="result-section">
      <div className="alt-question">{result.question.content}</div>
      <div className="alt-list">
        {result.alternatives?.map((alt: any, i: number) => (
          <div key={i} className={`alt-card ${alt.chosen ? 'chosen' : 'rejected'}`}>
            <div className="alt-header">
              <span className="alt-status">{alt.chosen ? '\u2713' : '\u2717'}</span>
              <span className="alt-content">{alt.content}</span>
            </div>
            {alt.chosen && alt.rationale && (
              <div className="alt-rationale">Rationale: {alt.rationale}</div>
            )}
            {alt.consequences && alt.consequences.length > 0 && (
              <div className="alt-consequences">
                {alt.consequences.map((c: any, j: number) => (
                  <div key={j} className="alt-consequence">&rarr; {c.content}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {result.decision_summary?.chosen && (
        <div className="decision-summary">
          Decision: <strong>{result.decision_summary.chosen}</strong>
        </div>
      )}
    </div>
  );
}

function WhyView({ result }: { result: any }) {
  if (!result.target) {
    return <div className="result-empty">No causal chain found.</div>;
  }

  return (
    <div className="result-section">
      <div className="why-target">
        Target: <strong>{result.target.content}</strong>
      </div>
      {result.causal_chain.length > 0 ? (
        <div className="causal-chain">
          {result.causal_chain.map((node: any, i: number) => (
            <div key={i} className="chain-node">
              <span className="chain-depth">d{node.depth}</span>
              <span className="chain-content">{node.content}</span>
              <span className="chain-rel">{node.relationship_type}</span>
            </div>
          ))}
          <div className="chain-arrow">&darr;</div>
          <div className="chain-node chain-target">
            <span className="chain-content">{result.target.content}</span>
          </div>
        </div>
      ) : (
        <div className="result-empty">This node is a root — no causal ancestors.</div>
      )}
      {result.root_cause && (
        <div className="result-meta">
          Root cause: {result.root_cause.content}
          {result.metadata.has_multiple_paths && ' | Multiple paths detected'}
        </div>
      )}
    </div>
  );
}

function WhatIfView({ result }: { result: any }) {
  if (!result.source) {
    return <div className="result-empty">No impact data.</div>;
  }

  const { impact_tree, tensions_in_impact_zone, metadata } = result;

  return (
    <div className="result-section">
      <div className="whatif-source">
        If <strong>{result.source.content}</strong> changes:
      </div>
      {impact_tree.direct_consequences.length > 0 && (
        <div className="impact-group">
          <div className="impact-label">Direct consequences ({impact_tree.direct_consequences.length})</div>
          {impact_tree.direct_consequences.map((c: any, i: number) => (
            <div key={i} className="impact-node">
              <span className="impact-arrow">&rarr;</span>
              <span className="impact-content">{c.content}</span>
              {c.has_tension && <span className="impact-tension-badge">tension</span>}
            </div>
          ))}
        </div>
      )}
      {impact_tree.indirect_consequences.length > 0 && (
        <div className="impact-group">
          <div className="impact-label">Indirect consequences ({impact_tree.indirect_consequences.length})</div>
          {impact_tree.indirect_consequences.map((c: any, i: number) => (
            <div key={i} className="impact-node indirect">
              <span className="impact-arrow">{'  '.repeat(c.depth - 1)}&rarr;</span>
              <span className="impact-content">{c.content}</span>
              {c.tension_axis && <span className="impact-tension-badge">{c.tension_axis}</span>}
            </div>
          ))}
        </div>
      )}
      {tensions_in_impact_zone.length > 0 && (
        <div className="impact-group">
          <div className="impact-label">Tensions in impact zone</div>
          {tensions_in_impact_zone.map((t: any, i: number) => (
            <div key={i} className="tension-pair">
              <span className="tension-source">{t.source.content}</span>
              <span className="tension-vs">vs</span>
              <span className="tension-target">{t.target.content}</span>
            </div>
          ))}
        </div>
      )}
      {metadata.total_descendants === 0 && (
        <div className="result-empty">No downstream consequences found.</div>
      )}
      <div className="result-meta">
        {metadata.total_descendants} affected node{metadata.total_descendants !== 1 ? 's' : ''} | max depth {metadata.max_depth}
        {metadata.tension_count > 0 && ` | ${metadata.tension_count} tension${metadata.tension_count !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}
