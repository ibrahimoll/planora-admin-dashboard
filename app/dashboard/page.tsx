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
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListChecks,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  },
  purple: {
    text: "text-violet-200",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  emerald: {
    text: "text-emerald-200",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  amber: {
    text: "text-amber-200",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  rose: {
    text: "text-rose-200",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
};

type Tone = keyof typeof toneMap;

type ChartPoint = {
  label: string;
  value: number;
  color: string;
};

type TooltipPayload = {
  value?: number;
  name?: string;
  payload?: {
    label?: string;
    value?: number;
  };
};

const CHART_INITIAL_DIMENSION = {
  width: 360,
  height: 260,
};

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

function getChartTotal(data: ChartPoint[]) {
  return data.reduce((sum, item) => sum + item.value, 0);
}

function getPlaceholderChartData(data: ChartPoint[]) {
  const fallbackValues = [4, 3, 2, 3, 1];

  if (data.length === 0) {
    return [
      {
        label: "No records",
        value: 1,
        color: "#334155",
      },
    ];
  }

  return data.map((item, index) => ({
    ...item,
    value: fallbackValues[index] ?? 1,
    color: "#334155",
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const firstItem = payload[0];
  const itemLabel = firstItem.payload?.label || firstItem.name || label || "";
  const value = firstItem.value ?? firstItem.payload?.value ?? 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-sm shadow-xl shadow-black/30">
      <p className="font-semibold text-white">{itemLabel}</p>
      <p className="mt-1 text-slate-400">
        Count: <span className="font-semibold text-teal-200">{value}</span>
      </p>
    </div>
  );
}

function NoRecordsOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-950/85 px-5 py-4 text-center shadow-xl shadow-black/30 backdrop-blur-md">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-200">
          No records
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Data will appear when records exist.
        </p>
      </div>
    </div>
  );
}

function ChartLegend({ data }: { data: ChartPoint[] }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {data.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm text-slate-300">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">{item.label}</span>
          </span>

          <span className="font-semibold text-white">
            {formatCount(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <GlassCard>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>

      <div className="mt-6">{children}</div>
    </GlassCard>
  );
}

function DonutChartBlock({
  data,
  centerLabel,
  centerValue,
}: {
  data: ChartPoint[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = getChartTotal(data);
  const isEmpty = total === 0;
  const chartData = isEmpty
    ? getPlaceholderChartData(data)
    : data.filter((item) => item.value > 0);

  return (
    <>
      <div className="relative h-[260px] rounded-2xl border border-slate-800/80 bg-slate-950/20">
        <div
          className={`h-full transition ${
            isEmpty ? "blur-[2.5px] opacity-40" : ""
          }`}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={CHART_INITIAL_DIMENSION}
          >
            <PieChart>
              {!isEmpty && <Tooltip content={<ChartTooltip />} />}
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius="58%"
                outerRadius="82%"
                minAngle={6}
                paddingAngle={3}
                stroke="#0f172a"
                strokeWidth={4}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition ${
            isEmpty ? "blur-[1px] opacity-45" : ""
          }`}
        >
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-5 py-4 text-center shadow-xl shadow-black/20">
            <p className="text-3xl font-bold text-white">{centerValue}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {centerLabel}
            </p>
          </div>
        </div>

        {isEmpty && <NoRecordsOverlay />}
      </div>

      <ChartLegend data={data} />
    </>
  );
}

function BarChartBlock({ data }: { data: ChartPoint[] }) {
  const total = getChartTotal(data);
  const isEmpty = total === 0;
  const chartData = isEmpty ? getPlaceholderChartData(data) : data;

  return (
    <>
      <div className="relative h-[260px] rounded-2xl border border-slate-800/80 bg-slate-950/20 px-2 pt-4">
        <div
          className={`h-full transition ${
            isEmpty ? "blur-[2.5px] opacity-40" : ""
          }`}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={CHART_INITIAL_DIMENSION}
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
              barCategoryGap="26%"
            >
              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
                horizontal
                vertical
                opacity={0.45}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
              />
              {!isEmpty && (
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.55)" }}
                  content={<ChartTooltip />}
                />
              )}
              <Bar dataKey="value" radius={[9, 9, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {isEmpty && <NoRecordsOverlay />}
      </div>

      <ChartLegend data={data} />
    </>
  );
}

function RiskLineChartBlock({ data }: { data: ChartPoint[] }) {
  const total = getChartTotal(data);
  const isEmpty = total === 0;
  const chartData = isEmpty ? getPlaceholderChartData(data) : data;
  const maxValue = Math.max(...chartData.map((item) => item.value), 0);
  const yMax = Math.max(maxValue + 1, 1);

  return (
    <>
      <div className="relative h-[260px] rounded-2xl border border-slate-800/80 bg-slate-950/20 px-2 pt-4">
        <div
          className={`h-full transition ${
            isEmpty ? "blur-[2.5px] opacity-40" : ""
          }`}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={CHART_INITIAL_DIMENSION}
          >
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 18, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
                horizontal
                vertical
                opacity={0.55}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, yMax]}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
              />
              {!isEmpty && (
                <Tooltip
                  cursor={{
                    stroke: "#14b8a6",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={<ChartTooltip />}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#14b8a6"
                strokeWidth={3}
                dot={{
                  r: 6,
                  stroke: "#0f172a",
                  strokeWidth: 3,
                  fill: "#14b8a6",
                }}
                activeDot={{
                  r: 8,
                  stroke: "#ccfbf1",
                  strokeWidth: 2,
                  fill: "#14b8a6",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {isEmpty && <NoRecordsOverlay />}
      </div>

      <ChartLegend data={data} />
    </>
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

function CompactStatusCard({
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
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className={`mt-2 truncate text-xl font-bold ${styles.text}`}>
            {value}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.border} ${styles.bg} ${styles.text}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </GlassCard>
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
          { params: { limit: 12 } },
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

  const overdueTone: Tone = tasks.overdue_tasks > 0 ? "rose" : "emerald";
  const blockedTone: Tone = tasks.blocked_tasks > 0 ? "amber" : "emerald";

  const openProjectCount =
    projects.in_progress_projects + projects.not_started_projects;

  const projectStatusData = useMemo<ChartPoint[]>(
    () => [
      {
        label: "Not started",
        value: projects.not_started_projects,
        color: "#64748b",
      },
      {
        label: "In progress",
        value: projects.in_progress_projects,
        color: "#14b8a6",
      },
      {
        label: "On hold",
        value: projects.on_hold_projects,
        color: "#f59e0b",
      },
      {
        label: "Completed",
        value: projects.completed_projects,
        color: "#10b981",
      },
      {
        label: "Cancelled",
        value: projects.cancelled_projects,
        color: "#fb7185",
      },
    ],
    [projects],
  );

  const taskStatusData = useMemo<ChartPoint[]>(
    () => [
      {
        label: "To do",
        value: tasks.todo_tasks,
        color: "#14b8a6",
      },
      {
        label: "In progress",
        value: tasks.in_progress_tasks,
        color: "#38bdf8",
      },
      {
        label: "Completed",
        value: tasks.completed_tasks,
        color: "#10b981",
      },
      {
        label: "Blocked",
        value: tasks.blocked_tasks,
        color: "#fb7185",
      },
      {
        label: "Overdue",
        value: tasks.overdue_tasks,
        color: "#f43f5e",
      },
    ],
    [tasks],
  );

  const riskData = useMemo<ChartPoint[]>(
    () => [
      {
        label: "Low",
        value: risks.low_risk_records,
        color: "#10b981",
      },
      {
        label: "Medium",
        value: risks.medium_risk_records,
        color: "#f59e0b",
      },
      {
        label: "High",
        value: risks.high_risk_records,
        color: "#fb7185",
      },
    ],
    [risks],
  );

  return (
    <PageTransition className="space-y-6 pb-10">
      <style>{`
        .dashboard-scroll {
          scrollbar-width: thin;
          scrollbar-color: #14b8a6 #0f172a;
        }

        .dashboard-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .dashboard-scroll::-webkit-scrollbar-track {
          background: #0f172a;
          border-radius: 999px;
        }

        .dashboard-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #14b8a6, #0f766e);
          border-radius: 999px;
          border: 2px solid #0f172a;
        }

        .dashboard-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2dd4bf, #0d9488);
        }
      `}</style>

      {error && (
        <GlassCard className="border-amber-500/20 bg-amber-500/10" glow="rose">
          <div className="flex items-center gap-3 text-amber-100">
            <AlertTriangle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        </GlassCard>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CompactStatusCard
          label="Last updated"
          value={loading ? "Loading..." : formatDateTime(overview.generated_at)}
          detail="Latest admin overview sync."
          icon={CalendarClock}
          tone="cyan"
        />

        <CompactStatusCard
          label="Overdue tasks"
          value={loading ? "--" : formatCount(tasks.overdue_tasks)}
          detail="Tasks past due date."
          icon={TimerReset}
          tone={overdueTone}
        />

        <CompactStatusCard
          label="Blocked tasks"
          value={loading ? "--" : formatCount(tasks.blocked_tasks)}
          detail="Work currently blocked."
          icon={AlertTriangle}
          tone={blockedTone}
        />

        <CompactStatusCard
          label="High risk"
          value={loading ? "--" : formatCount(risks.high_risk_records)}
          detail="Risk records needing review."
          icon={AlertTriangle}
          tone={riskTone}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          eyebrow="Portfolio"
          title="Project status"
          description="Distribution of projects across delivery states."
        >
          <DonutChartBlock
            data={projectStatusData}
            centerLabel="Projects"
            centerValue={loading ? "--" : formatCount(projects.total_projects)}
          />
        </ChartCard>

        <ChartCard
          eyebrow="Tasks"
          title="Task workload"
          description="Task status volume, including blocked and overdue work."
        >
          <BarChartBlock data={taskStatusData} />
        </ChartCard>

        <ChartCard
          eyebrow="Risk"
          title="Risk severity line"
          description="Line diagram showing low, medium, and high risk records."
        >
          <RiskLineChartBlock data={riskData} />
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <GlassCard glow={riskTone} className="flex h-[460px] flex-col">
          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              Recent activity
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Latest activity
            </h2>
          </div>

          <div className="dashboard-scroll mt-6 flex-1 space-y-3 overflow-auto pr-2">
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
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
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

          <div className="mt-6 grid gap-3">
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
    </PageTransition>
  );
}
