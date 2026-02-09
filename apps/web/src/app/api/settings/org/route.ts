import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";

/**
 * GET /api/settings/org - Get organization settings
 */
export async function GET() {
  // Demo mode returns mock data
  if (isDemo()) {
    return NextResponse.json({
      id: "demo-org",
      name: "Demo Organization",
      slug: "demo-org",
      plan: "pro",
      createdAt: new Date().toISOString(),
    });
  }

  // TODO: Implement with Prisma
  return NextResponse.json({
    error: "Not implemented",
  }, { status: 501 });
}

/**
 * PUT /api/settings/org - Update organization settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // Demo mode - just return success
    if (isDemo()) {
      return NextResponse.json({
        success: true,
        org: { name, slug },
      });
    }

    // TODO: Implement with Prisma
    // const org = await prisma.org.update({
    //   where: { id: currentOrg.id },
    //   data: { name, slug },
    // });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error updating org settings:", error);
    return NextResponse.json(
      { error: "Failed to update organization settings" },
      { status: 500 }
    );
  }
}

