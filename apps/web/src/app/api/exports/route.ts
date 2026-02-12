import { NextRequest, NextResponse } from "next/server";
import { getExports } from "@/lib/exports-store";
import { generateAuditPacket } from "@/lib/export-generator";
import { requireAuth, Errors } from "@/lib/api-utils";
import { CreateExportSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/exports - List all exports
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const exports = getExports();
  return NextResponse.json({ exports });
}

/**
 * POST /api/exports - Generate a new export
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "ai");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json();

    const parsed = parseBody(CreateExportSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }

    const exportRecord = await generateAuditPacket(parsed.data.frameworkKey);

    logger.info("Export generated", {
      orgId: ctx.orgId,
      frameworkKey: parsed.data.frameworkKey,
    });

    return NextResponse.json({ export: exportRecord });
  } catch (error) {
    return Errors.internal("Failed to generate export", error);
  }
}
