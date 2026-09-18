# Transaction Analytics Agent — Implementation Plan

This document converts the product blueprint into an executable engineering slice. The prototype is not a bank payments platform. It is a **sellable diagnostic artifact**: a tool-using analyst that answers *why* authorization rate moved, with every number grounded in SQL that actually ran.

**Demo clock (frozen):** “today” is **Friday 2026-09-18**. “Last Tuesday” is always **2026-09-15**.

---

## 1. Success criteria

The artifact is successful when all four are true in a live (or mock-replay) session:

1. **Drill-down.** A vague question (“Why did auth rate drop Tuesday?”) is attributed to a window, a decline code, a gateway, and a contributing change.
2. **Grounding.** The UI shows the queries. Claims cite tool-call ids. The model does not answer from schema memory.
3. **Suggestion.** A counterfactual estimates recovery if the failing gateway is excluded from the window.
4. **Honesty.** Mixed or non-overlapping evidence is reported as inconclusive.

Out of scope until the Tuesday story is crisp: settlement, chargebacks, FX conversion, live processor APIs, SSO, multi-tenant auth.

---

## 2. Architecture

```
UI (chat + evidence drawer)
        │  POST /api/analyze
        ▼
Agent loop (plan → tools ≤ 6 → synthesize)
        │  get_schema | get_metric | run_sql | list_events | estimate_counterfactual
        ▼
Read-only SQLite  +  metric views  +  external_events
```

**RAG in this system** is retrieved query results and the metric catalog, not a PDF corpus. Schema comments and `get_metric` are the knowledge base.

The LLM never holds a writable DB handle.

---

## 3. Data foundation

### 3.1 Tables

| Table | Role |
|---|---|
| `transactions` | One row per **auth attempt** (`authorized` / `declined` / `error`). |
| `gateways` | Named processors (`stripe_connect_eu`, plus two controls). |
| `merchants` | Mix of MCCs and risk tiers so “the whole book” is not the only story. |
| `decline_codes` | Diagnostic dictionary with family + operator hint. |
| `external_events` | Deploys, maintenance, competitor outages, issuer advisories. |

**`transactions` columns:** `transaction_id`, `attempted_at` (UTC ISO), `amount_minor`, `currency`, `status`, `payment_method` (`card` / `ach` / `wallet`), `card_brand`, `wallet_type`, `gateway_id`, `merchant_id`, `decline_code`, `latency_ms`, `retry_of`.

### 3.2 Decline codes (do not collapse to `failed`)

| Code | Family | Role in the demo |
|---|---|---|
| `DECLINE_INSUFFICIENT_FUNDS` | customer | Baseline; must stay flat. |
| `EXPIRY_DATE_FAILED` | validation | Low-volume noise. |
| `ISSUER_REJECTION` | issuer | Always present; must **not** jump in the window. |
| `GATEWAY_TIMEOUT` | gateway | **Planted cause.** Spike only Tue 15:00–17:00 UTC on one gateway. |
| `FRAUD_VELOCITY_BLOCK` | fraud | Confounder on another day. |
| `DO_NOT_HONOR` | issuer | Minority catch-all. |

### 3.3 Metric views (canonical grains)

| View | Grain | Definition |
|---|---|---|
| `v_hourly_auth_rate` | hour × currency | `authorized_count / attempt_count`. Attempts include declines and errors. Not settlement rate. |
| `v_hourly_atv` | hour × currency | Average authorized `amount_minor`. |
| `v_hourly_volume` | hour | Attempts, auths, errors, notional. |
| `v_decline_code_hourly` | hour × code × gateway | Share of failed attempts; primary drill-down. |
| `v_gateway_hourly` | hour × gateway | Auth rate, p95 latency, timeout share. |
| `v_method_hourly` | hour × method | Confirms the drop is not ACH/wallet-only. |

`get_metric` returns these definitions. The agent is forbidden from inventing a third formula for auth rate.

### 3.4 Seed invariants

Generate 14 days of diurnal traffic (~80k–150k attempts), three gateways, ~40 merchants, mixed methods.

**Planted incident**

- Mon 2026-09-14 18:40 UTC: deploy `gw-timeout-retry-v2` on `stripe_connect_eu`.
- Tue 2026-09-15 15:00–17:00 UTC: that gateway’s p95 latency 210ms → ~2.4s; `GATEWAY_TIMEOUT` share 0.4% → ~6.1% of book attempts; book auth rate 91.2% → 86.1% (**≈ −5.1pp**).
- **Ruled out:** issuer and NSF rates flat; competitor outage is Wednesday; issuer advisory is Thursday.

Seed uses a fixed RNG. Tests assert the drop is 4.8–5.5pp and timeout is the top contributor.

---

## 4. Query layer (tools)

| Tool | Arguments | Guardrails |
|---|---|---|
| `get_schema` | optional table | Static catalog + comments. |
| `get_metric` | metric name | One definition, recommended view. |
| `run_sql` | `sql`, `purpose` | `SELECT`/`WITH` only, 2s timeout, 200 rows, read-only file. |
| `list_events` | `from`, `to`, optional entity | Parameterized overlap query. |
| `estimate_counterfactual` | window + `exclude_gateway_id` | Observed rate vs rate with that gateway’s attempts removed. Label as projection. |

Log every call: SQL, purpose, row count, milliseconds. The evidence drawer is this log.

---

## 5. Agent loop

Persona: **Senior Payment Analytics Specialist.** Diagnose; do not narrate charts.

1. **Interpret** relative time against the frozen clock; extract metric and claimed delta.
2. **Locate** the first hour where auth rate is >3pp below the 14-day hourly baseline.
3. **Slice** failures by decline code, then gateway, then method; rank by missing auths.
4. **Correlate** `list_events` on `[window − 36h, window end]`. Prefer deploys that mention the same gateway.
5. **Project** `estimate_counterfactual`. If recovery <2pp, do not oversell.
6. **Synthesize** `{ narrative, window, primary_cause, ruled_out, action, citations[] }`.

**Hard rules**

- No quantitative final answer with zero successful `run_sql` / `estimate_counterfactual` calls (force `get_schema` and retry).
- Cite every number with a tool-call id.
- If two codes are within 5pp contribution, report mixed evidence.
- End with one action and one thing not proven.

**LLM:** OpenAI-compatible when `OPENAI_API_KEY` is set. **`ANALYST_MODE=mock`** replays the golden tool trace so the demo never depends on credentials.

**Eval:** eight paraphrases of the golden question must recover `GATEWAY_TIMEOUT` + `stripe_connect_eu`.

---

## 6. The Aha demo

**User:** *Our authorization rate dropped 5% last Tuesday. What happened?*

**Expected answer (substance, not exact wording):**

The authorization rate dipped on Tuesday 15 Sep between 15:00 and 17:00 UTC (−5.1pp vs the prior two-week hourly baseline). The primary driver was a spike in `GATEWAY_TIMEOUT` on **stripe_connect_eu**. Timeouts went from ~0.4% of attempts to 6.1% in that window, matching a p95 latency jump on that gateway only. This lines up with deploy `gw-timeout-retry-v2` (Mon 18:40 UTC). Issuer rejections and NSF did not move. Failing closed away from that gateway in those two hours projects book auth rate around 90.4% (~4.3pp recovery). Next step: roll back or bypass that gateway for EU card auths and watch timeout share for 60 minutes.

UI: suggested prompt prefilled; streaming plan steps; evidence drawer with SQL + first rows; empty / loading / error (LLM down → offer mock replay). Desktop split pane; mobile stacked tabs.

---

## 7. Phased build

### Phase 0 — Contract the slice

- Golden question, SQL sequence, and final paragraph in `tests/fixtures/aha.json`.
- Frozen clock module.
- Five explicit “not in this slice” questions.

**Done:** a new engineer can run the demo without improvising the story.

### Phase 1 — Synthetic book

- DDL + views; seeded 14-day book; planted spike + confounders; invariant tests.

**Done:** re-seed reproduces the incident within bounds.

### Phase 2 — Query layer

- Read-only SQLite; guarded `run_sql`; catalog; named event/counterfactual tools; tool logs.

**Done:** `DROP TABLE` rejected; aha SQL fixture returns planted numbers.

### Phase 3 — Agent loop

- `POST /api/analyze`; max 6 iterations; structured final object; mock replay; paraphrase evals.

**Done:** mock is deterministic; live mode matches cause on the golden prompt.

### Phase 4 — Face

- Chat, evidence, sparkline, states, responsive layout.

**Done:** a reviewer follows Tuesday in under two minutes.

### Phase 5 — Harden the demo

- 90-second script; two negative questions; README for seed / mock / live / reset.

**Done:** mock demo runs twice on a cold machine.

---

## 8. Stack (locked for the POC)

| Choice | Why |
|---|---|
| Next.js + TypeScript App Router | One repo for UI + agent route. |
| SQLite, read-only at runtime | Warehouse semantics, no ops. Same view names later map to Postgres. |
| Guarded SQL + named analytical tools | Exploration without letting the model redefine metrics. |
| OpenAI-compatible + mock replay | Live when keyed; sellable without credentials. |
| No PDF RAG, no auth, no live processors | Proof is diagnosis quality. |

---

## 9. Target repository layout

```
src/
  app/page.tsx
  app/api/analyze/route.ts
  lib/analytics/clock.ts
  lib/agent/{loop,prompt,mock}.ts
  lib/db/client.ts
  lib/tools/{run-sql,events,counterfactual,catalog}.ts
  db/schema.sql
  db/views.sql
scripts/seed.ts
evals/aha.eval.ts
tests/fixtures/aha.json
data/payments.db          # generated, gitignored
```

---

## 10. Pitfalls

| Avoid | Do instead |
|---|---|
| Generic faker + `failed` boolean | Plant a single-gateway timeout incident. |
| LLM parroting the system-prompt example | Evals + forced tool use + visible SQL. |
| Snowflake/Kafka in week one | SQLite views with warehouse metric names. |
| Text-to-SQL novelty | Mandatory locate → slice → correlate → project. |
| Chargebacks + 3DS + FX in v1 | One question, one window, one gateway, one bypass. |
| Three formulas for auth rate | `get_metric` + views only. |

---

## 11. Checklist

| Component | Deliverable | Goal | Pitfall |
|---|---|---|---|
| Data | Structured book with granular codes | Prove domain complexity | Generic data |
| Engine | LLM ↔ read-only query layer | AI + data engineering | Answering without queries |
| AI layer | Planner + citations + mock | Analyst, not search filter | Single-shot SQL |
| Demo | Live/mocked Tuesday “why” | Undeniable POC | Proving everything |
