"use client";

import { AdminEmptyState } from "@/components/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/ui/AdminLoadingState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import type { AdminLog, AdminUser } from "@/types/admin";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FilterX,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  UserRound,
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

function getErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
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

function formatAction(value: string) {
  return value.replaceAll("_", " ");
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [adminId, setAdminId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [action, setAction] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [error, setError] = useState("");

  const userMap = useMemo(() => {
    return new Map(users.map((user) => [user.user_id, user]));
  }, [users]);

  const activeFilterCount = useMemo(() => {
    return [
      adminId.trim(),
      targetUserId.trim(),
      action.trim(),
      createdFrom,
      createdTo,
    ].filter(Boolean).length;
  }, [action, adminId, createdFrom, createdTo, targetUserId]);

  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);

    try {
      const response = await api.get<AdminUser[]>("/admin/users", {
        params: {
          limit: 100,
          offset: 0,
        },
      });
      setUsers(response.data);
    } catch {
      setUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<AdminLog[]>("/admin/logs", {
        params: {
          admin_id: parseOptionalNumber(adminId),
          target_user_id: parseOptionalNumber(targetUserId),
          action: action.trim() || undefined,
          created_from: createdFrom || undefined,
          created_to: createdTo || undefined,
          limit,
          offset,
        },
      });

      setLogs(response.data);
    } catch (requestError) {
      setLogs([]);
      setError(getErrorMessage(requestError, "Could not load admin logs."));
    } finally {
      setIsLoading(false);
    }
  }, [action, adminId, createdFrom, createdTo, limit, offset, targetUserId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLogs();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadLogs]);

  function getUserLabel(userId: number | null) {
    if (userId === null) return "No target user";

    const user = userMap.get(userId);

    if (!user) return `User #${userId}`;

    return user.full_name || user.username || user.email || `User #${userId}`;
  }

  function resetFilters() {
    setAdminId("");
    setTargetUserId("");
    setAction("");
    setCreatedFrom("");
    setCreatedTo("");
    setOffset(0);
  }

  function goToPreviousPage() {
    setOffset((current) => Math.max(0, current - limit));
  }

  function goToNextPage() {
    if (logs.length < limit) return;
    setOffset((current) => current + limit);
  }

  return (
    <PageTransition className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-300">
            Audit trail
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Admin Logs
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review audited admin actions from the backend with filters for
            actor, target user, action text, and creation date.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs()}
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

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Rows returned"
          value={isLoading ? "--" : logs.length}
          detail={`Limit ${limit}`}
          icon={ScrollText}
          accent="cyan"
        />
        <StatCard
          title="Page offset"
          value={offset}
          detail="Backend pagination offset"
          icon={CalendarClock}
          accent="purple"
        />
        <StatCard
          title="Filters"
          value={activeFilterCount}
          detail={isUsersLoading ? "Loading user labels" : "Active filters"}
          icon={ShieldCheck}
          accent="emerald"
        />
      </section>

      <Reveal>
        <GlassCard>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Search size={18} className="text-teal-300" />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Filters are sent directly to GET /admin/logs.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FilterX size={16} />
              Reset
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="xl:col-span-1">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Admin ID
              </span>
              <input
                value={adminId}
                onChange={(event) => {
                  setAdminId(event.target.value);
                  setOffset(0);
                }}
                inputMode="numeric"
                placeholder="Example: 1"
                className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
              />
            </label>

            <label className="xl:col-span-1">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Target user ID
              </span>
              <input
                value={targetUserId}
                onChange={(event) => {
                  setTargetUserId(event.target.value);
                  setOffset(0);
                }}
                inputMode="numeric"
                placeholder="Example: 8"
                className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
              />
            </label>

            <label className="xl:col-span-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Action
              </span>
              <input
                value={action}
                onChange={(event) => {
                  setAction(event.target.value);
                  setOffset(0);
                }}
                placeholder="Search action text..."
                className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
              />
            </label>

            <label>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                From
              </span>
              <input
                type="datetime-local"
                value={createdFrom}
                onChange={(event) => {
                  setCreatedFrom(event.target.value);
                  setOffset(0);
                }}
                className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-teal-500/60"
              />
            </label>

            <label>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                To
              </span>
              <input
                type="datetime-local"
                value={createdTo}
                onChange={(event) => {
                  setCreatedTo(event.target.value);
                  setOffset(0);
                }}
                className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-teal-500/60"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
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
                disabled={logs.length < limit || isLoading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </GlassCard>
      </Reveal>

      <Reveal>
        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Backend audit rows
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Logged admin actions
              </h2>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-300">
              Offset {offset}
            </span>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <AdminLoadingState
                title="Loading admin logs"
                message="Fetching audit trail records from the backend."
                rows={5}
              />
            ) : logs.length === 0 ? (
              <AdminEmptyState
                icon={ScrollText}
                title="No admin logs found"
                message={
                  activeFilterCount > 0
                    ? "Try broadening the filters or changing the date range."
                    : "Admin actions will appear here when changes are made."
                }
              />
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <article
                    key={log.log_id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5 transition hover:border-teal-500/25"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-200">
                            Log #{log.log_id}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>

                        <h3 className="mt-4 text-lg font-semibold capitalize text-white">
                          {formatAction(log.action)}
                        </h3>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:w-[420px]">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                            <ShieldCheck size={14} />
                            Admin
                          </p>
                          <p className="mt-2 font-semibold text-white">
                            {getUserLabel(log.admin_id)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID {log.admin_id}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                            {log.target_user_id ? (
                              <UserRound size={14} />
                            ) : (
                              <Users size={14} />
                            )}
                            Target
                          </p>
                          <p className="mt-2 font-semibold text-white">
                            {getUserLabel(log.target_user_id)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {log.target_user_id
                              ? `ID ${log.target_user_id}`
                              : "System level action"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </Reveal>
    </PageTransition>
  );
}