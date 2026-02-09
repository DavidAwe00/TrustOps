import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";
import {
  getEvidenceItems,
  createEvidenceItem,
  createAuditLog,
} from "@/lib/db";
import { storeFile } from "@/lib/storage";
import { addEvidenceFile } from "@/lib/db/demo-provider";

// Demo org ID for unauthenticated demo mode
const DEMO_ORG_ID = "demo-org-1";

async function getOrgId(): Promise<string> {
  if (isDemo()) {
    return DEMO_ORG_ID;
  }
  
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  return (session.user as { defaultOrgId?: string }).defaultOrgId || DEMO_ORG_ID;
}

/**
 * GET /api/evidence - List all evidence items
 */
export async function GET() {
  try {
    const orgId = await getOrgId();
    const items = await getEvidenceItems(orgId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/evidence - Create a new evidence item with optional file upload
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrgId();
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const source = (formData.get("source") as string) || "MANUAL";
    const controlIds = formData.getAll("controlIds") as string[];
    const files = formData.getAll("files") as File[];

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create the evidence item
    const item = await createEvidenceItem(orgId, {
      title,
      description: description || undefined,
      source: source as "MANUAL" | "GITHUB" | "AWS" | "AI",
      controlIds: controlIds.length > 0 ? controlIds : undefined,
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
            orgId,
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
            orgId,
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
    await createAuditLog(orgId, {
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

    return NextResponse.json({
      item,
      files: storedFiles,
    });
  } catch (error) {
    console.error("Error creating evidence:", error);
    return NextResponse.json(
      { error: "Failed to create evidence" },
      { status: 500 }
    );
  }
}
