/**
 * AI Provider Abstraction
 * Supports OpenAI, Anthropic, or demo mode with mock responses
 */

import { isDemo } from "@/lib/demo";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletion {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate AI completion using configured provider
 */
export async function generateCompletion(options: AICompletionOptions): Promise<AICompletion> {
  // Use mock in demo mode or if no API key configured
  if (isDemo() || (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)) {
    return generateMockCompletion(options);
  }

  // Use OpenAI if key is available
  if (process.env.OPENAI_API_KEY) {
    return generateOpenAICompletion(options);
  }

  // Use Anthropic if key is available
  if (process.env.ANTHROPIC_API_KEY) {
    return generateAnthropicCompletion(options);
  }

  throw new Error("No AI provider configured");
}

/**
 * OpenAI completion
 */
async function generateOpenAICompletion(options: AICompletionOptions): Promise<AICompletion> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o",
      messages: options.messages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || "",
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Anthropic completion
 */
async function generateAnthropicCompletion(options: AICompletionOptions): Promise<AICompletion> {
  // Extract system message
  const systemMessage = options.messages.find(m => m.role === "system");
  const otherMessages = options.messages.filter(m => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 2000,
      system: systemMessage?.content,
      messages: otherMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.content[0]?.text || "",
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
  };
}

/**
 * Mock completion for demo mode
 */
async function generateMockCompletion(options: AICompletionOptions): Promise<AICompletion> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500));

  const lastUserMessage = options.messages.findLast(m => m.role === "user");
  const prompt = lastUserMessage?.content.toLowerCase() || "";

  // Generate contextual mock responses
  let content = "I'm the TrustOps AI Copilot. I can help with gap analysis, policy drafting, and questionnaire answers.";

  if (prompt.includes("gap") || prompt.includes("coverage")) {
    content = `Based on my analysis, your SOC2 compliance is at approximately 55% coverage. 

Key gaps identified:
1. **CC7.2 - Monitoring**: No evidence of continuous monitoring
2. **CC6.3 - Access Reviews**: Missing quarterly access review documentation
3. **CC8.1 - Change Management**: Incomplete change approval records

Recommendations:
- Prioritize access control documentation
- Implement automated monitoring with alerts
- Document your change management process

Would you like me to run a full gap analysis?`;
  }

  if (prompt.includes("policy") || prompt.includes("draft")) {
    content = `I've drafted an Access Control Policy based on your requirements:

## 1. Purpose
This policy establishes requirements for managing access to information systems.

## 2. Scope
Applies to all employees, contractors, and third-party users.

## 3. Key Requirements
- All access requires manager approval
- Multi-factor authentication is mandatory
- Quarterly access reviews required
- Privileged access needs additional approval

Shall I expand any section or generate a different policy type?`;
  }

  if (prompt.includes("how") || prompt.includes("describe") || prompt.includes("what")) {
    content = `Based on your documented evidence, here's my answer:

${prompt}

**Answer:** Our organization implements this through documented policies and technical controls. We have evidence demonstrating:

1. Written policies approved by management
2. Technical controls enforced via our systems
3. Regular audits and reviews

**Confidence:** 85%

**Supporting Evidence:**
- Security Policy Document (v2.1)
- Access Control Configuration Export
- Quarterly Review Meeting Notes

Would you like me to provide more detail on any aspect?`;
  }

  return {
    content,
    usage: {
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
    },
  };
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return isDemo() || 
    Boolean(process.env.OPENAI_API_KEY) || 
    Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Get current AI provider name
 */
export function getAIProviderName(): string {
  if (isDemo()) return "Demo (Mock)";
  if (process.env.OPENAI_API_KEY) return "OpenAI";
  if (process.env.ANTHROPIC_API_KEY) return "Anthropic";
  return "None";
}

