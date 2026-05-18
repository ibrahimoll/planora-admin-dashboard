"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
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
  Clock3,
  FolderKanban,
  ListChecks,
  RefreshCw,
  Search,
  ShieldAlert,
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

const statusFilterOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "All status", value: "all" },
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "On hold", value: "on_hold" },
  { label: "Cancelled", value: "cancelled" },
];

const projectStatusOptions: Array<{
  label: string;
  value: AdminProjectStatus;
}> = [
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "On hold", value: "on_hold" },
  { label: "Cancelled", value: "cancelled" },
];

const typeOptions: Array<{ label: string; value: TypeFilter }> = [
  { label: "All types", value: "all" },
  { label: "Personal", value: "personal" },
  { label: "Team", value: "team" },
];

const statusLabels: Record<AdminProjectStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
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

function getRiskClasses(project: AdminProjectSummary | AdminProjectDetail) {
  const risk = project.latest_risk?.risk_level;

  if (risk === "high") return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  if (risk === "medium") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }
  if (risk === "low") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  return "border-slate-700 bg-slate-900/70 text-slate-300";
}

function getStatusClasses(status: AdminProjectStatus) {
  const classes: Record<AdminProjectStatus, string> = {
    not_started: "border-slate-700 bg-slate-900/70 text-slate-300",
    in_progress: "border-teal-500/20 bg-teal-500/10 text-teal-200",
    completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    on_hold: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  };

  return classes[status];
}

function StatusPill({ status }: { status: AdminProjectStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
        status,
      )}`}
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
      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-teal-500/30 bg-teal-500/15 text-teal-100"
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
  const [newStatus, setNewStatus] =
    useState<AdminProjectStatus>("not_started");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter(
      (project) => project.status === "in_progress",
    ).length;
    const completed = projects.filter(
      (project) => project.status === "completed",
    ).length;
    const highRisk = projects.filter(
      (project) => project.latest_risk?.risk_level === "high",
    ).length;

    return { total, inProgress, completed, highRisk };
  }, [projects]);

  async function refreshProjects() {
    const response = await api.get<AdminProjectSummary[]>("/admin/projects", {
      params: {
        limit: 100,
        offset: 0,
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        project_type: typeFilter === "all" ? undefined : typeFilter,
      },
    });

    setProjects(response.data);

    setSelectedProjectId((current) => {
      if (response.data.length === 0) return null;

      if (
        current &&
        response.data.some((project) => project.project_id === current)
      ) {
        return current;
      }

      return response.data[0].project_id;
    });
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
              limit: 100,
              offset: 0,
              search: search.trim() || undefined,
              status: statusFilter === "all" ? undefined : statusFilter,
              project_type: typeFilter === "all" ? undefined : typeFilter,
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
  }, [search, statusFilter, typeFilter]);

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
      await refreshProjects();
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

  return (
    <PageTransition className="space-y-6 pb-10">
      <Reveal>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <GlassCard className="p-0">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
                    <FolderKanban size={15} />
                    Projects
                  </p>
                  <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                    Admin projects
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                    Review ownership, deadlines, task progress, and risk signals
                    across Planora projects.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshProjects}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-500 bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-teal-400"
                >
                  <RefreshCw size={17} />
                  Refresh projects
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-200">
                <ShieldAlert size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Project oversight
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Status changes are sent through the protected admin API.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>
      </Reveal>

      <Reveal delay={0.04}>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Filtered projects"
            value={loadingProjects ? "--" : stats.total}
            detail="Current query"
            icon={FolderKanban}
            accent="cyan"
            signal="Search results"
          />
          <StatCard
            title="In progress"
            value={loadingProjects ? "--" : stats.inProgress}
            detail="Active work"
            icon={Clock3}
            accent="cyan"
            signal="Project status"
          />
          <StatCard
            title="Completed"
            value={loadingProjects ? "--" : stats.completed}
            detail="Finished projects"
            icon={CheckCircle2}
            accent="emerald"
            signal="Delivery"
          />
          <StatCard
            title="High risk"
            value={loadingProjects ? "--" : stats.highRisk}
            detail="Needs review"
            icon={AlertTriangle}
            accent={stats.highRisk > 0 ? "rose" : "emerald"}
            signal="Risk"
          />
        </section>
      </Reveal>

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

      <Reveal delay={0.08}>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <GlassCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                    Project portfolio
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Project cards
                  </h2>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 lg:w-96">
                  <Search size={18} className="shrink-0 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder="Search title, owner, team..."
                  />
                </div>
              </div>

              <div className="grid gap-3 border-y border-slate-800 py-4 lg:grid-cols-2">
                <div className="flex flex-wrap gap-2">
                  {statusFilterOptions.map((option) => (
                    <FilterButton
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      current={statusFilter}
                      onChange={setStatusFilter}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((option) => (
                    <FilterButton
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      current={typeFilter}
                      onChange={setTypeFilter}
                    />
                  ))}
                </div>
              </div>

              {loadingProjects ? (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-60 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70"
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
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {projects.map((project) => {
                    const selected = selectedProjectId === project.project_id;
                    const overdue = isOverdue(project.deadline, project.status);
                    const progress = clampPercent(
                      project.task_stats.completion_percentage,
                    );

                    return (
                      <button
                        key={project.project_id}
                        type="button"
                        onClick={() => setSelectedProjectId(project.project_id)}
                        className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${
                          selected
                            ? "border-teal-500/40 bg-teal-500/10"
                            : "border-slate-800 bg-slate-950/35 hover:border-teal-500/25 hover:bg-slate-900/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-white">
                              {project.title}
                            </p>
                            <p className="mt-1 truncate text-sm text-slate-400">
                              Owner:{" "}
                              {project.owner.full_name ||
                                project.owner.username}
                            </p>
                          </div>

                          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs capitalize text-slate-300">
                            {project.project_type}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <StatusPill status={project.status} />
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${getRiskClasses(
                              project,
                            )}`}
                          >
                            {project.latest_risk
                              ? `${project.latest_risk.risk_level} risk`
                              : "No risk record"}
                          </span>
                        </div>

                        <div className="mt-5">
                          <ProjectProgress value={progress} />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500">Tasks</p>
                            <p className="mt-1 font-semibold text-white">
                              {project.task_stats.completed_tasks}/
                              {project.task_stats.total_tasks}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-500">Deadline</p>
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
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Project detail
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Selected project
                </h2>
              </div>
              <FolderKanban size={22} className="text-teal-300" />
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
                  <h3 className="text-2xl font-semibold text-white">
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