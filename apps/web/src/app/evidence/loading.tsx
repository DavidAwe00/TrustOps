import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { SkeletonEvidence } from "@/components/ui/skeleton";

export default function EvidenceLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Evidence"
        description="Manage your compliance evidence"
      />
      <PageContent>
        <SkeletonEvidence />
      </PageContent>
    </DashboardShell>
  );
}









