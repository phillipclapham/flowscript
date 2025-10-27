/**
 * Line Wrap Toggle Component
 *
 * Toggles line wrapping in the editor
 * Persists preference to localStorage
 */

interface LineWrapToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function LineWrapToggle({ enabled, onToggle }: LineWrapToggleProps) {
  return (
    <button
      className="toggle-button"
      onClick={onToggle}
      aria-label={`Line wrapping ${enabled ? "on" : "off"}`}
      title={`Line wrapping ${enabled ? "on" : "off"}`}
    >
      <span>{enabled ? "≡" : "—"}</span>
      <span className="toggle-button-text">{enabled ? "Wrap" : "Wrap"}</span>
    </button>
  );
}
