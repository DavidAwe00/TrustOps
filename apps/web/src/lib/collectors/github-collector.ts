/**
 * GitHub Collector
 * Fetches repository settings, branch protections, and security features
 */

import { createEvidenceItem, addAuditLog } from "@/lib/demo-store";
import {
  getIntegrationByProvider,
  setIntegrationSyncing,
  setIntegrationSyncComplete,
  type GitHubConfig,
  type SyncResult,
} from "@/lib/integrations-store";

interface GitHubRepo {
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  branchProtection: {
    enabled: boolean;
    requiredReviewers: number;
    requireStatusChecks: boolean;
    enforceAdmins: boolean;
  };
  securityFeatures: {
    dependabot: boolean;
    secretScanning: boolean;
    codeScanning: boolean;
  };
}

/**
 * Fetch GitHub data (mock implementation)
 * In production, this would use the GitHub API with the access token
 */
async function fetchGitHubData(config: GitHubConfig): Promise<GitHubRepo[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock data representing what we'd get from GitHub API
  const mockRepos: GitHubRepo[] = [
    {
      name: "main-app",
      fullName: `${config.org || "acme"}/main-app`,
      defaultBranch: "main",
      private: true,
      branchProtection: {
        enabled: true,
        requiredReviewers: 2,
        requireStatusChecks: true,
        enforceAdmins: false,
      },
      securityFeatures: {
        dependabot: true,
        secretScanning: true,
        codeScanning: true,
      },
    },
    {
      name: "api-service",
      fullName: `${config.org || "acme"}/api-service`,
      defaultBranch: "main",
      private: true,
      branchProtection: {
        enabled: true,
        requiredReviewers: 1,
        requireStatusChecks: true,
        enforceAdmins: true,
      },
      securityFeatures: {
        dependabot: true,
        secretScanning: true,
        codeScanning: false,
      },
    },
    {
      name: "infrastructure",
      fullName: `${config.org || "acme"}/infrastructure`,
      defaultBranch: "main",
      private: true,
      branchProtection: {
        enabled: true,
        requiredReviewers: 2,
        requireStatusChecks: true,
        enforceAdmins: true,
      },
      securityFeatures: {
        dependabot: true,
        secretScanning: true,
        codeScanning: true,
      },
    },
  ];

  return mockRepos;
}

/**
 * Generate evidence summary from repo data
 */
function generateRepoSummary(repo: GitHubRepo): string {
  const bp = repo.branchProtection;
  const sf = repo.securityFeatures;

  const protectionStatus = bp.enabled
    ? `Branch protection enabled: ${bp.requiredReviewers} reviewer(s) required, status checks ${bp.requireStatusChecks ? "enabled" : "disabled"}`
    : "Branch protection NOT enabled";

  const securityStatus = [
    sf.dependabot ? "Dependabot enabled" : "Dependabot disabled",
    sf.secretScanning ? "Secret scanning enabled" : "Secret scanning disabled",
    sf.codeScanning ? "Code scanning enabled" : "Code scanning disabled",
  ].join(", ");

  return `${protectionStatus}. Security features: ${securityStatus}.`;
}

/**
 * Map GitHub evidence to controls
 */
function mapToControls(repo: GitHubRepo): string[] {
  const controlIds: string[] = [];

  // Branch protection maps to change management controls
  if (repo.branchProtection.enabled) {
    controlIds.push("soc2-cc8-1"); // Change Management
    if (repo.branchProtection.requiredReviewers >= 1) {
      controlIds.push("soc2-cc6-1"); // Logical Access
    }
  }

  // Security features map to vulnerability management
  if (repo.securityFeatures.dependabot) {
    controlIds.push("iso-a-8-8"); // Technical Vulnerabilities
  }

  return controlIds;
}

/**
 * Run GitHub collector
 */
export async function runGitHubCollector(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let evidenceCreated = 0;

  const integration = getIntegrationByProvider("GITHUB");
  if (!integration || integration.status === "DISCONNECTED") {
    return {
      success: false,
      evidenceCreated: 0,
      errors: ["GitHub integration not connected"],
      duration: Date.now() - startTime,
    };
  }

  try {
    setIntegrationSyncing(integration.id);

    const config = integration.config as GitHubConfig;
    const repos = await fetchGitHubData(config);

    for (const repo of repos) {
      try {
        // Create branch protection evidence
        createEvidenceItem({
          title: `Branch Protection: ${repo.fullName}`,
          description: `Branch protection rules for ${repo.defaultBranch} branch`,
          source: "GITHUB",
          reviewStatus: "NEEDS_REVIEW",
          collectedAt: new Date().toISOString(),
          externalId: `${repo.fullName}/${repo.defaultBranch}`,
          summary: generateRepoSummary(repo),
          controlIds: mapToControls(repo),
        });
        evidenceCreated++;

        // Create security features evidence if all enabled
        if (
          repo.securityFeatures.dependabot &&
          repo.securityFeatures.secretScanning
        ) {
          createEvidenceItem({
            title: `Security Features: ${repo.fullName}`,
            description: `GitHub security features configuration`,
            source: "GITHUB",
            reviewStatus: "NEEDS_REVIEW",
            collectedAt: new Date().toISOString(),
            externalId: `${repo.fullName}/security`,
            summary: `Dependabot: ${repo.securityFeatures.dependabot ? "✓" : "✗"}, Secret Scanning: ${repo.securityFeatures.secretScanning ? "✓" : "✗"}, Code Scanning: ${repo.securityFeatures.codeScanning ? "✓" : "✗"}`,
            controlIds: ["iso-a-8-8"],
          });
          evidenceCreated++;
        }
      } catch (err) {
        errors.push(`Failed to process ${repo.fullName}: ${err}`);
      }
    }

    setIntegrationSyncComplete(integration.id);

    addAuditLog(
      "integration.synced",
      "integration",
      integration.id,
      "system",
      {
        provider: "GITHUB",
        evidenceCreated,
        reposProcessed: repos.length,
      }
    );

    return {
      success: true,
      evidenceCreated,
      errors,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setIntegrationSyncComplete(integration.id, errorMessage);

    return {
      success: false,
      evidenceCreated,
      errors: [...errors, errorMessage],
      duration: Date.now() - startTime,
    };
  }
}

