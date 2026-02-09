import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { getAuditLogs, getEvidenceItems } from "@/lib/db";

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

// Activity type icons and descriptions
const activityTypes: Record<string, { icon: string; verb: string }> = {
  "evidence.created": { icon: "📄", verb: "uploaded" },
  "evidence.approved": { icon: "✅", verb: "approved" },
  "evidence.rejected": { icon: "❌", verb: "rejected" },
  "evidence.updated": { icon: "📝", verb: "updated" },
  "evidence.deleted": { icon: "🗑️", verb: "deleted" },
  "integration.connected": { icon: "🔗", verb: "connected" },
  "integration.synced": { icon: "🔄", verb: "synced" },
  "export.created": { icon: "📦", verb: "exported" },
  "copilot.gap_analysis": { icon: "🤖", verb: "ran gap analysis" },
  "copilot.policy_draft": { icon: "📜", verb: "drafted policy" },
};

/**
 * GET /api/activity - Get recent activity feed
 */
export async function GET() {
  try {
    const orgId = await getOrgId();
    
    // Get recent audit logs
    const logs = await getAuditLogs(orgId, 20);
    
    // Transform logs to activity items
    const activities = logs.map((log) => {
      const activityType = activityTypes[log.action] || {
        icon: "📌",
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
      const evidence = await getEvidenceItems(orgId);
      const recentEvidence = evidence.slice(0, 5);
      
      return NextResponse.json({
        activities: recentEvidence.map((e, i) => ({
          id: `activity-${i}`,
          type: "evidence.created",
          icon: "📄",
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
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
