import { expect, test } from "@playwright/test";

test("home page exposes the OCR Playground entry point", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle("OCR Playground | Paperflow");
	await expect(page.getByRole("heading", { level: 1, name: "ตรวจเอกสารได้ทีละหน้า" })).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "เริ่มจากเอกสารหนึ่งไฟล์" })).toBeVisible();
});

test("keyboard users can skip to the upload control in a visible focus order", async ({ page }) => {
	await page.goto("/");
	await page.keyboard.press("Tab");
	await expect(page.getByRole("link", { name: "ข้ามไปยังเนื้อหาหลัก" })).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(page.getByRole("link", { name: "OCR Playground" })).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(page.getByLabel("เลือกไฟล์ JPG, PNG หรือ PDF")).toBeFocused();
});
