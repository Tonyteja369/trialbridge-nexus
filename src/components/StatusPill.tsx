import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  suggested: "bg-secondary text-secondary-foreground",
  under_review: "bg-accent/40 text-accent-foreground",
  contacted: "bg-accent/40 text-accent-foreground",
  consented: "bg-success/15 text-success",
  enrolled: "bg-success/20 text-success",
  ineligible: "bg-destructive/10 text-destructive",
  screen_failed: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  granted: "bg-success/15 text-success",
  revoked: "bg-destructive/10 text-destructive",
  declined: "bg-destructive/10 text-destructive",
  not_started: "bg-muted text-muted-foreground",
  sent: "bg-secondary text-secondary-foreground",
  recruiting: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-accent/40 text-accent-foreground",
  closed: "bg-muted text-muted-foreground",
  high: "bg-success/15 text-success",
  medium: "bg-accent/40 text-accent-foreground",
  low: "bg-destructive/10 text-destructive",
  pending: "bg-secondary text-secondary-foreground",
  failed: "bg-accent/40 text-accent-foreground",
  dead_letter: "bg-destructive/10 text-destructive",
  open: "bg-secondary text-secondary-foreground",
  done: "bg-success/15 text-success",
  unknown: "bg-warning/15 text-warning",
  requires_review: "bg-accent text-accent-foreground",
  overdue: "bg-destructive/10 text-destructive",
  upcoming: "bg-secondary text-secondary-foreground",
  in_progress: "bg-accent/60 text-accent-foreground",
  completed: "bg-success/15 text-success",
};

export function StatusPill({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        tones[value] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
