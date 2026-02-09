/**
 * Integration store for managing GitHub, AWS, and other connections
 */

export type IntegrationProvider = "GITHUB" | "AWS";
export type IntegrationStatus = "CONNECTED" | "DISCONNECTED" | "ERROR" | "SYNCING";

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubConfig {
  accessToken?: string;
  installationId?: string;
  org?: string;
  repos?: string[];
}

export interface AWSConfig {
  roleArn?: string;
  externalId?: string;
  region?: string;
  accountId?: string;
}

export interface SyncResult {
  success: boolean;
  evidenceCreated: number;
  errors: string[];
  duration: number;
}

// In-memory store
let integrations: Integration[] = [
  {
    id: "github-1",
    provider: "GITHUB",
    name: "GitHub",
    status: "DISCONNECTED",
    config: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "aws-1",
    provider: "AWS",
    name: "AWS",
    status: "DISCONNECTED",
    config: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get all integrations
 */
export function getIntegrations(): Integration[] {
  return integrations;
}

/**
 * Get integration by ID
 */
export function getIntegration(id: string): Integration | undefined {
  return integrations.find((i) => i.id === id);
}

/**
 * Get integration by provider
 */
export function getIntegrationByProvider(provider: IntegrationProvider): Integration | undefined {
  return integrations.find((i) => i.provider === provider);
}

/**
 * Update integration
 */
export function updateIntegration(
  id: string,
  updates: Partial<Integration>
): Integration | null {
  const index = integrations.findIndex((i) => i.id === id);
  if (index === -1) return null;

  integrations[index] = {
    ...integrations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return integrations[index];
}

/**
 * Connect GitHub integration
 */
export function connectGitHub(config: GitHubConfig): Integration {
  const integration = getIntegrationByProvider("GITHUB");
  if (!integration) throw new Error("GitHub integration not found");

  return updateIntegration(integration.id, {
    status: "CONNECTED",
    config: config as Record<string, unknown>,
  })!;
}

/**
 * Connect AWS integration
 */
export function connectAWS(config: AWSConfig): Integration {
  const integration = getIntegrationByProvider("AWS");
  if (!integration) throw new Error("AWS integration not found");

  return updateIntegration(integration.id, {
    status: "CONNECTED",
    config: config as Record<string, unknown>,
  })!;
}

/**
 * Disconnect integration
 */
export function disconnectIntegration(id: string): Integration | null {
  return updateIntegration(id, {
    status: "DISCONNECTED",
    config: {},
    lastSyncAt: undefined,
    lastError: undefined,
  });
}

/**
 * Set integration syncing status
 */
export function setIntegrationSyncing(id: string): Integration | null {
  return updateIntegration(id, { status: "SYNCING" });
}

/**
 * Set integration sync complete
 */
export function setIntegrationSyncComplete(
  id: string,
  error?: string
): Integration | null {
  return updateIntegration(id, {
    status: error ? "ERROR" : "CONNECTED",
    lastSyncAt: new Date().toISOString(),
    lastError: error,
  });
}

