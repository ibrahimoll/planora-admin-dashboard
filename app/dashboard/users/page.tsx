"use client";

import { AdminEmptyState } from "@/components/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/ui/AdminLoadingState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import type {
  AdminActivityLog,
  AdminUser,
  AdminUserActionResponse,
  AdminUserDetail,
} from "@/types/admin";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Eye,
  Loader2,
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
import { useCallback, useEffect, useMemo, useState } from "react";

type RoleFilter = "all" | "admin" | "user";
type StatusFilter = "all" | "active" | "inactive";
type VerificationFilter = "all" | "verified" | "unverified";
type UserAction = "activate" | "deactivate" | "promote" | "demote";

type CurrentAdmin = {
  user_id: number;
  role: "user" | "admin";
};

type PendingAction = {
  user: AdminUser;
  action: UserAction;
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

const verificationOptions: Array<{ label: string; value: VerificationFilter }> = [
  { label: "All email", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "unverified" },
];

const ACTIVITY_PAGE_SIZE = 6;

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function getDisplayName(user: Pick<AdminUser, "full_name" | "username">) {
  return user.full_name?.trim() || user.username;
}

function getInitials(user: Pick<AdminUser, "full_name" | "username">) {
  const source = getDisplayName(user);
  const initials = source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}

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

function getActionCopy(pendingAction: PendingAction | null) {
  if (!pendingAction) {
    return {
      title: "Confirm user action",
      message: "Confirm this admin user action.",
      confirmLabel: "Confirm",
      dangerText: undefined,
    };
  }

  const name = getDisplayName(pendingAction.user);

  if (pendingAction.action === "activate") {
    return {
      title: "Activate user?",
      message: `This will restore protected-route access for ${name}.`,
      confirmLabel: "Activate user",
      dangerText: "Only activate accounts that should regain access to Planora.",
    };
  }

  if (pendingAction.action === "deactivate") {
    return {
      title: "Deactivate user?",
      message: `This will block ${name} from accessing protected Planora routes.`,
      confirmLabel: "Deactivate user",
      dangerText:
        "This is an admin-level account action. The user can be reactivated later.",
    };
  }

  if (pendingAction.action === "promote") {
    return {
      title: "Promote user to admin?",
      message: `${name} will receive administrator privileges in Planora.`,
      confirmLabel: "Promote to admin",
      dangerText:
        "Admin users can access sensitive dashboard features and user controls.",
    };
  }

  return {
    title: "Demote admin to user?",
    message: `${name} will lose administrator privileges.`,
    confirmLabel: "Demote to user",
    dangerText: "Make sure at least one trusted admin account remains available.",
  };
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
          ? "border-teal-500/30 bg-teal-500/10 text-teal-100"
          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-teal-500/25 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
    null,
  );
  const [activity, setActivity] = useState<AdminActivityLog[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.is_active).length;
    const admins = users.filter((user) => user.role === "admin").length;
    const verified = users.filter((user) => user.is_email_verified).length;

    return { total, active, admins, verified };
  }, [users]);

  const actionCopy = getActionCopy(pendingAction);

  const loadCurrentAdmin = useCallback(async () => {
    try {
      const response = await api.get<CurrentAdmin>("/auth/me");
      setCurrentAdmin(response.data);
    } catch {
      setCurrentAdmin(null);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError("");

    try {
      const response = await api.get<AdminUser[]>("/admin/users", {
        params: {
          limit,
          offset,
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
        setSelectedUserId(null);
        setSelectedUser(null);
        setActivity([]);
        setActivityHasMore(false);
        return;
      }

      setSelectedUserId((current) => {
        if (
          current &&
          response.data.some((user) => user.user_id === current)
        ) {
          return current;
        }

        return response.data[0].user_id;
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to load users right now."),
      );
      setUsers([]);
      setSelectedUserId(null);
      setSelectedUser(null);
      setActivity([]);
      setActivityHasMore(false);
    } finally {
      setLoadingUsers(false);
    }
  }, [limit, offset, roleFilter, search, statusFilter, verificationFilter]);

  const loadUserDetail = useCallback(async (userId: number) => {
    setLoadingDetail(true);
    setLoadingActivity(true);
    setActivityHasMore(false);

    try {
      const [detailResponse, activityResponse] = await Promise.all([
        api.get<AdminUserDetail>(`/admin/users/${userId}`),
        api.get<AdminActivityLog[]>(`/admin/users/${userId}/activity`, {
          params: { limit: ACTIVITY_PAGE_SIZE, offset: 0 },
        }),
      ]);

      setSelectedUser(detailResponse.data);
      setActivity(activityResponse.data);
      setActivityHasMore(activityResponse.data.length === ACTIVITY_PAGE_SIZE);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to load the selected user."),
      );
      setSelectedUser(null);
      setActivity([]);
      setActivityHasMore(false);
    } finally {
      setLoadingDetail(false);
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCurrentAdmin();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCurrentAdmin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsers();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedUserId) return undefined;

    const timeoutId = window.setTimeout(() => {
      void loadUserDetail(selectedUserId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUserDetail, selectedUserId]);

  async function refreshUsers() {
    setNotice("");
    await loadUsers();
  }

  async function handleAction(user: AdminUser, action: UserAction) {
    setActionUserId(user.user_id);
    setError("");
    setNotice("");

    try {
      const response =
        action === "activate" || action === "deactivate"
          ? await api.patch<AdminUserActionResponse>(
              `/admin/users/${user.user_id}/${action}`,
            )
          : await api.patch<AdminUserActionResponse>(
              `/admin/users/${user.user_id}/role`,
              {
                role: action === "promote" ? "admin" : "user",
              },
            );

      setNotice(response.data.message);
      setSelectedUserId(response.data.user.user_id);
      setSelectedUser(response.data.user);
      setPendingAction(null);
      await loadUsers();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to update this user right now.",
        ),
      );
    } finally {
      setActionUserId(null);
    }
  }

  async function handleLoadMoreActivity() {
    if (!selectedUserId) return;

    setLoadingMoreActivity(true);
    setError("");

    try {
      const response = await api.get<AdminActivityLog[]>(
        `/admin/users/${selectedUserId}/activity`,
        {
          params: {
            limit: ACTIVITY_PAGE_SIZE,
            offset: activity.length,
          },
        },
      );

      setActivity((current) => [...current, ...response.data]);
      setActivityHasMore(response.data.length === ACTIVITY_PAGE_SIZE);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to load more user activity.",
        ),
      );
    } finally {
      setLoadingMoreActivity(false);
    }
  }

  function openUserAction(user: AdminUser, action: UserAction) {
    setPendingAction({ user, action });
  }

  function goToPreviousPage() {
    setOffset((current) => Math.max(0, current - limit));
  }

  function goToNextPage() {
    if (users.length < limit) return;
    setOffset((current) => current + limit);
  }

  const selectedIsCurrentAdmin =
    selectedUser && currentAdmin?.user_id === selectedUser.user_id;

  return (
    <PageTransition className="space-y-6 pb-10">
      <Reveal delay={0.04}>
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
            detail={`${
              stats.total ? Math.round((stats.active / stats.total) * 100) : 0
            }% active`}
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
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <GlassCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                    User management
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    User list
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 lg:w-96">
                    <Search size={18} className="shrink-0 text-slate-500" />
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setOffset(0);
                      }}
                      className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="Search name, username, email..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void refreshUsers()}
                    disabled={loadingUsers}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={17}
                      className={loadingUsers ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-3 border-y border-slate-800 py-4 lg:grid-cols-3">
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((option) => (
                    <FilterButton
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      current={roleFilter}
                      onChange={(value) => {
                        setRoleFilter(value);
                        setOffset(0);
                      }}
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
                      onChange={(value) => {
                        setStatusFilter(value);
                        setOffset(0);
                      }}
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
                      onChange={(value) => {
                        setVerificationFilter(value);
                        setOffset(0);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/35">
                <div className="hidden grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr_0.75fr] border-b border-slate-800 bg-slate-900/80 px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
                  <span>User</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Created</span>
                  <span className="text-right">Actions</span>
                </div>

                {loadingUsers ? (
                  <div className="p-5">
                    <AdminLoadingState
                      title="Loading users"
                      message="Fetching admin user management records."
                      rows={5}
                    />
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-5">
                    <AdminEmptyState
                      icon={SlidersHorizontal}
                      title="No users found"
                      message="Users matching your filters will appear here."
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {users.map((user) => {
                      const isSelected = selectedUserId === user.user_id;
                      const isCurrentAdmin =
                        currentAdmin?.user_id === user.user_id;
                      const actionLoading = actionUserId === user.user_id;

                      return (
                        <div
                          key={user.user_id}
                          className={`grid gap-4 p-4 transition lg:grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr_0.75fr] lg:items-center lg:px-5 ${
                            isSelected
                              ? "bg-teal-500/[0.08]"
                              : "hover:bg-slate-900/60"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.user_id)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-sm font-semibold text-teal-100">
                              {getInitials(user)}
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-semibold text-white">
                                  {getDisplayName(user)}
                                </span>
                                {isCurrentAdmin && (
                                  <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-violet-200">
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
                                  ? "border-violet-500/20 bg-violet-500/10 text-violet-200"
                                  : "border-teal-500/20 bg-teal-500/10 text-teal-200"
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
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-teal-500/25 hover:text-teal-200"
                              aria-label={`View ${user.username}`}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              disabled={actionLoading || isCurrentAdmin}
                              onClick={() =>
                                openUserAction(
                                  user,
                                  user.is_active ? "deactivate" : "activate",
                                )
                              }
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-teal-500/25 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
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
                                openUserAction(
                                  user,
                                  user.role === "admin" ? "demote" : "promote",
                                )
                              }
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-violet-500/25 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                    disabled={offset === 0 || loadingUsers}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={users.length < limit || loadingUsers}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  User detail
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Account summary
                </h2>
              </div>
              <Activity size={22} className="text-teal-300" />
            </div>

            {loadingDetail ? (
              <div className="mt-6">
                <AdminLoadingState
                  title="Loading user detail"
                  message="Fetching selected user profile and activity."
                  rows={4}
                />
              </div>
            ) : selectedUser ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-2xl font-semibold text-teal-100">
                    {getInitials(selectedUser)}
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold text-white">
                    {getDisplayName(selectedUser)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    @{selectedUser.username}
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <StatusPill active={selectedUser.is_active}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </StatusPill>

                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold capitalize text-violet-200">
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
                      className="rounded-xl border border-slate-800 bg-slate-950/35 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                    Recent activity
                  </p>

                  {loadingActivity ? (
                    <AdminLoadingState
                      title="Loading activity"
                      message="Fetching recent user activity."
                      rows={3}
                    />
                  ) : activity.length === 0 ? (
                    <AdminEmptyState
                      icon={Activity}
                      title="No recent activity"
                      message="Recent activity for the selected user will appear here."
                    />
                  ) : (
                    <>
                      {activity.map((event) => (
                        <div
                          key={event.activity_id}
                          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-2 w-2 rounded-full bg-teal-400" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold capitalize text-white">
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
                      ))}

                      {activityHasMore && (
                        <button
                          type="button"
                          onClick={() => void handleLoadMoreActivity()}
                          disabled={loadingMoreActivity}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/45 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loadingMoreActivity ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Clock3 size={16} />
                          )}
                          Load more activity
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    disabled={
                      Boolean(actionUserId) || Boolean(selectedIsCurrentAdmin)
                    }
                    onClick={() =>
                      openUserAction(
                        selectedUser,
                        selectedUser.is_active ? "deactivate" : "activate",
                      )
                    }
                    className="rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-100 transition hover:bg-teal-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {selectedUser.is_active ? "Deactivate user" : "Activate user"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      Boolean(actionUserId) || Boolean(selectedIsCurrentAdmin)
                    }
                    onClick={() =>
                      openUserAction(
                        selectedUser,
                        selectedUser.role === "admin" ? "demote" : "promote",
                      )
                    }
                    className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {selectedUser.role === "admin" ? "Demote to user" : "Promote to admin"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <AdminEmptyState
                  icon={Users}
                  title="No user selected"
                  message="Select a user to view account details."
                />
              </div>
            )}
          </GlassCard>
        </section>
      </Reveal>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={actionCopy.title}
        message={actionCopy.message}
        confirmLabel={actionCopy.confirmLabel}
        dangerText={actionCopy.dangerText}
        loading={Boolean(actionUserId)}
        onClose={() => {
          if (!actionUserId) {
            setPendingAction(null);
          }
        }}
        onConfirm={() => {
          if (!pendingAction) return;
          void handleAction(pendingAction.user, pendingAction.action);
        }}
      />
    </PageTransition>
  );
}
