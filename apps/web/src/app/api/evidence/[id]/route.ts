import { NextRequest, NextResponse } from "next/server";
import {
  getEvidenceItem,
  updateEvidenceItem,
  deleteEvidenceItem,
  createAuditLog,
} from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { UpdateEvidenceSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/evidence/[id] - Get a single evidence item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const item = await getEvidenceItem(ctx.orgId, id);
    
    if (!item) {
      return Errors.notFound("Evidence");
    }
    
    return NextResponse.json({ item });
  } catch (error) {
    return Errors.internal("Failed to fetch evidence", error);
  }
}

/**
 * PATCH /api/evidence/[id] - Update an evidence item
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = parseBody(UpdateEvidenceSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }
    
    const item = await updateEvidenceItem(ctx.orgId, id, parsed.data);
    
    if (!item) {
      return Errors.notFound("Evidence");
    }
    
    await createAuditLog(ctx.orgId, {
      action: "evidence.updated",
      targetType: "evidence_item",
      targetId: id,
      metadata: { updates: parsed.data },
    });

    logger.info("Evidence updated", { orgId: ctx.orgId, evidenceId: id });
    
    return NextResponse.json({ item });
  } catch (error) {
    return Errors.internal("Failed to update evidence", error);
  }
}

/**
 * DELETE /api/evidence/[id] - Delete an evidence item
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const success = await deleteEvidenceItem(ctx.orgId, id);
    
    if (!success) {
      return Errors.notFound("Evidence");
    }
    
    await createAuditLog(ctx.orgId, {
      action: "evidence.deleted",
      targetType: "evidence_item",
      targetId: id,
    });

    logger.info("Evidence deleted", { orgId: ctx.orgId, evidenceId: id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return Errors.internal("Failed to delete evidence", error);
  }
}
