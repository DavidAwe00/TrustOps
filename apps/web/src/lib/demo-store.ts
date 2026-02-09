/**
 * In-memory store for demo mode
 * Persists data during the server session (resets on restart)
 */

import { DEMO_EVIDENCE_ITEMS, DEMO_CONTROLS, type DemoEvidenceItem } from "@trustops/shared";

export interface EvidenceFile {
  id: string;
  evidenceItemId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  storedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorEmail: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Initialize with demo data (deep clone to allow mutations)
let evidenceItems: DemoEvidenceItem[] = JSON.parse(JSON.stringify(DEMO_EVIDENCE_ITEMS));
let evidenceFiles: EvidenceFile[] = [];
let auditLogs: AuditLogEntry[] = [];
let nextEvidenceId = evidenceItems.length + 1;

/**
 * Get all evidence items
 */
export function getEvidenceItems(): DemoEvidenceItem[] {
  return evidenceItems;
}

/**
 * Get evidence item by ID
 */
export function getEvidenceItem(id: string): DemoEvidenceItem | undefined {
  return evidenceItems.find((e) => e.id === id);
}

/**
 * Create a new evidence item
 */
export function createEvidenceItem(
  data: Omit<DemoEvidenceItem, "id">
): DemoEvidenceItem {
  const item: DemoEvidenceItem = {
    id: `ev-${nextEvidenceId++}`,
    ...data,
  };
  evidenceItems.unshift(item); // Add to beginning
  return item;
}

/**
 * Update an evidence item
 */
export function updateEvidenceItem(
  id: string,
  updates: Partial<DemoEvidenceItem>
): DemoEvidenceItem | null {
  const index = evidenceItems.findIndex((e) => e.id === id);
  if (index === -1) return null;
  
  evidenceItems[index] = { ...evidenceItems[index], ...updates };
  return evidenceItems[index];
}

/**
 * Delete an evidence item
 */
export function deleteEvidenceItem(id: string): boolean {
  const index = evidenceItems.findIndex((e) => e.id === id);
  if (index === -1) return false;
  
  evidenceItems.splice(index, 1);
  // Also delete associated files
  evidenceFiles = evidenceFiles.filter((f) => f.evidenceItemId !== id);
  return true;
}

/**
 * Get files for an evidence item
 */
export function getEvidenceFiles(evidenceItemId: string): EvidenceFile[] {
  return evidenceFiles.filter((f) => f.evidenceItemId === evidenceItemId);
}

/**
 * Add a file to an evidence item
 */
export function addEvidenceFile(file: EvidenceFile): void {
  evidenceFiles.push(file);
}

/**
 * Get all audit logs
 */
export function getAuditLogs(): AuditLogEntry[] {
  return auditLogs;
}

/**
 * Add an audit log entry
 */
export function addAuditLog(
  action: string,
  targetType: string,
  targetId: string,
  actorEmail: string,
  metadata?: Record<string, unknown>
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    action,
    targetType,
    targetId,
    actorEmail,
    metadata,
    createdAt: new Date().toISOString(),
  };
  auditLogs.unshift(entry);
  return entry;
}

/**
 * Get control by ID
 */
export function getControl(id: string) {
  return DEMO_CONTROLS.find((c) => c.id === id);
}

/**
 * Get controls mapped to an evidence item
 */
export function getMappedControls(evidenceItemId: string) {
  const item = getEvidenceItem(evidenceItemId);
  if (!item?.controlIds) return [];
  return DEMO_CONTROLS.filter((c) => item.controlIds?.includes(c.id));
}

/**
 * Calculate coverage stats
 */
export function getCoverageStats() {
  const controlIds = new Set<string>();
  evidenceItems
    .filter((e) => e.reviewStatus === "APPROVED")
    .forEach((e) => {
      e.controlIds?.forEach((id) => controlIds.add(id));
    });

  const totalControls = DEMO_CONTROLS.length;
  const coveredControls = controlIds.size;
  const coveragePercent = Math.round((coveredControls / totalControls) * 100);

  return {
    totalControls,
    coveredControls,
    uncoveredControls: totalControls - coveredControls,
    coveragePercent,
    totalEvidence: evidenceItems.length,
    approvedEvidence: evidenceItems.filter((e) => e.reviewStatus === "APPROVED").length,
    pendingEvidence: evidenceItems.filter((e) => e.reviewStatus === "NEEDS_REVIEW").length,
    rejectedEvidence: evidenceItems.filter((e) => e.reviewStatus === "REJECTED").length,
  };
}

/**
 * Reset to initial demo data (useful for testing)
 */
export function resetDemoData(): void {
  evidenceItems = JSON.parse(JSON.stringify(DEMO_EVIDENCE_ITEMS));
  evidenceFiles = [];
  auditLogs = [];
  nextEvidenceId = evidenceItems.length + 1;
}

