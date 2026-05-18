"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Binary,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  RadioTower,
  Users,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks },
  { label: "Risk Center", href: "/dashboard/risk", icon: AlertTriangle },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-white/10 bg-black/35 p-5 backdrop-blur-2xl lg:sticky lg:top-0 lg:block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/40">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.06),transparent)]" />
        <div className="pointer-events-none absolute -right-20 top-12 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-black/35 text-cyan-200 shadow-lg shadow-cyan-500/15">
              <Binary size={22} />
            </div>
            <div>
              <p className="text-2xl font-black uppercase leading-none tracking-[0.16em] text-cyan-300">
                Planora
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-slate-400">
                AI Command v2.4
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <RadioTower size={14} className="text-cyan-200" />
              Core online
            </span>
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
          </div>
        </div>

        <nav className="relative mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-sm font-medium transition duration-200 ${
                  active
                    ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-lg shadow-cyan-950/30"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.07] hover:text-cyan-100"
                }`}
              >
                <span
                  className={`absolute inset-y-2 left-0 w-1 rounded-r-full transition ${
                    active
                      ? "bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.8)]"
                      : "bg-transparent group-hover:bg-cyan-300/40"
                  }`}
                />
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                    active
                      ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
                      : "border-white/10 bg-black/25 text-slate-300 group-hover:text-cyan-200"
                  }`}
                >
                  <Icon size={18} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto space-y-4">
          <div className="rounded-3xl border border-purple-300/15 bg-purple-300/[0.07] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-purple-200">
              Intelligence Layer
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-300">
              Risk vectors, project sync, and admin activity are streaming.
            </p>
          </div>
          <button
            type="button"
            className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_42px_rgba(34,211,238,0.38)]"
          >
            <Zap size={17} className="transition group-hover:scale-110" />
            Initialize
          </button>
        </div>
      </div>
    </aside>
  );
}
