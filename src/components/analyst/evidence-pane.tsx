import { AuthSparkline } from "@/components/analyst/sparkline";
import { Badge } from "@/components/ui/badge";
import type { AnalyzeResult, ToolCall } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { AlertTriangle, Database, LoaderCircle } from "lucide-react";

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
              <th key={c} className="px-2 py-1.5 font-mono font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const highlight =
              String(row.decline_code ?? "") === "GATEWAY_TIMEOUT" ||
              String(row.entity ?? "") === "stripe_connect_eu";
            return (
              <tr
                key={i}
                className={cn(
                  "border-t border-border/70",
                  highlight && "bg-emerald-500/10"
                )}
              >
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1.5 font-mono">
                    {String(row[c])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function EvidencePane({
  result,
  busy,
  focusedId,
}: {
  result: AnalyzeResult | null;
  busy: boolean;
  focusedId: string | null;
}) {
  if (busy && !result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <LoaderCircle className="size-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">Running read-only queries</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Locate drop → slice decline codes → join deploys → project bypass.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <Database className="size-8 text-emerald-400/80" />
        <p className="text-sm font-medium">Evidence stays empty until SQL runs</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Every number in the answer must come from a tool call. Ask the Tuesday
          question to fill this drawer.
        </p>
      </div>
    );
  }

  if (result.tools.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <AlertTriangle className="size-8 text-amber-400" />
        <p className="text-sm font-medium">No query evidence this turn</p>
        <p className="max-w-sm text-sm text-muted-foreground">{result.narrative}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-border/80 px-4 py-3">
        <p className="font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
          Evidence
        </p>
        <p className="text-sm text-muted-foreground">
          {result.tools.length} tool calls · cited {result.citations.join(", ")}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {result.hourly.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-medium">Hourly auth rate</h3>
            <AuthSparkline series={result.hourly} />
          </div>
        ) : null}
        {result.tools.map((tool) => (
          <div
            key={tool.id}
            id={`tool-${tool.id}`}
            className={cn(
              "scroll-mt-4 rounded-xl bg-card/70 p-3 ring-1 ring-foreground/10",
              focusedId === tool.id && "ring-2 ring-emerald-400/70"
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {tool.id}
              </Badge>
              <span className="font-mono text-xs">{tool.name}</span>
              <span className="text-xs text-muted-foreground">{tool.elapsedMs}ms</span>
            </div>
            <p className="mb-2 text-sm">{tool.purpose}</p>
            {tool.sql ? (
              <pre className="mb-3 overflow-x-auto rounded-lg bg-black/50 p-2 font-mono text-[11px] leading-relaxed text-emerald-100/90">
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
