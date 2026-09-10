/**
 * Site / slot allocation for shortlisted study candidates, formulated as a
 * QUBO (Quadratic Unconstrained Binary Optimisation) problem.
 *
 * Honest scope note: the QUBO below is the SAME model that a Qiskit QAOA run
 * consumes (see quantum/site_allocation_qaoa.py). In the deployed web app the
 * model is solved CLASSICALLY (exhaustive search for tiny instances, simulated
 * annealing otherwise). No quantum hardware or simulator runs inside this app,
 * and no quantum advantage is claimed.
 */

export interface AllocCandidate {
  id: string;
  label: string;
  score: number; // 0..100 match score
  distanceKm: Record<string, number>; // siteId -> travel distance
}

export interface AllocSite {
  id: string;
  name: string;
  capacity: number;
}

export interface QuboModel {
  variables: { index: number; candidateId: string; siteId: string }[];
  /** Upper-triangular sparse matrix, key "i,j". */
  terms: Record<string, number>;
  penaltyOneSite: number;
  penaltyCapacity: number;
}

export interface AllocationResult {
  assignment: { candidateId: string; label: string; siteId: string; siteName: string }[];
  unassigned: { candidateId: string; label: string }[];
  objective: number;
  numVariables: number;
  numTerms: number;
  runtimeMs: number;
  method: "exhaustive" | "simulated_annealing";
  perSiteLoad: Record<string, number>;
}

function addTerm(terms: Record<string, number>, i: number, j: number, v: number) {
  const key = i <= j ? `${i},${j}` : `${j},${i}`;
  terms[key] = (terms[key] ?? 0) + v;
}

export function buildQubo(
  candidates: AllocCandidate[],
  sites: AllocSite[],
  opts?: { penaltyOneSite?: number; penaltyCapacity?: number; travelWeight?: number },
): QuboModel {
  const penaltyOneSite = opts?.penaltyOneSite ?? 150;
  const penaltyCapacity = opts?.penaltyCapacity ?? 40;
  const travelWeight = opts?.travelWeight ?? 1.5;

  const variables: QuboModel["variables"] = [];
  candidates.forEach((c) => {
    sites.forEach((s) => {
      variables.push({ index: variables.length, candidateId: c.id, siteId: s.id });
    });
  });

  const terms: Record<string, number> = {};
  const indexOf = new Map<string, number>();
  variables.forEach((v) => indexOf.set(`${v.candidateId}|${v.siteId}`, v.index));

  // Linear reward: prefer high match score, penalise travel distance.
  variables.forEach((v) => {
    const cand = candidates.find((c) => c.id === v.candidateId)!;
    const dist = cand.distanceKm[v.siteId] ?? 25;
    addTerm(terms, v.index, v.index, -(cand.score - travelWeight * dist));
  });

  // Each candidate is allocated to at most one site: P * sum_{s<s'} x_is x_is'
  candidates.forEach((c) => {
    const idxs = sites.map((s) => indexOf.get(`${c.id}|${s.id}`)!);
    for (let a = 0; a < idxs.length; a++) {
      for (let b = a + 1; b < idxs.length; b++) {
        addTerm(terms, idxs[a]!, idxs[b]!, 2 * penaltyOneSite);
      }
    }
  });

  // Site capacity: P * (sum_i x_is - capacity)^2 expanded over binaries.
  sites.forEach((s) => {
    const idxs = candidates.map((c) => indexOf.get(`${c.id}|${s.id}`)!);
    idxs.forEach((i) => addTerm(terms, i, i, penaltyCapacity * (1 - 2 * s.capacity)));
    for (let a = 0; a < idxs.length; a++) {
      for (let b = a + 1; b < idxs.length; b++) {
        addTerm(terms, idxs[a]!, idxs[b]!, 2 * penaltyCapacity);
      }
    }
  });

  return { variables, terms, penaltyOneSite, penaltyCapacity };
}

export function energy(model: QuboModel, x: Uint8Array): number {
  let e = 0;
  for (const [key, w] of Object.entries(model.terms)) {
    const [i, j] = key.split(",").map(Number) as [number, number];
    if (x[i] && x[j]) e += w;
  }
  return e;
}

function decode(
  model: QuboModel,
  x: Uint8Array,
  candidates: AllocCandidate[],
  sites: AllocSite[],
): Pick<AllocationResult, "assignment" | "unassigned" | "perSiteLoad"> {
  const assignment: AllocationResult["assignment"] = [];
  const seen = new Set<string>();
  const perSiteLoad: Record<string, number> = {};
  sites.forEach((s) => (perSiteLoad[s.id] = 0));

  model.variables.forEach((v) => {
    if (!x[v.index] || seen.has(v.candidateId)) return;
    const cand = candidates.find((c) => c.id === v.candidateId)!;
    const site = sites.find((s) => s.id === v.siteId)!;
    seen.add(v.candidateId);
    perSiteLoad[site.id] = (perSiteLoad[site.id] ?? 0) + 1;
    assignment.push({
      candidateId: cand.id,
      label: cand.label,
      siteId: site.id,
      siteName: site.name,
    });
  });

  const unassigned = candidates
    .filter((c) => !seen.has(c.id))
    .map((c) => ({ candidateId: c.id, label: c.label }));

  return { assignment, unassigned, perSiteLoad };
}

export function solveQubo(
  candidates: AllocCandidate[],
  sites: AllocSite[],
): AllocationResult {
  const started = Date.now();
  const model = buildQubo(candidates, sites);
  const n = model.variables.length;
  let best = new Uint8Array(n);
  let bestE = energy(model, best);
  let method: AllocationResult["method"] = "exhaustive";

  if (n <= 16) {
    const total = 1 << n;
    for (let mask = 1; mask < total; mask++) {
      const x = new Uint8Array(n);
      for (let i = 0; i < n; i++) x[i] = (mask >> i) & 1;
      const e = energy(model, x);
      if (e < bestE) {
        bestE = e;
        best = x;
      }
    }
  } else {
    method = "simulated_annealing";
    let current = new Uint8Array(n);
    let currentE = energy(model, current);
    let temperature = 200;
    const iterations = Math.min(60000, 400 * n);
    for (let step = 0; step < iterations; step++) {
      const flip = Math.floor(Math.random() * n);
      current[flip] = current[flip] ? 0 : 1;
      const e = energy(model, current);
      const delta = e - currentE;
      if (delta <= 0 || Math.random() < Math.exp(-delta / Math.max(temperature, 0.01))) {
        currentE = e;
        if (e < bestE) {
          bestE = e;
          best = Uint8Array.from(current);
        }
      } else {
        current[flip] = current[flip] ? 0 : 1;
      }
      temperature *= 0.9997;
    }
  }

  const decoded = decode(model, best, candidates, sites);
  return {
    ...decoded,
    objective: Math.round(bestE * 100) / 100,
    numVariables: n,
    numTerms: Object.keys(model.terms).length,
    runtimeMs: Date.now() - started,
    method,
  };
}
