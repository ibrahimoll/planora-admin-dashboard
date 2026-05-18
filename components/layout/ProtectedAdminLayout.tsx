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
    <main className="min-h-screen overflow-x-hidden bg-[#0b1120] text-white">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <section className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
