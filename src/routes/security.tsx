import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter, PublicNav } from "@/components/PublicNav";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — ClinQSphereX" },
      {
        name: "description",
        content:
          "An honest description of the ClinQSphereX prototype security architecture: authentication, role-based access, row-level authorisation, audit logging and synthetic data.",
      },
      { property: "og:title", content: "Security — ClinQSphereX" },
      {
        property: "og:description",
        content: "What is implemented today, and what a production deployment would still require.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityPage,
});

const implemented: [string, string][] = [
  ["Authentication", "Email/password and Google sign-in issuing signed JWT sessions. Passwords are hashed by the managed auth service; the application never stores them."],
  ["Role-based access", "Roles are stored in a dedicated table and checked server-side. Roles are never read from client storage."],
  ["Row-level authorisation", "Every data table enforces organisation-scoped row-level security, so a session can only read its own organisation's records."],
  ["Server-side authorisation", "Screening, review, consent and allocation run as authenticated server functions that re-verify the caller before writing."],
  ["Audit logging", "Actions are appended to an audit record with actor, entity, timestamp and metadata."],
  ["Synthetic data", "Demo records are synthetic. No real patient data is loaded."],
  ["Environment-based configuration", "Secrets and service credentials are supplied by the environment, not committed to the repository."],
];

const future: [string, string][] = [
  ["Formal validation", "Documented system validation, test evidence and change control."],
  ["Encryption governance", "Key management, rotation policy and customer-managed keys."],
  ["PHI controls", "De-identification review, data retention schedules, breach procedures and BAAs/DPAs."],
  ["Independent assessment", "External security testing and a formal privacy impact assessment."],
  ["Monitoring", "Continuous log review, alerting and incident response runbooks."],
];

function SecurityPage() {
  return (
    <>
      <PublicNav />
      <main className="mx-auto max-w-4xl px-5 py-14">
        <h1 className="font-display text-3xl font-semibold">Security</h1>
        <p className="mt-3 text-muted-foreground">
          What the prototype implements today, described without overclaiming.
        </p>

        <section aria-labelledby="impl" className="mt-10">
          <h2 id="impl" className="font-display text-xl font-semibold">
            Implemented in this prototype
          </h2>
          <dl className="mt-5 space-y-3">
            {implemented.map(([term, detail]) => (
              <div key={term} className="surface p-5">
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="future" className="mt-10">
          <h2 id="future" className="font-display text-xl font-semibold">
            Required before production use
          </h2>
          <dl className="mt-5 space-y-3">
            {future.map(([term, detail]) => (
              <div key={term} className="surface-soft p-5">
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-10 rounded-lg border border-border bg-secondary p-5 text-sm leading-relaxed">
          ClinQSphereX is currently a research prototype and is not intended for production PHI
          without additional security, privacy, validation and regulatory controls. No compliance
          certification is claimed or implied.
        </p>
      </main>
      <PublicFooter />
    </>
  );
}
