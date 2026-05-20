"use client";

import { AdminEmptyState } from "@/components/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/ui/AdminLoadingState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import type {
  AdminProjectReportResponse,
  AdminProjectSummary,
  AdminProjectsSummaryReport,
  AdminSystemSummaryReport,
  AdminUsersSummaryReport,
} from "@/types/admin";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  ListChecks,
  Printer,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReportTab = "system" | "projects" | "users" | "project";

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

type AdminProjectListResponse =
  | AdminProjectSummary[]
  | PaginatedResponse<AdminProjectSummary>;

const reportTabs: Array<{
  label: string;
  value: ReportTab;
  icon: typeof BarChart3;
}> = [
  { label: "System Summary", value: "system", icon: Activity },
  { label: "Projects Summary", value: "projects", icon: FolderKanban },
  { label: "Users Summary", value: "users", icon: Users },
  { label: "Project Report", value: "project", icon: FileText },
];

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function getProjectItems(data: AdminProjectListResponse): AdminProjectSummary[] {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.items) ? data.items : [];
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateShort(value: string | null | undefined) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
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

function formatPercent(value: number | null | undefined) {
  return `${Math.round(Number(value ?? 0))}%`;
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

function ReportMetricRow({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "teal" | "emerald" | "amber" | "rose" | "violet";
}) {
  const toneClass = {
    slate: "text-white",
    teal: "text-teal-200",
    emerald: "text-emerald-200",
    amber: "text-amber-200",
    rose: "text-rose-200",
    violet: "text-violet-200",
  }[tone];

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3 text-sm">
      <span className="text-slate-300">{label}</span>
      <span className={`font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="print-hide rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      {message}
    </div>
  );
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("system");

  const [systemSummary, setSystemSummary] =
    useState<AdminSystemSummaryReport | null>(null);
  const [projectsSummary, setProjectsSummary] =
    useState<AdminProjectsSummaryReport | null>(null);
  const [usersSummary, setUsersSummary] =
    useState<AdminUsersSummaryReport | null>(null);

  const [projects, setProjects] = useState<AdminProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [projectReport, setProjectReport] =
    useState<AdminProjectReportResponse | null>(null);
  const [search, setSearch] = useState("");

  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProjectReport, setLoadingProjectReport] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [projectListError, setProjectListError] = useState("");
  const [projectReportError, setProjectReportError] = useState("");

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
    projectReport?.progress.completion_percentage ?? 0,
  );

  const loadAdminSummaries = useCallback(async () => {
    setLoadingSummaries(true);
    setSummaryError("");

    try {
      const [systemResponse, projectsResponse, usersResponse] =
        await Promise.all([
          api.get<AdminSystemSummaryReport>("/admin/reports/system-summary"),
          api.get<AdminProjectsSummaryReport>(
            "/admin/reports/projects-summary",
          ),
          api.get<AdminUsersSummaryReport>("/admin/reports/users-summary"),
        ]);

      setSystemSummary(systemResponse.data);
      setProjectsSummary(projectsResponse.data);
      setUsersSummary(usersResponse.data);
    } catch (requestError) {
      setSummaryError(
        getApiErrorMessage(
          requestError,
          "Unable to load admin summary reports.",
        ),
      );
    } finally {
      setLoadingSummaries(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectListError("");

    try {
      const response = await api.get<AdminProjectListResponse>(
        "/admin/projects",
        {
          params: {
            limit: 100,
            offset: 0,
          },
        },
      );

      const nextProjects = getProjectItems(response.data);
      setProjects(nextProjects);

      setSelectedProjectId((current) => {
        if (current && nextProjects.some((project) => project.project_id === current)) {
          return current;
        }

        return nextProjects[0]?.project_id ?? null;
      });
    } catch (requestError) {
      setProjects([]);
      setSelectedProjectId(null);
      setProjectReport(null);
      setProjectListError(
        getApiErrorMessage(
          requestError,
          "Unable to load projects for reports.",
        ),
      );
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadProjectReport = useCallback(async (projectId: number) => {
    setLoadingProjectReport(true);
    setProjectReportError("");

    try {
      const response = await api.get<AdminProjectReportResponse>(
        `/reports/projects/${projectId}`,
      );

      setProjectReport(response.data);
    } catch (requestError) {
      setProjectReport(null);
      setProjectReportError(
        getApiErrorMessage(
          requestError,
          "Unable to generate this project report.",
        ),
      );
    } finally {
      setLoadingProjectReport(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAdminSummaries();
      void loadProjects();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAdminSummaries, loadProjects]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (activeTab === "project" && selectedProjectId) {
        void loadProjectReport(selectedProjectId);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, loadProjectReport, selectedProjectId]);

  function handlePrintReport() {
    if (!projectReport) {
      setActiveTab("project");
      setProjectReportError("Generate a project report before exporting.");
      return;
    }

    window.print();
  }

  function refreshReports() {
    void loadAdminSummaries();
    void loadProjects();

    if (activeTab === "project" && selectedProjectId) {
      void loadProjectReport(selectedProjectId);
    }
  }

  return (
    <PageTransition className="space-y-6 pb-10">
      <style>{`
        @page {
          margin: 16mm;
        }

        .report-select {
          color-scheme: dark;
          background-color: rgba(2, 6, 23, 0.9);
          color: #f8fafc;
        }

        .report-select option {
          background-color: #020617;
          color: #f8fafc;
        }

        @media print {
          body {
            background: white !important;
          }

          aside,
          nav,
          header,
          .print-hide {
            display: none !important;
          }

          main {
            overflow: visible !important;
          }

          .print-report {
            background: white !important;
            color: #0f172a !important;
          }

          .print-report *,
          .print-report *::before,
          .print-report *::after {
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          .print-report [class*="bg-"] {
            background: white !important;
          }
        }
      `}</style>

      <div className="print-hide flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
            Reports
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Admin Reports Center
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review backend-generated system, project, user, and project-level
            reports without mock metrics.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={refreshReports}
            disabled={loadingSummaries || loadingProjects || loadingProjectReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                loadingSummaries || loadingProjects || loadingProjectReport
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            disabled={!projectReport || loadingProjectReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-2.5 text-sm font-semibold text-teal-100 transition hover:border-teal-400/40 hover:bg-teal-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={16} />
            Export / Print
          </button>
        </div>
      </div>

      <ErrorBanner message={summaryError} />

      <Reveal className="print-hide">
        <GlassCard className="p-3">
          <div className="grid gap-2 md:grid-cols-4">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                    active
                      ? "border-teal-500/40 bg-teal-500/10 text-teal-100"
                      : "border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-950/45 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </Reveal>

      {activeTab === "system" && (
        <SystemSummaryTab
          summary={systemSummary}
          loading={loadingSummaries}
        />
      )}

      {activeTab === "projects" && (
        <ProjectsSummaryTab
          summary={projectsSummary}
          loading={loadingSummaries}
        />
      )}

      {activeTab === "users" && (
        <UsersSummaryTab summary={usersSummary} loading={loadingSummaries} />
      )}

      {activeTab === "project" && (
        <ProjectReportTab
          projects={filteredProjects}
          selectedProjectId={selectedProjectId}
          onSelectedProjectIdChange={(projectId) =>
            setSelectedProjectId(projectId)
          }
          search={search}
          onSearchChange={setSearch}
          report={projectReport}
          loadingProjects={loadingProjects}
          loadingReport={loadingProjectReport}
          progressPercent={progressPercent}
          projectListError={projectListError}
          projectReportError={projectReportError}
        />
      )}
    </PageTransition>
  );
}

function SystemSummaryTab({
  summary,
  loading,
}: {
  summary: AdminSystemSummaryReport | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          value={loading ? "--" : formatNumber(summary?.users_total)}
          detail={`${formatNumber(summary?.users_active)} active`}
          icon={Users}
          accent="cyan"
        />
        <StatCard
          title="Projects"
          value={loading ? "--" : formatNumber(summary?.projects_total)}
          detail={`${formatNumber(summary?.team_projects)} team projects`}
          icon={FolderKanban}
          accent="cyan"
        />
        <StatCard
          title="Tasks"
          value={loading ? "--" : formatNumber(summary?.tasks_total)}
          detail={`${formatNumber(summary?.blocked_tasks)} blocked`}
          icon={ListChecks}
          accent="emerald"
        />
        <StatCard
          title="High risk"
          value={loading ? "--" : formatNumber(summary?.high_risk_records)}
          detail={`${formatNumber(summary?.overdue_tasks)} overdue tasks`}
          icon={AlertTriangle}
          accent={(summary?.high_risk_records ?? 0) > 0 ? "rose" : "emerald"}
        />
      </section>

      <Reveal>
        <GlassCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                System summary
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Backend report snapshot
              </h2>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-300">
              {loading ? "Loading" : formatDateTime(summary?.generated_at)}
            </span>
          </div>

          {loading ? (
            <LoadingBlock label="Loading system summary..." />
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ReportMetricRow
                label="Inactive users"
                value={formatNumber(summary?.users_inactive)}
                tone="amber"
              />
              <ReportMetricRow
                label="Admins total"
                value={formatNumber(summary?.admins_total)}
                tone="violet"
              />
              <ReportMetricRow
                label="Personal projects"
                value={formatNumber(summary?.personal_projects)}
                tone="teal"
              />
              <ReportMetricRow
                label="Teams total"
                value={formatNumber(summary?.teams_total)}
                tone="emerald"
              />
              <ReportMetricRow
                label="Overdue tasks"
                value={formatNumber(summary?.overdue_tasks)}
                tone="amber"
              />
              <ReportMetricRow
                label="Blocked tasks"
                value={formatNumber(summary?.blocked_tasks)}
                tone="rose"
              />
            </div>
          )}
        </GlassCard>
      </Reveal>
    </div>
  );
}

function ProjectsSummaryTab({
  summary,
  loading,
}: {
  summary: AdminProjectsSummaryReport | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Projects"
          value={loading ? "--" : formatNumber(summary?.projects_total)}
          detail="All backend projects"
          icon={FolderKanban}
          accent="cyan"
        />
        <StatCard
          title="Average complete"
          value={loading ? "--" : formatPercent(summary?.average_completion_percentage)}
          detail="Backend average"
          icon={BarChart3}
          accent="emerald"
        />
        <StatCard
          title="In progress"
          value={loading ? "--" : formatNumber(summary?.in_progress)}
          detail="Active delivery"
          icon={Clock3}
          accent="cyan"
        />
        <StatCard
          title="Completed"
          value={loading ? "--" : formatNumber(summary?.completed)}
          detail="Finished projects"
          icon={CheckCircle2}
          accent="emerald"
        />
      </section>

      <Reveal>
        <GlassCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Projects summary
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Project status breakdown
              </h2>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-300">
              {loading ? "Loading" : formatDateTime(summary?.generated_at)}
            </span>
          </div>

          {loading ? (
            <LoadingBlock label="Loading projects summary..." />
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ReportMetricRow
                label="Not started"
                value={formatNumber(summary?.not_started)}
              />
              <ReportMetricRow
                label="In progress"
                value={formatNumber(summary?.in_progress)}
                tone="teal"
              />
              <ReportMetricRow
                label="Completed"
                value={formatNumber(summary?.completed)}
                tone="emerald"
              />
              <ReportMetricRow
                label="On hold"
                value={formatNumber(summary?.on_hold)}
                tone="amber"
              />
              <ReportMetricRow
                label="Cancelled"
                value={formatNumber(summary?.cancelled)}
                tone="rose"
              />
              <ReportMetricRow
                label="Average completion"
                value={formatPercent(summary?.average_completion_percentage)}
                tone="teal"
              />
            </div>
          )}
        </GlassCard>
      </Reveal>
    </div>
  );
}

function UsersSummaryTab({
  summary,
  loading,
}: {
  summary: AdminUsersSummaryReport | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          value={loading ? "--" : formatNumber(summary?.users_total)}
          detail={`${formatNumber(summary?.active_users)} active`}
          icon={Users}
          accent="cyan"
        />
        <StatCard
          title="Verified"
          value={loading ? "--" : formatNumber(summary?.verified_users)}
          detail={`${formatNumber(summary?.unverified_users)} unverified`}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Admins"
          value={loading ? "--" : formatNumber(summary?.admin_users)}
          detail="Global admin role"
          icon={Activity}
          accent="purple"
        />
        <StatCard
          title="Assigned work"
          value={
            loading ? "--" : formatNumber(summary?.users_with_assigned_tasks)
          }
          detail="Users with tasks"
          icon={ListChecks}
          accent="cyan"
        />
      </section>

      <Reveal>
        <GlassCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Users summary
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Account status breakdown
              </h2>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-300">
              {loading ? "Loading" : formatDateTime(summary?.generated_at)}
            </span>
          </div>

          {loading ? (
            <LoadingBlock label="Loading users summary..." />
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ReportMetricRow
                label="Active users"
                value={formatNumber(summary?.active_users)}
                tone="emerald"
              />
              <ReportMetricRow
                label="Inactive users"
                value={formatNumber(summary?.inactive_users)}
                tone="amber"
              />
              <ReportMetricRow
                label="Verified users"
                value={formatNumber(summary?.verified_users)}
                tone="teal"
              />
              <ReportMetricRow
                label="Unverified users"
                value={formatNumber(summary?.unverified_users)}
                tone="amber"
              />
              <ReportMetricRow
                label="Admin users"
                value={formatNumber(summary?.admin_users)}
                tone="violet"
              />
              <ReportMetricRow
                label="Users with assigned tasks"
                value={formatNumber(summary?.users_with_assigned_tasks)}
                tone="teal"
              />
            </div>
          )}
        </GlassCard>
      </Reveal>
    </div>
  );
}

function ProjectReportTab({
  projects,
  selectedProjectId,
  onSelectedProjectIdChange,
  search,
  onSearchChange,
  report,
  loadingProjects,
  loadingReport,
  progressPercent,
  projectListError,
  projectReportError,
}: {
  projects: AdminProjectSummary[];
  selectedProjectId: number | null;
  onSelectedProjectIdChange: (projectId: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  report: AdminProjectReportResponse | null;
  loadingProjects: boolean;
  loadingReport: boolean;
  progressPercent: number;
  projectListError: string;
  projectReportError: string;
}) {
  return (
    <div className="print-report space-y-6">
      <ErrorBanner message={projectListError || projectReportError} />

      <div className="print-hide">
        <Reveal>
          <GlassCard>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <label>
                <span className="text-sm font-medium text-slate-300">
                  Search projects
                </span>
                <div className="relative mt-2">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search by title, owner, type, or status..."
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/45 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-teal-500"
                  />
                </div>
              </label>

              <label>
                <span className="text-sm font-medium text-slate-300">
                  Select project
                </span>
                <select
                  value={selectedProjectId ?? ""}
                  onChange={(event) =>
                    onSelectedProjectIdChange(Number(event.target.value))
                  }
                  disabled={loadingProjects || projects.length === 0}
                  className="report-select mt-2 h-11 w-full rounded-xl border border-teal-500/70 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-teal-400"
                >
                  {projects.map((project) => (
                    <option
                      key={project.project_id}
                      value={project.project_id}
                      className="bg-slate-950 text-white"
                    >
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {loadingProjects && (
              <AdminLoadingState
                title="Loading projects"
                message="Fetching projects for report generation."
                rows={3}
              />
            )}

            {!loadingProjects && projects.length === 0 && (
              <AdminEmptyState
                icon={FolderKanban}
                title="No projects found"
                message="Projects will appear here when reportable projects exist."
              />
            )}
          </GlassCard>
        </Reveal>
      </div>

      {loadingReport && (
        <Reveal>
          <AdminLoadingState
            title="Generating project report"
            message="Preparing the selected project report from backend data."
            rows={4}
          />
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
                detail={`${formatNumber(
                  report.progress.completed_tasks,
                )} completed`}
                icon={ListChecks}
                accent="cyan"
              />

              <StatCard
                title="Pending"
                value={formatNumber(report.progress.pending_tasks)}
                detail={`${formatNumber(
                  report.progress.overdue_tasks,
                )} overdue`}
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
            <ReportDetailList
              title="Task status"
              icon={FolderKanban}
              items={Object.entries(report.task_status_counts).map(
                ([label, value]) => ({
                  label: formatStatus(label),
                  value: formatNumber(value),
                }),
              )}
            />
            <ReportDetailList
              title="Priority counts"
              icon={AlertTriangle}
              items={Object.entries(report.task_priority_counts).map(
                ([label, value]) => ({
                  label,
                  value: formatNumber(value),
                }),
              )}
            />
            <ReportDetailList
              title="Hours and activity"
              icon={CalendarDays}
              items={[
                {
                  label: "Estimated hours",
                  value: formatHours(report.hours.estimated_hours_total),
                },
                {
                  label: "Actual hours",
                  value: formatHours(report.hours.actual_hours_total),
                },
                {
                  label: "Reminders",
                  value: formatNumber(
                    report.activity.deadline_reminders_count,
                  ),
                },
              ]}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.55fr)_minmax(0,1.45fr)]">
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
                  <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(96px,0.65fr)_minmax(90px,0.6fr)_minmax(92px,0.55fr)] gap-3 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <span>Task</span>
                    <span>Status</span>
                    <span>Priority</span>
                    <span className="text-right">Due</span>
                  </div>

                  {report.tasks.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-slate-400">
                      No tasks found for this project.
                    </p>
                  ) : (
                    report.tasks.map((task) => {
                      const assignee = task.assigned_to
                        ? report.members.find(
                            (member) => member.user_id === task.assigned_to,
                          )
                        : null;

                      return (
                        <div
                          key={task.task_id}
                          className="grid grid-cols-[minmax(0,1.7fr)_minmax(96px,0.65fr)_minmax(90px,0.6fr)_minmax(92px,0.55fr)] gap-3 border-t border-slate-800 px-4 py-4 text-sm transition hover:bg-slate-950/35"
                        >
                          <div className="min-w-0">
                            <p
                              className="truncate font-medium text-white"
                              title={task.title}
                            >
                              {task.title}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              Assigned to:{" "}
                              {assignee
                                ? assignee.full_name || assignee.username
                                : (task.assigned_to ?? "Unassigned")}
                            </p>
                          </div>

                          <span className="truncate capitalize text-slate-300">
                            {formatStatus(task.status)}
                          </span>

                          <span className="truncate capitalize text-slate-300">
                            {task.priority}
                          </span>

                          <span
                            className="truncate text-right text-slate-300"
                            title={formatDate(task.due_date)}
                          >
                            {formatDateShort(task.due_date)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <AdminLoadingState
      title={label}
      message="Preparing report metrics from backend data."
      rows={4}
    />
  );
}

function ReportDetailList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof FolderKanban;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <Reveal>
      <GlassCard>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Icon size={18} className="text-teal-300" />
          {title}
        </h3>

        <div className="mt-5 space-y-3 text-sm">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3"
            >
              <span className="capitalize text-slate-300">{item.label}</span>
              <span className="font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </Reveal>
  );
}
