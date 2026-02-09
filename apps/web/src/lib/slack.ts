/**
 * Slack Integration for TrustOps
 * Sends notifications to Slack channels via webhooks
 */

interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text?: { type: string; text: string }; url?: string; action_id?: string }>;
  accessory?: { type: string; text?: { type: string; text: string }; url?: string };
}

interface SlackAttachment {
  color: string;
  blocks?: SlackBlock[];
}

// Get webhook URL from environment
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Check if Slack is configured
 */
export function isSlackConfigured(): boolean {
  return !!SLACK_WEBHOOK_URL;
}

/**
 * Send a message to Slack
 */
export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.log("[Slack] Webhook not configured, skipping notification");
    return false;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("[Slack] Failed to send message:", response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Slack] Error sending message:", error);
    return false;
  }
}

/**
 * Send evidence pending review notification
 */
export async function notifyEvidencePending(evidence: {
  title: string;
  source: string;
  uploadedBy: string;
}): Promise<boolean> {
  return sendSlackMessage({
    text: `New evidence pending review: ${evidence.title}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📋 Evidence Pending Review", emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${evidence.title}*\nSource: ${evidence.source}\nUploaded by: ${evidence.uploadedBy}`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Review" },
          url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/evidence`,
        },
      },
    ],
  });
}

/**
 * Send evidence approved notification
 */
export async function notifyEvidenceApproved(evidence: {
  title: string;
  approvedBy: string;
}): Promise<boolean> {
  return sendSlackMessage({
    text: `Evidence approved: ${evidence.title}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *Evidence Approved*\n${evidence.title}\nApproved by: ${evidence.approvedBy}`,
        },
      },
    ],
  });
}

/**
 * Send evidence expiring notification
 */
export async function notifyEvidenceExpiring(count: number, days: number): Promise<boolean> {
  return sendSlackMessage({
    text: `${count} evidence items expiring in ${days} days`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "⚠️ Evidence Expiring Soon", emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${count} evidence item${count !== 1 ? "s" : ""}* will expire in the next *${days} days*.\nPlease review and renew your evidence to maintain compliance.`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "View Evidence" },
          url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/evidence`,
        },
      },
    ],
  });
}

/**
 * Send integration sync complete notification
 */
export async function notifyIntegrationSync(integration: {
  name: string;
  newItems: number;
  status: "success" | "failed";
}): Promise<boolean> {
  const emoji = integration.status === "success" ? "✅" : "❌";
  const statusText = integration.status === "success" 
    ? `Successfully collected ${integration.newItems} new evidence item${integration.newItems !== 1 ? "s" : ""}`
    : "Sync failed - please check your credentials";

  return sendSlackMessage({
    text: `${integration.name} sync ${integration.status}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${integration.name} Sync ${integration.status === "success" ? "Complete" : "Failed"}*\n${statusText}`,
        },
      },
    ],
  });
}

/**
 * Send export ready notification
 */
export async function notifyExportReady(exportInfo: {
  framework: string;
  downloadUrl: string;
}): Promise<boolean> {
  return sendSlackMessage({
    text: `Audit packet ready for ${exportInfo.framework}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📦 Audit Packet Ready", emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Your *${exportInfo.framework}* audit packet is ready for download.`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Download" },
          url: exportInfo.downloadUrl,
        },
      },
    ],
  });
}

/**
 * Send compliance score update
 */
export async function notifyComplianceScoreChange(data: {
  framework: string;
  oldScore: number;
  newScore: number;
}): Promise<boolean> {
  const direction = data.newScore > data.oldScore ? "📈" : "📉";
  const change = data.newScore - data.oldScore;
  const changeText = change > 0 ? `+${change}%` : `${change}%`;

  return sendSlackMessage({
    text: `${data.framework} compliance score changed to ${data.newScore}%`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${direction} *${data.framework} Compliance Score Update*\n\nScore: *${data.oldScore}%* → *${data.newScore}%* (${changeText})`,
        },
      },
    ],
  });
}

