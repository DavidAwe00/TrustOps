import { test, expect } from "@playwright/test";

test.describe("Audit Exports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/exports");
    await page.waitForLoadState("networkidle");
  });

  test("should display exports page", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Exports");

    // Check framework cards
    await expect(page.getByText(/SOC.*2|Type.*II/i).first()).toBeVisible();
    await expect(page.getByText(/ISO.*27001/i).first()).toBeVisible();
  });

  test("should have new export button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /New Export/i })).toBeVisible();
  });

  test("should open export dialog", async ({ page }) => {
    await page.getByRole("button", { name: /New Export/i }).click();

    // Check dialog - use heading role for the dialog title
    await expect(page.getByRole("heading", { name: /Generate Audit Packet/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Select Framework/i)).toBeVisible();
  });

  test("should have export history section", async ({ page }) => {
    await expect(page.getByText(/Export History/i)).toBeVisible();
  });

  test("should generate export", async ({ page }) => {
    // Click New Export
    await page.getByRole("button", { name: /New Export/i }).click();

    // Select framework
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /SOC.*2/i }).click();

    // Generate
    await page.getByRole("button", { name: /Generate Export/i }).click();

    // Wait for export to complete
    await expect(page.getByText(/Ready|Completed/i)).toBeVisible({ timeout: 20000 });
  });
});
