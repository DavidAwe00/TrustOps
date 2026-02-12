import { NextRequest, NextResponse } from "next/server";
import { getCoverageStats } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/dashboard/stats - Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const stats = await getCoverageStats(ctx.orgId);
    return NextResponse.json(stats);
  } catch (error) {
    return Errors.internal("Failed to fetch dashboard stats", error);
  }
}
