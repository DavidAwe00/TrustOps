import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function ExportsLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Exports"
        description="Generate and download audit packets for your compliance frameworks"
      />
      <PageContent>
        <div className="space-y-6">
          {/* Framework cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card p-6 flex items-center gap-4"
              >
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>

          {/* Export history */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <SkeletonTable rows={4} />
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}









