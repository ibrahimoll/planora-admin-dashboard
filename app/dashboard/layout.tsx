import { ReactNode } from "react";
import { ProtectedAdminLayout } from "@/components/layout/ProtectedAdminLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ProtectedAdminLayout>{children}</ProtectedAdminLayout>;
}