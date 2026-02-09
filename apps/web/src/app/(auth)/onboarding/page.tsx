"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Building2,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";

const frameworks = [
  { 
    key: "SOC2", 
    name: "SOC 2 Type II", 
    description: "Service organization controls for security, availability, and confidentiality",
    popular: true,
  },
  { 
    key: "ISO27001", 
    name: "ISO/IEC 27001", 
    description: "International standard for information security management",
    popular: true,
  },
  { 
    key: "HIPAA", 
    name: "HIPAA", 
    description: "Health Insurance Portability and Accountability Act",
    popular: false,
  },
  { 
    key: "GDPR", 
    name: "GDPR", 
    description: "General Data Protection Regulation",
    popular: false,
  },
];

const steps = [
  { id: 1, title: "Organization", description: "Set up your company" },
  { id: 2, title: "Frameworks", description: "Choose compliance standards" },
  { id: 3, title: "Team", description: "Invite your team" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Organization
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  // Step 2: Frameworks
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["SOC2"]);

  // Step 3: Team
  const [teamEmails, setTeamEmails] = useState("");

  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    setOrgSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const toggleFramework = (key: string) => {
    setSelectedFrameworks((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    // In demo mode, just redirect
    // In production, this would create the org and invite team members
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          orgSlug,
          frameworks: selectedFrameworks,
          teamEmails: teamEmails.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      });
    } catch {
      // Ignore errors in demo mode
    }

    router.push("/dashboard");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return orgName.length >= 2 && orgSlug.length >= 2;
      case 2:
        return selectedFrameworks.length > 0;
      case 3:
        return true; // Team is optional
      default:
        return false;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                    currentStep > step.id
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : currentStep === step.id
                      ? "border-emerald-500 bg-white text-emerald-600"
                      : "border-slate-600 bg-transparent text-slate-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`mt-2 text-xs ${
                  currentStep >= step.id ? "text-white" : "text-slate-500"
                }`}>
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-16 ${
                    currentStep > step.id ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="animate-scale-in border-0 bg-white/95 shadow-2xl backdrop-blur">
        {/* Step 1: Organization */}
        {currentStep === 1 && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
                <Building2 className="h-7 w-7 text-emerald-600" />
              </div>
              <CardTitle>Set up your organization</CardTitle>
              <CardDescription>
                This will be your workspace for managing compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Inc"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Workspace URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">trustops.io/</span>
                  <Input
                    id="orgSlug"
                    placeholder="acme"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Frameworks */}
        {currentStep === 2 && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
                <Shield className="h-7 w-7 text-emerald-600" />
              </div>
              <CardTitle>Choose your frameworks</CardTitle>
              <CardDescription>
                Select the compliance standards you need to meet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {frameworks.map((framework) => (
                  <button
                    key={framework.key}
                    type="button"
                    onClick={() => toggleFramework(framework.key)}
                    className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                      selectedFrameworks.includes(framework.key)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        selectedFrameworks.includes(framework.key)
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedFrameworks.includes(framework.key) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{framework.name}</span>
                        {framework.popular && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {framework.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Team */}
        {currentStep === 3 && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
                <Users className="h-7 w-7 text-emerald-600" />
              </div>
              <CardTitle>Invite your team</CardTitle>
              <CardDescription>
                Collaboration makes compliance easier. You can skip this for now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emails">Team member emails</Label>
                <Input
                  id="emails"
                  placeholder="colleague@company.com, teammate@company.com"
                  value={teamEmails}
                  onChange={(e) => setTeamEmails(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium">Pro tip</p>
                    <p className="text-sm text-muted-foreground">
                      You can always invite more team members later from Settings → Team
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t p-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

