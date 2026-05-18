"use client";

import {
  ADMIN_PROFILE_UPDATED_EVENT,
  AdminUser,
  buildProfileImageUrl,
  getAdminDisplayName,
  getAdminInitials,
  getApiBaseUrl,
  getSavedAdminProfile,
  saveAdminProfile,
} from "@/lib/adminProfileSync";
import { clearAdminToken } from "@/lib/auth";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LogOut,
  Search,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  KeyboardEvent,
  MouseEvent,
  TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AdminNotification = {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const ADMIN_NOTIFICATIONS_STORAGE_KEY = "planora-admin-notifications";

const searchItems = [
  {
    title: "Overview",
    href: "/dashboard",
    description: "Dashboard summary, analytics, system overview",
    keywords: ["home", "dashboard", "overview", "analytics"],
  },
  {
    title: "Users",
    href: "/dashboard/users",
    description: "Manage Planora users and admins",
    keywords: ["users", "members", "accounts", "admins"],
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    description: "View and manage projects",
    keywords: ["projects", "portfolio", "planning"],
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    description: "Track tasks, blocked work, overdue work",
    keywords: ["tasks", "workload", "todo", "blocked", "overdue"],
  },
  {
    title: "Risk",
    href: "/dashboard/risk",
    description: "Risk records and delay prediction",
    keywords: ["risk", "delay", "prediction", "ai"],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    description: "Reports and productivity insights",
    keywords: ["reports", "insights", "productivity", "charts"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    description: "Admin dashboard settings and profile",
    keywords: ["settings", "preferences", "configuration", "profile"],
  },
];

const initialNotifications: AdminNotification[] = [
  {
    id: 1,
    title: "Admin overview synced",
    message: "Latest dashboard statistics were loaded successfully.",
    time: "Now",
    unread: true,
  },
  {
    id: 2,
    title: "Blocked tasks detected",
    message: "There are blocked tasks that may need admin review.",
    time: "Today",
    unread: true,
  },
  {
    id: 3,
    title: "Risk monitor active",
    message: "Planora risk checks are ready for project records.",
    time: "Today",
    unread: false,
  },
];

function getStoredToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("admin_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("planora_token")
  );
}

function loadSavedNotifications(): AdminNotification[] {
  if (typeof window === "undefined") {
    return initialNotifications;
  }

  const rawValue = localStorage.getItem(ADMIN_NOTIFICATIONS_STORAGE_KEY);

  if (!rawValue) {
    return initialNotifications;
  }

  try {
    const savedNotifications = JSON.parse(rawValue) as AdminNotification[];

    const savedById = new Map(
      savedNotifications.map((notification) => [notification.id, notification]),
    );

    return initialNotifications.map((notification) => {
      const savedNotification = savedById.get(notification.id);

      return {
        ...notification,
        unread: savedNotification?.unread ?? notification.unread,
      };
    });
  } catch {
    return initialNotifications;
  }
}

function saveNotifications(notifications: AdminNotification[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    ADMIN_NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notifications),
  );
}

export function AdminTopbar() {
  const router = useRouter();

  const searchRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [profileImageVersion, setProfileImageVersion] = useState(Date.now());

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [notificationsHydrated, setNotificationsHydrated] = useState(false);
  const [notifications, setNotifications] =
    useState<AdminNotification[]>(initialNotifications);

  const filteredSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return searchItems.slice(0, 5);
    }

    return searchItems.filter((item) => {
      const searchableText = [item.title, item.description, ...item.keywords]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchQuery]);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const adminName = getAdminDisplayName(adminUser);
  const adminEmail = adminUser?.email || "admin@planora.local";
  const adminInitials = getAdminInitials(adminUser);

  const profileImageBaseUrl = buildProfileImageUrl(adminUser?.profile_pic);
  const profileImageUrl =
    profileImageBaseUrl && !profileImageBaseUrl.startsWith("data:")
      ? `${profileImageBaseUrl}${
          profileImageBaseUrl.includes("?") ? "&" : "?"
        }v=${profileImageVersion}`
      : profileImageBaseUrl;

  const refreshCurrentAdmin = useCallback(async () => {
    const token = getStoredToken();

    if (!token) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) return;

      const currentUser = (await response.json()) as AdminUser;

      setAdminUser(currentUser);
      setProfileImageVersion(Date.now());
      saveAdminProfile(currentUser);
    } catch {
      // Keep current UI state if backend is unreachable.
    }
  }, []);

  useEffect(() => {
    setNotifications(loadSavedNotifications());
    setNotificationsHydrated(true);
  }, []);

  useEffect(() => {
    if (!notificationsHydrated) return;

    saveNotifications(notifications);
  }, [notifications, notificationsHydrated]);

  useEffect(() => {
    const savedAdmin = getSavedAdminProfile();

    if (savedAdmin) {
      setAdminUser(savedAdmin);
      setProfileImageVersion(Date.now());
    }

    void refreshCurrentAdmin();
  }, [refreshCurrentAdmin]);

  useEffect(() => {
    function handleAdminProfileUpdated(event: Event) {
      const customEvent = event as CustomEvent<AdminUser>;

      if (!customEvent.detail) return;

      setAdminUser(customEvent.detail);
      setProfileImageVersion(Date.now());
    }

    function handleStorageChange(event: StorageEvent) {
      if (event.key === "current_admin" && event.newValue) {
        try {
          const updatedAdmin = JSON.parse(event.newValue) as AdminUser;

          setAdminUser(updatedAdmin);
          setProfileImageVersion(Date.now());
        } catch {
          // Ignore bad localStorage values.
        }
      }

      if (event.key === ADMIN_NOTIFICATIONS_STORAGE_KEY && event.newValue) {
        try {
          const updatedNotifications = JSON.parse(
            event.newValue,
          ) as AdminNotification[];

          setNotifications(updatedNotifications);
        } catch {
          // Ignore bad localStorage values.
        }
      }
    }

    function handleWindowFocus() {
      void refreshCurrentAdmin();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshCurrentAdmin();
      }
    }

    window.addEventListener(
      ADMIN_PROFILE_UPDATED_EVENT,
      handleAdminProfileUpdated,
    );
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(
        ADMIN_PROFILE_UPDATED_EVENT,
        handleAdminProfileUpdated,
      );
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCurrentAdmin]);

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      const target = event.target as Node;

      if (!searchRef.current?.contains(target)) {
        setSearchOpen(false);
      }

      if (!notificationsRef.current?.contains(target)) {
        setNotificationsOpen(false);
      }

      if (!profileRef.current?.contains(target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function goToSearchResult(href: string) {
    setSearchQuery("");
    setSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    router.push(href);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && filteredSearchItems.length > 0) {
      goToSearchResult(filteredSearchItems[0].href);
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
    }
  }

  function markAllNotificationsRead() {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  }

  function markNotificationRead(notificationId: number) {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              unread: false,
            }
          : notification,
      ),
    );
  }

  function toggleNotifications(
    event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    setNotificationsOpen((current) => !current);
    setSearchOpen(false);
    setProfileOpen(false);
  }

  function toggleProfile(
    event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    setProfileOpen((current) => !current);
    setSearchOpen(false);
    setNotificationsOpen(false);
  }

  function handleLogout() {
    setSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);

    try {
      clearAdminToken();
    } catch {
      // Fallback cleanup below still runs.
    }

    const localStorageKeysToRemove = [
      "admin_token",
      "access_token",
      "token",
      "planora_token",
      "planora_admin_token",
      "current_admin",
      "admin_user",
      "current_user",
      "user",
      "planora_user",
    ];

    for (const key of localStorageKeysToRemove) {
      localStorage.removeItem(key);
    }

    const sessionStorageKeysToRemove = [
      "admin_token",
      "access_token",
      "token",
      "planora_token",
      "planora_admin_token",
    ];

    for (const key of sessionStorageKeysToRemove) {
      sessionStorage.removeItem(key);
    }

    const authCookiesToRemove = [
      "admin_token",
      "access_token",
      "token",
      "planora_token",
      "planora_admin_token",
    ];

    for (const cookieName of authCookiesToRemove) {
      document.cookie = `${cookieName}=; Max-Age=0; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }

    window.location.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-slate-800 bg-[#0b1120]/95 px-8 backdrop-blur-xl">
      <div>
        <p className="text-sm font-medium text-slate-400">Admin</p>
        <h1 className="text-xl font-bold text-white">Overview</h1>
      </div>

      <div ref={searchRef} className="relative w-full max-w-xl">
        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 transition focus-within:border-teal-400/50 focus-within:ring-2 focus-within:ring-teal-400/10">
          <Search size={20} className="text-slate-500" />

          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            onFocus={() => {
              setSearchOpen(true);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search dashboard..."
            className="h-full flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchOpen(false);
              }}
              className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {searchOpen && (
          <div className="absolute left-0 right-0 top-14 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30">
            <div className="border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Search results
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => goToSearchResult(item.href)}
                    className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-slate-900"
                  >
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.description}
                    </p>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm font-medium text-white">
                    No results found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try searching users, projects, tasks, risk, or reports.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/45 text-slate-400 transition hover:border-teal-400/40 hover:text-white"
            aria-label="Open notifications"
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-teal-400 ring-4 ring-[#0b1120]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-14 w-96 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                  <p className="text-xs text-slate-500">
                    {unreadCount} unread updates
                  </p>
                </div>

                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  disabled={unreadCount === 0}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-300 transition hover:bg-teal-400/10 disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:bg-transparent"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markNotificationRead(notification.id)}
                    className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-slate-900"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          notification.unread
                            ? "bg-teal-400/12 text-teal-300"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {notification.unread ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Clock3 size={16} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-white">
                            {notification.title}
                          </p>
                          <span className="shrink-0 text-xs text-slate-500">
                            {notification.time}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm font-medium text-slate-300">
          <ShieldCheck size={17} className="text-teal-300" />
          Protected
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={toggleProfile}
            className="flex h-12 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 px-2.5 pr-3 text-slate-300 transition hover:border-teal-400/40 hover:text-white"
            aria-label="Open admin profile"
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={adminName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-teal-400 to-emerald-500 text-sm font-bold text-slate-950">
                {adminInitials}
              </div>
            )}

            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30">
              <div className="border-b border-slate-800 p-4">
                <div className="flex items-center gap-3">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={adminName}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-teal-400 to-emerald-500 text-base font-bold text-slate-950">
                      {adminInitials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {adminName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {adminEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/dashboard/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                >
                  <UserCircle size={17} className="text-slate-500" />
                  Admin profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 text-sm font-medium text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}
