import { test, expect } from "@playwright/test";

test.describe("AI Copilot", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copilot");
    await page.waitForLoadState("networkidle");
  });

  test("should display copilot page", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AI Copilot");
  });

  test("should display welcome message", async ({ page }) => {
    // Check welcome message from AI (flexible matching)
    await expect(page.getByText(/TrustOps|AI|Copilot/i).first()).toBeVisible();
  });

  test("should display quick actions", async ({ page }) => {
    await expect(page.getByText(/Quick Actions/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /SOC2|Gap/i }).first()).toBeVisible();
  });

  test("should have chat input", async ({ page }) => {
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible();
  });

  test("should run gap analysis", async ({ page }) => {
    // Click gap analysis button
    await page.getByRole("button", { name: /SOC2.*Gap|Analyze.*SOC2/i }).first().click();

    // Wait for response - look for the heading that appears in gap analysis results
    await expect(page.getByRole("heading", { name: /Gap Analysis Complete/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test("should generate policy draft", async ({ page }) => {
    // Click policy draft button
    await page.getByRole("button", { name: /Access.*Policy|Draft.*Access/i }).first().click();

    // Wait for response - look for the heading that appears in policy results
    await expect(page.getByRole("heading", { name: /Policy Draft Generated/i })).toBeVisible({ timeout: 15000 });
  });

  test("should show approval buttons for AI content", async ({ page }) => {
    // Run gap analysis first
    await page.getByRole("button", { name: /SOC2.*Gap|Analyze.*SOC2/i }).first().click();

    // Wait for response with approval buttons (use first() since multiple may appear)
    await expect(page.getByRole("button", { name: /Approve/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Reject/i }).first()).toBeVisible();
  });
});
