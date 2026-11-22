import { expect, test } from "@playwright/test";

test("home page exposes the OCR Playground entry point", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle("OCR Playground | Paperflow");
	await expect(page.getByRole("heading", { level: 1, name: "เริ่มจากเอกสารหนึ่งไฟล์" })).toBeVisible();
});
