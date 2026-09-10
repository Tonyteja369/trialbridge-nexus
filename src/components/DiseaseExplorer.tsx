import { Link } from "@tanstack/react-router";
import { diseases } from "@/lib/diseases";

export function DiseaseExplorer({ limit }: { limit?: number }) {
  const items = limit ? diseases.slice(0, limit) : diseases;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((d) => (
        <li key={d.slug} className="surface lift flex flex-col p-5">
          <h3 className="font-display text-base font-semibold">{d.name}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{d.focus}</p>
          <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>Registry trials</dt>
              <dd className="text-right">Searched live</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Research data</dt>
              <dd className="text-right">{d.dataStatus}</dd>
            </div>
          </dl>
          <Link
            to="/diseases/$slug"
            params={{ slug: d.slug }}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Explore {d.short} →
          </Link>
        </li>
      ))}
    </ul>
  );
}
