/**
 * Analytics utility for tracking key TrustOps events
 * Uses PostHog for product analytics
 */

import { trackEvent, identifyUser, resetUser } from "./posthog";

// ===========================================
// User Events
// ===========================================

export const analytics = {
  // User signed up
  userSignedUp: (userId: string, email: string, orgName?: string) => {
    identifyUser(userId, { email, orgName });
    trackEvent("user_signed_up", { email, orgName });
  },

  // User signed in
  userSignedIn: (userId: string, email: string) => {
    identifyUser(userId, { email });
    trackEvent("user_signed_in", { email });
  },

  // User signed out
  userSignedOut: () => {
    trackEvent("user_signed_out");
    resetUser();
  },

  // ===========================================
  // Evidence Events
  // ===========================================

  // Evidence uploaded
  evidenceUploaded: (props: {
    evidenceId: string;
    type: string;
    source: string;
    fileCount: number;
  }) => {
    trackEvent("evidence_uploaded", props);
  },

  // Evidence approved
  evidenceApproved: (evidenceId: string) => {
    trackEvent("evidence_approved", { evidenceId });
  },

  // Evidence rejected
  evidenceRejected: (evidenceId: string, reason?: string) => {
    trackEvent("evidence_rejected", { evidenceId, reason });
  },

  // ===========================================
  // Control Events
  // ===========================================

  // Control mapped to evidence
  controlMapped: (controlId: string, evidenceId: string) => {
    trackEvent("control_mapped", { controlId, evidenceId });
  },

  // Custom control created
  customControlCreated: (controlId: string, framework: string) => {
    trackEvent("custom_control_created", { controlId, framework });
  },

  // ===========================================
  // AI Copilot Events
  // ===========================================

  // Gap analysis requested
  gapAnalysisRequested: (framework: string) => {
    trackEvent("gap_analysis_requested", { framework });
  },

  // Gap analysis completed
  gapAnalysisCompleted: (framework: string, coverage: number) => {
    trackEvent("gap_analysis_completed", { framework, coverage });
  },

  // Policy draft requested
  policyDraftRequested: (policyType: string) => {
    trackEvent("policy_draft_requested", { policyType });
  },

  // Policy draft generated
  policyDraftGenerated: (policyType: string) => {
    trackEvent("policy_draft_generated", { policyType });
  },

  // AI content approved
  aiContentApproved: (contentType: string, contentId: string) => {
    trackEvent("ai_content_approved", { contentType, contentId });
  },

  // AI content rejected
  aiContentRejected: (contentType: string, contentId: string) => {
    trackEvent("ai_content_rejected", { contentType, contentId });
  },

  // Chat message sent
  chatMessageSent: () => {
    trackEvent("chat_message_sent");
  },

  // ===========================================
  // Export Events
  // ===========================================

  // Export started
  exportStarted: (framework: string) => {
    trackEvent("export_started", { framework });
  },

  // Export completed
  exportCompleted: (props: {
    framework: string;
    controlCount: number;
    evidenceCount: number;
    sizeBytes: number;
  }) => {
    trackEvent("export_completed", props);
  },

  // Export downloaded
  exportDownloaded: (exportId: string, framework: string) => {
    trackEvent("export_downloaded", { exportId, framework });
  },

  // ===========================================
  // Integration Events
  // ===========================================

  // Integration connected
  integrationConnected: (integration: string) => {
    trackEvent("integration_connected", { integration });
  },

  // Integration disconnected
  integrationDisconnected: (integration: string) => {
    trackEvent("integration_disconnected", { integration });
  },

  // Integration synced
  integrationSynced: (integration: string, itemsCollected: number) => {
    trackEvent("integration_synced", { integration, itemsCollected });
  },

  // ===========================================
  // Feature Usage
  // ===========================================

  // Feature viewed
  featureViewed: (feature: string) => {
    trackEvent("feature_viewed", { feature });
  },

  // Report generated
  reportGenerated: (reportType: string) => {
    trackEvent("report_generated", { reportType });
  },

  // Settings changed
  settingsChanged: (setting: string) => {
    trackEvent("settings_changed", { setting });
  },
};

export default analytics;









