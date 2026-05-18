"use client";

import { Menu, Search } from "lucide-react";

export default function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-950 sm:text-lg">
            Dashboard
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Monitor Planora users, projects, tasks, and system activity.
          </p>
        </div>

        <div className="hidden w-full max-w-xs items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
          A
        </div>
      </div>
    </header>
  );
}