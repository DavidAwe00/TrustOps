import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import { addAuditLog } from "@/lib/demo-store";

const VALID_ROLES = ["ADMIN", "MEMBER", "VIEWER"];

/**
 * POST /api/settings/team/invite - Invite a team member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Demo mode - just return success
    if (isDemo()) {
      addAuditLog(
        "team.invite",
        "user",
        email,
        "demo@trustops.io",
        { role: role || "MEMBER" }
      );

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${email}`,
      });
    }

    // TODO: Implement with Prisma
    // 1. Check if user already exists in org
    // 2. Create invitation record
    // 3. Send invitation email
    // 4. Add audit log

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
    });
  } catch (error) {
    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

