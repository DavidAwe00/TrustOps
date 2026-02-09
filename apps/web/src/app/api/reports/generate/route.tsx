/**
 * API Route: Generate PDF Audit Report
 * POST /api/reports/generate
 */

import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  AuditReportPDF,
  generateSampleReportData,
} from "@/lib/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { framework, organizationName } = body;

    if (!framework || !["SOC2", "ISO27001"].includes(framework)) {
      return NextResponse.json(
        { error: "Invalid framework. Must be SOC2 or ISO27001" },
        { status: 400 }
      );
    }

    // Generate report data (in production, fetch from database)
    const reportData = generateSampleReportData(
      framework as "SOC2" | "ISO27001",
      organizationName || "Your Organization"
    );

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      <AuditReportPDF data={reportData} />
    );

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${framework}-audit-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}

