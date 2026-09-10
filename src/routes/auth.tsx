import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Wordmark } from "@/components/Wordmark";
import { BiomedicalVideo } from "@/components/BiomedicalVideo";

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
        <div className="glass-dark w-full p-7 sm:p-9">
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
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={google}
          className="mt-3 w-full rounded-md border border-hero-accent/25 px-4 py-2.5 text-sm font-medium text-hero-foreground transition-colors hover:bg-hero-foreground/10"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-sm text-hero-muted underline-offset-4 hover:text-hero-foreground hover:underline"
        >
          {mode === "signin"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </button>
        </div>
      </div>
    </main>
  );
}
