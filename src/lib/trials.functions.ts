import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Public trial discovery against ClinicalTrials.gov API v2.
 * Read-only, unauthenticated, no data is stored. If the registry is
 * unreachable the UI shows an error state — it never substitutes made-up rows.
 */

export type RegistryTrial = {
  nctId: string;
  title: string;
  status: string;
  conditions: string[];
  interventions: string[];
  minimumAge: string | null;
  maximumAge: string | null;
  sex: string | null;
  locations: string[];
  eligibilitySummary: string | null;
  url: string;
};

export type TrialSearchResult = {
  query: string;
  totalCount: number | null;
  accessedAt: string;
  trials: RegistryTrial[];
};

const FIELDS = [
  "protocolSection.identificationModule",
  "protocolSection.statusModule",
  "protocolSection.conditionsModule",
  "protocolSection.armsInterventionsModule",
  "protocolSection.eligibilityModule",
  "protocolSection.contactsLocationsModule",
].join(",");

export const searchTrials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { condition: string; status?: string; pageSize?: number }) => {
    const condition = (input?.condition ?? "").trim();
    if (!condition) throw new Error("A condition is required");
    if (condition.length > 120) throw new Error("Condition is too long");
    return {
      condition,
      status: input?.status === "ALL" ? "ALL" : "RECRUITING",
      pageSize: Math.min(Math.max(input?.pageSize ?? 8, 1), 20),
    };
  })
  .handler(async ({ data }): Promise<TrialSearchResult> => {
    const url = new URL("https://clinicaltrials.gov/api/v2/studies");
    url.searchParams.set("query.cond", data.condition);
    url.searchParams.set("pageSize", String(data.pageSize));
    url.searchParams.set("countTotal", "true");
    url.searchParams.set("fields", FIELDS);
    if (data.status === "RECRUITING") url.searchParams.set("filter.overallStatus", "RECRUITING");

    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`ClinicalTrials.gov returned ${res.status}. Please try again shortly.`);
    }
    const json = (await res.json()) as any;

    const trials: RegistryTrial[] = (json.studies ?? []).map((s: any) => {
      const p = s.protocolSection ?? {};
      const id = p.identificationModule ?? {};
      const elig = p.eligibilityModule ?? {};
      const criteriaText: string | undefined = elig.eligibilityCriteria;
      const locations = (p.contactsLocationsModule?.locations ?? [])
        .slice(0, 3)
        .map((l: any) => [l.city, l.country].filter(Boolean).join(", "))
        .filter(Boolean);
      return {
        nctId: id.nctId ?? "",
        title: id.briefTitle ?? "Untitled study",
        status: p.statusModule?.overallStatus ?? "UNKNOWN",
        conditions: p.conditionsModule?.conditions ?? [],
        interventions: (p.armsInterventionsModule?.interventions ?? [])
          .slice(0, 4)
          .map((i: any) => [i.type, i.name].filter(Boolean).join(": ")),
        minimumAge: elig.minimumAge ?? null,
        maximumAge: elig.maximumAge ?? null,
        sex: elig.sex ?? null,
        locations,
        eligibilitySummary: criteriaText ? criteriaText.slice(0, 700) : null,
        url: id.nctId ? `https://clinicaltrials.gov/study/${id.nctId}` : "https://clinicaltrials.gov",
      };
    });

    return {
      query: data.condition,
      totalCount: typeof json.totalCount === "number" ? json.totalCount : null,
      accessedAt: new Date().toISOString(),
      trials,
    };
  });
