/**
 * Framework logo badges for the landing page.
 * Simple SVG icons with brand colors — recognizable without trademark issues.
 */

const frameworks = [
  {
    name: "LangGraph",
    color: "#1C3C3C",
    darkColor: "#4ade80",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    name: "CrewAI",
    color: "#FF6B2B",
    darkColor: "#fb923c",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="3" />
        <circle cx="15" cy="7" r="3" />
        <path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      </svg>
    ),
  },
  {
    name: "Google ADK",
    color: "#4285F4",
    darkColor: "#60a5fa",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".7" />
        <path d="M5.84 14.09A6.97 6.97 0 015.5 12c0-.72.12-1.42.34-2.09V7.07H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z" opacity=".5" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".8" />
      </svg>
    ),
  },
  {
    name: "OpenAI Agents",
    color: "#000000",
    darkColor: "#f1f5f9",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M22.2 8.4c.5-1.5.2-3.1-.8-4.3a5 5 0 00-5.3-1.9A5 5 0 0012.4.4a5 5 0 00-4.7 3.2 5 5 0 00-3.3 2.4 5 5 0 00.6 5.6 5 5 0 00.8 4.3 5 5 0 005.3 1.9 5 5 0 003.7 1.7 5 5 0 004.7-3.2 5 5 0 003.3-2.4 5 5 0 00-.6-5.5zm-7.5 12.8a3.7 3.7 0 01-2.4-.8l.1-.1 4-2.3a.6.6 0 00.3-.6v-5.6l1.7 1a.1.1 0 01.1.1v4.7a3.8 3.8 0 01-3.8 3.6zM4.4 17.6a3.7 3.7 0 01-.5-2.5l.1.1 4 2.3a.7.7 0 00.7 0l4.8-2.8v1.9a.1.1 0 01-.1.1L9.3 19a3.8 3.8 0 01-4.9-1.4zM3.2 8a3.7 3.7 0 012-1.6v4.7a.6.6 0 00.3.5l4.8 2.8-1.7 1a.1.1 0 01-.1 0L4.3 13a3.8 3.8 0 01-1.1-5zm15.2 3.5l-4.8-2.8 1.7-1a.1.1 0 01.1 0l4.1 2.4a3.8 3.8 0 01-1.4 6.8v-4.8a.7.7 0 00-.3-.6h.6zm1.7-2.5l-.1-.1-4-2.3a.7.7 0 00-.7 0l-4.8 2.8V7.6a.1.1 0 01.1-.1l4.1-2.4a3.8 3.8 0 015.6 3.9h-.2zM8.8 12.9l-1.7-1a.1.1 0 01-.1-.1V7.1a3.8 3.8 0 016.2-2.9l-.1.1-4 2.3a.6.6 0 00-.3.5v5.8zm.9-2L12 9.5l2.3 1.3v2.7L12 14.8l-2.3-1.3V11z" />
      </svg>
    ),
  },
  {
    name: "Pydantic AI",
    color: "#E92063",
    darkColor: "#f472b6",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l8 4v8l-8 4-8-4V6l8-4z" />
        <path d="M12 6v12" />
        <path d="M4 6l8 4 8-4" />
      </svg>
    ),
  },
  {
    name: "smolagents",
    color: "#FFD21E",
    darkColor: "#fbbf24",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2C6.5 2 2 5.8 2 10.5c0 2 .8 3.8 2.2 5.2-.1 1.5-.7 3-.7 3s2.5-.5 4-1.5c1.4.5 2.9.8 4.5.8 5.5 0 10-3.8 10-8.5S17.5 2 12 2z" />
        <circle cx="8.5" cy="10.5" r="1.5" fill="var(--color-background)" />
        <circle cx="15.5" cy="10.5" r="1.5" fill="var(--color-background)" />
      </svg>
    ),
  },
  {
    name: "LlamaIndex",
    color: "#7C3AED",
    darkColor: "#a78bfa",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3L4 9v6l8 6 8-6V9l-8-6z" />
        <path d="M12 9v12" />
        <path d="M4 9l8 6 8-6" />
      </svg>
    ),
  },
  {
    name: "Haystack",
    color: "#00A98F",
    darkColor: "#34d399",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    name: "CAMEL-AI",
    color: "#C2841A",
    darkColor: "#fbbf24",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 18c0-2 2-3 4-3h8c2 0 4 1 4 3" />
        <path d="M8 15V8c0-2 1-4 4-5 3 1 4 3 4 5v7" />
        <circle cx="10" cy="9" r="1" fill="currentColor" />
        <circle cx="14" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "MCP",
    color: "#D97706",
    darkColor: "#fbbf24",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M17.5 14v7M14 17.5h7" />
      </svg>
    ),
  },
  {
    name: "Vercel AI SDK",
    color: "#000000",
    darkColor: "#f1f5f9",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2L2 19.5h20L12 2z" />
      </svg>
    ),
  },
];

export function FrameworkLogos() {
  return (
    <div className="framework-logos">
      {frameworks.map(fw => (
        <div
          key={fw.name}
          className="framework-logo-badge"
          style={{
            '--fw-color': fw.color,
            '--fw-dark-color': fw.darkColor,
          } as React.CSSProperties}
        >
          <span className="framework-logo-icon">{fw.icon}</span>
          <span className="framework-logo-name">{fw.name}</span>
        </div>
      ))}
    </div>
  );
}
