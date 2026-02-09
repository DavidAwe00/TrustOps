import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import { addAuditLog } from "@/lib/demo-store";

/**
 * POST /api/onboarding - Complete user onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgName, orgSlug, frameworks, teamEmails } = body;

    if (!orgName || !orgSlug) {
      return NextResponse.json(
        { error: "Organization name and slug are required" },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(orgSlug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // In demo mode, just return success
    if (isDemo()) {
      addAuditLog(
        "org.created",
        "org",
        "demo-org",
        "demo@trustops.io",
        { orgName, frameworks, teamCount: teamEmails?.length || 0 }
      );

      return NextResponse.json({
        success: true,
        org: {
          id: "demo-org",
          name: orgName,
          slug: orgSlug,
        },
      });
    }

    // In production, this would:
    // 1. Create organization in database
    // 2. Add current user as owner
    // 3. Enable selected frameworks
    // 4. Send invite emails to team members
    
    // TODO: Implement with Prisma
    // const org = await prisma.org.create({
    //   data: {
    //     name: orgName,
    //     slug: orgSlug,
    //     memberships: {
    //       create: {
    //         userId: currentUser.id,
    //         role: "OWNER",
    //       },
    //     },
    //   },
    // });
    // 
    // // Send team invites
    // if (teamEmails?.length) {
    //   for (const email of teamEmails) {
    //     await sendInviteEmail(email, org);
    //   }
    // }

    return NextResponse.json({
      success: true,
      message: "Organization created",
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

