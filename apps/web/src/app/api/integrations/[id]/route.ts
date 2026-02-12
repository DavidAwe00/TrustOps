import { NextRequest, NextResponse } from "next/server";
import { getIntegration, updateIntegration, createAuditLog } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/integrations/[id] - Get a single integration
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const integration = await getIntegration(ctx.orgId, id);
    
    if (!integration) {
      return Errors.notFound("Integration");
    }
    
    // Remove sensitive config
    const safeIntegration = {
      ...integration,
      config: {
        ...integration.config,
        accessToken: integration.config?.accessToken ? "***" : undefined,
      },
    };
    
    return NextResponse.json({ integration: safeIntegration });
  } catch (error) {
    return Errors.internal("Failed to fetch integration", error);
  }
}

/**
 * PATCH /api/integrations/[id] - Update an integration
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const integration = await updateIntegration(ctx.orgId, id, body);
    
    if (!integration) {
      return Errors.notFound("Integration");
    }
    
    await createAuditLog(ctx.orgId, {
      action: "integration.updated",
      targetType: "integration",
      targetId: id,
    });

    logger.info("Integration updated", { orgId: ctx.orgId, integrationId: id });
    
    return NextResponse.json({ integration });
  } catch (error) {
    return Errors.internal("Failed to update integration", error);
  }
}

/**
 * DELETE /api/integrations/[id] - Disconnect an integration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    
    const integration = await updateIntegration(ctx.orgId, id, {
      status: "DISCONNECTED",
      config: {},
      lastError: null,
    });
    
    if (!integration) {
      return Errors.notFound("Integration");
    }
    
    await createAuditLog(ctx.orgId, {
      action: "integration.disconnected",
      targetType: "integration",
      targetId: id,
    });

    logger.info("Integration disconnected", { orgId: ctx.orgId, integrationId: id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return Errors.internal("Failed to disconnect integration", error);
  }
}
