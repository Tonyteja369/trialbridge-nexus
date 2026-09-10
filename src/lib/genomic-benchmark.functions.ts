import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Live, read-only retrieval of real public genomic data for the
 * Classical vs Quantum genomic analysis module.
 *
 *  - NCBI ClinVar  (E-utilities, public)
 *  - GWAS Catalog  (EMBL-EBI REST API, public)
 *
 * No record is ever synthesised. If a source fails, the error is surfaced
 * and nothing is substituted.
 */

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const GWAS = "https://www.ebi.ac.uk/gwas/rest/api";

export const CARDIO_GENES = [
  { symbol: "LDLR", label: "LDLR — familial hypercholesterolaemia" },
  { symbol: "PCSK9", label: "PCSK9 — LDL cholesterol regulation" },
  { symbol: "APOB", label: "APOB — apolipoprotein B" },
  { symbol: "MYH7", label: "MYH7 — hypertrophic cardiomyopathy" },
  { symbol: "MYBPC3", label: "MYBPC3 — cardiomyopathy" },
  { symbol: "TTN", label: "TTN — dilated cardiomyopathy" },
  { symbol: "KCNQ1", label: "KCNQ1 — long QT syndrome" },
  { symbol: "LMNA", label: "LMNA — cardiac conduction disease" },
] as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retryFetch(url: string | URL, source: string, timeoutMs = 15000) {
  let lastError = "request failed";
  let attempts = 0;
  const startedAt = Date.now();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    attempts = attempt;
    const attemptStart = Date.now();
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return res;
      lastError = `HTTP ${res.status} after ${Date.now() - attemptStart} ms`;
      if (res.status < 500 && res.status !== 429) break;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "request failed";
      lastError = `${reason} after ${Date.now() - attemptStart} ms`;
    }
    if (attempt < 3) await wait(200 * 2 ** (attempt - 1));
  }
  throw new Error(
    `${source} unavailable — ${attempts} attempt${attempts === 1 ? "" : "s"} in ${Date.now() - startedAt} ms; last failure: ${lastError}`,
  );
}

const getJson = async (url: string | URL, source: string, timeoutMs = 15000) =>
  (await retryFetch(url, source, timeoutMs)).json();

type CacheEntry = { value: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL = 5 * 60_000;

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  if (hit) cache.delete(key);
  const value = await load();
  cache.set(key, { value, expiresAt: Date.now() + TTL });
  return value;
}

export type GenomicFeature = {
  id: string;
  source: "ClinVar" | "GWAS Catalog";
  name: string;
  detail: string;
  chromosome: string | null;
  position: number | null;
  /** Evidence weight derived from real record fields (see `weightBasis`). */
  weight: number;
  weightBasis: string;
  url: string;
};

export type GenomicFeatureSet = {
  gene: string;
  retrievedAt: string;
  clinvar: { count: number; totalMatches: number | null; elapsedMs: number };
  gwas: { count: number; elapsedMs: number };
  features: GenomicFeature[];
};

/** ClinVar review status → star rating, per ClinVar's published scheme. */
function reviewStars(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("practice guideline")) return 4;
  if (s.includes("reviewed by expert panel")) return 3;
  if (s.includes("multiple submitters")) return 2;
  if (s.includes("single submitter")) return 1;
  return 0;
}

function classificationScore(description: string): number {
  const d = description.toLowerCase();
  if (d === "pathogenic") return 1;
  if (d.includes("likely pathogenic")) return 0.85;
  if (d.includes("pathogenic")) return 0.9;
  if (d.includes("uncertain")) return 0.35;
  if (d.includes("conflicting")) return 0.3;
  if (d.includes("likely benign")) return 0.15;
  if (d.includes("benign")) return 0.1;
  return 0.2;
}

export const loadGenomicFeatureSet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { gene: string }) => {
    const gene = (input?.gene ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,12}$/.test(gene)) throw new Error("Invalid gene symbol");
    return { gene };
  })
  .handler(async ({ data }): Promise<GenomicFeatureSet> =>
    cached(`featureset:${data.gene}`, async () => {
      const gene = data.gene;

      /* ---------------------------------------------------------- ClinVar */
      const clinvarStart = Date.now();
      const search = new URL(`${EUTILS}/esearch.fcgi`);
      search.searchParams.set("db", "clinvar");
      search.searchParams.set("term", `${gene}[gene]`);
      search.searchParams.set("retmax", "10");
      search.searchParams.set("retmode", "json");
      const s = await getJson(search, "NCBI ClinVar");
      const ids: string[] = s?.esearchresult?.idlist ?? [];
      const totalRaw = Number(s?.esearchresult?.count);
      const totalMatches = Number.isFinite(totalRaw) ? totalRaw : null;

      const clinvarFeatures: GenomicFeature[] = [];
      if (ids.length) {
        const summary = new URL(`${EUTILS}/esummary.fcgi`);
        summary.searchParams.set("db", "clinvar");
        summary.searchParams.set("id", ids.join(","));
        summary.searchParams.set("retmode", "json");
        const sum = await getJson(summary, "NCBI ClinVar");
        for (const id of ids) {
          const r = sum?.result?.[id];
          if (!r) continue;
          const cls = r.germline_classification ?? {};
          const description: string = cls.description || "Not classified";
          const status: string = cls.review_status || "no assertion";
          const loc = r.variation_set?.[0]?.variation_loc?.find(
            (l: any) => l.status === "current",
          );
          const stars = reviewStars(status);
          const weight = Number(
            (classificationScore(description) * (0.5 + 0.125 * stars)).toFixed(3),
          );
          const traits: string[] = (cls.trait_set ?? [])
            .map((t: any) => t.trait_name)
            .filter(Boolean);
          clinvarFeatures.push({
            id: `clinvar:${r.uid}`,
            source: "ClinVar",
            name: r.title ?? r.accession ?? String(r.uid),
            detail: `${description} · ${status} (${stars}★)${traits.length ? ` · ${traits.slice(0, 2).join(", ")}` : ""}`,
            chromosome: loc?.chr ?? null,
            position: loc?.start ? Number(loc.start) : null,
            weight,
            weightBasis: `ClinVar germline classification (${description}) scaled by review-status stars (${stars}/4)`,
            url: `https://www.ncbi.nlm.nih.gov/clinvar/variation/${r.uid}/`,
          });
        }
      }
      const clinvarElapsed = Date.now() - clinvarStart;

      /* ----------------------------------------------------- GWAS Catalog */
      const gwasStart = Date.now();
      const snpUrl = new URL(`${GWAS}/singleNucleotidePolymorphisms/search/findByGene`);
      snpUrl.searchParams.set("geneName", gene);
      snpUrl.searchParams.set("size", "6");
      const snpJson = await getJson(snpUrl, "GWAS Catalog", 20000);
      const snps: any[] = snpJson?._embedded?.singleNucleotidePolymorphisms ?? [];

      const gwasFeatures: GenomicFeature[] = [];
      const seen = new Set<string>();
      for (const snp of snps.slice(0, 6)) {
        const rsId: string = snp?.rsId;
        if (!rsId || seen.has(rsId)) continue;
        seen.add(rsId);
        const loc = snp?.locations?.[0];
        let pvalue: number | null = null;
        let trait = "";
        try {
          const assoc = await getJson(
            `${GWAS}/singleNucleotidePolymorphisms/${encodeURIComponent(rsId)}/associations?projection=associationBySnp`,
            "GWAS Catalog",
            20000,
          );
          const list: any[] = assoc?._embedded?.associations ?? [];
          const best = list
            .filter((a) => typeof a.pvalue === "number")
            .sort((a, b) => a.pvalue - b.pvalue)[0];
          if (best) {
            pvalue = best.pvalue;
            trait = (best.efoTraits ?? []).map((t: any) => t.trait).slice(0, 2).join(", ");
          }
        } catch {
          // A single SNP association lookup failing must not fabricate a value.
        }
        const negLog = pvalue && pvalue > 0 ? -Math.log10(pvalue) : 0;
        gwasFeatures.push({
          id: `gwas:${rsId}`,
          source: "GWAS Catalog",
          name: rsId,
          detail: `${snp.functionalClass ?? "unknown consequence"}${pvalue ? ` · p = ${pvalue.toExponential(1)}` : " · no association p-value reported"}${trait ? ` · ${trait}` : ""}`,
          chromosome: loc?.chromosomeName ?? null,
          position: loc?.chromosomePosition ?? null,
          weight: Number(Math.min(negLog / 20, 1).toFixed(3)),
          weightBasis: pvalue
            ? `GWAS Catalog strongest association p-value (${pvalue.toExponential(1)}), scored as min(-log10(p)/20, 1)`
            : "No association p-value reported in the GWAS Catalog for this SNP",
          url: `https://www.ebi.ac.uk/gwas/variants/${encodeURIComponent(rsId)}`,
        });
      }
      const gwasElapsed = Date.now() - gwasStart;

      return {
        gene,
        retrievedAt: new Date().toISOString(),
        clinvar: { count: clinvarFeatures.length, totalMatches, elapsedMs: clinvarElapsed },
        gwas: { count: gwasFeatures.length, elapsedMs: gwasElapsed },
        features: [...clinvarFeatures, ...gwasFeatures],
      };
    }),
  );
