/**
 * AWS Collector
 * Fetches CloudTrail, GuardDuty, SecurityHub, S3, and IAM security configurations
 */

import { createEvidenceItem, addAuditLog } from "@/lib/demo-store";
import {
  getIntegrationByProvider,
  setIntegrationSyncing,
  setIntegrationSyncComplete,
  type AWSConfig,
  type SyncResult,
} from "@/lib/integrations-store";

interface CloudTrailStatus {
  isMultiRegion: boolean;
  isLogging: boolean;
  s3BucketName: string;
  kmsKeyId?: string;
  logFileValidation: boolean;
}

interface GuardDutyStatus {
  enabled: boolean;
  detectorId: string;
  findingsCount: {
    high: number;
    medium: number;
    low: number;
  };
}

interface SecurityHubStatus {
  enabled: boolean;
  standards: string[];
  complianceScore: number;
}

interface S3PublicAccessBlock {
  blockPublicAcls: boolean;
  ignorePublicAcls: boolean;
  blockPublicPolicy: boolean;
  restrictPublicBuckets: boolean;
}

interface IAMPasswordPolicy {
  minimumLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number;
  preventReuse: number;
}

interface AWSSecurityData {
  accountId: string;
  region: string;
  cloudTrail: CloudTrailStatus;
  guardDuty: GuardDutyStatus;
  securityHub: SecurityHubStatus;
  s3PublicAccessBlock: S3PublicAccessBlock;
  iamPasswordPolicy: IAMPasswordPolicy;
}

/**
 * Fetch AWS security data (mock implementation)
 * In production, this would use AWS SDK with AssumeRole credentials
 */
async function fetchAWSData(config: AWSConfig): Promise<AWSSecurityData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock data representing what we'd get from AWS APIs
  return {
    accountId: config.accountId || "123456789012",
    region: config.region || "us-east-1",
    cloudTrail: {
      isMultiRegion: true,
      isLogging: true,
      s3BucketName: "acme-cloudtrail-logs",
      kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
      logFileValidation: true,
    },
    guardDuty: {
      enabled: true,
      detectorId: "abc123def456",
      findingsCount: {
        high: 0,
        medium: 2,
        low: 5,
      },
    },
    securityHub: {
      enabled: true,
      standards: ["AWS Foundational Security Best Practices", "CIS AWS Foundations"],
      complianceScore: 87,
    },
    s3PublicAccessBlock: {
      blockPublicAcls: true,
      ignorePublicAcls: true,
      blockPublicPolicy: true,
      restrictPublicBuckets: true,
    },
    iamPasswordPolicy: {
      minimumLength: 14,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxAge: 90,
      preventReuse: 24,
    },
  };
}

/**
 * Run AWS collector
 */
export async function runAWSCollector(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let evidenceCreated = 0;

  const integration = getIntegrationByProvider("AWS");
  if (!integration || integration.status === "DISCONNECTED") {
    return {
      success: false,
      evidenceCreated: 0,
      errors: ["AWS integration not connected"],
      duration: Date.now() - startTime,
    };
  }

  try {
    setIntegrationSyncing(integration.id);

    const config = integration.config as AWSConfig;
    const data = await fetchAWSData(config);

    // CloudTrail Evidence
    try {
      const ct = data.cloudTrail;
      createEvidenceItem({
        title: "AWS CloudTrail Configuration",
        description: `CloudTrail logging configuration for account ${data.accountId}`,
        source: "AWS",
        reviewStatus: "NEEDS_REVIEW",
        collectedAt: new Date().toISOString(),
        externalId: `arn:aws:cloudtrail:${data.region}:${data.accountId}:trail/main`,
        summary: `Multi-region: ${ct.isMultiRegion ? "✓" : "✗"}, Logging: ${ct.isLogging ? "✓" : "✗"}, KMS Encryption: ${ct.kmsKeyId ? "✓" : "✗"}, Log Validation: ${ct.logFileValidation ? "✓" : "✗"}`,
        controlIds: ["soc2-cc7-1", "iso-a-8-15"],
      });
      evidenceCreated++;
    } catch (err) {
      errors.push(`CloudTrail: ${err}`);
    }

    // GuardDuty Evidence
    try {
      const gd = data.guardDuty;
      createEvidenceItem({
        title: "AWS GuardDuty Status",
        description: `Threat detection status and findings summary`,
        source: "AWS",
        reviewStatus: "NEEDS_REVIEW",
        collectedAt: new Date().toISOString(),
        externalId: `detector-${gd.detectorId}`,
        summary: `GuardDuty ${gd.enabled ? "enabled" : "disabled"}. Findings: ${gd.findingsCount.high} high, ${gd.findingsCount.medium} medium, ${gd.findingsCount.low} low severity.`,
        controlIds: ["soc2-cc7-1", "soc2-cc7-2", "iso-a-8-16"],
      });
      evidenceCreated++;
    } catch (err) {
      errors.push(`GuardDuty: ${err}`);
    }

    // Security Hub Evidence
    try {
      const sh = data.securityHub;
      createEvidenceItem({
        title: "AWS Security Hub Compliance",
        description: `Security Hub standards and compliance status`,
        source: "AWS",
        reviewStatus: "NEEDS_REVIEW",
        collectedAt: new Date().toISOString(),
        externalId: `securityhub-${data.accountId}`,
        summary: `Security Hub ${sh.enabled ? "enabled" : "disabled"}. Standards: ${sh.standards.join(", ")}. Compliance score: ${sh.complianceScore}%`,
        controlIds: ["soc2-cc7-1", "iso-a-8-8"],
      });
      evidenceCreated++;
    } catch (err) {
      errors.push(`Security Hub: ${err}`);
    }

    // S3 Public Access Block Evidence
    try {
      const s3 = data.s3PublicAccessBlock;
      const allBlocked = s3.blockPublicAcls && s3.ignorePublicAcls && s3.blockPublicPolicy && s3.restrictPublicBuckets;
      createEvidenceItem({
        title: "S3 Account Public Access Block",
        description: `Account-level S3 public access block settings`,
        source: "AWS",
        reviewStatus: "NEEDS_REVIEW",
        collectedAt: new Date().toISOString(),
        externalId: `s3-public-access-${data.accountId}`,
        summary: allBlocked
          ? "All public access blocked at account level"
          : `Block Public ACLs: ${s3.blockPublicAcls}, Ignore Public ACLs: ${s3.ignorePublicAcls}, Block Public Policy: ${s3.blockPublicPolicy}, Restrict Public Buckets: ${s3.restrictPublicBuckets}`,
        controlIds: ["soc2-cc6-6", "iso-a-8-2"],
      });
      evidenceCreated++;
    } catch (err) {
      errors.push(`S3: ${err}`);
    }

    // IAM Password Policy Evidence
    try {
      const iam = data.iamPasswordPolicy;
      createEvidenceItem({
        title: "IAM Password Policy",
        description: `Account password policy configuration`,
        source: "AWS",
        reviewStatus: "NEEDS_REVIEW",
        collectedAt: new Date().toISOString(),
        externalId: `iam-password-policy-${data.accountId}`,
        summary: `Min length: ${iam.minimumLength}, Complexity: ${[
          iam.requireUppercase ? "upper" : null,
          iam.requireLowercase ? "lower" : null,
          iam.requireNumbers ? "numbers" : null,
          iam.requireSymbols ? "symbols" : null,
        ].filter(Boolean).join("+")}. Max age: ${iam.maxAge} days, Prevent reuse: ${iam.preventReuse} passwords`,
        controlIds: ["soc2-cc6-1", "soc2-cc6-2", "iso-a-5-15"],
      });
      evidenceCreated++;
    } catch (err) {
      errors.push(`IAM: ${err}`);
    }

    setIntegrationSyncComplete(integration.id);

    addAuditLog(
      "integration.synced",
      "integration",
      integration.id,
      "system",
      {
        provider: "AWS",
        evidenceCreated,
        accountId: data.accountId,
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

