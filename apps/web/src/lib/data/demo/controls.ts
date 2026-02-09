/**
 * Demo Controls Data Layer
 */

import { DEMO_CONTROLS, type DemoControl } from "@trustops/shared";
import { getEvidenceItems } from "@/lib/demo-store";

export function list(frameworkKey?: string): DemoControl[] {
  if (frameworkKey) {
    return DEMO_CONTROLS.filter((c) => c.frameworkKey === frameworkKey);
  }
  return DEMO_CONTROLS;
}

export function get(id: string): DemoControl | undefined {
  return DEMO_CONTROLS.find((c) => c.id === id);
}

export function getWithEvidence(_orgId: string, id: string) {
  const control = get(id);
  if (!control) return null;

  const evidenceItems = getEvidenceItems();
  const mappedEvidence = evidenceItems.filter(
    (e) => e.controlIds?.includes(id) && e.reviewStatus === "APPROVED"
  );

  return {
    ...control,
    evidence: mappedEvidence,
    status: mappedEvidence.length > 0 ? "COVERED" : "GAP",
  };
}

