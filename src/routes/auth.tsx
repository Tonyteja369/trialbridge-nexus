import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Wordmark } from "@/components/Wordmark";
import { BiomedicalVideo } from "@/components/BiomedicalVideo";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Researcher sign in — ClinQSphereX" },
      {
        name: "description",
        content:
          "Sign in to the ClinQSphereX clinical research operations workspace to manage studies, screening, consent and coordination.",
      },
      { property: "og:title", content: "Researcher sign in — ClinQSphereX" },
      {
        property: "og:description",
        content: "Access your clinical research operations workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="cinematic-band relative flex min-h-screen items-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 opacity-55" aria-hidden>
        <BiomedicalVideo compact />
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_28rem]">
        <div className="hidden max-w-xl lg:block">
          <p className="text-sm font-semibold uppercase text-hero-accent">Research workspace</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-hero-foreground">
            Evidence, explanation and human judgment in one focused environment.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-hero-muted">
            Continue to study operations, candidate screening, consent, experiments and audited actions.
          </p>
        </div>
        <GlassPanel variant="dark" className="w-full p-7 sm:p-9">
        <Link to="/" className="text-hero-foreground">
          <Wordmark />
        </Link>
        <h1 className="mt-8 text-xl font-semibold text-hero-foreground">
          {mode === "signin" ? "Researcher sign in" : "Create a research account"}
        </h1>
        <p className="mt-1 text-sm text-hero-muted">
          Accounts join the demo research organisation with the coordinator role.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="text-sm font-medium text-hero-foreground">
                Full name
              </label>
              <input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-md border border-hero-accent/25 bg-hero/60 px-3 py-2.5 text-sm text-hero-foreground outline-none transition-shadow focus:ring-2 focus:ring-hero-accent"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-hero-foreground">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-hero-accent/25 bg-hero/60 px-3 py-2.5 text-sm text-hero-foreground outline-none transition-shadow focus:ring-2 focus:ring-hero-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-hero-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-hero-accent/25 bg-hero/60 px-3 py-2.5 text-sm text-hero-foreground outline-none transition-shadow focus:ring-2 focus:ring-hero-accent"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-10 w-full"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <Button
          variant="outline"
          onClick={google}
          className="mt-3 h-10 w-full border-hero-accent/25 bg-hero/35 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
        >
          Continue with Google
        </Button>

        <Button
          variant="ghost"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-hero-muted hover:bg-hero-foreground/5 hover:text-hero-foreground"
        >
          {mode === "signin"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </Button>
        </GlassPanel>
      </div>
    </main>
  );
}
