import { PlanoraLoader } from "@/components/ui/PlanoraLoader";

export default function DashboardLoading() {
  return (
    <PlanoraLoader
      label="Planora Admin Core"
      detail="Synchronizing dashboard intelligence..."
    />
  );
}
