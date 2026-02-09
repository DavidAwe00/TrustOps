import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import { getExport } from "@/lib/exports-store";
import { getExportFilePath } from "@/lib/export-generator";
import { addAuditLog } from "@/lib/demo-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/exports/[id]/download - Download export ZIP file
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

  if (exportRecord.status !== "COMPLETED" || !exportRecord.filename) {
    return NextResponse.json(
      { error: "Export is not ready for download" },
      { status: 400 }
    );
  }

  const filepath = getExportFilePath(exportRecord.filename);
  if (!existsSync(filepath)) {
    return NextResponse.json(
      { error: "Export file not found" },
      { status: 404 }
    );
  }

  // Get file stats
  const stats = statSync(filepath);

  // Create readable stream
  const stream = createReadStream(filepath);

  // Convert Node stream to Web stream
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on("end", () => {
        controller.close();
      });
      stream.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  // Audit log
  addAuditLog(
    "export.downloaded",
    "audit_export",
    id,
    "demo@trustops.io",
    { filename: exportRecord.filename }
  );

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${exportRecord.filename}"`,
      "Content-Length": stats.size.toString(),
    },
  });
}

