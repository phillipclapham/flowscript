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
            <div className="code-block decision-install">pip install flowscript-agents openai</div>
            <p className="decision-result">20 reasoning tools. Auto-extraction from plain text. Contradiction handling. Your agent builds the graph through natural conversation.</p>
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
            <p className="decision-result">Memory class, 15 agent tools (OpenAI format), Vercel AI SDK adapter, audit trail, token budgeting, 4 budget strategies.</p>
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
          The fastest path. Install, add to your editor config, restart. Your agent gets 20 reasoning tools with auto-extraction and contradiction handling.
        </p>

        <h3>1. Install</h3>
        <div className="code-block">pip install flowscript-agents openai</div>
        <p>
          The <code>openai</code> package is required for extraction, consolidation, and vector search.
          Without it, <code>add_memory</code> stores raw text and <code>query_tensions</code> won't find anything.
        </p>

        <h3>2. Configure your editor</h3>

        <p><strong>Claude Code</strong> — add to <code>.claude/settings.json</code> in your project (or <code>~/.claude/settings.json</code> for global):</p>
        <div className="code-block">
{`{
  "mcpServers": {
    "flowscript": {
      "command": "flowscript-mcp",
      "args": ["--memory", "./project-memory.json"],
      "env": {
        "OPENAI_API_KEY": "your-key"
      }
    }
  }
}`}
        </div>

        <p><strong>Cursor / Windsurf / VS Code</strong> — add to <code>.mcp.json</code> in your project root:</p>
        <div className="code-block">
{`{
  "mcpServers": {
    "flowscript": {
      "type": "stdio",
      "command": "flowscript-mcp",
      "args": ["--memory", "./project-memory.json"],
      "env": {
        "OPENAI_API_KEY": "your-key"
      }
    }
  }
}`}
        </div>
        <p>
          The <code>env</code> block passes your API key to the server for auto-configuration.
          Also supports <code>ANTHROPIC_API_KEY</code> (extraction + consolidation, no vector search).
          If <code>env</code> passthrough doesn't work in your editor, export the key in your shell before launching: <code>export OPENAI_API_KEY=your-key</code>
        </p>

        <h4>Embedding providers</h4>
        <p>
          The default is OpenAI <code>text-embedding-3-small</code>. For free local embeddings, use Ollama or SentenceTransformers:
        </p>
        <div className="code-block">
{`"args": ["--memory", "./project-memory.json", "--embedder", "ollama", "--embedding-model", "nomic-embed-text"]`}
        </div>
        <p>
          You still need an LLM API key for typed extraction, even with local embeddings.
          Use <code>--llm-model</code> to change the extraction model (default: <code>gpt-4o-mini</code>).
        </p>

        <h3>3. Restart your editor</h3>
        <p>
          Your agent now has 20 reasoning tools: <code>search_memory</code>,{" "}
          <code>add_memory</code>, <code>get_context</code>,{" "}
          <code>query_tensions</code>, <code>query_blocked</code>, <code>query_why</code>,{" "}
          <code>query_what_if</code>, <code>query_alternatives</code>,{" "}
          <code>remove_memory</code>, <code>session_wrap</code>, <code>memory_stats</code>,{" "}
          <code>query_audit</code>, <code>verify_audit</code>, <code>verify_integrity</code>.
        </p>

        <h3>4. (Optional) Stream to FlowScript Cloud</h3>
        <p>
          Add one environment variable to stream audit events to{" "}
          <a href="https://api.flowscript.org" target="_blank" rel="noopener noreferrer">FlowScript Cloud</a>{" "}
          for independent cryptographic witnessing:
        </p>
        <div className="code-block">
{`"env": {
  "OPENAI_API_KEY": "your-key",
  "FLOWSCRIPT_API_KEY": "your-cloud-key"
}`}
        </div>
        <p>
          Every audit event &mdash; including convergence certificates &mdash; streams automatically.
          Chain verification and witness attestation happen server-side. Your local audit trail remains
          the source of truth.
        </p>

        <h3>5. Add the CLAUDE.md snippet</h3>
        <p>
          This is what turns tools into a workflow. Copy the{" "}
          <a href="https://github.com/phillipclapham/flowscript-agents/blob/main/examples/CLAUDE.md.example" target="_blank" rel="noopener noreferrer">
            CLAUDE.md snippet
          </a>{" "}
          into your project's CLAUDE.md. It tells your agent <em>when</em> to record decisions, surface tensions before new decisions, and check blockers at session start, automatically, without you asking. Without it, the tools are available but passive. With it, your agent proactively tracks your project's reasoning.
        </p>

        <h3>6. Try it: your first 5 minutes</h3>
        <p>With the MCP server and CLAUDE.md snippet configured above, start a conversation with your agent:</p>
        <div className="code-block">
{`"I need to decide between PostgreSQL and MongoDB for our user data.
We need ACID compliance for payments but flexibility for user profiles."`}
        </div>
        <p>
          Your agent stores the decision context automatically. Now introduce a contradiction:
        </p>
        <div className="code-block">
{`"Actually, I've been reading about DynamoDB. The scale
requirements might matter more than I thought."`}
        </div>
        <p>Now ask:</p>
        <div className="code-block">
{`"What tensions do we have in our architecture decisions?"`}
        </div>
        <p>
          FlowScript preserved both perspectives (PostgreSQL's ACID compliance vs DynamoDB's
          scalability) as a queryable tension instead of deleting the first decision.
          That's what <strong>RELATE &gt; DELETE</strong> means in practice.
        </p>
        <p>
          After a few sessions, try <code>"What's blocking our progress?"</code> or{" "}
          <code>"Why did we choose PostgreSQL originally?"</code>. Your agent can trace the full
          reasoning chain. After 20 sessions, you have a curated knowledge base of your project's
          decisions, not a pile of notes.
        </p>

        <div className="quickstart-note">
          <strong>Want fine-grained programmatic control?</strong> The{" "}
          <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer">TypeScript SDK</a>{" "}
          (<code>npm install flowscript-core</code>) provides 15 builder tools via <code>asTools()</code> for constructing
          reasoning graphs directly in your code: <code>add_thought</code>, <code>decide</code>, <code>add_tension</code>, and more.
          Same query engine, manual graph construction.
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

        <h3>5. Vercel AI SDK</h3>
        <p>
          Building with the Vercel AI SDK? Use <code>flowscript-core/vercel</code> for
          tool definitions that wrap directly with <code>tool()</code> + <code>jsonSchema()</code>:
        </p>
        <div className="code-block">
{`import { toVercelTools } from 'flowscript-core/vercel';

const fsTools = toVercelTools(mem);
const tools = Object.fromEntries(
  Object.entries(fsTools).map(([name, def]) => [
    name,
    tool({ description: def.description, inputSchema: jsonSchema(def.parameters), execute: def.execute }),
  ])
);`}
        </div>
        <p>
          5 tools (store, recall, tensions, blocked, context) plus a <code>getFlowScriptContext()</code> helper
          for system prompt injection. No <code>ai</code> dependency required — you bring your own.
        </p>

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

with FlowScriptStore("./agent-memory.json") as store:
    # Standard LangGraph BaseStore operations
    store.put(("agents", "planner"), "db_decision",
              {"value": "chose Redis for speed"})
    items = store.search(("agents", "planner"), query="Redis")

    # What's new: typed reasoning queries on the same data
    tensions = store.memory.query.tensions()
    blockers = store.memory.query.blocked()`}
        </div>

        <h3>3. Auto-extraction (optional)</h3>
        <p>
          With an LLM provider configured, the Python SDK auto-extracts typed reasoning nodes from
          plain conversation text. Contradictions automatically become tensions.
        </p>
        <div className="code-block">
{`from openai import OpenAI
from flowscript_agents import UnifiedMemory
from flowscript_agents.embeddings import OpenAIEmbeddings

client = OpenAI()
llm = lambda prompt: (client.chat.completions.create(
    model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
).choices[0].message.content or "")

with UnifiedMemory("agent-memory.json", embedder=OpenAIEmbeddings(), llm=llm) as mem:
    mem.add("We chose Redis for speed but the cluster costs $200/mo")
    # Automatically extracts typed nodes, detects the cost contradiction,
    # and creates a queryable tension`}
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
                <td><code>pip install flowscript-agents openai</code></td>
                <td>MCP Server (auto-extraction)</td>
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
            <p>TypeScript SDK &mdash; npm package, full API, 779 tests</p>
          </a>
          <a href="https://github.com/phillipclapham/flowscript-agents" target="_blank" rel="noopener noreferrer" className="gs-link-card">
            <h3>flowscript-agents</h3>
            <p>Python SDK &mdash; 9 adapters, CloudClient, 717 tests</p>
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
