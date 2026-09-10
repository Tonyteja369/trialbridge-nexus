import { createFileRoute, Link } from "@tanstack/react-router";
import { SafetyBanner } from "@/components/SafetyBanner";
import { PublicFooter, PublicNav } from "@/components/PublicNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClinQSphereX — Clinical Trial Recruitment & Research Operations" },
      {
        name: "description",
        content:
          "ClinQSphereX connects study protocols, clinical data, candidate screening, explainable machine learning and research operations in one human-centered workflow.",
      },
      { property: "og:title", content: "ClinQSphereX — Clinical Research Operations Platform" },
      {
        property: "og:description",
        content:
          "Evidence-based screening support, consent tracking, visits, tasks and audit for clinical research teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

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

const fragmentation: [string, string][] = [
  ["Spreadsheets", "Candidate lists live in files that drift out of sync with the protocol."],
  ["Email threads", "Screening decisions and their reasons are buried in inboxes."],
  ["Phone calls", "Outreach and consent conversations leave no structured record."],
  ["Paper documents", "Consent forms and approvals are hard to version and audit."],
  ["Disconnected systems", "Clinical data, recruitment and operations never meet in one place."],
];

const modules: [string, string][] = [
  ["Study Command Center", "Protocol, criteria, sites, pipeline, consent, visits and audit for one study."],
  ["Candidate Intelligence", "Ranked shortlist with per-criterion outcomes and a confidence level."],
  ["Clinical Data Hub", "Synthetic participant records today; FHIR and EHR ingestion architecture-ready."],
  ["Eligibility Screening", "PASS / FAIL / UNKNOWN for each criterion, with the observed value as evidence."],
  ["Research Operations", "Participants, consent, visits, tasks, sites and documents in one pipeline."],
  ["Explainability", "Score decomposed into criterion contributions — arithmetic, not causality."],
  ["Quantum Research Lab", "QUBO allocation solved classically in-app, exported for Qiskit experiments."],
  ["Governance & Audit", "Roles, organisation scoping and an append-only record of every action."],
];

const governance: [string, string][] = [
  ["Human oversight", "No model output changes a participant's status without a named reviewer."],
  ["Auditability", "Who acted, what changed, when, and against which protocol version."],
  ["Privacy", "Identity data is separated from research data throughout the workflow."],
  ["Data minimisation", "Models receive only the features their task requires."],
  ["Access control", "Organisation, study and site scoped roles and permissions."],
  ["Honest claims", "No fabricated metrics and no compliance certification is claimed."],
];

function RecruitmentFunnel() {
  const stages = [
    { label: "Identified", value: 240 },
    { label: "Screened", value: 168 },
    { label: "Potentially eligible", value: 96 },
    { label: "Reviewed", value: 61 },
    { label: "Consented", value: 38 },
  ];
  const max = Math.max(...stages.map((s) => s.value));
  return (
    <figure className="surface-strong p-6">
      <figcaption className="flex flex-wrap items-center gap-2 text-sm font-medium">
        Recruitment funnel
        <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Illustrative · synthetic
        </span>
      </figcaption>
      <ul className="mt-5 space-y-3">
        {stages.map((s) => (
          <li key={s.label} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3 sm:grid-cols-[9.5rem_1fr_2.5rem]">
            <span className="truncate text-sm text-muted-foreground">{s.label}</span>
            <span className="h-2 rounded-full bg-secondary">
              <span
                className="block h-2 rounded-full bg-primary"
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-display text-sm font-semibold tabular-nums">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        Illustrative synthetic figures. Live study numbers are computed from your own data inside the
        workspace.
      </p>
    </figure>
  );
}

function Landing() {
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-background">
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-medium text-primary">
              Clinical Trial Recruitment, Participant &amp; Research Operations Platform
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] sm:text-[2.9rem]">
              Clinical trial recruitment, participant coordination, and research intelligence.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              ClinQSphereX connects study protocols, clinical data, candidate screening, explainable
              machine learning, and research operations in one human-centered workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/platform"
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Explore the Platform
              </Link>
              <Link
                to="/research"
                className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Research Overview
              </Link>
            </div>
            <div className="mt-10 max-w-xl">
              <SafetyBanner />
            </div>
          </div>
          <RecruitmentFunnel />
        </section>

        <section aria-labelledby="flow" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <h2 id="flow" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              How it works
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
          </div>
        </section>

        <section aria-labelledby="problem" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="problem" className="font-display text-2xl font-semibold">
              The research operations problem
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Recruitment and coordination are still run across tools that were never designed to
              talk to each other.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fragmentation.map(([title, body]) => (
                <li key={title} className="surface p-5">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="modules" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="modules" className="font-display text-2xl font-semibold">
                Platform modules
              </h2>
              <Link to="/platform" className="text-sm font-medium text-primary hover:underline">
                See what each module does →
              </Link>
            </div>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {modules.map(([term, detail]) => (
                <div key={term} className="surface lift p-5">
                  <dt className="text-sm font-semibold">{term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="quantum" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="quantum" className="font-display text-2xl font-semibold">
              Research &amp; Quantum Lab
            </h2>
            <div className="surface mt-6 p-6">
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Experimental research component
              </span>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Classical baselines (logistic regression, Gaussian naive Bayes) are compared with a
                quantum feature map and fidelity quantum kernel feeding a kernel SVM on Qiskit Aer.
                Experiments are recorded with their configuration and runtime.
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Quantum performance is experimentally evaluated against classical baselines.
                ClinQSphereX does not assume quantum advantage.
              </p>
              <Link
                to="/research"
                className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
              >
                Read the research overview →
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="trust" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="trust" className="font-display text-2xl font-semibold">
              Trust &amp; governance
            </h2>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {governance.map(([term, detail]) => (
                <div key={term} className="surface p-5">
                  <dt className="text-sm font-semibold">{term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              ClinQSphereX is a research prototype. It is not intended for production PHI without
              additional security, privacy, validation and regulatory controls.{" "}
              <Link to="/security" className="text-primary hover:underline">
                Read the security overview
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="surface-strong flex flex-wrap items-center justify-between gap-6 p-8">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-semibold">
                From clinical data to research action.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                With evidence, intelligence and human control.
              </p>
            </div>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Researcher Sign In
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
