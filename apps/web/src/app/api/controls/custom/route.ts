import { NextRequest, NextResponse } from "next/server";
import { getControls, createAuditLog } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { parseBody } from "@/lib/validations";

const CreateCustomControlSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  category: z.string().max(200).optional().default("Custom"),
});

// In-memory store for custom controls (demo mode)
const customControls: Array<{
  id: string;
  orgId: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  createdAt: string;
}> = [];

/**
 * GET /api/controls/custom - Get custom controls
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    // Get standard controls plus custom ones
    const standardControls = await getControls();
    const orgCustomControls = customControls.filter((c) => c.orgId === ctx.orgId);
    
    return NextResponse.json({
      controls: standardControls,
      customControls: orgCustomControls,
    });
  } catch (error) {
    return Errors.internal("Failed to fetch controls", error);
  }
}

/**
 * POST /api/controls/custom - Create a custom control
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json();

    const parsed = parseBody(CreateCustomControlSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }
    
    const control = {
      id: `custom-${crypto.randomUUID()}`,
      orgId: ctx.orgId,
      code: parsed.data.code,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      createdAt: new Date().toISOString(),
    };
    
    customControls.push(control);
    
    await createAuditLog(ctx.orgId, {
      action: "control.created",
      targetType: "control",
      targetId: control.id,
      metadata: { code: control.code, title: control.title },
    });

    logger.info("Custom control created", { orgId: ctx.orgId, controlId: control.id });
    
    return NextResponse.json({ control });
  } catch (error) {
    return Errors.internal("Failed to create custom control", error);
  }
}
