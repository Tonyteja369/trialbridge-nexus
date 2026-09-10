import { ShieldAlert } from "lucide-react";

export function SafetyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 rounded-lg border border-accent/60 bg-accent/20 p-3 text-sm text-accent-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-semibold">Decision support only.</strong> TrialBridge ranks
        potentially eligible candidates from recorded data. It does not determine eligibility,
        diagnose, or replace a qualified investigator.
        {!compact &&
          " Every candidate must be confirmed by a named reviewer, and enrolment is blocked until informed consent is recorded."}
      </p>
    </div>
  );
}
