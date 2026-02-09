/**
 * Audit Packet ZIP Generator
 * Creates ZIP files organized by framework/control with evidence files and JSON manifests
 */

import archiver from "archiver";
import { createWriteStream, existsSync, statSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { DEMO_CONTROLS, DEMO_FRAMEWORKS, type DemoControl } from "@trustops/shared";
import { getEvidenceItems, getEvidenceFiles } from "@/lib/demo-store";
import { getFilePath } from "@/lib/storage";
import {
  createExport,
  setExportProcessing,
  setExportCompleted,
  setExportFailed,
  type AuditExport,
} from "@/lib/exports-store";
import { addAuditLog } from "@/lib/demo-store";

const EXPORTS_DIR = path.join(process.cwd(), ".exports");

/**
 * Ensure exports directory exists
 */
async function ensureExportsDir() {
  if (!existsSync(EXPORTS_DIR)) {
    await mkdir(EXPORTS_DIR, { recursive: true });
  }
}

/**
 * Sanitize filename for filesystem
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}

/**
 * Generate control status summary
 */
function getControlStatus(control: DemoControl, evidenceItems: ReturnType<typeof getEvidenceItems>) {
  const mappedEvidence = evidenceItems.filter(
    (e) => e.controlIds?.includes(control.id) && e.reviewStatus === "APPROVED"
  );

  return {
    id: control.id,
    code: control.code,
    title: control.title,
    description: control.description,
    category: control.category,
    guidance: control.guidance,
    status: mappedEvidence.length > 0 ? "COVERED" : "GAP",
    evidenceCount: mappedEvidence.length,
    evidence: mappedEvidence.map((e) => ({
      id: e.id,
      title: e.title,
      source: e.source,
      collectedAt: e.collectedAt,
    })),
  };
}

/**
 * Generate audit packet ZIP for a framework
 */
export async function generateAuditPacket(frameworkKey: string): Promise<AuditExport> {
  await ensureExportsDir();

  const framework = DEMO_FRAMEWORKS.find((f) => f.key === frameworkKey);
  if (!framework) {
    throw new Error(`Framework not found: ${frameworkKey}`);
  }

  const controls = DEMO_CONTROLS.filter((c) => c.frameworkKey === frameworkKey);
  const evidenceItems = getEvidenceItems();
  const approvedEvidence = evidenceItems.filter((e) => e.reviewStatus === "APPROVED");

  // Get evidence relevant to this framework
  const frameworkEvidenceIds = new Set<string>();
  controls.forEach((control) => {
    approvedEvidence.forEach((evidence) => {
      if (evidence.controlIds?.includes(control.id)) {
        frameworkEvidenceIds.add(evidence.id);
      }
    });
  });
  const frameworkEvidence = approvedEvidence.filter((e) => frameworkEvidenceIds.has(e.id));

  // Create export record
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const exportName = `${framework.key}_Audit_Packet_${timestamp}`;
  const filename = `${sanitizeFilename(exportName)}.zip`;
  const filepath = path.join(EXPORTS_DIR, filename);

  const exportRecord = createExport(
    exportName,
    frameworkKey,
    controls.length,
    frameworkEvidence.length
  );

  try {
    setExportProcessing(exportRecord.id);

    // Create ZIP archive
    const output = createWriteStream(filepath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    const archivePromise = new Promise<void>((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
    });

    archive.pipe(output);

    // === 1. Add manifest.json ===
    const manifest = {
      exportId: exportRecord.id,
      exportName,
      generatedAt: new Date().toISOString(),
      framework: {
        key: framework.key,
        name: framework.name,
        version: framework.version,
      },
      summary: {
        totalControls: controls.length,
        coveredControls: controls.filter((c) =>
          frameworkEvidence.some((e) => e.controlIds?.includes(c.id))
        ).length,
        totalEvidence: frameworkEvidence.length,
        coveragePercent: Math.round(
          (controls.filter((c) =>
            frameworkEvidence.some((e) => e.controlIds?.includes(c.id))
          ).length /
            controls.length) *
            100
        ),
      },
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

    // === 2. Add controls.json ===
    const controlsData = controls.map((control) =>
      getControlStatus(control, evidenceItems)
    );
    archive.append(JSON.stringify(controlsData, null, 2), { name: "controls.json" });

    // === 3. Add evidence.json ===
    const evidenceData = frameworkEvidence.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      source: e.source,
      collectedAt: e.collectedAt,
      summary: e.summary,
      controlIds: e.controlIds,
    }));
    archive.append(JSON.stringify(evidenceData, null, 2), { name: "evidence.json" });

    // === 4. Add control-evidence-matrix.json ===
    const matrix = controls.map((control) => ({
      controlCode: control.code,
      controlTitle: control.title,
      status: frameworkEvidence.some((e) => e.controlIds?.includes(control.id))
        ? "COVERED"
        : "GAP",
      evidenceIds: frameworkEvidence
        .filter((e) => e.controlIds?.includes(control.id))
        .map((e) => e.id),
    }));
    archive.append(JSON.stringify(matrix, null, 2), {
      name: "control-evidence-matrix.json",
    });

    // === 5. Add controls folder with individual control files ===
    const categories = [...new Set(controls.map((c) => c.category))];
    for (const category of categories) {
      const categoryControls = controls.filter((c) => c.category === category);
      const categoryDir = `controls/${sanitizeFilename(category)}`;

      for (const control of categoryControls) {
        const controlData = getControlStatus(control, evidenceItems);
        archive.append(JSON.stringify(controlData, null, 2), {
          name: `${categoryDir}/${control.code}.json`,
        });
      }
    }

    // === 6. Add evidence folder with evidence details ===
    for (const evidence of frameworkEvidence) {
      const evidenceDir = `evidence/${evidence.id}`;

      // Add evidence metadata
      const evidenceMetadata = {
        ...evidence,
        files: getEvidenceFiles(evidence.id).map((f) => ({
          id: f.id,
          filename: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          sha256: f.sha256,
        })),
      };
      archive.append(JSON.stringify(evidenceMetadata, null, 2), {
        name: `${evidenceDir}/metadata.json`,
      });

      // Add actual evidence files
      const files = getEvidenceFiles(evidence.id);
      for (const file of files) {
        const filePath = getFilePath(file.filename);
        if (existsSync(filePath)) {
          archive.file(filePath, {
            name: `${evidenceDir}/files/${file.originalName}`,
          });
        }
      }
    }

    // === 7. Add README.md ===
    const readme = `# ${framework.name} Audit Packet

Generated: ${new Date().toISOString()}
Export ID: ${exportRecord.id}

## Summary

- **Framework**: ${framework.name} (${framework.version})
- **Total Controls**: ${controls.length}
- **Covered Controls**: ${manifest.summary.coveredControls}
- **Coverage**: ${manifest.summary.coveragePercent}%
- **Evidence Items**: ${frameworkEvidence.length}

## Contents

- \`manifest.json\` - Export metadata and summary
- \`controls.json\` - All controls with status and mapped evidence
- \`evidence.json\` - All evidence items included in this export
- \`control-evidence-matrix.json\` - Mapping matrix for auditors
- \`controls/\` - Individual control files organized by category
- \`evidence/\` - Evidence items with metadata and attached files

## Controls by Category

${categories
  .map((cat) => {
    const catControls = controls.filter((c) => c.category === cat);
    const covered = catControls.filter((c) =>
      frameworkEvidence.some((e) => e.controlIds?.includes(c.id))
    ).length;
    return `### ${cat}\n- ${covered}/${catControls.length} controls covered`;
  })
  .join("\n\n")}

## Generated by TrustOps

This audit packet was generated by TrustOps compliance automation platform.
`;
    archive.append(readme, { name: "README.md" });

    // Finalize archive
    await archive.finalize();
    await archivePromise;

    // Get file size
    const stats = statSync(filepath);

    // Update export record
    setExportCompleted(exportRecord.id, filename, stats.size);

    // Audit log
    addAuditLog(
      "export.generated",
      "audit_export",
      exportRecord.id,
      "demo@trustops.io",
      {
        framework: frameworkKey,
        controls: controls.length,
        evidence: frameworkEvidence.length,
        sizeBytes: stats.size,
      }
    );

    return getExportById(exportRecord.id)!;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    setExportFailed(exportRecord.id, errorMessage);
    throw error;
  }
}

/**
 * Get export by ID (helper)
 */
function getExportById(id: string): AuditExport | undefined {
  const { getExport } = require("@/lib/exports-store");
  return getExport(id);
}

/**
 * Get export file path
 */
export function getExportFilePath(filename: string): string {
  return path.join(EXPORTS_DIR, filename);
}

