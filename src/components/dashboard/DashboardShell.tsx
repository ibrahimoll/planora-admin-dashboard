"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function handleToggleSidebar() {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;

    if (isDesktop) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setMobileSidebarOpen((current) => !current);
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      <div className="flex min-h-screen">
        <Sidebar
          desktopOpen={desktopSidebarOpen}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onToggleSidebar={handleToggleSidebar}
            desktopSidebarOpen={desktopSidebarOpen}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}