import { test, expect } from "@playwright/test";

test.describe("Evidence Center", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/evidence");
    await page.waitForLoadState("networkidle");
  });

  test("should display evidence list", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Evidence");

    // Check that evidence items are displayed (flexible matching)
    await expect(page.getByText(/GitHub.*Access|Repository/i).first()).toBeVisible();
  });

  test("should have upload button", async ({ page }) => {
    // Check upload button exists
    await expect(page.getByRole("button", { name: /upload/i })).toBeVisible();
  });

  test("should open upload dialog", async ({ page }) => {
    await page.getByRole("button", { name: /upload/i }).click();

    // Check dialog is open
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /upload/i })).toBeVisible();
  });

  test("should display evidence with status badges", async ({ page }) => {
    // Check for status badges - at least one should be visible
    const approved = page.getByText("APPROVED");
    const pending = page.getByText("PENDING");
    
    const hasStatus = (await approved.count()) > 0 || (await pending.count()) > 0;
    expect(hasStatus).toBeTruthy();
  });
});
