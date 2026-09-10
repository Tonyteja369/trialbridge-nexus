import { createFileRoute, Link } from "@tanstack/react-router";
import { SafetyBanner } from "@/components/SafetyBanner";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { DiseaseExplorer } from "@/components/DiseaseExplorer";
import { TrialSearch } from "@/components/TrialSearch";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { ProvenanceTag } from "@/components/DataProvenance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClinQSphereX — Clinical Trial Recruitment & Research Operations" },
      {
        name: "description",
        content:
          "Find relevant clinical trials and screen potential candidates for heart disease, cancer, diabetes, stroke and more — with evidence, explainable models and researcher review at every step.",
      },
      { property: "og:title", content: "ClinQSphereX — From clinical data to research action" },
      {
        property: "og:description",
        content:
          "Disease-centred trial discovery, structured eligibility screening, explainable models and experimental quantum benchmarks — researchers decide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const challenges: [string, string][] = [
  ["Every trial needs the right participants", "Recruitment shortfalls delay or end studies that were otherwise ready to run."],
  ["Eligibility lives in prose", "Protocol criteria are written for humans, then checked by hand against scattered records."],
  ["Data grows faster than review capacity", "Clinical records accumulate continuously; manual chart review does not scale with them."],
  ["Decisions leave no trail", "Screening reasoning ends up in spreadsheets, inboxes and phone calls instead of the study record."],
];

const storyFlow = [
  "Disease area",
  "Current clinical trials",
  "Eligibility criteria",
  "Synthetic candidate population",
  "Candidate screening",
  "Classical ML + experimental quantum kernel",
  "Prediction",
  "Feature-contribution explanation",
  "Human researcher",
  "Research action",
];

const scaleFacts: [string, string, string, string][] = [
  [
    "Clinical trials",
    "Hundreds of thousands of studies are registered on the public ClinicalTrials.gov registry.",
    "ClinicalTrials.gov",
    "https://clinicaltrials.gov/",
  ],
  [
    "Scientific literature",
    "Tens of millions of biomedical citations are indexed in PubMed.",
    "PubMed (NLM)",
    "https://pubmed.ncbi.nlm.nih.gov/",
  ],
  [
    "Sequence archives",
    "Public sequence archives hold hundreds of millions of records across GenBank and the SRA.",
    "NCBI GenBank / SRA",
    "https://www.ncbi.nlm.nih.gov/",
  ],
  [
    "Research cohorts",
    "Large cohorts such as UK Biobank and NIH All of Us enrol hundreds of thousands of participants under controlled access.",
    "UK Biobank · NIH All of Us",
    "https://allofus.nih.gov/",
  ],
];

const benchmarkMetrics = [
  "Accuracy",
  "Precision",
  "Recall",
  "F1",
  "ROC-AUC",
  "Training time",
  "Inference time",
  "Memory",
  "Scalability",
];

const genomicsChain = [
  "Large dataset",
  "Feature engineering",
  "Feature selection / reduction",
  "Small experimental representation",
  "Quantum encoding",
  "Quantum kernel",
  "Classification",
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
        <ProvenanceTag kind="synthetic" />
      </figcaption>
      <ul className="mt-5 space-y-3">
        {stages.map((s) => (
          <li
            key={s.label}
            className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3 sm:grid-cols-[9.5rem_1fr_2.5rem]"
          >
            <span className="truncate text-sm text-muted-foreground">{s.label}</span>
            <span className="h-2 rounded-full bg-secondary">
              <span
                className="block h-2 rounded-full bg-primary"
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-display text-sm font-semibold tabular-nums">{s.value}</span>
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
        {/* 1 — Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-medium text-primary">
              Clinical Trial Recruitment, Participant &amp; Research Operations Platform
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] sm:text-[2.9rem]">
              Finding the right clinical trial for the right patient shouldn't take weeks.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              ClinQSphereX connects clinical-trial information, patient-like research data, eligibility
              criteria, machine learning and experimental quantum methods into one human-centered
              research workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/diseases/$slug"
                params={{ slug: "heart-cardiovascular" }}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Explore heart disease trials
              </Link>
              <a
                href="#how-it-works"
                className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                See how it works
              </a>
            </div>
            <div className="mt-10 max-w-xl">
              <SafetyBanner />
            </div>
          </div>
          <RecruitmentFunnel />
        </section>

        {/* 2 — The research challenge */}
        <section aria-labelledby="challenge" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="challenge" className="font-display text-2xl font-semibold">
              The research challenge
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Finding eligible participants is one of the biggest operational challenges in clinical
              research — and it is still largely manual.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {challenges.map(([title, body]) => (
                <li key={title} className="surface p-5">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3 — Disease explorer */}
        <section aria-labelledby="diseases" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="diseases" className="font-display text-2xl font-semibold">
                  Explore research by disease
                </h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Each area has its own eligibility problem. Start with the one you work in.
                </p>
              </div>
              <Link to="/diseases" className="text-sm font-medium text-primary hover:underline">
                All disease areas →
              </Link>
            </div>
            <div className="mt-8">
              <DiseaseExplorer />
            </div>
          </div>
        </section>

        {/* 4 + 5 — Heart demonstration and live trial discovery */}
        <section aria-labelledby="heart" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="heart" className="font-display text-2xl font-semibold">
              Heart disease research intelligence
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Cardiovascular research is the primary demonstration: routine measurements, large trial
              activity and criteria that translate cleanly into structured checks.
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <div className="surface p-5">
                <h3 className="text-sm font-semibold">Conditions</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {[
                    "Coronary artery disease",
                    "Heart failure",
                    "Atrial fibrillation",
                    "Hypertension",
                    "Cardiomyopathy",
                  ].map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="surface p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Research variables</h3>
                  <ProvenanceTag kind="synthetic" />
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {[
                    "Age",
                    "Blood pressure",
                    "Heart rate",
                    "BMI",
                    "Relevant laboratory values",
                    "Medical and medication history",
                  ].map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="surface p-5">
                <h3 className="text-sm font-semibold">Three-state screening</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <OutcomeBadge outcome="met" />
                  <OutcomeBadge outcome="not_met" />
                  <OutcomeBadge outcome="unknown" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Missing information stays UNKNOWN. It is never silently converted into a pass, and a
                  candidate is only ever described as <em>potentially relevant</em>.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <TrialSearch initialCondition="heart failure" />
            </div>
            <div className="mt-6">
              <Link
                to="/diseases/$slug"
                params={{ slug: "heart-cardiovascular" }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open the full cardiovascular research page →
              </Link>
            </div>
          </div>
        </section>

        {/* 6 — Disease → trial → candidate story */}
        <section aria-labelledby="how-it-works" id="how-it-works" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="how-it-works" className="font-display text-2xl font-semibold">
              From a disease to a research decision
            </h2>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {storyFlow.map((step, i) => (
                <li key={step} className="surface flex items-start gap-2 p-4 text-sm">
                  <span className="font-display text-xs font-semibold tabular-nums text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
              The chain always ends with a person. A model can rank and explain; only a qualified
              researcher decides what happens next.
            </p>
          </div>
        </section>

        {/* 7 — Benchmark lab */}
        <section aria-labelledby="benchmark" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="benchmark" className="font-display text-2xl font-semibold">
                Classical AI vs quantum ML
              </h2>
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Experimental
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Both approaches are compared on the same dataset, the same features, the same split and
              the same evaluation protocol. Where a value has not been measured, the workspace shows{" "}
              <strong className="font-semibold text-foreground">Not evaluated</strong> — never a
              placeholder number.
            </p>
            <div className="surface mt-8 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <caption className="sr-only">Benchmark metrics compared between approaches</caption>
                <thead className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Metric
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Classical baseline
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Quantum kernel
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkMetrics.map((m) => (
                    <tr key={m} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{m}</td>
                      <td className="px-4 py-3 text-muted-foreground">Not evaluated</td>
                      <td className="px-4 py-3 text-muted-foreground">Not evaluated</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Measured values appear in the workspace Quantum Lab once an experiment has been recorded.
              Scaling behaviour (dataset size against training and inference time) is reported from the
              same recorded runs. ClinQSphereX does not assume quantum advantage.
            </p>
            <Link to="/research" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
              Read the research method →
            </Link>
          </div>
        </section>

        {/* 8 — Research data at global scale */}
        <section aria-labelledby="scale" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="scale" className="font-display text-2xl font-semibold">
              Modern biomedical research runs at massive scale
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              These are figures about the public research ecosystem, not about ClinQSphereX.
              ClinQSphereX demonstrates how selected clinical and research features can be turned into
              structured trial intelligence.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {scaleFacts.map(([title, body, source, href]) => (
                <li key={title} className="surface p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <ProvenanceTag kind="reference" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    Source:{" "}
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary hover:underline"
                    >
                      {source}
                    </a>{" "}
                    · Type: public research resource · Access: open (cohort data is controlled access)
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 9 — Genomics */}
        <section aria-labelledby="genomics" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="genomics" className="font-display text-2xl font-semibold">
              From genome-scale research to trial intelligence
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              A quantum model does not process billions of sequences. Large datasets are reduced to a
              small set of engineered features before any quantum encoding happens — that reduction is
              the scientifically important step.
            </p>
            <ol className="mt-8 flex flex-wrap gap-2">
              {genomicsChain.map((step, i) => (
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

        {/* 10 + 11 — Explainability and human review */}
        <section aria-labelledby="explain" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="explain" className="font-display text-2xl font-semibold">
              Explanations, then a human decision
            </h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="surface p-6">
                <h3 className="text-sm font-semibold">Explainable output</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Each prediction is shown with its confidence level and the features that contributed
                  most strongly, including the direction of each contribution and the evidence value
                  behind it.
                </p>
                <p className="mt-3 rounded-md border border-border bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                  Feature-contribution methods such as SHAP describe model behaviour. They do not
                  establish clinical causality.
                </p>
              </div>
              <div className="surface p-6">
                <h3 className="text-sm font-semibold">Human review</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Every candidate carries a review state, and nobody is enrolled automatically.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                  {["Pending review", "Reviewed", "Requires more evidence", "Not relevant", "Potentially relevant"].map(
                    (s) => (
                      <li key={s} className="rounded border border-border bg-muted px-2 py-1 font-medium">
                        {s}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 12 + 13 — Operations, security and governance */}
        <section aria-labelledby="trust" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="trust" className="font-display text-2xl font-semibold">
              Research operations, security and governance
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Participants, consent, visits, tasks, sites and documents run in one pipeline, with an
              append-only record of every action.
            </p>
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

        {/* 14 + 15 — Methodology and final CTA */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="surface-strong flex flex-wrap items-center justify-between gap-6 p-8">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-semibold">
                Turn complex clinical data into research action.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Explore trials. Structure eligibility. Screen candidates. Compare models. Understand
                predictions. Keep researchers in control.
              </p>
              <p className="mt-4 text-sm font-medium">
                Research intelligence, not automated clinical decision-making.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/auth"
                className="rounded-md bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Enter ClinQSphereX
              </Link>
              <Link
                to="/research"
                className="rounded-md border border-border px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-secondary"
              >
                Research methodology
              </Link>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            ClinQSphereX is a research prototype using synthetic / Synthea-style data. External research
            sources are clearly identified, and final research decisions remain with qualified human
            reviewers.
          </p>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
