import { NextRequest, NextResponse } from "next/server";
import { DEMO_FRAMEWORKS, DEMO_CONTROLS, DEMO_EVIDENCE_ITEMS } from "@trustops/shared";

/**
 * POST /api/reports/pdf - Generate a PDF compliance report
 * 
 * Note: In production, use a library like @react-pdf/renderer or puppeteer
 * For demo, we generate a simple HTML report that can be printed as PDF
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { framework, reportType = "summary" } = body;

    // Get framework data
    const frameworkData = DEMO_FRAMEWORKS.find((f) => f.key === framework);
    if (!frameworkData) {
      return NextResponse.json(
        { error: "Framework not found" },
        { status: 404 }
      );
    }

    // Get controls and evidence for the framework
    const controls = DEMO_CONTROLS.filter((c) => c.frameworkKey === framework);
    const evidenceItems = DEMO_EVIDENCE_ITEMS.filter((e) => e.reviewStatus === "APPROVED");

    // Calculate stats
    const totalControls = controls.length;
    const controlsWithEvidence = controls.filter((c) => c.evidenceCount > 0).length;
    const coveragePercent = Math.round((controlsWithEvidence / totalControls) * 100);

    // Generate HTML report
    const htmlReport = generateHtmlReport({
      framework: frameworkData,
      controls,
      evidenceItems,
      reportType,
      stats: {
        totalControls,
        controlsWithEvidence,
        coveragePercent,
        totalEvidence: evidenceItems.length,
      },
      generatedAt: new Date().toISOString(),
    });

    // Return HTML that can be printed as PDF
    return new NextResponse(htmlReport, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${framework}-compliance-report.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

interface ReportData {
  framework: { key: string; name: string; version: string; description?: string };
  controls: Array<{ id: string; code: string; title: string; description?: string; category: string; evidenceCount: number }>;
  evidenceItems: Array<{ id: string; title: string; source: string; collectedAt: string }>;
  reportType: string;
  stats: { totalControls: number; controlsWithEvidence: number; coveragePercent: number; totalEvidence: number };
  generatedAt: string;
}

function generateHtmlReport(data: ReportData): string {
  const { framework, controls, evidenceItems, stats, generatedAt } = data;

  // Group controls by category
  const controlsByCategory = controls.reduce((acc, control) => {
    if (!acc[control.category]) {
      acc[control.category] = [];
    }
    acc[control.category].push(control);
    return acc;
  }, {} as Record<string, typeof controls>);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${framework.name} Compliance Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #10b981; }
    .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; }
    h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 14px; }
    .meta { display: flex; justify-content: center; gap: 24px; margin-top: 16px; font-size: 12px; color: #64748b; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 32px 0; }
    .stat { background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #10b981; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .section { margin: 32px 0; }
    .section-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .category { margin: 24px 0; }
    .category-title { font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .control { background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .control-header { display: flex; justify-content: space-between; align-items: start; }
    .control-code { font-weight: 600; color: #10b981; }
    .control-title { font-weight: 500; color: #0f172a; margin-top: 4px; }
    .control-desc { font-size: 14px; color: #64748b; margin-top: 8px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .evidence-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .evidence-table th, .evidence-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .evidence-table th { background: #f8fafc; font-weight: 600; color: #475569; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    @media print { body { padding: 20px; } .stats { break-inside: avoid; } .control { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">T</div>
    <h1>${framework.name} Compliance Report</h1>
    <p class="subtitle">${framework.description || ''}</p>
    <div class="meta">
      <span>Generated: ${new Date(generatedAt).toLocaleDateString()}</span>
      <span>Framework Version: ${framework.version}</span>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${stats.coveragePercent}%</div>
      <div class="stat-label">Coverage</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.controlsWithEvidence}</div>
      <div class="stat-label">Controls Met</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.totalControls}</div>
      <div class="stat-label">Total Controls</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.totalEvidence}</div>
      <div class="stat-label">Evidence Items</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Executive Summary</h2>
    <p>This report provides an overview of your organization's compliance posture against the ${framework.name} framework. As of ${new Date(generatedAt).toLocaleDateString()}, your organization has achieved <strong>${stats.coveragePercent}%</strong> control coverage with <strong>${stats.controlsWithEvidence}</strong> out of <strong>${stats.totalControls}</strong> controls having documented evidence.</p>
  </div>

  <div class="section">
    <h2 class="section-title">Control Status by Category</h2>
    ${Object.entries(controlsByCategory).map(([category, categoryControls]) => `
      <div class="category">
        <h3 class="category-title">${category}</h3>
        ${categoryControls.map(control => `
          <div class="control">
            <div class="control-header">
              <div>
                <span class="control-code">${control.code}</span>
                <div class="control-title">${control.title}</div>
              </div>
              <span class="badge ${control.evidenceCount > 0 ? 'badge-success' : 'badge-warning'}">
                ${control.evidenceCount > 0 ? `${control.evidenceCount} evidence` : 'No evidence'}
              </span>
            </div>
            ${control.description ? `<p class="control-desc">${control.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2 class="section-title">Evidence Summary</h2>
    <table class="evidence-table">
      <thead>
        <tr>
          <th>Evidence</th>
          <th>Source</th>
          <th>Collected</th>
        </tr>
      </thead>
      <tbody>
        ${evidenceItems.slice(0, 10).map(item => `
          <tr>
            <td>${item.title}</td>
            <td>${item.source}</td>
            <td>${new Date(item.collectedAt).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${evidenceItems.length > 10 ? `<p style="margin-top: 12px; color: #64748b; font-size: 14px;">... and ${evidenceItems.length - 10} more evidence items</p>` : ''}
  </div>

  <div class="footer">
    <p>Generated by TrustOps • ${new Date(generatedAt).toLocaleString()}</p>
    <p style="margin-top: 4px;">This report is for internal use only. Please verify all information before sharing externally.</p>
  </div>
</body>
</html>
  `.trim();
}

