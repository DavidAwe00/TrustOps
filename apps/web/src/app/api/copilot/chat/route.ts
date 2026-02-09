import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateSession,
  addMessage,
  addPendingApproval,
} from "@/lib/ai/store";
import {
  performGapAnalysis,
  generatePolicyDraft,
  answerQuestion,
} from "@/lib/ai/service";
import { createAuditLog } from "@/lib/db";
import type { ChatMessage } from "@/lib/ai/types";

const ORG_ID = "demo-org-1";
const USER_ID = "demo-user-1";

/**
 * GET /api/copilot/chat - Get chat session
 */
export async function GET() {
  const session = getOrCreateSession(ORG_ID, USER_ID);
  return NextResponse.json({ session });
}

/**
 * POST /api/copilot/chat - Send message and get response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, action } = body;

    if (!message && !action) {
      return NextResponse.json(
        { error: "Message or action is required" },
        { status: 400 }
      );
    }

    const session = getOrCreateSession(ORG_ID, USER_ID);

    // Add user message
    if (message) {
      addMessage(session.id, {
        role: "user",
        content: message,
      });
    }

    let responseMessage: Omit<ChatMessage, "id" | "timestamp">;

    // Handle specific actions
    if (action) {
      switch (action.type) {
        case "gap_analysis": {
          const frameworkKey = action.frameworkKey || "SOC2";
          const result = await performGapAnalysis(frameworkKey);
          addPendingApproval("gap_analysis", result);

          await createAuditLog(ORG_ID, {
            action: "ai.gap_analysis",
            targetType: "gap_analysis",
            targetId: result.id,
            metadata: {
              framework: frameworkKey,
              gapCount: result.summary.gapCount,
              coveragePercent: result.summary.coveragePercent,
            },
          });

          responseMessage = {
            role: "assistant",
            content: formatGapAnalysisResponse(result),
            actionType: "gap_analysis",
            actionResult: result,
            citations: result.citations,
          };
          break;
        }

        case "policy_draft": {
          const policyType = action.policyType || "access-control";
          const frameworkKey = action.frameworkKey;
          const result = await generatePolicyDraft(policyType, frameworkKey);
          addPendingApproval("policy_draft", result);

          await createAuditLog(ORG_ID, {
            action: "ai.policy_draft",
            targetType: "policy_draft",
            targetId: result.id,
            metadata: { policyType, title: result.title },
          });

          responseMessage = {
            role: "assistant",
            content: formatPolicyDraftResponse(result),
            actionType: "policy_draft",
            actionResult: result,
            citations: result.citations,
          };
          break;
        }

        case "questionnaire_answer": {
          const question = action.question || message;
          const result = await answerQuestion(question);
          addPendingApproval("questionnaire_answer", result);

          await createAuditLog(ORG_ID, {
            action: "ai.questionnaire_answer",
            targetType: "questionnaire_answer",
            targetId: result.id,
            metadata: { question: question.slice(0, 100), confidence: result.confidence },
          });

          responseMessage = {
            role: "assistant",
            content: formatQuestionAnswerResponse(result),
            actionType: "questionnaire_answer",
            actionResult: result,
            citations: result.citations,
          };
          break;
        }

        default:
          responseMessage = {
            role: "assistant",
            content: "I don't recognize that action. Try asking about gap analysis, policy drafting, or questionnaire answers.",
          };
      }
    } else {
      // Natural language processing - detect intent
      const intent = detectIntent(message);
      
      if (intent.type === "gap_analysis") {
        const result = await performGapAnalysis(intent.frameworkKey || "SOC2");
        addPendingApproval("gap_analysis", result);

        await createAuditLog(ORG_ID, {
          action: "ai.gap_analysis",
          targetType: "gap_analysis",
          targetId: result.id,
          metadata: {
            framework: intent.frameworkKey || "SOC2",
            gapCount: result.summary.gapCount,
          },
        });

        responseMessage = {
          role: "assistant",
          content: formatGapAnalysisResponse(result),
          actionType: "gap_analysis",
          actionResult: result,
          citations: result.citations,
        };
      } else if (intent.type === "policy_draft") {
        const result = await generatePolicyDraft(intent.policyType || "access-control");
        addPendingApproval("policy_draft", result);

        responseMessage = {
          role: "assistant",
          content: formatPolicyDraftResponse(result),
          actionType: "policy_draft",
          actionResult: result,
          citations: result.citations,
        };
      } else if (intent.type === "questionnaire") {
        const result = await answerQuestion(message);
        addPendingApproval("questionnaire_answer", result);

        responseMessage = {
          role: "assistant",
          content: formatQuestionAnswerResponse(result),
          actionType: "questionnaire_answer",
          actionResult: result,
          citations: result.citations,
        };
      } else {
        responseMessage = {
          role: "assistant",
          content: generateConversationalResponse(message),
        };
      }
    }

    const savedMessage = addMessage(session.id, responseMessage);

    return NextResponse.json({
      message: savedMessage,
      session: getOrCreateSession(ORG_ID, USER_ID),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process message" },
      { status: 500 }
    );
  }
}

// Intent detection
function detectIntent(message: string): {
  type: "gap_analysis" | "policy_draft" | "questionnaire" | "general";
  frameworkKey?: string;
  policyType?: string;
} {
  const m = message.toLowerCase();

  if (m.includes("gap") || m.includes("coverage") || m.includes("missing") || m.includes("analyze")) {
    const frameworkKey = m.includes("iso") ? "ISO27001" : "SOC2";
    return { type: "gap_analysis", frameworkKey };
  }

  if (m.includes("policy") || m.includes("draft") || m.includes("document")) {
    let policyType = "access-control";
    if (m.includes("incident")) policyType = "incident-response";
    if (m.includes("data") || m.includes("protection")) policyType = "data-protection";
    return { type: "policy_draft", policyType };
  }

  if (m.includes("question") || m.includes("answer") || m.includes("how do") || 
      m.includes("do you have") || m.includes("describe")) {
    return { type: "questionnaire" };
  }

  return { type: "general" };
}

// Response formatters
function formatGapAnalysisResponse(result: Awaited<ReturnType<typeof performGapAnalysis>>): string {
  const { summary, gaps, recommendations } = result;
  
  let response = `## 📊 Gap Analysis Complete\n\n`;
  response += `**Framework:** ${result.frameworkName}\n`;
  response += `**Coverage:** ${summary.coveragePercent}% (${summary.coveredControls}/${summary.totalControls} controls)\n`;
  response += `**Readiness Score:** ${summary.readinessScore}/100\n\n`;

  if (summary.gapCount > 0) {
    response += `### 🔴 ${summary.gapCount} Gaps Identified\n\n`;
    
    if (summary.criticalGaps > 0) {
      response += `- **Critical:** ${summary.criticalGaps}\n`;
    }
    if (summary.highGaps > 0) {
      response += `- **High:** ${summary.highGaps}\n`;
    }
    if (summary.mediumGaps > 0) {
      response += `- **Medium:** ${summary.mediumGaps}\n`;
    }
    if (summary.lowGaps > 0) {
      response += `- **Low:** ${summary.lowGaps}\n`;
    }

    response += `\n### Top Priority Gaps\n\n`;
    gaps.slice(0, 3).forEach((gap, i) => {
      response += `${i + 1}. **${gap.controlCode}** - ${gap.controlTitle}\n`;
      response += `   _Severity: ${gap.severity}_ | _Effort: ${gap.estimatedEffort}_\n`;
      response += `   ${gap.recommendation}\n\n`;
    });
  } else {
    response += `✅ **No gaps found!** All controls have approved evidence.\n\n`;
  }

  response += `### 💡 Recommendations\n\n`;
  recommendations.slice(0, 3).forEach((rec) => {
    response += `${rec}\n\n`;
  });

  response += `\n---\n_This analysis requires approval before being finalized. Review the gaps and click Approve when ready._`;

  return response;
}

function formatPolicyDraftResponse(result: Awaited<ReturnType<typeof generatePolicyDraft>>): string {
  let response = `## 📝 Policy Draft Generated\n\n`;
  response += `**${result.title}**\n`;
  response += `_Version ${result.version}_\n\n`;
  response += `${result.summary}\n\n`;
  response += `### Sections\n\n`;

  result.sections.forEach((section) => {
    response += `**${section.title}**\n`;
    response += `${section.content.slice(0, 200)}${section.content.length > 200 ? "..." : ""}\n\n`;
  });

  if (result.citations.length > 0) {
    response += `### 📚 Citations (${result.citations.length})\n\n`;
    result.citations.slice(0, 3).forEach((citation, i) => {
      response += `${i + 1}. ${citation.sourceTitle}`;
      if (citation.excerpt) {
        response += ` — _"${citation.excerpt}"_`;
      }
      response += `\n`;
    });
  }

  response += `\n---\n_This policy draft requires human review and approval. Edit as needed before finalizing._`;

  return response;
}

function formatQuestionAnswerResponse(result: Awaited<ReturnType<typeof answerQuestion>>): string {
  let response = `## 💬 Answer Generated\n\n`;
  response += `**Question:** ${result.question}\n\n`;
  response += `**Answer:** ${result.answer}\n\n`;
  response += `**Confidence:** ${Math.round(result.confidence * 100)}%\n\n`;

  if (result.citations.length > 0) {
    response += `### 📚 Supporting Evidence\n\n`;
    result.citations.forEach((citation, i) => {
      response += `${i + 1}. **${citation.sourceTitle}**`;
      if (citation.excerpt) {
        response += `\n   _"${citation.excerpt}"_`;
      }
      response += `\n`;
    });
  }

  if (result.suggestedEvidence.length > 0) {
    response += `\n### 📋 Suggested Evidence to Collect\n\n`;
    result.suggestedEvidence.forEach((ev) => {
      response += `- ${ev}\n`;
    });
  }

  response += `\n---\n_Please review and approve this answer before using it in your questionnaire response._`;

  return response;
}

function generateConversationalResponse(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("hello") || m.includes("hi") || m.includes("hey")) {
    return `Hello! 👋 How can I help you with your compliance needs today? I can:\n\n• Run a **gap analysis** on your SOC2 or ISO27001 controls\n• Draft **policies** like access control or incident response\n• Answer **questionnaire** questions using your evidence\n\nJust let me know what you'd like to do!`;
  }

  if (m.includes("help") || m.includes("what can")) {
    return `I'm your TrustOps AI Copilot! Here's what I can do:\n\n**🔍 Gap Analysis**\nTry: "Analyze my SOC2 gaps" or "What controls am I missing?"\n\n**📝 Policy Drafting**\nTry: "Draft an access control policy" or "Create an incident response policy"\n\n**💬 Questionnaire Answers**\nTry: "How do you handle access control?" or paste any security question\n\nAll AI-generated content requires your approval before being finalized.`;
  }

  if (m.includes("thank")) {
    return `You're welcome! 😊 Let me know if you need anything else. I'm here to help with your compliance journey.`;
  }

  return `I'm not sure I understand that request. Here are some things I can help with:\n\n• **Gap Analysis**: "Analyze my SOC2 compliance gaps"\n• **Policy Draft**: "Draft a data protection policy"\n• **Questionnaire**: "How do you manage user access?"\n\nWhat would you like to do?`;
}

