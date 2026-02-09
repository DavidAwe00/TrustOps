import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { SkeletonDashboard } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Dashboard"
        description="Overview of your compliance posture"
      />
      <PageContent>
        <SkeletonDashboard />
      </PageContent>
    </DashboardShell>
  );
}









