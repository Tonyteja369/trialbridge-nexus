import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";

const Scene = lazy(() => import("./DiagnosticSphereScene"));

/** Static, dependency-free stand-in used before hydration, without WebGL, or on failure. */
export function SphereFallback() {
  return (
    <div
      aria-hidden
      className="relative mx-auto aspect-square w-full max-w-[30rem] rounded-full"
      style={{
        background:
          "radial-gradient(circle at 32% 30%, color-mix(in oklab, var(--accent-primary) 55%, transparent), transparent 58%), radial-gradient(circle at 70% 72%, color-mix(in oklab, var(--accent-secondary) 45%, transparent), transparent 60%), radial-gradient(circle at 50% 50%, oklch(0.24 0.05 234), oklch(0.19 0.035 236))",
        boxShadow: "0 0 90px -20px var(--glow-cyan)",
        border: "1px solid var(--glass-border)",
      }}
    />
  );
}

function useWebGLSupported() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupported(
        Boolean(
          canvas.getContext("webgl2") ??
            canvas.getContext("webgl") ??
            canvas.getContext("experimental-webgl"),
        ),
      );
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function SphereClient() {
  const webgl = useWebGLSupported();
  const reducedMotion = useReducedMotion();

  if (webgl === null) return <SphereFallback />;
  if (!webgl) return <SphereFallback />;

  return (
    <Suspense fallback={<SphereFallback />}>
      <Scene reducedMotion={reducedMotion} />
    </Suspense>
  );
}

export function DiagnosticSphere() {
  return (
    <div className="relative h-[22rem] w-full sm:h-[26rem] lg:h-[34rem]">
      <ClientOnly fallback={<SphereFallback />}>
        <SphereClient />
      </ClientOnly>
    </div>
  );
}
