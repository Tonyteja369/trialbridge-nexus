import { BrainCircuit, Database, FlaskConical, ScanSearch, Users } from "lucide-react";

const nodes = [
  { label: "Studies", icon: FlaskConical, position: "left-5 top-7" },
  { label: "Candidates", icon: Users, position: "right-5 top-7" },
  { label: "Evidence", icon: Database, position: "bottom-7 left-5" },
  { label: "Models", icon: BrainCircuit, position: "bottom-7 right-5" },
];

export function ResearchMap() {
  return (
    <div className="research-map" aria-label="Clinical research intelligence map">
      <div className="research-map-ring" aria-hidden />
      <div className="research-map-core">
        <ScanSearch className="size-5" aria-hidden />
        <span>Research action</span>
      </div>
      {nodes.map(({ label, icon: Icon, position }) => (
        <div key={label} className={`research-map-node ${position}`}>
          <Icon className="size-4" aria-hidden />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}