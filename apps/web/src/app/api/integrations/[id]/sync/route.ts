import { NextRequest, NextResponse } from "next/server";
import { getIntegration, updateIntegration, createAuditLog } from "@/lib/db";
import { runGitHubCollector } from "@/lib/collectors/github-collector";
import { runAWSCollector } from "@/lib/collectors/aws-collector";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/integrations/[id]/sync - Run collector for an integration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "ai");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;

    const integration = await getIntegration(ctx.orgId, id);
    if (!integration) {
      return Errors.notFound("Integration");
    }

    if (integration.status === "DISCONNECTED") {
      return Errors.badRequest("Integration is not connected");
    }

    // Mark as syncing
    await updateIntegration(ctx.orgId, id, {
      lastSyncAt: new Date(),
      lastError: null,
    });

    let result;

    switch (integration.provider) {
      case "GITHUB":
        result = await runGitHubCollector();
        break;

      case "AWS":
        result = await runAWSCollector();
        break;

      default:
        return Errors.badRequest("Unknown integration provider");
    }

    // Update integration with sync result
    if (!result.success) {
      await updateIntegration(ctx.orgId, id, {
        status: "ERROR",
        lastError: result.errors?.join(", ") || "Sync failed",
      });
    }

    await createAuditLog(ctx.orgId, {
      action: "integration.synced",
      targetType: "integration",
      targetId: id,
      metadata: {
        provider: integration.provider,
        success: result.success,
        evidenceCreated: result.evidenceCreated,
      },
    });

    logger.info("Integration sync completed", {
      orgId: ctx.orgId,
      integrationId: id,
      provider: integration.provider,
      success: result.success,
      evidenceCreated: result.evidenceCreated,
    });

    return NextResponse.json({
      success: result.success,
      evidenceCreated: result.evidenceCreated,
      errors: result.errors,
      duration: result.duration,
    });
  } catch (error) {
    return Errors.internal("Integration sync failed", error);
  }
}
