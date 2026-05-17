"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/auth";

export function AdminTopbar() {
  const router = useRouter();

  function handleLogout() {
    clearAdminToken();
    router.push("/login");
  }

  return (
    <header className="border-b border-white/10 bg-black/20 px-6 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden max-w-md flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 md:flex">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Search users, projects, tasks..."
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-slate-300 transition hover:text-cyan-200">
            <Bell size={18} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/20"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}