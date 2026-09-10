import { Info } from "lucide-react";

export function SafetyBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/60 p-4">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p className="text-sm leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">Screening support only.</strong>{" "}
        ClinQSphereX provides research and recruitment workflow support. It does not independently
        determine clinical eligibility, diagnosis, treatment or enrolment. Candidates are shown as{" "}
        <em>potentially eligible</em> and require researcher review.
      </p>
    </div>
  );
}
