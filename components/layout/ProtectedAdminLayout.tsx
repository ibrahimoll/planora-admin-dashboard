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
    return (
      <PlanoraLoader
        label="Planora Admin Core"
        detail="Verifying admin access..."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#050712] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_28%)]" />

      <div className="relative z-10 flex min-h-screen">
        <AdminSidebar />

        <section className="flex min-h-screen flex-1 flex-col">
          <AdminTopbar />
          <div className="flex-1 px-6 py-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
