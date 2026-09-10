import { createServerFn } from "@tanstack/react-start";

/**
 * Live, read-only access to public research APIs.
 * Nothing is cached, stored or synthesised: if a source is unreachable the UI
 * shows SOURCE OFFLINE rather than substituting invented records.
 */

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function getJson(url: string | URL, timeoutMs = 15000): Promise<any> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Source returned HTTP ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ PubMed */

export type Publication = {
  pmid: string;
  title: string;
  journal: string;
  pubDate: string;
  authors: string[];
  url: string;
};

export type PubMedResult = {
  query: string;
  totalCount: number | null;
  retrievedAt: string;
  elapsedMs: number;
  publications: Publication[];
};

export const searchPubMed = createServerFn({ method: "GET" })
  .inputValidator((input: { term: string; pageSize?: number }) => {
    const term = (input?.term ?? "").trim();
    if (!term) throw new Error("A search term is required");
    if (term.length > 120) throw new Error("Search term is too long");
    return { term, pageSize: Math.min(Math.max(input?.pageSize ?? 8, 1), 20) };
  })
  .handler(async ({ data }): Promise<PubMedResult> => {
    const started = Date.now();
    const search = new URL(`${EUTILS}/esearch.fcgi`);
    search.searchParams.set("db", "pubmed");
    search.searchParams.set("term", data.term);
    search.searchParams.set("retmax", String(data.pageSize));
    search.searchParams.set("sort", "date");
    search.searchParams.set("retmode", "json");
    const s = await getJson(search);
    const ids: string[] = s?.esearchresult?.idlist ?? [];
    const totalRaw = Number(s?.esearchresult?.count);
    const totalCount = Number.isFinite(totalRaw) ? totalRaw : null;

    let publications: Publication[] = [];
    if (ids.length) {
      const summary = new URL(`${EUTILS}/esummary.fcgi`);
      summary.searchParams.set("db", "pubmed");
      summary.searchParams.set("id", ids.join(","));
      summary.searchParams.set("retmode", "json");
      const sum = await getJson(summary);
      publications = ids
        .map((id) => sum?.result?.[id])
        .filter(Boolean)
        .map((r: any) => ({
          pmid: String(r.uid),
          title: r.title ?? "Untitled record",
          journal: r.fulljournalname ?? r.source ?? "Unknown journal",
          pubDate: r.pubdate ?? "",
          authors: (r.authors ?? []).slice(0, 4).map((a: any) => a.name).filter(Boolean),
          url: `https://pubmed.ncbi.nlm.nih.gov/${r.uid}/`,
        }));
    }

    return {
      query: data.term,
      totalCount,
      retrievedAt: new Date().toISOString(),
      elapsedMs: Date.now() - started,
      publications,
    };
  });

/* ----------------------------------------------------------------- UniProt */

export type ProteinRecord = {
  accession: string;
  protein: string;
  organism: string;
  length: number | null;
  functionText: string | null;
  evidence: string | null;
  url: string;
};

export type UniProtResult = {
  query: string;
  retrievedAt: string;
  elapsedMs: number;
  proteins: ProteinRecord[];
};

export const searchUniProt = createServerFn({ method: "GET" })
  .inputValidator((input: { term: string; pageSize?: number }) => {
    const term = (input?.term ?? "").trim();
    if (!term) throw new Error("A search term is required");
    if (term.length > 120) throw new Error("Search term is too long");
    return { term, pageSize: Math.min(Math.max(input?.pageSize ?? 6, 1), 15) };
  })
  .handler(async ({ data }): Promise<UniProtResult> => {
    const started = Date.now();
    const url = new URL("https://rest.uniprot.org/uniprotkb/search");
    url.searchParams.set("query", `${data.term} AND reviewed:true`);
    url.searchParams.set("size", String(data.pageSize));
    url.searchParams.set(
      "fields",
      "accession,protein_name,organism_name,length,cc_function,protein_existence",
    );
    url.searchParams.set("format", "json");
    const json = await getJson(url);

    const proteins: ProteinRecord[] = (json?.results ?? []).map((r: any) => {
      const fn = (r.comments ?? []).find((c: any) => c.commentType === "FUNCTION");
      const text: string | undefined = fn?.texts?.[0]?.value;
      return {
        accession: r.primaryAccession,
        protein:
          r.proteinDescription?.recommendedName?.fullName?.value ??
          r.proteinDescription?.submissionNames?.[0]?.fullName?.value ??
          "Unnamed protein",
        organism: r.organism?.scientificName ?? "Unknown organism",
        length: typeof r.sequence?.length === "number" ? r.sequence.length : null,
        functionText: text ? text.slice(0, 320) : null,
        evidence: r.proteinExistence ?? null,
        url: `https://www.uniprot.org/uniprotkb/${r.primaryAccession}/entry`,
      };
    });

    return {
      query: data.term,
      retrievedAt: new Date().toISOString(),
      elapsedMs: Date.now() - started,
      proteins,
    };
  });

/* --------------------------------------------- NCBI nucleotide ingest run */

export type SequenceExcerpt = {
  id: string;
  description: string;
  basesRetrieved: number;
  excerpt: string;
  gcPercent: number | null;
  url: string;
};

export type IngestRun = {
  query: string;
  requested: number;
  sourceMatchingRecords: number | null;
  recordsRetrieved: number;
  recordsProcessed: number;
  basesProcessed: number;
  bytesReceived: number;
  searchMs: number;
  downloadMs: number;
  parseMs: number;
  processMs: number;
  totalMs: number;
  recordsPerSecond: number;
  basesPerSecond: number;
  basesPerRecordCap: number;
  retrievedAt: string;
  excerpts: SequenceExcerpt[];
};

/** Bases requested per record, so a run stays inside polite API limits. */
const BASE_CAP = 400;

export const runSequenceIngest = createServerFn({ method: "GET" })
  .inputValidator((input: { term: string; records?: number }) => {
    const term = (input?.term ?? "").trim();
    if (!term) throw new Error("A research term is required");
    if (term.length > 160) throw new Error("Research term is too long");
    const allowed = [100, 250, 500, 1000];
    const records = allowed.includes(input?.records ?? 0) ? input!.records! : 100;
    return { term, records };
  })
  .handler(async ({ data }): Promise<IngestRun> => {
    const t0 = Date.now();
    const search = new URL(`${EUTILS}/esearch.fcgi`);
    search.searchParams.set("db", "nuccore");
    search.searchParams.set("term", data.term);
    search.searchParams.set("retmax", String(data.records));
    search.searchParams.set("retmode", "json");
    const s = await getJson(search, 20000);
    const ids: string[] = s?.esearchresult?.idlist ?? [];
    const totalRaw = Number(s?.esearchresult?.count);
    const searchMs = Date.now() - t0;

    let bytesReceived = 0;
    let fasta = "";
    const t1 = Date.now();
    const batchSize = 200;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const fetchUrl = new URL(`${EUTILS}/efetch.fcgi`);
      fetchUrl.searchParams.set("db", "nuccore");
      fetchUrl.searchParams.set("id", batch.join(","));
      fetchUrl.searchParams.set("rettype", "fasta");
      fetchUrl.searchParams.set("retmode", "text");
      fetchUrl.searchParams.set("seq_start", "1");
      fetchUrl.searchParams.set("seq_stop", String(BASE_CAP));
      const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`NCBI efetch returned HTTP ${res.status}`);
      const text = await res.text();
      bytesReceived += new TextEncoder().encode(text).length;
      fasta += text;
    }
    const downloadMs = Date.now() - t1;

    const t2 = Date.now();
    const blocks = fasta.split(/^>/m).filter((b) => b.trim().length > 0);
    const parsed = blocks.map((block) => {
      const nl = block.indexOf("\n");
      const header = (nl === -1 ? block : block.slice(0, nl)).trim();
      const seq = (nl === -1 ? "" : block.slice(nl + 1)).replace(/\s+/g, "").toUpperCase();
      const space = header.indexOf(" ");
      return {
        id: space === -1 ? header : header.slice(0, space),
        description: space === -1 ? "" : header.slice(space + 1),
        seq,
      };
    });
    const parseMs = Date.now() - t2;

    const t3 = Date.now();
    let basesProcessed = 0;
    let recordsProcessed = 0;
    const excerpts: SequenceExcerpt[] = [];
    for (const p of parsed) {
      if (!p.seq) continue;
      recordsProcessed += 1;
      basesProcessed += p.seq.length;
      if (excerpts.length < 8) {
        const gc = (p.seq.match(/[GC]/g) ?? []).length;
        excerpts.push({
          id: p.id,
          description: p.description.slice(0, 120),
          basesRetrieved: p.seq.length,
          excerpt: p.seq.slice(0, 60),
          gcPercent: p.seq.length ? Number(((gc / p.seq.length) * 100).toFixed(1)) : null,
          url: `https://www.ncbi.nlm.nih.gov/nuccore/${encodeURIComponent(p.id)}`,
        });
      }
    }
    const processMs = Date.now() - t3;
    const totalMs = Date.now() - t0;
    const seconds = Math.max(totalMs, 1) / 1000;

    return {
      query: data.term,
      requested: data.records,
      sourceMatchingRecords: Number.isFinite(totalRaw) ? totalRaw : null,
      recordsRetrieved: parsed.length,
      recordsProcessed,
      basesProcessed,
      bytesReceived,
      searchMs,
      downloadMs,
      parseMs,
      processMs,
      totalMs,
      recordsPerSecond: Math.round(recordsProcessed / seconds),
      basesPerSecond: Math.round(basesProcessed / seconds),
      basesPerRecordCap: BASE_CAP,
      retrievedAt: new Date().toISOString(),
      excerpts,
    };
  });

/* ------------------------------------------------------------ Source panel */

export type SourceStatus = {
  name: string;
  kind: "live" | "controlled";
  status: "LIVE" | "SOURCE OFFLINE" | "CONTROLLED ACCESS";
  latencyMs: number | null;
  url: string;
  note: string;
  checkedAt: string;
};

async function probe(name: string, url: string, note: string, siteUrl: string): Promise<SourceStatus> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(String(res.status));
    return {
      name,
      kind: "live",
      status: "LIVE",
      latencyMs: Date.now() - started,
      url: siteUrl,
      note,
      checkedAt,
    };
  } catch {
    return {
      name,
      kind: "live",
      status: "SOURCE OFFLINE",
      latencyMs: null,
      url: siteUrl,
      note,
      checkedAt,
    };
  }
}

export const checkResearchSources = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ checkedAt: string; sources: SourceStatus[] }> => {
    const checkedAt = new Date().toISOString();
    const live = await Promise.all([
      probe(
        "NCBI Datasets",
        "https://api.ncbi.nlm.nih.gov/datasets/v2alpha/version",
        "Genome, gene and taxonomy metadata via the official REST API.",
        "https://www.ncbi.nlm.nih.gov/datasets/",
      ),
      probe(
        "PubMed (E-utilities)",
        `${EUTILS}/esearch.fcgi?db=pubmed&term=heart+failure&retmax=1&retmode=json`,
        "Published biomedical literature records.",
        "https://pubmed.ncbi.nlm.nih.gov/",
      ),
      probe(
        "UniProt",
        "https://rest.uniprot.org/uniprotkb/search?query=troponin&size=1&format=json&fields=accession",
        "Reviewed protein records, sequences and annotations.",
        "https://www.uniprot.org/",
      ),
      probe(
        "ClinicalTrials.gov",
        "https://clinicaltrials.gov/api/v2/studies?query.cond=heart+failure&pageSize=1",
        "Registered clinical studies and eligibility text.",
        "https://clinicaltrials.gov/",
      ),
    ]);

    const controlled: SourceStatus[] = [
      {
        name: "UK Biobank",
        kind: "controlled",
        status: "CONTROLLED ACCESS",
        latencyMs: null,
        url: "https://www.ukbiobank.ac.uk/",
        note: "Reference resource only. Approved-researcher access; no individual-level data is retrieved or stored here.",
        checkedAt,
      },
      {
        name: "NIH All of Us",
        kind: "controlled",
        status: "CONTROLLED ACCESS",
        latencyMs: null,
        url: "https://allofus.nih.gov/",
        note: "Public programme summaries only. Individual-level data stays inside the approved Researcher Workbench.",
        checkedAt,
      },
    ];

    return { checkedAt, sources: [...live, ...controlled] };
  },
);
