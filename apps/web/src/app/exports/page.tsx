"use client";

import { useState, useEffect, useCallback } from "react";
import { DEMO_FRAMEWORKS } from "@trustops/shared";
import {
  DashboardShell,
  PageHeader,
  PageContent,
} from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Download,
  FileArchive,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  RefreshCw,
  Trash2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface AuditExport {
  id: string;
  name: string;
  frameworkKey: string;
  status: string;
  filename?: string;
  sizeBytes?: number;
  controlCount: number;
  evidenceCount: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
  PROCESSING: { label: "Processing", icon: Loader2, className: "bg-primary/10 text-primary" },
  COMPLETED: { label: "Ready", icon: CheckCircle2, className: "bg-success/10 text-success" },
  FAILED: { label: "Failed", icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportsPage() {
  const [exports, setExports] = useState<AuditExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchExports = useCallback(async () => {
    try {
      const response = await fetch("/api/exports");
      const data = await response.json();
      setExports(data.exports || []);
    } catch (error) {
      console.error("Failed to fetch exports:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExports();
  }, [fetchExports]);

  const handleExport = async () => {
    if (!selectedFramework) return;

    setIsExporting(true);
    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameworkKey: selectedFramework }),
      });

      if (response.ok) {
        await fetchExports();
        setExportDialogOpen(false);
        setSelectedFramework("");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to generate export");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to generate export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async (exportItem: AuditExport) => {
    if (exportItem.status !== "COMPLETED") return;

    setDownloadingId(exportItem.id);
    try {
      const response = await fetch(`/api/exports/${exportItem.id}/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportItem.filename || `${exportItem.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download export");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this export?")) return;

    try {
      const response = await fetch(`/api/exports/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchExports();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Exports"
        description="Generate and download audit packets for your compliance frameworks"
      >
        <Button variant="outline" size="sm" onClick={fetchExports} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button onClick={() => setExportDialogOpen(true)}>
          <FileArchive className="mr-2 h-4 w-4" />
          New Export
        </Button>
      </PageHeader>

      <PageContent>
        {/* Quick Export Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {DEMO_FRAMEWORKS.map((framework, index) => (
            <Card
              key={framework.key}
              className="animate-fade-in cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => {
                setSelectedFramework(framework.key);
                setExportDialogOpen(true);
              }}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{framework.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {framework.version} • Generate audit packet
                  </p>
                </div>
                <Download className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export History</CardTitle>
            <CardDescription>
              Previously generated audit packets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Export Name</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Controls</TableHead>
                  <TableHead className="text-center">Evidence</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : exports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileArchive className="h-8 w-8" />
                        <p>No exports yet</p>
                        <p className="text-sm">Generate your first audit packet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  exports.map((exportItem, index) => {
                    const status = statusConfig[exportItem.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    const StatusIcon = status.icon;
                    const isDownloading = downloadingId === exportItem.id;

                    return (
                      <TableRow
                        key={exportItem.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileArchive className="h-4 w-4 text-muted-foreground" />
                            <span className="max-w-[200px] truncate">{exportItem.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exportItem.frameworkKey}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(exportItem.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {exportItem.controlCount}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {exportItem.evidenceCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(exportItem.sizeBytes)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={status.className}>
                            <StatusIcon className={`mr-1 h-3 w-3 ${exportItem.status === "PROCESSING" ? "animate-spin" : ""}`} />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {exportItem.status === "COMPLETED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(exportItem)}
                                disabled={isDownloading}
                              >
                                {isDownloading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {exportItem.status === "FAILED" && exportItem.error && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title={exportItem.error}
                              >
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(exportItem.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Audit Packet</DialogTitle>
              <DialogDescription>
                Create a ZIP file containing all controls, evidence, and documentation organized by your selected framework.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Framework
                </label>
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_FRAMEWORKS.map((fw) => (
                      <SelectItem key={fw.key} value={fw.key}>
                        {fw.name} ({fw.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium">Export will include:</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• All controls with current status</li>
                  <li>• Mapped evidence files and documents</li>
                  <li>• Control-evidence mapping matrix</li>
                  <li>• JSON manifest for programmatic access</li>
                  <li>• README with summary statistics</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExport} disabled={!selectedFramework || isExporting}>
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileArchive className="mr-2 h-4 w-4" />
                      Generate Export
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageContent>
    </DashboardShell>
  );
}
