import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";

// In-memory store for demo
let slackConfig = {
  webhookUrl: "",
  enabled: false,
  notifications: {
    evidencePending: true,
    evidenceApproved: true,
    evidenceExpiring: true,
    integrationSync: true,
    exportReady: true,
  },
};

/**
 * GET /api/settings/slack - Get Slack configuration
 */
export async function GET() {
  if (isDemo()) {
    return NextResponse.json({
      enabled: slackConfig.enabled,
      configured: !!slackConfig.webhookUrl,
      notifications: slackConfig.notifications,
    });
  }

  return NextResponse.json({
    enabled: !!process.env.SLACK_WEBHOOK_URL,
    configured: !!process.env.SLACK_WEBHOOK_URL,
    notifications: slackConfig.notifications,
  });
}

/**
 * PUT /api/settings/slack - Update Slack configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, notifications } = body;

    if (webhookUrl !== undefined) {
      slackConfig.webhookUrl = webhookUrl;
      slackConfig.enabled = !!webhookUrl;
    }

    if (notifications) {
      slackConfig.notifications = {
        ...slackConfig.notifications,
        ...notifications,
      };
    }

    return NextResponse.json({
      success: true,
      enabled: slackConfig.enabled,
    });
  } catch (error) {
    console.error("Error updating Slack config:", error);
    return NextResponse.json(
      { error: "Failed to update Slack configuration" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/slack - Test Slack webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL is required" },
        { status: 400 }
      );
    }

    // Send test message
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "🎉 TrustOps connected successfully!",
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "✅ TrustOps Connected", emoji: true },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Your Slack integration is working! You'll now receive compliance notifications in this channel.",
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to send test message. Please check your webhook URL." },
        { status: 400 }
      );
    }

    // Save the webhook URL
    slackConfig.webhookUrl = webhookUrl;
    slackConfig.enabled = true;

    return NextResponse.json({
      success: true,
      message: "Test message sent successfully!",
    });
  } catch (error) {
    console.error("Error testing Slack webhook:", error);
    return NextResponse.json(
      { error: "Failed to test webhook" },
      { status: 500 }
    );
  }
}

