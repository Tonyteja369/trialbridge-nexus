"""
ClinQSphereX — QAOA experiment for research-site allocation.

Runs OUTSIDE the deployed web app (the app solves the same QUBO classically).
This script reproduces the app's model in Qiskit and compares:

    1. exact brute-force minimum        (ground truth for small instances)
    2. classical simulated annealing    (what the web app uses)
    3. QAOA on the Aer statevector simulator
    4. optional: QAOA on IBM Quantum hardware (--backend ibm)

Nothing here claims quantum advantage. The purpose is an honest, reproducible
benchmark of the same objective on three solvers.

Install:
    pip install -r quantum/requirements.txt
Run:
    python quantum/site_allocation_qaoa.py --candidates 3 --sites 2
    python quantum/site_allocation_qaoa.py --backend ibm --shots 2048   # needs IBM_QUANTUM_TOKEN
"""

from __future__ import annotations

import argparse
import itertools
import json
import os
import random
import time
from dataclasses import dataclass, field

import numpy as np


@dataclass
class Candidate:
    cid: str
    score: float
    distance_km: dict[str, float] = field(default_factory=dict)


@dataclass
class Site:
    sid: str
    capacity: int


def build_qubo(
    candidates: list[Candidate],
    sites: list[Site],
    penalty_one_site: float = 150.0,
    penalty_capacity: float = 40.0,
    travel_weight: float = 1.5,
) -> tuple[np.ndarray, list[tuple[str, str]]]:
    """Identical formulation to src/lib/qubo.ts."""
    variables = [(c.cid, s.sid) for c in candidates for s in sites]
    index = {v: i for i, v in enumerate(variables)}
    n = len(variables)
    Q = np.zeros((n, n))

    for c in candidates:
        for s in sites:
            i = index[(c.cid, s.sid)]
            dist = c.distance_km.get(s.sid, 25.0)
            Q[i, i] += -(c.score - travel_weight * dist)

    # at most one site per candidate
    for c in candidates:
        idxs = [index[(c.cid, s.sid)] for s in sites]
        for a, b in itertools.combinations(idxs, 2):
            Q[a, b] += 2 * penalty_one_site

    # site capacity: P * (sum_i x_is - capacity)^2
    for s in sites:
        idxs = [index[(c.cid, s.sid)] for c in candidates]
        for i in idxs:
            Q[i, i] += penalty_capacity * (1 - 2 * s.capacity)
        for a, b in itertools.combinations(idxs, 2):
            Q[a, b] += 2 * penalty_capacity

    return Q, variables


def energy(Q: np.ndarray, x: np.ndarray) -> float:
    return float(x @ np.triu(Q) @ x)


def brute_force(Q: np.ndarray) -> tuple[float, np.ndarray]:
    n = Q.shape[0]
    best_e, best_x = float("inf"), np.zeros(n, dtype=int)
    for bits in itertools.product([0, 1], repeat=n):
        x = np.array(bits)
        e = energy(Q, x)
        if e < best_e:
            best_e, best_x = e, x
    return best_e, best_x


def simulated_annealing(Q: np.ndarray, iterations: int = 20000, seed: int = 7):
    rng = random.Random(seed)
    n = Q.shape[0]
    x = np.zeros(n, dtype=int)
    e = energy(Q, x)
    best_e, best_x = e, x.copy()
    temperature = 200.0
    for _ in range(iterations):
        i = rng.randrange(n)
        x[i] ^= 1
        new_e = energy(Q, x)
        if new_e <= e or rng.random() < np.exp(-(new_e - e) / max(temperature, 1e-3)):
            e = new_e
            if e < best_e:
                best_e, best_x = e, x.copy()
        else:
            x[i] ^= 1
        temperature *= 0.9995
    return best_e, best_x


def run_qaoa(Q: np.ndarray, reps: int, shots: int, backend_kind: str):
    """QAOA on the current Qiskit stack (qiskit>=1.0 primitives)."""
    from qiskit.quantum_info import SparsePauliOp
    from qiskit.circuit.library import QAOAAnsatz
    from scipy.optimize import minimize

    n = Q.shape[0]
    # QUBO (x in {0,1}) -> Ising (z in {-1,+1}) with x = (1 - z) / 2
    terms: dict[tuple[int, ...], float] = {}
    offset = 0.0
    for i in range(n):
        qii = Q[i, i]
        offset += qii / 2
        terms[(i,)] = terms.get((i,), 0.0) - qii / 2
        for j in range(i + 1, n):
            qij = Q[i, j]
            if qij == 0:
                continue
            offset += qij / 4
            terms[(i,)] = terms.get((i,), 0.0) - qij / 4
            terms[(j,)] = terms.get((j,), 0.0) - qij / 4
            terms[(i, j)] = terms.get((i, j), 0.0) + qij / 4

    paulis = []
    coeffs = []
    for idxs, coeff in terms.items():
        label = ["I"] * n
        for k in idxs:
            label[n - 1 - k] = "Z"
        paulis.append("".join(label))
        coeffs.append(coeff)
    hamiltonian = SparsePauliOp(paulis, coeffs)

    ansatz = QAOAAnsatz(cost_operator=hamiltonian, reps=reps)
    ansatz.measure_all()

    if backend_kind == "ibm":
        from qiskit_ibm_runtime import QiskitRuntimeService, Session
        from qiskit_ibm_runtime import EstimatorV2, SamplerV2
        from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

        service = QiskitRuntimeService(token=os.environ["IBM_QUANTUM_TOKEN"], channel="ibm_quantum")
        backend = service.least_busy(operational=True, simulator=False)
        pm = generate_preset_pass_manager(optimization_level=3, backend=backend)
        isa = pm.run(ansatz)
        session = Session(backend=backend)
        estimator = EstimatorV2(mode=session)
        sampler = SamplerV2(mode=session)
        observable = hamiltonian.apply_layout(isa.layout)
    else:
        from qiskit.primitives import StatevectorEstimator as EstimatorV2
        from qiskit.primitives import StatevectorSampler as SamplerV2

        isa = ansatz
        observable = hamiltonian
        estimator = EstimatorV2()
        sampler = SamplerV2()
        session = None

    history: list[float] = []

    def cost(params):
        job = estimator.run([(isa.remove_final_measurements(inplace=False), observable, params)])
        value = float(job.result()[0].data.evs)
        history.append(value)
        return value

    x0 = np.random.default_rng(11).uniform(0, np.pi, ansatz.num_parameters)
    started = time.time()
    res = minimize(cost, x0, method="COBYLA", options={"maxiter": 120})
    job = sampler.run([(isa, res.x)], shots=shots)
    counts = job.result()[0].data.meas.get_counts()
    if session is not None:
        session.close()

    best_bits = max(counts, key=counts.get)
    x = np.array([int(b) for b in best_bits[::-1]])
    return energy(Q, x), x, {
        "iterations": len(history),
        "wall_seconds": round(time.time() - started, 2),
        "shots": shots,
        "reps": reps,
        "num_qubits": n,
        "depth": isa.depth(),
        "unique_bitstrings": len(counts),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates", type=int, default=3)
    ap.add_argument("--sites", type=int, default=2)
    ap.add_argument("--reps", type=int, default=2)
    ap.add_argument("--shots", type=int, default=1024)
    ap.add_argument("--backend", choices=["aer", "ibm"], default="aer")
    args = ap.parse_args()

    rng = random.Random(3)
    sites = [Site(f"S{j}", capacity=max(1, args.candidates // args.sites)) for j in range(args.sites)]
    candidates = [
        Candidate(
            f"C{i}",
            score=rng.uniform(55, 98),
            distance_km={s.sid: rng.uniform(3, 40) for s in sites},
        )
        for i in range(args.candidates)
    ]

    Q, variables = build_qubo(candidates, sites)
    print(f"QUBO: {Q.shape[0]} binary variables / qubits, {int((Q != 0).sum())} non-zero terms")

    exact_e, exact_x = brute_force(Q)
    sa_e, _ = simulated_annealing(Q)
    print(f"exact brute force      : {exact_e:.3f}")
    print(f"simulated annealing    : {sa_e:.3f}  (solver used by the web app)")

    try:
        qaoa_e, qaoa_x, meta = run_qaoa(Q, args.reps, args.shots, args.backend)
        print(f"QAOA ({args.backend:<3})            : {qaoa_e:.3f}  {json.dumps(meta)}")
        print(f"QAOA matches exact optimum: {bool(abs(qaoa_e - exact_e) < 1e-6)}")
    except Exception as exc:  # simulator/hardware unavailable -> classical result still stands
        print(f"QAOA unavailable ({exc}); classical results above remain valid.")

    assignment = [
        variables[i] for i, bit in enumerate(exact_x) if bit
    ]
    print("exact assignment (candidate, site):", assignment)


if __name__ == "__main__":
    main()
