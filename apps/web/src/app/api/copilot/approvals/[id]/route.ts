import { NextRequest, NextResponse } from "next/server";
import { getApproval, updateApprovalStatus } from "@/lib/ai/store";
import { addAuditLog } from "@/lib/demo-store";
import type { ApprovalStatus } from "@/lib/ai/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/copilot/approvals/[id] - Get approval details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const approval = getApproval(id);

  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  return NextResponse.json({ approval });
}

/**
 * POST /api/copilot/approvals/[id] - Approve or reject
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !["approve", "reject", "request_revision"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use: approve, reject, or request_revision" },
        { status: 400 }
      );
    }

    const approval = getApproval(id);
    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    const statusMap: Record<string, ApprovalStatus> = {
      approve: "approved",
      reject: "rejected",
      request_revision: "revision_requested",
    };

    const success = updateApprovalStatus(
      id,
      statusMap[action],
      "demo@trustops.io",
      notes
    );

    if (!success) {
      return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
    }

    // Audit log
    addAuditLog(
      `ai.${action}`,
      approval.type,
      id,
      "demo@trustops.io",
      { action, notes }
    );

    return NextResponse.json({
      success: true,
      approval: getApproval(id),
    });
  } catch (error) {
    const { Errors } = await import("@/lib/api-utils");
    return Errors.internal("Failed to process approval", error);
  }
}

