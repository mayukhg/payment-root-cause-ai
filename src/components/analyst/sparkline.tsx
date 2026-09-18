import type { AnalyzeResult } from "@/lib/demo";

export function AuthSparkline({
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
  const h = 148;
  const pad = 16;
  const ys = series.flatMap((p) => [p.authRate, p.baseline]);
  const min = Math.min(...ys) - 1.2;
  const max = Math.max(...ys) + 0.6;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (series.length - 1);
  const y = (v: number) => pad + ((max - v) * (h - pad * 2)) / (max - min);
  const line = (key: "authRate" | "baseline") =>
    series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`)
      .join(" ");
  const area = `${line("authRate")} L ${x(series.length - 1)} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-40 w-full"
        role="img"
        aria-label="Hourly authorization rate versus 14-day baseline"
      >
        <path d={area} fill="oklch(0.78 0.15 165 / 0.12)" />
        <path
          d={line("baseline")}
          fill="none"
          stroke="oklch(0.72 0 0 / 0.7)"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
        <path
          d={line("authRate")}
          fill="none"
          stroke="oklch(0.8 0.16 165)"
          strokeWidth="2.6"
        />
        {series.map((p, i) =>
          p.authRate < p.baseline - 3 ? (
            <circle
              key={p.hour}
              cx={x(i)}
              cy={y(p.authRate)}
              r="4.5"
              fill="oklch(0.7 0.18 25)"
            />
          ) : null
        )}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        {series
          .filter((_, i) => i % 2 === 0)
          .map((p) => (
            <span key={p.hour}>{p.hour}</span>
          ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Solid: Tuesday auth rate. Dashed: 14-day hourly baseline. Red marks hours
        more than 3pp below baseline.
      </p>
    </div>
  );
}
