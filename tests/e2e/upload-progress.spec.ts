import { expect, test } from "@playwright/test";

test("validates files, offers manual retry after uncertain upload and stops polling at terminal status", async ({
	page,
	request,
}) => {
	await page.goto("/");
	const fileInput = page.getByLabel("เลือกไฟล์ JPG, PNG หรือ PDF");
	await fileInput.setInputFiles({
		name: "notes.txt",
		mimeType: "text/plain",
		buffer: Buffer.from("not an OCR document"),
	});
	await expect(page.locator(".upload-card [role=alert]")).toContainText(
		"รองรับเฉพาะไฟล์ JPG, PNG หรือ PDF",
	);

	await fileInput.setInputFiles({
		name: "uncertain.pdf",
		mimeType: "application/pdf",
		buffer: Buffer.from("fixture image bytes"),
	});
	await page.getByRole("button", { name: "เริ่มถอดข้อความ" }).click();
	await expect(page.getByText("ยังยืนยันผลการส่งไม่ได้")).toBeVisible();
	await page.getByRole("button", { name: "ลองส่งไฟล์นี้อีกครั้ง" }).click();

	const progress = page.getByRole("region", { name: "ความคืบหน้าของงาน OCR" });
	await expect(progress).toContainText("เสร็จบางหน้า", { timeout: 12_000 });
	await expect(page.getByRole("button", { name: "หน้า 2 หน้าว่าง" })).toBeVisible();
	await expect(page.getByRole("button", { name: "หน้า 4 ล้มเหลว" })).toBeVisible();
	await expect(page.getByRole("img", { name: "ภาพต้นฉบับ uncertain.pdf หน้า 1" })).toBeVisible();

	const fixtureState = async () =>
		request.get("http://127.0.0.1:4010/__fixture/state").then((response) => response.json());
	await expect.poll(async () => (await fixtureState()).statusReads).toBe(4);
	await page.waitForTimeout(1700);
	expect((await fixtureState()).statusReads).toBe(4);
});

test("shows backend file validation errors without retrying the upload", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("เลือกไฟล์ JPG, PNG หรือ PDF").setInputFiles({
		name: "rejected.pdf",
		mimeType: "application/pdf",
		buffer: Buffer.from("fixture image bytes"),
	});
	await page.getByRole("button", { name: "เริ่มถอดข้อความ" }).click();
	await expect(page.locator(".upload-card [role=alert]")).toContainText("ไฟล์มีขนาดเกินขีดจำกัด");
	await expect(page.getByRole("button", { name: "เริ่มถอดข้อความ" })).toBeEnabled();
});
