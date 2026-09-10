import { Info } from "lucide-react";

export function SafetyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="safety-glass flex items-start gap-3 p-4">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p className="text-sm leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">Screening support only.</strong>{" "}
        {compact ? (
          <>
            Results are <em>potentially eligible</em> shortlists and require researcher review.
          </>
        ) : (
          <>
            ClinQSphereX provides research and recruitment workflow support. It does not
            independently determine clinical eligibility, diagnosis, treatment or enrolment.
            Candidates are shown as <em>potentially eligible</em> and require researcher review.
          </>
        )}
      </p>
    </div>
  );
}
