import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="Settings"
        description="Manage your account and organization settings"
      />
      <PageContent>
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))}
          </div>

          {/* Settings sections */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-9 w-32 rounded-md" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <Skeleton className="h-5 w-28 mb-4" />
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}









