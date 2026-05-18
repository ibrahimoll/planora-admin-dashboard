"use client";

import Link from "next/link";
import { LogOut, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/auth";

export function AdminTopbar() {
  const router = useRouter();

  function handleLogout() {
    clearAdminToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b12]/95 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Planora admin
          </p>
          <h1 className="mt-1 truncate text-lg font-semibold text-white">
            Project operations dashboard
          </h1>
        </div>

        <Link
          href="/dashboard/users"
          className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/25 hover:text-cyan-100 md:flex"
        >
          <Users size={18} className="text-cyan-200" />
          Manage users
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <ShieldCheck size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin session</p>
              <p className="text-xs text-slate-500">Protected API access</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-3 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-500/20 sm:px-4"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
