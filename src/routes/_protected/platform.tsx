import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { SafetyBanner } from "@/components/SafetyBanner";

export const Route = createFileRoute("/_protected/platform")({
  head: () => ({
    meta: [
      { title: "Platform — ClinQSphereX" },
      {
        name: "description",
        content:
          "The ClinQSphereX modules: study command center, candidate intelligence, clinical data hub, eligibility screening, research operations, explainability, quantum research lab and governance.",
      },
      { property: "og:title", content: "Platform — ClinQSphereX" },
      {
        property: "og:description",
        content: "Eight modules covering recruitment, screening, operations and governance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlatformPage,
});

const modules: [string, string, string][] = [
  [
    "Study Command Center",
    "One workspace per study",
    "Protocol version, eligibility criteria, research sites, candidate pipeline, consent posture, visits, tasks and the study's audit trail.",
  ],
  [
    "Candidate Intelligence",
    "Ranked shortlist with reasons",
    "Candidates are ranked by a deterministic criterion score with per-criterion outcomes and a confidence level. Ranking is not an eligibility decision.",
  ],
  [
    "Clinical Data Hub",
    "Synthetic research data today",
    "Participant records with demographics, conditions, medications and structured attributes. FHIR and EHR ingestion are architecture-ready, not connected.",
  ],
  [
    "Eligibility Screening",
    "PASS / FAIL / UNKNOWN per criterion",
    "Each inclusion and exclusion criterion is evaluated separately against the study's current protocol version, with the observed value shown as evidence.",
  ],
  [
    "Research Operations",
    "The coordinator's day",
    "Participant status, consent, visits, tasks, sites and documents in one pipeline, with a job queue for outreach that retries and dead-letters safely.",
  ],
  [
    "Explainability",
    "Why a candidate was suggested",
    "Every score is decomposed into criterion contributions. Contributions describe the model's arithmetic, not causality.",
  ],
  [
    "Quantum Research Lab",
    "Experimental, clearly labelled",
    "Site and slot allocation is expressed as a QUBO, solved classically in-app and exported for Qiskit experiments. No quantum advantage is assumed.",
  ],
  [
    "Governance & Audit",
    "Every action attributable",
    "Authentication, organisation-scoped roles, and an append-only audit record of who acted, what changed and against which protocol version.",
  ],
];

const workflow = [
  "Study setup",
  "Clinical data",
  "Candidate discovery",
  "Eligibility screening",
  "AI-assisted analysis",
  "Explainability",
  "Human review",
  "Research action",
];

function PlatformPage() {
  return (
    <>
      <PublicNav />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <h1 className="font-display text-3xl font-semibold">Platform</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          ClinQSphereX connects study protocols, clinical data, candidate screening, explainable
          machine learning and research operations in one human-centered workflow.
        </p>

        <section aria-labelledby="flow" className="mt-10">
          <h2 id="flow" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            End-to-end workflow
          </h2>
          <ol className="mt-4 flex flex-wrap gap-2">
            {workflow.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="font-display text-xs font-semibold tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="modules" className="mt-12">
          <h2 id="modules" className="font-display text-2xl font-semibold">
            Modules
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {modules.map(([title, tag, body]) => (
              <article key={title} className="surface lift p-5">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">
                  {tag}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-12 max-w-3xl">
          <SafetyBanner />
        </div>

        <div className="mt-10">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Researcher Sign In
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
