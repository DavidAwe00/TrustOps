"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DEMO_CONTROLS, DEMO_FRAMEWORKS, type DemoEvidenceItem } from "@trustops/shared";
import {
  DashboardShell,
  PageHeader,
  PageContent,
} from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  Shield,
  Plus,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";

export default function ControlsPage() {
  const [search, setSearch] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedControl, setSelectedControl] = useState<typeof DEMO_CONTROLS[0] | null>(null);
  const [linkEvidenceOpen, setLinkEvidenceOpen] = useState(false);
  const [availableEvidence, setAvailableEvidence] = useState<DemoEvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Set<string>>(new Set());
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  // Fetch evidence when link dialog opens
  const fetchEvidence = useCallback(async () => {
    setLoadingEvidence(true);
    try {
      const response = await fetch("/api/evidence");
      const data = await response.json();
      setAvailableEvidence(data.items || []);
    } catch (error) {
      console.error("Failed to fetch evidence:", error);
    } finally {
      setLoadingEvidence(false);
    }
  }, []);

  useEffect(() => {
    if (linkEvidenceOpen) {
      fetchEvidence();
      // Pre-select already linked evidence
      const currentlyLinked = availableEvidence
        .filter((e) => e.controlIds?.includes(selectedControl?.id || ""))
        .map((e) => e.id);
      setSelectedEvidenceIds(new Set(currentlyLinked));
    }
  }, [linkEvidenceOpen, fetchEvidence, selectedControl]);

  const handleLinkEvidence = async () => {
    if (!selectedControl || selectedEvidenceIds.size === 0) return;

    setLinkingInProgress(true);
    try {
      // Link each selected evidence to this control
      const promises = Array.from(selectedEvidenceIds).map(async (evidenceId) => {
        const evidence = availableEvidence.find((e) => e.id === evidenceId);
        if (!evidence) return;

        // Add control to evidence's controlIds if not already there
        const currentControlIds = evidence.controlIds || [];
        if (!currentControlIds.includes(selectedControl.id)) {
          await fetch(`/api/evidence/${evidenceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              controlIds: [...currentControlIds, selectedControl.id],
            }),
          });
        }
      });

      await Promise.all(promises);
      toast.success(`Linked ${selectedEvidenceIds.size} evidence item(s) to ${selectedControl.code}`);
      setLinkEvidenceOpen(false);
      setSelectedEvidenceIds(new Set());
    } catch (error) {
      console.error("Failed to link evidence:", error);
      toast.error("Failed to link evidence");
    } finally {
      setLinkingInProgress(false);
    }
  };

  const toggleEvidenceSelection = (id: string) => {
    const newSet = new Set(selectedEvidenceIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEvidenceIds(newSet);
  };

  // Filter controls
  const filteredControls = DEMO_CONTROLS.filter((control) => {
    const matchesSearch =
      search === "" ||
      control.code.toLowerCase().includes(search.toLowerCase()) ||
      control.title.toLowerCase().includes(search.toLowerCase()) ||
      control.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFramework =
      frameworkFilter === "all" || control.frameworkKey === frameworkFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "covered" && control.evidenceCount > 0) ||
      (statusFilter === "uncovered" && control.evidenceCount === 0);

    return matchesSearch && matchesFramework && matchesStatus;
  });

  // Group controls by category
  const categories = [...new Set(DEMO_CONTROLS.map((c) => c.category))];

  // Stats
  const totalControls = DEMO_CONTROLS.length;
  const coveredControls = DEMO_CONTROLS.filter((c) => c.evidenceCount > 0).length;
  const uncoveredControls = totalControls - coveredControls;

  return (
    <DashboardShell>
      <PageHeader
        title="Controls"
        description={`${totalControls} controls across ${DEMO_FRAMEWORKS.length} frameworks`}
      />

      <PageContent>
        {/* Stats Bar */}
        <div className="mb-6 flex gap-4">
          <Card className="flex-1">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalControls}</p>
                <p className="text-sm text-muted-foreground">Total Controls</p>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coveredControls}</p>
                <p className="text-sm text-muted-foreground">Covered</p>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uncoveredControls}</p>
                <p className="text-sm text-muted-foreground">Uncovered</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search controls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              {DEMO_FRAMEWORKS.map((fw) => (
                <SelectItem key={fw.key} value={fw.key}>
                  {fw.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="covered">Covered</SelectItem>
              <SelectItem value="uncovered">Uncovered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Controls Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[140px]">Framework</TableHead>
                  <TableHead className="w-[140px]">Category</TableHead>
                  <TableHead className="w-[100px] text-center">Evidence</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredControls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Shield className="h-8 w-8" />
                        <p>No controls found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredControls.map((control, index) => {
                    const framework = DEMO_FRAMEWORKS.find(
                      (f) => f.key === control.frameworkKey
                    );
                    const isCovered = control.evidenceCount > 0;

                    return (
                      <TableRow
                        key={control.id}
                        className="animate-fade-in cursor-pointer hover:bg-muted/50"
                        style={{ animationDelay: `${index * 0.02}s` }}
                        onClick={() => setSelectedControl(control)}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {control.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{control.title}</p>
                            {control.description && (
                              <p className="line-clamp-1 text-sm text-muted-foreground">
                                {control.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {framework?.name || control.frameworkKey}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {control.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">
                              {control.evidenceCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {isCovered ? (
                            <Badge className="bg-success/10 text-success hover:bg-success/20">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Covered
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Gap
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="mt-4 text-sm text-muted-foreground">
          Showing {filteredControls.length} of {totalControls} controls
        </p>

        {/* Control Detail Dialog */}
        <Dialog open={!!selectedControl} onOpenChange={(open) => !open && setSelectedControl(null)}>
          <DialogContent className="max-w-2xl">
            {selectedControl && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {selectedControl.code}
                    </Badge>
                    {selectedControl.evidenceCount > 0 ? (
                      <Badge className="bg-success/10 text-success">Covered</Badge>
                    ) : (
                      <Badge variant="destructive">Gap</Badge>
                    )}
                  </div>
                  <DialogTitle className="text-xl">
                    {selectedControl.title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedControl.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Framework</p>
                      <p className="font-medium">
                        {DEMO_FRAMEWORKS.find((f) => f.key === selectedControl.frameworkKey)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{selectedControl.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Evidence Items</p>
                      <p className="font-medium">{selectedControl.evidenceCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {selectedControl.evidenceCount > 0 ? "Evidence Mapped" : "Needs Evidence"}
                      </p>
                    </div>
                  </div>
                  {selectedControl.guidance && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Implementation Guidance</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedControl.guidance}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setSelectedControl(null)}>
                      Close
                    </Button>
                    <Button onClick={() => setLinkEvidenceOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Link Evidence
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Link Evidence Dialog */}
        <Dialog open={linkEvidenceOpen} onOpenChange={setLinkEvidenceOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                Link Evidence to {selectedControl?.code}
              </DialogTitle>
              <DialogDescription>
                Select evidence items to map to this control. This helps demonstrate compliance coverage.
              </DialogDescription>
            </DialogHeader>
            
            {loadingEvidence ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableEvidence.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p>No evidence available</p>
                <p className="text-sm">Upload evidence first to link it to controls</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {availableEvidence.map((evidence) => {
                  const isSelected = selectedEvidenceIds.has(evidence.id);
                  const isAlreadyLinked = evidence.controlIds?.includes(selectedControl?.id || "");
                  
                  return (
                    <div
                      key={evidence.id}
                      onClick={() => toggleEvidenceSelection(evidence.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:border-primary/50 ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleEvidenceSelection(evidence.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{evidence.title}</p>
                          {isAlreadyLinked && (
                            <Badge variant="secondary" className="text-xs">
                              Already linked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {evidence.description || evidence.source}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          evidence.reviewStatus === "APPROVED"
                            ? "bg-success/10 text-success"
                            : evidence.reviewStatus === "REJECTED"
                            ? "bg-destructive/10 text-destructive"
                            : ""
                        }
                      >
                        {evidence.reviewStatus === "NEEDS_REVIEW" ? "Pending" : evidence.reviewStatus}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {selectedEvidenceIds.size} item{selectedEvidenceIds.size !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setLinkEvidenceOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkEvidence}
                  disabled={selectedEvidenceIds.size === 0 || linkingInProgress}
                >
                  {linkingInProgress ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="mr-2 h-4 w-4" />
                  )}
                  Link Evidence
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageContent>
    </DashboardShell>
  );
}
