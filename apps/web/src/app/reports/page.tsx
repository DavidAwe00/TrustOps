"use client";

import { useState } from "react";
import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, PieChart, BarChart3, FileBarChart, Eye } from "lucide-react";
import { toast } from "sonner";

const reportTypes = [
  { id: "compliance-summary", name: "Compliance Summary", description: "Executive overview", icon: PieChart },
  { id: "control-matrix", name: "Control Matrix", description: "All controls and status", icon: BarChart3 },
  { id: "evidence-inventory", name: "Evidence Inventory", description: "All collected evidence", icon: FileText },
  { id: "gap-analysis", name: "Gap Analysis", description: "Controls missing evidence", icon: FileBarChart },
];

export default function ReportsPage() {
  const [framework, setFramework] = useState("SOC2");
  const [generating, setGenerating] = useState<string | null>(null);

  const generateReport = async (reportType: string) => {
    setGenerating(reportType);
    try {
      const res = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework, reportType }),
      });
      if (!res.ok) throw new Error("Failed");
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
      toast.success("Report generated! Print or save as PDF.");
    } catch { toast.error("Failed to generate report"); }
    finally { setGenerating(null); }
  };

  return (
    <DashboardShell>
      <PageHeader title="Reports" description="Generate PDF compliance reports">
        <Select value={framework} onValueChange={setFramework}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SOC2">SOC 2</SelectItem>
            <SelectItem value="ISO27001">ISO 27001</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>
      <PageContent>
        <div className="grid md:grid-cols-2 gap-6">
          {reportTypes.map((r) => (
            <Card key={r.id} className="hover:border-emerald-200 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <r.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <Badge variant="outline">PDF</Badge>
                </div>
                <CardTitle className="mt-4">{r.name}</CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => generateReport(r.id)} disabled={!!generating}>
                  {generating === r.id ? "Generating..." : <><Eye className="mr-2 h-4 w-4" />Preview & Print</>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContent>
    </DashboardShell>
  );
}

