import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusPill } from "@/components/StatusPill";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & visits — Diagnosphere.X" },
      {
        name: "description",
        content:
          "Coordinator task list and upcoming study visits across every recruiting study in the organisation.",
      },
      { property: "og:title", content: "Tasks & visits — Diagnosphere.X" },
      { property: "og:description", content: "Coordinator workload and study visit schedule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [studyId, setStudyId] = useState("");
  const [due, setDue] = useState("");

  const { data } = useQuery({
    queryKey: ["tasks-visits"],
    queryFn: async () => {
      const [tasks, visits, studies] = await Promise.all([
        supabase.from("tasks").select("*, studies(code)").order("created_at", { ascending: false }),
        supabase
          .from("visits")
          .select("*, participants(code), sites(name)")
          .order("scheduled_at"),
        supabase.from("studies").select("id, code"),
      ]);
      return { tasks: tasks.data ?? [], visits: visits.data ?? [], studies: studies.data ?? [] };
    },
  });

  const addTask = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").maybeSingle();
      if (!profile) throw new Error("No organisation linked to this account");
      const { error } = await supabase.from("tasks").insert({
        org_id: profile.org_id,
        study_id: studyId || null,
        title,
        due_at: due ? new Date(due).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task created");
      setTitle("");
      setDue("");
      qc.invalidateQueries({ queryKey: ["tasks-visits"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "in_progress" | "done" | "blocked" }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks-visits"] }),
  });

  const setVisitStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "scheduled" | "completed" | "missed" | "cancelled" }) => {
      const { error } = await supabase.from("visits").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks-visits"] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tasks &amp; visits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Coordinator workload and the study visit schedule in one place.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTask.mutate();
        }}
        className="surface flex flex-wrap items-end gap-3 p-5"
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="title" className="text-sm font-medium">
            New task
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Call P-0006 about screening visit"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="study" className="text-sm font-medium">
            Study
          </label>
          <select
            id="study"
            value={studyId}
            onChange={(e) => setStudyId(e.target.value)}
            className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {(data?.studies ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="due" className="text-sm font-medium">
            Due
          </label>
          <input
            id="due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add task
        </button>
      </form>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Tasks</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(data?.tasks ?? []).map((t: any) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.studies?.code ?? "general"}
                    {t.due_at ? ` · due ${new Date(t.due_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={t.status} />
                  {t.status !== "done" && (
                    <button
                      onClick={() => setStatus.mutate({ id: t.id, status: "done" })}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </li>
            ))}
            {(data?.tasks ?? []).length === 0 && (
              <li className="py-4 text-muted-foreground">No tasks yet.</li>
            )}
          </ul>
        </div>

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Upcoming visits</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(data?.visits ?? []).map((v: any) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">
                    {v.participants?.code} · <span className="capitalize">{v.visit_type}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(v.scheduled_at).toLocaleString()} · {v.sites?.name ?? "site TBC"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={v.status} />
                  {v.status === "scheduled" && (
                    <>
                      <button
                        onClick={() => setVisitStatus.mutate({ id: v.id, status: "completed" })}
                        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => setVisitStatus.mutate({ id: v.id, status: "missed" })}
                        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        Missed
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
            {(data?.visits ?? []).length === 0 && (
              <li className="py-4 text-muted-foreground">No visits scheduled.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
