/**
 * Prisma Provider - Real database operations
 * This is used in production when TRUSTOPS_DEMO is not set
 */

import { prisma } from "@trustops/db";
import type {
  EvidenceItem,
  Framework,
  Control,
  AuditLogEntry,
  Integration,
  User,
  Org,
} from "./index";

// Evidence functions
export async function getEvidenceItems(orgId: string): Promise<EvidenceItem[]> {
  const items = await prisma.evidenceItem.findMany({
    where: { orgId },
    include: {
      files: true,
      mappings: {
        include: { control: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    ...item,
    source: item.source as "MANUAL" | "GITHUB" | "AWS" | "AI",
    reviewStatus: item.reviewStatus as "NEEDS_REVIEW" | "APPROVED" | "REJECTED",
    controlIds: item.mappings.map((m) => m.controlId),
  }));
}

export async function getEvidenceItem(
  orgId: string,
  id: string
): Promise<EvidenceItem | null> {
  const item = await prisma.evidenceItem.findFirst({
    where: { id, orgId },
    include: {
      files: true,
      mappings: {
        include: { control: true },
      },
    },
  });

  if (!item) return null;

  return {
    ...item,
    source: item.source as "MANUAL" | "GITHUB" | "AWS" | "AI",
    reviewStatus: item.reviewStatus as "NEEDS_REVIEW" | "APPROVED" | "REJECTED",
    controlIds: item.mappings.map((m) => m.controlId),
  };
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
  const item = await prisma.evidenceItem.create({
    data: {
      orgId,
      title: data.title,
      description: data.description,
      source: data.source,
      reviewStatus: "NEEDS_REVIEW",
      summary: data.summary,
      externalId: data.externalId,
      expiresAt: data.expiresAt,
      collectedAt: new Date(),
      // Create control mappings
      mappings: data.controlIds?.length
        ? {
            create: data.controlIds.map((controlId) => ({
              orgId,
              controlId,
            })),
          }
        : undefined,
    },
    include: {
      files: true,
      mappings: true,
    },
  });

  return {
    ...item,
    source: item.source as "MANUAL" | "GITHUB" | "AWS" | "AI",
    reviewStatus: item.reviewStatus as "NEEDS_REVIEW" | "APPROVED" | "REJECTED",
    controlIds: item.mappings.map((m) => m.controlId),
  };
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
  // If controlIds is being updated, we need to handle mappings
  if (data.controlIds) {
    // Delete existing mappings
    await prisma.controlEvidence.deleteMany({
      where: { evidenceItemId: id, orgId },
    });

    // Create new mappings
    if (data.controlIds.length > 0) {
      await prisma.controlEvidence.createMany({
        data: data.controlIds.map((controlId) => ({
          orgId,
          controlId,
          evidenceItemId: id,
        })),
      });
    }
  }

  const { controlIds, ...updateData } = data;

  const item = await prisma.evidenceItem.update({
    where: { id },
    data: updateData,
    include: {
      files: true,
      mappings: true,
    },
  });

  return {
    ...item,
    source: item.source as "MANUAL" | "GITHUB" | "AWS" | "AI",
    reviewStatus: item.reviewStatus as "NEEDS_REVIEW" | "APPROVED" | "REJECTED",
    controlIds: item.mappings.map((m) => m.controlId),
  };
}

export async function deleteEvidenceItem(orgId: string, id: string): Promise<boolean> {
  try {
    await prisma.evidenceItem.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// Framework functions
export async function getFrameworks(): Promise<Framework[]> {
  const frameworks = await prisma.framework.findMany({
    orderBy: { name: "asc" },
  });

  return frameworks;
}

export async function getFramework(key: string): Promise<Framework | null> {
  const framework = await prisma.framework.findUnique({
    where: { key },
    include: {
      controls: {
        orderBy: { code: "asc" },
      },
    },
  });

  return framework;
}

// Control functions
export async function getControls(frameworkKey?: string): Promise<Control[]> {
  const where = frameworkKey
    ? { framework: { key: frameworkKey } }
    : undefined;

  const controls = await prisma.control.findMany({
    where,
    include: { framework: true },
    orderBy: { code: "asc" },
  });

  return controls;
}

export async function getControl(id: string): Promise<Control | null> {
  const control = await prisma.control.findUnique({
    where: { id },
    include: { framework: true },
  });

  return control;
}

// Audit log functions
export async function getAuditLogs(orgId: string, limit = 50): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    ...log,
    metadata: log.metadata as Record<string, unknown> | null,
  }));
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
  const log = await prisma.auditLog.create({
    data: {
      orgId,
      actorUserId: data.actorUserId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      ip: data.ip,
      userAgent: data.userAgent,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
    },
  });

  return {
    ...log,
    metadata: log.metadata as Record<string, unknown> | null,
  };
}

// Integration functions
export async function getIntegrations(orgId: string): Promise<Integration[]> {
  const integrations = await prisma.integration.findMany({
    where: { orgId },
    orderBy: { name: "asc" },
  });

  return integrations.map((i) => ({
    ...i,
    provider: i.provider as "GITHUB" | "AWS",
    status: i.status as "CONNECTED" | "DISCONNECTED" | "ERROR",
    config: i.config as Record<string, unknown>,
  }));
}

export async function getIntegration(
  orgId: string,
  id: string
): Promise<Integration | null> {
  const integration = await prisma.integration.findFirst({
    where: { id, orgId },
  });

  if (!integration) return null;

  return {
    ...integration,
    provider: integration.provider as "GITHUB" | "AWS",
    status: integration.status as "CONNECTED" | "DISCONNECTED" | "ERROR",
    config: integration.config as Record<string, unknown>,
  };
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
  try {
    // Convert config to JSON-compatible format for Prisma
    const updateData: Record<string, unknown> = { ...data };
    if (data.config) {
      updateData.config = JSON.parse(JSON.stringify(data.config));
    }
    
    const integration = await prisma.integration.update({
      where: { id },
      data: updateData,
    });

    return {
      ...integration,
      provider: integration.provider as "GITHUB" | "AWS",
      status: integration.status as "CONNECTED" | "DISCONNECTED" | "ERROR",
      config: integration.config as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

// Coverage stats
export async function getCoverageStats(orgId: string) {
  // Get all controls
  const controls = await prisma.control.findMany({
    include: { framework: true },
  });

  // Get all approved evidence with mappings
  const approvedEvidence = await prisma.evidenceItem.findMany({
    where: { orgId, reviewStatus: "APPROVED" },
    include: { mappings: true },
  });

  // Get all evidence counts by status
  const evidenceCounts = await prisma.evidenceItem.groupBy({
    by: ["reviewStatus"],
    where: { orgId },
    _count: true,
  });

  // Calculate covered controls
  const coveredControlIds = new Set<string>();
  approvedEvidence.forEach((e) => {
    e.mappings.forEach((m) => coveredControlIds.add(m.controlId));
  });

  // Calculate expiring evidence
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCount = await prisma.evidenceItem.count({
    where: {
      orgId,
      expiresAt: {
        gt: now,
        lte: thirtyDaysFromNow,
      },
    },
  });

  const totalControls = controls.length;
  const coveredControls = coveredControlIds.size;

  // Calculate framework stats
  const frameworks = await prisma.framework.findMany();
  const frameworkStats = frameworks.map((f) => {
    const frameworkControls = controls.filter((c) => c.frameworkId === f.id);
    const coveredFrameworkControls = frameworkControls.filter((c) =>
      coveredControlIds.has(c.id)
    ).length;
    return {
      key: f.key,
      name: f.name,
      version: f.version,
      totalControls: frameworkControls.length,
      coveredControls: coveredFrameworkControls,
      coveragePercent:
        frameworkControls.length > 0
          ? Math.round((coveredFrameworkControls / frameworkControls.length) * 100)
          : 0,
    };
  });

  return {
    totalControls,
    coveredControls,
    uncoveredControls: totalControls - coveredControls,
    coveragePercent:
      totalControls > 0 ? Math.round((coveredControls / totalControls) * 100) : 0,
    totalEvidence: evidenceCounts.reduce((sum, e) => sum + e._count, 0),
    approvedEvidence:
      evidenceCounts.find((e) => e.reviewStatus === "APPROVED")?._count || 0,
    pendingEvidence:
      evidenceCounts.find((e) => e.reviewStatus === "NEEDS_REVIEW")?._count || 0,
    rejectedEvidence:
      evidenceCounts.find((e) => e.reviewStatus === "REJECTED")?._count || 0,
    expiringEvidence: expiringCount,
    frameworkStats,
  };
}

// User functions
export async function getUser(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  return user;
}

export async function getOrg(id: string): Promise<Org | null> {
  const org = await prisma.org.findUnique({
    where: { id },
  });

  return org;
}

// File functions
export async function addEvidenceFile(data: {
  orgId: string;
  evidenceItemId: string;
  filename: string;
  storageKey: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
}) {
  return prisma.evidenceFile.create({
    data: {
      orgId: data.orgId,
      evidenceItemId: data.evidenceItemId,
      filename: data.filename,
      storageKey: data.storageKey,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      sha256: data.sha256,
      reviewStatus: "NEEDS_REVIEW",
    },
  });
}

export async function getEvidenceFiles(evidenceItemId: string) {
  return prisma.evidenceFile.findMany({
    where: { evidenceItemId },
  });
}





