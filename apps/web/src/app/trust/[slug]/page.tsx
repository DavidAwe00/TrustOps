import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Shield, 
  CheckCircle2, 
  FileText, 
  Calendar,
  ExternalLink,
  Lock,
  Server,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Demo trust center data
const trustCenters: Record<string, {
  org: { name: string; logo?: string; description: string };
  certifications: Array<{ name: string; status: string; validUntil: string; badge: string }>;
  securityPractices: Array<{ icon: string; title: string; description: string }>;
  compliance: { overall: number; frameworks: Array<{ name: string; coverage: number }> };
  lastUpdated: string;
}> = {
  "demo-org": {
    org: {
      name: "Demo Organization",
      description: "We take security seriously. This page provides transparency into our security practices and compliance status.",
    },
    certifications: [
      { name: "SOC 2 Type II", status: "Active", validUntil: "2025-12-31", badge: "SOC2" },
      { name: "ISO/IEC 27001", status: "Active", validUntil: "2026-06-30", badge: "ISO27001" },
    ],
    securityPractices: [
      { icon: "lock", title: "Encryption", description: "All data encrypted at rest (AES-256) and in transit (TLS 1.3)" },
      { icon: "server", title: "Infrastructure", description: "Hosted on AWS with SOC 2 certified data centers" },
      { icon: "users", title: "Access Control", description: "Role-based access with MFA required for all employees" },
      { icon: "clock", title: "Monitoring", description: "24/7 security monitoring and incident response" },
    ],
    compliance: {
      overall: 94,
      frameworks: [
        { name: "SOC 2", coverage: 96 },
        { name: "ISO 27001", coverage: 92 },
      ],
    },
    lastUpdated: new Date().toISOString(),
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  lock: Lock,
  server: Server,
  users: Users,
  clock: Clock,
};

export default async function TrustCenterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = trustCenters[slug];

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{data.org.name}</h1>
                <p className="text-xs text-muted-foreground">Trust Center</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm text-emerald-700 mb-4">
            <Shield className="h-4 w-4" />
            Security & Compliance
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Our Commitment to Security
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {data.org.description}
          </p>
        </div>

        {/* Certifications */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Certifications & Attestations
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {data.certifications.map((cert) => (
              <Card key={cert.name} className="border-2 hover:border-emerald-200 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                          {cert.badge}
                        </div>
                        <div>
                          <h4 className="font-semibold">{cert.name}</h4>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            {cert.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-3">
                        <Calendar className="h-4 w-4" />
                        Valid until {new Date(cert.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Compliance Overview */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Compliance Overview
          </h3>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Compliance Score</p>
                  <p className="text-4xl font-bold text-emerald-600">{data.compliance.overall}%</p>
                </div>
                <div className="h-24 w-24 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                  <span className="text-2xl font-bold">{data.compliance.overall}</span>
                </div>
              </div>
              <div className="space-y-4">
                {data.compliance.frameworks.map((framework) => (
                  <div key={framework.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{framework.name}</span>
                      <span className="text-muted-foreground">{framework.coverage}%</span>
                    </div>
                    <Progress value={framework.coverage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security Practices */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600" />
            Security Practices
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {data.securityPractices.map((practice) => {
              const Icon = iconMap[practice.icon] || Shield;
              return (
                <Card key={practice.title}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{practice.title}</h4>
                        <p className="text-sm text-muted-foreground">{practice.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Request Access */}
        <section className="text-center">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-2">Need More Information?</h3>
              <p className="text-muted-foreground mb-6">
                Request access to our detailed security documentation and audit reports.
              </p>
              <div className="flex gap-4 justify-center">
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Request Audit Report
                </Button>
                <Button variant="outline">
                  Contact Security Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date(data.lastUpdated).toLocaleDateString()}</p>
          <p className="mt-2">
            Powered by{" "}
            <Link href="/" className="text-emerald-600 hover:underline">
              TrustOps
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

