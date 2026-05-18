"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Database,
  FolderKanban,
  Gauge,
  ListChecks,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { AdminOverview } from "@/types/admin";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";

const emptyOverview: AdminOverview = {
  total_users: 0,
  active_users: 0,
  total_projects: 0,
  active_projects: 0,
  total_tasks: 0,
  completed_tasks: 0,
  overdue_tasks: 0,
  high_risk_projects: 0,
};

const chartBars = [42, 58, 48, 72, 64, 88, 54, 76, 69, 92, 83, 67];

const toneMap = {
  cyan: {
    text: "text-cyan-200",
    bar: "from-cyan-300 to-cyan-500",
    bg: "bg-cyan-300/10",
    border: "border-cyan-300/20",
    dot: "bg-cyan-300",
  },
  purple: {
    text: "text-purple-200",
    bar: "from-purple-300 to-fuchsia-500",
    bg: "bg-purple-300/10",
    border: "border-purple-300/20",
    dot: "bg-purple-300",
  },
  emerald: {
    text: "text-emerald-200",
    bar: "from-emerald-300 to-cyan-400",
    bg: "bg-emerald-300/10",
    border: "border-emerald-300/20",
    dot: "bg-emerald-300",
  },
  amber: {
    text: "text-amber-200",
    bar: "from-amber-300 to-orange-400",
    bg: "bg-amber-300/10",
    border: "border-amber-300/20",
    dot: "bg-amber-300",
  },
  rose: {
    text: "text-rose-200",
    bar: "from-rose-300 to-red-500",
    bg: "bg-rose-300/10",
    border: "border-rose-300/20",
    dot: "bg-rose-300",
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

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function MetricBar({
  label,
  value,
  detail,
  tone = "cyan",
  loading,
}: {
  label: string;
  value: number;
  detail: string;
  tone?: Tone;
  loading: boolean;
}) {
  const styles = toneMap[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`font-semibold ${styles.text}`}>
          {loading ? "--" : detail}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/45 shadow-inner shadow-black/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: loading ? "0%" : `${value}%` }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar} shadow-[0_0_20px_rgba(34,211,238,0.22)]`}
        />
      </div>
    </div>
  );
}

function SignalModule({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: LucideIcon;
}) {
  const styles = toneMap[tone];

  return (
    <div
      className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-lg shadow-black/20`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-2xl border ${styles.border} bg-black/30 p-3`}>
          <Icon size={20} className={styles.text} />
        </div>
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
      </div>
      <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await api.get<AdminOverview>("/admin/overview");
        setOverview({ ...emptyOverview, ...response.data });
      } catch {
        setError("Overview data is unavailable right now.");
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  const overdueTasks = overview.overdue_tasks ?? 0;
  const highRiskProjects = overview.high_risk_projects ?? 0;
  const totalActivity =
    overview.total_users + overview.total_projects + overview.total_tasks;

  const completionRate = useMemo(
    () => formatRate(overview.completed_tasks, overview.total_tasks),
    [overview.completed_tasks, overview.total_tasks],
  );

  const activeUserRate = useMemo(
    () => formatRate(overview.active_users, overview.total_users),
    [overview.active_users, overview.total_users],
  );

  const activeProjectRate = useMemo(
    () => formatRate(overview.active_projects, overview.total_projects),
    [overview.active_projects, overview.total_projects],
  );

  const completionPercent = getRate(
    overview.completed_tasks,
    overview.total_tasks,
  );
  const activeUserPercent = getRate(overview.active_users, overview.total_users);
  const activeProjectPercent = getRate(
    overview.active_projects,
    overview.total_projects,
  );
  const riskPressure = overview.total_projects
    ? getRate(highRiskProjects, overview.total_projects)
    : highRiskProjects > 0
      ? 100
      : 0;
  const delayPressure = overview.total_tasks
    ? getRate(overdueTasks, overview.total_tasks)
    : overdueTasks > 0
      ? 100
      : 0;
  const hasOperationalData = totalActivity > 0;
  const coreHealth = Math.max(
    0,
    Math.min(
      99.8,
      88 +
        completionPercent * 0.08 +
        activeProjectPercent * 0.04 +
        activeUserPercent * 0.02 -
        riskPressure * 0.12 -
        delayPressure * 0.1,
    ),
  );
  const intelligenceSync = Math.max(
    0,
    Math.min(100, Math.round((completionPercent + activeProjectPercent) / 2)),
  );

  const activityEvents = [
    {
      label: "Admin guard active",
      detail: "Protected route check and token guard are online.",
      tone: "cyan" as Tone,
      icon: ShieldCheck,
    },
    {
      label: "Project intelligence synced",
      detail: `${formatCount(overview.active_projects)} active projects in command view.`,
      tone: "purple" as Tone,
      icon: BrainCircuit,
    },
    {
      label: "Risk monitor sweep",
      detail: `${formatCount(highRiskProjects)} high-risk projects and ${formatCount(overdueTasks)} overdue tasks detected.`,
      tone: highRiskProjects || overdueTasks ? ("rose" as Tone) : ("emerald" as Tone),
      icon: Radar,
    },
    {
      label: "Task throughput updated",
      detail: `${completionRate} of tracked tasks are complete.`,
      tone: "emerald" as Tone,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <GlassCard className="min-h-[21rem] p-0" glow="cyan">
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(34,211,238,0.13),transparent_45%,rgba(192,132,252,0.11))]" />
            <div className="absolute inset-x-8 bottom-8 h-px bg-gradient-to-r from-cyan-300 via-purple-300 to-transparent opacity-60" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                    <Activity size={15} />
                    System Integrity Matrix
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Live admin overview
                  </span>
                </div>

                <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl xl:text-6xl">
                  Core Health:{" "}
                  <span className="text-cyan-200">
                    {loading
                      ? "--"
                      : hasOperationalData
                        ? formatPercent(coreHealth)
                        : "Awaiting data"}
                  </span>
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
                  Planora AI operations center for project throughput, user
                  activity, task completion, and live risk pressure across the
                  admin workspace.
                </p>

                <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                  <MetricBar
                    label="Project sync"
                    value={activeProjectPercent}
                    detail={activeProjectRate}
                    tone="cyan"
                    loading={loading}
                  />
                  <MetricBar
                    label="Task resolution"
                    value={completionPercent}
                    detail={completionRate}
                    tone="purple"
                    loading={loading}
                  />
                  <MetricBar
                    label="Risk pressure"
                    value={riskPressure}
                    detail={`${riskPressure}%`}
                    tone={riskPressure > 25 ? "rose" : "emerald"}
                    loading={loading}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <SignalModule
                  label="AI sync"
                  value={loading ? "--" : `${intelligenceSync}%`}
                  detail="Project intelligence"
                  tone="cyan"
                  icon={Network}
                />
                <SignalModule
                  label="Risk flags"
                  value={loading ? "--" : formatCount(highRiskProjects)}
                  detail="Requires review"
                  tone={highRiskProjects ? "rose" : "emerald"}
                  icon={AlertTriangle}
                />
                <SignalModule
                  label="Task backlog"
                  value={loading ? "--" : formatCount(overdueTasks)}
                  detail="Overdue queue"
                  tone={overdueTasks ? "amber" : "emerald"}
                  icon={Database}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SignalModule
            label="Admin guard"
            value="Active"
            detail="Session shield"
            tone="emerald"
            icon={ShieldCheck}
          />
          <SignalModule
            label="Neural latency"
            value={loading ? "--" : `${Math.max(12, 42 - intelligenceSync / 4)}ms`}
            detail="Overview channel"
            tone="purple"
            icon={Gauge}
          />
          <GlassCard className="p-5" glow="purple">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-purple-200">
                  System Pulse
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Monitoring active admins, project drift, and risk anomalies
                  with the current backend overview data.
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-300/10 text-purple-200">
                <Sparkles size={22} />
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {error && (
        <GlassCard className="border-amber-300/20 bg-amber-500/10" glow="rose">
          <div className="flex items-center gap-3 text-amber-100">
            <AlertTriangle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        </GlassCard>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={loading ? "--" : formatCount(overview.total_users)}
          detail={loading ? "Synchronizing" : `${activeUserRate} active`}
          icon={Users}
          accent="cyan"
          signal="+ admin identity map"
        />
        <StatCard
          title="Projects"
          value={loading ? "--" : formatCount(overview.total_projects)}
          detail={loading ? "Synchronizing" : `${activeProjectRate} active`}
          icon={FolderKanban}
          accent="purple"
          signal="+ portfolio nodes"
        />
        <StatCard
          title="Tasks"
          value={loading ? "--" : formatCount(overview.total_tasks)}
          detail={loading ? "Synchronizing" : `${completionRate} completed`}
          icon={ListChecks}
          accent="emerald"
          signal="+ throughput scan"
        />
        <StatCard
          title="Risk Flags"
          value={loading ? "--" : formatCount(highRiskProjects)}
          detail={
            loading
              ? "Synchronizing"
              : `${formatCount(overdueTasks)} overdue tasks`
          }
          icon={AlertTriangle}
          accent={highRiskProjects || overdueTasks ? "rose" : "emerald"}
          signal="+ anomaly watch"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.75fr)]">
        <GlassCard glow="cyan">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                Productivity Trends
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Neural throughput analysis
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                A compact command view for project activity, completion
                velocity, and admin-side intelligence refresh.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan-200">
                Primary nodes
              </span>
              <span className="rounded-xl border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-purple-200">
                Shadow assets
              </span>
            </div>
          </div>

          <div className="mt-8 h-72 rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="flex h-full items-end gap-2 border-b border-white/10">
              {chartBars.map((value, index) => {
                const adjusted = Math.max(
                  18,
                  Math.min(96, value + completionPercent / 10 - riskPressure / 12),
                );

                return (
                  <motion.div
                    key={`${value}-${index}`}
                    initial={{ height: 0, opacity: 0.45 }}
                    animate={{
                      height: loading ? "12%" : `${adjusted}%`,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.65, delay: index * 0.03 }}
                    className={`min-w-0 flex-1 rounded-t-xl ${
                      index % 5 === 3
                        ? "bg-purple-300/70 shadow-[0_0_22px_rgba(216,180,254,0.18)]"
                        : "bg-cyan-300/55 shadow-[0_0_22px_rgba(34,211,238,0.16)]"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricBar
              label="Active users"
              value={activeUserPercent}
              detail={activeUserRate}
              tone="cyan"
              loading={loading}
            />
            <MetricBar
              label="Active projects"
              value={activeProjectPercent}
              detail={activeProjectRate}
              tone="purple"
              loading={loading}
            />
            <MetricBar
              label="Completed tasks"
              value={completionPercent}
              detail={completionRate}
              tone="emerald"
              loading={loading}
            />
          </div>
        </GlassCard>

        <GlassCard glow="purple">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-purple-200">
                System Activity
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Live signal feed
              </h2>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Live
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {activityEvents.map((event) => {
              const styles = toneMap[event.tone];
              const Icon = event.icon;

              return (
                <div
                  key={event.label}
                  className={`rounded-2xl border ${styles.border} ${styles.bg} p-4`}
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/35">
                      <Icon size={18} className={styles.text} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{event.label}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-400">
                        {loading ? "Synchronizing project intelligence…" : event.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <GlassCard glow="purple">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-300/10 text-purple-200">
              <BrainCircuit size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-purple-200">
                Intelligence Highlights
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                Planora AI advisories
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            {[
              {
                label: "Efficiency spike",
                detail: `${completionRate} task completion across ${formatCount(overview.total_tasks)} tracked tasks.`,
                tone: "cyan" as Tone,
              },
              {
                label: "Risk anomaly",
                detail: `${formatCount(highRiskProjects)} high-risk projects remain on the admin watchlist.`,
                tone: highRiskProjects ? ("rose" as Tone) : ("emerald" as Tone),
              },
              {
                label: "Predictive scaling",
                detail: `${formatCount(overview.active_projects)} active projects are consuming live oversight.`,
                tone: "purple" as Tone,
              },
            ].map((item) => {
              const styles = toneMap[item.tone];

              return (
                <div
                  key={item.label}
                  className={`rounded-2xl border ${styles.border} ${styles.bg} p-4`}
                >
                  <p className={`text-xs uppercase tracking-[0.2em] ${styles.text}`}>
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {loading ? "Synchronizing project intelligence…" : item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard glow={riskPressure > 25 || delayPressure > 20 ? "rose" : "cyan"}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                Project Intelligence
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Risk and delivery matrix
              </h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
              {loading ? "Analyzing" : `${formatCount(overview.active_projects)} active nodes`}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <TrendingUp size={22} className="text-cyan-200" />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                Delivery velocity
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {loading ? "--" : completionRate}
              </p>
            </div>
            <div className="rounded-2xl border border-purple-300/20 bg-purple-300/10 p-4">
              <Zap size={22} className="text-purple-200" />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                AI sync score
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {loading ? "--" : `${intelligenceSync}%`}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4">
              <AlertTriangle size={22} className="text-rose-200" />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                Delay probability
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {loading ? "--" : `${delayPressure}%`}
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
