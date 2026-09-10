import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Heart disease model benchmark.
 *
 * Real public data: UCI Heart Disease (Cleveland, processed) is fetched live
 * from the UCI Machine Learning Repository and cached server-side.
 *
 * Two pipelines are executed on exactly the same dataset, preprocessing,
 * split, labels and seed:
 *   - Classical baseline : logistic regression (batch gradient descent)
 *   - Quantum kernel     : ZZ-style feature map, full statevector simulation,
 *                          fidelity kernel, kernel SVM (SMO)
 *
 * The quantum pipeline is a statevector simulation executed on classical
 * hardware inside this application. It is not quantum hardware, and no
 * quantum advantage is assumed or claimed. Every number returned here is
 * measured during the run; nothing is fabricated or hardcoded.
 */

const DATA_URL =
  "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data";

const FEATURE_NAMES = [
  "age",
  "sex",
  "cp",
  "trestbps",
  "chol",
  "fbs",
  "restecg",
  "thalach",
  "exang",
  "oldpeak",
  "slope",
  "ca",
  "thal",
];

export type MetricSet = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
  roc_curve: { fpr: number; tpr: number }[];
};

export type BenchmarkResult = {
  experiment_id: string;
  executed_at: string;
  dataset: {
    name: string;
    source_url: string;
    records: number;
    records_used: number;
    features: number;
    train_samples: number;
    test_samples: number;
    positive_rate_train: number;
    positive_rate_test: number;
    fetched_at: string;
  };
  configuration: {
    qubits: number;
    test_size: number;
    random_seed: number;
    quantum_features: string[];
    feature_map: string;
    backend: string;
  };
  classical: MetricSet & {
    model: string;
    training_time_ms: number;
    inference_time_ms: number;
    total_time_ms: number;
  };
  quantum: MetricSet & {
    model: string;
    kernel_time_ms: number;
    training_time_ms: number;
    inference_time_ms: number;
    total_time_ms: number;
    kernel_matrix: string;
    support_vectors: number;
  };
  comparison: {
    accuracy_delta: number;
    precision_delta: number;
    recall_delta: number;
    f1_delta: number;
    roc_auc_delta: number;
    training_time_ratio: number;
    inference_time_ratio: number;
    total_time_ratio: number;
  };
  persisted: boolean;
  persistence_note: string;
};

/* ------------------------------------------------------------------ data */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Row = { x: number[]; y: number };
let datasetCache: { rows: Row[]; rawRecords: number; fetchedAt: string } | null = null;

async function loadHeartDataset() {
  if (datasetCache) return datasetCache;
  let lastError = "request failed";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const started = Date.now();
    try {
      const res = await fetch(DATA_URL, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) {
        lastError = `HTTP ${res.status} after ${Date.now() - started} ms`;
      } else {
        const text = await res.text();
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        const rows: Row[] = [];
        for (const line of lines) {
          const parts = line.split(",");
          if (parts.length !== 14) continue;
          if (parts.some((p) => p === "?" || p === "")) continue;
          const nums = parts.map(Number);
          if (nums.some((n) => !Number.isFinite(n))) continue;
          rows.push({ x: nums.slice(0, 13), y: nums[13]! > 0 ? 1 : 0 });
        }
        if (rows.length < 50) throw new Error("dataset parsed with too few complete records");
        datasetCache = {
          rows,
          rawRecords: lines.length,
          fetchedAt: new Date().toISOString(),
        };
        return datasetCache;
      }
    } catch (error) {
      lastError = `${error instanceof Error ? error.message : "request failed"} after ${Date.now() - started} ms`;
    }
    if (attempt < 3) await wait(300 * attempt);
  }
  throw new Error(
    `UCI Heart Disease repository unavailable — 3 attempts; last failure: ${lastError}`,
  );
}

/* --------------------------------------------------------------- helpers */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function evaluate(scores: number[], labels: number[], threshold: number): MetricSet {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  scores.forEach((s, i) => {
    const pred = s >= threshold ? 1 : 0;
    const y = labels[i]!;
    if (pred === 1 && y === 1) tp += 1;
    else if (pred === 1 && y === 0) fp += 1;
    else if (pred === 0 && y === 0) tn += 1;
    else fn += 1;
  });
  const accuracy = (tp + tn) / labels.length;
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  // ROC over the actual score distribution.
  const pairs = scores
    .map((s, i) => ({ s, y: labels[i]! }))
    .sort((a, b) => b.s - a.s);
  const pos = labels.filter((y) => y === 1).length;
  const neg = labels.length - pos;
  const curve: { fpr: number; tpr: number }[] = [{ fpr: 0, tpr: 0 }];
  let cTp = 0;
  let cFp = 0;
  let auc = 0;
  let prevFpr = 0;
  let prevTpr = 0;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i]!.y === 1) cTp += 1;
    else cFp += 1;
    if (i + 1 < pairs.length && pairs[i + 1]!.s === pairs[i]!.s) continue;
    const tpr = pos === 0 ? 0 : cTp / pos;
    const fpr = neg === 0 ? 0 : cFp / neg;
    auc += ((fpr - prevFpr) * (tpr + prevTpr)) / 2;
    curve.push({ fpr, tpr });
    prevFpr = fpr;
    prevTpr = tpr;
  }
  return {
    accuracy,
    precision,
    recall,
    f1,
    roc_auc: auc,
    confusion: { tp, fp, tn, fn },
    roc_curve: curve,
  };
}

/* ------------------------------------------------------------- classical */

function trainLogisticRegression(X: number[][], y: number[], iterations = 800, lr = 0.1, l2 = 1e-3) {
  const n = X.length;
  const d = X[0]!.length;
  const w = new Array<number>(d).fill(0);
  let b = 0;
  for (let it = 0; it < iterations; it += 1) {
    const gw = new Array<number>(d).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i += 1) {
      let z = b;
      const xi = X[i]!;
      for (let j = 0; j < d; j += 1) z += w[j]! * xi[j]!;
      const p = 1 / (1 + Math.exp(-z));
      const err = p - y[i]!;
      for (let j = 0; j < d; j += 1) gw[j] = gw[j]! + err * xi[j]!;
      gb += err;
    }
    for (let j = 0; j < d; j += 1) w[j] = w[j]! - lr * (gw[j]! / n + l2 * w[j]!);
    b -= lr * (gb / n);
  }
  return { w, b };
}

/* ------------------------------------------------------- quantum kernel */

/** Phase of every computational basis state for a ZZ-style feature map. */
function featureMapPhases(x: number[], qubits: number, reps: number) {
  const dim = 1 << qubits;
  const cos = new Float64Array(dim);
  const sin = new Float64Array(dim);
  for (let z = 0; z < dim; z += 1) {
    let phase = 0;
    for (let i = 0; i < qubits; i += 1) {
      const bi = (z >> i) & 1;
      if (bi) phase += 2 * x[i]!;
      for (let j = i + 1; j < qubits; j += 1) {
        const bj = (z >> j) & 1;
        if (bi !== bj) phase += 2 * (Math.PI - x[i]!) * (Math.PI - x[j]!);
      }
    }
    phase *= reps;
    cos[z] = Math.cos(phase);
    sin[z] = Math.sin(phase);
  }
  return { cos, sin };
}

function fidelity(a: { cos: Float64Array; sin: Float64Array }, b: { cos: Float64Array; sin: Float64Array }, dim: number) {
  let re = 0;
  let im = 0;
  for (let z = 0; z < dim; z += 1) {
    re += a.cos[z]! * b.cos[z]! + a.sin[z]! * b.sin[z]!;
    im += a.sin[z]! * b.cos[z]! - a.cos[z]! * b.sin[z]!;
  }
  return (re * re + im * im) / (dim * dim);
}

/** Simplified SMO on a precomputed kernel matrix, labels in {-1, +1}. */
function trainKernelSvm(K: number[][], y: number[], C = 1, tol = 1e-3, maxPasses = 12) {
  const n = y.length;
  const alpha = new Array<number>(n).fill(0);
  let b = 0;
  const rand = mulberry32(7);
  const f = (i: number) => {
    let s = b;
    for (let k = 0; k < n; k += 1) if (alpha[k] !== 0) s += alpha[k]! * y[k]! * K[i]![k]!;
    return s;
  };
  let passes = 0;
  while (passes < maxPasses) {
    let changed = 0;
    for (let i = 0; i < n; i += 1) {
      const Ei = f(i) - y[i]!;
      if ((y[i]! * Ei < -tol && alpha[i]! < C) || (y[i]! * Ei > tol && alpha[i]! > 0)) {
        let j = Math.floor(rand() * (n - 1));
        if (j >= i) j += 1;
        const Ej = f(j) - y[j]!;
        const ai = alpha[i]!;
        const aj = alpha[j]!;
        const [L, H] =
          y[i] !== y[j]
            ? [Math.max(0, aj - ai), Math.min(C, C + aj - ai)]
            : [Math.max(0, ai + aj - C), Math.min(C, ai + aj)];
        if (L >= H) continue;
        const eta = 2 * K[i]![j]! - K[i]![i]! - K[j]![j]!;
        if (eta >= 0) continue;
        let ajNew = aj - (y[j]! * (Ei - Ej)) / eta;
        ajNew = Math.min(H, Math.max(L, ajNew));
        if (Math.abs(ajNew - aj) < 1e-6) continue;
        const aiNew = ai + y[i]! * y[j]! * (aj - ajNew);
        const b1 = b - Ei - y[i]! * (aiNew - ai) * K[i]![i]! - y[j]! * (ajNew - aj) * K[i]![j]!;
        const b2 = b - Ej - y[i]! * (aiNew - ai) * K[i]![j]! - y[j]! * (ajNew - aj) * K[j]![j]!;
        alpha[i] = aiNew;
        alpha[j] = ajNew;
        b = aiNew > 0 && aiNew < C ? b1 : ajNew > 0 && ajNew < C ? b2 : (b1 + b2) / 2;
        changed += 1;
      }
    }
    passes = changed === 0 ? passes + 1 : 0;
    if (changed === 0) break;
  }
  return { alpha, b };
}

/* --------------------------------------------------------------- runner */

export const runHeartBenchmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { qubits?: number; testSize?: number; seed?: number; samples?: number }) => ({
    qubits: Math.min(5, Math.max(2, Math.round(input.qubits ?? 4))),
    testSize: Math.min(0.4, Math.max(0.1, input.testSize ?? 0.2)),
    seed: Math.round(input.seed ?? 42),
    samples: Math.min(303, Math.max(60, Math.round(input.samples ?? 303))),
  }))
  .handler(async ({ data, context }): Promise<BenchmarkResult> => {
    const { qubits, testSize, seed, samples } = data;
    const ds = await loadHeartDataset();

    // Same seeded shuffle drives sub-sampling and the split for both pipelines.
    const rand = mulberry32(seed);
    const order = ds.rows.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    const used = order.slice(0, Math.min(samples, ds.rows.length)).map((i) => ds.rows[i]!);
    const testCount = Math.max(10, Math.round(used.length * testSize));
    const test = used.slice(0, testCount);
    const train = used.slice(testCount);

    // Standardisation fitted on the training set only.
    const d = FEATURE_NAMES.length;
    const mean = new Array<number>(d).fill(0);
    const std = new Array<number>(d).fill(0);
    for (let j = 0; j < d; j += 1) {
      mean[j] = train.reduce((s, r) => s + r.x[j]!, 0) / train.length;
      const v = train.reduce((s, r) => s + (r.x[j]! - mean[j]!) ** 2, 0) / train.length;
      std[j] = Math.sqrt(v) || 1;
    }
    const scale = (r: Row) => r.x.map((v, j) => (v - mean[j]!) / std[j]!);
    const Xtr = train.map(scale);
    const Xte = test.map(scale);
    const ytr = train.map((r) => r.y);
    const yte = test.map((r) => r.y);

    // --- classical baseline -------------------------------------------------
    const cTrainStart = performance.now();
    const model = trainLogisticRegression(Xtr, ytr);
    const cTrainMs = performance.now() - cTrainStart;

    const cInferStart = performance.now();
    const cScores = Xte.map((xi) => {
      let z = model.b;
      for (let j = 0; j < d; j += 1) z += model.w[j]! * xi[j]!;
      return 1 / (1 + Math.exp(-z));
    });
    const cInferMs = performance.now() - cInferStart;
    const classicalMetrics = evaluate(cScores, yte, 0.5);

    // --- quantum kernel -----------------------------------------------------
    // Feature subset chosen on the training set only, by |Pearson r| with the label.
    const meanY = ytr.reduce((s, v) => s + v, 0) / ytr.length;
    const corr = FEATURE_NAMES.map((name, j) => {
      let num = 0;
      let dx = 0;
      let dy = 0;
      for (let i = 0; i < Xtr.length; i += 1) {
        const a = Xtr[i]![j]!;
        const bb = ytr[i]! - meanY;
        num += a * bb;
        dx += a * a;
        dy += bb * bb;
      }
      return { name, j, r: Math.abs(num / (Math.sqrt(dx * dy) || 1)) };
    })
      .sort((a, b) => b.r - a.r)
      .slice(0, qubits);
    const idx = corr.map((c) => c.j);

    const lo = idx.map((j) => Math.min(...Xtr.map((r) => r[j]!)));
    const hi = idx.map((j) => Math.max(...Xtr.map((r) => r[j]!)));
    const encode = (row: number[]) =>
      idx.map((j, k) => {
        const span = hi[k]! - lo[k]! || 1;
        return Math.min(Math.PI, Math.max(0, ((row[j]! - lo[k]!) / span) * Math.PI));
      });

    const dim = 1 << qubits;
    const reps = 2;
    const kernelStart = performance.now();
    const trStates = Xtr.map((r) => featureMapPhases(encode(r), qubits, reps));
    const teStates = Xte.map((r) => featureMapPhases(encode(r), qubits, reps));
    const Ktr: number[][] = Array.from({ length: trStates.length }, () =>
      new Array<number>(trStates.length).fill(0),
    );
    for (let i = 0; i < trStates.length; i += 1) {
      Ktr[i]![i] = 1;
      for (let j = i + 1; j < trStates.length; j += 1) {
        const k = fidelity(trStates[i]!, trStates[j]!, dim);
        Ktr[i]![j] = k;
        Ktr[j]![i] = k;
      }
    }
    const Kte = teStates.map((t) => trStates.map((s) => fidelity(t, s, dim)));
    const kernelMs = performance.now() - kernelStart;

    const ySigned = ytr.map((v) => (v === 1 ? 1 : -1));
    const qTrainStart = performance.now();
    const svm = trainKernelSvm(Ktr, ySigned);
    const qTrainMs = performance.now() - qTrainStart;

    const qInferStart = performance.now();
    const qScores = Kte.map((krow) => {
      let s = svm.b;
      for (let k = 0; k < krow.length; k += 1) {
        if (svm.alpha[k] !== 0) s += svm.alpha[k]! * ySigned[k]! * krow[k]!;
      }
      return s;
    });
    const qInferMs = performance.now() - qInferStart;
    const quantumMetrics = evaluate(qScores, yte, 0);

    const cTotal = cTrainMs + cInferMs;
    const qTotal = kernelMs + qTrainMs + qInferMs;
    const ratio = (a: number, b: number) => (b === 0 ? 0 : a / b);

    const result: BenchmarkResult = {
      experiment_id: crypto.randomUUID(),
      executed_at: new Date().toISOString(),
      dataset: {
        name: "UCI Heart Disease (Cleveland, processed)",
        source_url: "https://archive.ics.uci.edu/dataset/45/heart+disease",
        records: ds.rows.length,
        records_used: used.length,
        features: d,
        train_samples: train.length,
        test_samples: test.length,
        positive_rate_train: ytr.reduce((s, v) => s + v, 0) / ytr.length,
        positive_rate_test: yte.reduce((s, v) => s + v, 0) / yte.length,
        fetched_at: ds.fetchedAt,
      },
      configuration: {
        qubits,
        test_size: testSize,
        random_seed: seed,
        quantum_features: corr.map((c) => c.name),
        feature_map: `ZZ-style feature map, ${reps} repetitions, ${qubits} qubits`,
        backend: "In-app full statevector simulation (classical hardware)",
      },
      classical: {
        model: "Logistic regression (batch gradient descent, 800 iterations)",
        ...classicalMetrics,
        training_time_ms: cTrainMs,
        inference_time_ms: cInferMs,
        total_time_ms: cTotal,
      },
      quantum: {
        model: "Quantum kernel SVM (fidelity kernel, SMO)",
        ...quantumMetrics,
        kernel_time_ms: kernelMs,
        training_time_ms: qTrainMs,
        inference_time_ms: qInferMs,
        total_time_ms: qTotal,
        kernel_matrix: `${train.length} × ${train.length} train, ${test.length} × ${train.length} test`,
        support_vectors: svm.alpha.filter((a) => a > 1e-8).length,
      },
      comparison: {
        accuracy_delta: quantumMetrics.accuracy - classicalMetrics.accuracy,
        precision_delta: quantumMetrics.precision - classicalMetrics.precision,
        recall_delta: quantumMetrics.recall - classicalMetrics.recall,
        f1_delta: quantumMetrics.f1 - classicalMetrics.f1,
        roc_auc_delta: quantumMetrics.roc_auc - classicalMetrics.roc_auc,
        training_time_ratio: ratio(qTrainMs, cTrainMs),
        inference_time_ratio: ratio(qInferMs, cInferMs),
        total_time_ratio: ratio(qTotal, cTotal),
      },
      persisted: false,
      persistence_note: "",
    };

    // Persist the experiment so the page can show the latest result after reload.
    try {
      const { supabase, userId } = context;
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", userId)
        .maybeSingle();
      const { data: study } = await supabase
        .from("studies")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (profile?.org_id && study?.id) {
        const { error } = await supabase.from("optimization_runs").insert({
          org_id: profile.org_id,
          study_id: study.id,
          method: "heart_quantum_kernel_benchmark",
          backend: "statevector_simulation",
          objective: result.quantum.roc_auc,
          qubo_size: qubits,
          runtime_ms: Math.round(qTotal + cTotal),
          assignment: [],
          metrics: result as unknown as Record<string, unknown>,
          created_by: userId,
        });
        if (error) {
          result.persistence_note = `Result not stored: ${error.message}`;
        } else {
          result.persisted = true;
        }
      } else {
        result.persistence_note =
          "Result not stored: an experiment record needs a workspace study, and none exists yet.";
      }
    } catch (error) {
      result.persistence_note = `Result not stored: ${error instanceof Error ? error.message : "unknown error"}`;
    }

    return result;
  });
