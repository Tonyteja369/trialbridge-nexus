import videoAsset from "@/assets/clinqspherex-biomedical-background.mp4.asset.json";
import posterAsset from "@/assets/clinqspherex-biomedical-poster.jpg.asset.json";
import { Dna, FlaskConical, ScanSearch, Sparkles } from "lucide-react";

const signals = [
  { label: "Genomics", icon: Dna },
  { label: "Clinical trials", icon: FlaskConical },
  { label: "AI screening", icon: ScanSearch },
  { label: "Quantum research", icon: Sparkles },
];

export function BiomedicalVideo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "biomedical-video biomedical-video-compact" : "biomedical-video"}>
      <video
        className="absolute inset-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={posterAsset.url}
        aria-label="Cinematic molecular DNA visualization"
      >
        <source src={videoAsset.url} type="video/mp4" />
      </video>
      <div className="biomedical-video-tint" aria-hidden />
      {!compact && (
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2 sm:inset-x-6 sm:bottom-6">
          {signals.map(({ label, icon: Icon }) => (
            <span key={label} className="glass-label">
              <Icon className="size-3.5" aria-hidden />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}