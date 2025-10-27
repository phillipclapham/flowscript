/**
 * Query Panel Component (Placeholder for Session 7c)
 *
 * Will execute 5 queries: why, whatIf, tensions, blocked, alternatives
 */

export interface QueryPanelProps {
  flowScriptCode: string;
}

export function QueryPanel(_props: QueryPanelProps) {
  return (
    <div className="query-panel-placeholder" style={{
      padding: '24px',
      backgroundColor: '#f9fafb',
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      textAlign: 'center',
      color: '#6b7280',
    }}>
      <h3 style={{ marginTop: 0, color: '#374151' }}>Query Execution</h3>
      <p>Interactive query execution coming in Session 7c</p>
      <p style={{ fontSize: '12px', marginTop: '16px' }}>
        5 queries: why(), whatIf(), tensions(), blocked(), alternatives()
      </p>
    </div>
  );
}
