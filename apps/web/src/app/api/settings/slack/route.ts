import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { parseBody } from "@/lib/validations";

const SlackWebhookSchema = z.object({
  webhookUrl: z.string().url("Invalid webhook URL").startsWith("https://hooks.slack.com/", "Must be a Slack webhook URL"),
});

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
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

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
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

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

    logger.info("Slack config updated", { orgId: ctx.orgId, enabled: slackConfig.enabled });

    return NextResponse.json({
      success: true,
      enabled: slackConfig.enabled,
    });
  } catch (error) {
    return Errors.internal("Failed to update Slack configuration", error);
  }
}

/**
 * POST /api/settings/slack - Test Slack webhook
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json();

    const parsed = parseBody(SlackWebhookSchema, body);
    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }

    const { webhookUrl } = parsed.data;

    // Send test message
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "TrustOps connected successfully!",
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "TrustOps Connected", emoji: true },
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
      return Errors.badRequest("Failed to send test message. Please check your webhook URL.");
    }

    // Save the webhook URL
    slackConfig.webhookUrl = webhookUrl;
    slackConfig.enabled = true;

    logger.info("Slack webhook tested successfully", { orgId: ctx.orgId });

    return NextResponse.json({
      success: true,
      message: "Test message sent successfully!",
    });
  } catch (error) {
    return Errors.internal("Failed to test Slack webhook", error);
  }
}
