"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import type {
  AdminActivityLog,
  AdminDashboardOverview,
  AdminNotificationStats,
  AdminProjectStats,
  AdminRiskStats,
  AdminTaskStats,
  AdminUserStats,
} from "@/types/admin";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListChecks,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const emptyUsers: AdminUserStats = {
  total_users: 0,
  active_users: 0,
  inactive_users: 0,
  verified_users: 0,
  unverified_users: 0,
  admin_users: 0,
};

const emptyProjects: AdminProjectStats = {
  total_projects: 0,
  personal_projects: 0,
  team_projects: 0,
  not_started_projects: 0,
  in_progress_projects: 0,
  completed_projects: 0,
  on_hold_projects: 0,
  cancelled_projects: 0,
};

const emptyTasks: AdminTaskStats = {
  total_tasks: 0,
  todo_tasks: 0,
  in_progress_tasks: 0,
  completed_tasks: 0,
  blocked_tasks: 0,
  overdue_tasks: 0,
};

const emptyRisks: AdminRiskStats = {
  total_risk_records: 0,
  low_risk_records: 0,
  medium_risk_records: 0,
  high_risk_records: 0,
};

const emptyNotifications: AdminNotificationStats = {
  total_notifications: 0,
  unread_notifications: 0,
  read_notifications: 0,
};

const emptyOverview: AdminDashboardOverview = {
  users: emptyUsers,
  projects: emptyProjects,
  tasks: emptyTasks,
  teams_total: 0,
  risks: emptyRisks,
  notifications: emptyNotifications,
  generated_at: "",
};

const toneMap = {
  cyan: {
    text: "text-teal-200",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    bar: "bg-teal-400",
  },
  purple: {
    text: "text-violet-200",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    bar: "bg-violet-400",
  },
  emerald: {
    text: "text-emerald-200",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    bar: "bg-emerald-400",
  },
  amber: {
    text: "text-amber-200",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    bar: "bg-amber-400",
  },
  rose: {
    text: "text-rose-200",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    bar: "bg-rose-400",
  },
};

type Tone = keyof typeof toneMap;

function formatCount(value: number | undefined) {
  return (value ?? 0).toLocaleString();
}

function getRate(part: number | undefined, total: number | undefined) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round(((part ?? 0) / total) * 100)));
}

function formatRate(part: number | undefined, total: number | undefined) {
  return `${getRate(part, total)}%`;
}

function formatDateTime(value: string) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeOverview(data: Partial<AdminDashboardOverview>) {
  return {
    users: { ...emptyUsers, ...data.users },
    projects: { ...emptyProjects, ...data.projects },
    tasks: { ...emptyTasks, ...data.tasks },
    teams_total: data.teams_total ?? 0,
    risks: { ...emptyRisks, ...data.risks },
    notifications: { ...emptyNotifications, ...data.notifications },
    generated_at: data.generated_at ?? "",
  };
}

function ProgressRow({
  label,
  value,
  total,
  tone = "cyan",
}: {
  label: string;
  value: number;
  total: number;
  tone?: Tone;
}) {
  const styles = toneMap[tone];
  const percent = getRate(value, total);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`font-semibold ${styles.text}`}>
          {formatCount(value)} ({percent}%)
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={`h-full rounded-full ${styles.bar}`}
        />
      </div>
    </div>
  );
}

function DataTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "cyan",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const styles = toneMap[tone];

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.border} bg-[#080b12] ${styles.text}`}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] =
    useState<AdminDashboardOverview>(emptyOverview);
  const [activity, setActivity] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<AdminDashboardOverview>(
          "/admin/dashboard/overview",
        );
        setOverview(normalizeOverview(response.data));
      } catch {
        setError("Overview data is unavailable right now.");
      } finally {
        setLoading(false);
      }
    }

    async function loadRecentActivity() {
      setActivityLoading(true);
      setActivityError("");

      try {
        const response = await api.get<AdminActivityLog[]>(
          "/admin/dashboard/recent-activity",
          { params: { limit: 6 } },
        );
        setActivity(response.data);
      } catch {
        setActivity([]);
        setActivityError("Recent activity is not available yet.");
      } finally {
        setActivityLoading(false);
      }
    }

    loadOverview();
    loadRecentActivity();
  }, []);

  const { users, projects, tasks, risks, notifications } = overview;
  const riskTone: Tone =
    risks.high_risk_records > 0 || tasks.blocked_tasks > 0
      ? "rose"
      : risks.medium_risk_records > 0 || tasks.overdue_tasks > 0
        ? "amber"
        : "emerald";
  const openProjectCount =
    projects.in_progress_projects + projects.not_started_projects;

  return (
    <PageTransition className="space-y-6 pb-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <GlassCard className="p-0">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
                  <Activity size={15} />
                  System overview
                </p>
                <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  Project operations overview
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                  A current admin summary from Planora data: users, projects,
                  tasks, risk records, and recent activity.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Last updated
                </p>
                <p className="mt-1 font-semibold text-white">
                  {loading
                    ? "Loading..."
                    : formatDateTime(overview.generated_at)}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow={riskTone}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Risk status
              </p>
              <h2
                className={`mt-2 text-3xl font-bold ${toneMap[riskTone].text}`}
              >
                {loading
                  ? "--"
                  : risks.high_risk_records > 0
                    ? "Needs review"
                    : tasks.overdue_tasks > 0 || tasks.blocked_tasks > 0
                      ? "Work needs attention"
                      : "Stable"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {formatCount(risks.high_risk_records)} high-risk records,{" "}
                {formatCount(tasks.blocked_tasks)} blocked tasks, and{" "}
                {formatCount(tasks.overdue_tasks)} overdue tasks.
              </p>
            </div>
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${toneMap[riskTone].border} ${toneMap[riskTone].bg} ${toneMap[riskTone].text}`}
            >
              <AlertTriangle size={22} />
            </div>
          </div>
        </GlassCard>
      </section>

      {error && (
        <GlassCard className="border-amber-500/20 bg-amber-500/10" glow="rose">
          <div className="flex items-center gap-3 text-amber-100">
            <AlertTriangle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        </GlassCard>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          value={loading ? "--" : formatCount(users.total_users)}
          detail={
            loading
              ? "Loading project data..."
              : `${formatRate(users.active_users, users.total_users)} active`
          }
          icon={Users}
          accent="cyan"
          signal={`${formatCount(users.admin_users)} admins`}
        />
        <StatCard
          title="Projects"
          value={loading ? "--" : formatCount(projects.total_projects)}
          detail={
            loading
              ? "Loading project data..."
              : `${formatRate(projects.completed_projects, projects.total_projects)} complete`
          }
          icon={FolderKanban}
          accent="cyan"
          signal={`${formatCount(openProjectCount)} open`}
        />
        <StatCard
          title="Tasks"
          value={loading ? "--" : formatCount(tasks.total_tasks)}
          detail={
            loading
              ? "Loading project data..."
              : `${formatRate(tasks.completed_tasks, tasks.total_tasks)} complete`
          }
          icon={ListChecks}
          accent="emerald"
          signal={`${formatCount(tasks.blocked_tasks)} blocked`}
        />
        <StatCard
          title="Risk"
          value={loading ? "--" : formatCount(risks.total_risk_records)}
          detail={
            loading
              ? "Loading project data..."
              : `${formatCount(risks.high_risk_records)} high risk`
          }
          icon={AlertTriangle}
          accent={riskTone}
          signal={`${formatCount(risks.medium_risk_records)} medium`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <GlassCard>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              Project progress
            </p>
            <h2 className="text-2xl font-bold text-white">Project progress</h2>
            <p className="text-sm leading-6 text-slate-400">
              The bars below use the current overview endpoint. Empty values
              mean the backend has no records for that status yet.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <ProgressRow
              label="In progress"
              value={projects.in_progress_projects}
              total={projects.total_projects}
            />
            <ProgressRow
              label="Completed"
              value={projects.completed_projects}
              total={projects.total_projects}
              tone="emerald"
            />
            <ProgressRow
              label="On hold"
              value={projects.on_hold_projects}
              total={projects.total_projects}
              tone="amber"
            />
            <ProgressRow
              label="Cancelled"
              value={projects.cancelled_projects}
              total={projects.total_projects}
              tone="rose"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                System status
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Admin data health
              </h2>
            </div>
            <ShieldCheck size={22} className="text-teal-300" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <DataTile
              label="Email verified"
              value={loading ? "--" : formatCount(users.verified_users)}
              detail={`${formatCount(users.unverified_users)} users are not verified.`}
              icon={CheckCircle2}
              tone="emerald"
            />
            <DataTile
              label="Teams"
              value={loading ? "--" : formatCount(overview.teams_total)}
              detail="Total teams tracked by the admin backend."
              icon={Users}
              tone="cyan"
            />
            <DataTile
              label="Unread notices"
              value={
                loading ? "--" : formatCount(notifications.unread_notifications)
              }
              detail={`${formatCount(notifications.total_notifications)} notifications in total.`}
              icon={Bell}
              tone="cyan"
            />
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <GlassCard>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              Task progress
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Work status by task count
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            <ProgressRow
              label="To do"
              value={tasks.todo_tasks}
              total={tasks.total_tasks}
              tone="cyan"
            />
            <ProgressRow
              label="In progress"
              value={tasks.in_progress_tasks}
              total={tasks.total_tasks}
              tone="cyan"
            />
            <ProgressRow
              label="Completed"
              value={tasks.completed_tasks}
              total={tasks.total_tasks}
              tone="emerald"
            />
            <ProgressRow
              label="Blocked"
              value={tasks.blocked_tasks}
              total={tasks.total_tasks}
              tone="rose"
            />
          </div>
        </GlassCard>

        <GlassCard glow={riskTone}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              Recent activity
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Latest activity
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {activityLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl border border-slate-800 bg-slate-900/70"
                />
              ))
            ) : activity.length > 0 ? (
              activity.map((event) => (
                <div
                  key={event.activity_id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {event.event_type.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {event.message}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 size={13} />
                        {formatDateTime(event.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm leading-6 text-slate-400">
                {activityError || "No recent activity yet."}
              </div>
            )}
          </div>
        </GlassCard>
      </section>
    </PageTransition>
  );
}
