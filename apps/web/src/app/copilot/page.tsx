"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DashboardShell,
  PageHeader,
  PageContent,
} from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Loader2,
  Search,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Citation {
  id: string;
  type: string;
  sourceId: string;
  sourceTitle: string;
  excerpt?: string;
  relevance: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: Citation[];
  actionType?: string;
  actionResult?: {
    id: string;
    approvalStatus: string;
    [key: string]: unknown;
  };
}

interface CopilotSession {
  id: string;
  messages: ChatMessage[];
}

const quickActions = [
  {
    id: "gap-soc2",
    label: "Analyze SOC2 Gaps",
    icon: Search,
    action: { type: "gap_analysis", frameworkKey: "SOC2" },
    description: "Identify missing controls and coverage gaps",
  },
  {
    id: "gap-iso",
    label: "Analyze ISO27001 Gaps",
    icon: Search,
    action: { type: "gap_analysis", frameworkKey: "ISO27001" },
    description: "Analyze ISO compliance coverage",
  },
  {
    id: "policy-access",
    label: "Draft Access Control Policy",
    icon: FileText,
    action: { type: "policy_draft", policyType: "access-control" },
    description: "Generate access control policy document",
  },
  {
    id: "policy-incident",
    label: "Draft Incident Response Policy",
    icon: FileText,
    action: { type: "policy_draft", policyType: "incident-response" },
    description: "Generate incident response procedures",
  },
];

export default function CopilotPage() {
  const [session, setSession] = useState<CopilotSession | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/copilot/chat");
      const data = await response.json();
      setSession(data.session);
    } catch (error) {
      console.error("Failed to fetch session:", error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, scrollToBottom]);

  const sendMessage = async (message?: string, action?: { type: string; [key: string]: unknown }) => {
    const content = message || inputValue.trim();
    if (!content && !action) return;

    setIsLoading(true);
    setInputValue("");

    // Optimistically add user message
    if (content && !action) {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: `temp-${Date.now()}`,
                  role: "user" as const,
                  content,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : null
      );
    }

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, action }),
      });

      const data = await response.json();
      if (data.session) {
        setSession(data.session);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleApproval = async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/copilot/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Refresh session to update approval status
        await fetchSession();
      }
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="AI Copilot"
        description="Get AI-powered assistance with gap analysis, policy drafting, and questionnaires"
      >
        <Button variant="outline" size="sm" onClick={fetchSession}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <PageContent>
        <div className="flex h-[calc(100vh-12rem)] gap-4">
          {/* Main Chat Area */}
          <div className="flex flex-1 flex-col">
            <Card className="flex flex-1 flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {isInitializing ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {session?.messages.map((message, index) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        onApprove={(id) => handleApproval(id, "approve")}
                        onReject={(id) => handleApproval(id, "reject")}
                        isLatest={index === session.messages.length - 1}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bot className="h-5 w-5" />
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t bg-muted/30 p-4">
                <div className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about compliance, request a gap analysis, or paste a questionnaire question..."
                      className="min-h-[2.5rem] max-h-32 w-full resize-none rounded-lg border bg-background px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      rows={1}
                      disabled={isLoading}
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-1.5 right-1.5 h-7 w-7 p-0"
                      onClick={() => sendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="hidden w-72 flex-col gap-4 lg:flex">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.id}
                      onClick={() => sendMessage(undefined, qa.action)}
                      disabled={isLoading}
                      className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
                    >
                      <qa.icon className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{qa.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {qa.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Example Questions
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    "How do you handle user access control?",
                    "Describe your incident response process",
                    "Do you have encryption at rest?",
                    "What is your data retention policy?",
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                      className="block w-full rounded-md border px-3 py-2 text-left text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </DashboardShell>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  onApprove,
  onReject,
  isLatest,
}: {
  message: ChatMessage;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLatest: boolean;
}) {
  const [showCitations, setShowCitations] = useState(false);
  const isUser = message.role === "user";
  const hasAction = message.actionResult && message.actionType;
  const needsApproval = hasAction && message.actionResult?.approvalStatus === "pending";
  const isApproved = hasAction && message.actionResult?.approvalStatus === "approved";
  const isRejected = hasAction && message.actionResult?.approvalStatus === "rejected";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
      style={{ animationDelay: isLatest ? "0ms" : "0ms" }}
    >
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-card"
        }`}
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              AI Copilot
            </span>
            {hasAction && (
              <Badge variant="outline" className="text-xs">
                {message.actionType?.replace("_", " ")}
              </Badge>
            )}
          </div>
        )}

        <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : ""}`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {message.citations.length} citation{message.citations.length > 1 ? "s" : ""}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showCitations ? "rotate-180" : ""}`}
              />
            </button>
            {showCitations && (
              <div className="mt-2 space-y-1">
                {message.citations.map((citation, i) => (
                  <div
                    key={citation.id}
                    className="rounded-md bg-muted/50 p-2 text-xs"
                  >
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {citation.type}
                      </Badge>
                      <span className="font-medium">{citation.sourceTitle}</span>
                      <span className="ml-auto text-muted-foreground">
                        {Math.round(citation.relevance * 100)}%
                      </span>
                    </div>
                    {citation.excerpt && (
                      <p className="mt-1 text-muted-foreground">
                        "{citation.excerpt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approval Actions */}
        {needsApproval && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">
              Requires approval
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => onReject(message.actionResult!.id)}
              >
                <XCircle className="h-3 w-3" />
                Reject
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => onApprove(message.actionResult!.id)}
              >
                <CheckCircle2 className="h-3 w-3" />
                Approve
              </Button>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600">Approved</span>
          </div>
        )}

        {isRejected && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-600">Rejected</span>
          </div>
        )}

        <div className="mt-2 text-right text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
