"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Mail, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const verifyRequest = searchParams.get("verify") === "1";
  const errorParam = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(verifyRequest);
  const [error, setError] = useState("");
  const [isDemo, setIsDemo] = useState(false);

  // Check if we're in demo mode
  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((providers) => {
        setIsDemo(providers.demo !== undefined);
      })
      .catch(() => {
        // If providers fail, assume demo mode
        setIsDemo(true);
      });
  }, []);

  // Show error from URL
  useEffect(() => {
    if (errorParam) {
      const errors: Record<string, string> = {
        Verification: "The sign in link has expired or already been used.",
        Configuration: "There is a problem with the server configuration.",
        AccessDenied: "Access denied. Please try again.",
        Default: "An error occurred. Please try again.",
      };
      setError(errors[errorParam] || errors.Default);
    }
  }, [errorParam]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to send sign-in link. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("demo", {
        email: "demo@trustops.app",
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Demo sign-in failed. Please try again.");
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md animate-scale-in border-0 bg-white/95 shadow-2xl backdrop-blur">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Check your email</h2>
          <p className="mb-6 text-muted-foreground">
            We sent a magic link to <strong>{email || "your email"}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to sign in. The link expires in 24 hours.
          </p>
          <Button
            variant="ghost"
            className="mt-6"
            onClick={() => setEmailSent(false)}
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="animate-scale-in border-0 bg-white/95 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your TrustOps account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Demo Mode Button - Always visible for easy access */}
          <Button
            variant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={handleDemoSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isDemo ? "Enter Demo Mode" : "Try Demo Mode"}
          </Button>

          {!isDemo && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or sign in with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="outline" className="w-full" disabled={isLoading || !email}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send Magic Link
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "SOC2 & ISO27001", desc: "Built-in frameworks" },
          { label: "AI Copilot", desc: "Automated assistance" },
          { label: "Audit Ready", desc: "Export packets" },
        ].map((feature, i) => (
          <div key={i} className="rounded-lg bg-white/10 p-3 backdrop-blur">
            <p className="text-xs font-medium text-white">{feature.label}</p>
            <p className="text-[10px] text-slate-300">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignInLoading() {
  return (
    <div className="w-full max-w-md">
      <Card className="animate-pulse border-0 bg-white/95 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-gray-200" />
          <div className="mx-auto h-6 w-32 rounded bg-gray-200" />
          <div className="mx-auto h-4 w-48 rounded bg-gray-100" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}
