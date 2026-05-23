/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ADMIN_PROFILE_UPDATED_EVENT,
  buildProfileImageUrl,
  clearAdminProfile,
  getAdminDisplayName,
  getAdminInitials,
  getSavedAdminProfile,
  saveAdminProfile,
  type AdminUser,
} from "@/lib/adminProfileSync";
import { api } from "@/lib/api";
import {
  clearAdminDeviceTokenId,
  clearAdminToken,
  getAdminDeviceTokenId,
} from "@/lib/auth";
import { getBrowserDeviceKey } from "@/lib/firebaseClient";
import {
  ADMIN_NOTIFICATIONS_UPDATED_EVENT,
  dispatchAdminNotificationsUpdated,
} from "@/lib/notificationEvents";
import type { AdminNotification } from "@/types/admin";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckSquare,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Search,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type AdminTopbarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

const searchTargets = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["overview", "dashboard", "home", "main"],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
    keywords: ["users", "user", "admins", "admin", "accounts"],
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    keywords: ["projects", "project", "portfolio"],
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    keywords: ["tasks", "task", "todo", "blocked", "overdue"],
  },
  {
    label: "Risk",
    href: "/dashboard/risk",
    icon: AlertTriangle,
    keywords: ["risk", "risks", "delay", "high risk"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    keywords: ["reports", "report", "analytics", "charts"],
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    keywords: ["notifications", "notification", "alerts", "unread"],
  },
  {
    label: "Admin Logs",
    href: "/dashboard/admin-logs",
    icon: ScrollText,
    keywords: ["logs", "audit", "admin logs", "activity"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    keywords: ["settings", "profile", "password", "account"],
  },
];

function formatNotificationTime(value?: string) {
  if (!value) return "Just now";

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Just now";
  }
}

export default function AdminTopbar({
  sidebarOpen,
  onToggleSidebar,
}: AdminTopbarProps) {
  const router = useRouter();

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [profileImageBroken, setProfileImageBroken] = useState(false);

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const response = await api.get<AdminNotification[]>("/notifications");
      setNotifications(response.data);
    } catch {
      setNotifications([]);
      setNotificationsError("Could not load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    async function syncCurrentAdmin() {
      try {
        const response = await api.get<AdminUser>("/auth/me");
        saveAdminProfile(response.data);
        setAdminProfile(response.data);
        setProfileImageBroken(false);
      } catch {
        // Keep saved profile if /auth/me temporarily fails.
      }
    }

    function handleProfileUpdate(event: Event) {
      const customEvent = event as CustomEvent<AdminUser>;
      setAdminProfile(customEvent.detail);
      setProfileImageBroken(false);
    }

    const timeoutId = window.setTimeout(() => {
      const savedProfile = getSavedAdminProfile();

      if (savedProfile) {
        setAdminProfile(savedProfile);
      }

      void syncCurrentAdmin();
      void loadNotifications();
    }, 0);

    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, handleProfileUpdate);
    window.addEventListener(
      ADMIN_NOTIFICATIONS_UPDATED_EVENT,
      loadNotifications,
    );

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        ADMIN_PROFILE_UPDATED_EVENT,
        handleProfileUpdate,
      );
      window.removeEventListener(
        ADMIN_NOTIFICATIONS_UPDATED_EVENT,
        loadNotifications,
      );
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        notificationsOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileOpen &&
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notificationsOpen, profileOpen]);

  useEffect(() => {
    async function sendHeartbeat() {
      try {
        const deviceTokenId = getAdminDeviceTokenId();
        if (!deviceTokenId) return;

        const parsedDeviceTokenId = Number(deviceTokenId);
        if (!Number.isFinite(parsedDeviceTokenId)) return;

        const deviceKey = getBrowserDeviceKey();

        await api.patch("/push-notifications/device-tokens/current/heartbeat", {
          device_token_id: parsedDeviceTokenId,
          device_key: deviceKey,
        });
      } catch {
        // Ignore heartbeat failures.
      }
    }

    void sendHeartbeat();

    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const filteredTargets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return [];

    return searchTargets.filter((target) => {
      const labelMatch = target.label.toLowerCase().includes(query);
      const keywordMatch = target.keywords.some((keyword) =>
        keyword.includes(query),
      );

      return labelMatch || keywordMatch;
    });
  }, [searchQuery]);

  const unreadCount = notifications.filter(
    (notification) => notification.is_read === false,
  ).length;

  const displayName = getAdminDisplayName(adminProfile);
  const initials = getAdminInitials(adminProfile);
  const profileImageUrl = buildProfileImageUrl(adminProfile?.profile_pic);
  const shouldShowProfileImage =
    Boolean(profileImageUrl) && !profileImageBroken;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim().toLowerCase();

    if (!query) return;

    const match =
      filteredTargets[0] ||
      searchTargets.find((target) =>
        target.keywords.some((keyword) => keyword === query),
      );

    if (match) {
      router.push(match.href);
      setSearchQuery("");
      setNotificationsOpen(false);
      setProfileOpen(false);
    }
  }

  function goToRoute(href: string) {
    router.push(href);
    setSearchQuery("");
    setNotificationsOpen(false);
    setProfileOpen(false);
  }

  async function handleMarkAllRead() {
    const previousNotifications = notifications;

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    );

    try {
      await api.patch("/notifications/read-all");
      await loadNotifications();
      dispatchAdminNotificationsUpdated();
    } catch {
      setNotifications(previousNotifications);
      setNotificationsError("Could not mark notifications as read.");
    }
  }

  async function handleLogout() {
    const deviceTokenId = getAdminDeviceTokenId();

    try {
      const deviceKey = getBrowserDeviceKey();

      await api.patch("/push-notifications/device-tokens/current/deactivate", {
        device_token_id: deviceTokenId ? Number(deviceTokenId) : null,
        device_key: deviceKey,
      });
    } catch {
      // Continue logout even if push-token cleanup fails.
    }

    clearAdminDeviceTokenId();
    clearAdminToken();
    clearAdminProfile();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-[80] border-b border-[#1d2942] bg-[#080d1a]/95 backdrop-blur-xl">
      <div className="flex h-[104px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#1d2942] bg-[#0d1424] text-[#8ea3c7] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#20d6c7]/60 hover:bg-[#101a2d] hover:text-[#20d6c7] hover:shadow-[0_12px_35px_rgba(32,214,199,0.12)] active:translate-y-0"
        >
          <span className="transition-transform duration-200 group-hover:scale-110">
            {sidebarOpen ? (
              <PanelLeftClose size={22} />
            ) : (
              <PanelLeftOpen size={22} />
            )}
          </span>
        </button>

        <form
          onSubmit={handleSearchSubmit}
          className="hidden min-w-0 flex-1 md:block"
        >
          <div className="relative max-w-3xl">
            <Search
              size={22}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search dashboard..."
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-14 pr-14 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08),0_18px_45px_rgba(0,0,0,0.22)]"
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#7182a5] transition-all duration-200 hover:bg-[#111d31] hover:text-white"
              >
                <X size={18} />
              </button>
            ) : null}

            {filteredTargets.length > 0 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 overflow-hidden rounded-2xl border border-[#1d2942] bg-[#0d1424]/98 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-[planoraDropdownIn_180ms_ease-out]">
                {filteredTargets.map((target) => {
                  const Icon = target.icon;

                  return (
                    <button
                      key={target.href}
                      type="button"
                      onClick={() => goToRoute(target.href)}
                      className="group flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold text-[#d8e2f5] transition-all duration-200 hover:bg-[#101a2d] hover:text-[#20d6c7]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20d6c7]/10 text-[#20d6c7] transition-all duration-200 group-hover:scale-105 group-hover:bg-[#20d6c7]/20">
                        <Icon size={18} />
                      </span>
                      <span>{target.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((current) => {
                  const next = !current;

                  if (next) {
                    loadNotifications();
                  }

                  return next;
                });
                setProfileOpen(false);
              }}
              className="group relative hidden h-12 w-12 items-center justify-center rounded-2xl border border-[#1d2942] bg-[#0d1424] text-[#8ea3c7] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#20d6c7]/60 hover:text-[#20d6c7] hover:shadow-[0_12px_35px_rgba(32,214,199,0.12)] active:translate-y-0 sm:flex"
            >
              <Bell
                size={20}
                className="transition-transform duration-200 group-hover:rotate-12"
              />

              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-[#080d1a]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-96 overflow-hidden rounded-2xl border border-[#1d2942] bg-[#0d1424]/98 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-[planoraDropdownIn_180ms_ease-out]">
                <div className="flex items-center justify-between gap-4 border-b border-[#1d2942] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Notifications
                    </p>
                    <p className="mt-1 text-xs text-[#8ea3c7]">
                      {unreadCount > 0
                        ? `${unreadCount} unread notification${
                            unreadCount === 1 ? "" : "s"
                          }`
                        : "No unread notifications"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => goToRoute("/dashboard/notifications")}
                      className="rounded-xl border border-[#1d2942] px-3 py-2 text-xs font-semibold text-[#d8e2f5] transition hover:border-[#20d6c7]/50 hover:bg-[#20d6c7]/10 hover:text-[#20d6c7]"
                    >
                      View all
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={
                        notificationsLoading ||
                        notifications.length === 0 ||
                        unreadCount === 0
                      }
                      className="rounded-xl border border-[#1d2942] px-3 py-2 text-xs font-semibold text-[#20d6c7] transition hover:border-[#20d6c7]/50 hover:bg-[#20d6c7]/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto p-3">
                  {notificationsLoading ? (
                    <div className="rounded-xl border border-[#1d2942] bg-[#080d1a] p-4 text-sm text-[#8ea3c7]">
                      Loading notifications...
                    </div>
                  ) : notificationsError ? (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                      {notificationsError}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="rounded-xl border border-[#1d2942] bg-[#080d1a] p-4">
                      <p className="text-sm font-medium text-white">
                        No notifications yet
                      </p>
                      <p className="mt-1 text-xs text-[#8ea3c7]">
                        New admin alerts will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => {
                        const unread = notification.is_read === false;

                        return (
                          <div
                            key={notification.notification_id}
                            className={[
                              "rounded-xl border p-3 transition-all duration-200",
                              unread
                                ? "border-[#20d6c7]/30 bg-[#20d6c7]/10"
                                : "border-[#1d2942] bg-[#080d1a]",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={[
                                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                                  unread ? "bg-[#20d6c7]" : "bg-[#334155]",
                                ].join(" ")}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">
                                  {notification.title || "Notification"}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8ea3c7]">
                                  {notification.message ||
                                    "You have a new Planora update."}
                                </p>
                                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
                                  {formatNotificationTime(
                                    notification.created_at,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden h-12 items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100 md:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </span>
            Verified admin
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationsOpen(false);
              }}
              className="group flex h-12 items-center gap-3 rounded-2xl border border-[#1d2942] bg-[#0d1424] px-3 text-sm font-medium text-[#d8e2f5] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#20d6c7]/60 hover:shadow-[0_12px_35px_rgba(32,214,199,0.12)] active:translate-y-0"
            >
              <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#20d6c7] text-sm font-semibold text-[#06111f] ring-2 ring-[#20d6c7]/20 transition-transform duration-200 group-hover:scale-105">
                {shouldShowProfileImage && profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setProfileImageBroken(true)}
                  />
                ) : (
                  initials
                )}
              </span>

              <ChevronDown
                size={16}
                className={[
                  "hidden text-[#8ea3c7] transition-transform duration-200 sm:block",
                  profileOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-72 overflow-hidden rounded-2xl border border-[#1d2942] bg-[#0d1424]/98 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-[planoraDropdownIn_180ms_ease-out]">
                <div className="flex items-center gap-3 border-b border-[#1d2942] px-4 py-4">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#20d6c7] text-sm font-semibold text-[#06111f]">
                    {shouldShowProfileImage && profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        onError={() => setProfileImageBroken(true)}
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-xs font-normal text-[#8ea3c7]">
                      {adminProfile?.email || "Admin account"}
                    </p>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => goToRoute("/dashboard/settings")}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#d8e2f5] transition-all duration-200 hover:bg-[#101a2d] hover:text-[#20d6c7]"
                  >
                    <UserCircle size={18} />
                    Profile settings
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-200 transition-all duration-200 hover:bg-red-500/10 hover:text-red-100"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden h-12 items-center gap-2 rounded-2xl border border-[#1d2942] bg-[#0d1424] px-5 text-sm font-semibold text-[#d8e2f5] transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400/40 hover:text-red-300 active:translate-y-0 sm:flex"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
