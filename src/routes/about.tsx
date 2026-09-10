import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicNav } from "@/components/PublicNav";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ClinQSphereX" },
      {
        name: "description",
        content:
          "ClinQSphereX is a clinical trial recruitment, participant and research operations platform built around evidence, explainability and human decision-making.",
      },
      { property: "og:title", content: "About — ClinQSphereX" },
      {
        property: "og:description",
        content: "Why the platform exists and the principles it is built on.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const principles: [string, string][] = [
  ["Human control", "The system recommends and explains. A named researcher decides."],
  ["Evidence first", "Every screening outcome shows the observed value it was based on."],
  ["Honest uncertainty", "Missing data stays UNKNOWN. It is never converted into a match."],
  ["No overclaiming", "No fabricated metrics, no unverified compliance claims, no assumed quantum advantage."],
  ["Operational realism", "Built around the work coordinators actually do: outreach, consent, visits, tasks and follow-up."],
];

function AboutPage() {
  return (
    <>
      <PublicNav />
      <main className="mx-auto max-w-4xl px-5 py-14">
        <h1 className="font-display text-3xl font-semibold">About ClinQSphereX</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Clinical trial recruitment is slow because the work is split across spreadsheets, email,
          phone calls and paper. ClinQSphereX brings study protocols, clinical data, candidate
          screening and research operations into one workflow where every step is recorded and every
          decision belongs to a person.
        </p>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          From clinical data to research action — with evidence, intelligence and human control.
        </p>

        <h2 className="mt-12 font-display text-xl font-semibold">Principles</h2>
        <dl className="mt-5 space-y-3">
          {principles.map(([term, detail]) => (
            <div key={term} className="surface p-5">
              <dt className="text-sm font-semibold">{term}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-12 font-display text-xl font-semibold">Status</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          ClinQSphereX is a working research prototype. Demo records are synthetic. Machine-learning
          and quantum-kernel work is experimental and is evaluated openly rather than marketed.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/platform"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Explore the Platform
          </Link>
          <Link
            to="/research"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Research Overview
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
