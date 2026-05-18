"use client";

import { Bell, LogOut, Menu, PanelLeftClose, Search, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Topbar({
  onToggleSidebar,
  desktopSidebarOpen,
}: {
  onToggleSidebar: () => void;
  desktopSidebarOpen: boolean;
}) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#1d2942] bg-[#080d1a]/95 backdrop-blur-xl">
      <div className="flex min-h-[92px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#1d2942] bg-[#0d1424] text-[#8ea3c7] transition hover:border-[#22d3c5]/50 hover:bg-[#0f1b2f] hover:text-[#22d3c5]"
        >
          {desktopSidebarOpen ? <PanelLeftClose size={22} /> : <Menu size={22} />}
        </button>

        <div className="hidden min-w-0 flex-1 md:block">
          <div className="relative max-w-3xl">
            <Search
              size={22}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              type="search"
              placeholder="Search dashboard..."
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-14 pr-5 text-sm text-white outline-none transition placeholder:text-[#7182a5] focus:border-[#22d3c5]/60 focus:ring-2 focus:ring-[#22d3c5]/10"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-[#1d2942] bg-[#0d1424] text-[#8ea3c7] transition hover:border-[#22d3c5]/50 hover:text-[#22d3c5] sm:flex"
          >
            <Bell size={20} />
          </button>

          <div className="hidden h-12 items-center gap-3 rounded-2xl border border-[#1d2942] bg-[#0d1424] px-4 text-sm font-bold text-[#d8e2f5] md:flex">
            <Shield size={18} className="text-[#22d3c5]" />
            Protected
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22d3c5] text-sm font-black text-[#06111f]">
            PA
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden h-12 items-center gap-2 rounded-2xl border border-[#1d2942] bg-[#0d1424] px-5 text-sm font-bold text-[#d8e2f5] transition hover:border-red-400/40 hover:text-red-300 sm:flex"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}