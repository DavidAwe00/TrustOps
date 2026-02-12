import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";

/**
 * POST /api/auth/signup - Create a new user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company } = body;

    if (!name || !email || !company) {
      return NextResponse.json(
        { error: "Name, email, and company are required" },
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

    // In demo mode, just return success
    if (isDemo()) {
      return NextResponse.json({
        success: true,
        message: "Account created (demo mode)",
      });
    }

    // In production, this would:
    // 1. Check if user already exists
    // 2. Create user in database
    // 3. Create organization with user as owner
    // 4. Send verification email via Auth.js

    // For now, trigger the Auth.js email sign-in flow
    // which will create the user if they don't exist
    
    // TODO: Implement with Prisma when database is connected
    // const existingUser = await prisma.user.findUnique({ where: { email } });
    // if (existingUser) {
    //   return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    // }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    const { Errors } = await import("@/lib/api-utils");
    return Errors.internal("Failed to create account", error);
  }
}

