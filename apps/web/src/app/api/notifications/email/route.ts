import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { createAuditLog } from "@/lib/db";

const DEMO_ORG_ID = "demo-org-1";

async function getOrgId(): Promise<string> {
  if (isDemo()) {
    return DEMO_ORG_ID;
  }
  
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  return (session.user as { defaultOrgId?: string }).defaultOrgId || DEMO_ORG_ID;
}

/**
 * POST /api/notifications/email - Send email notification
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrgId();
    const demo = isDemo();
    const body = await request.json();
    
    const { to, subject, html } = body;
    
    if (!to || !subject) {
      return NextResponse.json(
        { error: "Recipient and subject are required" },
        { status: 400 }
      );
    }
    
    if (demo) {
      // In demo mode, just log and return success
      console.log(`[Demo] Email to ${to}: ${subject}`);
      
      await createAuditLog(orgId, {
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
    
    await createAuditLog(orgId, {
      action: "email.sent",
      targetType: "notification",
      metadata: { to, subject },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
