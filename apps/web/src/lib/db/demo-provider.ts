/**
 * Demo Provider - In-memory data store for demo mode
 * This allows the UI to work without a database connection
 */

import {
  DEMO_FRAMEWORKS,
  DEMO_CONTROLS,
  DEMO_EVIDENCE_ITEMS,
  type DemoEvidenceItem,
} from "@trustops/shared";
import type {
  EvidenceItem,
  EvidenceFile,
  Framework,
  Control,
  AuditLogEntry,
  Integration,
  User,
  Org,
} from "./index";

// In-memory stores
let evidenceItems: DemoEvidenceItem[] = JSON.parse(JSON.stringify(DEMO_EVIDENCE_ITEMS));
let evidenceFiles: EvidenceFile[] = [];
let auditLogs: AuditLogEntry[] = [];
let nextEvidenceId = evidenceItems.length + 1;

// Demo integrations
const demoIntegrations: Integration[] = [
  {
    id: "int-github",
    orgId: "demo-org-1",
    provider: "GITHUB",
    name: "GitHub",
    status: "DISCONNECTED",
    config: {},
    lastSyncAt: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "int-aws",
    orgId: "demo-org-1",
    provider: "AWS",
    name: "AWS",
    status: "DISCONNECTED",
    config: {},
    lastSyncAt: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Convert demo evidence to full type
function toEvidenceItem(demo: DemoEvidenceItem, orgId: string): EvidenceItem {
  return {
    id: demo.id,
    orgId,
    title: demo.title,
    description: demo.description || null,
    source: demo.source,
    reviewStatus: demo.reviewStatus,
    collectedAt: new Date(demo.collectedAt),
    expiresAt: demo.expiresAt ? new Date(demo.expiresAt) : null,
    externalId: demo.externalId || null,
    summary: demo.summary || null,
    createdAt: new Date(demo.collectedAt),
    updatedAt: new Date(),
    controlIds: demo.controlIds,
    files: evidenceFiles.filter((f) => f.evidenceItemId === demo.id),
  };
}

// Convert demo control to full type
function toControl(demo: (typeof DEMO_CONTROLS)[0]): Control {
  const framework = DEMO_FRAMEWORKS.find((f) => f.key === demo.frameworkKey);
  return {
    id: demo.id,
    frameworkId: demo.frameworkKey,
    code: demo.code,
    title: demo.title,
    description: demo.description || null,
    category: demo.category,
    guidance: demo.guidance || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    framework: framework ? toFramework(framework) : undefined,
  };
}

// Convert demo framework to full type
function toFramework(demo: (typeof DEMO_FRAMEWORKS)[0]): Framework {
  return {
    id: demo.key,
    key: demo.key,
    name: demo.name,
    version: demo.version,
    description: demo.description || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Evidence functions
export async function getEvidenceItems(orgId: string): Promise<EvidenceItem[]> {
  return evidenceItems.map((e) => toEvidenceItem(e, orgId));
}

export async function getEvidenceItem(orgId: string, id: string): Promise<EvidenceItem | null> {
  const item = evidenceItems.find((e) => e.id === id);
  return item ? toEvidenceItem(item, orgId) : null;
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
  const newItem: DemoEvidenceItem = {
    id: `ev-${nextEvidenceId++}`,
    title: data.title,
    description: data.description,
    source: data.source,
    reviewStatus: "NEEDS_REVIEW",
    collectedAt: new Date().toISOString(),
    expiresAt: data.expiresAt?.toISOString(),
    externalId: data.externalId,
    summary: data.summary,
    controlIds: data.controlIds,
  };
  evidenceItems.unshift(newItem);
  return toEvidenceItem(newItem, orgId);
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
  const index = evidenceItems.findIndex((e) => e.id === id);
  if (index === -1) return null;

  evidenceItems[index] = { ...evidenceItems[index], ...data };
  return toEvidenceItem(evidenceItems[index], orgId);
}

export async function deleteEvidenceItem(orgId: string, id: string): Promise<boolean> {
  const index = evidenceItems.findIndex((e) => e.id === id);
  if (index === -1) return false;

  evidenceItems.splice(index, 1);
  evidenceFiles = evidenceFiles.filter((f) => f.evidenceItemId !== id);
  return true;
}

// Framework functions
export async function getFrameworks(): Promise<Framework[]> {
  return DEMO_FRAMEWORKS.map(toFramework);
}

export async function getFramework(key: string): Promise<Framework | null> {
  const framework = DEMO_FRAMEWORKS.find((f) => f.key === key);
  if (!framework) return null;
  
  const fw = toFramework(framework);
  fw.controls = DEMO_CONTROLS.filter((c) => c.frameworkKey === key).map(toControl);
  return fw;
}

// Control functions
export async function getControls(frameworkKey?: string): Promise<Control[]> {
  const controls = frameworkKey
    ? DEMO_CONTROLS.filter((c) => c.frameworkKey === frameworkKey)
    : DEMO_CONTROLS;
  return controls.map(toControl);
}

export async function getControl(id: string): Promise<Control | null> {
  const control = DEMO_CONTROLS.find((c) => c.id === id);
  return control ? toControl(control) : null;
}

// Audit log functions
export async function getAuditLogs(orgId: string, limit = 50): Promise<AuditLogEntry[]> {
  return auditLogs.slice(0, limit);
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
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    orgId,
    actorUserId: data.actorUserId || null,
    action: data.action,
    targetType: data.targetType || null,
    targetId: data.targetId || null,
    ip: data.ip || null,
    userAgent: data.userAgent || null,
    metadata: data.metadata || null,
    createdAt: new Date(),
  };
  auditLogs.unshift(entry);
  return entry;
}

// Integration functions
export async function getIntegrations(orgId: string): Promise<Integration[]> {
  return demoIntegrations;
}

export async function getIntegration(orgId: string, id: string): Promise<Integration | null> {
  return demoIntegrations.find((i) => i.id === id) || null;
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
  const index = demoIntegrations.findIndex((i) => i.id === id);
  if (index === -1) return null;

  demoIntegrations[index] = {
    ...demoIntegrations[index],
    ...data,
    updatedAt: new Date(),
  };
  return demoIntegrations[index];
}

// Coverage stats
export async function getCoverageStats(orgId: string) {
  const controlIds = new Set<string>();
  evidenceItems
    .filter((e) => e.reviewStatus === "APPROVED")
    .forEach((e) => {
      e.controlIds?.forEach((id) => controlIds.add(id));
    });

  const totalControls = DEMO_CONTROLS.length;
  const coveredControls = controlIds.size;
  const coveragePercent = Math.round((coveredControls / totalControls) * 100);

  // Calculate expiring evidence
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringEvidence = evidenceItems.filter((e) => {
    if (!e.expiresAt) return false;
    const expires = new Date(e.expiresAt);
    return expires > now && expires <= thirtyDaysFromNow;
  });

  return {
    totalControls,
    coveredControls,
    uncoveredControls: totalControls - coveredControls,
    coveragePercent,
    totalEvidence: evidenceItems.length,
    approvedEvidence: evidenceItems.filter((e) => e.reviewStatus === "APPROVED").length,
    pendingEvidence: evidenceItems.filter((e) => e.reviewStatus === "NEEDS_REVIEW").length,
    rejectedEvidence: evidenceItems.filter((e) => e.reviewStatus === "REJECTED").length,
    expiringEvidence: expiringEvidence.length,
    frameworkStats: DEMO_FRAMEWORKS.map((f) => {
      const frameworkControls = DEMO_CONTROLS.filter((c) => c.frameworkKey === f.key);
      const coveredFrameworkControls = frameworkControls.filter((c) =>
        controlIds.has(c.id)
      ).length;
      return {
        key: f.key,
        name: f.name,
        version: f.version,
        totalControls: frameworkControls.length,
        coveredControls: coveredFrameworkControls,
        coveragePercent: Math.round(
          (coveredFrameworkControls / frameworkControls.length) * 100
        ),
      };
    }),
  };
}

// User functions
export async function getUser(id: string): Promise<User | null> {
  return {
    id: "demo-user-1",
    name: "Demo User",
    email: "demo@trustops.app",
    image: null,
    defaultOrgId: "demo-org-1",
  };
}

export async function getOrg(id: string): Promise<Org | null> {
  return {
    id: "demo-org-1",
    name: "Demo Organization",
    slug: "demo",
  };
}

// File functions
export async function addEvidenceFile(file: EvidenceFile): Promise<void> {
  evidenceFiles.push(file);
}

export async function getEvidenceFiles(evidenceItemId: string): Promise<EvidenceFile[]> {
  return evidenceFiles.filter((f) => f.evidenceItemId === evidenceItemId);
}

// Reset function for testing
export function resetDemoData(): void {
  evidenceItems = JSON.parse(JSON.stringify(DEMO_EVIDENCE_ITEMS));
  evidenceFiles = [];
  auditLogs = [];
  nextEvidenceId = evidenceItems.length + 1;
}





