import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { getIntegration, updateIntegration, createAuditLog } from "@/lib/db";

const DEMO_ORG_ID = "demo-org-1";

async function getOrgId(): Promise<string> {
  if (isDemo()) {
    return DEMO_ORG_ID;
  }
  
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  return (session.user as { defaultOrgId?: string }).defaultOrgId || DEMO_ORG_ID;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/integrations/[id]/connect - Connect an integration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    const body = await request.json();
    
    const integration = await getIntegration(orgId, id);
    
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    let config: Record<string, unknown> = {};

    switch (integration.provider) {
      case "GITHUB": {
        if (!body.org) {
          return NextResponse.json(
            { error: "GitHub organization is required" },
            { status: 400 }
          );
        }
        config = {
          accessToken: body.accessToken,
          org: body.org,
          repos: body.repos || [],
        };
        break;
      }

      case "AWS": {
        if (!body.roleArn) {
          return NextResponse.json(
            { error: "AWS Role ARN is required" },
            { status: 400 }
          );
        }
        config = {
          roleArn: body.roleArn,
          externalId: body.externalId,
          region: body.region || "us-east-1",
          accountId: body.accountId,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unknown integration provider" },
          { status: 400 }
        );
    }

    const updated = await updateIntegration(orgId, id, {
      status: "CONNECTED",
      config,
      lastSyncAt: new Date(),
      lastError: null,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update integration" },
        { status: 500 }
      );
    }

    await createAuditLog(orgId, {
      action: "integration.connected",
      targetType: "integration",
      targetId: id,
      metadata: { provider: integration.provider },
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
    console.error("Error connecting integration:", error);
    return NextResponse.json(
      { error: "Failed to connect integration" },
      { status: 500 }
    );
  }
}
