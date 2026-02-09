import { test, expect } from "@playwright/test";

test.describe("Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/controls");
    await page.waitForLoadState("networkidle");
  });

  test("should display controls list", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Controls");

    // Check controls are visible (use flexible matching)
    await expect(page.getByText(/CC6|CC7|A\.9/i).first()).toBeVisible();
  });

  test("should have framework filter", async ({ page }) => {
    // Check framework filter exists
    const combobox = page.getByRole("combobox").first();
    await expect(combobox).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    // Check search input exists
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test("should show control status badges", async ({ page }) => {
    // Check for status badges
    const covered = page.getByText("COVERED");
    const gap = page.getByText("GAP");

    // At least one should be visible
    const hasCovered = await covered.count();
    const hasGap = await gap.count();

    expect(hasCovered + hasGap).toBeGreaterThan(0);
  });

  test("should filter controls by search", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("access");

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Should still show some results
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
