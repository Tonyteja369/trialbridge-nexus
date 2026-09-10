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

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/studies", label: "Studies", icon: FlaskConical },
  { to: "/participants", label: "Participants", icon: Users },
  { to: "/tasks", label: "Tasks & visits", icon: ListChecks },
  { to: "/operations", label: "Operations", icon: Activity },
  { to: "/quantum-lab", label: "Quantum lab", icon: Atom },
  { to: "/governance", label: "Governance", icon: ShieldCheck },
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-secondary/40 px-4 py-6 md:flex">
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
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 overflow-x-auto border-b border-border bg-card px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="whitespace-nowrap text-sm">
              {item.label}
            </Link>
          ))}
          <button onClick={signOut} className="whitespace-nowrap text-sm text-muted-foreground">
            Sign out
          </button>
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
