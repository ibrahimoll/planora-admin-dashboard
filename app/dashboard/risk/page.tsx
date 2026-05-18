"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import type {
  AdminHighRiskProject,
  AdminRiskCenterSummary,
} from "@/types/admin";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const emptySummary: AdminRiskCenterSummary = {
  total_projects: 0,
  projects_with_risk_records: 0,
  high_risk_projects: 0,
  medium_risk_projects: 0,
  low_risk_projects: 0,
  overdue_active_projects: 0,
  blocked_task_projects: 0,
  generated_at: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError;
  return apiError.response?.data?.detail ?? fallback;
}

function formatCount(value: number | undefined) {
  return (value ?? 0).toLocaleString();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

function riskBadgeClass(level: string) {
  if (level === "high") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  if (level === "medium") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
}

function riskLabel(level: string) {
  return level.replaceAll("_", " ");
}

export default function AdminRiskPage() {
  const [summary, setSummary] =
    useState<AdminRiskCenterSummary>(emptySummary);
  const [projects, setProjects] = useState<AdminHighRiskProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRiskData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [summaryResponse, highRiskResponse] = await Promise.all([
        api.get<AdminRiskCenterSummary>("/admin/risk/summary"),
        api.get<AdminHighRiskProject[]>("/admin/risk/high-risk-projects", {
          params: {
            limit: 50,
            offset: 0,
          },
        }),
      ]);

      setSummary({ ...emptySummary, ...summaryResponse.data });
      setProjects(highRiskResponse.data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load risk center data."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
        void loadRiskData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    }, [loadRiskData]);

  const riskState = useMemo(() => {
    if (summary.high_risk_projects > 0) {
      return {
        label: "Critical attention",
        detail: "High-risk projects need admin review.",
        icon: ShieldAlert,
        className: "border-rose-500/20 bg-rose-500/10 text-rose-200",
      };
    }

    if (
      summary.medium_risk_projects > 0 ||
      summary.overdue_active_projects > 0 ||
      summary.blocked_task_projects > 0
    ) {
      return {
        label: "Needs monitoring",
        detail: "Some delivery signals need follow-up.",
        icon: AlertTriangle,
        className: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      };
    }

    return {
      label: "Stable",
      detail: "No major risk signals found.",
      icon: ShieldCheck,
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    };
  }, [summary]);

  const RiskIcon = riskState.icon;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-300">
            Risk center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Delivery risk overview
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review high-risk projects, delay predictions, blocked work, overdue
            active projects, and AI-generated recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRiskData()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <GlassCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Current risk state
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${riskState.className}`}
              >
                <RiskIcon size={16} />
                {isLoading ? "Loading..." : riskState.label}
              </span>
              <span className="text-sm text-slate-400">
                Last updated:{" "}
                <span className="font-medium text-slate-200">
                  {isLoading ? "Loading..." : formatDateTime(summary.generated_at)}
                </span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {riskState.detail}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Risk coverage
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {isLoading
                ? "--"
                : `${formatCount(summary.projects_with_risk_records)} / ${formatCount(
                    summary.total_projects,
                  )}`}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Projects with saved risk records
            </p>
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="High risk"
          value={isLoading ? "--" : formatCount(summary.high_risk_projects)}
          detail="Critical projects"
          icon={ShieldAlert}
          accent="rose"
        />
        <StatCard
          title="Medium risk"
          value={isLoading ? "--" : formatCount(summary.medium_risk_projects)}
          detail="Watch closely"
          icon={AlertTriangle}
          accent="amber"
        />
        <StatCard
          title="Low risk"
          value={isLoading ? "--" : formatCount(summary.low_risk_projects)}
          detail="Currently stable"
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Risk records"
          value={
            isLoading
              ? "--"
              : formatCount(summary.projects_with_risk_records)
          }
          detail="Projects analyzed"
          icon={Gauge}
          accent="cyan"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <GlassCard glow="amber">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Overdue active projects
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {isLoading
                  ? "--"
                  : formatCount(summary.overdue_active_projects)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Active projects with deadlines that need attention.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
              <TimerReset size={22} />
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="rose">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Blocked-task projects
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {isLoading
                  ? "--"
                  : formatCount(summary.blocked_task_projects)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Projects with blocked work that can slow delivery.
              </p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-200">
              <AlertTriangle size={22} />
            </div>
          </div>
        </GlassCard>
      </section>

      <Reveal>
        <GlassCard>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              High-risk projects
            </p>
            <h2 className="text-2xl font-bold text-white">
              Projects needing review
            </h2>
            <p className="text-sm leading-6 text-slate-400">
              These records come from the latest project risk analyses saved by
              the backend.
            </p>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-slate-300">
                  <Loader2 size={20} className="animate-spin text-teal-300" />
                  Loading risk records...
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-5 py-12 text-center">
                <ShieldCheck size={36} className="mx-auto text-emerald-300" />
                <h3 className="mt-4 text-lg font-semibold text-white">
                  No high-risk projects
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  There are no high-risk projects in the current risk report.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((item) => (
                  <div
                    key={item.risk_id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${riskBadgeClass(
                              item.risk_level,
                            )}`}
                          >
                            {riskLabel(item.risk_level)}
                          </span>

                          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                            {item.predicted_delay_days} predicted delay days
                          </span>

                          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                            Risk #{item.risk_id}
                          </span>
                        </div>

                        <h3 className="mt-4 text-xl font-semibold text-white">
                          {item.project.title}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <FolderKanban size={14} />
                            {item.project.project_type}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={14} />
                            {item.project.team
                              ? item.project.team.name
                              : item.project.owner.full_name}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            Deadline: {formatDate(item.project.deadline)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={14} />
                            Risk saved: {formatDateTime(item.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                          <p className="text-lg font-semibold text-white">
                            {item.project.task_stats.completion_percentage}%
                          </p>
                          <p className="text-xs text-slate-500">Complete</p>
                        </div>
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                          <p className="text-lg font-semibold text-amber-100">
                            {item.project.task_stats.overdue_tasks}
                          </p>
                          <p className="text-xs text-amber-300/80">Overdue</p>
                        </div>
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
                          <p className="text-lg font-semibold text-rose-100">
                            {item.project.task_stats.blocked_tasks}
                          </p>
                          <p className="text-xs text-rose-300/80">Blocked</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Reason
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {item.reason}
                        </p>
                      </div>

                      <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">
                          Recommendation
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {item.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </Reveal>
    </PageTransition>
  );
}