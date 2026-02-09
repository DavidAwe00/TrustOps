import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { SkeletonChat, Skeleton } from "@/components/ui/skeleton";

export default function CopilotLoading() {
  return (
    <DashboardShell>
      <PageHeader
        title="AI Copilot"
        description="Get AI-powered assistance with gap analysis, policy drafting, and questionnaires"
      />
      <PageContent>
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Chat area */}
          <div className="flex-1 rounded-xl border bg-card">
            <SkeletonChat />
            <SkeletonChat />
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}









