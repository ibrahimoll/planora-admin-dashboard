"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import type {
  AdminProjectReportResponse,
  AdminProjectSummary,
} from "@/types/admin";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock3,
  FileText,
  FolderKanban,
  ListChecks,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";

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

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString();
}

function formatHours(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}h`;
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold capitalize text-teal-100">
      {formatStatus(value)}
    </span>
  );
}

export default function AdminReportsPage() {
  const [projects, setProjects] = useState<AdminProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [report, setReport] = useState<AdminProjectReportResponse | null>(null);
  const [search, setSearch] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return projects;

    return projects.filter((project) => {
      return (
        project.title.toLowerCase().includes(term) ||
        project.status.toLowerCase().includes(term) ||
        project.project_type.toLowerCase().includes(term) ||
        project.owner.full_name.toLowerCase().includes(term) ||
        project.owner.email.toLowerCase().includes(term)
      );
    });
  }, [projects, search]);

  const progressPercent = clampPercent(
    report?.progress.completion_percentage ?? 0,
  );

  async function fetchProjects() {
    setLoadingProjects(true);
    setError("");

    try {
      const response = await api.get<AdminProjectSummary[]>("/admin/projects", {
        params: {
          limit: 100,
          offset: 0,
        },
      });

      setProjects(response.data);

      if (response.data.length > 0) {
        setSelectedProjectId((current) => current ?? response.data[0].project_id);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to load projects for reports.",
        ),
      );
    } finally {
      setLoadingProjects(false);
    }
  }

  async function fetchReport(projectId: number) {
    setLoadingReport(true);
    setError("");

    try {
      const response = await api.get<AdminProjectReportResponse>(
        `/reports/projects/${projectId}`,
      );

      setReport(response.data);
    } catch (requestError) {
      setReport(null);
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to generate this project report.",
        ),
      );
    } finally {
      setLoadingReport(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchReport(selectedProjectId);
    }
  }, [selectedProjectId]);

  return (
    <PageTransition>
      <div className="space-y-8">
        <Reveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
                Reports
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Project reports
              </h1>
              <p className="mt-3 max-w-3xl text-slate-400">
                Generate admin-level project reports with progress, workload,
                activity, members, task counts, and task details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                fetchProjects();
                if (selectedProjectId) fetchReport(selectedProjectId);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-teal-500/30 hover:text-teal-100"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </Reveal>

        {error && (
          <Reveal>
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          </Reveal>
        )}

        <Reveal>
          <GlassCard>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Search projects
                </label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, owner, type, or status..."
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Select project
                </label>
                <select
                  value={selectedProjectId ?? ""}
                  onChange={(event) =>
                    setSelectedProjectId(Number(event.target.value))
                  }
                  disabled={loadingProjects || filteredProjects.length === 0}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-500"
                >
                  {filteredProjects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingProjects && (
              <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Loading projects...
              </div>
            )}

            {!loadingProjects && projects.length === 0 && (
              <p className="mt-5 text-sm text-slate-400">
                No projects found yet.
              </p>
            )}
          </GlassCard>
        </Reveal>

        {loadingReport && (
          <Reveal>
            <GlassCard>
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 size={18} className="animate-spin text-teal-300" />
                Generating report...
              </div>
            </GlassCard>
          </Reveal>
        )}

        {report && !loadingReport && (
          <>
            <Reveal>
              <GlassCard glow="cyan">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">
                        {report.project.title}
                      </h2>
                      <StatusBadge value={report.project.status} />
                    </div>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                      {report.project.description || "No description provided."}
                    </p>

                    <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                      <div>
                        <p className="text-slate-500">Type</p>
                        <p className="mt-1 font-semibold capitalize text-white">
                          {report.project.project_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Deadline</p>
                        <p className="mt-1 font-semibold text-white">
                          {formatDate(report.project.deadline)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Generated</p>
                        <p className="mt-1 font-semibold text-white">
                          {formatDateTime(report.generated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-5 text-center">
                    <p className="text-sm font-semibold text-teal-100">
                      Completion
                    </p>
                    <p className="mt-2 text-4xl font-bold text-white">
                      {progressPercent}%
                    </p>
                    <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-teal-400"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total tasks"
                  value={formatNumber(report.progress.total_tasks)}
                  detail={`${formatNumber(report.progress.completed_tasks)} completed`}
                  icon={ListChecks}
                  accent="cyan"
                />
                <StatCard
                  title="Pending"
                  value={formatNumber(report.progress.pending_tasks)}
                  detail={`${formatNumber(report.progress.overdue_tasks)} overdue`}
                  icon={Clock3}
                  accent={report.progress.overdue_tasks > 0 ? "rose" : "amber"}
                />
                <StatCard
                  title="Members"
                  value={formatNumber(report.members.length)}
                  detail="Project participants"
                  icon={Users}
                  accent="purple"
                />
                <StatCard
                  title="Activity"
                  value={formatNumber(
                    report.activity.comments_count +
                      report.activity.attachments_count,
                  )}
                  detail="Comments and attachments"
                  icon={Activity}
                  accent="emerald"
                />
              </div>
            </Reveal>

            <div className="grid gap-6 xl:grid-cols-3">
              <Reveal>
                <GlassCard>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <FolderKanban size={18} className="text-teal-300" />
                    Task status
                  </h3>

                  <div className="mt-5 space-y-3 text-sm">
                    {Object.entries(report.task_status_counts).map(
                      ([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3"
                        >
                          <span className="capitalize text-slate-300">
                            {formatStatus(label)}
                          </span>
                          <span className="font-semibold text-white">
                            {formatNumber(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </GlassCard>
              </Reveal>

              <Reveal>
                <GlassCard>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <AlertTriangle size={18} className="text-amber-300" />
                    Priority counts
                  </h3>

                  <div className="mt-5 space-y-3 text-sm">
                    {Object.entries(report.task_priority_counts).map(
                      ([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3"
                        >
                          <span className="capitalize text-slate-300">
                            {label}
                          </span>
                          <span className="font-semibold text-white">
                            {formatNumber(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </GlassCard>
              </Reveal>

              <Reveal>
                <GlassCard>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <CalendarDays size={18} className="text-emerald-300" />
                    Hours and activity
                  </h3>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3">
                      <span className="text-slate-300">Estimated hours</span>
                      <span className="font-semibold text-white">
                        {formatHours(report.hours.estimated_hours_total)}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3">
                      <span className="text-slate-300">Actual hours</span>
                      <span className="font-semibold text-white">
                        {formatHours(report.hours.actual_hours_total)}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3">
                      <span className="text-slate-300">Reminders</span>
                      <span className="font-semibold text-white">
                        {formatNumber(report.activity.deadline_reminders_count)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <Reveal>
                <GlassCard>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Users size={18} className="text-violet-300" />
                    Members
                  </h3>

                  <div className="mt-5 space-y-3">
                    {report.members.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No members found for this project.
                      </p>
                    ) : (
                      report.members.map((member) => (
                        <div
                          key={member.user_id}
                          className="rounded-xl border border-slate-800 bg-slate-950/35 p-4"
                        >
                          <p className="font-semibold text-white">
                            {member.full_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {member.email}
                          </p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">
                            {member.role}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>
              </Reveal>

              <Reveal>
                <GlassCard>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <FileText size={18} className="text-teal-300" />
                    Tasks
                  </h3>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800">
                    <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr] bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <span>Task</span>
                      <span>Status</span>
                      <span>Priority</span>
                      <span>Due</span>
                    </div>

                    {report.tasks.length === 0 ? (
                      <p className="px-4 py-5 text-sm text-slate-400">
                        No tasks found for this project.
                      </p>
                    ) : (
                      report.tasks.map((task) => (
                        <div
                          key={task.task_id}
                          className="grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr] gap-3 border-t border-slate-800 px-4 py-4 text-sm"
                        >
                          <div>
                            <p className="font-medium text-white">
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Assigned to: {task.assigned_to ?? "Unassigned"}
                            </p>
                          </div>
                          <span className="capitalize text-slate-300">
                            {formatStatus(task.status)}
                          </span>
                          <span className="capitalize text-slate-300">
                            {task.priority}
                          </span>
                          <span className="text-slate-300">
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>
              </Reveal>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}