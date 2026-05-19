"use client";

import { AdminEmptyState } from "@/components/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/ui/AdminLoadingState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import type {
  AdminTaskActionResponse,
  AdminTaskDetail,
  AdminTaskPriority,
  AdminTaskStatus,
  AdminTaskSummary,
} from "@/types/admin";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FilterX,
  FolderKanban,
  ListChecks,
  MessageSquareText,
  Paperclip,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Timer,
  UserMinus,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | AdminTaskStatus;
type PriorityFilter = "all" | AdminTaskPriority;

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "All status", value: "all" },
  { label: "Todo", value: "todo" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Blocked", value: "blocked" },
];

const priorityOptions: Array<{ label: string; value: PriorityFilter }> = [
  { label: "All priority", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const taskStatusOptions: Array<{ label: string; value: AdminTaskStatus }> = [
  { label: "Todo", value: "todo" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Blocked", value: "blocked" },
];

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError;
  return apiError.response?.data?.detail ?? fallback;
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: AdminTaskStatus) {
  const labels: Record<AdminTaskStatus, string> = {
    todo: "Todo",
    in_progress: "In progress",
    completed: "Completed",
    blocked: "Blocked",
  };

  return labels[status];
}

function priorityLabel(priority: AdminTaskPriority) {
  const labels: Record<AdminTaskPriority, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  return labels[priority];
}

function statusBadgeClass(status: AdminTaskStatus) {
  const classes: Record<AdminTaskStatus, string> = {
    todo: "border-slate-700 bg-slate-900/80 text-slate-300",
    in_progress: "border-teal-500/20 bg-teal-500/10 text-teal-200",
    completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    blocked: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  };

  return classes[status];
}

function priorityBadgeClass(priority: AdminTaskPriority) {
  const classes: Record<AdminTaskPriority, string> = {
    low: "border-slate-700 bg-slate-900/80 text-slate-300",
    medium: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    high: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  };

  return classes[priority];
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTaskSummary[]>([]);
  const [selectedTask, setSelectedTask] = useState<AdminTaskDetail | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [projectId, setProjectId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [nextStatus, setNextStatus] = useState<AdminTaskStatus>("todo");
  const [assigneeInput, setAssigneeInput] = useState("");

  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      overdue: tasks.filter((task) => task.is_overdue).length,
      blocked: tasks.filter((task) => task.status === "blocked").length,
      unassigned: tasks.filter((task) => !task.assignee).length,
      completed: tasks.filter((task) => task.status === "completed").length,
    };
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    const groups: Record<AdminTaskStatus, AdminTaskSummary[]> = {
      blocked: [],
      in_progress: [],
      todo: [],
      completed: [],
    };

    for (const task of tasks) {
      groups[task.status].push(task);
    }

    return groups;
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<AdminTaskSummary[]>("/admin/tasks", {
        params: {
          limit,
          offset,
          status: statusFilter === "all" ? undefined : statusFilter,
          priority: priorityFilter === "all" ? undefined : priorityFilter,
          project_id: parseOptionalNumber(projectId),
          assigned_to: parseOptionalNumber(assignedTo),
          created_by: parseOptionalNumber(createdBy),
          overdue: overdueOnly ? true : undefined,
          unassigned: unassignedOnly ? true : undefined,
          search: search.trim() || undefined,
        },
      });

      setTasks(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load admin tasks."));
    } finally {
      setIsLoading(false);
    }
  }, [
    assignedTo,
    createdBy,
    limit,
    offset,
    overdueOnly,
    priorityFilter,
    projectId,
    search,
    statusFilter,
    unassignedOnly,
  ]);

  const fetchTaskDetail = useCallback(async (taskId: number) => {
    setIsDetailLoading(true);
    setError("");

    try {
      const response = await api.get<AdminTaskDetail>(`/admin/tasks/${taskId}`);
      setSelectedTask(response.data);
      setSelectedTaskId(taskId);
      setNextStatus(response.data.status);
      setAssigneeInput(response.data.assignee?.user_id.toString() ?? "");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load task details."));
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTasks();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTasks]);

  async function refreshAfterAction(taskId: number, message: string) {
    await fetchTasks();
    await fetchTaskDetail(taskId);
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  }

  async function handleStatusUpdate() {
    if (!selectedTask) return;

    setIsActionLoading(true);
    setError("");

    try {
      const response = await api.patch<AdminTaskActionResponse>(
        `/admin/tasks/${selectedTask.task_id}/status`,
        { status: nextStatus },
      );

      await refreshAfterAction(selectedTask.task_id, response.data.message);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update task status."));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleAssignmentUpdate() {
    if (!selectedTask) return;

    const trimmedAssignee = assigneeInput.trim();

    setIsActionLoading(true);
    setError("");

    try {
      const response = await api.patch<AdminTaskActionResponse>(
        `/admin/tasks/${selectedTask.task_id}/assignment`,
        {
          assigned_to: trimmedAssignee ? Number(trimmedAssignee) : null,
        },
      );

      await refreshAfterAction(selectedTask.task_id, response.data.message);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update task assignment."));
    } finally {
      setIsActionLoading(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectId("");
    setAssignedTo("");
    setCreatedBy("");
    setOverdueOnly(false);
    setUnassignedOnly(false);
    setOffset(0);
  }

  function goToPreviousPage() {
    setOffset((current) => Math.max(0, current - limit));
  }

  function goToNextPage() {
    if (tasks.length < limit) return;
    setOffset((current) => current + limit);
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-300">
            Task oversight
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Admin Tasks Page
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review task workload, detect blocked or overdue work, and update
            task status or assignment from one admin operations page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchTasks()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {successMessage}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total"
          value={taskStats.total}
          detail="Returned tasks"
          icon={ClipboardList}
          accent="cyan"
        />
        <StatCard
          title="Overdue"
          value={taskStats.overdue}
          detail="Need attention"
          icon={Clock3}
          accent="amber"
        />
        <StatCard
          title="Blocked"
          value={taskStats.blocked}
          detail="Blocked work"
          icon={AlertTriangle}
          accent="rose"
        />
        <StatCard
          title="Unassigned"
          value={taskStats.unassigned}
          detail="No owner"
          icon={UserMinus}
          accent="purple"
        />
        <StatCard
          title="Completed"
          value={taskStats.completed}
          detail="Finished"
          icon={CheckCircle2}
          accent="emerald"
        />
      </section>

      <Reveal>
        <GlassCard>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-teal-300" />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Narrow the admin task queue by status, priority, urgency, or
                assignment.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setOffset(0);
                  }}
                  placeholder="Search task title..."
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
                />
              </label>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setOffset(0);
                }}
                className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-teal-500/60"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(event.target.value as PriorityFilter);
                  setOffset(0);
                }}
                className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-teal-500/60"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setOverdueOnly((current) => !current);
                  setOffset(0);
                }}
                className={`h-11 rounded-xl border px-3 text-sm font-medium transition ${
                  overdueOnly
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600"
                }`}
              >
                Overdue only
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnassignedOnly((current) => !current);
                  setOffset(0);
                }}
                className={`h-11 rounded-xl border px-3 text-sm font-medium transition ${
                  unassignedOnly
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-100"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600"
                }`}
              >
                Unassigned only
              </button>

              <input
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setOffset(0);
                }}
                inputMode="numeric"
                placeholder="Project ID"
                className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
              />

              <input
                value={assignedTo}
                onChange={(event) => {
                  setAssignedTo(event.target.value);
                  setOffset(0);
                }}
                inputMode="numeric"
                placeholder="Assigned user ID"
                className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
              />

              <input
                value={createdBy}
                onChange={(event) => {
                  setCreatedBy(event.target.value);
                  setOffset(0);
                }}
                inputMode="numeric"
                placeholder="Creator user ID"
                className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
              />

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100"
              >
                <FilterX size={16} />
                Reset
              </button>
            </div>
          </div>
        </GlassCard>
      </Reveal>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-4">
          {isLoading ? (
            <AdminLoadingState
              title="Loading tasks"
              message="Fetching task oversight records."
              rows={5}
            />
          ) : tasks.length === 0 ? (
            <AdminEmptyState
              icon={ListChecks}
              title="No tasks found"
              message="Tasks matching your filters will appear here."
            />
          ) : (
            (["blocked", "in_progress", "todo", "completed"] as const).map(
              (groupStatus) => {
                const groupTasks = groupedTasks[groupStatus];

                if (groupTasks.length === 0) return null;

                return (
                  <GlassCard key={groupStatus}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {statusLabel(groupStatus)}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {groupTasks.length} task
                          {groupTasks.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(
                          groupStatus,
                        )}`}
                      >
                        {statusLabel(groupStatus)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {groupTasks.map((task) => {
                        const selected = task.task_id === selectedTaskId;

                        return (
                          <button
                            key={task.task_id}
                            type="button"
                            onClick={() => void fetchTaskDetail(task.task_id)}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-teal-400/60 bg-teal-500/10 ring-1 ring-teal-400/30"
                                : "border-slate-800 bg-slate-950/45 hover:border-slate-700 hover:bg-slate-950/70"
                            }`}
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityBadgeClass(
                                      task.priority,
                                    )}`}
                                  >
                                    {priorityLabel(task.priority)}
                                  </span>

                                  {task.is_overdue && (
                                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                                      Overdue
                                    </span>
                                  )}

                                  {!task.assignee && (
                                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200">
                                      Unassigned
                                    </span>
                                  )}
                                </div>

                                <h3 className="mt-3 truncate text-base font-semibold text-white">
                                  {task.title}
                                </h3>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                                  <span className="inline-flex items-center gap-1.5">
                                    <FolderKanban size={14} />
                                    {task.project.title}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <UserRound size={14} />
                                    {task.assignee
                                      ? task.assignee.full_name
                                      : "No assignee"}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays size={14} />
                                    {formatDate(task.due_date)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(
                                    task.status,
                                  )}`}
                                >
                                  {statusLabel(task.status)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  #{task.task_id}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </GlassCard>
                );
              },
            )
          )}

          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                  disabled={offset === 0 || isLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={tasks.length < limit || isLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="h-fit">
          {isDetailLoading ? (
            <AdminLoadingState
              title="Loading task detail"
              message="Fetching selected task details."
              rows={4}
            />
          ) : selectedTask ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                    Selected task
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {selectedTask.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedTask.description || "No description provided."}
                  </p>
                </div>

                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                  #{selectedTask.task_id}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Project
                  </p>
                  <p className="mt-2 font-medium text-white">
                    {selectedTask.project.title}
                  </p>
                  <p className="mt-1 text-slate-400">
                    {selectedTask.project.project_type}
                    {selectedTask.project.team_name
                      ? ` Â· ${selectedTask.project.team_name}`
                      : ""}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Assignee
                    </p>
                    <p className="mt-2 font-medium text-white">
                      {selectedTask.assignee
                        ? selectedTask.assignee.full_name
                        : "Unassigned"}
                    </p>
                    <p className="mt-1 text-slate-400">
                      {selectedTask.assignee?.email ?? "No user assigned"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Creator
                    </p>
                    <p className="mt-2 font-medium text-white">
                      {selectedTask.creator.full_name}
                    </p>
                    <p className="mt-1 text-slate-400">
                      {selectedTask.creator.email}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Due date
                    </p>
                    <p className="mt-2 font-medium text-white">
                      {formatDateTime(selectedTask.due_date)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Hours
                    </p>
                    <p className="mt-2 font-medium text-white">
                      {selectedTask.actual_hours ?? 0} /{" "}
                      {selectedTask.estimated_hours ?? 0}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      <MessageSquareText size={14} />
                      Comments
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {selectedTask.comments_count}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      <Paperclip size={14} />
                      Attachments
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {selectedTask.attachments_count}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <h3 className="text-sm font-semibold text-white">
                  Admin actions
                </h3>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Update status
                    </label>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={nextStatus}
                        onChange={(event) =>
                          setNextStatus(event.target.value as AdminTaskStatus)
                        }
                        className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-teal-500/60"
                      >
                        {taskStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => void handleStatusUpdate()}
                        disabled={
                          isActionLoading || nextStatus === selectedTask.status
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Assign by user ID
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={assigneeInput}
                        onChange={(event) =>
                          setAssigneeInput(event.target.value)
                        }
                        inputMode="numeric"
                        placeholder="Example: 5"
                        className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
                      />

                      <button
                        type="button"
                        onClick={() => void handleAssignmentUpdate()}
                        disabled={isActionLoading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {assigneeInput.trim() ? "Assign" : "Unassign"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Leave the field empty and submit to unassign the task.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AdminEmptyState
              icon={Timer}
              title="Select a task"
              message="Choose a task from the queue to view details and admin actions."
            />
          )}
        </GlassCard>
      </section>
    </PageTransition>
  );
}

