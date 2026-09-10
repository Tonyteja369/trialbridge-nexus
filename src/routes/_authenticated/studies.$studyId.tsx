import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { runScreening, runAllocation } from "@/lib/trialbridge.functions";
import { StatusPill } from "@/components/StatusPill";
import { SafetyBanner } from "@/components/SafetyBanner";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studies/$studyId")({
  head: () => ({
    meta: [
      { title: "Study workspace — ClinQSphereX" },
      {
        name: "description",
        content:
          "Eligibility criteria, screening shortlist, human review pipeline and site allocation for a single clinical study.",
      },
      { property: "og:title", content: "Study workspace — ClinQSphereX" },
      { property: "og:description", content: "Screening, review and site allocation for one study." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <p className="text-sm text-destructive">This study could not be loaded: {error.message}</p>
  ),
  component: StudyPage,
});

function StudyPage() {
  const { studyId } = Route.useParams();
  const qc = useQueryClient();
  const screen = useServerFn(runScreening);
  const allocate = useServerFn(runAllocation);
  const [tab, setTab] = useState<"pipeline" | "criteria" | "sites" | "allocation">("pipeline");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["study", studyId],
    queryFn: async () => {
      const [study, criteria, sites, candidates, runs] = await Promise.all([
        supabase.from("studies").select("*").eq("id", studyId).maybeSingle(),
        supabase.from("eligibility_criteria").select("*").eq("study_id", studyId),
        supabase.from("sites").select("*").eq("study_id", studyId),
        supabase
          .from("candidates")
          .select("*, participants(code, age, sex, city)")
          .eq("study_id", studyId)
          .order("match_score", { ascending: false }),
        supabase
          .from("optimization_runs")
          .select("*")
          .eq("study_id", studyId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      return {
        study: study.data,
        criteria: criteria.data ?? [],
        sites: sites.data ?? [],
        candidates: candidates.data ?? [],
        runs: runs.data ?? [],
      };
    },
  });

  const screening = useMutation({
    mutationFn: () => screen({ data: { studyId } }),
    onSuccess: (r) => {
      toast.success(
        `Screened ${r.screened} records — ${r.shortlisted} shortlisted for review, ${r.flaggedIneligible} flagged, ${r.lockedUnchanged} already under human decision.`,
      );
      qc.invalidateQueries({ queryKey: ["study", studyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allocation = useMutation({
    mutationFn: () => allocate({ data: { studyId } }),
    onSuccess: () => {
      toast.success("Site allocation solved");
      setTab("allocation");
      qc.invalidateQueries({ queryKey: ["study", studyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingState rows={3} label="Loading study" />;
  if (!data?.study) return <ErrorState message="This study could not be found." />;
  const study = data.study;

  const candidates = (data.candidates as any[]).filter((c) => {
    const term = search.trim().toLowerCase();
    if (term && !String(c.participants?.code ?? "").toLowerCase().includes(term)) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (confidenceFilter !== "all" && c.confidence !== confidenceFilter) return false;
    if (reviewFilter === "reviewed" && !c.reviewed_at) return false;
    if (reviewFilter === "requires_review" && c.reviewed_at) return false;
    return true;
  });
  const statusOptions = Array.from(new Set((data.candidates as any[]).map((c) => c.status)));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/studies" className="text-sm text-muted-foreground hover:underline">
            ← All studies
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{study.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {study.code} · Phase {study.phase} · protocol {study.protocol_version} ·{" "}
            {study.sponsor || "no sponsor"}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusPill value={study.status} className="self-center" />
          <button
            onClick={() => screening.mutate()}
            disabled={screening.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {screening.isPending ? "Screening…" : "Run screening"}
          </button>
        </div>
      </header>

      <SafetyBanner compact />

      <nav className="flex gap-1 border-b border-border">
        {(["pipeline", "criteria", "sites", "allocation"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm capitalize ${
              tab === t
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "pipeline" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
                Search candidate ID
              </label>
              <input
                id="q"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. P-0042"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            {[
              {
                id: "f-status",
                label: "Status",
                value: statusFilter,
                set: setStatusFilter,
                options: statusOptions.map((s) => [s, String(s).replace(/_/g, " ")] as const),
              },
              {
                id: "f-conf",
                label: "Confidence",
                value: confidenceFilter,
                set: setConfidenceFilter,
                options: [
                  ["high", "high"],
                  ["medium", "medium"],
                  ["low", "low"],
                ] as const,
              },
              {
                id: "f-review",
                label: "Review",
                value: reviewFilter,
                set: setReviewFilter,
                options: [
                  ["requires_review", "requires review"],
                  ["reviewed", "reviewed"],
                ] as const,
              },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="text-xs font-medium text-muted-foreground">
                  {f.label}
                </label>
                <select
                  id={f.id}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
                >
                  <option value="all">All</option>
                  {f.options.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {candidates.length} of {data.candidates.length} candidates.
          </p>

          {data.candidates.length === 0 ? (
            <EmptyState
              title="No candidates have been added to this study yet."
              description="Run screening to build a shortlist of potentially eligible participants for human review."
            />
          ) : candidates.length === 0 ? (
            <EmptyState
              title="No candidates match these filters."
              description="Clear the search or filters to see the full pipeline."
            />
          ) : (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <caption className="sr-only">Candidate pipeline for this study</caption>
                <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3">Candidate</th>
                    <th scope="col" className="px-4 py-3">Match</th>
                    <th scope="col" className="px-4 py-3">Confidence</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Review</th>
                    <th scope="col" className="px-4 py-3">Screened against</th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates.map((c: any) => {
                    const stale = c.screened_protocol_version !== study.protocol_version;
                    return (
                      <tr key={c.id}>
                        <td className="px-4 py-3">
                          <span className="font-medium">{c.participants?.code}</span>
                          <span className="block text-xs text-muted-foreground">
                            {c.participants?.age ?? "?"} y · {c.participants?.sex} ·{" "}
                            {c.participants?.city}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{Number(c.match_score)}</td>
                        <td className="px-4 py-3">
                          <StatusPill value={c.confidence} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill value={c.status} />
                        </td>
                        <td className="px-4 py-3">
                          {c.reviewed_at ? (
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.reviewed_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <OutcomeBadge outcome="requires_review" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {c.screened_protocol_version}
                          {stale && (
                            <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
                              stale — re-screen
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/candidates/$candidateId"
                            params={{ candidateId: c.id }}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "criteria" && (
        <section className="surface divide-y divide-border">
          {data.criteria.map((c: any) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">
                  {c.attribute} · {c.operator} · weight {Number(c.weight)}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusPill value={c.kind === "inclusion" ? "consented" : "ineligible"} />
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  {c.hard ? "hard rule" : "soft rule"}
                </span>
              </div>
            </div>
          ))}
          {data.criteria.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No criteria defined for this study yet.
            </p>
          )}
        </section>
      )}

      {tab === "sites" && (
        <section className="grid gap-4 sm:grid-cols-2">
          {data.sites.map((s: any) => (
            <div key={s.id} className="surface p-5">
              <h3 className="text-base font-medium">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.city}</p>
              <p className="mt-3 text-sm">
                Weekly screening capacity: <strong>{s.weekly_capacity}</strong>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Allocated candidates:{" "}
                {data.candidates.filter((c: any) => c.site_id === s.id).length}
              </p>
            </div>
          ))}
          {data.sites.length === 0 && (
            <p className="text-sm text-muted-foreground">No research sites for this study.</p>
          )}
        </section>
      )}

      {tab === "allocation" && (
        <section className="space-y-4">
          <div className="surface p-5">
            <h2 className="text-base font-semibold">Site &amp; slot allocation (QUBO model)</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Reviewer-approved candidates are allocated to research sites by minimising a
              Quadratic Unconstrained Binary Optimisation objective: maximise match quality, respect
              each site&apos;s weekly capacity, and reduce participant travel burden. This is the
              same model exported to <code>quantum/site_allocation_qaoa.py</code> for Qiskit QAOA
              experiments. In this deployed app the model is solved{" "}
              <strong>classically</strong> — no quantum hardware or simulator runs here and no
              quantum advantage is claimed.
            </p>
            <button
              onClick={() => allocation.mutate()}
              disabled={allocation.isPending}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {allocation.isPending ? "Solving…" : "Solve allocation"}
            </button>
          </div>

          {data.runs.map((r: any) => (
            <div key={r.id} className="surface p-5">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">
                  {r.backend} · {r.qubo_size} binary variables ·{" "}
                  {(r.metrics as any)?.numTerms ?? 0} QUBO terms
                </span>
                <span className="text-muted-foreground">
                  objective {Number(r.objective)} · {r.runtime_ms} ms ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {((r.assignment as any[]) ?? []).map((a) => (
                  <li key={a.candidateId} className="flex justify-between border-b border-border py-1">
                    <span>{a.label}</span>
                    <span className="text-muted-foreground">{a.siteName}</span>
                  </li>
                ))}
              </ul>
              {((r.metrics as any)?.unassigned ?? []).length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Left unassigned this round (capacity):{" "}
                  {((r.metrics as any).unassigned as any[]).map((u) => u.label).join(", ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
