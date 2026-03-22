/**
 * FlowScript Getting Started Page
 * Decision tree for which package to use, quickstart for each path.
 */

import { Link } from "react-router-dom";
import "./GetStarted.css";

export function GetStarted() {
  return (
    <div className="page get-started-page">
      <h1 className="gs-hero-title">Get Started</h1>
      <p className="gs-hero-subtitle">
        Three paths into FlowScript. Pick the one that fits how you work.
      </p>

      {/* Decision Tree */}
      <section className="gs-section">
        <h2>Which package do I need?</h2>
        <div className="decision-tree">
          <div className="decision-card decision-card--primary">
            <div className="decision-header">
              <h3>MCP Server</h3>
              <span className="decision-tag">Easiest start</span>
            </div>
            <p className="decision-who">
              You use Claude Code, Cursor, or another MCP-compatible editor and want reasoning memory with zero code changes.
            </p>
            <div className="code-block decision-install">npm install -g flowscript-core</div>
            <p className="decision-result">15 reasoning tools. Local persistence. Your agent builds the graph through normal tool calls.</p>
          </div>

          <div className="decision-card">
            <div className="decision-header">
              <h3>TypeScript SDK</h3>
              <span className="decision-tag">Full control</span>
            </div>
            <p className="decision-who">
              You're building a TypeScript/JavaScript application and want to programmatically construct and query reasoning graphs.
            </p>
            <div className="code-block decision-install">npm install flowscript-core</div>
            <p className="decision-result">Memory class, 15 agent tools (OpenAI format), audit trail, token budgeting, 4 budget strategies.</p>
          </div>

          <div className="decision-card">
            <div className="decision-header">
              <h3>Python Agent Adapters</h3>
              <span className="decision-tag">Framework integration</span>
            </div>
            <p className="decision-who">
              You use LangGraph, CrewAI, Google ADK, OpenAI Agents, or other Python agent frameworks and want drop-in reasoning memory.
            </p>
            <div className="code-block decision-install">pip install flowscript-agents[langgraph]</div>
            <p className="decision-result">9 framework adapters, auto-extraction, consolidation, vector search, audit trail.</p>
          </div>
        </div>
      </section>

      {/* MCP Quickstart */}
      <section className="gs-section" id="mcp">
        <h2>MCP Server Setup</h2>
        <p>
          The fastest path. Install globally, add to your editor config, restart. Your agent gets 15 reasoning tools immediately.
        </p>

        <h3>1. Install</h3>
        <div className="code-block">npm install -g flowscript-core</div>

        <h3>2. Configure your editor</h3>
        <p>
          Add to your MCP settings (<code>.claude/settings.json</code> for Claude Code, or your editor's MCP config):
        </p>
        <div className="code-block">
{`{
  "mcpServers": {
    "flowscript": {
      "command": "flowscript-mcp",
      "args": ["./project-memory.json"]
    }
  }
}`}
        </div>

        <h3>3. Restart your editor</h3>
        <p>
          Your agent now has 15 reasoning tools: <code>add_thought</code>, <code>add_question</code>,{" "}
          <code>add_alternative</code>, <code>decide</code>, <code>block</code>, <code>add_tension</code>,{" "}
          <code>query_tensions</code>, <code>query_blocked</code>, <code>query_why</code>,{" "}
          <code>query_what_if</code>, <code>query_alternatives</code>, and more.
        </p>

        <h3>4. (Optional) Add a CLAUDE.md snippet</h3>
        <p>
          Copy{" "}
          <a href="https://github.com/phillipclapham/flowscript/blob/main/examples/CLAUDE.md.snippet" target="_blank" rel="noopener noreferrer">
            this CLAUDE.md snippet
          </a>{" "}
          into your project to tell the agent when to record decisions, tensions, and blockers automatically.
          Already using CLAUDE.md? Keep it. CLAUDE.md is the cheat sheet, FlowScript is the working memory.
        </p>

        <div className="quickstart-note">
          <strong>Want auto-extraction from plain text?</strong> The{" "}
          <a href="https://github.com/phillipclapham/flowscript-agents" target="_blank" rel="noopener noreferrer">Python MCP server</a>{" "}
          auto-detects your API key and configures vector search, typed extraction, and contradiction handling.
          Same reasoning queries, automatic graph construction.
        </div>
      </section>

      {/* TypeScript SDK Quickstart */}
      <section className="gs-section" id="typescript">
        <h2>TypeScript SDK Quickstart</h2>
        <p>Full programmatic control over the reasoning graph.</p>

        <h3>1. Install</h3>
        <div className="code-block">npm install flowscript-core</div>

        <h3>2. Create a memory and build reasoning</h3>
        <div className="code-block">
{`import { Memory } from 'flowscript-core';

const mem = Memory.loadOrCreate('./agent-memory.json');

// Build the reasoning graph through typed API
const q = mem.question("Which database for agent memory?");
mem.alternative(q, "Redis").decide({ rationale: "speed critical" });
mem.alternative(q, "SQLite").block({ reason: "no concurrent writes" });
mem.tension(
  mem.thought("sub-ms reads"),
  mem.thought("$200/mo cluster"),
  "performance vs cost"
);`}
        </div>

        <h3>3. Query the reasoning</h3>
        <div className="code-block">
{`// Five typed queries over your reasoning graph
mem.query.tensions();            // tradeoffs with named axes
mem.query.blocked();             // what's stuck + downstream
mem.query.why(nodeId);           // causal chain backward
mem.query.whatIf(nodeId);        // impact chain forward
mem.query.alternatives(nodeId);  // what was considered

// Human-readable view of the full graph
console.log(mem.toFlowScript());`}
        </div>

        <h3>4. Use with LLM agents</h3>
        <div className="code-block">
{`// Generate 15 tools in OpenAI function calling format
const tools = mem.asTools();
// → pass to OpenAI, Anthropic, or any function-calling LLM

// Session lifecycle
const orientation = mem.sessionStart({ maxTokens: 4000 });
// ... agent works, building the graph ...
const wrap = mem.sessionWrap(); // prune dormant → audit trail, save`}
        </div>

        <p>
          Full API reference:{" "}
          <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer">
            flowscript-core on GitHub
          </a>
        </p>
      </section>

      {/* Python Quickstart */}
      <section className="gs-section" id="python">
        <h2>Python Agent Framework Quickstart</h2>
        <p>Drop-in adapters for 9 frameworks. Your agent gets reasoning memory without changing how it works.</p>

        <h3>1. Install with your framework</h3>
        <div className="code-block">
{`# Pick your framework
pip install flowscript-agents[langgraph]
pip install flowscript-agents[crewai]
pip install flowscript-agents[google-adk]
pip install flowscript-agents[openai-agents]
pip install flowscript-agents[pydantic-ai]
pip install flowscript-agents[smolagents]
pip install flowscript-agents[llamaindex]
pip install flowscript-agents[haystack]
pip install flowscript-agents[camel-ai]

# Or install everything
pip install flowscript-agents[all]`}
        </div>

        <h3>2. Use with your framework</h3>
        <p>Example with LangGraph:</p>
        <div className="code-block">
{`from flowscript_agents.langgraph import FlowScriptStore

store = FlowScriptStore("./agent-memory.json")

# Use as LangGraph's BaseStore — drop-in replacement
# Your agent's reasoning is now structured, queryable,
# and graduates through temporal tiers

# Query the reasoning graph
tensions = store.search(("reasoning",), query="tensions")
blocked = store.search(("reasoning",), query="blocked")`}
        </div>

        <h3>3. Auto-extraction (optional)</h3>
        <p>
          With an LLM provider configured, the Python SDK auto-extracts typed reasoning nodes from
          plain conversation text. Contradictions automatically become tensions.
        </p>
        <div className="code-block">
{`from flowscript_agents import UnifiedMemory

memory = UnifiedMemory(
    path="./agent-memory.json",
    embedder="openai",          # or "sentence-transformers", "ollama"
    llm="openai",               # for typed extraction
    consolidation_provider="openai"  # for RELATE > DELETE
)

# Plain text in → typed reasoning graph out
await memory.add("We chose Redis for speed but the cluster costs $200/mo")
# → Automatically extracts nodes, detects tension, creates ><[performance vs cost]`}
        </div>

        <p>
          Full documentation:{" "}
          <a href="https://github.com/phillipclapham/flowscript-agents" target="_blank" rel="noopener noreferrer">
            flowscript-agents on GitHub
          </a>
        </p>
      </section>

      {/* Supported Frameworks */}
      <section className="gs-section">
        <h2>Supported frameworks</h2>
        <div className="framework-table-wrapper">
          <table className="framework-table">
            <thead>
              <tr>
                <th>Framework</th>
                <th>Install</th>
                <th>Adapter Pattern</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>LangGraph / LangChain</td>
                <td><code>pip install flowscript-agents[langgraph]</code></td>
                <td>BaseStore</td>
              </tr>
              <tr>
                <td>CrewAI</td>
                <td><code>pip install flowscript-agents[crewai]</code></td>
                <td>Storage</td>
              </tr>
              <tr>
                <td>Google ADK</td>
                <td><code>pip install flowscript-agents[google-adk]</code></td>
                <td>BaseMemoryService</td>
              </tr>
              <tr>
                <td>OpenAI Agents SDK</td>
                <td><code>pip install flowscript-agents[openai-agents]</code></td>
                <td>Tool provider</td>
              </tr>
              <tr>
                <td>Pydantic AI</td>
                <td><code>pip install flowscript-agents[pydantic-ai]</code></td>
                <td>Tool provider</td>
              </tr>
              <tr>
                <td>smolagents</td>
                <td><code>pip install flowscript-agents[smolagents]</code></td>
                <td>Tool provider</td>
              </tr>
              <tr>
                <td>LlamaIndex</td>
                <td><code>pip install flowscript-agents[llamaindex]</code></td>
                <td>MemoryBlock</td>
              </tr>
              <tr>
                <td>Haystack</td>
                <td><code>pip install flowscript-agents[haystack]</code></td>
                <td>MemoryStore</td>
              </tr>
              <tr>
                <td>CAMEL-AI</td>
                <td><code>pip install flowscript-agents[camel-ai]</code></td>
                <td>AgentMemory</td>
              </tr>
              <tr>
                <td>Vercel AI SDK</td>
                <td><code>npm install flowscript-core</code></td>
                <td>CoreTool provider</td>
              </tr>
              <tr>
                <td>MCP (Claude Code, Cursor)</td>
                <td><code>npm install -g flowscript-core</code></td>
                <td>MCP Server</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="gs-section gs-cta">
        <h2>Explore further</h2>
        <div className="gs-links">
          <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer" className="gs-link-card">
            <h3>flowscript-core</h3>
            <p>TypeScript SDK &mdash; npm package, full API, 691 tests</p>
          </a>
          <a href="https://github.com/phillipclapham/flowscript-agents" target="_blank" rel="noopener noreferrer" className="gs-link-card">
            <h3>flowscript-agents</h3>
            <p>Python SDK &mdash; 9 adapters, consolidation, 581 tests</p>
          </a>
          <Link to="/playground" className="gs-link-card">
            <h3>Playground</h3>
            <p>Interactive editor with D3 visualization and live queries</p>
          </Link>
          <Link to="/learn" className="gs-link-card">
            <h3>Learn</h3>
            <p>Concepts, queries, temporal tiers, audit trail</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
