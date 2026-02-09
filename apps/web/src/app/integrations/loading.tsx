import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function IntegrationsLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Integrations"
        description="Connect your tools to automatically collect compliance evidence"
      />
      <PageContent>
        <div className="space-y-6">
          {/* Connected section */}
          <div>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available section */}
          <div>
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                  <Skeleton className="mt-4 h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}









