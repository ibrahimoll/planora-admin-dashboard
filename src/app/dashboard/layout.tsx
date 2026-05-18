import ProtectedAdminLayout from "../../../components/layout/ProtectedAdminLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedAdminLayout>{children}</ProtectedAdminLayout>;
}