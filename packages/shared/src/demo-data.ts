// Demo data for UI preview without database

export interface DemoFramework {
  key: string;
  name: string;
  version: string;
  description?: string;
}

export interface DemoControl {
  id: string;
  frameworkKey: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  guidance?: string;
  evidenceCount: number;
}

export interface DemoEvidenceItem {
  id: string;
  title: string;
  description?: string;
  source: "MANUAL" | "GITHUB" | "AWS" | "AI";
  reviewStatus: "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
  collectedAt: string;
  expiresAt?: string;
  externalId?: string;
  summary?: string;
  controlIds?: string[];
}

export const DEMO_FRAMEWORKS: DemoFramework[] = [
  {
    key: "SOC2",
    name: "SOC 2 Type II",
    version: "2017",
    description: "Trust Services Criteria - Security focused",
  },
  {
    key: "ISO27001",
    name: "ISO/IEC 27001",
    version: "2022",
    description: "Information Security Management System",
  },
];

export const DEMO_CONTROLS: DemoControl[] = [
  // SOC2 Controls
  {
    id: "soc2-cc6-1",
    frameworkKey: "SOC2",
    code: "CC6.1",
    title: "Logical Access Security Software",
    description: "The entity implements logical access security software, infrastructure, and architectures to protect access to systems and data.",
    category: "Logical & Physical Access",
    guidance: "Implement authentication mechanisms, access controls, and authorization procedures.",
    evidenceCount: 3,
  },
  {
    id: "soc2-cc6-2",
    frameworkKey: "SOC2",
    code: "CC6.2",
    title: "Registration & Authorization",
    description: "Prior to issuing system credentials, the entity registers and authorizes new internal and external users.",
    category: "Logical & Physical Access",
    guidance: "Establish user provisioning and de-provisioning procedures.",
    evidenceCount: 2,
  },
  {
    id: "soc2-cc6-3",
    frameworkKey: "SOC2",
    code: "CC6.3",
    title: "Role-Based Access",
    description: "The entity authorizes, modifies, or removes access to data, software, functions based on roles and responsibilities.",
    category: "Logical & Physical Access",
    guidance: "Implement RBAC and periodic access reviews.",
    evidenceCount: 0,
  },
  {
    id: "soc2-cc6-6",
    frameworkKey: "SOC2",
    code: "CC6.6",
    title: "Transmission Security",
    description: "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.",
    category: "Logical & Physical Access",
    guidance: "Use encryption for data in transit (TLS/HTTPS).",
    evidenceCount: 1,
  },
  {
    id: "soc2-cc7-1",
    frameworkKey: "SOC2",
    code: "CC7.1",
    title: "Detection Procedures",
    description: "To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations.",
    category: "System Operations",
    guidance: "Implement monitoring, alerting, and logging systems.",
    evidenceCount: 2,
  },
  {
    id: "soc2-cc7-2",
    frameworkKey: "SOC2",
    code: "CC7.2",
    title: "Monitoring Activities",
    description: "The entity monitors system components for anomalies that are indicative of malicious acts.",
    category: "System Operations",
    guidance: "Deploy SIEM, IDS/IPS, and security monitoring tools.",
    evidenceCount: 0,
  },
  {
    id: "soc2-cc7-3",
    frameworkKey: "SOC2",
    code: "CC7.3",
    title: "Security Event Analysis",
    description: "The entity evaluates security events to determine whether they could impact the entity's ability to achieve its objectives.",
    category: "System Operations",
    guidance: "Establish incident triage and analysis procedures.",
    evidenceCount: 1,
  },
  {
    id: "soc2-cc7-4",
    frameworkKey: "SOC2",
    code: "CC7.4",
    title: "Incident Response",
    description: "The entity responds to identified security incidents by executing a defined incident response program.",
    category: "System Operations",
    guidance: "Maintain incident response plan and conduct drills.",
    evidenceCount: 0,
  },
  {
    id: "soc2-cc8-1",
    frameworkKey: "SOC2",
    code: "CC8.1",
    title: "Change Management",
    description: "The entity authorizes, designs, develops, implements, operates, approves, and maintains changes.",
    category: "Change Management",
    guidance: "Implement change control board and approval workflows.",
    evidenceCount: 2,
  },
  // ISO 27001 Controls
  {
    id: "iso-a-5-1",
    frameworkKey: "ISO27001",
    code: "A.5.1",
    title: "Policies for Information Security",
    description: "A set of policies for information security shall be defined, approved by management, and communicated.",
    category: "Organizational Controls",
    guidance: "Create and maintain information security policy documents.",
    evidenceCount: 1,
  },
  {
    id: "iso-a-5-15",
    frameworkKey: "ISO27001",
    code: "A.5.15",
    title: "Access Control",
    description: "Rules to control physical and logical access shall be established based on business and security requirements.",
    category: "Organizational Controls",
    guidance: "Define access control policy and procedures.",
    evidenceCount: 2,
  },
  {
    id: "iso-a-5-24",
    frameworkKey: "ISO27001",
    code: "A.5.24",
    title: "Incident Management Planning",
    description: "The organization shall plan and prepare for managing information security incidents.",
    category: "Organizational Controls",
    guidance: "Develop incident response plan and procedures.",
    evidenceCount: 0,
  },
  {
    id: "iso-a-8-2",
    frameworkKey: "ISO27001",
    code: "A.8.2",
    title: "Privileged Access Rights",
    description: "The allocation and use of privileged access rights shall be restricted and managed.",
    category: "Technological Controls",
    guidance: "Implement PAM solutions and monitor privileged access.",
    evidenceCount: 1,
  },
  {
    id: "iso-a-8-8",
    frameworkKey: "ISO27001",
    code: "A.8.8",
    title: "Management of Technical Vulnerabilities",
    description: "Information about technical vulnerabilities shall be obtained, evaluated, and addressed.",
    category: "Technological Controls",
    guidance: "Implement vulnerability scanning and patching procedures.",
    evidenceCount: 0,
  },
  {
    id: "iso-a-8-15",
    frameworkKey: "ISO27001",
    code: "A.8.15",
    title: "Logging",
    description: "Logs that record activities, exceptions, faults and events shall be produced and analyzed.",
    category: "Technological Controls",
    guidance: "Implement centralized logging and log retention policies.",
    evidenceCount: 3,
  },
  {
    id: "iso-a-8-16",
    frameworkKey: "ISO27001",
    code: "A.8.16",
    title: "Monitoring Activities",
    description: "Networks, systems and applications shall be monitored for anomalous behaviour.",
    category: "Technological Controls",
    guidance: "Deploy monitoring tools and alerting systems.",
    evidenceCount: 1,
  },
];

export const DEMO_EVIDENCE_ITEMS: DemoEvidenceItem[] = [
  {
    id: "ev-1",
    title: "AWS CloudTrail Configuration",
    description: "CloudTrail is enabled in all regions with multi-region trail configuration.",
    source: "AWS",
    reviewStatus: "APPROVED",
    collectedAt: "2024-01-10T08:30:00Z",
    expiresAt: "2025-01-10T08:30:00Z",
    externalId: "arn:aws:cloudtrail:us-east-1:123456789:trail/main-trail",
    summary: "CloudTrail enabled with S3 logging, KMS encryption, and log file validation.",
    controlIds: ["soc2-cc7-1", "iso-a-8-15"],
  },
  {
    id: "ev-2",
    title: "GitHub Branch Protection Rules",
    description: "Main branch protection rules requiring PR reviews and status checks.",
    source: "GITHUB",
    reviewStatus: "APPROVED",
    collectedAt: "2024-01-09T14:20:00Z",
    expiresAt: "2025-01-09T14:20:00Z",
    externalId: "acme/main-app/main",
    summary: "Branch protection: 2 reviewers required, status checks enforced, force push disabled.",
    controlIds: ["soc2-cc8-1", "soc2-cc6-1"],
  },
  {
    id: "ev-3",
    title: "Access Control Policy v2.1",
    description: "Corporate access control policy document defining roles and permissions.",
    source: "MANUAL",
    reviewStatus: "APPROVED",
    collectedAt: "2024-01-05T10:00:00Z",
    expiresAt: "2025-01-05T10:00:00Z",
    summary: "Comprehensive access control policy covering provisioning, RBAC, and reviews.",
    controlIds: ["soc2-cc6-1", "soc2-cc6-2", "iso-a-5-15"],
  },
  {
    id: "ev-4",
    title: "AWS GuardDuty Findings Report",
    description: "GuardDuty threat detection status and recent findings summary.",
    source: "AWS",
    reviewStatus: "NEEDS_REVIEW",
    collectedAt: "2024-01-12T16:45:00Z",
    externalId: "detector-abc123",
    summary: "GuardDuty active, 0 high severity findings in last 30 days.",
    controlIds: ["soc2-cc7-1", "soc2-cc7-2"],
  },
  {
    id: "ev-5",
    title: "Security Awareness Training Records",
    description: "Employee security training completion records for Q4 2023.",
    source: "MANUAL",
    reviewStatus: "APPROVED",
    collectedAt: "2024-01-02T09:15:00Z",
    expiresAt: "2024-12-31T23:59:59Z",
    summary: "98% completion rate, all employees completed within 30-day window.",
    controlIds: ["iso-a-5-1"],
  },
  {
    id: "ev-6",
    title: "Incident Response Plan",
    description: "AI-generated incident response plan template based on NIST guidelines.",
    source: "AI",
    reviewStatus: "NEEDS_REVIEW",
    collectedAt: "2024-01-11T11:30:00Z",
    summary: "Draft incident response plan covering detection, containment, eradication, and recovery.",
    controlIds: ["soc2-cc7-3", "soc2-cc7-4", "iso-a-5-24"],
  },
  {
    id: "ev-7",
    title: "AWS S3 Public Access Block",
    description: "S3 account-level public access block configuration.",
    source: "AWS",
    reviewStatus: "APPROVED",
    collectedAt: "2024-01-08T13:00:00Z",
    externalId: "s3-public-access-block",
    summary: "All public access blocked at account level for all S3 buckets.",
    controlIds: ["soc2-cc6-6", "iso-a-8-2"],
  },
  {
    id: "ev-8",
    title: "Change Management Procedure",
    description: "Standard operating procedure for system and code changes.",
    source: "MANUAL",
    reviewStatus: "APPROVED",
    collectedAt: "2023-12-20T14:30:00Z",
    summary: "Defines change request, approval, testing, and deployment procedures.",
    controlIds: ["soc2-cc8-1"],
  },
];

// Legacy export for backwards compatibility
export const demoFrameworks = DEMO_FRAMEWORKS.map((f) => ({
  key: f.key,
  name: f.name,
  controls: DEMO_CONTROLS.filter((c) => c.frameworkKey === f.key).map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
  })),
}));
