import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { runHeartBenchmark, type BenchmarkResult } from "@/lib/heart-benchmark.functions";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/DataState";

const STEPS = [
  "Dataset prepared",
  "Features preprocessed",
  "Identical split created",
  "Classical baseline trained",
  "Quantum kernel built",
  "Quantum classifier trained",
  "Evaluation complete",
];

const n3 = (v: number) => v.toFixed(3);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const ms = (v: number) =>
  v >= 1000
    ? `${(v / 1000).toFixed(3)} s`
    : v >= 1
      ? `${v.toFixed(2)} ms`
      : v > 0
        ? `${(v * 1000).toFixed(1)} µs`
        : "0 ms";
const signed = (v: number, f: (n: number) => string) => `${v > 0 ? "+" : ""}${f(v)}`;
const signedMs = (v: number) => `${v > 0 ? "+" : "−"}${ms(Math.abs(v))}`;

export function HeartBenchmark() {
  const run = useServerFn(runHeartBenchmark);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [status, setStatus] = useState<"ready" | "running" | "completed" | "failed">("ready");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);


  // Latest stored experiment, so a reload still shows real measured values.
  const stored = useQuery({
    queryKey: ["heart-benchmark-latest"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("optimization_runs")
        .select("metrics, created_at")
        .eq("method", "heart_quantum_kernel_benchmark")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.metrics as unknown as BenchmarkResult | null) ?? null;
    },
  });

  useEffect(() => {
    if (!result && stored.data && status === "ready") setResult(stored.data);
  }, [stored.data, result, status]);

  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => setProgress((p) => Math.min(STEPS.length - 1, p + 1)), 550);
    return () => clearInterval(t);
  }, [status]);

  async function execute() {
    setStatus("running");
    setError(null);
    setProgress(0);
    setResult(null);
    try {
      const res = await run({ data: { qubits, testSize: 0.2, seed: 42 } });
      setResult(res);
      setProgress(STEPS.length);
      setStatus("completed");
      void stored.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Benchmark failed");
      setStatus("failed");
    }
  }

  const qualityData = useMemo(
    () =>
      result
        ? (["accuracy", "precision", "recall", "f1", "roc_auc"] as const).map((k) => ({
            metric: k === "roc_auc" ? "ROC-AUC" : k[0]!.toUpperCase() + k.slice(1),
            Classical: Number(result.classical[k].toFixed(4)),
            Quantum: Number(result.quantum[k].toFixed(4)),
          }))
        : [],
    [result],
  );

  const runtimeData = useMemo(
    () =>
      result
        ? [
            { stage: "Classical training", ms: result.classical.training_time_ms },
            { stage: "Quantum kernel", ms: result.quantum.kernel_time_ms },
            { stage: "Quantum training", ms: result.quantum.training_time_ms },
            { stage: "Classical inference", ms: result.classical.inference_time_ms },
            { stage: "Quantum inference", ms: result.quantum.inference_time_ms },
          ].map((r) => ({ ...r, ms: Number(r.ms.toFixed(3)) }))
        : [],
    [result],
  );

  const rocData = useMemo(() => {
    if (!result) return [];
    const grid = Array.from({ length: 51 }, (_, i) => i / 50);
    const at = (curve: { fpr: number; tpr: number }[], x: number) => {
      let tpr = 0;
      for (const p of curve) if (p.fpr <= x) tpr = Math.max(tpr, p.tpr);
      return Number(tpr.toFixed(4));
    };
    return grid.map((x) => ({
      fpr: Number(x.toFixed(2)),
      Classical: at(result.classical.roc_curve, x),
      Quantum: at(result.quantum.roc_curve, x),
    }));
  }, [result]);

  const rows: { label: string; c: string; q: string; diff: string }[] = result
    ? [
        {
          label: "Accuracy",
          c: n3(result.classical.accuracy),
          q: n3(result.quantum.accuracy),
          diff: signed(result.comparison.accuracy_delta, n3),
        },
        {
          label: "Precision",
          c: n3(result.classical.precision),
          q: n3(result.quantum.precision),
          diff: signed(result.comparison.precision_delta, n3),
        },
        {
          label: "Recall",
          c: n3(result.classical.recall),
          q: n3(result.quantum.recall),
          diff: signed(result.comparison.recall_delta, n3),
        },
        {
          label: "F1",
          c: n3(result.classical.f1),
          q: n3(result.quantum.f1),
          diff: signed(result.comparison.f1_delta, n3),
        },
        {
          label: "ROC-AUC",
          c: n3(result.classical.roc_auc),
          q: n3(result.quantum.roc_auc),
          diff: signed(result.comparison.roc_auc_delta, n3),
        },
        {
          label: "Training time",
          c: ms(result.classical.training_time_ms),
          q: ms(result.quantum.training_time_ms),
          diff: signedMs(result.quantum.training_time_ms - result.classical.training_time_ms),
        },
        {
          label: "Inference time",
          c: ms(result.classical.inference_time_ms),
          q: ms(result.quantum.inference_time_ms),
          diff: signedMs(result.quantum.inference_time_ms - result.classical.inference_time_ms),
        },
        {
          label: "Quantum kernel time",
          c: "Not applicable",
          q: ms(result.quantum.kernel_time_ms),
          diff: "—",
        },
        {
          label: "Total runtime",
          c: ms(result.classical.total_time_ms),
          q: ms(result.quantum.total_time_ms),
          diff: signedMs(result.quantum.total_time_ms - result.classical.total_time_ms),
        },
      ]
    : [
        "Accuracy",
        "Precision",
        "Recall",
        "F1",
        "ROC-AUC",
        "Training time",
        "Inference time",
        "Quantum kernel time",
        "Total runtime",
      ].map((label) => ({ label, c: "Not evaluated", q: "Not evaluated", diff: "—" }));

  const best = result
    ? {
        accuracy:
          result.quantum.accuracy >= result.classical.accuracy
            ? { name: "Quantum kernel SVM", value: n3(result.quantum.accuracy) }
            : { name: "Logistic regression", value: n3(result.classical.accuracy) },
        auc:
          result.quantum.roc_auc >= result.classical.roc_auc
            ? { name: "Quantum kernel SVM", value: n3(result.quantum.roc_auc) }
            : { name: "Logistic regression", value: n3(result.classical.roc_auc) },
        runtime:
          result.quantum.total_time_ms <= result.classical.total_time_ms
            ? { name: "Quantum kernel SVM", value: ms(result.quantum.total_time_ms) }
            : { name: "Logistic regression", value: ms(result.classical.total_time_ms) },
      }
    : null;

  return (
    <div className="space-y-6">
      <GlassPanel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Heart Disease Model Benchmark</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Real public research data · classical baseline vs experimental quantum kernel. Every
              value below is measured during the run; nothing is precomputed or assumed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              aria-live="polite"
            >
              {status}
            </span>
            <Button onClick={execute} disabled={status === "running"}>
              {status === "running" ? "Running benchmark…" : "Run benchmark"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Config label="Dataset" value="UCI Heart Disease" />
          <Config
            label="Records"
            value={result ? `${result.dataset.records_used} of ${result.dataset.records}` : "Loaded at run time"}
          />
          <div>
            <span className="text-xs text-muted-foreground">Qubits</span>
            <select
              className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={qubits}
              onChange={(e) => setQubits(Number(e.target.value))}
              aria-label="Number of qubits"
            >
              {[2, 3, 4, 5].map((q) => (
                <option key={q} value={q}>
                  {q} qubits
                </option>
              ))}
            </select>
          </div>
          <Config label="Train / test split" value="80 / 20" />
          <Config label="Random seed" value="42" />
        </div>
        {qubits >= 5 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Higher qubit counts increase the simulated state space and the kernel computation cost.
          </p>
        ) : null}

        <p className="mt-4 rounded-md border border-border bg-secondary p-3 text-sm">
          <strong>Fair comparison.</strong> Same dataset · same features · same split · same
          evaluation protocol · same seed.
        </p>

        <ol className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {STEPS.map((s, i) => {
            const done = status === "completed" || i < progress;
            const active = status === "running" && i === progress;
            return (
              <li key={s} className="flex items-center gap-1.5">
                <span aria-hidden>{done ? "✓" : active ? "⟳" : "○"}</span>
                <span className={done ? "text-foreground" : undefined}>{s}</span>
              </li>
            );
          })}
        </ol>

        {error ? (
          <div className="mt-4">
            <ErrorState message={`SOURCE OFFLINE — ${error}`} />
          </div>
        ) : null}
      </GlassPanel>

      <GlassPanel className="overflow-x-auto p-5">
        <h4 className="text-base font-semibold">Classical baseline vs quantum kernel</h4>
        <table className="mt-4 w-full min-w-[38rem] text-sm">
          <caption className="sr-only">Measured comparison of the two pipelines</caption>
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5">Metric</th>
              <th scope="col" className="px-4 py-2.5">Classical baseline</th>
              <th scope="col" className="px-4 py-2.5">Quantum kernel</th>
              <th scope="col" className="px-4 py-2.5">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="px-4 py-2.5 text-left font-medium">
                  {r.label}
                </th>
                <td className="px-4 py-2.5 tabular-nums">{r.c}</td>
                <td className="px-4 py-2.5 tabular-nums">{r.q}</td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!result ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No benchmark has been executed in this workspace yet, so every cell reads “Not
            evaluated”. Run the benchmark to populate it with measured values.
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Experiment {result.experiment_id} · {new Date(result.executed_at).toLocaleString()} ·{" "}
            {result.persisted ? "stored in this workspace" : result.persistence_note}
          </p>
        )}
      </GlassPanel>

      {result ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Summary title="Best accuracy" name={best!.accuracy.name} value={best!.accuracy.value} />
            <Summary title="Best ROC-AUC" name={best!.auc.name} value={best!.auc.value} />
            <Summary
              title="Lowest total runtime"
              name={best!.runtime.name}
              value={best!.runtime.value}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <GlassPanel className="p-5">
              <h4 className="text-sm font-semibold">Relative efficiency (quantum / classical)</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <Ratio label="Training time" value={result.comparison.training_time_ratio} />
                <Ratio label="Inference time" value={result.comparison.inference_time_ratio} />
                <Ratio label="Total runtime" value={result.comparison.total_time_ratio} />
              </dl>
            </GlassPanel>

            <GlassPanel className="p-5 md:col-span-2">
              <h4 className="text-sm font-semibold">Quantum computation</h4>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <Item k="Qubits" v={String(result.configuration.qubits)} />
                <Item
                  k="Samples"
                  v={`${result.dataset.train_samples} train / ${result.dataset.test_samples} test`}
                />
                <Item k="Feature dimensions" v={String(result.configuration.quantum_features.length)} />
                <Item k="Kernel matrix" v={result.quantum.kernel_matrix} />
                <Item k="Kernel computation" v={ms(result.quantum.kernel_time_ms)} />
                <Item k="Classifier training" v={ms(result.quantum.training_time_ms)} />
                <Item k="Inference" v={ms(result.quantum.inference_time_ms)} />
                <Item k="Support vectors" v={String(result.quantum.support_vectors)} />
                <Item k="Feature map" v={result.configuration.feature_map} />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Encoded features: {result.configuration.quantum_features.join(", ")} ·{" "}
                {result.configuration.backend}
              </p>
            </GlassPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <GlassPanel className="p-5">
              <h4 className="text-sm font-semibold">Predictive performance</h4>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="metric" fontSize={12} />
                    <YAxis domain={[0, 1]} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Classical" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Quantum" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <h4 className="text-sm font-semibold">Computational cost (milliseconds)</h4>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={runtimeData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis type="category" dataKey="stage" width={130} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="ms" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <h4 className="text-sm font-semibold">ROC curves (test predictions)</h4>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="fpr" fontSize={12} label={{ value: "FPR", position: "insideBottom", offset: -2 }} />
                    <YAxis domain={[0, 1]} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Classical" stroke="hsl(var(--primary))" dot={false} />
                    <Line
                      type="monotone"
                      dataKey="Quantum"
                      stroke="hsl(var(--accent-foreground))"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                ROC-AUC — classical {n3(result.classical.roc_auc)} · quantum{" "}
                {n3(result.quantum.roc_auc)}
              </p>
            </GlassPanel>

            <GlassPanel className="p-5">
              <h4 className="text-sm font-semibold">Confusion matrices (test set)</h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Confusion title="Classical" m={result.classical.confusion} />
                <Confusion title="Quantum" m={result.quantum.confusion} />
              </div>
            </GlassPanel>
          </div>

          <GlassPanel className="p-5">
            <h4 className="text-sm font-semibold">Research interpretation</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              On {result.dataset.test_samples} held-out records from the UCI Heart Disease dataset,
              the quantum kernel SVM reached a ROC-AUC of {n3(result.quantum.roc_auc)} compared with{" "}
              {n3(result.classical.roc_auc)} for the classical logistic-regression baseline
              (accuracy {n3(result.quantum.accuracy)} vs {n3(result.classical.accuracy)}). The
              quantum pipeline required{" "}
              {result.comparison.total_time_ratio.toFixed(2)}× the total runtime of the classical
              pipeline in this run, of which {ms(result.quantum.kernel_time_ms)} was kernel
              construction.
            </p>
            <p className="mt-3 text-sm">
              Benchmark results are environment-dependent and dataset-specific. They do not
              establish general quantum advantage. The quantum pipeline in this prototype is a full
              statevector simulation executed on classical hardware, not quantum hardware, and no
              result here is a clinical or enrolment decision.
            </p>
          </GlassPanel>
        </>
      ) : null}
    </div>
  );
}

function Config({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{v}</dd>
    </div>
  );
}

function Ratio({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value.toFixed(2)}×</dd>
    </div>
  );
}

function Summary({ title, name, value }: { title: string; name: string; value: string }) {
  return (
    <GlassPanel className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{name}</p>
    </GlassPanel>
  );
}

function Confusion({ title, m }: { title: string; m: { tp: number; fp: number; tn: number; fn: number } }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        {[
          ["True positive", m.tp],
          ["False positive", m.fp],
          ["True negative", m.tn],
          ["False negative", m.fn],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-md border border-border p-2">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
