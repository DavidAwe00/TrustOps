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

// Demo data - in production, fetch from database
const demoExpiringEvidence = [
  {
    id: "ev-1",
    title: "AWS Config Backup Policy",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ownerId: "user-1",
    ownerEmail: "admin@example.com",
  },
  {
    id: "ev-2",
    title: "Security Training Certificates",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    ownerId: "user-1",
    ownerEmail: "admin@example.com",
  },
  {
    id: "ev-3",
    title: "Vendor Risk Assessment",
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
    ownerId: "user-2",
    ownerEmail: "compliance@example.com",
  },
  {
    id: "ev-4",
    title: "Penetration Test Report",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    ownerId: "user-1",
    ownerEmail: "admin@example.com",
  },
];

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is set, allow in development
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // In production, query database for expiring evidence
    // const expiringEvidence = await prisma.evidenceItem.findMany({
    //   where: {
    //     expiresAt: {
    //       gte: now,
    //       lte: thirtyDaysFromNow,
    //     },
    //     reminderSent: false,
    //   },
    //   include: { owner: true },
    // });

    // For demo, use sample data
    const expiringEvidence = demoExpiringEvidence.filter(
      (e) => e.expiresAt >= now && e.expiresAt <= thirtyDaysFromNow
    );

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
          console.log(`[DRY RUN] Would send reminder to ${email} for ${items.length} items`);
          results.push({ email, sent: false, error: "Email not configured" });
          continue;
        }

        await sendExpiryReminder(email, items);
        results.push({ email, sent: true });

        // In production, mark as reminded
        // await prisma.evidenceItem.updateMany({
        //   where: { ownerEmail: email, id: { in: items.map(i => i.id) } },
        //   data: { reminderSent: true, reminderSentAt: now },
        // });
      } catch (error) {
        console.error(`Failed to send reminder to ${email}:`, error);
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
    console.error("Evidence reminder cron error:", error);
    return NextResponse.json(
      { error: "Failed to process evidence reminders" },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}









