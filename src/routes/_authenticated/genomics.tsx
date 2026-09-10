import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Activity, Database, Dna, Gauge, Timer, Download } from "lucide-react";
import { BiomedicalVideo } from "@/components/BiomedicalVideo";
import { TrialSearch } from "@/components/TrialSearch";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ProvenanceTag } from "@/components/DataProvenance";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { diseases } from "@/lib/diseases";
import {
  checkResearchSources,
  runSequenceIngest,
  searchPubMed,
  searchUniProt,
  type IngestRun,
} from "@/lib/research-sources.functions";

export const Route = createFileRoute("/_authenticated/genomics")({
  head: () => ({
    meta: [
      { title: "Genomic Intelligence Engine — ClinQSphereX" },
      {
        name: "description",
        content:
          "Query NCBI, PubMed, UniProt and ClinicalTrials.gov live, and see measured retrieval and processing throughput for every run.",
      },
      { property: "og:title", content: "Genomic Intelligence Engine — ClinQSphereX" },
      {
        property: "og:description",
        content: "Real public research sources, measured processing, transparent evidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GenomicsPage,
});

const RECORD_OPTIONS = [100, 250, 500, 1000] as const;

const nf = new Intl.NumberFormat("en-US");
const fmtBytes = (b: number) =>
  b >= 1_000_000 ? `${(b / 1_048_576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;

function downloadReport(run: IngestRun, format: "json" | "csv") {
  const exportedAt = new Date().toISOString();
  const ids = run.excerpts.map((entry) => entry.id);
  const report = { source: "NCBI Nucleotide (E-utilities)", exportedAt, ...run, retrievedIds: ids };
  let body: string;
  let type: string;
  if (format === "json") {
    body = JSON.stringify(report, null, 2);
    type = "application/json";
  } else {
    const rows: [string, string | number][] = [
      ["source", report.source], ["query", run.query], ["requested", run.requested],
      ["sourceMatchingRecords", run.sourceMatchingRecords ?? ""], ["recordsRetrieved", run.recordsRetrieved],
      ["recordsProcessed", run.recordsProcessed], ["basesProcessed", run.basesProcessed],
      ["bytesReceived", run.bytesReceived], ["searchMs", run.searchMs], ["downloadMs", run.downloadMs],
      ["parseMs", run.parseMs], ["processMs", run.processMs], ["totalMs", run.totalMs],
      ["recordsPerSecond", run.recordsPerSecond], ["basesPerSecond", run.basesPerSecond],
      ["basesPerRecordCap", run.basesPerRecordCap], ["retrievedAt", run.retrievedAt],
      ["exportedAt", exportedAt], ["retrievedIds", ids.join("|")],
    ];
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    body = `field,value\n${rows.map(([key, value]) => `${escape(key)},${escape(value)}`).join("\n")}`;
    type = "text/csv";
  }
  const blobUrl = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `clinqspherex-genomics-${run.retrievedAt.replaceAll(":", "-")}.${format}`;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="liquid-glass liquid-glass-card p-4">
      <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function GenomicsPage() {
  const [disease, setDisease] = useState(diseases[0]!);
  const [records, setRecords] = useState<number>(100);

  const sourcesFn = useServerFn(checkResearchSources);
  const pubmedFn = useServerFn(searchPubMed);
  const uniprotFn = useServerFn(searchUniProt);
  const ingestFn = useServerFn(runSequenceIngest);

  const sources = useQuery({
    queryKey: ["research-sources"],
    queryFn: () => sourcesFn({}),
    staleTime: 60_000,
    retry: false,
  });

  const pubmed = useQuery({
    queryKey: ["pubmed", disease.condition],
    queryFn: () => pubmedFn({ data: { term: disease.condition, pageSize: 6 } }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const uniprot = useQuery({
    queryKey: ["uniprot", disease.condition],
    queryFn: () => uniprotFn({ data: { term: disease.condition, pageSize: 5 } }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const ingest = useMutation<IngestRun, Error, { term: string; records: number }>({
    mutationFn: (vars) => ingestFn({ data: vars }),
  });
  const run = ingest.error ? undefined : ingest.data;

  const projections = run
    ? [1_000_000, 10_000_000, 100_000_000, 1_000_000_000].map((n) => ({
        n,
        seconds: run.recordsPerSecond > 0 ? n / run.recordsPerSecond : null,
      }))
    : [];

  return (
    <div className="min-h-dvh">

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <BiomedicalVideo compact />
          </div>
          <div className="relative mx-auto max-w-6xl px-5 py-20">
            <ProvenanceTag kind="live" />
            <h1 className="font-display mt-4 max-w-3xl text-3xl font-semibold text-hero-foreground sm:text-4xl">
              Genomic Intelligence Engine
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hero-muted sm:text-base">
              Real research sources. Measured processing. Transparent evidence. Human-controlled
              decisions. Every number on this page is either retrieved live from a public API,
              measured during the run you start, or clearly labelled as a projection.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-12 px-5 py-14">
          {/* Source panel */}
          <section aria-labelledby="sources">
            <h2 id="sources" className="font-display text-lg font-semibold">
              Research sources
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Status reflects an actual request made from this server to each API. A source that
              does not answer is shown as SOURCE OFFLINE — no records are substituted.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sources.isPending && <LoadingState rows={3} label="Checking sources" />}
              {sources.error && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <ErrorState message={`Source check failed: ${(sources.error as Error).message}`} />
                </div>
              )}
              {sources.data?.sources.map((s) => (
                <div key={s.name} className="liquid-glass liquid-glass-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span
                      className={
                        s.status === "LIVE"
                          ? "text-[0.66rem] font-semibold uppercase tracking-wide text-success"
                          : s.status === "CONTROLLED ACCESS"
                            ? "text-[0.66rem] font-semibold uppercase tracking-wide text-warning"
                            : "text-[0.66rem] font-semibold uppercase tracking-wide text-destructive"
                      }
                    >
                      ● {s.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.note}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {s.latencyMs !== null && <>Response: {s.latencyMs} ms · </>}
                    Checked: {new Date(s.checkedAt).toLocaleString()}
                  </p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Source <ExternalLink className="size-3" aria-hidden />
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Disease mode */}
          <section aria-labelledby="mode">
            <h2 id="mode" className="font-display text-lg font-semibold">
              Disease research mode
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Selecting an area changes the query sent to each public source. These sources are
              never merged into any individual&apos;s clinical record.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {diseases.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => setDisease(d)}
                  aria-pressed={d.slug === disease.slug}
                  className={
                    d.slug === disease.slug
                      ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                      : "liquid-glass liquid-glass-card rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {d.short}
                </button>
              ))}
            </div>
          </section>

          {/* Live ingest run */}
          <section aria-labelledby="run" className="space-y-5">
            <div>
              <h2 id="run" className="font-display text-lg font-semibold">
                Live public data run — NCBI nucleotide
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                A run queries NCBI E-utilities for records matching{" "}
                <strong>{disease.condition}</strong>, retrieves the first 400 bases of each record,
                parses the FASTA and measures every stage. Nothing is downloaded at database scale.
              </p>
            </div>

            <div className="liquid-glass liquid-glass-elevated flex flex-wrap items-center gap-3 p-4">
              <span className="text-sm text-muted-foreground">Records to retrieve:</span>
              {RECORD_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRecords(n)}
                  aria-pressed={n === records}
                  className={
                    n === records
                      ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                      : "rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {nf.format(n)}
                </button>
              ))}
              <Button
                 onClick={() => {
                   ingest.reset();
                   ingest.mutate({ term: disease.condition, records });
                 }}
                disabled={ingest.isPending}
                className="ml-auto"
              >
                {ingest.isPending ? "Retrieving…" : "Load live data"}
              </Button>
            </div>

            {ingest.error && (
              <ErrorState
                message={`SOURCE OFFLINE — ${(ingest.error as Error).message}. No records were substituted.`}
              />
            )}
            {ingest.isPending && <LoadingState rows={2} label="Running live retrieval" />}
            {!run && !ingest.isPending && !ingest.error && (
              <EmptyState
                title="No run has been executed yet."
                description="Every metric below appears only after a real retrieval from the public API."
              />
            )}

            {run && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Export contains only this successful run, its measured timings, retrieved IDs and timestamps.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadReport(run, "json")}>
                      <Download aria-hidden /> JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadReport(run, "csv")}>
                      <Download aria-hidden /> CSV
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="liquid-glass liquid-glass-evidence p-4">
                    <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-muted-foreground">
                      Source scale (reference)
                    </p>
                    <p className="font-display mt-1 text-xl font-semibold tabular-nums">
                      {run.sourceMatchingRecords !== null
                        ? `${nf.format(run.sourceMatchingRecords)} records`
                        : "Not available"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Records matching &ldquo;{run.query}&rdquo; in NCBI nuccore. Not processed by
                      ClinQSphereX.
                    </p>
                  </div>
                  <Metric
                    label="Current run — retrieved"
                    value={nf.format(run.recordsRetrieved)}
                    hint={`${nf.format(run.recordsProcessed)} processed`}
                  />
                  <Metric
                    label="Bases processed"
                    value={nf.format(run.basesProcessed)}
                    hint={`Up to ${run.basesPerRecordCap} bases per record`}
                  />
                  <Metric
                    label="Bytes received"
                    value={fmtBytes(run.bytesReceived)}
                    hint={`Retrieved ${new Date(run.retrievedAt).toLocaleTimeString()}`}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Records / sec" value={nf.format(run.recordsPerSecond)} />
                  <Metric label="Bases / sec" value={nf.format(run.basesPerSecond)} />
                  <Metric
                    label="Elapsed"
                    value={`${(run.totalMs / 1000).toFixed(2)} s`}
                    hint={`Search ${run.searchMs} ms · Download ${run.downloadMs} ms`}
                  />
                  <Metric
                    label="Parse / process"
                    value={`${run.parseMs} / ${run.processMs} ms`}
                    hint="Measured on this server"
                  />
                </div>

                <EvidencePanel
                  title="Retrieved sequence excerpts"
                  description="Public reference sequence records. Excerpts are the first 60 bases of each retrieved record — no individual-level genomic data is used."
                  footer={
                    <>
                      Source: NCBI Nucleotide (E-utilities) · Data type: public reference sequence ·
                      Retrieved at: {new Date(run.retrievedAt).toLocaleString()}
                    </>
                  }
                >
                  <ul className="mt-4 space-y-2">
                    {run.excerpts.map((e) => (
                      <li key={e.id} className="rounded-md border border-border bg-muted/40 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {e.id}
                          </a>
                          <span className="text-xs text-muted-foreground">
                            {nf.format(e.basesRetrieved)} bases retrieved
                            {e.gcPercent !== null && <> · GC {e.gcPercent}%</>} · Processed
                          </span>
                        </div>
                        {e.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>
                        )}
                        <code className="mt-2 block overflow-x-auto text-xs tracking-widest text-foreground/80">
                          {e.excerpt}…
                        </code>
                      </li>
                    ))}
                  </ul>
                </EvidencePanel>

                <div className="liquid-glass liquid-glass-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">Scale projection</h3>
                    <span className="rounded border border-warning/50 bg-warning/10 px-1.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide text-warning">
                      Theoretical projection — not actual processing
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Extrapolated from this run&apos;s measured throughput of{" "}
                    {nf.format(run.recordsPerSecond)} records/sec. ClinQSphereX has not processed
                    these volumes.
                  </p>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-4">
                    {projections.map((p) => (
                      <div key={p.n}>
                        <dt className="text-xs text-muted-foreground">{nf.format(p.n)} records</dt>
                        <dd className="mt-0.5 font-medium tabular-nums">
                          {p.seconds === null
                            ? "Not available"
                            : p.seconds < 3600
                              ? `${(p.seconds / 60).toFixed(1)} min`
                              : `${(p.seconds / 3600).toFixed(1)} h`}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </section>

          {/* Literature */}
          <section aria-labelledby="literature" className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 id="literature" className="font-display text-lg font-semibold">
                  Recent literature — PubMed
                </h2>
                <ProvenanceTag kind="live" />
              </div>
              <div className="mt-4 space-y-3">
                {pubmed.isPending && <LoadingState rows={3} label="Loading publications" />}
                {pubmed.error && (
                  <ErrorState
                    message={`SOURCE OFFLINE — PubMed: ${(pubmed.error as Error).message}`}
                  />
                )}
                 {!pubmed.error && pubmed.data?.publications.map((p) => (
                  <article key={p.pmid} className="liquid-glass liquid-glass-card p-4">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {p.title}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.journal} · {p.pubDate} · PMID {p.pmid}
                    </p>
                    {p.authors.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">{p.authors.join(", ")}</p>
                    )}
                  </article>
                ))}
                 {!pubmed.error && pubmed.data && (
                  <p className="text-xs text-muted-foreground">
                    Source: NCBI PubMed E-utilities ·{" "}
                    {pubmed.data.totalCount !== null
                      ? `${nf.format(pubmed.data.totalCount)} records match in the source`
                      : "Match count not available"}{" "}
                    · Retrieved {new Date(pubmed.data.retrievedAt).toLocaleString()} in{" "}
                    {pubmed.data.elapsedMs} ms
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">
                  Protein records — UniProt
                </h2>
                <ProvenanceTag kind="live" />
              </div>
              <div className="mt-4 space-y-3">
                {uniprot.isPending && <LoadingState rows={3} label="Loading protein records" />}
                {uniprot.error && (
                  <ErrorState
                    message={`SOURCE OFFLINE — UniProt: ${(uniprot.error as Error).message}`}
                  />
                )}
                 {!uniprot.error && uniprot.data?.proteins.map((p) => (
                  <article key={p.accession} className="liquid-glass liquid-glass-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {p.protein}
                      </a>
                      <span className="text-xs text-muted-foreground">{p.accession}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.organism}
                      {p.length !== null && <> · {nf.format(p.length)} aa</>}
                      {p.evidence && <> · Evidence: {p.evidence}</>}
                    </p>
                    {p.functionText && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {p.functionText}
                      </p>
                    )}
                  </article>
                ))}
                 {!uniprot.error && uniprot.data && (
                  <p className="text-xs text-muted-foreground">
                    Source: UniProtKB (public biological database) · Retrieved{" "}
                    {new Date(uniprot.data.retrievedAt).toLocaleString()} in{" "}
                    {uniprot.data.elapsedMs} ms
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Trials */}
          <TrialSearch initialCondition={disease.condition} />

          {/* Workflow + transparency */}
          <section className="grid gap-6 lg:grid-cols-2">
            <EvidencePanel
              title="Cardiovascular research intelligence workflow"
              description="How public discovery connects to the screening prototype — and where it stops."
              footer="Public sources support research discovery only. Candidate screening runs on synthetic/Synthea data, and no model output is a diagnosis or an enrolment decision."
            >
              <ol className="mt-4 space-y-2 text-sm">
                {[
                  { icon: Database, t: "Heart failure query → ClinicalTrials.gov current studies" },
                  { icon: Activity, t: "→ PubMed relevant publications" },
                  { icon: Dna, t: "→ NCBI public sequence and gene resources" },
                  { icon: Gauge, t: "→ UniProt protein and function annotations" },
                  { icon: Timer, t: "→ ClinQSphereX research summary" },
                ].map(({ icon: Icon, t }) => (
                  <li key={t} className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                Screening path: synthetic candidate dataset → eligibility screening → classical model
                → experimental quantum-kernel model → explanation → researcher review.
              </p>
            </EvidencePanel>

            <EvidencePanel
              title="How to read the labels"
              description="These categories are never mixed."
            >
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Live data</strong> — retrieved from a public
                  API during this session, with retrieval time shown.
                </li>
                <li>
                  <strong className="text-foreground">Reference statistic</strong> — a published
                  figure from an external source, not processed here.
                </li>
                <li>
                  <strong className="text-foreground">Controlled access</strong> — UK Biobank and
                  All of Us, cited as resources only; no individual-level data is retrieved.
                </li>
                <li>
                  <strong className="text-foreground">Synthetic data</strong> — the Synthea-style
                  candidates used in the screening prototype.
                </li>
                <li>
                  <strong className="text-foreground">Experimental result</strong> — measured model
                  output with its configuration recorded.
                </li>
                <li>
                  <strong className="text-foreground">Theoretical projection</strong> — arithmetic
                  from measured throughput, not work performed.
                </li>
              </ul>
            </EvidencePanel>
          </section>
        </div>
      </main>

    </div>
  );
}
