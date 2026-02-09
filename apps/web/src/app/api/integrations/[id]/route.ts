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
 * GET /api/integrations/[id] - Get a single integration
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    console.error("Error fetching integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/integrations/[id] - Update an integration
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    const body = await request.json();
    
    const integration = await updateIntegration(orgId, id, body);
    
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }
    
    await createAuditLog(orgId, {
      action: "integration.updated",
      targetType: "integration",
      targetId: id,
    });
    
    return NextResponse.json({ integration });
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[id] - Disconnect an integration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    
    const integration = await updateIntegration(orgId, id, {
      status: "DISCONNECTED",
      config: {},
      lastError: null,
    });
    
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }
    
    await createAuditLog(orgId, {
      action: "integration.disconnected",
      targetType: "integration",
      targetId: id,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
