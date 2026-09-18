"use client";

import { EvidencePane } from "@/components/analyst/evidence-pane";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GOLDEN_QUESTION,
  bookKpis,
  suggestedPrompts,
  type AnalyzeResult,
} from "@/lib/demo";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  LoaderCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";

type ChatTurn =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; result: AnalyzeResult; status: "ok" }
  | { id: string; role: "assistant"; status: "error"; text: string };

function AssistantBody({
  result,
  onCite,
}: {
  result: AnalyzeResult;
  onCite: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-medium tracking-tight">{result.headline}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {result.narrative}
        </p>
      </div>
      {result.window ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-2.5">
            <dt className="text-xs text-muted-foreground">Window</dt>
            <dd className="mt-0.5 font-mono text-xs">{result.window}</dd>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5">
            <dt className="text-xs text-muted-foreground">Primary cause</dt>
            <dd className="mt-0.5 font-mono text-xs">{result.primaryCause}</dd>
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
      {result.citations.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {result.citations.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onCite(id)}
              className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-emerald-300 hover:bg-muted"
            >
              {id}
            </button>
          ))}
        </div>
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
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [planStep, setPlanStep] = useState(0);
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

  function scrollChat() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  function cite(id: string) {
    setFocusedId(id);
    setPane("evidence");
    requestAnimationFrame(() => {
      document.getElementById(`tool-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function runQuestion(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    setPlanStep(0);
    setPane("chat");
    setFocusedId(null);
    setTurns((prev) => [...prev, { id: nextId("u"), role: "user", text }]);
    setInput("");
    scrollChat();

    const tick = window.setInterval(() => {
      setPlanStep((s) => Math.min(s + 1, 4));
    }, 280);

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
          text: "The analyst could not finish this turn. Retry the question.",
        },
      ]);
    } finally {
      window.clearInterval(tick);
      setBusy(false);
      scrollChat();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runQuestion(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void runQuestion(input);
    }
  }

  function reset() {
    setTurns([]);
    setError(null);
    setFocusedId(null);
    setInput(GOLDEN_QUESTION);
    setPane("chat");
  }

  const planning = [
    "Resolving relative dates…",
    "Locating the hourly drop…",
    "Slicing decline codes × gateway…",
    "Joining deploys and outages…",
    "Estimating a bypass counterfactual…",
  ];

  const chat = (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {turns.length === 0 ? (
          <div className="mx-auto flex max-w-xl flex-col gap-6 py-8">
            <div>
              <p className="font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
                Investigation
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Why did authorization rate move?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ask a high-level payments question. The analyst plans, runs
                read-only SQL against a synthetic book, and cites every figure.
                Demo clock is Friday 18 Sep 2026.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void runQuestion(prompt)}
                  className="rounded-xl border border-border/80 bg-card/60 px-4 py-3 text-left text-sm transition-colors hover:border-emerald-500/40 hover:bg-muted/40"
                >
                  <span className="mb-1 block font-mono text-[10px] text-emerald-400">
                    {index === 0 ? "Aha demo" : index === 2 ? "Out of slice" : "Follow-up"}
                  </span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-4">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm",
                  turn.role === "user"
                    ? "ml-6 bg-emerald-500/15 sm:ml-10"
                    : "mr-2 bg-card ring-1 ring-foreground/10 sm:mr-4"
                )}
              >
                {turn.role === "user" ? (
                  <p>{turn.text}</p>
                ) : turn.status === "error" ? (
                  <div className="space-y-2">
                    <p className="text-destructive">{turn.text}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void runQuestion(GOLDEN_QUESTION)}
                    >
                      Retry Tuesday question
                    </Button>
                  </div>
                ) : (
                  <AssistantBody result={turn.result} onCite={cite} />
                )}
              </div>
            ))}
            {busy ? (
              <div className="mr-2 rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10 sm:mr-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  {planning[planStep]}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="border-t border-border/80 p-3 sm:p-4">
        {error ? (
          <p className="mb-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p className="mb-2 text-xs text-muted-foreground">
            Enter to run · Shift+Enter for a new line
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Ask why auth rate moved…"
            className="min-h-16 flex-1 resize-none rounded-xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={busy}
            aria-label="Question"
          />
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            size="lg"
            className="bg-emerald-500 text-black hover:bg-emerald-400"
          >
            <Send />
            Run
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border/80">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
              Payments analyst
            </p>
            <h1 className="text-sm font-semibold sm:text-base">
              Payment Root Cause AI
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Demo clock 2026-09-18</Badge>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              New investigation
            </Button>
            <Link
              href="/plan"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Plan
              <ArrowUpRight />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-border/80 bg-border/80 lg:grid-cols-4">
          {bookKpis.map((kpi) => (
            <div key={kpi.label} className="bg-background px-4 py-3">
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className="font-mono text-lg tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.hint}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <section className="min-h-0 border-r border-border/80">{chat}</section>
        <aside className="min-h-0 bg-black/25">
          <EvidencePane result={latestResult} busy={busy} focusedId={focusedId} />
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
          <TabsList className="mx-3 mt-2 w-[calc(100%-1.5rem)]">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
            {chat}
          </TabsContent>
          <TabsContent value="evidence" className="min-h-0 flex-1 overflow-hidden">
            <EvidencePane result={latestResult} busy={busy} focusedId={focusedId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
