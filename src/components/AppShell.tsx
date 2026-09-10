import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Atom,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/studies", label: "Studies", icon: FlaskConical },
  { to: "/participants", label: "Participants", icon: Users },
  { to: "/tasks", label: "Tasks & visits", icon: ListChecks },
  { to: "/operations", label: "Operations", icon: Activity },
  { to: "/quantum-lab", label: "Quantum lab", icon: Atom },
  { to: "/governance", label: "Governance", icon: ShieldCheck },
  { to: "/diseases", label: "Diseases", icon: HeartPulse },
  { to: "/research", label: "Research", icon: BookOpen },
  { to: "/genomics", label: "Genomics", icon: Dna },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="liquid-glass liquid-glass-nav sticky top-0 hidden h-screen w-64 shrink-0 flex-col rounded-none border-y-0 border-l-0 px-4 py-6 md:flex">
        <Link to="/dashboard" className="px-1">
          <Wordmark />
        </Link>
        <p className="mt-1 px-1 text-xs text-muted-foreground">Research operations</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                pathname.startsWith(item.to)
                  ? "bg-card font-medium text-primary shadow-[inset_0_0_0_1px_var(--border)]"
                  : "text-muted-foreground hover:bg-card",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          onClick={signOut}
          className="justify-start px-3 text-muted-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav aria-label="Workspace" className="liquid-glass liquid-glass-nav sticky top-0 z-20 flex items-center gap-3 overflow-x-auto rounded-none border-x-0 border-t-0 px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="whitespace-nowrap text-sm">
              {item.label}
            </Link>
          ))}
          <Button onClick={signOut} variant="ghost" size="sm" className="whitespace-nowrap text-muted-foreground">
            Sign out
          </Button>
        </nav>
        <main className="relative mx-auto w-full max-w-6xl flex-1 px-5 py-8 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-72 before:bg-[radial-gradient(circle_at_65%_0%,var(--violet-100),transparent_65%)]">{children}</main>
      </div>
    </div>
  );
}
