import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  agentLoop,
  architectureLayers,
  checklist,
  declineCodes,
  demoScenario,
  metricViews,
  nav,
  phases,
  pitfalls,
  repoTree,
  schemaTables,
  stack,
  successChecks,
  systemPromptRules,
  tools,
} from "@/lib/plan";
import { Section } from "./section";

export function PlanPage() {
  return (
    <div className="min-h-full bg-background">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%)]" />
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] tracking-widest text-emerald-400/90 uppercase">
              Artifact plan
            </p>
            <p className="truncate text-sm font-medium">
              Transaction Analytics Agent
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300"
          >
            Sample UI
          </Link>
          <nav className="hidden max-w-3xl flex-wrap justify-end gap-x-3 gap-y-1 lg:flex">
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
              POC slice · payments auth-rate diagnosis
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              From “I could diagnose this” to a demo that names the gateway.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              This is the executable engineering plan for a sellable prototype:
              synthetic payment attempts, metric views, a tool-using analyst
              agent, and one planted incident that produces an undeniable “why.”
            </p>
          </div>
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Frozen demo clock</CardTitle>
              <CardDescription>
                Relative dates must not drift. The agent’s “today” is Friday 18
                Sep 2026 so “last Tuesday” is always 15 Sep 2026.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs leading-relaxed text-muted-foreground">
              <p>
                Question → locate hourly drop → slice decline codes × gateway →
                join deploys → counterfactual bypass.
              </p>
              <p className="text-emerald-300">
                Target: GATEWAY_TIMEOUT on stripe_connect_eu, 15:00–17:00 UTC.
              </p>
            </CardContent>
          </Card>
        </div>

        <nav className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Section
          id="success"
          kicker="01 · Definition of done"
          title="Success is a cited root cause, not a dashboard."
          lead="The artifact wins if an operator can ask a vague question and leave with a window, a decline family, a named processor, and a projected fix — each number backed by SQL that actually ran."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {successChecks.map((item) => (
              <Card key={item.title} size="sm">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="architecture"
          kicker="02 · System shape"
          title="Four layers. The LLM never touches the database except through tools."
          lead="Query in, plan out. The warehouse stays boring; the agent is the product."
        >
          <div className="grid gap-3 md:grid-cols-4">
            {architectureLayers.map((layer, i) => (
              <Card key={layer.id} size="sm" className="bg-card/70">
                <CardHeader>
                  <p className="font-mono text-[11px] text-emerald-400">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <CardTitle>{layer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {layer.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Request path: UI → POST /api/analyze → planner → tools (SQL /
            events / counterfactual) → SQLite views → synthesizer → narrative +
            citations. RAG here means retrieved query fragments, not PDF chunks.
          </p>
        </Section>

        <Section
          id="data"
          kicker="03 · Data foundation"
          title="A realistic book with a planted failure, not random money."
          lead="Schema exists to support diagnosis. Every column is there because the Tuesday story needs it — or because a confounder needs it."
        >
          <Tabs defaultValue={schemaTables[0].name}>
            <TabsList variant="line" className="h-auto w-full flex-wrap justify-start">
              {schemaTables.map((table) => (
                <TabsTrigger key={table.name} value={table.name}>
                  {table.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {schemaTables.map((table) => (
              <TabsContent key={table.name} value={table.name} className="pt-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  {table.purpose}
                </p>
                <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Column</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map(([col, type, note]) => (
                        <tr key={col} className="border-t border-border/80">
                          <td className="px-3 py-2 font-mono text-xs">{col}</td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {type}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <h3 className="mt-10 text-lg font-medium">Decline codes (the “why”)</h3>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Do not collapse these into failed=true. The agent’s job is to pick
            the family that actually moved.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {declineCodes.map((row) => (
              <Card key={row.code} size="sm">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    {row.family}
                  </Badge>
                  <CardTitle className="font-mono text-sm">{row.code}</CardTitle>
                  <CardDescription>{row.note}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="engine"
          kicker="04 · Analytical engine"
          title="Precompute the grains an analyst actually uses."
          lead="The agent should query views, not re-derive auth rate from raw attempts in every session."
        >
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">View</th>
                  <th className="px-3 py-2 font-medium">Grain</th>
                  <th className="px-3 py-2 font-medium">Definition</th>
                </tr>
              </thead>
              <tbody>
                {metricViews.map((view) => (
                  <tr key={view.name} className="border-t border-border/80">
                    <td className="px-3 py-2 font-mono text-xs">{view.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {view.grain}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {view.definition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <Card key={tool.name} size="sm">
                <CardHeader>
                  <CardTitle className="font-mono text-sm">{tool.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {tool.args}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{tool.returns}</p>
                  <p className="text-foreground/80">{tool.rule}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="agent"
          kicker="05 · Agentic workflow"
          title="Plan, then query, then speak. Never the reverse."
          lead="Persona: Senior Payment Analytics Specialist. Constraint: if it is not in a tool result, it does not go in the answer."
        >
          <ol className="grid gap-3 md:grid-cols-2">
            {agentLoop.map((item) => (
              <li key={item.step}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>{item.step}</CardTitle>
                    <CardDescription>{item.body}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>System prompt rules (non-negotiable)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {systemPromptRules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>

        <Section
          id="demo"
          kicker="06 · Aha scenario"
          title="Crush one hard question."
          lead={demoScenario.clock}
        >
          <Card>
            <CardHeader>
              <CardDescription>User input</CardDescription>
              <CardTitle className="text-xl italic">
                “{demoScenario.user}”
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoScenario.planted.map((row) => (
                <div key={row.label}>
                  <p className="font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
                    {row.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="mt-4 rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/10">
            <p className="font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
              Expected operator answer
            </p>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {demoScenario.expectedAnswer}
            </pre>
          </div>
        </Section>

        <Section
          id="phases"
          kicker="07 · Build sequence"
          title="Ship the Tuesday story before inventing a platform."
        >
          <Accordion multiple defaultValue={["p0"]}>
            {phases.map((phase) => (
              <AccordionItem key={phase.id} value={phase.id}>
                <AccordionTrigger className="py-4 hover:no-underline">
                  <span className="pr-4 text-left">
                    <span className="block font-medium">{phase.name}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      {phase.goal}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Tasks
                  </p>
                  <ul className="mb-4 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {phase.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Files
                  </p>
                  <ul className="mb-4 space-y-1 font-mono text-xs text-emerald-300/90">
                    {phase.files.map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Done when: </span>
                    <span className="text-muted-foreground">{phase.done}</span>
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        <Section
          id="stack"
          kicker="08 · Locked decisions"
          title="Local, fast, replaceable. Warehouse names, laptop runtime."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {stack.map((item) => (
              <Card key={item.choice} size="sm">
                <CardHeader>
                  <CardTitle>{item.choice}</CardTitle>
                  <CardDescription>{item.why}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="repo"
          kicker="09 · Target layout"
          title="What the implementation repo should look like."
        >
          <pre className="overflow-x-auto rounded-xl bg-muted/40 p-4 font-mono text-xs leading-relaxed text-muted-foreground ring-1 ring-foreground/10">
            {repoTree}
          </pre>
        </Section>

        <Section
          id="risks"
          kicker="10 · Pitfalls & checklist"
          title="The failure mode is looking smart without executing queries."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {pitfalls.map((item) => (
              <Card key={item.pitfall} size="sm">
                <CardHeader>
                  <CardTitle className="text-destructive-foreground">
                    Avoid: {item.pitfall}
                  </CardTitle>
                  <CardDescription>Do: {item.instead}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <Separator className="my-8" />
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Component</th>
                  <th className="px-3 py-2 font-medium">Deliverable</th>
                  <th className="px-3 py-2 font-medium">Goal</th>
                  <th className="px-3 py-2 font-medium">Pitfall</th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((row) => (
                  <tr key={row.component} className="border-t border-border/80">
                    <td className="px-3 py-2 font-medium">{row.component}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.deliverable}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.goal}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.avoid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </div>
  );
}
