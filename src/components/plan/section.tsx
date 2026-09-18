import type { ReactNode } from "react";

export function Section({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-border/80 py-16 sm:py-20"
    >
      <p className="font-mono text-xs tracking-[0.2em] text-emerald-400/90 uppercase">
        {kicker}
      </p>
      <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {lead}
        </p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}
