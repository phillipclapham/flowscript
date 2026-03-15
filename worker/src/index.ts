/**
 * FlowScript Transcript Compiler — Cloudflare Worker
 *
 * Proxies natural language → FlowScript conversion via Claude Sonnet.
 * Rate-limited per IP, input length capped, API key server-side.
 */

interface Env {
  ANTHROPIC_API_KEY: string;
  RATE_LIMIT_MAX: string;
  RATE_LIMIT_WINDOW_SECONDS: string;
  MAX_INPUT_CHARS: string;
}

// In-memory rate limiting (resets on worker restart, good enough for demo)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max: number, windowSeconds: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a FlowScript compiler. Convert natural language into valid, parser-compliant FlowScript.

# CRITICAL SYNTAX RULES

## 1. Decisions MUST use ? with || alternatives
When someone chose between options, ALWAYS show the question and ALL options:

? which database for sessions?
  || PostgreSQL
     -> mature ecosystem
     -> team knows it
  || Redis
     -> sub-millisecond reads
     -> natural TTL for session data
     -> [decided(rationale: "speed > durability for ephemeral data", on: "2025-10-15")]

The [decided()] marker goes INSIDE the chosen alternative as a child, indented under it.
NEVER skip the ? and || structure. If they chose X over Y, show both X and Y as alternatives.

## 2. State markers go on their OWN LINE before the node they apply to
WRONG: [blocked(reason: "x", since: "2025-01-01")] the task
RIGHT:
[blocked(reason: "x", since: "2025-01-01")]
! the task that is blocked

## 3. Relationship markers
- -> Forward causation (A causes/leads to B). Indent children under parent.
- <- Reverse causation (A was caused by B). Use for root cause chains.
- => Temporal sequence (A then B, no causal link)
- ><[axis] Tension — axis label in brackets REQUIRED: speed ><[performance vs reliability] safety
- || Alternative under a ? question

## 4. Node markers
- thought: Insight, realization, or key observation
- action: Specific task to do
- ✓ Completed item
- ! Urgent/critical (prefix modifier)
- ~ Exploring/uncertain (prefix modifier)
- ++ Strong positive (prefix modifier)
- * High confidence/proven (prefix modifier)
- # Section header/comment

## 5. State markers (BOTH fields required for decided/blocked)
- [decided(rationale: "why", on: "YYYY-MM-DD")] — indented under chosen alternative or on own line
- [blocked(reason: "why", since: "YYYY-MM-DD")] — on own line before blocked node
- [exploring(focus: "what")] — fields optional
- [parking(why: "reason", until: "when")] — fields recommended

## 6. Indentation = hierarchy
Use 2-space indentation for children. Causal chains nest deeply:
thought: sessions are temporary
  -> Redis chosen for sessions
     -> deploy Redis cluster
        -> update connection pooling
           -> run load tests

# EXAMPLES

## Example 1: Decision with alternatives
Input: "We went with JWT over session cookies because we need stateless scaling, but revocation is harder"

# Authentication Strategy

? authentication approach

|| session cookies
   -> instant revocation capability
   -> requires server-side state
   -> battle-tested pattern

|| JWT tokens
   -> stateless architecture
     -> scales horizontally without shared session store
   -> revocation difficult ><[security vs scalability] token management complexity
   -> [decided(rationale: "stateless scaling outweighs revocation complexity", on: "2025-10-15")]

thought: revocation risk needs mitigation even with JWT
  -> implement token refresh rotation
  -> add emergency revocation list as safety net

action: implement token refresh rotation
action: add revocation list for emergency invalidation

## Example 2: Blocker with root cause
Input: "Deploy is blocked because staging is down. The root cause is the CI pipeline broke when we updated Node."

# Production Deploy Blocked

! deploy to production
  <- staging environment down
    <- CI pipeline broken
      <- Node.js version update incompatibility

[blocked(reason: "staging environment down due to CI pipeline failure", since: "2025-10-16")]
action: fix CI pipeline Node.js compatibility
  => validate staging recovery
    => deploy to production

thought: Node version updates should be tested in isolation before CI integration

## Example 3: Mixed meeting notes
Input: "Caching discussion. We're exploring CDN vs Redis. CDN is cheaper but stale data is a risk. Redis gives us control but costs more. Sarah finished the pooling library eval. Load tests are next."

# Caching Strategy Discussion

? caching approach for API endpoints

|| CDN edge caching
   -> lower latency via geographic distribution
   -> cheaper infrastructure
   -> stale data risk for dynamic content ><[cost vs freshness] data accuracy

|| Redis cache layer
   -> centralized cache invalidation
   -> consistent across all clients
   -> higher operational cost ><[control vs cost] infrastructure budget

~ exploring: need benchmarks before deciding

thought: stale data risk is the key differentiator — if we can solve invalidation, CDN wins on cost

action: run load tests on both approaches
  => make final caching decision

# Completed Work
✓ connection pooling library evaluated

# OUTPUT RULES

1. Output ONLY valid FlowScript — no explanations, no markdown fences, no prose around it
2. ALWAYS use ? with || when choices were made between options — this is the most important rule
3. Build DEEP causal chains with -> (show consequences 2-4 levels deep when the input supports it)
4. Use thought: for insights and observations the person expressed
5. Use <- for root cause analysis (trace backward from problem to cause)
6. Use ><[axis] for tradeoffs with meaningful axis labels
7. State markers ([blocked], [decided]) go on their own line or indented under the relevant alternative
8. Preserve the user's meaning — structure and compress it, do not invent content
9. Use today's date for state markers when no specific date is mentioned
10. Start with a # header summarizing the topic
11. Use => for temporal sequences (first A, then B)
12. Completed items get ✓ prefix
13. Pending tasks get action: prefix
14. Uncertain/exploratory items get ~ prefix`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const maxRequests = parseInt(env.RATE_LIMIT_MAX || "5");
    const windowSeconds = parseInt(env.RATE_LIMIT_WINDOW_SECONDS || "3600");

    if (!checkRateLimit(ip, maxRequests, windowSeconds)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Try again later.",
          retry_after_seconds: windowSeconds,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse input
    let body: { text: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.text || typeof body.text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'text' field" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const maxChars = parseInt(env.MAX_INPUT_CHARS || "2000");
    if (body.text.length > maxChars) {
      return new Response(
        JSON.stringify({
          error: `Input too long. Maximum ${maxChars} characters.`,
          length: body.text.length,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get today's date for state markers
    const today = new Date().toISOString().split("T")[0];

    // Call Anthropic API
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT + `\n\nToday's date: ${today}`,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [
            {
              role: "user",
              content: body.text,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "AI service error. Please try again." }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result: any = await response.json();
      const flowscript =
        result.content?.[0]?.text?.trim() || "";

      // Strip markdown fences if the model adds them despite instructions
      const cleaned = flowscript
        .replace(/^```(?:flowscript)?\n?/m, "")
        .replace(/\n?```$/m, "")
        .trim();

      return new Response(
        JSON.stringify({
          flowscript: cleaned,
          usage: {
            input_tokens: result.usage?.input_tokens,
            output_tokens: result.usage?.output_tokens,
            cache_read: result.usage?.cache_read_input_tokens,
            cache_creation: result.usage?.cache_creation_input_tokens,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      console.error("Worker error:", err);
      return new Response(
        JSON.stringify({ error: "Internal error. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};
