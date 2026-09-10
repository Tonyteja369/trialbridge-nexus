import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";

export function EvidencePanel({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <GlassPanel variant="evidence" className={className}>
      <div className="relative z-1 p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {children}
        {footer && (
          <div className="mt-4 border-t border-primary/10 pt-3 text-xs leading-relaxed text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}