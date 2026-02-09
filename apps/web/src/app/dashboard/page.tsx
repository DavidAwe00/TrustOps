"use client";

import { useState, useEffect, useCallback } from "react";
import { DEMO_FRAMEWORKS, DEMO_CONTROLS } from "@trustops/shared";
import {
  DashboardShell,
  PageHeader,
  PageContent,
} from "@/components/dashboard-shell";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonStats } from "@/components/ui/skeleton";
import { EmptyActivity } from "@/components/ui/empty-state";
import {
  Shield,
  FileCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalControls: number;
  coveredControls: number;
  uncoveredControls: number;
  coveragePercent: number;
  totalEvidence: number;
  approvedEvidence: number;
  pendingEvidence: number;
  rejectedEvidence: number;
}

interface ActivityItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorEmail: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  "evidence.created": "Evidence uploaded",
  "evidence.approved": "Evidence approved",
  "evidence.rejected": "Evidence rejected",
  "evidence.updated": "Evidence updated",
  "evidence.deleted": "Evidence deleted",
};

const actionIcons: Record<string, typeof FileCheck> = {
  "evidence.created": FileCheck,
  "evidence.approved": CheckCircle2,
  "evidence.rejected": AlertTriangle,
  "evidence.updated": FileCheck,
  "evidence.deleted": AlertTriangle,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      setStats(data.stats);
      setActivity(data.recentActivity || []);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // Fall back to static demo data
      const totalControls = DEMO_CONTROLS.length;
      const coveredControls = DEMO_CONTROLS.filter((c) => c.evidenceCount > 0).length;
      setStats({
        totalControls,
        coveredControls,
        uncoveredControls: totalControls - coveredControls,
        coveragePercent: Math.round((coveredControls / totalControls) * 100),
        totalEvidence: 8,
        approvedEvidence: 6,
        pendingEvidence: 2,
        rejectedEvidence: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const coveragePercent = stats?.coveragePercent ?? 0;
  const coveredControls = stats?.coveredControls ?? 0;
  const totalControls = stats?.totalControls ?? DEMO_CONTROLS.length;
  const totalEvidence = stats?.totalEvidence ?? 0;
  const pendingReview = stats?.pendingEvidence ?? 0;
  const missingEvidence = stats?.uncoveredControls ?? 0;

  // Mock expiring soon (would come from real data)
  const expiringSoon = 3;

  return (
    <DashboardShell>
      <PageHeader
        title="Dashboard"
        description="Overview of your compliance posture"
      >
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button asChild>
          <Link href="/evidence">
            Upload Evidence
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <PageContent>
        {/* Stats Grid */}
        {isLoading && !stats ? (
          <SkeletonStats />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="animate-fade-in stagger-1">
              <StatsCard
                title="Control Coverage"
                value={`${coveragePercent}%`}
                subtitle={`${coveredControls} of ${totalControls} controls`}
                icon={Shield}
                variant="success"
              />
            </div>
            <div className="animate-fade-in stagger-2">
              <StatsCard
                title="Total Evidence"
                value={totalEvidence}
                subtitle={`${pendingReview} pending review`}
                icon={FileCheck}
              />
            </div>
            <div className="animate-fade-in stagger-3">
              <StatsCard
                title="Missing Evidence"
                value={missingEvidence}
                subtitle="Controls without evidence"
                icon={AlertTriangle}
                variant="warning"
              />
            </div>
            <div className="animate-fade-in stagger-4">
              <StatsCard
                title="Expiring Soon"
                value={expiringSoon}
                subtitle="Within 30 days"
                icon={Clock}
                variant="danger"
              />
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Framework Coverage */}
          <Card className="animate-fade-in stagger-5 lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Framework Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {DEMO_FRAMEWORKS.map((framework) => {
                const frameworkControls = DEMO_CONTROLS.filter(
                  (c) => c.frameworkKey === framework.key
                );
                const covered = frameworkControls.filter(
                  (c) => c.evidenceCount > 0
                ).length;
                const total = frameworkControls.length;
                const percent = total > 0 ? Math.round((covered / total) * 100) : 0;

                return (
                  <div key={framework.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{framework.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {framework.version}
                        </Badge>
                      </div>
                      <span className="font-mono text-muted-foreground">
                        {covered}/{total} controls
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={percent} className="h-2 flex-1" />
                      <span className="w-12 text-right text-sm font-semibold">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="animate-fade-in stagger-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.length === 0 ? (
                  <EmptyActivity />
                ) : (
                  activity.slice(0, 5).map((item) => {
                    const Icon = actionIcons[item.action] || FileCheck;
                    const label = actionLabels[item.action] || item.action;
                    const title = (item.metadata as { title?: string })?.title || item.targetId;

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{label}</p>
                          <p className="truncate text-muted-foreground">
                            {title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/controls" className="group">
              <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">View Controls</p>
                    <p className="text-sm text-muted-foreground">
                      {totalControls} controls across {DEMO_FRAMEWORKS.length} frameworks
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/evidence" className="group">
              <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <FileCheck className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Manage Evidence</p>
                    <p className="text-sm text-muted-foreground">
                      {totalEvidence} items • {pendingReview} pending
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/integrations" className="group">
              <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                    <TrendingUp className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Connect Integrations</p>
                    <p className="text-sm text-muted-foreground">
                      GitHub, AWS, and more
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}
