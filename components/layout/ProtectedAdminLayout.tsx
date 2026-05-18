"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { PlanoraLoader } from "@/components/ui/PlanoraLoader";

type CurrentUser = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  is_active: boolean;
  is_email_verified: boolean;
};

export function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function verifyAdmin() {
      const token = getAdminToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get<CurrentUser>("/auth/me");

        if (response.data.role !== "admin") {
          clearAdminToken();
          router.push("/login");
          return;
        }

        setChecking(false);
      } catch {
        clearAdminToken();
        router.push("/login");
      }
    }

    verifyAdmin();
  }, [router]);

  if (checking) {
    return <PlanoraLoader />;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050712] text-white">
      <div className="fixed inset-0 bg-[linear-gradient(120deg,rgba(8,12,24,0.96),rgba(5,7,18,0.93)_46%,rgba(19,9,30,0.86))]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.2),transparent_29%),radial-gradient(circle_at_82%_18%,rgba(192,132,252,0.15),transparent_26%),radial-gradient(circle_at_52%_88%,rgba(14,165,233,0.1),transparent_32%)]" />
      <div className="planora-grid fixed inset-0 opacity-[0.12]" />
      <div className="fixed left-[18rem] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-cyan-300/18 to-transparent lg:block" />

      <div className="relative z-10 flex min-h-screen">
        <AdminSidebar />

        <section className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
