import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/participants")({
  head: () => ({
    meta: [
      { title: "Participant registry — Diagnosphere.X" },
      {
        name: "description",
        content:
          "De-identified participant registry used for study screening, with contact consent and recorded clinical attributes.",
      },
      { property: "og:title", content: "Participant registry — Diagnosphere.X" },
      { property: "og:description", content: "De-identified registry records used for study screening." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ParticipantsPage,
});

const empty = {
  code: "",
  age: "",
  sex: "female",
  city: "",
  conditions: "",
  medications: "",
  hba1c: "",
  sbp: "",
  egfr: "",
  bmi: "",
  distance_km: "",
  contact_consent: true,
};

function ParticipantsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  const { data: participants } = useQuery({
    queryKey: ["participants"],
    queryFn: async () =>
      (await supabase.from("participants").select("*").order("code")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").maybeSingle();
      if (!profile) throw new Error("No organisation linked to this account");
      const num = (v: string) => (v === "" ? undefined : Number(v));
      const { error } = await supabase.from("participants").insert({
        org_id: profile.org_id,
        code: form.code,
        display_name: `Registry record ${form.code}`,
        age: form.age === "" ? null : Number(form.age),
        sex: form.sex,
        city: form.city,
        contact_consent: form.contact_consent,
        conditions: form.conditions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        medications: form.medications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        attributes: Object.fromEntries(
          Object.entries({
            hba1c: num(form.hba1c),
            sbp: num(form.sbp),
            egfr: num(form.egfr),
            bmi: num(form.bmi),
            distance_km: num(form.distance_km),
          }).filter(([, v]) => v !== undefined),
        ),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Participant added to the registry");
      setForm(empty);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["participants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (participants ?? []).filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      (p.conditions ?? []).join(" ").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Participant registry</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            De-identified records only. Codes replace names; no direct identifiers are stored in
            this prototype.
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {open ? "Cancel" : "Add record"}
        </button>
      </header>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="surface grid gap-4 p-5 sm:grid-cols-3"
        >
          {(
            [
              ["code", "Record code"],
              ["age", "Age"],
              ["city", "City"],
              ["conditions", "Conditions (comma separated)"],
              ["medications", "Medications (comma separated)"],
              ["hba1c", "HbA1c (%)"],
              ["sbp", "Systolic BP"],
              ["egfr", "eGFR"],
              ["bmi", "BMI"],
              ["distance_km", "Distance to site (km)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={key} className="text-sm font-medium">
                {label}
              </label>
              <input
                id={key}
                required={key === "code"}
                value={String(form[key])}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label htmlFor="sex" className="text-sm font-medium">
              Sex
            </label>
            <select
              id="sex"
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="female">female</option>
              <option value="male">male</option>
              <option value="other">other</option>
              <option value="unknown">unknown</option>
            </select>
          </div>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={form.contact_consent}
              onChange={(e) => setForm({ ...form, contact_consent: e.target.checked })}
            />
            Consent to be contacted about research
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Save record
            </button>
          </div>
        </form>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by code, city or condition"
        className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      <div className="surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Age / sex</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Conditions</th>
              <th className="px-4 py-3">Key values</th>
              <th className="px-4 py-3">Contactable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.code}</td>
                <td className="px-4 py-3">
                  {p.age ?? "?"} · {p.sex}
                </td>
                <td className="px-4 py-3">{p.city}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(p.conditions ?? []).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {Object.entries((p.attributes ?? {}) as Record<string, unknown>)
                    .map(([k, v]) => `${k} ${String(v)}`)
                    .join(" · ")}
                </td>
                <td className="px-4 py-3">{p.contact_consent ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
