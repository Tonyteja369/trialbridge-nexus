import { createFileRoute, Link } from "@tanstack/react-router";
import { SafetyBanner } from "@/components/SafetyBanner";
import { Wordmark } from "@/components/Wordmark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClinQSphereX — Clinical Trial Recruitment & Research Operations" },
      {
        name: "description",
        content:
          "ClinQSphereX connects clinical data, study criteria, participant screening and research operations in one human-controlled workflow. Screening support only — researchers decide.",
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
  "Study",
  "Protocol",
  "Clinical data",
  "Candidate discovery",
  "Screening",
  "Human review",
  "Consent",
  "Visits",
  "Tasks",
  "Follow-up",
  "Audit",
];

const fragmentation = [
  ["Spreadsheets", "Candidate lists live in files that drift out of sync with the protocol."],
  ["Email threads", "Screening decisions and their reasons are buried in inboxes."],
  ["Phone calls", "Outreach and consent conversations leave no structured record."],
  ["Paper documents", "Consent forms and approvals are hard to version and audit."],
  ["Disconnected systems", "Clinical data, recruitment and operations never meet in one place."],
];

const intelligence = [
  [
    "Protocol-aware screening",
    "Inclusion and exclusion criteria are evaluated as structured rules against the study's current protocol version.",
  ],
  [
    "Clinical evidence",
    "Each criterion shows the observed value, its source record and the timestamp it was read from.",
  ],
  [
    "Classical machine learning",
    "Logistic regression and Gaussian naive Bayes baselines, evaluated with one shared methodology.",
  ],
  [
    "Experimental quantum-kernel ML",
    "A Qiskit feature-map and fidelity-kernel pipeline, benchmarked against the classical baselines.",
  ],
  [
    "Explainability",
    "Model-level feature contribution explanations accompany every score. Contributions are not causal claims.",
  ],
];

const operations = [
  "Participant pipeline",
  "Consent",
  "Visits",
  "Tasks",
  "Sites",
  "Follow-ups",
  "Documents",
];

const governance = [
  ["Human oversight", "No model output changes a participant's status without a named reviewer."],
  ["Auditability", "Who acted, what changed, when, and against which protocol version."],
  ["Privacy", "Identity data is separated from research data throughout the workflow."],
  ["Data minimisation", "Models receive only the features their task requires."],
  ["Access control", "Organisation, study and site scoped roles and permissions."],
  ["Research governance", "ICMR-aligned ethical architecture and an IEC-oriented review workflow."],
];

function ScreeningVisual() {
  const stages = [
    { label: "Identified", value: 240 },
    { label: "Screened", value: 168 },
    { label: "Potentially eligible", value: 96 },
    { label: "Reviewed", value: 61 },
    { label: "Consented", value: 38 },
  ];
  const max = stages[0].value;
  return (
    <figure className="surface-strong p-6">
      <figcaption className="text-sm font-medium">
        Recruitment funnel
        <span className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Demo data · synthetic
        </span>
      </figcaption>
      <ul className="mt-5 space-y-3">
        {stages.map((s) => (
          <li key={s.label} className="grid grid-cols-[9.5rem_1fr_2.5rem] items-center gap-3">
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
    <main className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav aria-label="Main" className="flex items-center gap-6">
            <a href="#platform" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
              Platform
            </a>
            <a href="#research" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
              Research
            </a>
            <a href="#security" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
              Security
            </a>
            <a href="#about" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
              About
            </a>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Researcher Sign In
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-medium text-primary">
            Clinical Trial Recruitment, Participant &amp; Research Operations Platform
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] sm:text-[2.9rem]">
            Clinical trial recruitment, participant coordination, and research intelligence.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Connect clinical data, study criteria, participant screening and research operations in
            one human-controlled workflow.
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            From clinical data to research action — with evidence, intelligence and human control.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#platform"
              className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Explore Platform
            </a>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Researcher Sign In
            </Link>
          </div>
          <div className="mt-10 max-w-xl">
            <SafetyBanner />
          </div>
        </div>
        <ScreeningVisual />
      </section>

      <section id="platform" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold">The research operations problem</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Recruitment and coordination are still run across tools that were never designed to talk
            to each other.
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

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold">How ClinQSphereX works</h2>
        <ol className="mt-8 flex flex-wrap gap-2">
          {workflow.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="font-display text-xs font-semibold text-primary tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section id="research" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold">Clinical intelligence</h2>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {intelligence.map(([term, detail]) => (
              <div key={term} className="surface lift p-5">
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold">Research operations</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The coordinator's day, in one place — with every change recorded.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {operations.map((item) => (
              <li
                key={item}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold">Research &amp; Quantum Lab</h2>
        <div className="mt-6 surface p-6">
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Experimental quantum ML
          </span>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Quantum work in ClinQSphereX is a research component, not a product claim. A documented
            feature-map and fidelity-kernel pipeline runs on Qiskit Aer and is compared with
            classical baselines on identical data. Experiments are logged with dataset version,
            parameters, seed and runtime.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Quantum advantage has not been assumed; the platform is designed to experimentally
            evaluate quantum-kernel approaches against classical baselines.
          </p>
        </div>
      </section>

      <section id="security" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold">Trust &amp; governance</h2>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {governance.map(([term, detail]) => (
              <div key={term} className="surface p-5">
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            ICMR-aligned, CDSCO/NDCTR-aware, ICH GCP-oriented, GDPR-oriented and FHIR-based
            architecture. These describe design intent, not certification or regulatory approval.
          </p>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-5 py-20">
        <div className="surface-strong flex flex-wrap items-center justify-between gap-6 p-8">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold">
              Bring your research workflow together.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Study setup, screening support, human review, consent, visits, tasks and audit — in one
              workspace for research teams.
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

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-5 text-sm text-muted-foreground">
          ClinQSphereX — research prototype. Demo records are synthetic (Synthea-style) and are not
          real patient data.
        </div>
      </footer>
    </main>
  );
}
