import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SafetyBanner } from "@/components/SafetyBanner";
import { StatusPill } from "@/components/StatusPill";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Coordinator dashboard — ClinQSphereX" },
      {
        name: "description",
        content:
          "Live view of study recruitment pipelines, consent status, open tasks and recent research actions.",
      },
      { property: "og:title", content: "Coordinator dashboard — ClinQSphereX" },
      { property: "og:description", content: "Recruitment pipeline and research operations overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [studies, candidates, consents, tasks, audit] = await Promise.all([
        supabase.from("studies").select("*").order("created_at"),
        supabase.from("candidates").select("id, status, match_score, study_id"),
        supabase.from("consents").select("status"),
        supabase.from("tasks").select("id, status, title, due_at, priority").eq("status", "open"),
        supabase
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      return {
        studies: studies.data ?? [],
        candidates: candidates.data ?? [],
        consents: consents.data ?? [],
        tasks: tasks.data ?? [],
        audit: audit.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading workspace…</p>;

  const byStatus = data.candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});
  const consentGranted = data.consents.filter((c) => c.status === "granted").length;

  const stats = [
    { label: "Active studies", value: data.studies.filter((s) => s.status === "recruiting").length },
    { label: "Candidates in pipeline", value: data.candidates.length },
    { label: "Consents granted", value: consentGranted },
    { label: "Open tasks", value: data.tasks.length },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Research operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recruitment pipeline, consent posture and coordinator workload across your organisation.
        </p>
      </header>

      <SafetyBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Pipeline by stage</h2>
          {Object.keys(byStatus).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No candidates yet — open a study and run screening.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {Object.entries(byStatus).map(([status, count]) => (
                <li key={status} className="flex items-center gap-3">
                  <StatusPill value={status} />
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(count / data.candidates.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Studies</h2>
          <ul className="mt-4 space-y-3">
            {data.studies.map((s) => {
              const enrolled = data.candidates.filter(
                (c) => c.study_id === s.id && c.status === "enrolled",
              ).length;
              return (
                <li key={s.id}>
                  <Link
                    to="/studies/$studyId"
                    params={{ studyId: s.id }}
                    className="block rounded-md border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{s.code}</span>
                      <StatusPill value={s.status} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{s.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {enrolled}/{s.target_enrollment} enrolled · protocol {s.protocol_version}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-base font-semibold">Recent audited actions</h2>
        {data.audit.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border text-sm">
            {data.audit.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{a.action}</span>{" "}
                  <span className="text-muted-foreground">by {a.actor_email || "system"}</span>
                </span>
                <span className="text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
