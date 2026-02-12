import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { CreateCommentSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// In-memory comments store for demo mode
const commentsStore: Map<string, Array<{
  id: string;
  evidenceItemId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}>> = new Map();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/evidence/[id]/comments - Get comments for evidence
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const comments = commentsStore.get(id) || [];
    return NextResponse.json({ comments });
  } catch (error) {
    return Errors.internal("Failed to fetch comments", error);
  }
}

/**
 * POST /api/evidence/[id]/comments - Add a comment to evidence
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = parseBody(CreateCommentSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }
    
    const comment = {
      id: crypto.randomUUID(),
      evidenceItemId: id,
      userId: ctx.userId,
      userName: ctx.email,
      content: parsed.data.content,
      createdAt: new Date().toISOString(),
    };
    
    const existing = commentsStore.get(id) || [];
    existing.push(comment);
    commentsStore.set(id, existing);
    
    await createAuditLog(ctx.orgId, {
      action: "comment.created",
      targetType: "evidence_item",
      targetId: id,
      metadata: { commentId: comment.id },
    });

    logger.info("Comment created", { orgId: ctx.orgId, evidenceId: id, commentId: comment.id });
    
    return NextResponse.json({ comment });
  } catch (error) {
    return Errors.internal("Failed to add comment", error);
  }
}
