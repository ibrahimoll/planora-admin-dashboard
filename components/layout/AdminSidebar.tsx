"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckSquare,
  FolderKanban,
  Grid2X2,
  Inbox,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import PlanoraLogo from "../PlanoraLogo";

type AdminSidebarProps = {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Grid2X2,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    label: "Risk",
    href: "/dashboard/risk",
    icon: AlertTriangle,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "Report Requests",
    href: "/dashboard/report-requests",
    icon: Inbox,
  },
  {
    label: "Send Report",
    href: "/dashboard/send-report",
    icon: Send,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "Admin Logs",
    href: "/dashboard/admin-logs",
    icon: ScrollText,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({
  desktopOpen,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={[
          "z-50 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-[#1d2942] bg-[#0d1424] transition-[width] duration-200 ease-out lg:flex",
          desktopOpen ? "w-[248px]" : "w-[78px]",
        ].join(" ")}
      >
        <SidebarContent
          pathname={pathname}
          expanded={desktopOpen}
          mobile={false}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <aside className="relative flex h-full w-[84%] max-w-[290px] animate-[planoraSidebarIn_160ms_ease-out] flex-col overflow-hidden border-r border-[#1d2942] bg-[#0d1424] shadow-2xl">
            <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#1d2942] px-5">
              <PlanoraLogo />

              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1d2942] text-[#8ea3c7] transition hover:border-[#20d6c7]/60 hover:text-[#20d6c7]"
              >
                <X size={20} />
              </button>
            </div>

            <SidebarContent
              pathname={pathname}
              expanded
              onNavigate={onCloseMobile}
              mobile
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent({
  pathname,
  expanded,
  onNavigate,
  mobile = false,
}: {
  pathname: string;
  expanded: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  return (
    <>
      {!mobile ? (
        <div
          className={[
            "flex h-[88px] shrink-0 items-center border-b border-[#1d2942]",
            expanded ? "px-5" : "justify-center px-3",
          ].join(" ")}
        >
          <PlanoraLogo compact={!expanded} />
        </div>
      ) : null}

      <nav className="sidebar-nav-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={!expanded ? item.label : undefined}
              className={[
                "group relative flex min-h-12 items-center rounded-2xl text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out",
                expanded ? "gap-3 px-4 py-3" : "justify-center px-0 py-3",
                active
                  ? "bg-[#08313c] text-white shadow-[inset_0_0_0_1px_rgba(32,214,199,0.16)]"
                  : "text-[#a9bad7] hover:bg-[#111d31] hover:text-white",
              ].join(" ")}
            >
              <span className="relative z-10 flex h-8 w-8 items-center justify-center transition-transform duration-150 group-hover:scale-105">
                <Icon
                  size={20}
                  className={[
                    "transition-colors duration-150",
                    active
                      ? "text-[#20d6c7]"
                      : "text-[#7182a5] group-hover:text-[#20d6c7]",
                  ].join(" ")}
                />
              </span>

              {expanded ? (
                <span className="relative z-10 truncate transition-opacity duration-150">
                  {item.label}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[#1d2942] p-3">
        <div
          className={[
            "rounded-2xl border border-emerald-400/15 bg-emerald-400/10",
            expanded ? "p-4" : "p-3",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center",
              expanded ? "gap-3" : "justify-center",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <ShieldCheck size={18} />
            </span>

            {expanded ? (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  System status
                </p>
                <p className="mt-1 truncate text-sm text-[#a9bad7]">
                  Protected routes active
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
