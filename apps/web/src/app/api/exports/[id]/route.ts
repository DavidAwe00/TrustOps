import { NextRequest, NextResponse } from "next/server";
import { getExport, deleteExport } from "@/lib/exports-store";
import { addAuditLog } from "@/lib/demo-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/exports/[id] - Get export details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const exportRecord = getExport(id);

  if (!exportRecord) {
    return NextResponse.json(
      { error: "Export not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ export: exportRecord });
}

/**
 * DELETE /api/exports/[id] - Delete an export
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const exportRecord = getExport(id);
  if (!exportRecord) {
    return NextResponse.json(
      { error: "Export not found" },
      { status: 404 }
    );
  }

  deleteExport(id);

  addAuditLog(
    "export.deleted",
    "audit_export",
    id,
    "demo@trustops.io",
    { name: exportRecord.name }
  );

  return NextResponse.json({ success: true });
}

