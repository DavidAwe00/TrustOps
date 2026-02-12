import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/audit-logs - Get audit logs
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    
    const logs = await getAuditLogs(ctx.orgId, limit);
    
    return NextResponse.json({ logs });
  } catch (error) {
    return Errors.internal("Failed to fetch audit logs", error);
  }
}
