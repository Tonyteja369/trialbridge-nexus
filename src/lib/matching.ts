/**
 * TrialBridge eligibility screening engine.
 *
 * Deterministic, rule-based and fully explainable. It produces a RANKED
 * SHORTLIST plus a per-criterion explanation. It never decides eligibility:
 * every candidate must be confirmed or rejected by a qualified human reviewer
 * before any study action is taken.
 */

export type CriterionOperator =
  | "between"
  | "gte"
  | "lte"
  | "gt"
  | "lt"
  | "equals"
  | "includes"
  | "not_includes";

export interface Criterion {
  id: string;
  kind: string; // "inclusion" | "exclusion"
  label: string;
  attribute: string;
  operator: CriterionOperator | string;
  value: Record<string, unknown>;
  weight: number;
  hard: boolean;
}

export interface ParticipantLike {
  id: string;
  code: string;
  age: number | null;
  sex: string;
  city: string;
  conditions: string[];
  medications: string[];
  attributes: Record<string, unknown> | null;
}

export type Outcome = "met" | "not_met" | "unknown";

export interface CriterionResult {
  criterionId: string;
  label: string;
  kind: string;
  hard: boolean;
  weight: number;
  outcome: Outcome;
  observed: string;
  expected: string;
  contribution: number;
}

export interface MatchResult {
  participantId: string;
  score: number;
  confidence: "high" | "medium" | "low";
  disqualified: boolean;
  unknownCount: number;
  explanation: CriterionResult[];
}

function readAttribute(p: ParticipantLike, attribute: string): unknown {
  const key = attribute.startsWith("attributes.") ? attribute.slice(11) : attribute;
  if (key === "age") return p.age;
  if (key === "sex") return p.sex;
  if (key === "city") return p.city;
  if (key === "conditions") return p.conditions;
  if (key === "medications") return p.medications;
  const attrs = p.attributes ?? {};
  return (attrs as Record<string, unknown>)[key];
}

function describeExpected(c: Criterion): string {
  const v = c.value ?? {};
  switch (c.operator) {
    case "between":
      return `between ${String(v["min"])} and ${String(v["max"])}`;
    case "gte":
      return `at least ${String(v["value"])}`;
    case "lte":
      return `at most ${String(v["value"])}`;
    case "gt":
      return `greater than ${String(v["value"])}`;
    case "lt":
      return `less than ${String(v["value"])}`;
    case "equals":
      return `equal to ${String(v["value"])}`;
    case "includes":
      return `record contains "${String(v["value"])}"`;
    case "not_includes":
      return `record does not contain "${String(v["value"])}"`;
    default:
      return "unspecified rule";
  }
}

function describeObserved(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") return "not recorded";
  if (Array.isArray(raw)) return raw.length ? raw.join(", ") : "none recorded";
  return String(raw);
}

function test(c: Criterion, raw: unknown): Outcome {
  const v = c.value ?? {};
  if (raw === null || raw === undefined || raw === "") return "unknown";

  if (c.operator === "includes" || c.operator === "not_includes") {
    const needle = String(v["value"] ?? "").toLowerCase();
    const hay = Array.isArray(raw)
      ? raw.map((x) => String(x).toLowerCase())
      : [String(raw).toLowerCase()];
    const found = hay.some((h) => h.includes(needle));
    return (c.operator === "includes" ? found : !found) ? "met" : "not_met";
  }

  if (c.operator === "equals") {
    return String(raw) === String(v["value"]) ? "met" : "not_met";
  }

  const num = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(num)) return "unknown";

  switch (c.operator) {
    case "between": {
      const min = Number(v["min"]);
      const max = Number(v["max"]);
      return num >= min && num <= max ? "met" : "not_met";
    }
    case "gte":
      return num >= Number(v["value"]) ? "met" : "not_met";
    case "lte":
      return num <= Number(v["value"]) ? "met" : "not_met";
    case "gt":
      return num > Number(v["value"]) ? "met" : "not_met";
    case "lt":
      return num < Number(v["value"]) ? "met" : "not_met";
    default:
      return "unknown";
  }
}

export function screenParticipant(
  participant: ParticipantLike,
  criteria: Criterion[],
): MatchResult {
  const explanation: CriterionResult[] = [];
  let earned = 0;
  let possible = 0;
  let disqualified = false;
  let unknownCount = 0;

  for (const c of criteria) {
    const raw = readAttribute(participant, c.attribute);
    const rule = test(c, raw);
    const isExclusion = c.kind === "exclusion";

    // For an exclusion rule, "met" means the exclusion condition is PRESENT.
    let outcome: Outcome;
    if (rule === "unknown") outcome = "unknown";
    else if (isExclusion) outcome = rule === "met" ? "not_met" : "met";
    else outcome = rule;

    const weight = Number(c.weight) || 1;
    possible += weight;
    let contribution = 0;

    if (outcome === "met") {
      contribution = weight;
      earned += weight;
    } else if (outcome === "unknown") {
      unknownCount += 1;
      if (c.hard) disqualified = false; // missing data is never an automatic rejection
    } else if (c.hard) {
      disqualified = true;
    }

    explanation.push({
      criterionId: c.id,
      label: c.label,
      kind: c.kind,
      hard: c.hard,
      weight,
      outcome,
      observed: describeObserved(raw),
      expected: describeExpected(c),
      contribution,
    });
  }

  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  const confidence: MatchResult["confidence"] =
    unknownCount === 0 && score >= 80 ? "high" : unknownCount <= 1 ? "medium" : "low";

  return {
    participantId: participant.id,
    score: disqualified ? Math.min(score, 40) : score,
    confidence,
    disqualified,
    unknownCount,
    explanation,
  };
}

export function screenCohort(
  participants: ParticipantLike[],
  criteria: Criterion[],
): MatchResult[] {
  return participants
    .map((p) => screenParticipant(p, criteria))
    .sort((a, b) => b.score - a.score);
}
