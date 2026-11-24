import { expect, test } from "@playwright/test";

test("home page exposes the OCR Playground entry point", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle("OCR Playground | Paperflow");
	await expect(page.getByRole("heading", { level: 1, name: "ตรวจเอกสารได้ทีละหน้า" })).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "เริ่มจากเอกสารหนึ่งไฟล์" })).toBeVisible();
});

test("keeps backend resource limits out of the upload screen", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator(".limit-list")).toHaveCount(0);
	await expect(page.getByText(/20 MB|25 ล้านพิกเซล|80 ล้านพิกเซล/)).toHaveCount(0);
	await expect(page.getByText("พื้นที่ทำงานชั่วคราว")).toHaveCount(0);

	await page.setViewportSize({ width: 390, height: 844 });
	const dimensions = await page.locator("body").evaluate((element) => ({
		clientWidth: element.clientWidth,
		scrollWidth: element.scrollWidth,
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("keeps backend limits hidden when an older backend returns a page count", async ({ page }) => {
	await page.route("**/api/ocr/capabilities", async (route) => {
		const response = await route.fetch();
		const capabilities = await response.json();
		await route.fulfill({ response, json: { ...capabilities, max_pages: 20 } });
	});
	await page.goto("/");
	await expect(page.locator(".limit-list")).toHaveCount(0);
	await expect(page.getByText(/20 MB|25 ล้านพิกเซล|80 ล้านพิกเซล/)).toHaveCount(0);
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
