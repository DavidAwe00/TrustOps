import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { createAuditLog } from "@/lib/db";

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
  try {
    const { id } = await params;
    
    const comments = commentsStore.get(id) || [];
    
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/evidence/[id]/comments - Add a comment to evidence
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    const body = await request.json();
    
    if (!body.content) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }
    
    const comment = {
      id: crypto.randomUUID(),
      evidenceItemId: id,
      userId: "demo-user-1",
      userName: "Demo User",
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    
    const existing = commentsStore.get(id) || [];
    existing.push(comment);
    commentsStore.set(id, existing);
    
    await createAuditLog(orgId, {
      action: "comment.created",
      targetType: "evidence_item",
      targetId: id,
      metadata: { commentId: comment.id },
    });
    
    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
