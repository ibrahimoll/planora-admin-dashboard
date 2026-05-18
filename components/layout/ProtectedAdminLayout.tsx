"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  function toggleSidebar() {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;

    if (isDesktop) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setMobileSidebarOpen((current) => !current);
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d1a] text-white">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      <div className="flex min-h-screen">
        <AdminSidebar
          desktopOpen={desktopSidebarOpen}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            sidebarOpen={desktopSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}