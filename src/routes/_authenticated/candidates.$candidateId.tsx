import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { recordConsent, reviewCandidate } from "@/lib/trialbridge.functions";
import { StatusPill } from "@/components/StatusPill";
import { SafetyBanner } from "@/components/SafetyBanner";
import { Check, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidates/$candidateId")({
  head: () => ({
    meta: [
      { title: "Candidate review — Diagnosphere.X" },
      {
        name: "description",
        content:
          "Criterion-by-criterion explanation of a screening suggestion, with reviewer decision, consent status and visit scheduling.",
      },
      { property: "og:title", content: "Candidate review — Diagnosphere.X" },
      { property: "og:description", content: "Explainable screening result awaiting human review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <p className="text-sm text-destructive">Could not load this candidate: {error.message}</p>
  ),
  component: CandidatePage,
});

const decisions = [
  { status: "under_review", label: "Mark under review" },
  { status: "contacted", label: "Outreach done" },
  { status: "consented", label: "Consent captured" },
  { status: "enrolled", label: "Enrol" },
  { status: "screen_failed", label: "Screen failure" },
  { status: "ineligible", label: "Not eligible" },
  { status: "withdrawn", label: "Withdraw" },
];

function OutcomeIcon({ outcome }: { outcome: string }) {
  if (outcome === "met") return <Check className="size-4 text-success" aria-label="met" />;
  if (outcome === "not_met") return <X className="size-4 text-destructive" aria-label="not met" />;
  return <HelpCircle className="size-4 text-muted-foreground" aria-label="unknown" />;
}

function CandidatePage() {
  const { candidateId } = Route.useParams();
  const qc = useQueryClient();
  const review = useServerFn(reviewCandidate);
  const consentFn = useServerFn(recordConsent);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: async () => {
      const { data: candidate } = await supabase
        .from("candidates")
        .select("*, participants(*), studies(*)")
        .eq("id", candidateId)
        .maybeSingle();
      if (!candidate) throw new Error("Candidate not found");
      const [{ data: consent }, { data: visits }] = await Promise.all([
        supabase
          .from("consents")
          .select("*")
          .eq("study_id", candidate.study_id)
          .eq("participant_id", candidate.participant_id)
          .maybeSingle(),
        supabase
          .from("visits")
          .select("*")
          .eq("participant_id", candidate.participant_id)
          .order("scheduled_at"),
      ]);
      return { candidate, consent, visits: visits ?? [] };
    },
  });

  const decide = useMutation({
    mutationFn: (status: string) => review({ data: { candidateId, status, note } }),
    onSuccess: () => {
      toast.success("Decision recorded and audited");
      setNote("");
      qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const consentMutation = useMutation({
    mutationFn: (status: string) =>
      consentFn({
        data: {
          studyId: data!.candidate.study_id,
          participantId: data!.candidate.participant_id,
          status,
        },
      }),
    onSuccess: () => {
      toast.success("Consent record updated");
      qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduleVisit = useMutation({
    mutationFn: async () => {
      const c = data!.candidate;
      const { error } = await supabase.from("visits").insert({
        org_id: c.org_id,
        study_id: c.study_id,
        participant_id: c.participant_id,
        site_id: c.site_id,
        visit_type: "screening",
        scheduled_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Screening visit scheduled in 7 days");
      qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading candidate…</p>;
  const { candidate, consent, visits } = data;
  const p = candidate.participants as any;
  const explanation = (candidate.explanation as any[]) ?? [];
  const stale = candidate.screened_protocol_version !== (candidate.studies as any)?.protocol_version;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/studies/$studyId"
          params={{ studyId: candidate.study_id }}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to study pipeline
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {p?.code} · match score {Number(candidate.match_score)}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusPill value={candidate.status} />
          <StatusPill value={candidate.confidence} />
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
            screened against {candidate.screened_protocol_version}
          </span>
          {stale && (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive">
              protocol changed since screening — re-screen before deciding
            </span>
          )}
        </div>
      </div>

      <SafetyBanner />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Participant record</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Age", p?.age ?? "not recorded"],
              ["Sex", p?.sex],
              ["City", p?.city],
              ["Conditions", (p?.conditions ?? []).join(", ") || "none recorded"],
              ["Medications", (p?.medications ?? []).join(", ") || "none recorded"],
              ["Contact consent", p?.contact_consent ? "yes" : "no"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{String(v)}</dd>
              </div>
            ))}
            {Object.entries((p?.attributes ?? {}) as Record<string, unknown>).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="surface p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Why this candidate was suggested</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each row shows the recorded value, the protocol requirement and the contribution to the
            score. Missing data is never treated as an automatic rejection.
          </p>
          <ul className="mt-4 divide-y divide-border text-sm">
            {explanation.map((e) => (
              <li key={e.criterionId} className="flex items-start gap-3 py-2.5">
                <OutcomeIcon outcome={e.outcome} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.label}</p>
                  <p className="text-xs text-muted-foreground">
                    recorded: {e.observed} · required: {e.expected} · {e.kind}
                    {e.hard ? " · hard rule" : " · soft rule"}
                  </p>
                </div>
                <span className="tabular-nums text-muted-foreground">
                  +{e.contribution}/{e.weight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Reviewer decision</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for this decision (recorded in the audit trail)"
            className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {decisions.map((d) => (
              <button
                key={d.status}
                onClick={() => decide.mutate(d.status)}
                disabled={decide.isPending}
                className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-60"
              >
                {d.label}
              </button>
            ))}
          </div>
          {candidate.reviewed_at && (
            <p className="mt-3 text-xs text-muted-foreground">
              Last decision {new Date(candidate.reviewed_at).toLocaleString()}
              {candidate.review_note ? ` — “${candidate.review_note}”` : ""}
            </p>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Consent &amp; visits</h2>
          <p className="mt-2 text-sm">
            Current consent: <StatusPill value={consent?.status ?? "not_started"} />
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["sent", "granted", "declined", "revoked"].map((s) => (
              <button
                key={s}
                onClick={() => consentMutation.mutate(s)}
                disabled={consentMutation.isPending}
                className="rounded-md border border-border px-3 py-1.5 text-sm capitalize hover:bg-muted disabled:opacity-60"
              >
                Mark {s}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Enrolment is refused by the server unless consent is recorded as granted. Revoking
            consent withdraws the candidate immediately.
          </p>

          <h3 className="mt-5 text-sm font-semibold">Scheduled visits</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {visits.map((v) => (
              <li key={v.id} className="flex justify-between">
                <span className="capitalize">{v.visit_type}</span>
                <span className="text-muted-foreground">
                  {new Date(v.scheduled_at).toLocaleDateString()} · {v.status}
                </span>
              </li>
            ))}
            {visits.length === 0 && <li className="text-muted-foreground">No visits yet.</li>}
          </ul>
          <button
            onClick={() => scheduleVisit.mutate()}
            disabled={scheduleVisit.isPending}
            className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Schedule screening visit
          </button>
        </div>
      </section>
    </div>
  );
}
