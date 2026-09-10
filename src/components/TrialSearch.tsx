import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Search } from "lucide-react";
import { searchTrials } from "@/lib/trials.functions";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { ProvenanceTag } from "@/components/DataProvenance";

/**
 * Live discovery against the public ClinicalTrials.gov registry.
 * Registry records are shown as published; ClinQSphereX adds no eligibility verdict here.
 */
export function TrialSearch({ initialCondition }: { initialCondition: string }) {
  const [term, setTerm] = useState(initialCondition);
  const [query, setQuery] = useState(initialCondition);
  const [recruitingOnly, setRecruitingOnly] = useState(true);
  const run = useServerFn(searchTrials);

  const { data, isPending, error } = useQuery({
    queryKey: ["registry-trials", query, recruitingOnly],
    queryFn: () =>
      run({ data: { condition: query, status: recruitingOnly ? "RECRUITING" : "ALL", pageSize: 8 } }),
    staleTime: 5 * 60_000,
  });

  return (
    <section aria-labelledby="trial-discovery" className="surface-strong p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="trial-discovery" className="font-display text-lg font-semibold">
          Clinical trial discovery
        </h2>
        <ProvenanceTag kind="live" />
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Records are retrieved from the public ClinicalTrials.gov registry when you search. Nothing on
        this panel is a determination about any individual.
      </p>

      <form
        className="mt-5 flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (term.trim()) setQuery(term.trim());
        }}
      >
        <label className="sr-only" htmlFor="condition">
          Condition
        </label>
        <div className="flex min-w-[16rem] flex-1 items-center gap-2 rounded-md border border-input px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            id="condition"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Condition, e.g. heart failure"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={recruitingOnly}
            onChange={(e) => setRecruitingOnly(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Recruiting only
        </label>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Search registry
        </button>
      </form>

      <div className="mt-6">
        {isPending && <LoadingState rows={3} label="Searching the registry…" />}
        {error && <ErrorState message={(error as Error).message} />}
        {data && data.trials.length === 0 && (
          <EmptyState
            title="No registry studies matched"
            description="Try a broader condition term, or turn off the recruiting-only filter."
          />
        )}
        {data && data.trials.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {data.totalCount !== null
                ? `${data.totalCount.toLocaleString()} registry studies match “${data.query}”. Showing ${data.trials.length}.`
                : `Showing ${data.trials.length} registry studies for “${data.query}”.`}
            </p>
            <ul className="mt-4 space-y-4">
              {data.trials.map((t) => (
                <li key={t.nctId} className="surface lift p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="max-w-3xl text-sm font-semibold leading-snug">{t.title}</h3>
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Identifier</dt>
                      <dd className="font-medium tabular-nums">{t.nctId}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conditions</dt>
                      <dd>{t.conditions.join(", ") || "Not stated"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Interventions</dt>
                      <dd>{t.interventions.join(" · ") || "Not stated"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Age / sex</dt>
                      <dd>
                        {[t.minimumAge ?? "No minimum", t.maximumAge ?? "No maximum"].join(" – ")}
                        {t.sex ? ` · ${t.sex.toLowerCase()}` : ""}
                      </dd>
                    </div>
                    {t.locations.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Locations</dt>
                        <dd>{t.locations.join(" · ")}</dd>
                      </div>
                    )}
                  </dl>
                  {t.eligibilitySummary && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-primary">
                        Eligibility summary as published
                      </summary>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {t.eligibilitySummary}…
                      </p>
                    </details>
                  )}
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    View registry record <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              Source: ClinicalTrials.gov · Type: public clinical-trial registry · Accessed:{" "}
              {new Date(data.accessedAt).toISOString().slice(0, 10)}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
