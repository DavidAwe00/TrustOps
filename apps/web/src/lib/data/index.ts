/**
 * Data Layer
 * Abstracts between demo mode (in-memory) and production (Prisma)
 * 
 * Usage:
 *   import { data } from '@/lib/data';
 *   const items = await data.evidence.list(orgId);
 */

import { isDemo } from "@/lib/demo";

// Demo implementations
import * as demoEvidence from "./demo/evidence";
import * as demoControls from "./demo/controls";
import * as demoFrameworks from "./demo/frameworks";
import * as demoAuditLogs from "./demo/audit-logs";

// Prisma implementations (lazy loaded)
async function getPrismaEvidence() {
  return import("./prisma/evidence");
}
async function getPrismaControls() {
  return import("./prisma/controls");
}
async function getPrismaFrameworks() {
  return import("./prisma/frameworks");
}
async function getPrismaAuditLogs() {
  return import("./prisma/audit-logs");
}

/**
 * Data access object with consistent interface
 */
export const data = {
  evidence: {
    async list(orgId: string) {
      if (isDemo()) return demoEvidence.list(orgId);
      const mod = await getPrismaEvidence();
      return mod.list(orgId);
    },
    async get(orgId: string, id: string) {
      if (isDemo()) return demoEvidence.get(orgId, id);
      const mod = await getPrismaEvidence();
      return mod.get(orgId, id);
    },
    async create(orgId: string, data: Parameters<typeof demoEvidence.create>[1]) {
      if (isDemo()) return demoEvidence.create(orgId, data);
      const mod = await getPrismaEvidence();
      return mod.create(orgId, data);
    },
    async update(orgId: string, id: string, data: Parameters<typeof demoEvidence.update>[2]) {
      if (isDemo()) return demoEvidence.update(orgId, id, data);
      const mod = await getPrismaEvidence();
      return mod.update(orgId, id, data);
    },
    async delete(orgId: string, id: string) {
      if (isDemo()) return demoEvidence.remove(orgId, id);
      const mod = await getPrismaEvidence();
      return mod.remove(orgId, id);
    },
    async approve(orgId: string, id: string, userId: string) {
      if (isDemo()) return demoEvidence.approve(orgId, id, userId);
      const mod = await getPrismaEvidence();
      return mod.approve(orgId, id, userId);
    },
    async reject(orgId: string, id: string, userId: string, reason?: string) {
      if (isDemo()) return demoEvidence.reject(orgId, id, userId, reason);
      const mod = await getPrismaEvidence();
      return mod.reject(orgId, id, userId, reason);
    },
  },

  controls: {
    async list(frameworkKey?: string) {
      if (isDemo()) return demoControls.list(frameworkKey);
      const mod = await getPrismaControls();
      return mod.list(frameworkKey);
    },
    async get(id: string) {
      if (isDemo()) return demoControls.get(id);
      const mod = await getPrismaControls();
      return mod.get(id);
    },
    async getWithEvidence(orgId: string, id: string) {
      if (isDemo()) return demoControls.getWithEvidence(orgId, id);
      const mod = await getPrismaControls();
      return mod.getWithEvidence(orgId, id);
    },
  },

  frameworks: {
    async list() {
      if (isDemo()) return demoFrameworks.list();
      const mod = await getPrismaFrameworks();
      return mod.list();
    },
    async get(key: string) {
      if (isDemo()) return demoFrameworks.get(key);
      const mod = await getPrismaFrameworks();
      return mod.get(key);
    },
    async getStats(orgId: string, frameworkKey: string) {
      if (isDemo()) return demoFrameworks.getStats(orgId, frameworkKey);
      const mod = await getPrismaFrameworks();
      return mod.getStats(orgId, frameworkKey);
    },
  },

  auditLogs: {
    async list(orgId: string, limit?: number) {
      if (isDemo()) return demoAuditLogs.list(orgId, limit);
      const mod = await getPrismaAuditLogs();
      return mod.list(orgId, limit);
    },
    async add(orgId: string, data: Parameters<typeof demoAuditLogs.add>[1]) {
      if (isDemo()) return demoAuditLogs.add(orgId, data);
      const mod = await getPrismaAuditLogs();
      return mod.add(orgId, data);
    },
  },
};

export type DataLayer = typeof data;

