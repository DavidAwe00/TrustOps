"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DashboardShell,
  PageHeader,
  PageContent,
} from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
  MessageSquare,
  Bot,
  Settings,
  Users,
  Shield,
  Link as LinkIcon,
  Download,
  Trash2,
  Eye,
  Edit,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Action type configuration
const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  "evidence.created": { icon: Upload, label: "Evidence Uploaded", color: "text-blue-500" },
  "evidence.approved": { icon: CheckCircle2, label: "Evidence Approved", color: "text-green-500" },
  "evidence.rejected": { icon: XCircle, label: "Evidence Rejected", color: "text-red-500" },
  "evidence.updated": { icon: Edit, label: "Evidence Updated", color: "text-yellow-500" },
  "evidence.deleted": { icon: Trash2, label: "Evidence Deleted", color: "text-red-500" },
  "comment.created": { icon: MessageSquare, label: "Comment Added", color: "text-purple-500" },
  "ai.gap_analysis": { icon: Bot, label: "Gap Analysis Run", color: "text-cyan-500" },
  "ai.policy_draft": { icon: FileText, label: "Policy Drafted", color: "text-cyan-500" },
  "ai.questionnaire_answer": { icon: MessageSquare, label: "Question Answered", color: "text-cyan-500" },
  "ai.approval.approved": { icon: CheckCircle2, label: "AI Action Approved", color: "text-green-500" },
  "ai.approval.rejected": { icon: XCircle, label: "AI Action Rejected", color: "text-red-500" },
  "integration.connected": { icon: LinkIcon, label: "Integration Connected", color: "text-blue-500" },
  "integration.synced": { icon: RefreshCw, label: "Integration Synced", color: "text-blue-500" },
  "export.created": { icon: Download, label: "Export Generated", color: "text-indigo-500" },
  "export.downloaded": { icon: Download, label: "Export Downloaded", color: "text-indigo-500" },
  "settings.updated": { icon: Settings, label: "Settings Updated", color: "text-gray-500" },
  "team.invited": { icon: Users, label: "Team Member Invited", color: "text-blue-500" },
  "team.removed": { icon: Users, label: "Team Member Removed", color: "text-red-500" },
  "control.linked": { icon: Shield, label: "Control Linked", color: "text-emerald-500" },
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/audit-logs?limit=100");
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Get unique action types for filter
  const actionTypes = [...new Set(logs.map((log) => log.action))];

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.targetType?.toLowerCase().includes(search.toLowerCase()) ||
      log.targetId?.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.metadata).toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || log.action === typeFilter;

    return matchesSearch && matchesType;
  });

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = format(new Date(log.createdAt), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, AuditLog[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return "Today";
    }
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    }
    return format(date, "MMMM d, yyyy");
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Activity Log"
        description="Complete audit trail of all actions in your organization"
      >
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <PageContent>
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action.includes("approved")).length}
                </p>
                <p className="text-sm text-muted-foreground">Approvals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <Bot className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action.startsWith("ai.")).length}
                </p>
                <p className="text-sm text-muted-foreground">AI Actions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Upload className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action === "evidence.created").length}
                </p>
                <p className="text-sm text-muted-foreground">Uploads</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {actionConfig[type]?.label || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity Timeline */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Activity className="h-12 w-12" />
              <p className="text-lg font-medium">No activity found</p>
              <p className="text-sm">Activity will appear here as you use the platform</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date}>
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                  {formatDate(date)}
                </h3>
                <div className="space-y-3">
                  {dateLogs.map((log, index) => {
                    const config = actionConfig[log.action] || {
                      icon: Activity,
                      label: log.action,
                      color: "text-gray-500",
                    };
                    const Icon = config.icon;

                    return (
                      <div
                        key={log.id}
                        className="group flex items-start gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/30 animate-fade-in"
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${config.color}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{config.label}</p>
                            {log.targetType && (
                              <Badge variant="outline" className="text-xs">
                                {log.targetType.replace("_", " ")}
                              </Badge>
                            )}
                          </div>
                          {log.targetId && (
                            <p className="mt-1 text-sm text-muted-foreground font-mono truncate">
                              ID: {log.targetId}
                            </p>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {String(value).slice(0, 30)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="mt-6 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} events
        </p>
      </PageContent>
    </DashboardShell>
  );
}




