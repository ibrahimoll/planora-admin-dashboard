"use client";

import { Bell, LogOut, Search, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/auth";

export function AdminTopbar() {
  const router = useRouter();

  function handleLogout() {
    clearAdminToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0b1120]/95 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">Admin</p>
          <h1 className="truncate text-lg font-semibold text-white">
            Project overview
          </h1>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-800 bg-[#111827] px-3 py-2.5 text-sm text-slate-400 md:flex lg:max-w-lg">
          <Search size={17} className="shrink-0 text-slate-500" />
          <input
            readOnly
            className="w-full min-w-0 bg-transparent text-slate-300 outline-none placeholder:text-slate-500"
            placeholder="Search is coming next"
            aria-label="Search is coming next"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">

          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#111827] text-slate-400 transition hover:border-teal-500/30 hover:text-white"
          >
            <Bell size={17} />
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-[#111827] px-3 py-2.5 text-sm text-slate-300 xl:flex">
            <ShieldCheck size={17} className="text-emerald-300" />
            Protected
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#111827] px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-rose-500/30 hover:text-rose-200"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
