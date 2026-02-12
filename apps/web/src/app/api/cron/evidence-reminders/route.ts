/**
 * API Route: Evidence Expiry Reminders (Cron Job)
 * POST /api/cron/evidence-reminders
 * 
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * to send email reminders for expiring evidence.
 * 
 * Recommended schedule: Daily at 9 AM
 */

import { NextRequest, NextResponse } from "next/server";
import { sendExpiryReminder } from "@/lib/email";
import { isDemo } from "@/lib/demo";
import { Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET is strictly required
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      logger.error("CRON_SECRET is not set — rejecting cron request in production");
      return false;
    }
    // Allow in development only
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "cron");
  if (limited) return limited;

  // Verify authorization
  if (!verifyCronSecret(request)) {
    return Errors.unauthorized("Invalid or missing cron secret");
  }

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // In production, query database for expiring evidence
    let expiringEvidence: Array<{
      id: string;
      title: string;
      expiresAt: Date;
      ownerEmail: string;
    }>;

    if (!isDemo() && process.env.DATABASE_URL) {
      const { prisma } = await import("@trustops/db");
      // Fetch evidence items expiring within the next 30 days
      const items = await prisma.evidenceItem.findMany({
        where: {
          expiresAt: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          org: {
            include: {
              memberships: {
                where: { role: "OWNER" },
                include: { user: true },
                take: 1,
              },
            },
          },
        },
      });

      expiringEvidence = items
        .filter((item) => item.org.memberships[0]?.user?.email)
        .map((item) => ({
          id: item.id,
          title: item.title,
          expiresAt: item.expiresAt!,
          ownerEmail: item.org.memberships[0].user.email!,
        }));
    } else {
      // Demo fallback — no hardcoded emails, just skip
      logger.info("Cron: demo mode or no DATABASE_URL, returning empty results");
      return NextResponse.json({
        success: true,
        processed: 0,
        emailsSent: 0,
        results: [],
        message: "No database configured — skipping evidence reminder check",
      });
    }

    // Group by owner email
    const byOwner = new Map<
      string,
      Array<{ title: string; expiresAt: Date }>
    >();

    for (const evidence of expiringEvidence) {
      const existing = byOwner.get(evidence.ownerEmail) || [];
      existing.push({
        title: evidence.title,
        expiresAt: evidence.expiresAt,
      });
      byOwner.set(evidence.ownerEmail, existing);
    }

    // Send emails to each owner
    const results: Array<{ email: string; sent: boolean; error?: string }> = [];

    for (const [email, items] of byOwner) {
      try {
        // Skip if email server not configured
        if (!process.env.EMAIL_SERVER) {
          logger.info("Cron: email not configured, skipping reminder", { email, itemCount: items.length });
          results.push({ email, sent: false, error: "Email not configured" });
          continue;
        }

        await sendExpiryReminder(email, items);
        results.push({ email, sent: true });

        logger.info("Evidence expiry reminder sent", { email, itemCount: items.length });
      } catch (error) {
        logger.error("Failed to send evidence reminder", error, { email });
        results.push({
          email,
          sent: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: expiringEvidence.length,
      emailsSent: results.filter((r) => r.sent).length,
      results,
    });
  } catch (error) {
    return Errors.internal("Evidence reminder cron error", error);
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
