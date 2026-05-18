"use client";

import {
  AlertTriangle,
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, ready: true },
  { label: "Users", href: "/dashboard/users", icon: Users, ready: true },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    ready: true,
  },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks, ready: false },
  {
    label: "Risk",
    href: "/dashboard/risk",
    icon: AlertTriangle,
    ready: false,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    ready: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-800 bg-[#0f172a] px-4 py-5 lg:block">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-slate-950">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xl font-semibold text-white">Planora</p>
            <p className="text-sm text-slate-400">Admin dashboard</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            if (!item.ready) {
              return (
                <div
                  key={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500"
                  aria-disabled="true"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px]">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-teal-500/12 text-teal-100 ring-1 ring-teal-500/20"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={active ? "text-teal-300" : "text-slate-500"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <p className="text-sm font-medium text-white">System status</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Protected routes active
          </div>
        </div>
      </div>
    </aside>
  );
}
