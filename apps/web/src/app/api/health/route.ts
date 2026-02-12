/**
 * GET /api/health - Health check endpoint
 * Returns service health status for load balancers and monitoring.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, { status: "ok" | "degraded" | "error"; latencyMs?: number; message?: string }> = {};

  // Check database connectivity (if not in demo mode)
  if (process.env.TRUSTOPS_DEMO !== "1" && process.env.DATABASE_URL) {
    const dbStart = Date.now();
    try {
      const { prisma } = await import("@trustops/db");
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch (error) {
      checks.database = {
        status: "error",
        latencyMs: Date.now() - dbStart,
        message: error instanceof Error ? error.message : "Unknown database error",
      };
    }
  } else {
    checks.database = { status: "ok", message: "Demo mode — skipped" };
  }

  // Check storage
  checks.storage = {
    status: "ok",
    message: process.env.STORAGE_PROVIDER === "s3" ? "S3" : "Local filesystem",
  };

  // Check AI provider availability
  if (process.env.OPENAI_API_KEY) {
    checks.ai = { status: "ok", message: "OpenAI configured" };
  } else if (process.env.ANTHROPIC_API_KEY) {
    checks.ai = { status: "ok", message: "Anthropic configured" };
  } else {
    checks.ai = { status: "degraded", message: "No AI provider configured — copilot will use fallback responses" };
  }

  // Check email
  if (process.env.EMAIL_SERVER) {
    checks.email = { status: "ok" };
  } else {
    checks.email = { status: "degraded", message: "EMAIL_SERVER not configured — magic links disabled" };
  }

  // Overall status
  const hasError = Object.values(checks).some((c) => c.status === "error");
  const hasDegraded = Object.values(checks).some((c) => c.status === "degraded");
  const overallStatus = hasError ? "error" : hasDegraded ? "degraded" : "ok";

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || "0.1.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };

  return NextResponse.json(response, {
    status: hasError ? 503 : 200,
    headers: {
      "Cache-Control": "no-cache, no-store",
    },
  });
}
