import { cn } from "@/lib/utils";

export type Provenance = "live" | "reference" | "controlled" | "synthetic";

const labels: Record<Provenance, { text: string; className: string }> = {
  live: { text: "Live data", className: "border-success/40 bg-success/10 text-success" },
  reference: { text: "Reference statistic", className: "border-border bg-muted text-muted-foreground" },
  controlled: { text: "Controlled access", className: "border-warning/50 bg-warning/10 text-warning" },
  synthetic: { text: "Synthetic data", className: "border-primary/40 bg-accent text-accent-foreground" },
};

export function ProvenanceTag({ kind, className }: { kind: Provenance; className?: string }) {
  const l = labels[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide",
        l.className,
        className,
      )}
    >
      {l.text}
    </span>
  );
}

export function SourceNote({
  source,
  sourceType,
  kind,
  accessed,
  href,
}: {
  source: string;
  sourceType: string;
  kind: Provenance;
  accessed?: string;
  href?: string;
}) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
      <ProvenanceTag kind={kind} />
      <span>
        Source:{" "}
        {href ? (
          <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
            {source}
          </a>
        ) : (
          source
        )}
      </span>
      <span>Type: {sourceType}</span>
      {accessed && <span>Accessed: {accessed}</span>}
    </p>
  );
}
