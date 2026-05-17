"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  ShieldCheck,
  Users,
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

function formatCount(value: number | undefined) {
  return (value ?? 0).toLocaleString();
}

function formatRate(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
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

  const completionRate = useMemo(
    () => formatRate(overview.completed_tasks, overview.total_tasks),
    [overview.completed_tasks, overview.total_tasks]
  );

  const activeUserRate = useMemo(
    () => formatRate(overview.active_users, overview.total_users),
    [overview.active_users, overview.total_users]
  );

  const activeProjectRate = useMemo(
    () => formatRate(overview.active_projects, overview.total_projects),
    [overview.active_projects, overview.total_projects]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            Command Overview
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Planora Control Center
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Monitor workspace health, admin activity, and operational risk from
            one secure dashboard.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100 shadow-xl shadow-emerald-950/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} />
            <span>Admin guard active</span>
          </div>
        </div>
      </div>

      {error && (
        <GlassCard className="border-amber-300/20 bg-amber-500/10">
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
          detail={`${activeUserRate} active`}
          icon={Users}
        />
        <StatCard
          title="Projects"
          value={loading ? "--" : formatCount(overview.total_projects)}
          detail={`${activeProjectRate} active`}
          icon={FolderKanban}
        />
        <StatCard
          title="Tasks"
          value={loading ? "--" : formatCount(overview.total_tasks)}
          detail={`${completionRate} completed`}
          icon={ListChecks}
        />
        <StatCard
          title="Risk Flags"
          value={loading ? "--" : formatCount(overview.high_risk_projects)}
          detail={`${formatCount(overview.overdue_tasks)} overdue tasks`}
          icon={AlertTriangle}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <GlassCard>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Operations Pulse
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Portfolio health
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Activity size={18} className="text-cyan-200" />
              Live overview
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {[
              {
                label: "Active users",
                value: overview.active_users,
                total: overview.total_users,
                color: "bg-cyan-300",
              },
              {
                label: "Active projects",
                value: overview.active_projects,
                total: overview.total_projects,
                color: "bg-violet-300",
              },
              {
                label: "Completed tasks",
                value: overview.completed_tasks,
                total: overview.total_tasks,
                color: "bg-emerald-300",
              },
            ].map((item) => {
              const width = item.total
                ? Math.min(100, Math.round((item.value / item.total) * 100))
                : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-cyan-100">
                      {loading ? "--" : `${width}%`}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: loading ? "0%" : `${width}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Priority Watch
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Attention queue
          </h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
              <div className="flex items-center gap-3 text-red-100">
                <AlertTriangle size={19} />
                <span className="text-sm font-medium">High-risk projects</span>
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {loading ? "--" : formatCount(overview.high_risk_projects)}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
              <div className="flex items-center gap-3 text-amber-100">
                <ListChecks size={19} />
                <span className="text-sm font-medium">Overdue tasks</span>
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {loading ? "--" : formatCount(overview.overdue_tasks)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3 text-emerald-100">
                <CheckCircle2 size={19} />
                <span className="text-sm font-medium">Completed tasks</span>
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {loading ? "--" : formatCount(overview.completed_tasks)}
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
