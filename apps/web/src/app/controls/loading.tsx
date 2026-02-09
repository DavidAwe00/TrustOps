import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { SkeletonControls } from "@/components/ui/skeleton";

export default function ControlsLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Controls"
        description="Manage compliance controls across frameworks"
      />
      <PageContent>
        <SkeletonControls />
      </PageContent>
    </DashboardShell>
  );
}









