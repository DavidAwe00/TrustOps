"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DEMO_CONTROLS, type DemoEvidenceItem } from "@trustops/shared";
import {
  DashboardShell,
  PageHeader,
  PageContent,
} from "@/components/dashboard-shell";
import { EvidenceUploadDialog } from "@/components/evidence-upload-dialog";
import { EvidenceComments } from "@/components/evidence-comments";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Upload,
  FileText,
  Github,
  Cloud,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Link as LinkIcon,
  Shield,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Trash2,
  SquareCheck,
} from "lucide-react";

const sourceIcons = {
  MANUAL: FileText,
  GITHUB: Github,
  AWS: Cloud,
  AI: Shield,
};

const sourceLabels = {
  MANUAL: "Manual Upload",
  GITHUB: "GitHub",
  AWS: "AWS",
  AI: "AI Generated",
};

const statusConfig = {
  NEEDS_REVIEW: {
    label: "Needs Review",
    icon: Clock,
    className: "bg-warning/10 text-warning-foreground",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
};

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<DemoEvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvidence, setSelectedEvidence] = useState<DemoEvidenceItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchEvidence = useCallback(async () => {
    try {
      const response = await fetch("/api/evidence");
      const data = await response.json();
      setEvidence(data.items);
    } catch (error) {
      console.error("Failed to fetch evidence:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/evidence/${id}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Evidence approved", {
          description: "The evidence item has been marked as approved.",
        });
        await fetchEvidence();
        if (selectedEvidence?.id === id) {
          const data = await response.json();
          setSelectedEvidence(data.item);
        }
      } else {
        toast.error("Failed to approve evidence");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve evidence");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/evidence/${id}/reject`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Evidence rejected", {
          description: "The evidence item has been marked as rejected.",
        });
        await fetchEvidence();
        if (selectedEvidence?.id === id) {
          const data = await response.json();
          setSelectedEvidence(data.item);
        }
      } else {
        toast.error("Failed to reject evidence");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject evidence");
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredEvidence.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvidence.map((e) => e.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk action handlers
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/evidence/${id}/approve`, { method: "POST" })
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} items approved`, {
        description: "Selected evidence items have been approved.",
      });
      clearSelection();
      await fetchEvidence();
    } catch (error) {
      console.error("Bulk approve failed:", error);
      toast.error("Failed to approve some items");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/evidence/${id}/reject`, { method: "POST" })
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} items rejected`, {
        description: "Selected evidence items have been rejected.",
      });
      clearSelection();
      await fetchEvidence();
    } catch (error) {
      console.error("Bulk reject failed:", error);
      toast.error("Failed to reject some items");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} evidence items? This cannot be undone.`)) return;
    
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/evidence/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} items deleted`, {
        description: "Selected evidence items have been removed.",
      });
      clearSelection();
      await fetchEvidence();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete some items");
    } finally {
      setBulkLoading(false);
    }
  };

  // Filter evidence
  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());

    const matchesSource =
      sourceFilter === "all" || item.source === sourceFilter;

    let matchesStatus = statusFilter === "all" || item.reviewStatus === statusFilter;
    
    // Special handling for EXPIRING filter
    if (statusFilter === "EXPIRING") {
      if (!item.expiresAt) {
        matchesStatus = false;
      } else {
        const expiresAt = new Date(item.expiresAt);
        matchesStatus = expiresAt <= thirtyDaysFromNow && expiresAt > now;
      }
    }

    return matchesSearch && matchesSource && matchesStatus;
  });

  // Stats
  const totalEvidence = evidence.length;
  const approvedCount = evidence.filter((e) => e.reviewStatus === "APPROVED").length;
  const pendingCount = evidence.filter((e) => e.reviewStatus === "NEEDS_REVIEW").length;
  const rejectedCount = evidence.filter((e) => e.reviewStatus === "REJECTED").length;
  
  // Expiring soon (within 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCount = evidence.filter((e) => {
    if (!e.expiresAt) return false;
    const expiresAt = new Date(e.expiresAt);
    return expiresAt <= thirtyDaysFromNow && expiresAt > now;
  }).length;

  return (
    <DashboardShell>
      <PageHeader
        title="Evidence"
        description={`${totalEvidence} evidence items collected`}
      >
        <Button variant="outline" size="sm" onClick={fetchEvidence} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Evidence
        </Button>
      </PageHeader>

      <PageContent>
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEvidence}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className={expiringCount > 0 ? "border-orange-200 bg-orange-50/50" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringCount}</p>
                <p className="text-sm text-muted-foreground">Expiring</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search evidence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="MANUAL">Manual Upload</SelectItem>
              <SelectItem value="GITHUB">GitHub</SelectItem>
              <SelectItem value="AWS">AWS</SelectItem>
              <SelectItem value="AI">AI Generated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EXPIRING">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.size === filteredEvidence.length}
                onCheckedChange={selectAll}
              />
              <span className="font-medium">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkLoading}
              >
                {bulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReject}
                disabled={bulkLoading}
              >
                {bulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkLoading}
              >
                {bulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Select All Toggle */}
        {filteredEvidence.length > 0 && selectedIds.size === 0 && (
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              <SquareCheck className="mr-2 h-4 w-4" />
              Select all
            </Button>
          </div>
        )}

        {/* Evidence Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvidence.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <FileText className="h-12 w-12" />
                  <p className="text-lg font-medium">No evidence found</p>
                  <p className="text-sm">Try adjusting your filters or upload new evidence</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvidence.map((item, index) => {
                const SourceIcon = sourceIcons[item.source as keyof typeof sourceIcons] || FileText;
                const status = statusConfig[item.reviewStatus as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                const mappedControls = DEMO_CONTROLS.filter((c) =>
                  item.controlIds?.includes(c.id)
                );
                const isSelected = selectedIds.has(item.id);

                return (
                  <Card
                    key={item.id}
                    className={`group animate-fade-in cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                      isSelected ? "border-primary bg-primary/5" : ""
                    }`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                    onClick={() => setSelectedEvidence(item)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(item.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-muted/80"
                          >
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : (
                              <SourceIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {sourceLabels[item.source as keyof typeof sourceLabels]}
                          </Badge>
                        </div>
                        <Badge className={status.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 line-clamp-2 text-base">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {item.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.collectedAt).toLocaleDateString()}</span>
                        </div>
                        {mappedControls.length > 0 && (
                          <div className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            <span>{mappedControls.length} control{mappedControls.length !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Results count */}
        <p className="mt-4 text-sm text-muted-foreground">
          Showing {filteredEvidence.length} of {totalEvidence} evidence items
        </p>

        {/* Evidence Detail Dialog */}
        <Dialog open={!!selectedEvidence} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
          <DialogContent className="max-w-2xl">
            {selectedEvidence && (() => {
              const SourceIcon = sourceIcons[selectedEvidence.source as keyof typeof sourceIcons] || FileText;
              const status = statusConfig[selectedEvidence.reviewStatus as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              const mappedControls = DEMO_CONTROLS.filter((c) =>
                selectedEvidence.controlIds?.includes(c.id)
              );

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <SourceIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-1">
                          {sourceLabels[selectedEvidence.source as keyof typeof sourceLabels]}
                        </Badge>
                        <DialogTitle className="text-xl">
                          {selectedEvidence.title}
                        </DialogTitle>
                      </div>
                      <Badge className={status.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <DialogDescription>
                      {selectedEvidence.description}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Collected</p>
                        <p className="font-medium">
                          {new Date(selectedEvidence.collectedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expires</p>
                        <p className="font-medium">
                          {selectedEvidence.expiresAt
                            ? new Date(selectedEvidence.expiresAt).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Source</p>
                        <p className="font-medium">
                          {sourceLabels[selectedEvidence.source as keyof typeof sourceLabels]}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">External ID</p>
                        <p className="font-mono text-sm">
                          {selectedEvidence.externalId || "—"}
                        </p>
                      </div>
                    </div>

                    {selectedEvidence.summary && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Summary</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvidence.summary}
                        </p>
                      </div>
                    )}

                    {mappedControls.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Mapped Controls</p>
                        <div className="flex flex-wrap gap-2">
                          {mappedControls.map((control) => (
                            <Badge key={control.id} variant="secondary">
                              {control.code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments Section */}
                    <EvidenceComments evidenceId={selectedEvidence.id} />

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setSelectedEvidence(null)}>
                        Close
                      </Button>
                      {selectedEvidence.reviewStatus === "NEEDS_REVIEW" && (
                        <>
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(selectedEvidence.id)}
                            disabled={actionLoading === selectedEvidence.id}
                          >
                            {actionLoading === selectedEvidence.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Reject
                          </Button>
                          <Button
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleApprove(selectedEvidence.id)}
                            disabled={actionLoading === selectedEvidence.id}
                          >
                            {actionLoading === selectedEvidence.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <EvidenceUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSuccess={fetchEvidence}
        />
      </PageContent>
    </DashboardShell>
  );
}
