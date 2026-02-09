import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { getIntegrations } from "@/lib/db";

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

/**
 * GET /api/integrations - List all integrations
 */
export async function GET() {
  try {
    const orgId = await getOrgId();
    const integrations = await getIntegrations(orgId);
    
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
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}
