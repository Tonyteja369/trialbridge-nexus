import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";

export const Route = createFileRoute("/_authenticated/quantum-lab")({
  head: () => ({
    meta: [
      { title: "Quantum research lab — ClinQSphereX" },
      {
        name: "description",
        content:
          "Experimental quantum-kernel research: pipeline, experiment metadata and an honest classical-versus-quantum comparison.",
      },
      { property: "og:title", content: "Quantum research lab — ClinQSphereX" },
      {
        property: "og:description",
        content: "Experiment records and comparison against classical baselines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuantumLab,
});

const pipeline = [
  "Clinical features",
  "Feature encoding",
  "Quantum feature map",
  "Qiskit Aer simulation",
  "Quantum state",
  "Fidelity kernel",
  "Kernel SVM",
  "Prediction",
];

const metrics = [
  "Accuracy",
  "Precision",
  "Recall",
  "F1",
  "ROC-AUC",
  "Training time",
  "Inference time",
];

function QuantumLab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["optimization-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("optimization_runs")
        .select("*, studies(code, title)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Quantum research lab</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          An experimental research environment. Nothing here influences a participant&apos;s status,
          and no result is used as a clinical or enrolment decision.
        </p>
      </header>

      <section aria-labelledby="pipeline" className="surface p-5">
        <h2 id="pipeline" className="text-base font-semibold">
          Quantum-kernel pipeline
        </h2>
        <ol className="mt-4 flex flex-wrap gap-2">
          {pipeline.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm"
            >
              <span className="font-display text-xs font-semibold tabular-nums text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The quantum pipeline runs offline in the repository&apos;s <code>quantum/</code> package on
          the Qiskit Aer simulator. The deployed application itself performs no quantum computation:
          the site and slot allocation model below is expressed as a QUBO and solved classically.
        </p>
      </section>

      <section aria-labelledby="comparison" className="surface p-5">
        <h2 id="comparison" className="text-base font-semibold">
          Classical baseline vs quantum kernel
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">
              Evaluation metrics for the classical baseline and quantum kernel models
            </caption>
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5">Metric</th>
                <th scope="col" className="px-4 py-2.5">Classical baseline</th>
                <th scope="col" className="px-4 py-2.5">Quantum kernel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.map((m) => (
                <tr key={m}>
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    {m}
                  </th>
                  <td className="px-4 py-2.5 text-muted-foreground">Not evaluated</td>
                  <td className="px-4 py-2.5 text-muted-foreground">Not evaluated</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          No benchmark run has been recorded in this workspace yet, so every cell reads &ldquo;Not
          evaluated&rdquo;. Values appear here only when a real evaluation has been executed and
          stored.
        </p>
        <p className="mt-3 rounded-md border border-border bg-secondary p-3 text-sm">
          Quantum performance is experimentally evaluated against classical baselines. ClinQSphereX
          does not assume quantum advantage.
        </p>
      </section>


      <section aria-labelledby="runs">
        <h2 id="runs" className="text-base font-semibold">
          Recorded optimisation experiments
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Site and slot allocation runs, with the configuration and runtime actually recorded by the
          backend.
        </p>
        <div className="mt-4">
          {error ? (
            <ErrorState message={`Experiments could not be loaded: ${(error as Error).message}`} />
          ) : isLoading ? (
            <LoadingState rows={2} label="Loading experiments" />
          ) : (data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No optimisation runs recorded yet."
              description="Open a study and solve site allocation to record the first experiment."
            />
          ) : (
            <ul className="space-y-3">
              {data!.map((r: any) => (
                <li key={r.id} className="surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {r.studies?.code ?? "study"} · {r.method}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                    {[
                      ["Backend", r.backend],
                      ["Binary variables", r.qubo_size],
                      ["Objective", Number(r.objective)],
                      ["Runtime", `${r.runtime_ms} ms`],
                    ].map(([k, v]) => (
                      <div key={String(k)}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="mt-0.5 font-medium tabular-nums">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
