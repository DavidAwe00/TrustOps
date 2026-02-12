import { NextRequest, NextResponse } from "next/server";
import { updateEvidenceItem, createAuditLog } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/evidence/[id]/approve - Approve evidence
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    
    const item = await updateEvidenceItem(ctx.orgId, id, {
      reviewStatus: "APPROVED",
    });
    
    if (!item) {
      return Errors.notFound("Evidence");
    }
    
    await createAuditLog(ctx.orgId, {
      action: "evidence.approved",
      targetType: "evidence_item",
      targetId: id,
    });

    logger.info("Evidence approved", { orgId: ctx.orgId, evidenceId: id, approvedBy: ctx.userId });
    
    return NextResponse.json({ item });
  } catch (error) {
    return Errors.internal("Failed to approve evidence", error);
  }
}
