/**
 * Environment Variable Validation
 * Validates required env vars at startup and provides typed access.
 * Import this module early (e.g., in instrumentation.ts) to fail fast.
 */

import { isDemo } from "@/lib/demo";

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  // Auth
  AUTH_SECRET: string;
  AUTH_URL: string;
  // Email
  EMAIL_SERVER: string;
  EMAIL_FROM: string;
  // Optional
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  AWS_ROLE_ARN?: string;
  AWS_EXTERNAL_ID?: string;
  S3_BUCKET?: string;
  AWS_REGION?: string;
  S3_ENDPOINT?: string;
  STORAGE_PROVIDER?: string;
  SENTRY_DSN?: string;
  CRON_SECRET?: string;
  ENCRYPTION_KEY?: string;
  SLACK_WEBHOOK_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

/** Variables required in production (non-demo) mode */
const REQUIRED_VARS: (keyof EnvConfig)[] = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "EMAIL_SERVER",
  "EMAIL_FROM",
];

/** Variables strongly recommended for production */
const RECOMMENDED_VARS: (keyof EnvConfig)[] = [
  "CRON_SECRET",
  "ENCRYPTION_KEY",
  "SENTRY_DSN",
];

/**
 * Validate environment variables.
 * In demo mode only AUTH_SECRET is hard-required.
 * In production all REQUIRED_VARS must be present.
 */
export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isDemo()) {
    // In demo mode we still don't want the hardcoded fallback
    if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
      errors.push("AUTH_SECRET must be set in production, even in demo mode");
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // Production validation
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // AUTH_SECRET strength check
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    errors.push("AUTH_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32");
  }

  // Warn about recommended vars
  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      warnings.push(`Recommended environment variable not set: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Run validation and throw on failure.
 * Call this at app startup (e.g., in instrumentation.ts or next.config).
 */
export function assertEnv(): void {
  // Skip validation during Next.js build phase
  // We only want runtime validation, not build-time validation
  if (process.env.NEXT_PHASE === "phase-production-build") {
    console.log("[TrustOps] Skipping env validation during build phase");
    return;
  }

  const { valid, errors, warnings } = validateEnv();

  for (const warning of warnings) {
    console.warn(`[TrustOps] WARNING: ${warning}`);
  }

  if (!valid) {
    const message = [
      "[TrustOps] Environment validation failed:",
      ...errors.map((e) => `  - ${e}`),
      "",
      "See .env.example for required variables.",
    ].join("\n");

    // In production runtime, throw immediately
    if (process.env.NODE_ENV === "production" && !isDemo()) {
      throw new Error(message);
    }

    // In development or demo mode, log loudly but don't crash
    console.error(message);
  }
}
