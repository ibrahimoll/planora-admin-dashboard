"use client";

import { AdminEmptyState } from "@/components/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/ui/AdminLoadingState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { api } from "@/lib/api";
import { CheckCircle2, Clock3, RefreshCw, Send, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type RequestStatus = "pending" | "ready" | "rejected";

type ReportRequestItem = {
  report_request_id: number;
  project: {
    project_id: number;
    title: string;
    project_type: string;
    status: string;
  };
  requester: {
    user_id?: number | null;
    full_name?: string | null;
    email?: string | null;
    username?: string | null;
  };
  status: RequestStatus;
  admin_note?: string | null;
  rejection_reason?: string | null;
  report_export_id?: number | null;
  requested_at: string;
  resolved_at?: string | null;
};

type ReportRequestListResponse = {
  items: ReportRequestItem[];
  total: number;
};

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const tabs: Array<{ label: string; value: RequestStatus | "all" }> = [
  { label: "Pending", value: "pending" },
  { label: "Ready", value: "ready" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

function getErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status: RequestStatus) {
  if (status === "ready") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
  if (status === "rejected") return "border-rose-500/25 bg-rose-500/10 text-rose-100";
  return "border-amber-500/25 bg-amber-500/10 text-amber-100";
}

export default function ReportRequestsPage() {
  const [status, setStatus] = useState<RequestStatus | "all">("pending");
  const [requests, setRequests] = useState<ReportRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === "pending").length,
    [requests],
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<ReportRequestListResponse>(
        "/reports/admin/requests",
        { params: { status } },
      );
      setRequests(response.data.items ?? []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load report requests."));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function sendToMobile(request: ReportRequestItem) {
    setActionId(request.report_request_id);
    setError("");
    setNotice("");

    try {
      await api.post(`/reports/admin/requests/${request.report_request_id}/ready`, {
        note: noteDrafts[request.report_request_id]?.trim() || null,
      });
      setNotice("Report sent to mobile. The user can open Planora and view it inside the project Reports card.");
      await loadRequests();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not send this report to mobile."));
    } finally {
      setActionId(null);
    }
  }

  async function rejectRequest(request: ReportRequestItem) {
    const reason = window.prompt("Reason for rejecting this report request?");
    if (reason === null) return;

    setActionId(request.report_request_id);
    setError("");
    setNotice("");

    try {
      await api.post(`/reports/admin/requests/${request.report_request_id}/reject`, {
        reason: reason.trim() || null,
      });
      setNotice("Report request rejected.");
      await loadRequests();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not reject this request."));
    } finally {
      setActionId(null);
    }
  }

  return (
    <PageTransition className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
            Report Requests
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Report Requests Center
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review pending user requests, send approved reports to the mobile app, or reject requests. Users see the status inside the mobile app.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-teal-400/50 hover:text-teal-100 disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-amber-500/10 p-3 text-amber-200">
              <Clock3 size={22} />
            </span>
            <div>
              <p className="text-sm text-slate-400">Visible pending</p>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 md:col-span-2">
          <p className="text-sm leading-6 text-slate-300">
            <span className="font-semibold text-white">Send to Mobile</span> generates a report export, marks the request ready, emails the user only a ready notice, and creates an in-app notification. The full report stays inside Planora.
          </p>
        </GlassCard>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={[
              "rounded-2xl border px-4 py-2 text-sm font-bold transition",
              status === tab.value
                ? "border-teal-400/50 bg-teal-500/15 text-teal-100"
                : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-teal-400/30 hover:text-white",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingState message="Loading report requests..." />
      ) : requests.length === 0 ? (
        <AdminEmptyState
          icon={CheckCircle2}
          title="No report requests"
          message="There are no requests in this filter."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <Reveal key={request.report_request_id} delay={index * 0.03}>
              <GlassCard className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusTone(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Requested {formatDateTime(request.requested_at)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-white">
                      {request.project.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {request.project.project_type} project • project status {request.project.status}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      Requested by <span className="font-semibold text-white">{request.requester.full_name ?? "Unknown user"}</span>
                      {request.requester.email ? ` • ${request.requester.email}` : ""}
                    </p>

                    {request.status === "pending" ? (
                      <textarea
                        value={noteDrafts[request.report_request_id] ?? ""}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [request.report_request_id]: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Admin note for the user optional"
                        className="mt-4 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60"
                      />
                    ) : null}

                    {request.admin_note ? (
                      <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                        Admin note: {request.admin_note}
                      </p>
                    ) : null}

                    {request.rejection_reason ? (
                      <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        Rejection reason: {request.rejection_reason}
                      </p>
                    ) : null}
                  </div>

                  {request.status === "pending" ? (
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                      <button
                        onClick={() => sendToMobile(request)}
                        disabled={actionId === request.report_request_id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {actionId === request.report_request_id ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}
                        {actionId === request.report_request_id ? "Sending to mobile..." : "Send to Mobile"}
                      </button>
                      <button
                        onClick={() => rejectRequest(request)}
                        disabled={actionId === request.report_request_id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-500/15 disabled:opacity-60"
                      >
                        <XCircle size={17} />
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
