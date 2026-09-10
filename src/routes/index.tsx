import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Atom,
  ClipboardCheck,
  FileLock2,
  GitBranch,
  ListChecks,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { SafetyBanner } from "@/components/SafetyBanner";
import { DiagnosticSphere } from "@/components/hero/DiagnosticSphere";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diagnosphere.X — Clinical Trial Recruitment & Research Operations" },
      {
        name: "description",
        content:
          "Diagnosphere.X helps research teams shortlist potentially eligible participants, record consent, coordinate visits and audit every decision. AI assists, researchers decide.",
      },
      { property: "og:title", content: "Diagnosphere.X — Clinical Research Operations Platform" },
      {
        property: "og:description",
        content:
          "Explainable screening support, consent tracking, site allocation and audit trails for clinical research teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const capabilities = [
  {
    icon: Radar,
    title: "Explainable shortlisting",
    body: "Every candidate carries a criterion-by-criterion breakdown: what was observed, what the protocol requires, and where evidence is missing.",
  },
  {
    icon: ClipboardCheck,
    title: "Researcher review required",
    body: "A suggestion never moves a participant forward on its own. A named reviewer confirms, overrides or rejects each transition with a reason.",
  },
  {
    icon: FileLock2,
    title: "Consent-first workflow",
    body: "Enrolment is blocked without recorded consent, and a revocation immediately withdraws the participant from outreach.",
  },
  {
    icon: GitBranch,
    title: "Site & slot allocation",
    body: "Approved candidates are matched to research sites with a QUBO model that respects site capacity and travel burden.",
  },
  {
    icon: ListChecks,
    title: "Coordinator operations",
    body: "Visits, tasks, follow-ups and documents in one pipeline instead of spreadsheets and phone notes.",
  },
  {
    icon: Activity,
    title: "Reliability by design",
    body: "Notifications run through an idempotent queue with bounded retries, dead-letter handling and a full audit trail.",
  },
];

const outcomes = [
  ["MATCH / NOT MATCHED / UNKNOWN", "Three-state criterion results. Missing evidence stays UNKNOWN — it is never treated as a match."],
  ["Evidence lineage", "Each result records the observed value, its source record and the timestamp it was read from."],
  ["Model prediction, not diagnosis", "Scores are ranked screening support. They never state eligibility or a clinical finding."],
  ["Every action audited", "Who acted, what changed, when, and against which protocol version."],
];

const journey = [
  ["Study setup", "Protocol version, research sites and machine-checkable inclusion/exclusion criteria."],
  ["Screening support", "The registry is scored against the current criteria and every result is explained."],
  ["Researcher review", "A coordinator or investigator confirms, overrides or rejects with a recorded reason."],
  ["Coordination", "Consent, site allocation, visits, tasks and notifications — all audited."],
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] grid-veil" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-display text-lg font-semibold tracking-tight">
            Diagnosphere<span className="text-primary">.X</span>
          </span>
          <nav className="flex items-center gap-6">
            <a
              href="#capabilities"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Platform
            </a>
            <a
              href="#journey"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Workflow
            </a>
            <Link
              to="/auth"
              className="rounded-full border border-primary/40 bg-primary/15 px-5 py-2 text-sm font-medium text-foreground backdrop-blur transition-all duration-300 hover:border-primary/70 hover:bg-primary/25"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            Clinical research operations
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
            <span className="text-gleam">AI assists.</span>
            <br />
            Researchers decide.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Diagnosphere.X replaces the spreadsheet-and-phone-call pipeline with one auditable
            workflow: screen a registry against protocol criteria, review every suggestion, capture
            consent, allocate sites and track visits, tasks and follow-ups.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_-18px_var(--glow-cyan)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Open the workspace
            </Link>
            <a
              href="#journey"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors duration-300 hover:border-primary/60 hover:bg-card/60"
            >
              How it works
            </a>
          </div>
          <div className="mt-10 max-w-xl">
            <SafetyBanner />
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, var(--glow-cyan), transparent 65%)" }}
          />
          <DiagnosticSphere />
        </div>
      </section>

      <section id="capabilities" className="relative z-10 border-y border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl font-display text-3xl font-semibold">
            One connected workflow, from protocol to audit trail
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <article key={c.title} className="surface lift p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-primary/12">
                  <c.icon className="size-5 text-primary" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold">Built to be defensible</h2>
            <p className="mt-4 text-muted-foreground">
              Screening is deterministic and rule-based against the study&apos;s current protocol
              version. Nothing is inferred that the recorded data does not support.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {outcomes.map(([term, detail]) => (
              <div key={term} className="surface p-5">
                <dt className="font-display text-sm font-semibold text-primary">{term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="journey" className="relative z-10 border-y border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-semibold">The journey the platform records</h2>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map(([title, body], i) => (
              <li key={title} className="surface lift p-6">
                <span className="font-display text-sm font-semibold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="surface-strong flex flex-wrap items-center justify-between gap-6 p-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Atom className="size-3.5 text-primary" aria-hidden />
              Quantum research lab
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              We don&apos;t assume quantum advantage
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Site allocation is expressed as a QUBO and solved classically inside the app. The same
              model is exported for Qiskit experiments so classical and quantum-kernel approaches can
              be compared on identical inputs. No quantum hardware runs here, and no advantage is
              claimed.
            </p>
          </div>
          <Link
            to="/auth"
            className="rounded-full border border-primary/40 bg-primary/15 px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:bg-primary/25"
          >
            Explore the workspace
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/70 py-10 text-center text-sm text-muted-foreground">
        Diagnosphere.X — prototype. Synthetic sample records only; no real patient data.
      </footer>
    </main>
  );
}
