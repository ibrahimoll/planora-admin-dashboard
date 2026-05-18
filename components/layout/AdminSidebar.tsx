"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, ready: true },
  { label: "Users", href: "/dashboard/users", icon: Users, ready: true },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    ready: false,
  },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks, ready: false },
  {
    label: "Risk",
    href: "/dashboard/risk",
    icon: AlertTriangle,
    ready: false,
  },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, ready: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#090d14] p-4 lg:sticky lg:top-0 lg:block">
      <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0d131d] p-4 shadow-xl shadow-black/20">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-[0.14em] text-cyan-300">
                Planora
              </p>
              <p className="text-xs text-slate-400">Admin dashboard</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 space-y-1.5">
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
                  className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-slate-500"
                  aria-disabled="true"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                      <Icon size={17} />
                    </span>
                    {item.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em]">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    active
                      ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
                      : "border-white/10 bg-white/[0.03] text-slate-400"
                  }`}
                >
                  <Icon size={17} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            System status
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">Admin API protected</span>
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
          </div>
        </div>
      </div>
    </aside>
  );
}
