import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { updateEvidenceItem, createAuditLog } from "@/lib/db";

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
 * POST /api/evidence/[id]/reject - Reject evidence
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    const body = await request.json().catch(() => ({}));
    
    const item = await updateEvidenceItem(orgId, id, {
      reviewStatus: "REJECTED",
    });
    
    if (!item) {
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 }
      );
    }
    
    await createAuditLog(orgId, {
      action: "evidence.rejected",
      targetType: "evidence_item",
      targetId: id,
      metadata: { reason: body.reason },
    });
    
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error rejecting evidence:", error);
    return NextResponse.json(
      { error: "Failed to reject evidence" },
      { status: 500 }
    );
  }
}
