import { ShieldAlert } from "lucide-react";

export function SafetyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 rounded-xl border border-primary/25 bg-primary/10 p-4 text-sm backdrop-blur">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p className="text-foreground/90">
        <strong className="font-semibold">Screening support only.</strong> Diagnosphere.X ranks
        potentially eligible candidates from recorded data. It produces model predictions, not a
        clinical diagnosis, and does not determine eligibility.
        {!compact &&
          " Researcher review is required for every candidate, and enrolment is blocked until informed consent is recorded."}
      </p>
    </div>
  );
}
