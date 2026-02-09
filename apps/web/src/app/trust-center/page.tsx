"use client";

import { useState } from "react";
import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe, ExternalLink, Copy, CheckCircle2, Shield, Lock, Users, Clock } from "lucide-react";
import { toast } from "sonner";

export default function TrustCenterPage() {
  const [enabled, setEnabled] = useState(true);
  const [slug, setSlug] = useState("demo-org");
  const trustCenterUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/trust/${slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(trustCenterUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <DashboardShell>
      <PageHeader title="Trust Center" description="Manage your public compliance page">
        <Button variant="outline" onClick={() => window.open(`/trust/${slug}`, "_blank")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </PageHeader>
      <PageContent>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Public Trust Center
                </CardTitle>
                <CardDescription>Share your compliance status with customers and prospects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Trust Center</Label>
                    <p className="text-sm text-muted-foreground">Make your trust center publicly accessible</p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>Trust Center URL</Label>
                  <div className="flex gap-2">
                    <Input value={trustCenterUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" onClick={copyUrl}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Custom Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="your-company" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Displayed Information</CardTitle>
                <CardDescription>Choose what to show on your trust center</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Certifications & badges", desc: "SOC 2, ISO 27001, etc.", on: true },
                  { label: "Compliance scores", desc: "Show percentage coverage", on: true },
                  { label: "Security practices", desc: "Encryption, access control, etc.", on: true },
                  { label: "Request audit report button", desc: "Let visitors request reports", on: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.on} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[4/5] rounded-lg border bg-gradient-to-b from-slate-50 to-white p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-6 w-6 rounded bg-emerald-500 flex items-center justify-center">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-semibold text-xs">Demo Organization</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded border p-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-1" />
                      <p className="text-xs font-medium">SOC 2</p>
                    </div>
                    <div className="rounded border p-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-1" />
                      <p className="text-xs font-medium">ISO 27001</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[Lock, Users, Clock].map((Icon, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Icon className="h-3 w-3 text-emerald-500" />
                        <div className="h-2 w-20 rounded bg-slate-200" />
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => window.open(`/trust/${slug}`, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Full Preview
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <Badge className="bg-emerald-100 text-emerald-700 mb-2">Pro Tip</Badge>
                <p className="text-sm text-emerald-900">Add your Trust Center link to your website footer and sales materials to build customer confidence.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}

