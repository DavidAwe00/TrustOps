import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Reports"
        description="Generate compliance reports and audit packets"
      />
      <PageContent>
        <div className="space-y-6">
          {/* Report types */}
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <Skeleton className="h-10 w-10 rounded-lg mb-4" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-4/5 mb-4" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>

          {/* Recent reports */}
          <div className="rounded-xl border bg-card p-6">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}









