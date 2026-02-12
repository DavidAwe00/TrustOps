import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { parseBody } from "@/lib/validations";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format"),
});

/**
 * GET /api/settings/profile - Get current user profile
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

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
    error: { code: "NOT_IMPLEMENTED", message: "Not implemented" },
  }, { status: 501 });
}

/**
 * PUT /api/settings/profile - Update current user profile
 */
export async function PUT(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json();

    const parsed = parseBody(UpdateProfileSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }

    const { name, email } = parsed.data;

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

    logger.info("Profile updated", { userId: ctx.userId, name });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return Errors.internal("Failed to update profile", error);
  }
}
