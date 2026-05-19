"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { api } from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/auth";

type CurrentUser = {
  role: "user" | "admin";
  is_active?: boolean;
  is_email_verified?: boolean;
};

function isActiveAdmin(user: CurrentUser) {
  return (
    user.role === "admin" &&
    user.is_active !== false &&
    user.is_email_verified !== false
  );
}

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
    let isMounted = true;

    async function checkAdminAccess() {
      const token = getAdminToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await api.get<CurrentUser>("/auth/me");

        if (!isActiveAdmin(response.data)) {
          clearAdminToken();
          router.replace("/login");
          return;
        }

        if (isMounted) {
          setCheckingAuth(false);
        }
      } catch {
        clearAdminToken();
        router.replace("/login");
      }
    }

    checkAdminAccess();

    return () => {
      isMounted = false;
    };
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
    <div className="h-screen overflow-hidden bg-[#080d1a] text-white">
      <div className="flex h-full min-h-0">
        <AdminSidebar
          desktopOpen={desktopSidebarOpen}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AdminTopbar
            sidebarOpen={desktopSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="dashboard-scale px-4 py-5 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}