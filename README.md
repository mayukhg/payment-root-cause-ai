# Transaction Analytics Agent — Implementation Plan

Executable engineering plan for a payments **authorization-rate diagnosis** prototype: a synthetic transaction book, SQL metric views, and a tool-using analyst agent that answers *why* the rate moved.

This repository currently ships the **plan** as a navigable site (architecture, schema, agent loop, phases, and the Tuesday Aha scenario). The plan itself is also in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43217](http://127.0.0.1:43217).

## What this is (and is not)

The first build slice is **not** a full bank transaction system. Success is a two-minute demo:

> “Our authorization rate dropped 5% last Tuesday. What happened?”  
> → window, `GATEWAY_TIMEOUT`, named gateway, overlapping deploy, counterfactual bypass.

Relative dates are frozen: demo “today” is **2026-09-18**, so last Tuesday is **2026-09-15**.

## Next implementation

Follow phases 0–5 in the plan (seed DB → query tools → agent loop → chat UI → demo harden). Mock analyst mode is required so the Aha path does not depend on an API key.
