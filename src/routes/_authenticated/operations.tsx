import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { processQueue } from "@/lib/trialbridge.functions";
import { StatusPill } from "@/components/StatusPill";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/operations")({
  head: () => ({
    meta: [
      { title: "Operations & audit — ClinQSphereX" },
      {
        name: "description",
        content:
          "Notification queue with retries and dead-letter handling, optimisation runs and the complete research audit trail.",
      },
      { property: "og:title", content: "Operations & audit — ClinQSphereX" },
      {
        property: "og:description",
        content: "Background queue health, optimisation runs and audit history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OperationsPage,
});

function OperationsPage() {
  const qc = useQueryClient();
  const drain = useServerFn(processQueue);

  const { data } = useQuery({
    queryKey: ["operations"],
    queryFn: async () => {
      const [jobs, audit, runs] = await Promise.all([
        supabase.from("job_queue").select("*").order("created_at", { ascending: false }).limit(30),
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(40),
        supabase
          .from("optimization_runs")
          .select("*, studies(code)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      return { jobs: jobs.data ?? [], audit: audit.data ?? [], runs: runs.data ?? [] };
    },
  });

  const run = useMutation({
    mutationFn: () => drain(),
    onSuccess: (r) =>
      toast.success(
        `Processed ${r.processed}: ${r.sent} delivered, ${r.retrying} retrying, ${r.deadLettered} dead-lettered.`,
      ),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["operations"] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Operations &amp; audit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Background work, optimisation history and the immutable record of who did what.
        </p>
      </header>

      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Notification queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every status change enqueues one idempotent job. Delivery is retried with backoff up
              to three attempts, then dead-lettered for a human to inspect — a failed notification
              is never silently dropped.
            </p>
          </div>
          <button
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {run.isPending ? "Draining…" : "Drain queue"}
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">Job</th>
                <th className="py-2">Key</th>
                <th className="py-2">Attempts</th>
                <th className="py-2">Status</th>
                <th className="py-2">Last error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.jobs ?? []).map((j) => (
                <tr key={j.id}>
                  <td className="py-2">{j.job_type}</td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">
                    {j.idempotency_key.slice(0, 18)}…
                  </td>
                  <td className="py-2 tabular-nums">
                    {j.attempts}/{j.max_attempts}
                  </td>
                  <td className="py-2">
                    <StatusPill value={j.status} />
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">{j.last_error || "—"}</td>
                </tr>
              ))}
              {(data?.jobs ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Queue is empty. Review a candidate to enqueue a notification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-base font-semibold">Optimisation runs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Site allocation solved from a QUBO model. Solver runs classically inside the app; the same
          model is exported for Qiskit QAOA experiments outside it.
        </p>
        <ul className="mt-3 divide-y divide-border text-sm">
          {(data?.runs ?? []).map((r: any) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                {r.studies?.code} · {r.backend} · {r.qubo_size} variables
              </span>
              <span className="text-muted-foreground">
                objective {Number(r.objective)} · {r.runtime_ms} ms ·{" "}
                {new Date(r.created_at).toLocaleString()}
              </span>
            </li>
          ))}
          {(data?.runs ?? []).length === 0 && (
            <li className="py-4 text-muted-foreground">No optimisation runs yet.</li>
          )}
        </ul>
      </section>

      <section className="surface p-5">
        <h2 className="text-base font-semibold">Audit trail</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {(data?.audit ?? []).map((a) => (
            <li key={a.id} className="py-2">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{a.action}</span>
                <span className="text-muted-foreground">
                  {a.actor_email || "system"} · {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {a.entity} {a.entity_id ? a.entity_id.slice(0, 8) : ""} · {JSON.stringify(a.meta)}
              </p>
            </li>
          ))}
          {(data?.audit ?? []).length === 0 && (
            <li className="py-4 text-muted-foreground">No audited actions yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
