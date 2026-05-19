"use client";

import { AdminEmptyState } from "@/components/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/ui/AdminLoadingState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import { dispatchAdminNotificationsUpdated } from "@/lib/notificationEvents";
import type {
  AdminNotification,
  AdminNotificationMessageResponse,
  AdminNotificationUnreadCount,
} from "@/types/admin";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  MailCheck,
  MailOpen,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type NotificationFilter = "all" | "unread" | "read";

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const filters: Array<{ label: string; value: NotificationFilter }> = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
];

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

function formatType(value: string) {
  return value.replaceAll("_", " ");
}

function typeBadgeClass(value: string) {
  if (value === "risk") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  if (value === "deadline") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  if (value === "system") {
    return "border-violet-500/20 bg-violet-500/10 text-violet-200";
  }

  return "border-teal-500/20 bg-teal-500/10 text-teal-200";
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notificationToDelete, setNotificationToDelete] =
    useState<AdminNotification | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [notificationsResponse, unreadResponse] = await Promise.all([
        api.get<AdminNotification[]>("/notifications"),
        api.get<AdminNotificationUnreadCount>("/notifications/unread-count"),
      ]);

      setNotifications(notificationsResponse.data);
      setUnreadCount(unreadResponse.data.unread_count);
    } catch (requestError) {
      setNotifications([]);
      setUnreadCount(0);
      setError(
        getErrorMessage(requestError, "Could not load notifications."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications]);

  const visibleNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (filter === "read" && !notification.is_read) return false;
      if (filter === "unread" && notification.is_read) return false;

      if (!query) return true;

      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query)
      );
    });
  }, [filter, notifications, search]);

  const readCount = Math.max(0, notifications.length - unreadCount);

  async function runNotificationAction(
    action: () => Promise<unknown>,
    successMessage: string,
    fallbackError: string,
  ) {
    setIsActionLoading(true);
    setError("");
    setNotice("");

    try {
      await action();
      await loadNotifications();
      dispatchAdminNotificationsUpdated();
      setNotice(successMessage);
      window.setTimeout(() => setNotice(""), 2400);
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError, fallbackError));
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleMarkOneRead(notificationId: number) {
    await runNotificationAction(
      () => api.patch<AdminNotification>(`/notifications/${notificationId}/read`),
      "Notification marked as read.",
      "Could not mark notification as read.",
    );
  }

  async function handleMarkAllRead() {
    await runNotificationAction(
      () =>
        api.patch<AdminNotificationMessageResponse>("/notifications/read-all"),
      "All notifications marked as read.",
      "Could not mark all notifications as read.",
    );
  }

  async function handleDelete(notificationId: number) {
    return runNotificationAction(
      () =>
        api.delete<AdminNotificationMessageResponse>(
          `/notifications/${notificationId}`,
        ),
      "Notification deleted.",
      "Could not delete notification.",
    );
  }

  async function handleConfirmDelete() {
    if (!notificationToDelete) return;

    const deleted = await handleDelete(notificationToDelete.notification_id);

    if (deleted) {
      setNotificationToDelete(null);
    }
  }

  return (
    <PageTransition className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-300">
            Notification center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Notifications
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Manage your real Planora notification records. Read state and
            deletes are saved through the backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : undefined}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            disabled={isActionLoading || unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-2.5 text-sm font-semibold text-teal-100 transition hover:border-teal-400/40 hover:bg-teal-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActionLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCheck size={16} />
            )}
            Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Loaded"
          value={isLoading ? "--" : notifications.length}
          detail="Notifications returned"
          icon={Bell}
          accent="cyan"
        />
        <StatCard
          title="Unread"
          value={isLoading ? "--" : unreadCount}
          detail="From unread-count endpoint"
          icon={MailOpen}
          accent={unreadCount > 0 ? "amber" : "emerald"}
        />
        <StatCard
          title="Read"
          value={isLoading ? "--" : readCount}
          detail="Visible backend records"
          icon={MailCheck}
          accent="emerald"
        />
      </section>

      <Reveal>
        <GlassCard>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => {
                const active = filter === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                      active
                        ? "border-teal-500/40 bg-teal-500/10 text-teal-100"
                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-teal-500/30 hover:text-teal-100"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <label className="relative w-full xl:w-[380px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications..."
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
              />
            </label>
          </div>
        </GlassCard>
      </Reveal>

      <Reveal>
        {isLoading ? (
          <AdminLoadingState
            variant="page"
            title="Loading notifications"
            message="Fetching your Planora alerts and unread count."
            rows={5}
          />
        ) : visibleNotifications.length === 0 ? (
          <AdminEmptyState
            icon={CheckCircle2}
            title={
              notifications.length === 0
                ? "No notifications"
                : "No matching notifications"
            }
            message={
              notifications.length === 0
                ? "New Planora alerts will appear here."
                : "Try a different filter or search term."
            }
          />
        ) : (
          <GlassCard>
            <div className="space-y-3">
              {visibleNotifications.map((notification) => {
                const unread = notification.is_read === false;

                return (
                  <article
                    key={notification.notification_id}
                    className={`rounded-2xl border p-5 transition hover:border-teal-500/25 ${
                      unread
                        ? "border-teal-500/30 bg-teal-500/10"
                        : "border-slate-800 bg-slate-950/45"
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${typeBadgeClass(
                              notification.type,
                            )}`}
                          >
                            {formatType(notification.type)}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              unread
                                ? "border-teal-500/25 bg-teal-500/10 text-teal-100"
                                : "border-slate-700 bg-slate-900 text-slate-300"
                            }`}
                          >
                            {unread ? "Unread" : "Read"}
                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                            <Clock3 size={13} />
                            {formatDateTime(notification.created_at)}
                          </span>
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-white">
                          {notification.title || "Notification"}
                        </h2>
                        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                          {notification.message}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {unread && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleMarkOneRead(
                                notification.notification_id,
                              )
                            }
                            disabled={isActionLoading}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 text-sm font-semibold text-teal-100 transition hover:border-teal-400/40 hover:bg-teal-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} />
                            Mark read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setNotificationToDelete(notification)}
                          disabled={isActionLoading}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 text-sm font-semibold text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </GlassCard>
        )}
      </Reveal>

      <ConfirmDialog
        open={Boolean(notificationToDelete)}
        title="Delete notification?"
        message={
          notificationToDelete?.title
            ? `This will permanently remove "${notificationToDelete.title}" from your notification list.`
            : "This will permanently remove this notification from your list."
        }
        confirmLabel="Delete notification"
        dangerText="This action cannot be undone."
        loading={isActionLoading}
        onClose={() => {
          if (!isActionLoading) {
            setNotificationToDelete(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </PageTransition>
  );
}