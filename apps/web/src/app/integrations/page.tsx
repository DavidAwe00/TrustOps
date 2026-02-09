"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DashboardShell,
  PageHeader,
  PageContent,
} from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Github,
  Cloud,
  Plug,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Settings,
  RefreshCw,
  Loader2,
  XCircle,
  Clock,
} from "lucide-react";

interface Integration {
  id: string;
  provider: string;
  name: string;
  status: string;
  config: Record<string, unknown>;
  lastSyncAt?: string;
  lastError?: string;
}

const providerConfig = {
  GITHUB: {
    icon: Github,
    description: "Connect your GitHub organization to automatically collect repository settings, branch protections, and Dependabot status.",
    category: "Source Control",
    fields: [
      { name: "org", label: "Organization", placeholder: "acme-corp", required: true },
      { name: "accessToken", label: "Personal Access Token", placeholder: "ghp_...", type: "password" },
    ],
  },
  AWS: {
    icon: Cloud,
    description: "Connect your AWS account via AssumeRole to collect CloudTrail, GuardDuty, Security Hub, and IAM policy evidence.",
    category: "Cloud Infrastructure",
    fields: [
      { name: "roleArn", label: "Role ARN", placeholder: "arn:aws:iam::123456789012:role/TrustOps", required: true },
      { name: "externalId", label: "External ID", placeholder: "trustops-external-id" },
      { name: "accountId", label: "Account ID", placeholder: "123456789012" },
      { name: "region", label: "Region", placeholder: "us-east-1" },
    ],
  },
};

const statusConfig = {
  CONNECTED: { label: "Connected", icon: CheckCircle2, className: "bg-success/10 text-success" },
  DISCONNECTED: { label: "Not Connected", icon: AlertCircle, className: "bg-muted text-muted-foreground" },
  SYNCING: { label: "Syncing...", icon: Loader2, className: "bg-primary/10 text-primary" },
  ERROR: { label: "Error", icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; evidenceCreated: number } | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations");
      const data = await response.json();
      setIntegrations(data.integrations);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleConnect = async () => {
    if (!connectDialog) return;

    setIsConnecting(true);
    try {
      const response = await fetch(`/api/integrations/${connectDialog.id}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchIntegrations();
        setConnectDialog(null);
        setFormData({});
      } else {
        const data = await response.json();
        alert(data.error || "Failed to connect");
      }
    } catch (error) {
      console.error("Connect error:", error);
      alert("Failed to connect integration");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) return;

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchIntegrations();
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const handleSync = async (id: string) => {
    setIsSyncing(id);
    setSyncResult(null);

    try {
      const response = await fetch(`/api/integrations/${id}/sync`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        setSyncResult({ success: data.success, evidenceCreated: data.evidenceCreated });
        await fetchIntegrations();
      } else {
        alert(data.error || "Sync failed");
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Sync failed");
    } finally {
      setIsSyncing(null);
    }
  };

  const openConnectDialog = (integration: Integration) => {
    setConnectDialog(integration);
    setFormData({});
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Integrations"
        description="Connect your tools to automatically collect compliance evidence"
      >
        <Button variant="outline" size="sm" onClick={fetchIntegrations} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </PageHeader>

      <PageContent>
        {/* Sync Result Toast */}
        {syncResult && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border bg-card p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div className="flex-1">
              <p className="font-medium">Sync completed successfully</p>
              <p className="text-sm text-muted-foreground">
                Created {syncResult.evidenceCreated} new evidence items
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSyncResult(null)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Integration Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {isLoading ? (
            <div className="col-span-full flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            integrations.map((integration, index) => {
              const config = providerConfig[integration.provider as keyof typeof providerConfig];
              const status = statusConfig[integration.status as keyof typeof statusConfig] || statusConfig.DISCONNECTED;
              const Icon = config?.icon || Plug;
              const StatusIcon = status.icon;
              const isConnected = integration.status === "CONNECTED" || integration.status === "ERROR";
              const isSyncingThis = isSyncing === integration.id || integration.status === "SYNCING";

              return (
                <Card
                  key={integration.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                          <Icon className="h-6 w-6 text-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {config?.category || "Integration"}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={status.className}>
                        <StatusIcon className={`mr-1 h-3 w-3 ${isSyncingThis ? "animate-spin" : ""}`} />
                        {status.label}
                      </Badge>
                    </div>
                    <CardDescription className="mt-3">
                      {config?.description || "Connect this integration to collect evidence."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Last Sync Info */}
                    {integration.lastSyncAt && (
                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                      </div>
                    )}

                    {/* Error Message */}
                    {integration.lastError && (
                      <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mr-2 inline h-4 w-4" />
                        {integration.lastError}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {isConnected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(integration.id)}
                            disabled={isSyncingThis}
                          >
                            {isSyncingThis ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {isSyncingThis ? "Syncing..." : "Sync Now"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConnectDialog(integration)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => openConnectDialog(integration)}>
                          <Plug className="mr-2 h-4 w-4" />
                          Connect
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Coming Soon */}
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-muted-foreground">Coming Soon</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {["Google Workspace", "Okta", "Jira"].map((name) => (
              <Card key={name} className="opacity-60">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Plug className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">Coming soon</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Connect Dialog */}
        <Dialog open={!!connectDialog} onOpenChange={(open) => !open && setConnectDialog(null)}>
          <DialogContent className="max-w-md">
            {connectDialog && (() => {
              const config = providerConfig[connectDialog.provider as keyof typeof providerConfig];
              const Icon = config?.icon || Plug;

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle>Connect {connectDialog.name}</DialogTitle>
                        <DialogDescription>
                          Enter your credentials to connect
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4">
                    {config?.fields.map((field) => (
                      <div key={field.name}>
                        <label className="mb-2 block text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-destructive"> *</span>}
                        </label>
                        <Input
                          type={"type" in field ? field.type : "text"}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }
                        />
                      </div>
                    ))}

                    {/* Demo Mode Notice */}
                    <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                      <p className="font-medium">Demo Mode</p>
                      <p>In demo mode, mock data will be used for the collector. Enter any value to connect.</p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setConnectDialog(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleConnect} disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Plug className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </PageContent>
    </DashboardShell>
  );
}
