import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/DataState";
import {
  CARDIO_GENES,
  loadGenomicFeatureSet,
  type GenomicFeature,
  type GenomicFeatureSet,
} from "@/lib/genomic-benchmark.functions";

/* ------------------------------------------------------------- optimisation */

const K = 5; // variants to select
const LAMBDA = 0.8; // redundancy penalty weight

/** Redundancy between two real records, derived from their genomic locations. */
function redundancy(a: GenomicFeature, b: GenomicFeature) {
  if (!a.chromosome || !b.chromosome || a.chromosome !== b.chromosome) return 0;
  if (a.position != null && b.position != null && Math.abs(a.position - b.position) < 1_000_000)
    return 0.6;
  return 0.15;
}

function objective(features: GenomicFeature[], set: number[], R: number[][]) {
  let score = 0;
  for (let i = 0; i < set.length; i += 1) {
    const a = set[i]!;
    score += features[a]!.weight;
    for (let j = i + 1; j < set.length; j += 1) score -= LAMBDA * R[a]![set[j]!]!;
  }
  return score;
}

/** Classical pipeline: exact enumeration of every k-subset. */
function classicalExact(features: GenomicFeature[], R: number[][]) {
  const n = features.length;
  const combo: number[] = [];
  let best: number[] = [];
  let bestScore = -Infinity;
  let evaluated = 0;
  const walk = (start: number) => {
    if (combo.length === K) {
      evaluated += 1;
      const s = objective(features, combo, R);
      if (s > bestScore) {
        bestScore = s;
        best = [...combo];
      }
      return;
    }
    for (let i = start; i < n; i += 1) {
      combo.push(i);
      walk(i + 1);
      combo.pop();
    }
  };
  walk(0);
  return { best, bestScore, evaluated };
}

/** Deterministic PRNG so every run is reproducible for review. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Quantum-inspired pipeline: simulated annealing over the same QUBO,
 * executed classically. No quantum hardware is used.
 */
function quantumInspiredAnneal(features: GenomicFeature[], R: number[][]) {
  const n = features.length;
  const random = rng(20260910);
  let best: number[] = [];
  let bestScore = -Infinity;
  let evaluated = 0;
  const restarts = 8;
  const sweeps = 220;

  for (let r = 0; r < restarts; r += 1) {
    const pool = [...Array(n).keys()].sort(() => random() - 0.5);
    let current = pool.slice(0, K);
    let currentScore = objective(features, current, R);
    evaluated += 1;
    for (let step = 0; step < sweeps; step += 1) {
      const temperature = 0.6 * (1 - step / sweeps) + 0.01;
      const outIdx = Math.floor(random() * current.length);
      const candidates = [...Array(n).keys()].filter((i) => !current.includes(i));
      if (!candidates.length) break;
      const inIdx = candidates[Math.floor(random() * candidates.length)]!;
      const next = current.map((v, i) => (i === outIdx ? inIdx : v));
      const nextScore = objective(features, next, R);
      evaluated += 1;
      if (nextScore >= currentScore || random() < Math.exp((nextScore - currentScore) / temperature)) {
        current = next;
        currentScore = nextScore;
      }
      if (currentScore > bestScore) {
        bestScore = currentScore;
        best = [...current];
      }
    }
  }
  return { best, bestScore, evaluated };
}

type PipelineResult = {
  label: string;
  selected: number[];
  score: number;
  evaluated: number;
  elapsedMs: number;
};

/* ---------------------------------------------------------------- component */

export function GenomicBenchmark() {
  const load = useServerFn(loadGenomicFeatureSet);
  const [gene, setGene] = useState<string>(CARDIO_GENES[0].symbol);
  const [results, setResults] = useState<{
    set: GenomicFeatureSet;
    classical: PipelineResult;
    quantum: PipelineResult;
  } | null>(null);
  const [reviewed, setReviewed] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const run = useMutation({
    mutationFn: async (symbol: string) => {
      setResults(null);
      setReviewed(null);
      const set = await load({ data: { gene: symbol } });
      const features = set.features;
      if (features.length < K + 1) {
        throw new Error(
          `Only ${features.length} public records were returned for ${symbol}; at least ${K + 1} are needed to compare pipelines.`,
        );
      }
      const R = features.map((a) => features.map((b) => redundancy(a, b)));

      const c0 = performance.now();
      const classical = classicalExact(features, R);
      const c1 = performance.now();
      const q0 = performance.now();
      const quantum = quantumInspiredAnneal(features, R);
      const q1 = performance.now();

      return {
        set,
        classical: {
          label: "Classical — exact enumeration",
          selected: classical.best,
          score: classical.bestScore,
          evaluated: classical.evaluated,
          elapsedMs: c1 - c0,
        },
        quantum: {
          label: "Quantum-inspired — simulated annealing",
          selected: quantum.best,
          score: quantum.bestScore,
          evaluated: quantum.evaluated,
          elapsedMs: q1 - q0,
        },
      };
    },
    onSuccess: setResults,
  });

  const chartData = useMemo(() => {
    if (!results) return [];
    return [
      {
        metric: "Optimisation score",
        Classical: Number(results.classical.score.toFixed(3)),
        "Quantum-inspired": Number(results.quantum.score.toFixed(3)),
      },
      {
        metric: "Execution time (ms)",
        Classical: Number(results.classical.elapsedMs.toFixed(2)),
        "Quantum-inspired": Number(results.quantum.elapsedMs.toFixed(2)),
      },
      {
        metric: "Candidate evaluations",
        Classical: results.classical.evaluated,
        "Quantum-inspired": results.quantum.evaluated,
      },
    ];
  }, [results]);

  const weightData = useMemo(() => {
    if (!results) return [];
    return results.set.features.map((f, i) => ({
      name: f.source === "ClinVar" ? f.name.slice(0, 22) : f.name,
      weight: f.weight,
      picked:
        results.classical.selected.includes(i) || results.quantum.selected.includes(i),
    }));
  }, [results]);

  const overlap = results
    ? results.classical.selected.filter((i) => results.quantum.selected.includes(i)).length
    : 0;
  const gap = results ? results.classical.score - results.quantum.score : 0;

  return (
    <div className="space-y-5">
      <div className="surface p-5">
        <h3 className="text-sm font-semibold">Classical vs Quantum genomic analysis</h3>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Select a cardiovascular-associated gene. Variant records are retrieved live from{" "}
          <a className="underline" href="https://www.ncbi.nlm.nih.gov/clinvar/" target="_blank" rel="noreferrer">
            NCBI ClinVar
          </a>{" "}
          and{" "}
          <a className="underline" href="https://www.ebi.ac.uk/gwas/" target="_blank" rel="noreferrer">
            the GWAS Catalog
          </a>
          , then the same variant-selection optimisation is solved by two separate pipelines.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Gene</span>
            <select
              value={gene}
              onChange={(e) => setGene(e.target.value)}
              className="min-w-64 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {CARDIO_GENES.map((g) => (
                <option key={g.symbol} value={g.symbol}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={() => run.mutate(gene)} disabled={run.isPending}>
            {run.isPending ? "Retrieving and running…" : "Run both pipelines"}
          </Button>
        </div>

        <p className="mt-3 rounded-md border border-border bg-secondary p-3 text-xs leading-relaxed">
          The quantum pipeline is <strong>simulated / quantum-inspired</strong>: simulated annealing
          on the same QUBO, executed on classical hardware. No quantum processor is used and no
          quantum advantage is claimed. Nothing here is a diagnosis or an enrolment decision.
        </p>
      </div>

      {run.isPending && <LoadingState rows={2} label="Retrieving public genomic records" />}
      {run.error && (
        <ErrorState
          message={`SOURCE OFFLINE — ${(run.error as Error).message}. No records were substituted.`}
        />
      )}

      {results && (
        <>
          <div className="surface p-5">
            <h4 className="text-sm font-semibold">
              Retrieved records — {results.set.gene}
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {results.set.clinvar.count} ClinVar variants
              {results.set.clinvar.totalMatches != null
                ? ` (of ${results.set.clinvar.totalMatches.toLocaleString()} matching records)`
                : ""}{" "}
              in {results.set.clinvar.elapsedMs} ms · {results.set.gwas.count} GWAS Catalog SNPs in{" "}
              {results.set.gwas.elapsedMs} ms · retrieved{" "}
              {new Date(results.set.retrievedAt).toLocaleString()}
            </p>
            <ul className="mt-4 space-y-2">
              {results.set.features.map((f, i) => {
                const inC = results.classical.selected.includes(i);
                const inQ = results.quantum.selected.includes(i);
                return (
                  <li key={f.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{f.source}</span>
                      <a href={f.url} target="_blank" rel="noreferrer" className="font-medium underline">
                        {f.name}
                      </a>
                      {inC && (
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs">Classical pick</span>
                      )}
                      {inQ && (
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                          Quantum-inspired pick
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Weight {f.weight} — {f.weightBasis}
                      {f.chromosome ? ` · chr${f.chromosome}${f.position ? `:${f.position}` : ""}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="surface p-5">
            <h4 className="text-sm font-semibold">Side-by-side comparison</h4>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <caption className="sr-only">Classical versus quantum-inspired pipeline results</caption>
                <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Measure</th>
                    <th scope="col" className="px-4 py-2.5">Classical (exact)</th>
                    <th scope="col" className="px-4 py-2.5">Quantum-inspired (simulated)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">Execution time</th>
                    <td className="px-4 py-2.5 tabular-nums">{results.classical.elapsedMs.toFixed(2)} ms</td>
                    <td className="px-4 py-2.5 tabular-nums">{results.quantum.elapsedMs.toFixed(2)} ms</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">Optimisation score</th>
                    <td className="px-4 py-2.5 tabular-nums">{results.classical.score.toFixed(3)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{results.quantum.score.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">Candidate evaluations</th>
                    <td className="px-4 py-2.5 tabular-nums">{results.classical.evaluated.toLocaleString()}</td>
                    <td className="px-4 py-2.5 tabular-nums">{results.quantum.evaluated.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">Selected variants</th>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {results.classical.selected.map((i) => results.set.features[i]!.name).join(", ")}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {results.quantum.selected.map((i) => results.set.features[i]!.name).join(", ")}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">Result quality</th>
                    <td className="px-4 py-2.5 text-muted-foreground">Optimal by construction</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {gap <= 1e-9
                        ? "Matched the exact optimum"
                        : `${gap.toFixed(3)} below the exact optimum`}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">Selection overlap</th>
                    <td colSpan={2} className="px-4 py-2.5 text-muted-foreground">
                      {overlap} of {K} variants chosen by both pipelines
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Classical" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Quantum-inspired" fill="var(--accent-foreground)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Score, time and evaluation counts share one axis for direct comparison; values are the
              measurements from this run only.
            </p>

            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weightData} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={70} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                    {weightData.map((d, i) => (
                      <Cell key={i} fill={d.picked ? "var(--primary)" : "var(--muted-foreground)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Evidence weight per retrieved record; highlighted bars were selected by at least one
              pipeline.
            </p>
          </div>

          <div className="surface p-5">
            <h4 className="text-sm font-semibold">Researcher review</h4>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Neither pipeline output is accepted automatically. A researcher must review the
              retrieved records and the selection before this run is used in any downstream
              research work.
            </p>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Review note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="What was checked, and what remains uncertain?"
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setReviewed(new Date().toLocaleString())}
                disabled={!note.trim()}
              >
                Record researcher review
              </Button>
              {reviewed ? (
                <span className="text-sm text-muted-foreground">
                  Reviewed in this session at {reviewed}. Review notes are not persisted.
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Awaiting researcher review.</span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Sources:{" "}
            <a className="underline" href="https://www.ncbi.nlm.nih.gov/clinvar/" target="_blank" rel="noreferrer">
              NCBI ClinVar
            </a>{" "}
            ·{" "}
            <a className="underline" href="https://www.ebi.ac.uk/gwas/" target="_blank" rel="noreferrer">
              NHGRI-EBI GWAS Catalog
            </a>
            . Records are retrieved live at run time; none are stored or synthesised.
          </p>
        </>
      )}
    </div>
  );
}
