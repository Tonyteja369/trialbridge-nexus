import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const glassPanelVariants = cva("liquid-glass", {
  variants: {
    variant: {
      default: "liquid-glass-card",
      elevated: "liquid-glass-elevated",
      nav: "liquid-glass-nav",
      evidence: "liquid-glass-evidence",
      dark: "liquid-glass-dark",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface GlassPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassPanelVariants> {}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(glassPanelVariants({ variant }), className)} {...props} />
  ),
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel, glassPanelVariants };