# Payment Root Cause AI

This repository exists to turn **payment authorization failures into an explainable, query-backed diagnosis** — not more dashboards, and not generic LLM advice.

When authorization rate drops, operators usually see a chart. This project’s purpose is to answer **why**: which hours, which decline codes, which gateway, and what to try next, with every number grounded in data that was actually queried.

## The problem

Payments teams already understand the domain. What they lack is a **demonstrable artifact** that:

1. Takes a high-level question (“Auth rate dropped 5% last Tuesday. What happened?”).
2. Plans an investigation instead of guessing.
3. Runs SQL against a realistic transaction book (decline codes, gateways, deploys, outages).
4. Returns a root cause and a projected fix, or says the evidence is mixed.

If the model answers without running queries, it has failed the purpose of this repo.

## What this repo is

**A blueprint and the first slice of a Transaction Analytics Agent** for payment **auth-rate root cause analysis**.

| Now | Next (see the plan) |
| --- | --- |
| The executable implementation plan: schema, tools, agent loop, demo scenario | Seeded payments DB, read-only SQL tools, planner agent, chat + evidence UI |

The plan is written to be built, not discussed: frozen demo clock, planted incident, metric definitions, tool contracts, and a phased file list.

Read the full engineering plan in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md). Browse it as a site with `npm run dev`.

## What this repo is not

- Not a bank or processor. There are no live Stripe/Adyen keys and no real cardholder data.
- Not a settlement, chargeback, or fraud platform.
- Not a text-to-SQL toy. SQL is a tool; the product is **diagnosis**.

## The proof we are aiming at

A two-minute path, not a feature tour:

> “Our authorization rate dropped 5% last Tuesday. What happened?”

Expected class of answer:

- **When:** Tuesday 15 Sep 2026, 15:00–17:00 UTC (~5pp drop).
- **Why:** spike in `GATEWAY_TIMEOUT` on a named gateway (`stripe_connect_eu`).
- **Context:** overlapping deploy that touched that gateway.
- **Not this:** issuer rejections and insufficient funds stay flat.
- **Next:** bypass or roll back that gateway; projected recovery of ~4pp.

Relative dates are frozen so the demo does not drift: “today” is **2026-09-18**, so last Tuesday is **2026-09-15**.

## How the agent is supposed to work

```
Question → plan (locate drop → slice decline codes → correlate events → project bypass)
        → tools (read-only SQL + named metrics)
        → cited narrative
```

The LLM never writes to the database. Retrieval means **query results and metric definitions**, not a pile of PDFs.

## Run the plan site

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43217](http://127.0.0.1:43217).

## Build sequence (when implementing)

1. Lock the golden question and fixtures.
2. Seed a realistic book with granular decline codes and one planted incident.
3. Expose a guarded, read-only query layer.
4. Run a planner loop with forced tool use and a mock replay (no API key required for the demo).
5. Ship chat + evidence (the SQL that ran).
6. Harden a 90-second walkthrough.

Details, schema, and pitfalls: [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).
