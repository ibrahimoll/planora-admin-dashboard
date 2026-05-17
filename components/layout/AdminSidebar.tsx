"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Users,
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
    <aside className="hidden w-72 border-r border-white/10 bg-black/20 p-5 backdrop-blur-xl lg:block">
      <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-lg shadow-cyan-500/10">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
          Planora
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">Admin Ops</h2>
        <p className="mt-2 text-xs text-slate-400">
          AI command center
        </p>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                active
                  ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                  : "text-slate-300 hover:bg-white/10 hover:text-cyan-200"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}