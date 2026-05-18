"use client";

import { Bell, Blocks, LogOut, RadioTower, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/auth";

export function AdminTopbar() {
  const router = useRouter();

  function handleLogout() {
    clearAdminToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/35 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8 xl:px-10">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="hidden min-w-0 max-w-xl flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 shadow-inner shadow-black/30 transition focus-within:border-cyan-300/40 focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.1)] md:flex">
          <Search size={18} className="shrink-0 text-cyan-200" />
          <input
            className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Search neural assets, projects, risk signals..."
          />
          <span className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            OS
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 xl:flex">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
            System online
          </div>

          <button
            type="button"
            aria-label="Live system signal"
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:text-cyan-200 md:flex"
          >
            <RadioTower size={18} />
          </button>

          <button
            type="button"
            aria-label="Admin controls"
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-purple-300/25 hover:text-purple-200 sm:flex"
          >
            <Blocks size={18} />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:text-cyan-200"
          >
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border border-black bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
          </button>

          <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 text-right sm:flex">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                System Admin
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Operator
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
              <ShieldCheck size={17} />
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-3 text-sm font-semibold text-rose-100 shadow-lg shadow-rose-950/20 transition hover:-translate-y-0.5 hover:bg-rose-500/20 sm:px-4"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
