"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Zap,
  FileText,
  Bot,
  Download,
  Users,
  Star,
  Menu,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Control Management",
    description: "Track SOC2, ISO27001, and more with pre-built control libraries and real-time coverage monitoring.",
  },
  {
    icon: FileText,
    title: "Evidence Collection",
    description: "Automatically collect evidence from GitHub, AWS, and other integrations. Manual uploads supported too.",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    description: "Get AI-powered gap analysis, policy drafts, and questionnaire answers with strict citations.",
  },
  {
    icon: Download,
    title: "Audit Packets",
    description: "Generate auditor-ready ZIP exports organized by framework, control, and evidence.",
  },
];

const stats = [
  { value: "200+", label: "Hours Saved" },
  { value: "95%", label: "Faster Audits" },
  { value: "50+", label: "Controls Covered" },
];

const testimonials = [
  {
    quote: "TrustOps cut our SOC2 prep time in half. The AI copilot is incredibly accurate.",
    author: "Sarah Chen",
    role: "CTO, TechStartup Inc",
  },
  {
    quote: "Finally, a compliance tool that developers actually want to use.",
    author: "Mike Johnson",
    role: "VP Engineering, ScaleUp Co",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TrustOps</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-slate-300 hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/signin" className="text-sm text-slate-300 hover:text-white">
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-slate-900 border-white/10">
              <nav className="flex flex-col gap-6 mt-8">
                <Link 
                  href="#features" 
                  className="text-lg text-slate-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#pricing" 
                  className="text-lg text-slate-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/signin" 
                  className="text-lg text-slate-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <div className="pt-4 border-t border-white/10">
                  <Button asChild className="w-full">
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            <Zap className="h-4 w-4" />
            SOC2 & ISO27001 compliance made easy
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            Compliance automation{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              that actually works
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
            Stop drowning in spreadsheets. TrustOps automates evidence collection, 
            tracks controls, and generates audit-ready exports — all with AI assistance.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto">
              <Link href="/dashboard">
                View Demo
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-white/10 bg-black/20 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white md:text-4xl">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Everything you need for compliance
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              From evidence collection to audit exports, we've got you covered.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-emerald-500/50 hover:bg-white/10"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Start free, upgrade when you're ready
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">Free</h3>
              <p className="mt-2 text-4xl font-bold text-white">$0</p>
              <p className="text-slate-400">Forever free</p>
              <ul className="mt-8 space-y-4">
                {["Up to 3 team members", "1 compliance framework", "Basic evidence storage", "Community support"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 w-full border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
            
            {/* Pro Plan */}
            <div className="relative rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-8 backdrop-blur">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-sm font-medium text-white">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-white">Pro</h3>
              <p className="mt-2 text-4xl font-bold text-white">$99<span className="text-lg font-normal text-slate-400">/mo</span></p>
              <p className="text-slate-400">Per organization</p>
              <ul className="mt-8 space-y-4">
                {["Unlimited team members", "All compliance frameworks", "Unlimited evidence storage", "AI Copilot assistant", "Priority email support"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" asChild>
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </div>
            
            {/* Enterprise Plan */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">Enterprise</h3>
              <p className="mt-2 text-4xl font-bold text-white">Custom</p>
              <p className="text-slate-400">For large organizations</p>
              <ul className="mt-8 space-y-4">
                {["Everything in Pro", "SSO / SAML authentication", "Custom integrations", "Dedicated success manager", "SLA guarantees"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 w-full border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/signin">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Loved by security teams
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              >
                <p className="text-lg italic text-slate-300">"{testimonial.quote}"</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-12 backdrop-blur">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to simplify compliance?
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Join hundreds of companies using TrustOps to automate their compliance journey.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-white hover:bg-white/10">
                <Link href="/signin">
                  <Users className="mr-2 h-5 w-5" />
                  Talk to Sales
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Free 14-day trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">TrustOps</span>
            </div>
            <nav className="flex gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/docs" className="hover:text-white">Docs</Link>
              <Link href="/blog" className="hover:text-white">Blog</Link>
            </nav>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} TrustOps. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
