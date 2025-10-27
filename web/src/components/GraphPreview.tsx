/**
 * Graph Preview Component (Placeholder for Session 7b)
 *
 * Will display real-time graph visualization of FlowScript
 */

export interface GraphPreviewProps {
  flowScriptCode: string;
}

export function GraphPreview(_props: GraphPreviewProps) {
  return (
    <div className="graph-preview-placeholder" style={{
      padding: '24px',
      backgroundColor: '#f9fafb',
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      textAlign: 'center',
      color: '#6b7280',
    }}>
      <h3 style={{ marginTop: 0, color: '#374151' }}>Graph Preview</h3>
      <p>Real-time graph visualization coming in Session 7b</p>
      <p style={{ fontSize: '12px', marginTop: '16px' }}>
        Will display: nodes, edges, bidirectional linking
      </p>
    </div>
  );
}
