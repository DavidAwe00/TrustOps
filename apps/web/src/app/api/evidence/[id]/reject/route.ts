import { NextRequest, NextResponse } from "next/server";
import { updateEvidenceItem, createAuditLog } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { RejectEvidenceSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/evidence/[id]/reject - Reject evidence
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = parseBody(RejectEvidenceSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }
    
    const item = await updateEvidenceItem(ctx.orgId, id, {
      reviewStatus: "REJECTED",
    });
    
    if (!item) {
      return Errors.notFound("Evidence");
    }
    
    await createAuditLog(ctx.orgId, {
      action: "evidence.rejected",
      targetType: "evidence_item",
      targetId: id,
      metadata: { reason: parsed.data.reason },
    });

    logger.info("Evidence rejected", { orgId: ctx.orgId, evidenceId: id, rejectedBy: ctx.userId });
    
    return NextResponse.json({ item });
  } catch (error) {
    return Errors.internal("Failed to reject evidence", error);
  }
}
