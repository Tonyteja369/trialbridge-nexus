import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ClipboardCheck,
  FileLock2,
  GitBranch,
  ListChecks,
  Radar,
} from "lucide-react";
import { SafetyBanner } from "@/components/SafetyBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrialBridge — Clinical Trial Recruitment & Research Operations" },
      {
        name: "description",
        content:
          "TrialBridge helps research teams shortlist potentially eligible participants, record consent, coordinate visits and audit every decision — with human review at every step.",
      },
      { property: "og:title", content: "TrialBridge — Clinical Research Operations Platform" },
      {
        property: "og:description",
        content:
          "Explainable participant screening, consent tracking, site allocation and audit trails for clinical research teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Radar,
    title: "Explainable shortlisting",
    body: "Every candidate carries a criterion-by-criterion breakdown: what was observed, what the protocol requires, and where data is missing.",
  },
  {
    icon: ClipboardCheck,
    title: "Human review gate",
    body: "Suggestions never move a participant forward on their own. A named reviewer confirms, overrides and signs each transition.",
  },
  {
    icon: FileLock2,
    title: "Consent-first workflow",
    body: "Enrolment is blocked without recorded consent, and a revocation instantly withdraws the participant from outreach.",
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

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold tracking-tight">TrialBridge</span>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Clinical research operations
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Recruitment and study coordination that a research team can actually defend.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          TrialBridge replaces the spreadsheet-and-phone-call pipeline with one auditable workflow:
          screen a registry against protocol criteria, review every suggestion, capture consent,
          allocate sites and track visits, tasks and follow-ups.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Open the workspace
          </Link>
          <a
            href="#how"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            How it works
          </a>
        </div>
        <div className="mt-10 max-w-3xl">
          <SafetyBanner />
        </div>
      </section>

      <section id="how" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title}>
              <f.icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold">The journey the platform records</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Study setup", "Protocol version, sites, and machine-checkable inclusion/exclusion criteria."],
            ["Screening", "The registry is scored against current criteria; each result is explained."],
            ["Human review", "A coordinator or investigator confirms, overrides or rejects with a note."],
            ["Coordination", "Consent, site allocation, visits, tasks and notifications — all audited."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-lg border border-border bg-card p-5">
              <span className="font-display text-sm text-primary">0{i + 1}</span>
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        TrialBridge — hackathon prototype. Sample records only; no real patient data.
      </footer>
    </main>
  );
}
