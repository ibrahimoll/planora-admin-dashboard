"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  MailCheck,
  MailWarning,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import type {
  AdminActivityLog,
  AdminUser,
  AdminUserActionResponse,
  AdminUserDetail,
} from "@/types/admin";

type RoleFilter = "all" | "admin" | "user";
type StatusFilter = "all" | "active" | "inactive";
type VerificationFilter = "all" | "verified" | "unverified";

type CurrentAdmin = {
  user_id: number;
  role: "user" | "admin";
};

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const roleOptions: Array<{ label: string; value: RoleFilter }> = [
  { label: "All roles", value: "all" },
  { label: "Admins", value: "admin" },
  { label: "Users", value: "user" },
];

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "All status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const verificationOptions: Array<{
  label: string;
  value: VerificationFilter;
}> = [
  { label: "All email", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "unverified" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function getInitials(user: Pick<AdminUser, "full_name" | "username">) {
  const source = user.full_name?.trim() || user.username;
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StatusPill({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
          : "border-rose-300/20 bg-rose-300/10 text-rose-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-300" : "bg-rose-300"
        }`}
      />
      {children}
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
          ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-white/[0.045] text-slate-400 hover:border-cyan-300/20 hover:text-cyan-100"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [activity, setActivity] = useState<AdminActivityLog[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.is_active).length;
    const admins = users.filter((user) => user.role === "admin").length;
    const verified = users.filter((user) => user.is_email_verified).length;

    return { total, active, admins, verified };
  }, [users]);

  useEffect(() => {
    async function loadCurrentAdmin() {
      try {
        const response = await api.get<CurrentAdmin>("/auth/me");
        setCurrentAdmin(response.data);
      } catch {
        setCurrentAdmin(null);
      }
    }

    loadCurrentAdmin();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoadingUsers(true);
      setError("");

      try {
        const response = await api.get<AdminUser[]>("/admin/users", {
          signal: controller.signal,
          params: {
            limit: 100,
            role: roleFilter === "all" ? undefined : roleFilter,
            is_active:
              statusFilter === "all" ? undefined : statusFilter === "active",
            is_email_verified:
              verificationFilter === "all"
                ? undefined
                : verificationFilter === "verified",
            search: search.trim() || undefined,
          },
        });

        setUsers(response.data);
        if (response.data.length === 0) {
          setSelectedUser(null);
          setActivity([]);
        }
        setSelectedUserId((current) => {
          if (response.data.length === 0) return null;
          if (current && response.data.some((user) => user.user_id === current)) {
            return current;
          }
          return response.data[0].user_id;
        });
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load users right now.",
            ),
          );
          setUsers([]);
          setSelectedUserId(null);
          setSelectedUser(null);
          setActivity([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingUsers(false);
        }
      }
    }

    const timeoutId = window.setTimeout(loadUsers, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [roleFilter, search, statusFilter, verificationFilter]);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const controller = new AbortController();

    async function loadUserDetail() {
      setLoadingDetail(true);

      try {
        const [detailResponse, activityResponse] = await Promise.all([
          api.get<AdminUserDetail>(`/admin/users/${selectedUserId}`, {
            signal: controller.signal,
          }),
          api.get<AdminActivityLog[]>(
            `/admin/users/${selectedUserId}/activity`,
            {
              signal: controller.signal,
              params: { limit: 6 },
            },
          ),
        ]);

        setSelectedUser(detailResponse.data);
        setActivity(activityResponse.data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load the selected user.",
            ),
          );
          setSelectedUser(null);
          setActivity([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDetail(false);
        }
      }
    }

    loadUserDetail();

    return () => controller.abort();
  }, [selectedUserId]);

  async function refreshUsers() {
    const response = await api.get<AdminUser[]>("/admin/users", {
      params: {
        limit: 100,
        role: roleFilter === "all" ? undefined : roleFilter,
        is_active:
          statusFilter === "all" ? undefined : statusFilter === "active",
        is_email_verified:
          verificationFilter === "all"
            ? undefined
            : verificationFilter === "verified",
        search: search.trim() || undefined,
      },
    });
    setUsers(response.data);
  }

  async function handleAction(
    user: AdminUser,
    action: "activate" | "deactivate" | "promote" | "demote",
  ) {
    setActionUserId(user.user_id);
    setError("");
    setNotice("");

    try {
      let response;

      if (action === "activate" || action === "deactivate") {
        response = await api.patch<AdminUserActionResponse>(
          `/admin/users/${user.user_id}/${action}`,
        );
      } else {
        response = await api.patch<AdminUserActionResponse>(
          `/admin/users/${user.user_id}/role`,
          { role: action === "promote" ? "admin" : "user" },
        );
      }

      setNotice(response.data.message);
      await refreshUsers();
      setSelectedUserId(response.data.user.user_id);
      setSelectedUser(response.data.user);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to update this user right now."),
      );
    } finally {
      setActionUserId(null);
    }
  }

  const selectedIsCurrentAdmin =
    selectedUser && currentAdmin?.user_id === selectedUser.user_id;

  return (
    <div className="space-y-6 pb-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <GlassCard className="p-0" glow="cyan">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  <Users size={15} />
                  Users
                </p>
                <h1 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Admin users
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Manage account access, roles, email verification, and recent
                  activity for Planora users.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshUsers}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                <RefreshCw size={17} />
                Refresh users
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="purple">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-300/10 text-purple-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-purple-200">
                Admin actions
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Actions are sent through the existing protected admin API.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Filtered users"
          value={loadingUsers ? "--" : stats.total}
          detail="Current query"
          icon={Users}
          accent="cyan"
          signal="Search results"
        />
        <StatCard
          title="Active"
          value={loadingUsers ? "--" : stats.active}
          detail={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% active`}
          icon={UserCheck}
          accent="emerald"
          signal="Account status"
        />
        <StatCard
          title="Admins"
          value={loadingUsers ? "--" : stats.admins}
          detail="Privileged users"
          icon={Crown}
          accent="purple"
          signal="Role count"
        />
        <StatCard
          title="Verified"
          value={loadingUsers ? "--" : stats.verified}
          detail="Email confirmed"
          icon={MailCheck}
          accent="cyan"
          signal="Email status"
        />
      </section>

      {(error || notice) && (
        <GlassCard
          className={
            error ? "border-rose-300/20 bg-rose-500/10" : "border-emerald-300/20 bg-emerald-500/10"
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <GlassCard glow="cyan">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                  User management
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  User list
                </h2>
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 shadow-inner shadow-black/30 lg:w-96">
                <Search size={18} className="shrink-0 text-cyan-200" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Search name, username, email..."
                />
              </div>
            </div>

            <div className="grid gap-3 border-y border-white/10 py-4 lg:grid-cols-3">
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((option) => (
                  <FilterButton
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    current={roleFilter}
                    onChange={setRoleFilter}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
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
                {verificationOptions.map((option) => (
                  <FilterButton
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    current={verificationFilter}
                    onChange={setVerificationFilter}
                  />
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/25">
              <div className="hidden grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr_0.75fr] border-b border-white/10 bg-white/[0.045] px-5 py-4 text-xs uppercase tracking-[0.2em] text-slate-500 lg:grid">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Created</span>
                <span className="text-right">Actions</span>
              </div>

              {loadingUsers ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.045]"
                    />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <SlidersHorizontal size={24} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">
                    No users matched
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Adjust the search or filters to show more accounts.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {users.map((user) => {
                    const isSelected = selectedUserId === user.user_id;
                    const isCurrentAdmin = currentAdmin?.user_id === user.user_id;
                    const actionLoading = actionUserId === user.user_id;

                    return (
                      <motion.div
                        key={user.user_id}
                        layout
                        className={`grid gap-4 p-4 transition lg:grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr_0.75fr] lg:items-center lg:px-5 ${
                          isSelected
                            ? "bg-cyan-300/[0.075]"
                            : "hover:bg-white/[0.035]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.user_id)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-black text-cyan-100">
                            {getInitials(user)}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-semibold text-white">
                                {user.full_name || user.username}
                              </span>
                              {isCurrentAdmin && (
                                <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-purple-200">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block truncate text-sm text-slate-400">
                              {user.email}
                            </span>
                          </span>
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                              user.role === "admin"
                                ? "border-purple-300/20 bg-purple-300/10 text-purple-200"
                                : "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                            }`}
                          >
                            {user.role === "admin" ? (
                              <Crown size={13} />
                            ) : (
                              <Users size={13} />
                            )}
                            {user.role}
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                              user.is_email_verified
                                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                                : "border-amber-300/20 bg-amber-300/10 text-amber-200"
                            }`}
                          >
                            {user.is_email_verified ? (
                              <MailCheck size={13} />
                            ) : (
                              <MailWarning size={13} />
                            )}
                            {user.is_email_verified ? "Verified" : "Unverified"}
                          </span>
                        </div>

                        <StatusPill active={user.is_active}>
                          {user.is_active ? "Active" : "Inactive"}
                        </StatusPill>

                        <div className="text-sm text-slate-300">
                          <span className="lg:hidden">Created </span>
                          {formatDate(user.created_at)}
                        </div>

                        <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.user_id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-slate-300 transition hover:border-cyan-300/20 hover:text-cyan-200"
                            aria-label={`View ${user.username}`}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading || isCurrentAdmin}
                            onClick={() =>
                              handleAction(
                                user,
                                user.is_active ? "deactivate" : "activate",
                              )
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-slate-300 transition hover:border-cyan-300/20 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={
                              user.is_active
                                ? `Deactivate ${user.username}`
                                : `Activate ${user.username}`
                            }
                          >
                            {user.is_active ? (
                              <UserX size={16} />
                            ) : (
                              <Power size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading || isCurrentAdmin}
                            onClick={() =>
                              handleAction(
                                user,
                                user.role === "admin" ? "demote" : "promote",
                              )
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-slate-300 transition hover:border-purple-300/20 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={
                              user.role === "admin"
                                ? `Demote ${user.username}`
                                : `Promote ${user.username}`
                            }
                          >
                            {user.role === "admin" ? (
                              <ShieldOff size={16} />
                            ) : (
                              <ShieldCheck size={16} />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="purple">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-purple-200">
                User detail
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Account summary
              </h2>
            </div>
            <Activity size={22} className="text-cyan-200" />
          </div>

          {loadingDetail ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.045]"
                />
              ))}
            </div>
          ) : selectedUser ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/30 bg-black/35 text-2xl font-black text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  {getInitials(selectedUser)}
                </div>
                <h3 className="mt-4 text-2xl font-black text-white">
                  {selectedUser.full_name || selectedUser.username}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  @{selectedUser.username}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <StatusPill active={selectedUser.is_active}>
                    {selectedUser.is_active ? "Active" : "Inactive"}
                  </StatusPill>
                  <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs font-semibold capitalize text-purple-200">
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Projects",
                    value: selectedUser.counts.projects_created,
                  },
                  {
                    label: "Assigned",
                    value: selectedUser.counts.assigned_tasks,
                  },
                  {
                    label: "Created",
                    value: selectedUser.counts.created_tasks,
                  },
                  {
                    label: "Notices",
                    value: selectedUser.counts.notifications,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Recent activity
                </p>
                {activity.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-slate-400">
                    No recent activity found for this user.
                  </div>
                ) : (
                  activity.map((event) => (
                    <div
                      key={event.activity_id}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {event.event_type.replaceAll("_", " ")}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-slate-400">
                            {event.message}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock3 size={13} />
                            {formatRelative(event.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  disabled={Boolean(actionUserId) || Boolean(selectedIsCurrentAdmin)}
                  onClick={() =>
                    handleAction(
                      selectedUser,
                      selectedUser.is_active ? "deactivate" : "activate",
                    )
                  }
                  className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {selectedUser.is_active ? "Deactivate user" : "Activate user"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(actionUserId) || Boolean(selectedIsCurrentAdmin)}
                  onClick={() =>
                    handleAction(
                      selectedUser,
                      selectedUser.role === "admin" ? "demote" : "promote",
                    )
                  }
                  className="rounded-2xl border border-purple-300/20 bg-purple-300/10 px-4 py-3 text-sm font-semibold text-purple-100 transition hover:bg-purple-300/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {selectedUser.role === "admin"
                    ? "Demote to user"
                    : "Promote to admin"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-center">
              <p className="text-sm text-slate-400">
                Select a user to view account details.
              </p>
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
