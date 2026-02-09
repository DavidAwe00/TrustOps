import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { getControls, createAuditLog } from "@/lib/db";

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

// In-memory store for custom controls (demo mode)
const customControls: Array<{
  id: string;
  orgId: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  createdAt: string;
}> = [];

/**
 * GET /api/controls/custom - Get custom controls
 */
export async function GET() {
  try {
    const orgId = await getOrgId();
    
    // Get standard controls plus custom ones
    const standardControls = await getControls();
    const orgCustomControls = customControls.filter((c) => c.orgId === orgId);
    
    return NextResponse.json({
      controls: standardControls,
      customControls: orgCustomControls,
    });
  } catch (error) {
    console.error("Error fetching controls:", error);
    return NextResponse.json(
      { error: "Failed to fetch controls" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/controls/custom - Create a custom control
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrgId();
    const body = await request.json();
    
    if (!body.title || !body.code) {
      return NextResponse.json(
        { error: "Title and code are required" },
        { status: 400 }
      );
    }
    
    const control = {
      id: `custom-${crypto.randomUUID()}`,
      orgId,
      code: body.code,
      title: body.title,
      description: body.description,
      category: body.category || "Custom",
      createdAt: new Date().toISOString(),
    };
    
    customControls.push(control);
    
    await createAuditLog(orgId, {
      action: "control.created",
      targetType: "control",
      targetId: control.id,
      metadata: { code: control.code, title: control.title },
    });
    
    return NextResponse.json({ control });
  } catch (error) {
    console.error("Error creating custom control:", error);
    return NextResponse.json(
      { error: "Failed to create custom control" },
      { status: 500 }
    );
  }
}
