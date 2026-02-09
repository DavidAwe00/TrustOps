import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { getIntegration, updateIntegration, createAuditLog } from "@/lib/db";
import { runGitHubCollector } from "@/lib/collectors/github-collector";
import { runAWSCollector } from "@/lib/collectors/aws-collector";

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
 * POST /api/integrations/[id]/sync - Run collector for an integration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();

    const integration = await getIntegration(orgId, id);
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    if (integration.status === "DISCONNECTED") {
      return NextResponse.json(
        { error: "Integration is not connected" },
        { status: 400 }
      );
    }

    // Mark as syncing
    await updateIntegration(orgId, id, {
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
        return NextResponse.json(
          { error: "Unknown integration provider" },
          { status: 400 }
        );
    }

    // Update integration with sync result
    if (!result.success) {
      await updateIntegration(orgId, id, {
        status: "ERROR",
        lastError: result.errors?.join(", ") || "Sync failed",
      });
    }

    await createAuditLog(orgId, {
      action: "integration.synced",
      targetType: "integration",
      targetId: id,
      metadata: {
        provider: integration.provider,
        success: result.success,
        evidenceCreated: result.evidenceCreated,
      },
    });

    return NextResponse.json({
      success: result.success,
      evidenceCreated: result.evidenceCreated,
      errors: result.errors,
      duration: result.duration,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
