"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { api } from "@/lib/api";
import { LockKeyhole, Mail, RefreshCw, Send, Sparkles } from "lucide-react";
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

type ReportRequestTokenResponse = {
  project_id: number;
  address: string;
  name?: string | null;
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
  const [resolvingToken, setResolvingToken] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [secureTokenUsed, setSecureTokenUsed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<DeliveryResponse | null>(null);

  useEffect(() => {
    const requestToken = searchParams.get("requestToken") ?? "";

    if (requestToken) {
      setResolvingToken(true);
      setError("");

      api
        .get<ReportRequestTokenResponse>("/reports/requests/resolve", {
          params: { token: requestToken },
        })
        .then((response) => {
          setProjectId(String(response.data.project_id));
          setAddress(response.data.address);
          setName(response.data.name ?? "");
          setAutoFilled(true);
          setSecureTokenUsed(true);
        })
        .catch((requestError) => {
          setError(getErrorMessage(requestError, "This report request link is invalid or expired."));
        })
        .finally(() => {
          setResolvingToken(false);
        });

      return;
    }

    const nextProjectId = searchParams.get("projectId") ?? "";
    const nextAddress = searchParams.get("address") ?? "";
    const nextName = searchParams.get("name") ?? "";

    if (!nextProjectId && !nextAddress && !nextName) return;

    setProjectId(nextProjectId);
    setAddress(nextAddress);
    setName(nextName);
    setAutoFilled(true);
    setSecureTokenUsed(false);
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
      setSecureTokenUsed(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not notify this user."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Reveal>
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {resolvingToken ? (
              <div className="flex items-start gap-3 rounded-2xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm text-teal-100">
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <span>Resolving secure report request...</span>
              </div>
            ) : null}

            {autoFilled ? (
              <div className="flex items-start gap-3 rounded-2xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm text-teal-100">
                {secureTokenUsed ? (
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>
                  {secureTokenUsed
                    ? "Secure request verified. Add your note, then notify the user."
                    : "Request details are filled. Add your note, then notify the user."}
                </span>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Report marked ready. {success.address} was notified to open Planora and view it in the app.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-200">Project ID</span>
                <input
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  inputMode="numeric"
                  placeholder="Filled from secure request"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-200">Destination</span>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  type="email"
                  placeholder="Filled from secure request"
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
                placeholder="Write the note that will be included with the ready-report notification."
                className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
              />
            </label>

            <button
              type="submit"
              disabled={loading || resolvingToken}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-500/30 bg-teal-500/15 px-5 py-3 text-sm font-bold text-teal-100 transition hover:border-teal-400/50 hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {loading ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}
              {loading ? "Marking report ready..." : "Mark Ready & Notify User"}
            </button>
          </form>
        </GlassCard>
      </Reveal>

      <Reveal>
        <GlassCard className="p-5">
          <div className="flex gap-3 text-sm leading-6 text-slate-300">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
            <p>The email link uses a signed token, not visible project IDs or user email. The user gets a ready notice and views the report inside the Planora app.</p>
          </div>
        </GlassCard>
      </Reveal>
    </>
  );
}
