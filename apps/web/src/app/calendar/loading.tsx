import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { SkeletonCalendar } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Compliance Calendar"
        description="Track audits, reviews, and compliance deadlines"
      />
      <PageContent>
        <SkeletonCalendar />
      </PageContent>
    </DashboardShell>
  );
}









