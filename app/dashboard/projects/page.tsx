"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { api } from "@/lib/api";
import type {
  AdminProjectDetail,
  AdminProjectStatus,
  AdminProjectStatusUpdateResponse,
  AdminProjectSummary,
  AdminProjectType,
} from "@/types/admin";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilterX,
  FolderKanban,
  ListChecks,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | AdminProjectStatus;
type TypeFilter = "all" | AdminProjectType;

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const statusOrder: AdminProjectStatus[] = [
  "not_started",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
];

const statusLabels: Record<AdminProjectStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

const statusClasses: Record<AdminProjectStatus, string> = {
  not_started: "border-slate-700 bg-slate-900/70 text-slate-300",
  in_progress: "border-teal-500/20 bg-teal-500/10 text-teal-200",
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  on_hold: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-200",
};

const statusFilterOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "All status", value: "all" },
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "On hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const projectStatusOptions: Array<{
  label: string;
  value: AdminProjectStatus;
}> = [
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "On hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const typeOptions: Array<{ label: string; value: TypeFilter }> = [
  { label: "All types", value: "all" },
  { label: "Personal", value: "personal" },
  { label: "Team", value: "team" },
];

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isOverdue(deadline: string, status: AdminProjectStatus) {
  return status !== "completed" && new Date(deadline).getTime() < Date.now();
}

function getDeadlineText(deadline: string, status: AdminProjectStatus) {
  if (status === "completed") return "Completed";

  const today = new Date();
  const deadlineDate = new Date(deadline);
  const difference = deadlineDate.getTime() - today.getTime();
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)} days late`;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";

  return `${days} days left`;
}

function getRiskClasses(project: AdminProjectSummary | AdminProjectDetail) {
  const risk = project.latest_risk?.risk_level;

  if (risk === "high") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  if (risk === "medium") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  if (risk === "low") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  return "border-slate-700 bg-slate-900/70 text-slate-300";
}

function StatusPill({ status }: { status: AdminProjectStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function FilterButton<T extends string>({
  label,
  value,
  current,
  onChange,
}: {
  label: string;
  value: T;
  current: T;
  onChange: (value: T) => void;
}) {
  const active = value === current;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
        active
          ? "border-teal-500/35 bg-teal-500/15 text-teal-100"
          : "border-slate-800 bg-slate-950/45 text-slate-400 hover:border-teal-500/25 hover:text-teal-100"
      }`}
    >
      {label}
    </button>
  );
}

function ProjectProgress({ value }: { value: number }) {
  const percent = clampPercent(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-400">Progress</span>
        <span className="font-semibold text-white">{percent}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-teal-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [selectedProject, setSelectedProject] =
    useState<AdminProjectDetail | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [ownerId, setOwnerId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [newStatus, setNewStatus] = useState<AdminProjectStatus>("not_started");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const groupedProjects = useMemo(() => {
    return statusOrder
      .map((status) => ({
        status,
        projects: projects.filter((project) => project.status === status),
      }))
      .filter((group) => {
        if (statusFilter !== "all") {
          return group.status === statusFilter;
        }

        return group.projects.length > 0;
      });
  }, [projects, statusFilter]);

  async function fetchProjects() {
    const response = await api.get<AdminProjectSummary[]>("/admin/projects", {
      params: {
        limit,
        offset,
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        project_type: typeFilter === "all" ? undefined : typeFilter,
        owner_id: parseOptionalNumber(ownerId),
        team_id: parseOptionalNumber(teamId),
      },
    });

    return response.data;
  }

  async function refreshProjects() {
    setError("");
    setNotice("");
    setLoadingProjects(true);

    try {
      const data = await fetchProjects();
      setProjects(data);

      setSelectedProjectId((current) => {
        if (data.length === 0) {
          setSelectedProject(null);
          return null;
        }

        if (current && data.some((project) => project.project_id === current)) {
          return current;
        }

        return data[0].project_id;
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to refresh projects right now.",
        ),
      );
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      setLoadingProjects(true);
      setError("");

      try {
        const response = await api.get<AdminProjectSummary[]>(
          "/admin/projects",
          {
            signal: controller.signal,
            params: {
              limit,
              offset,
              search: search.trim() || undefined,
              status: statusFilter === "all" ? undefined : statusFilter,
              project_type: typeFilter === "all" ? undefined : typeFilter,
              owner_id: parseOptionalNumber(ownerId),
              team_id: parseOptionalNumber(teamId),
            },
          },
        );

        setProjects(response.data);

        if (response.data.length === 0) {
          setSelectedProjectId(null);
          setSelectedProject(null);
          return;
        }

        setSelectedProjectId((current) => {
          if (
            current &&
            response.data.some((project) => project.project_id === current)
          ) {
            return current;
          }

          return response.data[0].project_id;
        });
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load projects right now.",
            ),
          );
          setProjects([]);
          setSelectedProjectId(null);
          setSelectedProject(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProjects(false);
        }
      }
    }

    const timeoutId = window.setTimeout(loadProjects, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [limit, offset, ownerId, search, statusFilter, teamId, typeFilter]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const controller = new AbortController();

    async function loadProjectDetail() {
      setLoadingDetail(true);

      try {
        const response = await api.get<AdminProjectDetail>(
          `/admin/projects/${selectedProjectId}`,
          { signal: controller.signal },
        );

        setSelectedProject(response.data);
        setNewStatus(response.data.status);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load the selected project.",
            ),
          );
          setSelectedProject(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDetail(false);
        }
      }
    }

    loadProjectDetail();

    return () => controller.abort();
  }, [selectedProjectId]);

  async function handleStatusUpdate() {
    if (!selectedProject) return;

    setSavingStatus(true);
    setError("");
    setNotice("");

    try {
      const response = await api.patch<AdminProjectStatusUpdateResponse>(
        `/admin/projects/${selectedProject.project_id}/status`,
        { status: newStatus },
      );

      setNotice(response.data.message);
      setSelectedProject(response.data.project);
      setNewStatus(response.data.project.status);

      const data = await fetchProjects();
      setProjects(data);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to update this project status right now.",
        ),
      );
    } finally {
      setSavingStatus(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setOwnerId("");
    setTeamId("");
    setOffset(0);
  }

  function goToPreviousPage() {
    setOffset((current) => Math.max(0, current - limit));
  }

  function goToNextPage() {
    if (projects.length < limit) return;
    setOffset((current) => current + limit);
  }

  return (
    <PageTransition className="space-y-6 pb-10">
      {(error || notice) && (
        <GlassCard
          className={
            error
              ? "border-rose-500/20 bg-rose-500/10"
              : "border-emerald-500/20 bg-emerald-500/10"
          }
          glow={error ? "rose" : "cyan"}
        >
          <div
            className={`flex items-center gap-3 ${
              error ? "text-rose-100" : "text-emerald-100"
            }`}
          >
            {error ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            <p className="text-sm">{error || notice}</p>
          </div>
        </GlassCard>
      )}

      <Reveal delay={0.06}>
        <section className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:items-start">
          <GlassCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                    Projects
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Projects by status
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Projects are grouped vertically so cards stay visible and
                    easy to select.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 xl:w-96">
                    <Search size={18} className="shrink-0 text-slate-500" />
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setOffset(0);
                      }}
                      className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="Search title or description..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={refreshProjects}
                    disabled={loadingProjects}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={17}
                      className={loadingProjects ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-4 border-y border-slate-800 py-4 xl:grid-cols-[minmax(0,1fr)_1px_auto] xl:items-start">
                <div className="flex flex-wrap items-start gap-2">
                  {statusFilterOptions.map((option) => (
                    <FilterButton
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      current={statusFilter}
                      onChange={(value) => {
                        setStatusFilter(value);
                        setOffset(0);
                      }}
                    />
                  ))}
                </div>

                <div
                  aria-hidden="true"
                  className="hidden h-full min-h-10 w-px bg-slate-800 xl:block"
                />

                <div className="flex flex-wrap items-start gap-2 xl:justify-end">
                  {typeOptions.map((option) => (
                    <FilterButton
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      current={typeFilter}
                      onChange={(value) => {
                        setTypeFilter(value);
                        setOffset(0);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Owner ID
                  </span>
                  <input
                    value={ownerId}
                    onChange={(event) => {
                      setOwnerId(event.target.value);
                      setOffset(0);
                    }}
                    inputMode="numeric"
                    placeholder="Optional owner user ID"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-800 bg-slate-950/45 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
                  />
                </label>

                <label>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Team ID
                  </span>
                  <input
                    value={teamId}
                    onChange={(event) => {
                      setTeamId(event.target.value);
                      setOffset(0);
                    }}
                    inputMode="numeric"
                    placeholder="Optional team ID"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-800 bg-slate-950/45 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
                  />
                </label>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-800 bg-slate-950/45 px-4 text-sm font-semibold text-slate-300 transition hover:border-teal-500/30 hover:text-teal-100"
                >
                  <FilterX size={16} />
                  Reset filters
                </button>
              </div>

              {loadingProjects ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70"
                    />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/35 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-200">
                    <FolderKanban size={24} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">
                    No projects matched
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Adjust the search or filters to show more projects.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedProjects.map((group) => (
                    <section
                      key={group.status}
                      className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {statusLabels[group.status]}
                          </p>
                          <p className="text-sm text-slate-500">
                            {group.projects.length} project
                            {group.projects.length === 1 ? "" : "s"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[group.status]}`}
                        >
                          {group.projects.length}
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {group.projects.map((project) => {
                          const selected =
                            selectedProjectId === project.project_id;
                          const overdue = isOverdue(
                            project.deadline,
                            project.status,
                          );
                          const progress = clampPercent(
                            project.task_stats.completion_percentage,
                          );

                          return (
                            <button
                              key={project.project_id}
                              type="button"
                              onClick={() =>
                                setSelectedProjectId(project.project_id)
                              }
                              className={`group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${
                                selected
                                  ? "border-teal-400 bg-teal-500/15 ring-1 ring-teal-400/30"
                                  : "border-slate-800 bg-slate-900/60 hover:border-teal-500/25"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="line-clamp-2 font-semibold text-white group-hover:text-teal-100">
                                    {project.title}
                                  </p>
                                  <p className="mt-1 truncate text-sm text-slate-400">
                                    {project.owner.full_name ||
                                      project.owner.username}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs capitalize text-slate-300">
                                  {project.project_type}
                                </span>
                              </div>

                              <div className="mt-4">
                                <ProjectProgress value={progress} />
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs ${getRiskClasses(
                                    project,
                                  )}`}
                                >
                                  {project.latest_risk
                                    ? `${project.latest_risk.risk_level} risk`
                                    : "No risk"}
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs ${
                                    overdue
                                      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                                      : "border-slate-700 bg-slate-950/60 text-slate-300"
                                  }`}
                                >
                                  {getDeadlineText(
                                    project.deadline,
                                    project.status,
                                  )}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-slate-500">Tasks</p>
                                  <p className="mt-1 font-semibold text-white">
                                    {project.task_stats.completed_tasks}/
                                    {project.task_stats.total_tasks}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-slate-500">Blocked</p>
                                  <p
                                    className={`mt-1 font-semibold ${
                                      project.task_stats.blocked_tasks > 0
                                        ? "text-amber-200"
                                        : "text-white"
                                    }`}
                                  >
                                    {project.task_stats.blocked_tasks}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-slate-500">Due</p>
                                  <p
                                    className={`mt-1 font-semibold ${
                                      overdue ? "text-rose-200" : "text-white"
                                    }`}
                                  >
                                    {formatDate(project.deadline)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                <label className="flex items-center gap-3 text-sm text-slate-400">
                  Rows per page
                  <select
                    value={limit}
                    onChange={(event) => {
                      setLimit(Number(event.target.value));
                      setOffset(0);
                    }}
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-teal-500/60"
                  >
                    {[10, 20, 50, 100].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2 text-sm text-slate-400">
                    Offset {offset}
                  </span>

                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={offset === 0 || loadingProjects}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={projects.length < limit || loadingProjects}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Project detail
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Delivery summary
                </h2>
              </div>
              <FolderKanban size={22} className="shrink-0 text-teal-300" />
            </div>

            {loadingDetail ? (
              <div className="mt-6 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl border border-slate-800 bg-slate-900/70"
                  />
                ))}
              </div>
            ) : selectedProject ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Project summary
                  </p>

                  <h3 className="mt-2 break-words text-2xl font-semibold text-white">
                    {selectedProject.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {selectedProject.description || "No description provided."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill status={selectedProject.status} />
                    <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs capitalize text-slate-300">
                      {selectedProject.project_type}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${getRiskClasses(
                        selectedProject,
                      )}`}
                    >
                      {selectedProject.latest_risk
                        ? `${selectedProject.latest_risk.risk_level} risk`
                        : "No risk record"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Owner
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {selectedProject.owner.full_name ||
                        selectedProject.owner.username}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {selectedProject.owner.email}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Team
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {selectedProject.team?.name || "Personal project"}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      <Users size={15} />
                      {selectedProject.members_count} members
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Deadline
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-semibold text-white">
                      <CalendarClock size={16} className="text-teal-300" />
                      {formatDate(selectedProject.deadline)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Updated
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {formatDateTime(selectedProject.updated_at)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Task progress
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {clampPercent(
                          selectedProject.task_stats.completion_percentage,
                        )}
                        %
                      </p>
                    </div>
                    <ListChecks size={22} className="text-teal-300" />
                  </div>

                  <div className="mt-4">
                    <ProjectProgress
                      value={selectedProject.task_stats.completion_percentage}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <p className="text-slate-400">
                      Completed:{" "}
                      <span className="font-semibold text-white">
                        {selectedProject.task_stats.completed_tasks}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Total:{" "}
                      <span className="font-semibold text-white">
                        {selectedProject.task_stats.total_tasks}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Blocked:{" "}
                      <span className="font-semibold text-white">
                        {selectedProject.task_stats.blocked_tasks}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Overdue:{" "}
                      <span className="font-semibold text-white">
                        {selectedProject.task_stats.overdue_tasks}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
                  <label
                    htmlFor="project-status"
                    className="text-sm font-medium text-slate-300"
                  >
                    Update project status
                  </label>

                  <div className="mt-3 flex gap-3">
                    <select
                      id="project-status"
                      value={newStatus}
                      onChange={(event) =>
                        setNewStatus(event.target.value as AdminProjectStatus)
                      }
                      className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-teal-500"
                    >
                      {projectStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={
                        savingStatus || newStatus === selectedProject.status
                      }
                      onClick={handleStatusUpdate}
                      className="rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingStatus ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm leading-6 text-slate-400">
                Select a project to view details.
              </div>
            )}
          </GlassCard>
        </section>
      </Reveal>
    </PageTransition>
  );
}
