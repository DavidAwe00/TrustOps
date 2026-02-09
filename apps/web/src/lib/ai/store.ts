/**
 * AI Copilot Store
 * Manages chat sessions, pending approvals, and AI-generated content
 */

import type {
  ChatMessage,
  CopilotSession,
  GapAnalysisResult,
  PolicyDraft,
  QuestionnaireAnswer,
  ApprovalStatus,
} from "./types";

// In-memory stores
let sessions: CopilotSession[] = [];
let pendingApprovals: Array<{
  id: string;
  type: "gap_analysis" | "policy_draft" | "questionnaire_answer";
  content: GapAnalysisResult | PolicyDraft | QuestionnaireAnswer;
  createdAt: string;
}> = [];

let messageIdCounter = 1;

/**
 * Get or create session for org
 */
export function getOrCreateSession(orgId: string, userId: string): CopilotSession {
  let session = sessions.find((s) => s.orgId === orgId);
  
  if (!session) {
    session = {
      id: `session-${Date.now()}`,
      orgId,
      userId,
      messages: [
        {
          id: `msg-0`,
          role: "assistant",
          content: `👋 Hello! I'm your TrustOps AI Copilot. I can help you with:

• **Gap Analysis** — Identify missing controls and prioritize remediation
• **Policy Drafting** — Generate compliance policies with citations
• **Questionnaire Answers** — Answer security questionnaires using your evidence

What would you like to work on today?`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    sessions.push(session);
  }
  
  return session;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): CopilotSession | undefined {
  return sessions.find((s) => s.id === sessionId);
}

/**
 * Add message to session
 */
export function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, "id" | "timestamp">
): ChatMessage {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const newMessage: ChatMessage = {
    ...message,
    id: `msg-${messageIdCounter++}`,
    timestamp: new Date().toISOString(),
  };

  session.messages.push(newMessage);
  session.updatedAt = new Date().toISOString();

  return newMessage;
}

/**
 * Get all messages for a session
 */
export function getMessages(sessionId: string): ChatMessage[] {
  const session = sessions.find((s) => s.id === sessionId);
  return session?.messages || [];
}

/**
 * Add pending approval
 */
export function addPendingApproval(
  type: "gap_analysis" | "policy_draft" | "questionnaire_answer",
  content: GapAnalysisResult | PolicyDraft | QuestionnaireAnswer
): void {
  pendingApprovals.push({
    id: content.id,
    type,
    content,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Get all pending approvals
 */
export function getPendingApprovals() {
  return pendingApprovals.filter(
    (a) => (a.content as GapAnalysisResult | PolicyDraft | QuestionnaireAnswer).approvalStatus === "pending"
  );
}

/**
 * Update approval status
 */
export function updateApprovalStatus(
  id: string,
  status: ApprovalStatus,
  approvedBy?: string,
  notes?: string
): boolean {
  const approval = pendingApprovals.find((a) => a.id === id);
  if (!approval) return false;

  const content = approval.content as GapAnalysisResult | PolicyDraft | QuestionnaireAnswer;
  content.approvalStatus = status;
  
  if (status === "approved" && approvedBy) {
    content.approvedBy = approvedBy;
    content.approvedAt = new Date().toISOString();
  }
  
  if (status === "revision_requested" && notes && "revisionNotes" in content) {
    (content as PolicyDraft).revisionNotes = notes;
  }

  return true;
}

/**
 * Get approval by ID
 */
export function getApproval(id: string) {
  return pendingApprovals.find((a) => a.id === id);
}

/**
 * Clear session messages (for testing)
 */
export function clearSession(sessionId: string): void {
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.messages = session.messages.slice(0, 1); // Keep welcome message
    session.updatedAt = new Date().toISOString();
  }
}

