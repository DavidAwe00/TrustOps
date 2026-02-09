/**
 * Database Service Layer
 * Provides a unified API that works with both demo mode (in-memory) and production (Prisma)
 */

import { isDemo } from "@/lib/demo";

// Re-export Prisma client for direct access when needed
export { prisma } from "@trustops/db";

// Types that match both demo and Prisma
export interface EvidenceItem {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  source: "MANUAL" | "GITHUB" | "AWS" | "AI";
  reviewStatus: "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
  collectedAt: Date;
  expiresAt: Date | null;
  externalId: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  files?: EvidenceFile[];
  controlIds?: string[];
}

export interface EvidenceFile {
  id: string;
  orgId: string;
  evidenceItemId: string | null;
  filename: string;
  storageKey: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sha256: string | null;
  summary: string | null;
  reviewStatus: "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

export interface Control {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  guidance: string | null;
  createdAt: Date;
  updatedAt: Date;
  framework?: Framework;
}

export interface Framework {
  id: string;
  key: string;
  name: string;
  version: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  controls?: Control[];
}

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Integration {
  id: string;
  orgId: string;
  provider: "GITHUB" | "AWS";
  name: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  config: Record<string, unknown>;
  lastSyncAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  defaultOrgId: string | null;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
}

// Service functions - these check demo mode and route to the right implementation
export async function getEvidenceItems(orgId: string): Promise<EvidenceItem[]> {
  if (isDemo()) {
    const { getEvidenceItems: getDemoItems } = await import("./demo-provider");
    return getDemoItems(orgId);
  }
  const { getEvidenceItems: getPrismaItems } = await import("./prisma-provider");
  return getPrismaItems(orgId);
}

export async function getEvidenceItem(orgId: string, id: string): Promise<EvidenceItem | null> {
  if (isDemo()) {
    const { getEvidenceItem: getDemoItem } = await import("./demo-provider");
    return getDemoItem(orgId, id);
  }
  const { getEvidenceItem: getPrismaItem } = await import("./prisma-provider");
  return getPrismaItem(orgId, id);
}

export async function createEvidenceItem(
  orgId: string,
  data: {
    title: string;
    description?: string;
    source: "MANUAL" | "GITHUB" | "AWS" | "AI";
    controlIds?: string[];
    summary?: string;
    externalId?: string;
    expiresAt?: Date;
  }
): Promise<EvidenceItem> {
  if (isDemo()) {
    const { createEvidenceItem: createDemoItem } = await import("./demo-provider");
    return createDemoItem(orgId, data);
  }
  const { createEvidenceItem: createPrismaItem } = await import("./prisma-provider");
  return createPrismaItem(orgId, data);
}

export async function updateEvidenceItem(
  orgId: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    summary: string;
    reviewStatus: "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
    controlIds: string[];
  }>
): Promise<EvidenceItem | null> {
  if (isDemo()) {
    const { updateEvidenceItem: updateDemoItem } = await import("./demo-provider");
    return updateDemoItem(orgId, id, data);
  }
  const { updateEvidenceItem: updatePrismaItem } = await import("./prisma-provider");
  return updatePrismaItem(orgId, id, data);
}

export async function deleteEvidenceItem(orgId: string, id: string): Promise<boolean> {
  if (isDemo()) {
    const { deleteEvidenceItem: deleteDemoItem } = await import("./demo-provider");
    return deleteDemoItem(orgId, id);
  }
  const { deleteEvidenceItem: deletePrismaItem } = await import("./prisma-provider");
  return deletePrismaItem(orgId, id);
}

export async function getFrameworks(): Promise<Framework[]> {
  if (isDemo()) {
    const { getFrameworks: getDemoFrameworks } = await import("./demo-provider");
    return getDemoFrameworks();
  }
  const { getFrameworks: getPrismaFrameworks } = await import("./prisma-provider");
  return getPrismaFrameworks();
}

export async function getFramework(key: string): Promise<Framework | null> {
  if (isDemo()) {
    const { getFramework: getDemoFramework } = await import("./demo-provider");
    return getDemoFramework(key);
  }
  const { getFramework: getPrismaFramework } = await import("./prisma-provider");
  return getPrismaFramework(key);
}

export async function getControls(frameworkKey?: string): Promise<Control[]> {
  if (isDemo()) {
    const { getControls: getDemoControls } = await import("./demo-provider");
    return getDemoControls(frameworkKey);
  }
  const { getControls: getPrismaControls } = await import("./prisma-provider");
  return getPrismaControls(frameworkKey);
}

export async function getControl(id: string): Promise<Control | null> {
  if (isDemo()) {
    const { getControl: getDemoControl } = await import("./demo-provider");
    return getDemoControl(id);
  }
  const { getControl: getPrismaControl } = await import("./prisma-provider");
  return getPrismaControl(id);
}

export async function getAuditLogs(orgId: string, limit?: number): Promise<AuditLogEntry[]> {
  if (isDemo()) {
    const { getAuditLogs: getDemoLogs } = await import("./demo-provider");
    return getDemoLogs(orgId, limit);
  }
  const { getAuditLogs: getPrismaLogs } = await import("./prisma-provider");
  return getPrismaLogs(orgId, limit);
}

export async function createAuditLog(
  orgId: string,
  data: {
    actorUserId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AuditLogEntry> {
  if (isDemo()) {
    const { createAuditLog: createDemoLog } = await import("./demo-provider");
    return createDemoLog(orgId, data);
  }
  const { createAuditLog: createPrismaLog } = await import("./prisma-provider");
  return createPrismaLog(orgId, data);
}

export async function getIntegrations(orgId: string): Promise<Integration[]> {
  if (isDemo()) {
    const { getIntegrations: getDemoIntegrations } = await import("./demo-provider");
    return getDemoIntegrations(orgId);
  }
  const { getIntegrations: getPrismaIntegrations } = await import("./prisma-provider");
  return getPrismaIntegrations(orgId);
}

export async function getIntegration(orgId: string, id: string): Promise<Integration | null> {
  if (isDemo()) {
    const { getIntegration: getDemoIntegration } = await import("./demo-provider");
    return getDemoIntegration(orgId, id);
  }
  const { getIntegration: getPrismaIntegration } = await import("./prisma-provider");
  return getPrismaIntegration(orgId, id);
}

export async function updateIntegration(
  orgId: string,
  id: string,
  data: Partial<{
    status: "CONNECTED" | "DISCONNECTED" | "ERROR";
    config: Record<string, unknown>;
    lastSyncAt: Date;
    lastError: string | null;
  }>
): Promise<Integration | null> {
  if (isDemo()) {
    const { updateIntegration: updateDemoIntegration } = await import("./demo-provider");
    return updateDemoIntegration(orgId, id, data);
  }
  const { updateIntegration: updatePrismaIntegration } = await import("./prisma-provider");
  return updatePrismaIntegration(orgId, id, data);
}

export async function getCoverageStats(orgId: string) {
  if (isDemo()) {
    const { getCoverageStats: getDemoStats } = await import("./demo-provider");
    return getDemoStats(orgId);
  }
  const { getCoverageStats: getPrismaStats } = await import("./prisma-provider");
  return getPrismaStats(orgId);
}

export async function getUser(id: string): Promise<User | null> {
  if (isDemo()) {
    const { getUser: getDemoUser } = await import("./demo-provider");
    return getDemoUser(id);
  }
  const { getUser: getPrismaUser } = await import("./prisma-provider");
  return getPrismaUser(id);
}

export async function getOrg(id: string): Promise<Org | null> {
  if (isDemo()) {
    const { getOrg: getDemoOrg } = await import("./demo-provider");
    return getDemoOrg(id);
  }
  const { getOrg: getPrismaOrg } = await import("./prisma-provider");
  return getPrismaOrg(id);
}





