import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";

/**
 * GET /api/settings/profile - Get current user profile
 */
export async function GET() {
  // Demo mode returns mock data
  if (isDemo()) {
    return NextResponse.json({
      id: "demo-user",
      name: "Demo User",
      email: "demo@trustops.io",
      avatar: null,
    });
  }

  // TODO: Implement with Prisma
  return NextResponse.json({
    error: "Not implemented",
  }, { status: 501 });
}

/**
 * PUT /api/settings/profile - Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
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

    // Demo mode - just return success
    if (isDemo()) {
      return NextResponse.json({
        success: true,
        profile: { name, email },
      });
    }

    // TODO: Implement with Prisma
    // const user = await prisma.user.update({
    //   where: { id: currentUser.id },
    //   data: { name, email },
    // });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

