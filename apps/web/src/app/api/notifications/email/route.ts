import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import { createAuditLog } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { parseBody } from "@/lib/validations";

const SendEmailSchema = z.object({
  to: z.string().email("Invalid recipient email"),
  subject: z.string().min(1, "Subject is required").max(500),
  html: z.string().min(1, "Email body is required").max(50000),
});

/**
 * POST /api/notifications/email - Send email notification
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json();

    const parsed = parseBody(SendEmailSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }

    const { to, subject, html } = parsed.data;
    
    if (isDemo()) {
      // In demo mode, just log and return success
      logger.info("Email simulated (demo mode)", { to, subject });
      
      await createAuditLog(ctx.orgId, {
        action: "email.sent",
        targetType: "notification",
        metadata: { to, subject, demo: true },
      });
      
      return NextResponse.json({
        success: true,
        message: "Email simulated in demo mode",
      });
    }
    
    // In production, use the email service
    const { sendEmail } = await import("@/lib/email");
    await sendEmail({ to, subject, html });
    
    await createAuditLog(ctx.orgId, {
      action: "email.sent",
      targetType: "notification",
      metadata: { to, subject },
    });

    logger.info("Email sent", { to, subject });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return Errors.internal("Failed to send email", error);
  }
}
