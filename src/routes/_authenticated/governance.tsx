import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";

export const Route = createFileRoute("/_authenticated/governance")({
  head: () => ({
    meta: [
      { title: "Governance & audit — ClinQSphereX" },
      {
        name: "description",
        content:
          "Controls implemented in this prototype, controls still required for production, and the recorded audit trail.",
      },
      { property: "og:title", content: "Governance & audit — ClinQSphereX" },
      { property: "og:description", content: "Implemented controls and the audit trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Governance,
});

const controls: [string, string, "mvp" | "future"][] = [
  ["Authentication", "Signed sessions issued by the managed auth service; password hashing handled there.", "mvp"],
  ["Role-based access", "Roles stored in a dedicated table and checked server-side, never client-side.", "mvp"],
  ["Organisation scoping", "Row-level security limits every query to the caller's organisation.", "mvp"],
  ["Audit logging", "Actor, entity, action, timestamp and metadata appended for recorded actions.", "mvp"],
  ["Human review", "Status changes require an explicit reviewer decision with an optional reason.", "mvp"],
  ["Data source labelling", "Participant records are synthetic and labelled as research data.", "mvp"],
  ["Model registry", "Versioned model artefacts, training data hashes and approval records.", "future"],
  ["Validation evidence", "Documented system validation, test evidence and change control.", "future"],
  ["Retention & deletion", "Retention schedules, deletion workflows and legal hold.", "future"],
  ["Ethics workflow", "IEC submission tracking, approvals and protocol amendment control.", "future"],
  ["Monitoring & response", "Continuous log review, alerting and incident response runbooks.", "future"],
];

function Governance() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mvp = controls.filter((c) => c[2] === "mvp");
  const future = controls.filter((c) => c[2] === "future");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Governance &amp; audit</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          What this prototype implements, what a production deployment would still require, and the
          audit record as it actually stands.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Implemented in this prototype</h2>
          <dl className="mt-4 space-y-3">
            {mvp.map(([term, detail]) => (
              <div key={term}>
                <dt className="text-sm font-medium">{term}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="surface-soft p-5">
          <h2 className="text-base font-semibold">Future production control</h2>
          <dl className="mt-4 space-y-3">
            {future.map(([term, detail]) => (
              <div key={term}>
                <dt className="text-sm font-medium">{term}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="audit">
        <h2 id="audit" className="text-base font-semibold">
          Audit trail
        </h2>
        <div className="mt-4">
          {error ? (
            <ErrorState message={`The audit trail could not be loaded: ${(error as Error).message}`} />
          ) : isLoading ? (
            <LoadingState rows={3} label="Loading audit trail" />
          ) : (data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No audited actions recorded yet."
              description="Screening, review, consent and allocation actions appear here as they happen."
            />
          ) : (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[38rem] text-sm">
                <caption className="sr-only">Most recent audited actions</caption>
                <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Action</th>
                    <th scope="col" className="px-4 py-2.5">Entity</th>
                    <th scope="col" className="px-4 py-2.5">Actor</th>
                    <th scope="col" className="px-4 py-2.5">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data!.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2.5 font-medium">{a.action}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{a.entity}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {a.actor_email || "system"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
