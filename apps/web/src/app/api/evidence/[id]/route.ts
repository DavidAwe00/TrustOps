import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import {
  getEvidenceItem,
  updateEvidenceItem,
  deleteEvidenceItem,
  createAuditLog,
} from "@/lib/db";

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
 * GET /api/evidence/[id] - Get a single evidence item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    
    const item = await getEvidenceItem(orgId, id);
    
    if (!item) {
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/evidence/[id] - Update an evidence item
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    const body = await request.json();
    
    const item = await updateEvidenceItem(orgId, id, body);
    
    if (!item) {
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 }
      );
    }
    
    await createAuditLog(orgId, {
      action: "evidence.updated",
      targetType: "evidence_item",
      targetId: id,
      metadata: { updates: body },
    });
    
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating evidence:", error);
    return NextResponse.json(
      { error: "Failed to update evidence" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/evidence/[id] - Delete an evidence item
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    
    const success = await deleteEvidenceItem(orgId, id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 }
      );
    }
    
    await createAuditLog(orgId, {
      action: "evidence.deleted",
      targetType: "evidence_item",
      targetId: id,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting evidence:", error);
    return NextResponse.json(
      { error: "Failed to delete evidence" },
      { status: 500 }
    );
  }
}
