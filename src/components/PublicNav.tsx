import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";

const links = [
  { to: "/platform", label: "Platform" },
  { to: "/research", label: "Research" },
  { to: "/security", label: "Security" },
  { to: "/about", label: "About" },
] as const;

export function PublicNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" aria-label="ClinQSphereX home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground font-medium" }}
              className="hidden rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/auth"
            className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Researcher Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-muted-foreground">
        <span>
          ClinQSphereX — research prototype. Demo records are synthetic and are not real patient
          data.
        </span>
        <nav aria-label="Footer" className="flex gap-4">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
