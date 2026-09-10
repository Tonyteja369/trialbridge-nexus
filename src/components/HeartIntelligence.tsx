import heartImage from "@/assets/cardiovascular-heart.jpg";
import { Activity, ClipboardCheck, Database, FlaskConical } from "lucide-react";

const signals = [
  { label: "Trial status", value: "Registry data", icon: FlaskConical },
  { label: "Candidate review", value: "Human decision", icon: ClipboardCheck },
  { label: "Clinical evidence", value: "Source linked", icon: Database },
  { label: "Research activity", value: "Audit recorded", icon: Activity },
];

export function HeartIntelligence() {
  return (
    <div className="heart-stage">
      <div className="heart-orbit" aria-hidden />
      <img
        src={heartImage}
        alt="Scientifically inspired non-graphic anatomical heart visualization"
        width={1536}
        height={1536}
        loading="lazy"
        className="heart-visual"
      />
      <div className="heart-stage-shade" aria-hidden />
      <div className="heart-signal-grid">
        {signals.map(({ label, value, icon: Icon }) => (
          <div key={label} className="heart-signal">
            <Icon className="size-4 text-hero-accent" aria-hidden />
            <div>
              <p className="text-[0.66rem] uppercase text-hero-muted">{label}</p>
              <p className="mt-0.5 text-xs font-semibold text-hero-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
        <p className="text-[0.68rem] font-semibold uppercase text-hero-accent">Cardiovascular focus</p>
        <p className="mt-1 max-w-[15rem] font-display text-xl font-semibold text-hero-foreground">
          Heart disease research intelligence
        </p>
      </div>
    </div>
  );
}