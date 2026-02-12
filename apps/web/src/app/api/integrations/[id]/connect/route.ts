import { NextRequest, NextResponse } from "next/server";
import { getIntegration, updateIntegration, createAuditLog } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { ConnectGitHubSchema, ConnectAWSSchema, parseBody } from "@/lib/validations";
import { encrypt } from "@/lib/encryption";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/integrations/[id]/connect - Connect an integration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const integration = await getIntegration(ctx.orgId, id);
    
    if (!integration) {
      return Errors.notFound("Integration");
    }

    let config: Record<string, unknown> = {};

    switch (integration.provider) {
      case "GITHUB": {
        const parsed = parseBody(ConnectGitHubSchema, body);
        if (!parsed.success) {
          return Errors.validationError(parsed.errors);
        }
        config = {
          // Encrypt the access token at rest
          accessToken: encrypt(parsed.data.accessToken),
          org: parsed.data.org,
          repos: parsed.data.repos,
        };
        break;
      }

      case "AWS": {
        const parsed = parseBody(ConnectAWSSchema, body);
        if (!parsed.success) {
          return Errors.validationError(parsed.errors);
        }
        config = {
          roleArn: parsed.data.roleArn,
          externalId: parsed.data.externalId,
          region: parsed.data.region,
          accountId: parsed.data.accountId,
        };
        break;
      }

      default:
        return Errors.badRequest("Unknown integration provider");
    }

    const updated = await updateIntegration(ctx.orgId, id, {
      status: "CONNECTED",
      config,
      lastSyncAt: new Date(),
      lastError: null,
    });

    if (!updated) {
      return Errors.internal("Failed to update integration");
    }

    await createAuditLog(ctx.orgId, {
      action: "integration.connected",
      targetType: "integration",
      targetId: id,
      metadata: { provider: integration.provider },
    });

    logger.info("Integration connected", {
      orgId: ctx.orgId,
      integrationId: id,
      provider: integration.provider,
    });

    // Remove sensitive config from response
    const safeConfig = { ...updated.config };
    if ("accessToken" in safeConfig) {
      safeConfig.accessToken = "***";
    }

    return NextResponse.json({
      integration: { ...updated, config: safeConfig },
    });
  } catch (error) {
    return Errors.internal("Failed to connect integration", error);
  }
}
