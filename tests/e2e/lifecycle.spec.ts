import { expect, test } from "@playwright/test";

async function uploadDocument(page: import("@playwright/test").Page, filename: string) {
	await page.goto("/");
	await page.getByLabel("เลือกไฟล์ JPG, PNG หรือ PDF").setInputFiles({
		name: filename,
		mimeType: "application/pdf",
		buffer: Buffer.from("fixture image bytes"),
	});
	await page.getByRole("button", { name: "เริ่มถอดข้อความ" }).click();
	await expect(page.getByRole("heading", { name: "ตรวจผลทีละหน้า" })).toBeVisible({
		timeout: 12_000,
	});
}

async function fixtureState(request: import("@playwright/test").APIRequestContext) {
	return request.get("http://127.0.0.1:4010/__fixture/state").then((response) => response.json());
}

test("warns before losing edits, retries a failed delete, then starts a fresh session", async ({
	page,
	request,
}) => {
	await uploadDocument(page, "delete-retry.pdf");
	await page.getByLabel("ข้อความที่แก้ไข").fill("ข้อความที่ยังไม่ได้ดาวน์โหลด");
	const unloadWasPrevented = await page.evaluate(() => {
		const event = new Event("beforeunload", { cancelable: true });
		window.dispatchEvent(event);
		return event.defaultPrevented;
	});
	expect(unloadWasPrevented).toBe(true);

	page.once("dialog", (dialog) => {
		expect(dialog.message()).toContain("ยังไม่ได้ดาวน์โหลด");
		void dialog.accept();
	});
	await page.getByRole("button", { name: "เริ่มใหม่" }).click();
	const deleteAlert = page.locator(".error-callout[role=alert]");
	await expect(deleteAlert).toContainText("ยืนยันการลบงานไม่ได้");
	await expect(deleteAlert).toContainText("ระบบจะลบงานตกค้างตามอายุที่กำหนด");

	page.once("dialog", (dialog) => void dialog.accept());
	await page.getByRole("button", { name: "ลองลบอีกครั้ง" }).click();
	await expect(page.getByRole("heading", { name: "เริ่มจากเอกสารหนึ่งไฟล์" })).toBeVisible();
	expect((await fixtureState(request)).deleteReads).toBe(2);
});

test("offers continue when deletion fails and the session has no unsaved edits", async ({
	page,
	request,
}) => {
	await uploadDocument(page, "delete-continue.pdf");
	await page.getByRole("button", { name: "เริ่มใหม่" }).click();
	const deleteAlert = page.locator(".error-callout[role=alert]");
	await expect(deleteAlert).toContainText("ยืนยันการลบงานไม่ได้");
	await expect(deleteAlert).toContainText("ระบบจะลบงานตกค้างตามอายุที่กำหนด");

	await page.getByRole("button", { name: "เริ่มใหม่ต่อ" }).click();
	await expect(page.getByRole("heading", { name: "เริ่มจากเอกสารหนึ่งไฟล์" })).toBeVisible();
	expect((await fixtureState(request)).deleteReads).toBe(1);
});
