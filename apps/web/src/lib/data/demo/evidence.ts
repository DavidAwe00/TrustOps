/**
 * Demo Evidence Data Layer
 */

import { getEvidenceItems, createEvidenceItem, updateEvidenceItem, deleteEvidenceItem, addAuditLog } from "@/lib/demo-store";

export type EvidenceItem = ReturnType<typeof getEvidenceItems>[0];

export function list(_orgId: string): EvidenceItem[] {
  return getEvidenceItems();
}

export function get(_orgId: string, id: string): EvidenceItem | undefined {
  return getEvidenceItems().find((e) => e.id === id);
}

export function create(
  _orgId: string,
  data: {
    title: string;
    description?: string;
    source: "GITHUB" | "AWS" | "MANUAL" | "AI";
    controlIds?: string[];
    summary?: string;
  }
): EvidenceItem {
  return createEvidenceItem({
    title: data.title,
    description: data.description,
    source: data.source,
    controlIds: data.controlIds,
    summary: data.summary,
    reviewStatus: "NEEDS_REVIEW",
    collectedAt: new Date().toISOString(),
  });
}

export function update(
  _orgId: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    controlIds: string[];
    summary: string;
    reviewStatus: "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
  }>
): EvidenceItem | null {
  return updateEvidenceItem(id, data);
}

export function remove(_orgId: string, id: string): boolean {
  return deleteEvidenceItem(id);
}

export function approve(_orgId: string, id: string, userId: string): EvidenceItem | null {
  const item = updateEvidenceItem(id, {
    reviewStatus: "APPROVED",
  });

  if (item) {
    addAuditLog("evidence.approved", "evidence", id, userId, { title: item.title });
  }

  return item;
}

export function reject(
  _orgId: string,
  id: string,
  userId: string,
  reason?: string
): EvidenceItem | null {
  const item = updateEvidenceItem(id, {
    reviewStatus: "REJECTED",
  });

  if (item) {
    addAuditLog("evidence.rejected", "evidence", id, userId, { title: item.title, reason });
  }

  return item;
}

