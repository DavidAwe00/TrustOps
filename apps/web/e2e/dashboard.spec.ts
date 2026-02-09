import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should display the dashboard with stats cards", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check page title
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dashboard");

    // Check stats cards are visible (use more flexible selectors)
    await expect(page.getByText(/Control Coverage/i)).toBeVisible();
    await expect(page.getByText(/Total Evidence/i)).toBeVisible();

    // Check sidebar navigation
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
  });

  test("should navigate to controls page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Click controls link in sidebar (use exact match to avoid matching "View Controls" card)
    await page.getByRole("link", { name: "Controls", exact: true }).click();
    
    await expect(page).toHaveURL("/controls");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Controls");
  });

  test("should navigate to evidence page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Click evidence link in sidebar (use exact match to avoid matching "Upload Evidence" button)
    await page.getByRole("link", { name: "Evidence", exact: true }).click();
    
    await expect(page).toHaveURL("/evidence");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Evidence");
  });
});
