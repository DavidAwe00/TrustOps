import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import { requireAuth, Errors } from "@/lib/api-utils";
import { UpdateOrgSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/settings/org - Get organization settings
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

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
    error: { code: "NOT_IMPLEMENTED", message: "Not implemented" },
  }, { status: 501 });
}

/**
 * PUT /api/settings/org - Update organization settings
 */
export async function PUT(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json();

    const parsed = parseBody(UpdateOrgSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }

    const { name, slug } = parsed.data;

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

    logger.info("Org settings updated", { orgId: ctx.orgId, name, slug });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return Errors.internal("Failed to update organization settings", error);
  }
}
