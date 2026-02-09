/**
 * Demo Frameworks Data Layer
 */

import { DEMO_FRAMEWORKS, DEMO_CONTROLS, type DemoFramework } from "@trustops/shared";
import { getEvidenceItems } from "@/lib/demo-store";

export function list(): DemoFramework[] {
  return DEMO_FRAMEWORKS;
}

export function get(key: string): DemoFramework | undefined {
  return DEMO_FRAMEWORKS.find((f) => f.key === key);
}

export function getStats(_orgId: string, frameworkKey: string) {
  const framework = get(frameworkKey);
  if (!framework) return null;

  const controls = DEMO_CONTROLS.filter((c) => c.frameworkKey === frameworkKey);
  const evidenceItems = getEvidenceItems();
  const approvedEvidence = evidenceItems.filter((e) => e.reviewStatus === "APPROVED");

  const coveredControls = controls.filter((control) =>
    approvedEvidence.some((e) => e.controlIds?.includes(control.id))
  );

  const totalControls = controls.length;
  const covered = coveredControls.length;
  const gaps = totalControls - covered;
  const coveragePercent = totalControls > 0 ? Math.round((covered / totalControls) * 100) : 0;

  return {
    framework: {
      key: framework.key,
      name: framework.name,
      version: framework.version,
    },
    totalControls,
    coveredControls: covered,
    gapCount: gaps,
    coveragePercent,
    evidenceCount: approvedEvidence.length,
  };
}

