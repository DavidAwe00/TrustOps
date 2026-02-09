/**
 * AI Copilot Service
 * Provides gap analysis, policy drafting, and questionnaire answering
 * Uses OpenAI when API key is available, falls back to demo responses
 */

import { DEMO_CONTROLS, DEMO_FRAMEWORKS } from "@trustops/shared";
import { getEvidenceItems, getControls, getFrameworks, getCoverageStats } from "@/lib/db";
import { isDemo } from "@/lib/demo";
import type {
  GapAnalysisResult,
  PolicyDraft,
  QuestionnaireAnswer,
  Citation,
  ComplianceGap,
  PolicySection,
} from "./types";

const DEMO_ORG_ID = "demo-org-1";

// Check if OpenAI is configured
function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Get OpenAI client (lazy loaded)
async function getOpenAI() {
  const OpenAI = (await import("openai")).default;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Perform gap analysis for a framework
 */
export async function performGapAnalysis(frameworkKey: string): Promise<GapAnalysisResult> {
  const orgId = DEMO_ORG_ID;
  
  // Get data from database or demo store
  const frameworks = isDemo() ? DEMO_FRAMEWORKS : await getFrameworks();
  const framework = frameworks.find((f) => f.key === frameworkKey);
  
  if (!framework) {
    throw new Error(`Framework not found: ${frameworkKey}`);
  }

  const allControls = isDemo() 
    ? DEMO_CONTROLS.filter((c) => c.frameworkKey === frameworkKey)
    : await getControls(frameworkKey);
  
  const evidenceItems = await getEvidenceItems(orgId);
  const approvedEvidence = evidenceItems.filter((e) => e.reviewStatus === "APPROVED");

  // Calculate coverage
  const controlEvidenceMap = new Map<string, typeof approvedEvidence>();
  approvedEvidence.forEach((e) => {
    e.controlIds?.forEach((cid) => {
      const existing = controlEvidenceMap.get(cid) || [];
      existing.push(e);
      controlEvidenceMap.set(cid, existing);
    });
  });

  const coveredControls = allControls.filter((c) => controlEvidenceMap.has(c.id));
  const uncoveredControls = allControls.filter((c) => !controlEvidenceMap.has(c.id));

  // If OpenAI is available, use it for enhanced analysis (even in demo mode)
  if (hasOpenAI()) {
    try {
      return await performAIGapAnalysis(
        framework,
        allControls,
        coveredControls,
        uncoveredControls,
        approvedEvidence,
        controlEvidenceMap
      );
    } catch (error) {
      console.error("OpenAI gap analysis failed, falling back to basic:", error);
    }
  }

  // Basic gap analysis (demo mode or OpenAI fallback)
  return performBasicGapAnalysis(
    frameworkKey,
    framework,
    allControls,
    coveredControls,
    uncoveredControls,
    approvedEvidence
  );
}

async function performAIGapAnalysis(
  framework: { key: string; name: string; version?: string | null },
  allControls: Array<{ id: string; code: string; title: string; category?: string | null; guidance?: string | null }>,
  coveredControls: typeof allControls,
  uncoveredControls: typeof allControls,
  approvedEvidence: Awaited<ReturnType<typeof getEvidenceItems>>,
  controlEvidenceMap: Map<string, typeof approvedEvidence>
): Promise<GapAnalysisResult> {
  const openai = await getOpenAI();

  const prompt = `You are a compliance expert. Analyze the following gap analysis data for ${framework.name} (${framework.version}) and provide actionable recommendations.

## Current State
- Total Controls: ${allControls.length}
- Covered Controls: ${coveredControls.length}
- Uncovered Controls: ${uncoveredControls.length}
- Coverage: ${Math.round((coveredControls.length / allControls.length) * 100)}%

## Uncovered Controls
${uncoveredControls.map((c) => `- ${c.code}: ${c.title}`).join("\n")}

## Available Evidence
${approvedEvidence.map((e) => `- ${e.title}: ${e.summary || e.description || "No summary"}`).join("\n")}

Provide a JSON response with:
1. gaps: Array of gap objects with severity (critical/high/medium/low), recommendation, and suggested evidence types
2. recommendations: Array of 3-5 prioritized overall recommendations
3. readinessScore: Number 0-100 indicating audit readiness

Focus on practical, actionable advice.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a compliance expert. Respond only with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const aiResult = JSON.parse(response.choices[0].message.content || "{}");

  // Build gaps with AI insights
  const gaps: ComplianceGap[] = uncoveredControls.map((control, i) => {
    const aiGap = aiResult.gaps?.[i] || {};
    return {
      controlId: control.id,
      controlCode: control.code,
      controlTitle: control.title,
      severity: aiGap.severity || getSeverityFromCategory(control.category),
      description: `No approved evidence currently maps to ${control.code}. ${control.guidance || ""}`,
      recommendation: aiGap.recommendation || generateBasicRecommendation(control),
      suggestedEvidence: aiGap.suggestedEvidence || generateSuggestedEvidence(control),
      estimatedEffort: aiGap.estimatedEffort || (control.category?.includes("Access") ? "days" : "hours"),
    };
  });

  // Generate citations
  const citations: Citation[] = coveredControls.slice(0, 5).map((control) => {
    const evidence = controlEvidenceMap.get(control.id)?.[0];
    return {
      id: generateId("cite"),
      type: "evidence" as const,
      sourceId: evidence?.id || "",
      sourceTitle: evidence?.title || "Evidence",
      excerpt: evidence?.summary?.slice(0, 100),
      relevance: 0.85 + Math.random() * 0.15,
    };
  });

  const criticalGaps = gaps.filter((g) => g.severity === "critical").length;
  const highGaps = gaps.filter((g) => g.severity === "high").length;
  const mediumGaps = gaps.filter((g) => g.severity === "medium").length;
  const lowGaps = gaps.filter((g) => g.severity === "low").length;
  const coveragePercent = Math.round((coveredControls.length / allControls.length) * 100);

  return {
    id: generateId("gap"),
    frameworkKey: framework.key,
    frameworkName: framework.name,
    analyzedAt: new Date().toISOString(),
    summary: {
      totalControls: allControls.length,
      coveredControls: coveredControls.length,
      gapCount: gaps.length,
      criticalGaps,
      highGaps,
      mediumGaps,
      lowGaps,
      coveragePercent,
      readinessScore: aiResult.readinessScore || Math.max(0, coveragePercent - criticalGaps * 10 - highGaps * 5),
    },
    gaps: gaps.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    }),
    recommendations: aiResult.recommendations || generateOverallRecommendations(gaps, coveragePercent),
    citations,
    approvalStatus: "pending",
  };
}

function performBasicGapAnalysis(
  frameworkKey: string,
  framework: { key: string; name: string; version?: string | null },
  allControls: Array<{ id: string; code: string; title: string; category?: string | null; guidance?: string | null }>,
  coveredControls: typeof allControls,
  uncoveredControls: typeof allControls,
  approvedEvidence: Awaited<ReturnType<typeof getEvidenceItems>>
): GapAnalysisResult {
  const gaps: ComplianceGap[] = uncoveredControls.map((control) => ({
    controlId: control.id,
    controlCode: control.code,
    controlTitle: control.title,
    severity: getSeverityFromCategory(control.category),
    description: `No approved evidence currently maps to ${control.code}. ${control.guidance || ""}`,
    recommendation: generateBasicRecommendation(control),
    suggestedEvidence: generateSuggestedEvidence(control),
    estimatedEffort: control.category?.includes("Access") ? "days" : "hours",
  }));

  const citations: Citation[] = coveredControls.slice(0, 5).map((control) => {
    const evidence = approvedEvidence.find((e) => e.controlIds?.includes(control.id));
    return {
      id: generateId("cite"),
      type: "evidence" as const,
      sourceId: evidence?.id || "",
      sourceTitle: evidence?.title || "Evidence",
      excerpt: evidence?.summary?.slice(0, 100),
      relevance: 0.85 + Math.random() * 0.15,
    };
  });

  const criticalGaps = gaps.filter((g) => g.severity === "critical").length;
  const highGaps = gaps.filter((g) => g.severity === "high").length;
  const mediumGaps = gaps.filter((g) => g.severity === "medium").length;
  const lowGaps = gaps.filter((g) => g.severity === "low").length;
  const coveragePercent = Math.round((coveredControls.length / allControls.length) * 100);
  const readinessScore = Math.max(0, coveragePercent - criticalGaps * 10 - highGaps * 5);

  return {
    id: generateId("gap"),
    frameworkKey,
    frameworkName: framework.name,
    analyzedAt: new Date().toISOString(),
    summary: {
      totalControls: allControls.length,
      coveredControls: coveredControls.length,
      gapCount: gaps.length,
      criticalGaps,
      highGaps,
      mediumGaps,
      lowGaps,
      coveragePercent,
      readinessScore,
    },
    gaps: gaps.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    }),
    recommendations: generateOverallRecommendations(gaps, coveragePercent),
    citations,
    approvalStatus: "pending",
  };
}

/**
 * Generate policy draft
 */
export async function generatePolicyDraft(
  policyType: string,
  frameworkKey?: string
): Promise<PolicyDraft> {
  const orgId = DEMO_ORG_ID;
  const evidenceItems = await getEvidenceItems(orgId);
  const approvedEvidence = evidenceItems.filter((e) => e.reviewStatus === "APPROVED");

  // If OpenAI is available, use it for policy generation (even in demo mode)
  if (hasOpenAI()) {
    try {
      return await generateAIPolicyDraft(policyType, frameworkKey, approvedEvidence);
    } catch (error) {
      console.error("OpenAI policy generation failed, falling back to template:", error);
    }
  }

  // Fall back to template-based generation
  return generateTemplatePolicyDraft(policyType, frameworkKey, approvedEvidence);
}

async function generateAIPolicyDraft(
  policyType: string,
  frameworkKey: string | undefined,
  approvedEvidence: Awaited<ReturnType<typeof getEvidenceItems>>
): Promise<PolicyDraft> {
  const openai = await getOpenAI();

  const policyNames: Record<string, string> = {
    "access-control": "Access Control Policy",
    "incident-response": "Incident Response Policy",
    "data-protection": "Data Protection Policy",
    "change-management": "Change Management Policy",
    "vendor-management": "Vendor Management Policy",
  };

  const policyTitle = policyNames[policyType] || `${policyType.replace(/-/g, " ")} Policy`;

  const prompt = `Generate a comprehensive ${policyTitle} for a technology company pursuing ${frameworkKey || "SOC2 and ISO27001"} compliance.

The policy should include:
1. Purpose and Scope
2. Roles and Responsibilities
3. Policy Requirements (3-5 main sections with specific requirements)
4. Compliance and Enforcement
5. Review and Maintenance

Format the response as JSON with:
- title: Policy title
- sections: Array of { title: string, content: string }
- summary: 2-3 sentence executive summary

Make the policy practical and actionable. Use specific requirements, not vague statements.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a compliance policy expert. Respond only with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const aiResult = JSON.parse(response.choices[0].message.content || "{}");

  // Generate citations from evidence
  const citations: Citation[] = approvedEvidence.slice(0, 3).map((e) => ({
    id: generateId("cite"),
    type: "evidence" as const,
    sourceId: e.id,
    sourceTitle: e.title,
    excerpt: e.summary?.slice(0, 80),
    relevance: 0.7 + Math.random() * 0.3,
  }));

  if (frameworkKey) {
    const frameworks = isDemo() ? DEMO_FRAMEWORKS : await getFrameworks();
    const framework = frameworks.find((f) => f.key === frameworkKey);
    if (framework) {
      citations.push({
        id: generateId("cite"),
        type: "framework" as const,
        sourceId: framework.key,
        sourceTitle: `${framework.name} (${framework.version})`,
        excerpt: "Framework requirements and controls",
        relevance: 0.95,
      });
    }
  }

  const sections: PolicySection[] = (aiResult.sections || []).map((s: { title: string; content: string }, i: number) => ({
    title: s.title,
    content: s.content,
    citations: i < citations.length ? [citations[i]] : [],
  }));

  return {
    id: generateId("policy"),
    title: aiResult.title || policyTitle,
    policyType,
    version: "1.0-draft",
    createdAt: new Date().toISOString(),
    summary: aiResult.summary || `This ${policyTitle} has been generated based on ${frameworkKey || "industry"} best practices. Review and customize before approval.`,
    sections,
    controlsMapped: [],
    citations,
    approvalStatus: "pending",
  };
}

function generateTemplatePolicyDraft(
  policyType: string,
  frameworkKey: string | undefined,
  approvedEvidence: Awaited<ReturnType<typeof getEvidenceItems>>
): PolicyDraft {
  const policyTemplates: Record<string, { title: string; sections: PolicySection[] }> = {
    "access-control": {
      title: "Access Control Policy",
      sections: [
        {
          title: "1. Purpose",
          content: `This Access Control Policy establishes the requirements for managing access to information systems and data within the organization. It ensures that access is granted based on the principle of least privilege and business need-to-know.`,
          citations: [],
        },
        {
          title: "2. Scope",
          content: `This policy applies to all employees, contractors, and third-party users who access organizational information systems, including cloud services, on-premises systems, and data repositories.`,
          citations: [],
        },
        {
          title: "3. Access Control Requirements",
          content: `3.1 User Access Management\n- All access requests must be formally documented and approved by the data owner\n- Access rights are reviewed quarterly and upon role changes\n- Privileged access requires additional approval from IT Security\n\n3.2 Authentication\n- Multi-factor authentication (MFA) is required for all remote access\n- Passwords must meet complexity requirements (minimum 12 characters)\n- Service accounts must use certificate-based authentication where possible`,
          citations: [],
        },
        {
          title: "4. Access Revocation",
          content: `Access must be revoked within 24 hours of employment termination or role change. Emergency access revocation procedures are in place for immediate threats.`,
          citations: [],
        },
        {
          title: "5. Monitoring and Audit",
          content: `All access attempts are logged and monitored. Failed authentication attempts trigger alerts after 5 consecutive failures. Access logs are retained for 1 year minimum.`,
          citations: [],
        },
      ],
    },
    "incident-response": {
      title: "Incident Response Policy",
      sections: [
        {
          title: "1. Purpose",
          content: `This Incident Response Policy defines the procedures for detecting, responding to, and recovering from security incidents to minimize impact and ensure business continuity.`,
          citations: [],
        },
        {
          title: "2. Incident Classification",
          content: `Incidents are classified by severity:\n- Critical: Data breach, ransomware, complete system compromise\n- High: Unauthorized access, malware infection, DDoS attack\n- Medium: Policy violation, suspicious activity, minor security event\n- Low: Failed attack attempts, informational alerts`,
          citations: [],
        },
        {
          title: "3. Response Procedures",
          content: `3.1 Detection & Analysis\n- Monitor security alerts 24/7\n- Triage and classify incidents within 15 minutes\n- Document all findings in incident tracking system\n\n3.2 Containment\n- Isolate affected systems immediately for critical incidents\n- Preserve evidence for forensic analysis\n- Notify stakeholders per communication plan`,
          citations: [],
        },
        {
          title: "4. Recovery",
          content: `Systems are restored from verified clean backups. All restored systems undergo security verification before returning to production.`,
          citations: [],
        },
        {
          title: "5. Post-Incident Review",
          content: `A post-incident review is conducted within 5 business days. Lessons learned are documented and fed back into security controls.`,
          citations: [],
        },
      ],
    },
    "data-protection": {
      title: "Data Protection Policy",
      sections: [
        {
          title: "1. Purpose",
          content: `This Data Protection Policy establishes requirements for protecting organizational data throughout its lifecycle, ensuring confidentiality, integrity, and availability.`,
          citations: [],
        },
        {
          title: "2. Data Classification",
          content: `Data is classified into four categories:\n- Public: No restrictions on disclosure\n- Internal: For internal use only\n- Confidential: Restricted to authorized personnel\n- Restricted: Highest sensitivity, strict access controls`,
          citations: [],
        },
        {
          title: "3. Encryption Requirements",
          content: `- Data at rest: AES-256 encryption for Confidential and Restricted data\n- Data in transit: TLS 1.3 minimum for all network communications\n- Key management: Keys stored in hardware security modules (HSM)`,
          citations: [],
        },
        {
          title: "4. Data Retention",
          content: `Data retention periods are defined by data classification and regulatory requirements. Data must be securely deleted when retention period expires.`,
          citations: [],
        },
      ],
    },
  };

  const template = policyTemplates[policyType] || policyTemplates["access-control"];

  const citations: Citation[] = approvedEvidence.slice(0, 3).map((e) => ({
    id: generateId("cite"),
    type: "evidence" as const,
    sourceId: e.id,
    sourceTitle: e.title,
    excerpt: e.summary?.slice(0, 80),
    relevance: 0.7 + Math.random() * 0.3,
  }));

  if (frameworkKey) {
    const framework = DEMO_FRAMEWORKS.find((f) => f.key === frameworkKey);
    if (framework) {
      citations.push({
        id: generateId("cite"),
        type: "framework" as const,
        sourceId: framework.key,
        sourceTitle: `${framework.name} (${framework.version})`,
        excerpt: "Framework requirements and controls",
        relevance: 0.95,
      });
    }
  }

  return {
    id: generateId("policy"),
    title: template.title,
    policyType,
    version: "1.0-draft",
    createdAt: new Date().toISOString(),
    summary: `This ${template.title} has been generated based on ${frameworkKey || "industry"} best practices and your existing compliance evidence. Review and customize before approval.`,
    sections: template.sections.map((section, index) => ({
      ...section,
      citations: index < citations.length ? [citations[index]] : [],
    })),
    controlsMapped: [],
    citations,
    approvalStatus: "pending",
  };
}

/**
 * Answer a questionnaire question
 */
export async function answerQuestion(
  question: string,
  context?: string
): Promise<QuestionnaireAnswer> {
  const orgId = DEMO_ORG_ID;
  const evidenceItems = await getEvidenceItems(orgId);
  const approvedEvidence = evidenceItems.filter((e) => e.reviewStatus === "APPROVED");

  // Find relevant evidence based on question keywords
  const keywords = question.toLowerCase().split(" ").filter((w) => w.length > 4);
  const relevantEvidence = approvedEvidence.filter((e) => {
    const text = `${e.title} ${e.summary || ""} ${e.description || ""}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });

  // If OpenAI is available, use it for answering (even in demo mode)
  if (hasOpenAI()) {
    try {
      return await answerQuestionWithAI(question, context, relevantEvidence);
    } catch (error) {
      console.error("OpenAI question answering failed, falling back to basic:", error);
    }
  }

  // Fall back to template-based answering
  return answerQuestionBasic(question, relevantEvidence);
}

async function answerQuestionWithAI(
  question: string,
  context: string | undefined,
  relevantEvidence: Awaited<ReturnType<typeof getEvidenceItems>>
): Promise<QuestionnaireAnswer> {
  const openai = await getOpenAI();

  const evidenceContext = relevantEvidence
    .slice(0, 5)
    .map((e) => `- ${e.title}: ${e.summary || e.description || "No details"}`)
    .join("\n");

  const prompt = `You are answering a security/compliance questionnaire for an organization. 

Question: ${question}

${context ? `Additional Context: ${context}` : ""}

Available Evidence:
${evidenceContext || "No directly relevant evidence found."}

Provide a professional, accurate answer that:
1. Directly addresses the question
2. References specific evidence where applicable
3. Is concise but complete
4. Uses confident language if evidence supports the answer
5. Acknowledges gaps if evidence is insufficient

Format as JSON with:
- answer: The response text
- confidence: Number 0-1 indicating confidence level
- suggestedEvidence: Array of evidence types that would strengthen the answer (if needed)`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a compliance expert answering questionnaires. Respond only with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  const aiResult = JSON.parse(response.choices[0].message.content || "{}");

  const citations: Citation[] = relevantEvidence.slice(0, 3).map((e) => ({
    id: generateId("cite"),
    type: "evidence" as const,
    sourceId: e.id,
    sourceTitle: e.title,
    excerpt: e.summary?.slice(0, 100),
    relevance: 0.7 + Math.random() * 0.3,
  }));

  return {
    id: generateId("ans"),
    questionId: generateId("q"),
    question,
    answer: aiResult.answer || "Unable to generate answer.",
    confidence: aiResult.confidence || (citations.length > 0 ? 0.7 : 0.4),
    citations,
    suggestedEvidence: aiResult.suggestedEvidence || [],
    approvalStatus: "pending",
  };
}

function answerQuestionBasic(
  question: string,
  relevantEvidence: Awaited<ReturnType<typeof getEvidenceItems>>
): QuestionnaireAnswer {
  const citations: Citation[] = relevantEvidence.slice(0, 3).map((e) => ({
    id: generateId("cite"),
    type: "evidence" as const,
    sourceId: e.id,
    sourceTitle: e.title,
    excerpt: e.summary?.slice(0, 100),
    relevance: 0.7 + Math.random() * 0.3,
  }));

  const answer = generateBasicQuestionAnswer(question, relevantEvidence);
  const confidence = citations.length > 0 ? 0.7 + citations.length * 0.1 : 0.4;

  return {
    id: generateId("ans"),
    questionId: generateId("q"),
    question,
    answer,
    confidence: Math.min(confidence, 0.95),
    citations,
    suggestedEvidence:
      relevantEvidence.length === 0
        ? ["Access control documentation", "Security policy documents", "Audit logs"]
        : [],
    approvalStatus: "pending",
  };
}

// Helper functions

function getSeverityFromCategory(category?: string | null): "critical" | "high" | "medium" | "low" {
  const severityMap: Record<string, "critical" | "high" | "medium" | "low"> = {
    "Logical & Physical Access": "critical",
    "System Operations": "high",
    "Change Management": "medium",
    "Access Control": "critical",
    "Cryptography": "high",
    "Organizational Controls": "medium",
    "Technological Controls": "high",
  };
  return category ? severityMap[category] || "medium" : "medium";
}

function generateBasicRecommendation(control: { code: string; title: string; guidance?: string | null }): string {
  const recommendations: Record<string, string> = {
    CC6: "Implement and document access control mechanisms. Consider deploying an identity provider with SSO and MFA capabilities.",
    CC7: "Establish system monitoring and alerting. Deploy SIEM solution and define incident response procedures.",
    CC8: "Implement change management process with proper approvals, testing, and rollback procedures.",
    "A.5": "Document and implement organizational security policies. Ensure management approval and regular reviews.",
    "A.8": "Implement technical security controls. Deploy monitoring, logging, and vulnerability management.",
    "A.9": "Review and document access control policies. Implement role-based access control (RBAC).",
    "A.10": "Deploy encryption for data at rest and in transit. Document key management procedures.",
  };

  const prefix = control.code.split(".")[0];
  return (
    recommendations[prefix] ||
    `Document and implement controls for ${control.title}. Collect evidence such as screenshots, configuration exports, or audit logs.`
  );
}

function generateSuggestedEvidence(control: { code: string; category?: string | null }): string[] {
  const suggestions: Record<string, string[]> = {
    "Logical & Physical Access": [
      "Access control policy document",
      "User access review spreadsheet",
      "MFA configuration screenshot",
      "IAM role definitions export",
    ],
    "System Operations": [
      "Monitoring dashboard screenshot",
      "Alerting configuration",
      "Incident response runbook",
      "On-call schedule",
    ],
    "Change Management": [
      "Change management policy",
      "Pull request approval screenshots",
      "Deployment pipeline configuration",
      "Release notes template",
    ],
    "Access Control": [
      "RBAC matrix document",
      "Privileged access management (PAM) logs",
      "Access request workflow",
    ],
    "Cryptography": ["Encryption policy document", "Key rotation logs", "TLS certificate inventory"],
    "Organizational Controls": [
      "Security policy documents",
      "Risk assessment reports",
      "Management review minutes",
    ],
    "Technological Controls": [
      "System configuration exports",
      "Vulnerability scan reports",
      "Penetration test results",
    ],
  };

  return (
    (control.category && suggestions[control.category]) || [
      "Policy document",
      "Configuration screenshot",
      "Audit log export",
    ]
  );
}

function generateOverallRecommendations(gaps: ComplianceGap[], coveragePercent: number): string[] {
  const recommendations: string[] = [];

  if (coveragePercent < 50) {
    recommendations.push(
      "📊 Your current coverage is below 50%. Focus on addressing critical and high-severity gaps first to establish a baseline compliance posture."
    );
  }

  const criticalGaps = gaps.filter((g) => g.severity === "critical");
  if (criticalGaps.length > 0) {
    recommendations.push(
      `🚨 Address ${criticalGaps.length} critical gap(s) immediately: ${criticalGaps.map((g) => g.controlCode).join(", ")}`
    );
  }

  const quickWins = gaps.filter((g) => g.estimatedEffort === "hours");
  if (quickWins.length > 0) {
    recommendations.push(
      `⚡ Quick wins available: ${quickWins.length} gaps can be addressed in hours. Start with ${quickWins[0]?.controlCode}.`
    );
  }

  recommendations.push(
    "📝 Consider scheduling a focused compliance sprint to address multiple related controls together.",
    "🔄 Set up automated evidence collection from your GitHub and AWS integrations to reduce manual work."
  );

  return recommendations;
}

function generateBasicQuestionAnswer(
  question: string,
  relevantEvidence: Array<{ title: string; summary?: string | null }>
): string {
  const q = question.toLowerCase();

  if (q.includes("how do you") || q.includes("describe")) {
    if (relevantEvidence.length > 0) {
      return `Based on our documented evidence, we ${relevantEvidence[0].summary || relevantEvidence[0].title}. This process is documented and regularly reviewed as part of our compliance program. [See citations for supporting evidence]`;
    }
    return `Our organization follows industry best practices for this area. We are currently documenting our processes and gathering evidence to support this control. Please refer to our security policies for detailed procedures.`;
  }

  if (q.includes("do you have") || q.includes("is there")) {
    if (relevantEvidence.length > 0) {
      return `Yes, we have implemented this control. Our evidence includes: ${relevantEvidence.map((e) => e.title).join(", ")}. These documents demonstrate our compliance with the relevant requirements.`;
    }
    return `We are in the process of implementing and documenting this control. Our compliance team is working to gather the necessary evidence and documentation.`;
  }

  if (q.includes("when") || q.includes("how often")) {
    return `This process is performed on a regular schedule as defined in our policies. Reviews are conducted quarterly, with continuous monitoring in place for real-time detection. Audit logs are retained for the required period per our data retention policy.`;
  }

  if (q.includes("who is responsible")) {
    return `Responsibility is assigned based on our RACI matrix. The Security Team owns the control implementation, with oversight from the Compliance Officer. Department heads are accountable for their team's adherence to policies.`;
  }

  if (relevantEvidence.length > 0) {
    return `Based on our compliance documentation, this is addressed through: ${relevantEvidence.map((e) => e.title).join(", ")}. Our approach aligns with industry standards and regulatory requirements. Please review the cited evidence for specific details.`;
  }

  return `This is an area we are actively working on as part of our compliance program. We recommend reviewing our security policies and scheduling a follow-up discussion with our compliance team for detailed information.`;
}
