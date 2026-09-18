export const nav = [
  { id: "success", label: "Success" },
  { id: "architecture", label: "Architecture" },
  { id: "data", label: "Data" },
  { id: "engine", label: "Engine" },
  { id: "agent", label: "Agent" },
  { id: "demo", label: "Aha demo" },
  { id: "phases", label: "Phases" },
  { id: "stack", label: "Stack" },
  { id: "repo", label: "Repo" },
  { id: "risks", label: "Risks" },
] as const;

export const successChecks = [
  {
    title: "Drill-down, not dashboards",
    detail:
      "A high-level question (“Why did auth rate drop Tuesday?”) is attributed to a specific window, decline code, gateway, and contributing change.",
  },
  {
    title: "Grounded in executed queries",
    detail:
      "Every claim in the answer cites a tool result. The UI shows the SQL that ran. The model never answers from memory of the schema.",
  },
  {
    title: "Actionable suggestion",
    detail:
      "The agent estimates a counterfactual: if traffic is routed off the failing gateway during the window, auth rate recovers by X points.",
  },
  {
    title: "Honest uncertainty",
    detail:
      "If codes are mixed or events do not overlap the window, the agent says the data is inconclusive instead of inventing a story.",
  },
];

export const architectureLayers = [
  {
    id: "face",
    name: "Face",
    items: ["Chat transcript", "Evidence drawer (SQL + tables)", "Hourly auth sparkline"],
  },
  {
    id: "brain",
    name: "Brain",
    items: [
      "Planner prompt (senior payments analyst)",
      "Tool loop, max 6 calls",
      "Synthesizer with citation rules",
    ],
  },
  {
    id: "tools",
    name: "Tools",
    items: [
      "get_schema / get_metric",
      "run_sql (read-only)",
      "list_events",
      "estimate_counterfactual",
    ],
  },
  {
    id: "warehouse",
    name: "Warehouse",
    items: [
      "SQLite seed DB",
      "Hourly/daily metric views",
      "Decline × gateway slices",
      "External events + deploys",
    ],
  },
];

export const schemaTables = [
  {
    name: "transactions",
    purpose: "Atomic payment attempts. One row per auth request, not per settlement.",
    columns: [
      ["transaction_id", "TEXT PK", "ULID"],
      ["attempted_at", "TEXT", "ISO-8601 UTC"],
      ["amount_minor", "INTEGER", "Minor units (cents)"],
      ["currency", "TEXT", "ISO 4217, mostly USD/EUR"],
      ["status", "TEXT", "authorized | declined | error"],
      ["payment_method", "TEXT", "card | ach | wallet"],
      ["card_brand", "TEXT", "visa | mastercard | amex | null"],
      ["wallet_type", "TEXT", "apple_pay | google_pay | null"],
      ["gateway_id", "TEXT FK", "Processor that received the auth"],
      ["merchant_id", "TEXT FK", "Seller / MID"],
      ["decline_code", "TEXT", "Null on success; granular otherwise"],
      ["latency_ms", "INTEGER", "Gateway round-trip"],
      ["retry_of", "TEXT", "Parent transaction_id if retry"],
    ],
  },
  {
    name: "gateways",
    purpose: "Processor catalog so the agent can name a concrete counterparty.",
    columns: [
      ["gateway_id", "TEXT PK", "e.g. stripe_connect_eu"],
      ["display_name", "TEXT", "Human label"],
      ["region", "TEXT", "us | eu | apac"],
      ["supports_3ds", "INTEGER", "0/1"],
    ],
  },
  {
    name: "merchants",
    purpose: "Enough merchant mix to avoid “the whole book dropped” as the only story.",
    columns: [
      ["merchant_id", "TEXT PK", ""],
      ["name", "TEXT", ""],
      ["mcc", "TEXT", "Merchant category"],
      ["country", "TEXT", ""],
      ["risk_tier", "TEXT", "low | medium | high"],
    ],
  },
  {
    name: "decline_codes",
    purpose: "The “why” dictionary. Codes must be diagnostic, not a single FAILED flag.",
    columns: [
      ["code", "TEXT PK", ""],
      ["family", "TEXT", "issuer | customer | gateway | fraud | validation"],
      ["retryable", "INTEGER", "0/1"],
      ["operator_hint", "TEXT", "What a payments analyst would try next"],
    ],
  },
  {
    name: "external_events",
    purpose: "Simulated world: deploys, maintenance, competitor outages.",
    columns: [
      ["event_id", "TEXT PK", ""],
      ["started_at", "TEXT", ""],
      ["ended_at", "TEXT", "Nullable if still open"],
      ["kind", "TEXT", "deploy | maintenance | competitor_outage | issuer_advisory"],
      ["entity", "TEXT", "Gateway id, issuer, or competitor"],
      ["summary", "TEXT", "One-line operator note"],
    ],
  },
];

export const declineCodes = [
  {
    code: "DECLINE_INSUFFICIENT_FUNDS",
    family: "customer",
    note: "Baseline noise. Must stay stable in the demo so it is not the story.",
  },
  {
    code: "EXPIRY_DATE_FAILED",
    family: "validation",
    note: "Card-not-present hygiene. Low volume.",
  },
  {
    code: "ISSUER_REJECTION",
    family: "issuer",
    note: "Always present; should not jump in the demo window.",
  },
  {
    code: "GATEWAY_TIMEOUT",
    family: "gateway",
    note: "The planted root cause. Spikes only Tue 15:00–17:00 UTC on one gateway.",
  },
  {
    code: "FRAUD_VELOCITY_BLOCK",
    family: "fraud",
    note: "Confounder on other days so the agent must disambiguate.",
  },
  {
    code: "DO_NOT_HONOR",
    family: "issuer",
    note: "Generic issuer catch-all. Keep minority share.",
  },
];

export const metricViews = [
  {
    name: "v_hourly_auth_rate",
    grain: "hour × currency",
    definition:
      "authorized_count / attempt_count. Attempts include declines and errors. Auth rate is not settlement rate.",
  },
  {
    name: "v_hourly_atv",
    grain: "hour × currency",
    definition:
      "AVG(amount_minor) for authorized rows only, converted to major units in the UI.",
  },
  {
    name: "v_hourly_volume",
    grain: "hour",
    definition: "attempt_count, authorized_count, error_count, total_amount_minor.",
  },
  {
    name: "v_decline_code_hourly",
    grain: "hour × decline_code × gateway_id",
    definition:
      "Share of failed attempts. Primary drill-down after a rate drop is detected.",
  },
  {
    name: "v_gateway_hourly",
    grain: "hour × gateway_id",
    definition: "Auth rate, p95 latency_ms, timeout share. Used to pin the processor.",
  },
  {
    name: "v_method_hourly",
    grain: "hour × payment_method",
    definition: "Confirms the drop is not isolated to ACH or wallets.",
  },
];

export const tools = [
  {
    name: "get_schema",
    args: "{ table?: string }",
    returns: "DDL + column comments for one table or the full catalog.",
    rule: "Call first when unsure which grain to query.",
  },
  {
    name: "get_metric",
    args: "{ name: string }",
    returns: "Canonical definition, grain, and recommended view.",
    rule: "Auth rate, ATV, and timeout share have one definition. Do not reinvent them in SQL comments.",
  },
  {
    name: "run_sql",
    args: "{ sql: string, purpose: string }",
    returns: "JSON rows, truncated to 200. Includes row_count and elapsed_ms.",
    rule: "SELECT / WITH only. Statement timeout 2s. No PRAGMA that writes. Log purpose for the evidence drawer.",
  },
  {
    name: "list_events",
    args: "{ from: string, to: string, entity?: string }",
    returns: "external_events overlapping the window.",
    rule: "Always run after a drop window is identified. Correlation is not causation; say so.",
  },
  {
    name: "estimate_counterfactual",
    args: "{ from, to, exclude_gateway_id }",
    returns: "Observed auth rate vs rate with that gateway’s attempts removed.",
    rule: "Simple exclusion model for the POC. Label it as a projection, not a promise.",
  },
];

export const agentLoop = [
  {
    step: "1. Interpret",
    body: "Resolve relative time (“last Tuesday”) against a fixed demo clock: 2026-09-18. Extract the metric (auth rate) and the claimed delta (~5%).",
  },
  {
    step: "2. Locate",
    body: "Query v_hourly_auth_rate for that day vs the prior 14 days. Find the first hour where rate falls >3pp below the 14-day hourly baseline.",
  },
  {
    step: "3. Slice",
    body: "In the drop window, break failures by decline_code, then by gateway_id, then by payment_method. Rank by contribution to the missing authorizations.",
  },
  {
    step: "4. Correlate",
    body: "list_events for [window − 36h, window end]. Prefer deploys that mention the same gateway over generic competitor outages.",
  },
  {
    step: "5. Project",
    body: "estimate_counterfactual excluding the implicated gateway. If recovery <2pp, do not oversell the fix.",
  },
  {
    step: "6. Synthesize",
    body: "Write the operator answer: when, how much, primary code, named gateway, overlapping change, suggested next action, and what was ruled out.",
  },
];

export const systemPromptRules = [
  "You are a Senior Payment Analytics Specialist. Diagnose root causes. Do not narrate charts.",
  "Never answer a quantitative question without at least one successful run_sql or estimate_counterfactual call.",
  "Cite every number with the tool call id. If the number is not in tool output, omit it.",
  "Auth rate = authorized / all attempts for the grain. Do not silently switch to approval rate or capture rate.",
  "If two codes are within 5pp of contribution, say the data is mixed and show both.",
  "End with one recommended action and one thing you did not prove.",
];

export const demoScenario = {
  user: "Our authorization rate dropped 5% last Tuesday. What happened?",
  clock: "Demo “today” is Friday 2026-09-18. Last Tuesday is 2026-09-15.",
  planted: [
    {
      label: "Baseline",
      text: "Mon–Sun 2026-09-07…14: book-level auth rate 91.0–91.6%. GATEWAY_TIMEOUT is ~0.4% of attempts.",
    },
    {
      label: "Change",
      text: "Monday 2026-09-14 18:40 UTC deploy gw-timeout-retry-v2 on stripe_connect_eu (“increase acquire timeout, collapse retries”).",
    },
    {
      label: "Incident",
      text: "Tuesday 15:00–17:00 UTC: stripe_connect_eu p95 latency 210ms → 2.4s. GATEWAY_TIMEOUT share 0.4% → 6.1% of book attempts. Auth rate 91.2% → 86.1% (−5.1pp).",
    },
    {
      label: "Ruled out",
      text: "ISSUER_REJECTION and DECLINE_INSUFFICIENT_FUNDS stay flat. ACH and wallets do not move. Competitor_Site_Downtime exists Wednesday, not Tuesday.",
    },
  ],
  expectedAnswer: `The authorization rate dipped on Tuesday 15 Sep between 15:00 and 17:00 UTC (−5.1pp vs the prior two-week hourly baseline).

The primary driver was a spike in GATEWAY_TIMEOUT on stripe_connect_eu (EU card traffic). Timeouts went from ~0.4% of attempts to 6.1% in that window, matching a p95 latency jump on that gateway only.

This lines up with deploy gw-timeout-retry-v2 (Mon 18:40 UTC) that changed acquire timeout and retry collapse on that processor. Issuer rejections and insufficient-funds rates did not move, so this is not an issuer or customer-funds story.

If we had failed closed away from stripe_connect_eu during those two hours, book auth rate is projected around 90.4% (recovery of ~4.3pp). Next step: roll back or bypass that gateway for EU card auths and watch timeout share for 60 minutes.`,
};

export const phases = [
  {
    id: "p0",
    name: "Phase 0 — Contract the slice",
    goal: "Freeze one demo path. Everything else is out of scope until that path is crisp.",
    tasks: [
      "Write the golden question, expected SQL sequence, and expected final paragraph in tests/fixtures/aha.json.",
      "Fix the demo clock to 2026-09-18 so “last Tuesday” is deterministic.",
      "List five questions the prototype will refuse or answer with “not in this slice” (settlement, chargebacks, real bank files).",
    ],
    files: [
      "docs/demo-script.md",
      "tests/fixtures/aha.json",
      "src/lib/analytics/clock.ts",
    ],
    done: "A new engineer can run the demo without improvising the story.",
  },
  {
    id: "p1",
    name: "Phase 1 — Synthetic book",
    goal: "A realistic transaction log with a planted incident, not random amounts.",
    tasks: [
      "Implement DDL for the five tables and six views.",
      "Seed 14 days of hourly traffic (~80k–150k attempts) with diurnal volume, mix of methods, three gateways, 40 merchants.",
      "Inject the Tuesday timeout spike only on stripe_connect_eu 15:00–17:00, plus the Monday deploy event.",
      "Add confounders: issuer advisory on Thursday, competitor outage on Wednesday, fraud velocity blip on Saturday.",
      "Golden tests: Tuesday drop is 4.8–5.5pp; timeout contribution is the top driver; ISSUER_REJECTION delta < 0.5pp.",
    ],
    files: [
      "scripts/seed.ts",
      "src/db/schema.sql",
      "src/db/views.sql",
      "data/payments.db (generated, gitignored)",
      "tests/seed-invariants.test.ts",
    ],
    done: "Re-running the seed produces the same incident within invariant bounds (seeded RNG).",
  },
  {
    id: "p2",
    name: "Phase 2 — Query layer",
    goal: "Fast, boring, read-only access the agent cannot escape.",
    tasks: [
      "Open SQLite in read-only mode for the API process.",
      "Implement run_sql with allowlist (SELECT/WITH), 2s timeout, 200-row cap, no file writes.",
      "Expose get_schema and get_metric from a static catalog, not information_schema guessing.",
      "Implement list_events and estimate_counterfactual as parameterized queries, not free SQL.",
      "Log every tool call: sql, purpose, row_count, ms.",
    ],
    files: [
      "src/lib/db/client.ts",
      "src/lib/tools/run-sql.ts",
      "src/lib/tools/events.ts",
      "src/lib/tools/counterfactual.ts",
      "src/lib/tools/catalog.ts",
    ],
    done: "Integration tests: DROP TABLE is rejected; aha SQL fixture returns the planted numbers.",
  },
  {
    id: "p3",
    name: "Phase 3 — Agent loop",
    goal: "Plan → tools → synthesis. The model is not a search box.",
    tasks: [
      "POST /api/analyze with the system prompt, tool schemas, and max 6 iterations.",
      "Stop when the model returns a final answer object { narrative, window, primary_cause, ruled_out, action, citations[] }.",
      "If the model tries to finish with zero tools, inject a reminder and force get_schema.",
      "Offline path: ANALYST_MODE=mock replays the golden tool trace so the demo never depends on an API key.",
      "Eval: 8 paraphrases of the golden question must recover GATEWAY_TIMEOUT + stripe_connect_eu.",
    ],
    files: [
      "src/app/api/analyze/route.ts",
      "src/lib/agent/loop.ts",
      "src/lib/agent/prompt.ts",
      "src/lib/agent/mock.ts",
      "evals/aha.eval.ts",
    ],
    done: "Mock mode is deterministic. Live mode matches the same cause on the golden prompt.",
  },
  {
    id: "p4",
    name: "Phase 4 — Face + evidence",
    goal: "The Aha moment is visible: question, working, cited answer.",
    tasks: [
      "Chat UI with one suggested prompt prefilled: the golden question.",
      "While running, stream plan steps (“locating drop”, “slicing declines”).",
      "Evidence drawer: each SQL + first 20 rows + link into the narrative citations.",
      "Empty, loading, and error states (tool timeout, LLM down → offer mock replay).",
      "Mobile: stacked chat / evidence tabs. Desktop: split pane.",
    ],
    files: [
      "src/app/page.tsx",
      "src/components/chat/transcript.tsx",
      "src/components/chat/evidence.tsx",
      "src/components/chat/sparkline.tsx",
    ],
    done: "A reviewer can follow the Tuesday story in under two minutes without reading this plan.",
  },
  {
    id: "p5",
    name: "Phase 5 — Harden the demo",
    goal: "Sell the slice, not a platform.",
    tasks: [
      "Script a 90-second walkthrough: question → evidence → action.",
      "Add two negative questions: “Why did we lose settlement on Friday?” and “Who is our riskiest merchant?” — expect a bounded refusal or a shallow but cited answer.",
      "README: how to seed, how to run mock vs live LLM, how to reset the DB.",
    ],
    files: ["README.md", "docs/demo-script.md"],
    done: "Demo runs twice in a row on a cold machine with mock mode.",
  },
];

export const stack = [
  {
    choice: "Next.js + TypeScript (App Router)",
    why: "One repo for the chat face, the /api/analyze loop, and static metric docs. No extra service until the slice is sold.",
  },
  {
    choice: "SQLite (read-only at runtime)",
    why: "Warehouse semantics without ops. Views give BI grains. Swap to Postgres later without changing tool names.",
  },
  {
    choice: "Guarded SQL tool + named tools",
    why: "Free SQL for exploration; parameterized tools for events and counterfactuals so the model cannot quietly change metric definitions.",
  },
  {
    choice: "OpenAI-compatible LLM + mock replay",
    why: "Live intelligence when a key exists; deterministic Aha demo when it does not. Never block the artifact on credentials.",
  },
  {
    choice: "No RAG corpus of PDFs",
    why: "Retrieval is query results and the metric catalog. Documents would fake grounding. Schema comments are the knowledge base.",
  },
  {
    choice: "No auth, no real processors",
    why: "The proof is diagnosis quality, not SSO or Stripe live keys.",
  },
];

export const repoTree = `src/
  app/
    page.tsx                 # chat + evidence
    api/analyze/route.ts     # agent loop
  lib/
    analytics/clock.ts       # frozen demo "now"
    agent/{loop,prompt,mock}.ts
    db/client.ts
    tools/{run-sql,events,counterfactual,catalog}.ts
  db/
    schema.sql
    views.sql
scripts/seed.ts
evals/aha.eval.ts
tests/fixtures/aha.json
data/payments.db             # generated
`;

export const pitfalls = [
  {
    pitfall: "Generic faker transactions with status = fail",
    instead: "Plant a single-gateway timeout incident and keep other decline families flat.",
  },
  {
    pitfall: "LLM answers from the system prompt’s example",
    instead: "Golden evals + force-tool-use. Evidence drawer makes cheating obvious.",
  },
  {
    pitfall: "Snowflake / Kafka / full lakehouse in week one",
    instead: "SQLite views with the same metric names you would use in a warehouse.",
  },
  {
    pitfall: "Agent as a text-to-SQL novelty",
    instead: "Require locate → slice → correlate → project. SQL is a tool, not the product.",
  },
  {
    pitfall: "Trying to cover chargebacks, 3DS, and FX in the first demo",
    instead: "One question, one window, one gateway, one recommended bypass.",
  },
  {
    pitfall: "Auth rate defined three different ways in three queries",
    instead: "get_metric is canonical. Views encode the definition.",
  },
];

export const checklist = [
  {
    component: "Data",
    deliverable: "Seeded book with granular decline codes, gateways, and events.",
    goal: "Show you understand why payments fail.",
    avoid: "Random amounts and a boolean failed flag.",
  },
  {
    component: "Engine",
    deliverable: "Read-only SQL + metric views + named analytical tools.",
    goal: "Connect an LLM to real aggregation, not to a CSV in the prompt.",
    avoid: "Dumping the day’s rows into context.",
  },
  {
    component: "AI layer",
    deliverable: "Planner loop with citations and a mock replay.",
    goal: "Self-checking analyst, not a search filter.",
    avoid: "Single-shot “write some SQL” with no plan.",
  },
  {
    component: "Demo",
    deliverable: "Tuesday −5% → GATEWAY_TIMEOUT on stripe_connect_eu → bypass projection.",
    goal: "Undeniable Aha in two minutes.",
    avoid: "A feature tour of everything the stack could do.",
  },
];
