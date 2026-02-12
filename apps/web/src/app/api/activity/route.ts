import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, getEvidenceItems } from "@/lib/db";
import { requireAuth, Errors } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

// Activity type icons and descriptions
const activityTypes: Record<string, { icon: string; verb: string }> = {
  "evidence.created": { icon: "file", verb: "uploaded" },
  "evidence.approved": { icon: "check", verb: "approved" },
  "evidence.rejected": { icon: "x", verb: "rejected" },
  "evidence.updated": { icon: "edit", verb: "updated" },
  "evidence.deleted": { icon: "trash", verb: "deleted" },
  "integration.connected": { icon: "link", verb: "connected" },
  "integration.synced": { icon: "refresh", verb: "synced" },
  "export.created": { icon: "package", verb: "exported" },
  "copilot.gap_analysis": { icon: "bot", verb: "ran gap analysis" },
  "copilot.policy_draft": { icon: "scroll", verb: "drafted policy" },
};

/**
 * GET /api/activity - Get recent activity feed
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    // Get recent audit logs
    const logs = await getAuditLogs(ctx.orgId, 20);
    
    // Transform logs to activity items
    const activities = logs.map((log) => {
      const activityType = activityTypes[log.action] || {
        icon: "pin",
        verb: log.action,
      };
      
      return {
        id: log.id,
        type: log.action,
        icon: activityType.icon,
        description: `${activityType.verb} ${log.targetType || "item"}`,
        targetType: log.targetType,
        targetId: log.targetId,
        metadata: log.metadata,
        createdAt: log.createdAt,
      };
    });
    
    // If no audit logs, generate some from recent evidence
    if (activities.length === 0) {
      const evidence = await getEvidenceItems(ctx.orgId);
      const recentEvidence = evidence.slice(0, 5);
      
      return NextResponse.json({
        activities: recentEvidence.map((e, i) => ({
          id: `activity-${i}`,
          type: "evidence.created",
          icon: "file",
          description: `uploaded ${e.title}`,
          targetType: "evidence_item",
          targetId: e.id,
          metadata: { source: e.source },
          createdAt: e.createdAt,
        })),
      });
    }
    
    return NextResponse.json({ activities });
  } catch (error) {
    return Errors.internal("Failed to fetch activity", error);
  }
}
