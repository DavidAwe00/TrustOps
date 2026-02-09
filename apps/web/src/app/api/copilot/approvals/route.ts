import { NextResponse } from "next/server";
import { getPendingApprovals } from "@/lib/ai/store";

/**
 * GET /api/copilot/approvals - Get all pending approvals
 */
export async function GET() {
  const approvals = getPendingApprovals();
  return NextResponse.json({ approvals });
}

