/**
 * Compile Panel — Convert natural language to FlowScript
 *
 * Sends text to the FlowScript compiler worker (Cloudflare Worker + Claude Sonnet),
 * receives FlowScript output, and injects it into the editor.
 */

import { useState } from 'react';
import { useTheme } from '../lib/theme/useTheme';
import './CompilePanel.css';

const COMPILER_URL = import.meta.env.VITE_COMPILER_URL || 'https://flowscript-compiler.pclapham42.workers.dev';

const PLACEHOLDER = `Paste meeting notes, brainstorm output, decision logs, or any natural language text here. The compiler will convert it into structured FlowScript that you can visualize and query.

Example:
"We decided to go with Redis for the session store because speed matters more than durability for ephemeral data. Sarah is blocked on the auth service migration until the Redis cluster is provisioned. We're also exploring whether to use URL-based or header-based API versioning — headers give cleaner URLs but are harder to test."`;

interface CompilePanelProps {
  onCompiled: (flowscript: string) => void;
}

export function CompilePanel({ onCompiled }: CompilePanelProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ input_tokens?: number; output_tokens?: number; cache_read?: number } | null>(null);
  const { theme } = useTheme();

  const handleCompile = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setUsage(null);

    try {
      const response = await fetch(`${COMPILER_URL}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Error ${response.status}`);
        return;
      }

      if (data.flowscript) {
        setUsage(data.usage || null);
        // Brief delay so user sees success before tab switches
        setTimeout(() => onCompiled(data.flowscript), 600);
      } else {
        setError('No output received from compiler.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Is the compiler service running?');
    } finally {
      setLoading(false);
    }
  };

  const charCount = input.length;
  const charLimit = 2000;
  const isOverLimit = charCount > charLimit;

  return (
    <div className={`compile-panel ${theme}`}>
      <div className="compile-header">
        <span className="compile-title">Natural Language → FlowScript</span>
        <span className="compile-model">Claude Sonnet</span>
      </div>

      <textarea
        className="compile-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={loading}
        rows={8}
      />

      <div className="compile-actions">
        <span className={`char-count ${isOverLimit ? 'over-limit' : ''}`}>
          {charCount}/{charLimit}
        </span>

        <button
          className="compile-button"
          onClick={handleCompile}
          disabled={loading || !input.trim() || isOverLimit}
        >
          {loading ? 'Compiling...' : 'Convert to FlowScript'}
        </button>
      </div>

      {error && (
        <div className="compile-error">
          {error}
        </div>
      )}

      {usage && (
        <div className="compile-success">
          Converted — loading into editor...
          <span className="compile-usage">
            ({usage.input_tokens} in / {usage.output_tokens} out
            {usage.cache_read ? ` / ${usage.cache_read} cached` : ''})
          </span>
        </div>
      )}
    </div>
  );
}
