/**
 * Zod Validation Schemas
 * Shared request validation schemas for API routes.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export const EvidenceSourceEnum = z.enum(["MANUAL", "GITHUB", "AWS", "AI"]);

export const CreateEvidenceSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(5000, "Description too long").optional(),
  source: EvidenceSourceEnum.default("MANUAL"),
  controlIds: z.array(z.string()).optional(),
});

export const UpdateEvidenceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  source: EvidenceSourceEnum.optional(),
  reviewStatus: z.enum(["NEEDS_REVIEW", "APPROVED", "REJECTED"]).optional(),
  controlIds: z.array(z.string()).optional(),
});

export const RejectEvidenceSchema = z.object({
  reason: z.string().max(2000, "Reason too long").optional(),
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const CreateExportSchema = z.object({
  frameworkKey: z.string().min(1, "Framework key is required"),
});

// ---------------------------------------------------------------------------
// Copilot / Chat
// ---------------------------------------------------------------------------

export const CopilotActionSchema = z.object({
  type: z.enum(["gap_analysis", "policy_draft", "questionnaire_answer"]),
  frameworkKey: z.string().optional(),
  policyType: z.string().optional(),
  question: z.string().optional(),
});

export const CopilotChatSchema = z.object({
  message: z.string().max(10000, "Message too long").optional(),
  action: CopilotActionSchema.optional(),
}).refine(
  (data) => data.message || data.action,
  { message: "Message or action is required" }
);

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const ConnectGitHubSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  org: z.string().min(1, "GitHub organization is required"),
  repos: z.array(z.string()).optional().default([]),
});

export const ConnectAWSSchema = z.object({
  roleArn: z.string().min(1, "AWS Role ARN is required").regex(
    /^arn:aws:iam::\d{12}:role\/.+$/,
    "Invalid AWS Role ARN format"
  ),
  externalId: z.string().optional(),
  region: z.string().optional().default("us-east-1"),
  accountId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const UpdateOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1).max(100).regex(
    /^[a-z0-9-]+$/,
    "Slug must contain only lowercase letters, numbers, and hyphens"
  ),
});

export const InviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional().default("MEMBER"),
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const CreateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000, "Comment too long"),
});

// ---------------------------------------------------------------------------
// Helper: parse + return structured error
// ---------------------------------------------------------------------------

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}
