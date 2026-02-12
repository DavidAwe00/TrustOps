import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";
import {
  getEvidenceItems,
  createEvidenceItem,
  createAuditLog,
} from "@/lib/db";
import { storeFile } from "@/lib/storage";
import { addEvidenceFile } from "@/lib/db/demo-provider";
import { requireAuth, Errors, validateFiles } from "@/lib/api-utils";
import { CreateEvidenceSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/evidence - List all evidence items
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "standard");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const items = await getEvidenceItems(ctx.orgId);
    return NextResponse.json({ items });
  } catch (error) {
    return Errors.internal("Failed to fetch evidence", error);
  }
}

/**
 * POST /api/evidence - Create a new evidence item with optional file upload
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "upload");
  if (limited) return limited;

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const formData = await request.formData();

    // Validate text fields with Zod
    const parsed = parseBody(CreateEvidenceSchema, {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      source: formData.get("source") || "MANUAL",
      controlIds: formData.getAll("controlIds"),
    });

    if (!parsed.success) {
      return Errors.validationError(parsed.errors);
    }

    const { title, description, source, controlIds } = parsed.data;

    // Validate uploaded files
    const files = formData.getAll("files") as File[];
    if (files.length > 0) {
      const fileValidation = validateFiles(files);
      if (!fileValidation.valid) {
        return Errors.badRequest("File validation failed", fileValidation.errors);
      }
    }

    // Create the evidence item
    const item = await createEvidenceItem(ctx.orgId, {
      title,
      description,
      source: source as "MANUAL" | "GITHUB" | "AWS" | "AI",
      controlIds: controlIds && controlIds.length > 0 ? controlIds : undefined,
    });

    // Store uploaded files
    const storedFiles = [];
    for (const file of files) {
      if (file.size > 0) {
        const stored = await storeFile(file);
        
        // Add file to database/demo store
        if (isDemo()) {
          addEvidenceFile({
            id: stored.id,
            orgId: ctx.orgId,
            evidenceItemId: item.id,
            filename: stored.originalName,
            storageKey: stored.filename,
            mimeType: stored.mimeType,
            sizeBytes: stored.size,
            sha256: stored.sha256,
            summary: null,
            reviewStatus: "NEEDS_REVIEW",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          const { addEvidenceFile: addPrismaFile } = await import("@/lib/db/prisma-provider");
          await addPrismaFile({
            orgId: ctx.orgId,
            evidenceItemId: item.id,
            filename: stored.originalName,
            storageKey: stored.filename,
            mimeType: stored.mimeType,
            sizeBytes: stored.size,
            sha256: stored.sha256,
          });
        }
        
        storedFiles.push(stored);
      }
    }

    // Add audit log
    await createAuditLog(ctx.orgId, {
      action: "evidence.created",
      targetType: "evidence_item",
      targetId: item.id,
      metadata: {
        title: item.title,
        source: item.source,
        controlIds: item.controlIds,
        fileCount: storedFiles.length,
      },
    });

    logger.info("Evidence created", {
      orgId: ctx.orgId,
      evidenceId: item.id,
      fileCount: storedFiles.length,
    });

    return NextResponse.json({
      item,
      files: storedFiles,
    });
  } catch (error) {
    return Errors.internal("Failed to create evidence", error);
  }
}
