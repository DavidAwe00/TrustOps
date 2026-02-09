/**
 * PDF Report Generator
 * Generates branded audit packets using @react-pdf/renderer
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts (using default for now, can add custom fonts later)
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 700,
    },
  ],
});

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#1f2937",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: "#10b981",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    marginTop: 20,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 150,
    fontWeight: 600,
    color: "#374151",
  },
  value: {
    flex: 1,
    color: "#4b5563",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontWeight: 600,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: {
    flex: 1,
  },
  tableCellSmall: {
    width: 80,
  },
  tableCellStatus: {
    width: 100,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
  },
  statusCompliant: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  statusPartial: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusNonCompliant: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 9,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 50,
    fontSize: 9,
    color: "#9ca3af",
  },
  summaryBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    color: "#166534",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#166534",
  },
  summaryValue: {
    fontWeight: 600,
    color: "#166534",
  },
  evidenceItem: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  evidenceTitle: {
    fontWeight: 600,
    marginBottom: 4,
  },
  evidenceMeta: {
    fontSize: 9,
    color: "#6b7280",
  },
});

// Types
export interface AuditReportData {
  organization: {
    name: string;
    logo?: string;
  };
  framework: {
    name: string;
    version: string;
  };
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  preparedBy: string;
  summary: {
    totalControls: number;
    compliantControls: number;
    partialControls: number;
    nonCompliantControls: number;
    coveragePercent: number;
    totalEvidence: number;
  };
  controls: Array<{
    id: string;
    name: string;
    category: string;
    status: "compliant" | "partial" | "non-compliant";
    evidenceCount: number;
    lastReviewed?: string;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    type: string;
    collectedAt: string;
    expiresAt?: string;
    controlIds: string[];
  }>;
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStyle = () => {
    switch (status) {
      case "compliant":
        return styles.statusCompliant;
      case "partial":
        return styles.statusPartial;
      default:
        return styles.statusNonCompliant;
    }
  };

  return (
    <Text style={[styles.statusBadge, getStyle()]}>
      {status.toUpperCase()}
    </Text>
  );
};

// Main PDF Document
export const AuditReportPDF = ({ data }: { data: AuditReportData }) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.logo}>TrustOps</Text>
        <Text style={styles.subtitle}>Compliance Automation Platform</Text>
      </View>

      <View style={{ marginTop: 60 }}>
        <Text style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          {data.framework.name}
        </Text>
        <Text style={{ fontSize: 16, color: "#6b7280", marginBottom: 40 }}>
          Audit Evidence Package
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Organization:</Text>
          <Text style={styles.value}>{data.organization.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Framework Version:</Text>
          <Text style={styles.value}>{data.framework.version}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Report Date:</Text>
          <Text style={styles.value}>
            {data.reportDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Audit Period:</Text>
          <Text style={styles.value}>
            {data.periodStart.toLocaleDateString()} -{" "}
            {data.periodEnd.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Prepared By:</Text>
          <Text style={styles.value}>{data.preparedBy}</Text>
        </View>
      </View>

      {/* Summary Box */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Executive Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Overall Coverage</Text>
          <Text style={styles.summaryValue}>{data.summary.coveragePercent}%</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Compliant Controls</Text>
          <Text style={styles.summaryValue}>
            {data.summary.compliantControls} / {data.summary.totalControls}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Evidence Items</Text>
          <Text style={styles.summaryValue}>{data.summary.totalEvidence}</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Generated by TrustOps • Confidential
      </Text>
    </Page>

    {/* Controls Page */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Control Status Overview</Text>
      <Text style={{ marginBottom: 16, color: "#6b7280" }}>
        Detailed status of all {data.framework.name} controls
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellSmall}>ID</Text>
          <Text style={styles.tableCell}>Control Name</Text>
          <Text style={styles.tableCellSmall}>Evidence</Text>
          <Text style={styles.tableCellStatus}>Status</Text>
        </View>

        {data.controls.map((control) => (
          <View key={control.id} style={styles.tableRow}>
            <Text style={styles.tableCellSmall}>{control.id}</Text>
            <Text style={styles.tableCell}>{control.name}</Text>
            <Text style={styles.tableCellSmall}>{control.evidenceCount}</Text>
            <View style={styles.tableCellStatus}>
              <StatusBadge status={control.status} />
            </View>
          </View>
        ))}
      </View>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
        fixed
      />
    </Page>

    {/* Evidence Page */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Evidence Inventory</Text>
      <Text style={{ marginBottom: 16, color: "#6b7280" }}>
        All collected evidence supporting control compliance
      </Text>

      {data.evidence.map((item) => (
        <View key={item.id} style={styles.evidenceItem}>
          <Text style={styles.evidenceTitle}>{item.title}</Text>
          <Text style={styles.evidenceMeta}>
            Type: {item.type} • Collected: {item.collectedAt}
            {item.expiresAt && ` • Expires: ${item.expiresAt}`}
          </Text>
          <Text style={styles.evidenceMeta}>
            Linked Controls: {item.controlIds.join(", ")}
          </Text>
        </View>
      ))}

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
        fixed
      />
    </Page>
  </Document>
);

// Helper to generate sample report data
export function generateSampleReportData(
  framework: "SOC2" | "ISO27001",
  orgName: string
): AuditReportData {
  const controls =
    framework === "SOC2"
      ? [
          { id: "CC1.1", name: "Security Policies", category: "CC1", status: "compliant" as const, evidenceCount: 3 },
          { id: "CC1.2", name: "Board Oversight", category: "CC1", status: "compliant" as const, evidenceCount: 2 },
          { id: "CC2.1", name: "Internal Communication", category: "CC2", status: "compliant" as const, evidenceCount: 2 },
          { id: "CC3.1", name: "Risk Assessment", category: "CC3", status: "partial" as const, evidenceCount: 1 },
          { id: "CC4.1", name: "Monitoring Activities", category: "CC4", status: "compliant" as const, evidenceCount: 4 },
          { id: "CC5.1", name: "Logical Access", category: "CC5", status: "compliant" as const, evidenceCount: 5 },
          { id: "CC6.1", name: "Security Software", category: "CC6", status: "compliant" as const, evidenceCount: 3 },
          { id: "CC7.1", name: "Incident Response", category: "CC7", status: "partial" as const, evidenceCount: 2 },
          { id: "CC8.1", name: "Change Management", category: "CC8", status: "compliant" as const, evidenceCount: 4 },
        ]
      : [
          { id: "A.5.1", name: "Information Security Policies", category: "A.5", status: "compliant" as const, evidenceCount: 3 },
          { id: "A.6.1", name: "Organization of Information Security", category: "A.6", status: "compliant" as const, evidenceCount: 2 },
          { id: "A.7.1", name: "Human Resource Security", category: "A.7", status: "compliant" as const, evidenceCount: 2 },
          { id: "A.8.1", name: "Asset Management", category: "A.8", status: "partial" as const, evidenceCount: 1 },
          { id: "A.9.1", name: "Access Control", category: "A.9", status: "compliant" as const, evidenceCount: 5 },
          { id: "A.10.1", name: "Cryptography", category: "A.10", status: "compliant" as const, evidenceCount: 3 },
          { id: "A.12.1", name: "Operations Security", category: "A.12", status: "compliant" as const, evidenceCount: 4 },
        ];

  const compliant = controls.filter((c) => c.status === "compliant").length;
  const partial = controls.filter((c) => c.status === "partial").length;

  return {
    organization: { name: orgName },
    framework: {
      name: framework === "SOC2" ? "SOC 2 Type II" : "ISO/IEC 27001",
      version: framework === "SOC2" ? "2017" : "2022",
    },
    reportDate: new Date(),
    periodStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(),
    preparedBy: "TrustOps Compliance Team",
    summary: {
      totalControls: controls.length,
      compliantControls: compliant,
      partialControls: partial,
      nonCompliantControls: controls.length - compliant - partial,
      coveragePercent: Math.round((compliant / controls.length) * 100),
      totalEvidence: controls.reduce((sum, c) => sum + c.evidenceCount, 0),
    },
    controls,
    evidence: [
      {
        id: "ev-1",
        title: "AWS CloudTrail Configuration",
        type: "Configuration",
        collectedAt: "2024-12-15",
        controlIds: ["CC5.1", "CC6.1"],
      },
      {
        id: "ev-2",
        title: "GitHub Branch Protection Rules",
        type: "Configuration",
        collectedAt: "2024-12-10",
        controlIds: ["CC8.1"],
      },
      {
        id: "ev-3",
        title: "Security Awareness Training Records",
        type: "Document",
        collectedAt: "2024-11-01",
        expiresAt: "2025-11-01",
        controlIds: ["CC1.1", "CC2.1"],
      },
      {
        id: "ev-4",
        title: "Access Control Policy v2.1",
        type: "Policy",
        collectedAt: "2024-10-15",
        controlIds: ["CC5.1"],
      },
      {
        id: "ev-5",
        title: "Incident Response Procedure",
        type: "Policy",
        collectedAt: "2024-09-20",
        controlIds: ["CC7.1"],
      },
    ],
  };
}









