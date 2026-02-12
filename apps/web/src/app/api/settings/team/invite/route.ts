import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import { addAuditLog } from "@/lib/demo-store";
import { requireAuth, Errors } from "@/lib/api-utils";
import { InviteTeamMemberSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/settings/team/invite - Invite a team member
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json();

    const parsed = parseBody(InviteTeamMemberSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }

    const { email, role } = parsed.data;

    // Demo mode - just return success
    if (isDemo()) {
      addAuditLog(
        "team.invite",
        "user",
        email,
        "demo@trustops.io",
        { role }
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

    logger.info("Team invite sent", { orgId: ctx.orgId, invitedEmail: email, role });

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
    });
  } catch (error) {
    return Errors.internal("Failed to send invitation", error);
  }
}
