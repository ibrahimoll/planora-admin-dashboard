"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { api } from "@/lib/api";
import { Mail, RefreshCw, Send, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type DeliveryResponse = {
  success: boolean;
  message: string;
  project_id: number;
  project_title: string;
  address: string;
  delivered_at: string;
  export_id?: number | null;
};

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export function SendReportClient() {
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<DeliveryResponse | null>(null);

  useEffect(() => {
    const nextProjectId = searchParams.get("projectId") ?? "";
    const nextAddress = searchParams.get("address") ?? "";
    const nextName = searchParams.get("name") ?? "";

    if (!nextProjectId && !nextAddress && !nextName) return;

    setProjectId(nextProjectId);
    setAddress(nextAddress);
    setName(nextName);
    setAutoFilled(true);
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanProjectId = Number(projectId);
    const cleanAddress = address.trim();

    if (!Number.isFinite(cleanProjectId) || cleanProjectId <= 0) {
      setError("Open the request link again or enter a valid project ID.");
      return;
    }

    if (!cleanAddress) {
      setError("Open the request link again or enter the destination address.");
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
      setAutoFilled(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not send this report."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Reveal>
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {autoFilled ? (
              <div className="flex items-start gap-3 rounded-2xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm text-teal-100">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Request details are filled. Add your note, then send.</span>
              </div>
            ) : null}

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
                  placeholder="Filled from request"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-200">Destination</span>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  type="email"
                  placeholder="Filled from request"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
                />
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-slate-200">Name optional</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Filled when available"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-slate-200">Admin note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                placeholder="Write the note that will be included with the report."
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
            <p>The recipient gets a clean report email. The backend also saves report export history.</p>
          </div>
        </GlassCard>
      </Reveal>
    </>
  );
}
