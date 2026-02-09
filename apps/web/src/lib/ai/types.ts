/**
 * AI Copilot Types
 * Defines structures for AI-generated content with strict citations
 */

export type AIActionType = 
  | "gap_analysis"
  | "policy_draft"
  | "questionnaire_answer"
  | "control_recommendation"
  | "evidence_suggestion";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "revision_requested";

/**
 * Citation pointing to source evidence or control
 */
export interface Citation {
  id: string;
  type: "evidence" | "control" | "framework" | "policy";
  sourceId: string;
  sourceTitle: string;
  excerpt?: string;
  relevance: number; // 0-1 confidence score
}

/**
 * Gap in compliance coverage
 */
export interface ComplianceGap {
  controlId: string;
  controlCode: string;
  controlTitle: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
  suggestedEvidence: string[];
  estimatedEffort: "hours" | "days" | "weeks";
}

/**
 * Gap Analysis Result
 */
export interface GapAnalysisResult {
  id: string;
  frameworkKey: string;
  frameworkName: string;
  analyzedAt: string;
  summary: {
    totalControls: number;
    coveredControls: number;
    gapCount: number;
    criticalGaps: number;
    highGaps: number;
    mediumGaps: number;
    lowGaps: number;
    coveragePercent: number;
    readinessScore: number; // 0-100
  };
  gaps: ComplianceGap[];
  recommendations: string[];
  citations: Citation[];
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * Policy Section
 */
export interface PolicySection {
  title: string;
  content: string;
  citations: Citation[];
}

/**
 * Generated Policy Draft
 */
export interface PolicyDraft {
  id: string;
  title: string;
  policyType: string;
  version: string;
  createdAt: string;
  summary: string;
  sections: PolicySection[];
  controlsMapped: string[];
  citations: Citation[];
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  revisionNotes?: string;
}

/**
 * Questionnaire Answer
 */
export interface QuestionnaireAnswer {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  confidence: number; // 0-1
  citations: Citation[];
  suggestedEvidence: string[];
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  editedAnswer?: string;
}

/**
 * Chat Message
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: Citation[];
  actionType?: AIActionType;
  actionResult?: GapAnalysisResult | PolicyDraft | QuestionnaireAnswer;
}

/**
 * AI Copilot Session
 */
export interface CopilotSession {
  id: string;
  orgId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

