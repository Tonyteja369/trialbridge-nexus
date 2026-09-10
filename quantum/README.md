# Diagnosphere.X quantum experiments

## What the quantum component is for

> "The optimiser is being used to solve **assignment of reviewer-approved study
> candidates to research sites under per-site weekly capacity limits, minimising
> travel burden while maximising match quality**."

That is a constrained combinatorial assignment problem, which maps naturally to a
QUBO and therefore to QAOA. It is the only part of Diagnosphere.X where a quantum
formulation is honest — screening itself is a rule-based, explainable
classical engine, and a quantum classifier there would add opacity to a workflow
that must stay reviewable.

## Honest status

| Claim | Status |
| --- | --- |
| QUBO model of site allocation | Implemented, used in production app |
| Classical exact + annealing solver in the app | Implemented |
| QAOA on Aer statevector simulator | Implemented in this script |
| QAOA on IBM Quantum hardware | Implemented, opt-in via `--backend ibm` |
| Quantum advantage | **Not demonstrated.** At these problem sizes the classical exact solver is faster and optimal. |
| Clinical validation | **Not demonstrated in this prototype.** |

The deployed web app never calls a QPU or a quantum simulator. It solves the same
QUBO classically, so the product works fully offline and without IBM Quantum
access.

## Run

```bash
pip install -r quantum/requirements.txt
python quantum/site_allocation_qaoa.py --candidates 3 --sites 2      # 6 qubits
python quantum/site_allocation_qaoa.py --candidates 4 --sites 2 --reps 3
IBM_QUANTUM_TOKEN=... python quantum/site_allocation_qaoa.py --backend ibm --shots 2048
```

The script prints, for the same objective:

1. exact brute-force optimum,
2. simulated annealing (the app's solver),
3. QAOA energy, qubit count, circuit depth, shots and wall time,
4. whether QAOA reached the exact optimum.

## Resource budget

| Instance | Qubits (candidates × sites) | Brute-force states | QAOA depth (reps=2, Aer) |
| --- | --- | --- | --- |
| 3 × 2 | 6 | 64 | ~30 |
| 4 × 2 | 8 | 256 | ~45 |
| 4 × 3 | 12 | 4096 | ~90 |

Keep experiments at or below 12 qubits during a hackathon: COBYLA with 120
iterations on the statevector simulator finishes in seconds, and hardware runs
stay within a small number of queued jobs.

## Failure plan

- QPU unavailable or queued → Aer statevector simulator.
- Aer unavailable → the script reports it and the classical benchmarks still print.
- QAOA does not beat classical → report that honestly; the contribution is the
  model and the benchmark, not a speed claim.
