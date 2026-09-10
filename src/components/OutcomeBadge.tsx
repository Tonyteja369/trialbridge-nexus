import { Check, CircleHelp, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type OutcomeKind = "met" | "not_met" | "unknown" | "requires_review";

const map: Record<
  OutcomeKind,
  { label: string; icon: typeof Check; className: string }
> = {
  met: {
    label: "PASS",
    icon: Check,
    className: "border-success/40 bg-success/10 text-success",
  },
  not_met: {
    label: "FAIL",
    icon: X,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  unknown: {
    label: "UNKNOWN",
    icon: CircleHelp,
    className: "border-warning/50 bg-warning/10 text-warning",
  },
  requires_review: {
    label: "REQUIRES REVIEW",
    icon: Eye,
    className: "border-primary/40 bg-accent text-accent-foreground",
  },
};

/** Status is communicated with an icon AND text, never colour alone. */
export function OutcomeBadge({
  outcome,
  className,
}: {
  outcome: OutcomeKind | string;
  className?: string;
}) {
  const entry = map[(outcome as OutcomeKind) in map ? (outcome as OutcomeKind) : "unknown"]!;
  const Icon = entry.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide",
        entry.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {entry.label}
    </span>
  );
}
