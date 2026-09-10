import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Wordmark } from "@/components/Wordmark";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { ArrowRight, LockKeyhole } from "lucide-react";
import authVideoAsset from "@/assets/clinqspherex-auth-landscape.mp4.asset.json";
import authPosterAsset from "@/assets/clinqspherex-auth-landscape-poster.jpg.asset.json";

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
  const [allowVideo, setAllowVideo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const constrainedNetwork = Boolean(
      connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g",
    );
    if (reducedMotion || constrainedNetwork) return;

    const batteryNavigator = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
    if (!batteryNavigator.getBattery) {
      setAllowVideo(true);
      return;
    }
    batteryNavigator.getBattery().then((battery) => {
      if (active) setAllowVideo(battery.charging || battery.level > 0.2);
    }).catch(() => {
      if (active) setAllowVideo(true);
    });
    return () => { active = false; };
  }, []);

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
    <main className="auth-landscape relative min-h-screen overflow-hidden bg-hero text-hero-foreground">
       {allowVideo ? (
         <video
           className="auth-landscape-video"
           autoPlay
           muted
           loop
           playsInline
           preload="metadata"
           poster={authPosterAsset.url}
           aria-label="Abstract biomedical neural network visualization"
         >
           <source src={authVideoAsset.url} type="video/mp4" />
         </video>
       ) : (
         <img
           src={authPosterAsset.url}
           alt="Abstract biomedical neural network visualization"
           className="auth-landscape-video"
         />
       )}
      <div className="auth-landscape-shade" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-hero-foreground" aria-label="ClinQSphereX home">
            <Wordmark />
          </Link>
          <div className="glass-label normal-case">
            <LockKeyhole className="size-3.5" aria-hidden />
            Secure research access
          </div>
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_27rem] lg:gap-20">
          <section className="max-w-2xl self-end pb-2 lg:self-center lg:pb-0">
            <p className="text-sm font-semibold uppercase text-hero-accent">Clinical intelligence landscape</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Research decisions begin with trusted access.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-hero-muted sm:text-lg">
              Enter the human-controlled workspace for study operations, evidence review and transparent research workflows.
            </p>
          </section>

          <GlassPanel variant="dark" className="auth-glass-panel w-full p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-hero-accent">
              <span className="size-1.5 rounded-full bg-hero-accent" aria-hidden />
              Researcher portal
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-hero-foreground">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-hero-muted">
              {mode === "signin"
                ? "Sign in to continue to your research workspace."
                : "Accounts join the demo research organisation with the coordinator role."}
            </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
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
            <span>{busy ? "Please wait…" : mode === "signin" ? "Continue to workspace" : "Create account"}</span>
            {!busy && <ArrowRight className="size-4" aria-hidden />}
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
            <p className="mt-5 text-center text-xs leading-relaxed text-hero-muted">
              Screening support only. Researchers remain responsible for all decisions.
            </p>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
