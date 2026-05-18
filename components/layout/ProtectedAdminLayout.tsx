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
    <main className="h-screen overflow-hidden bg-[#0b1120] text-white">
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />

        <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopbar />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="dashboard-scale px-4 py-5 sm:px-5 lg:px-6 xl:px-8">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}