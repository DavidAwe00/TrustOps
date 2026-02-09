import { NextRequest, NextResponse } from "next/server";
import { getExports } from "@/lib/exports-store";
import { generateAuditPacket } from "@/lib/export-generator";

/**
 * GET /api/exports - List all exports
 */
export async function GET() {
  const exports = getExports();
  return NextResponse.json({ exports });
}

/**
 * POST /api/exports - Generate a new export
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frameworkKey } = body;

    if (!frameworkKey) {
      return NextResponse.json(
        { error: "Framework key is required" },
        { status: 400 }
      );
    }

    const exportRecord = await generateAuditPacket(frameworkKey);

    return NextResponse.json({ export: exportRecord });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate export" },
      { status: 500 }
    );
  }
}

