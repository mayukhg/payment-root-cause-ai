"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GOLDEN_QUESTION,
  suggestedPrompts,
  type AnalyzeResult,
  type ToolCall,
} from "@/lib/demo";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Database,
  LoaderCircle,
  Send,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";

type ChatTurn =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; result: AnalyzeResult; status: "ok" }
  | { id: string; role: "assistant"; status: "error"; text: string };

function Sparkline({
  series,
}: {
  series: AnalyzeResult["hourly"];
}) {
  if (series.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hourly series for this answer.
      </p>
    );
  }
  const w = 560;
  const h = 140;
  const pad = 12;
  const ys = series.flatMap((p) => [p.authRate, p.baseline]);
  const min = Math.min(...ys) - 1;
  const max = Math.max(...ys) + 1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (series.length - 1);
  const y = (v: number) => pad + ((max - v) * (h - pad * 2)) / (max - min);
  const path = (key: "authRate" | "baseline") =>
    series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[key])}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full" role="img" aria-label="Hourly authorization rate versus baseline">
        <path d={path("baseline")} fill="none" stroke="oklch(0.65 0 0)" strokeWidth="2" strokeDasharray="4 4" />
        <path d={path("authRate")} fill="none" stroke="oklch(0.78 0.15 165)" strokeWidth="2.5" />
        {series.map((p, i) =>
          p.authRate < p.baseline - 3 ? (
            <circle key={p.hour} cx={x(i)} cy={y(p.authRate)} r="4" fill="oklch(0.72 0.18 25)" />
          ) : null
        )}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        {series.filter((_, i) => i % 2 === 0).map((p) => (
          <span key={p.hour}>{p.hour}</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Solid: Tuesday auth rate. Dashed: 14-day hourly baseline. Red dots: hours more than 3pp below baseline.
      </p>
    </div>
  );
}

function ResultTable({ rows }: { rows: ToolCall["rows"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No rows returned.</p>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <table className="w-full min-w-[20rem] text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-2 py-1.5 font-medium font-mono">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border/70">
              {cols.map((c) => (
                <td key={c} className="px-2 py-1.5 font-mono">
                  {String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Evidence({ result }: { result: AnalyzeResult | null }) {
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <Database className="size-8 text-emerald-400/80" />
        <p className="text-sm font-medium">Evidence drawer</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Queries appear here after the analyst runs. Nothing is cited unless a tool returned it.
        </p>
      </div>
    );
  }

  if (result.tools.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <AlertTriangle className="size-8 text-amber-400" />
        <p className="text-sm font-medium">No SQL in this turn</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {result.narrative}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/80 px-4 py-3">
        <p className="font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
          Evidence
        </p>
        <p className="text-sm text-muted-foreground">
          {result.tools.length} tool calls · citations {result.citations.join(", ")}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {result.hourly.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-medium">Hourly auth rate</h3>
            <Sparkline series={result.hourly} />
          </div>
        ) : null}
        {result.tools.map((tool) => (
          <div key={tool.id} className="rounded-xl bg-card/60 p-3 ring-1 ring-foreground/10">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {tool.id}
              </Badge>
              <span className="font-mono text-xs">{tool.name}</span>
              <span className="text-xs text-muted-foreground">{tool.elapsedMs}ms</span>
            </div>
            <p className="mb-2 text-sm">{tool.purpose}</p>
            {tool.sql ? (
              <pre className="mb-3 overflow-x-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] leading-relaxed text-emerald-100/90">
                {tool.sql}
              </pre>
            ) : null}
            <ResultTable rows={tool.rows} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AssistantBody({ result }: { result: AnalyzeResult }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">{result.headline}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {result.narrative}
        </p>
      </div>
      {result.window ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-2">
            <dt className="text-xs text-muted-foreground">Window</dt>
            <dd className="font-mono text-xs">{result.window}</dd>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <dt className="text-xs text-muted-foreground">Primary cause</dt>
            <dd className="font-mono text-xs">{result.primaryCause}</dd>
          </div>
        </dl>
      ) : null}
      {result.ruledOut && result.ruledOut.length > 0 ? (
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Ruled out
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {result.ruledOut.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.action ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <span className="font-medium text-emerald-300">Action. </span>
          {result.action}
        </p>
      ) : null}
      {result.notProven ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Not proven. </span>
          {result.notProven}
        </p>
      ) : null}
      {result.steps.length > 0 ? (
        <ol className="space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {result.steps.map((step, i) => (
            <li key={step}>
              {i + 1}. {step}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function AnalystApp() {
  const [input, setInput] = useState(GOLDEN_QUESTION);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pane, setPane] = useState<"chat" | "evidence">("chat");
  const listRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  function nextId(prefix: string) {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  const latestResult = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.role === "assistant" && t.status === "ok") return t.result;
    }
    return null;
  }, [turns]);

  async function runQuestion(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    setPane("chat");
    const userTurn: ChatTurn = {
      id: nextId("u"),
      role: "user",
      text,
    };
    setTurns((prev) => [...prev, userTurn]);
    setInput("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) throw new Error(`Analyze failed (${res.status})`);
      const result = (await res.json()) as AnalyzeResult;
      setTurns((prev) => [
        ...prev,
        { id: nextId("a"), role: "assistant", status: "ok", result },
      ]);
      if (result.tools.length > 0) setPane("evidence");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Analyze failed";
      setError(message);
      setTurns((prev) => [
        ...prev,
        {
          id: nextId("e"),
          role: "assistant",
          status: "error",
          text: "The analyst could not finish this turn. Check the API and retry.",
        },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runQuestion(input);
  }

  const chat = (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {turns.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-start gap-4 py-10">
            <Activity className="size-9 text-emerald-400" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Diagnose why authorization rate moved
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sample UI for Payment Root Cause AI. The analyst plans, runs read-only
                SQL against a synthetic book, then cites the result. Demo clock is
                Friday 18 Sep 2026.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void runQuestion(prompt)}
                  className="rounded-xl border border-border/80 bg-card/50 px-3 py-2 text-left text-sm hover:bg-muted/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm",
                  turn.role === "user"
                    ? "ml-8 bg-emerald-500/15"
                    : "mr-4 bg-card ring-1 ring-foreground/10"
                )}
              >
                {turn.role === "user" ? (
                  <p>{turn.text}</p>
                ) : turn.status === "error" ? (
                  <p className="text-destructive">{turn.text}</p>
                ) : (
                  <AssistantBody result={turn.result} />
                )}
              </div>
            ))}
            {busy ? (
              <div className="mr-4 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/10">
                <LoaderCircle className="size-4 animate-spin" />
                Planning, then querying metric views…
              </div>
            ) : null}
          </div>
        )}
      </div>
      <form
        onSubmit={onSubmit}
        className="border-t border-border/80 p-3 sm:p-4"
      >
        {error ? (
          <p className="mb-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Ask why auth rate moved…"
            className="min-h-16 flex-1 resize-none rounded-xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !input.trim()} size="lg" className="bg-emerald-500 text-black hover:bg-emerald-400">
            <Send />
            Run
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-6">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
            Sample UI · mock analyst
          </p>
          <h1 className="text-sm font-semibold sm:text-base">
            Payment Root Cause AI
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Clock 2026-09-18</Badge>
          <Link
            href="/plan"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Implementation plan
            <ArrowUpRight />
          </Link>
        </div>
      </header>

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <section className="min-h-0 border-r border-border/80">{chat}</section>
        <aside className="min-h-0 bg-black/20">
          <Evidence result={latestResult} />
        </aside>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <Tabs
          value={pane}
          onValueChange={(v) => {
            if (v === "chat" || v === "evidence") setPane(v);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-3 mt-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
            {chat}
          </TabsContent>
          <TabsContent value="evidence" className="min-h-0 flex-1 overflow-hidden">
            <Evidence result={latestResult} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
