import { NextRequest, NextResponse } from "next/server";
import { getIntegrations } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/integrations - List all integrations
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const integrations = await getIntegrations(ctx.orgId);
    
    // Remove sensitive config data from response
    const safeIntegrations = integrations.map((i) => ({
      ...i,
      config: {
        ...(i.config as Record<string, unknown>),
        accessToken: i.config && "accessToken" in i.config ? "***" : undefined,
      },
    }));
    
    return NextResponse.json({ integrations: safeIntegrations });
  } catch (error) {
    return Errors.internal("Failed to fetch integrations", error);
  }
}
