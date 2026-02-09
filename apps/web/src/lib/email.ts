/**
 * Email Service
 * Sends transactional emails using SMTP (via nodemailer)
 * Supports Resend, SendGrid, AWS SES, or any SMTP server
 */

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter from EMAIL_SERVER environment variable
function getTransporter() {
  const server = process.env.EMAIL_SERVER;
  
  if (!server) {
    throw new Error("EMAIL_SERVER environment variable is not set");
  }
  
  return nodemailer.createTransport(server);
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || "noreply@trustops.app";
  
  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html),
  });
}

/**
 * Send evidence approval notification
 */
export async function sendEvidenceApprovalNotification(
  to: string,
  evidenceTitle: string,
  approvedBy: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Evidence Approved: ${evidenceTitle}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
        <h1 style="color: #10b981;">TrustOps</h1>
        <h2>Evidence Approved ✅</h2>
        <p>The following evidence has been approved:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${evidenceTitle}</strong>
          <br><br>
          Approved by: ${approvedBy}
        </div>
        <a href="${process.env.AUTH_URL}/evidence" 
           style="display: inline-block; 
                  padding: 12px 24px; 
                  background: #10b981; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px;">
          View Evidence
        </a>
      </div>
    `,
  });
}

/**
 * Send evidence expiry reminder
 */
export async function sendExpiryReminder(
  to: string,
  evidenceItems: Array<{ title: string; expiresAt: Date }>
): Promise<void> {
  const itemsList = evidenceItems
    .map(
      (item) =>
        `<li><strong>${item.title}</strong> - expires ${item.expiresAt.toLocaleDateString()}</li>`
    )
    .join("");

  await sendEmail({
    to,
    subject: `Evidence Expiring Soon - ${evidenceItems.length} items need attention`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
        <h1 style="color: #10b981;">TrustOps</h1>
        <h2>Evidence Expiring Soon ⏰</h2>
        <p>The following evidence items are expiring within the next 30 days:</p>
        <ul style="background: #fef3c7; padding: 16px 16px 16px 32px; border-radius: 8px; margin: 16px 0;">
          ${itemsList}
        </ul>
        <p>Please review and renew these items to maintain compliance.</p>
        <a href="${process.env.AUTH_URL}/evidence" 
           style="display: inline-block; 
                  padding: 12px 24px; 
                  background: #10b981; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px;">
          Review Evidence
        </a>
      </div>
    `,
  });
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitation(
  to: string,
  inviterName: string,
  orgName: string,
  inviteLink: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `You're invited to join ${orgName} on TrustOps`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
        <h1 style="color: #10b981;">TrustOps</h1>
        <h2>You're Invited! 🎉</h2>
        <p>${inviterName} has invited you to join <strong>${orgName}</strong> on TrustOps.</p>
        <p>TrustOps helps teams automate compliance with SOC2, ISO27001, and other frameworks.</p>
        <a href="${inviteLink}" 
           style="display: inline-block; 
                  padding: 12px 24px; 
                  background: #10b981; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px;
                  margin: 16px 0;">
          Accept Invitation
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          This invitation expires in 7 days.
        </p>
      </div>
    `,
  });
}

/**
 * Send weekly compliance report
 */
export async function sendWeeklyReport(
  to: string,
  stats: {
    coveragePercent: number;
    newEvidence: number;
    expiringEvidence: number;
    pendingReviews: number;
  }
): Promise<void> {
  await sendEmail({
    to,
    subject: `Weekly Compliance Report - ${stats.coveragePercent}% Coverage`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
        <h1 style="color: #10b981;">TrustOps</h1>
        <h2>Weekly Compliance Report 📊</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
          <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #10b981;">${stats.coveragePercent}%</div>
            <div style="color: #6b7280;">Control Coverage</div>
          </div>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">${stats.newEvidence}</div>
            <div style="color: #6b7280;">New Evidence</div>
          </div>
          <div style="background: ${stats.expiringEvidence > 0 ? "#fef3c7" : "#f3f4f6"}; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">${stats.expiringEvidence}</div>
            <div style="color: #6b7280;">Expiring Soon</div>
          </div>
          <div style="background: ${stats.pendingReviews > 0 ? "#dbeafe" : "#f3f4f6"}; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">${stats.pendingReviews}</div>
            <div style="color: #6b7280;">Pending Reviews</div>
          </div>
        </div>
        
        <a href="${process.env.AUTH_URL}/dashboard" 
           style="display: inline-block; 
                  padding: 12px 24px; 
                  background: #10b981; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px;">
          View Dashboard
        </a>
      </div>
    `,
  });
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
