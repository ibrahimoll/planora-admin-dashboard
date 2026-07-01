"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { api } from "@/lib/api";
import { Mail, RefreshCw, Send } from "lucide-react";
import { FormEvent, useState } from "react";

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

type DeliveryResponse = {
  success: boolean;
  message: string;
  project_id: number;
  project_title: string;
  address: string;
  delivered_at: string;
  export_id?: number | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export default function SendReportPage() {
  const [projectId, setProjectId] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<DeliveryResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanProjectId = Number(projectId);
    const cleanAddress = address.trim();

    if (!Number.isFinite(cleanProjectId) || cleanProjectId <= 0) {
      setError("Enter a valid project ID from the report request email/SMS.");
      return;
    }

    if (!cleanAddress) {
      setError("Enter the user's email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const response = await api.post<DeliveryResponse>(
        `/reports/projects/${cleanProjectId}/deliver`,
        {
          address: cleanAddress,
          name: name.trim() || null,
          note: note.trim() || null,
        },
      );

      setSuccess(response.data);
      setProjectId("");
      setAddress("");
      setName("");
      setNote("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not send this report."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
            Report Delivery
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Send Project Report
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Use the project ID and user email from the report request message. Planora will generate the latest report and email it to the user.
          </p>
        </div>
      </div>

      <Reveal>
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Report sent to {success.address} for {success.project_title}.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-200">Project ID</span>
                <input
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  inputMode="numeric"
                  placeholder="Example: 42"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-200">User email</span>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  type="email"
                  placeholder="user@example.com"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
                />
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-slate-200">User name optional</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="User display name"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-slate-200">Admin note optional</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                placeholder="Example: I reviewed the project progress and attached the latest task summary below."
                className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-500/30 bg-teal-500/15 px-5 py-3 text-sm font-bold text-teal-100 transition hover:border-teal-400/50 hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {loading ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}
              {loading ? "Sending report..." : "Generate & Send Report"}
            </button>
          </form>
        </GlassCard>
      </Reveal>

      <Reveal>
        <GlassCard className="p-5">
          <div className="flex gap-3 text-sm leading-6 text-slate-300">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
            <p>
              The user receives a clean email report with project status, progress, hours, activity, and task summary. The backend also saves a report export history entry.
            </p>
          </div>
        </GlassCard>
      </Reveal>
    </PageTransition>
  );
}
