/**
 * Export store for managing audit packet exports
 */

export type ExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AuditExport {
  id: string;
  name: string;
  frameworkKey: string;
  status: ExportStatus;
  filename?: string;
  sizeBytes?: number;
  controlCount: number;
  evidenceCount: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// In-memory store
let exports: AuditExport[] = [];
let nextExportId = 1;

/**
 * Get all exports
 */
export function getExports(): AuditExport[] {
  return exports.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get export by ID
 */
export function getExport(id: string): AuditExport | undefined {
  return exports.find((e) => e.id === id);
}

/**
 * Create a new export
 */
export function createExport(
  name: string,
  frameworkKey: string,
  controlCount: number,
  evidenceCount: number
): AuditExport {
  const exportItem: AuditExport = {
    id: `export-${nextExportId++}`,
    name,
    frameworkKey,
    status: "PENDING",
    controlCount,
    evidenceCount,
    createdAt: new Date().toISOString(),
  };
  exports.unshift(exportItem);
  return exportItem;
}

/**
 * Update export status
 */
export function updateExport(
  id: string,
  updates: Partial<AuditExport>
): AuditExport | null {
  const index = exports.findIndex((e) => e.id === id);
  if (index === -1) return null;

  exports[index] = { ...exports[index], ...updates };
  return exports[index];
}

/**
 * Set export processing
 */
export function setExportProcessing(id: string): AuditExport | null {
  return updateExport(id, { status: "PROCESSING" });
}

/**
 * Set export completed
 */
export function setExportCompleted(
  id: string,
  filename: string,
  sizeBytes: number
): AuditExport | null {
  return updateExport(id, {
    status: "COMPLETED",
    filename,
    sizeBytes,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Set export failed
 */
export function setExportFailed(id: string, error: string): AuditExport | null {
  return updateExport(id, {
    status: "FAILED",
    error,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Delete an export
 */
export function deleteExport(id: string): boolean {
  const index = exports.findIndex((e) => e.id === id);
  if (index === -1) return false;
  exports.splice(index, 1);
  return true;
}

