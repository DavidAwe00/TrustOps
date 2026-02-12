/**
 * API Utilities
 * Structured error responses, request helpers, and common middleware patterns.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Structured Error Response
// ---------------------------------------------------------------------------

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<{ error: ApiError }> {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

/** Common error helpers */
export const Errors = {
  unauthorized: (message = "Authentication required") =>
    apiError("UNAUTHORIZED", message, 401),

  forbidden: (message = "Insufficient permissions") =>
    apiError("FORBIDDEN", message, 403),

  notFound: (resource = "Resource") =>
    apiError("NOT_FOUND", `${resource} not found`, 404),

  badRequest: (message: string, details?: unknown) =>
    apiError("BAD_REQUEST", message, 400, details),

  validationError: (issues: unknown) =>
    apiError("VALIDATION_ERROR", "Request validation failed", 400, issues),

  rateLimited: () =>
    apiError("RATE_LIMITED", "Too many requests. Please try again later.", 429),

  internal: (logMessage: string, error?: unknown) => {
    logger.error(logMessage, error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  },
};

// ---------------------------------------------------------------------------
// Org-scoped session helper (DRY replacement for per-route getOrgId)
// ---------------------------------------------------------------------------

const DEMO_ORG_ID = "demo-org-1";

export interface AuthContext {
  orgId: string;
  userId: string;
  email: string;
}

/**
 * Resolve org context from the current session.
 * Returns null if the user is not authenticated (instead of throwing).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  if (isDemo()) {
    return {
      orgId: DEMO_ORG_ID,
      userId: "demo-user-1",
      email: "demo@trustops.app",
    };
  }

  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const user = session.user as { id?: string; defaultOrgId?: string; email?: string };
  return {
    orgId: user.defaultOrgId || DEMO_ORG_ID,
    userId: user.id || "unknown",
    email: user.email || "unknown",
  };
}

/**
 * Like getAuthContext but returns an HTTP 401 response when unauthenticated.
 * Use in API route handlers: const ctx = requireAuth(); if (ctx instanceof NextResponse) return ctx;
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return Errors.unauthorized();
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// File upload validation
// ---------------------------------------------------------------------------

/** Maximum file size in bytes (default 25 MB) */
const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 25 * 1024 * 1024;

/** Allowed MIME types for evidence uploads */
const ALLOWED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/xml",
  "text/xml",
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Archives
  "application/zip",
  "application/gzip",
]);

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate uploaded files for size and MIME type.
 */
export function validateFiles(files: File[]): FileValidationResult {
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(
        `File "${file.name}" exceeds maximum size of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
      );
    }

    if (file.size > 0 && !ALLOWED_MIME_TYPES.has(file.type)) {
      errors.push(
        `File "${file.name}" has unsupported type "${file.type}". Allowed: PDF, Office docs, images, text, CSV, JSON, ZIP.`
      );
    }

    // Reject path traversal in filenames
    if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
      errors.push(`File "${file.name}" has an invalid filename`);
    }
  }

  return { valid: errors.length === 0, errors };
}
