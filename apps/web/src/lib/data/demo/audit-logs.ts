/**
 * Demo Audit Logs Data Layer
 */

import { getAuditLogs, addAuditLog } from "@/lib/demo-store";

export type AuditLog = ReturnType<typeof getAuditLogs>[0];

export function list(_orgId: string, limit?: number): AuditLog[] {
  const logs = getAuditLogs();
  return limit ? logs.slice(0, limit) : logs;
}

export function add(
  _orgId: string,
  data: {
    action: string;
    resourceType: string;
    resourceId: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }
): AuditLog {
  return addAuditLog(
    data.action,
    data.resourceType,
    data.resourceId,
    data.userId,
    data.metadata
  );
}

