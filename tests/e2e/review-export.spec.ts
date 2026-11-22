import { readFile } from "node:fs/promises";
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

test("keeps page edits, supports blank and failed pages, and adapts to mobile", async ({
	page,
}) => {
	await uploadDocument(page, "review.pdf");
	await expect(page.getByLabel("ข้อความที่แก้ไข")).toHaveValue("ใบเสร็จรับเงิน\nยอดรวม 250 บาท");

	const desktopColumns = await page
		.locator(".review-grid")
		.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
	expect(desktopColumns).toBe(2);

	await page.setViewportSize({ width: 390, height: 844 });
	const mobileColumns = await page
		.locator(".review-grid")
		.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
	expect(mobileColumns).toBe(1);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
	await expect(page.getByRole("img", { name: "ภาพต้นฉบับ review.pdf หน้า 1" })).toBeVisible();
	await page.setViewportSize({ width: 1280, height: 900 });

	const editor = page.getByLabel("ข้อความที่แก้ไข");
	await editor.fill("แก้ไขหน้าแรก");
	await page.getByRole("button", { name: "หน้า 2 หน้าว่าง" }).click();
	await expect(editor).toHaveValue("");
	await editor.fill("ข้อความที่เพิ่มในหน้าว่าง");
	await editor.fill("");
	await page.getByRole("button", { name: "หน้า 1 สำเร็จ" }).click();
	await expect(editor).toHaveValue("แก้ไขหน้าแรก");
	await page.getByRole("button", { name: "หน้า 2 หน้าว่าง" }).click();
	await expect(editor).toHaveValue("");

	await page.getByRole("button", { name: "หน้า 4 ล้มเหลว" }).click();
	await expect(page.getByRole("region", { name: "ผล OCR หน้า 4" })).toContainText(
		"หน้านี้ถอดข้อความไม่สำเร็จ",
	);
	await expect(page.getByLabel("ข้อความที่แก้ไข")).toHaveCount(0);

	await page.getByRole("button", { name: "หน้า 1 สำเร็จ" }).click();
	page.once("dialog", (dialog) => dialog.dismiss());
	await page.getByRole("button", { name: "คืนค่าผล OCR" }).click();
	await expect(editor).toHaveValue("แก้ไขหน้าแรก");
	page.once("dialog", (dialog) => dialog.accept());
	await page.getByRole("button", { name: "คืนค่าผล OCR" }).click();
	await expect(editor).toHaveValue("ใบเสร็จรับเงิน\nยอดรวม 250 บาท");
});

test("exports every successful page, separates edited and original JSON, and tracks later edits", async ({
	page,
	request,
}) => {
	await uploadDocument(page, "export.pdf");
	const editor = page.getByLabel("ข้อความที่แก้ไข");
	await editor.fill("ข้อความแก้ไขก่อน TXT");

	page.once("dialog", (dialog) => dialog.accept());
	const txtDownloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "ดาวน์โหลด TXT" }).click();
	const txtDownload = await txtDownloadPromise;
	expect(txtDownload.suggestedFilename()).toBe("export.txt");
	const txt = await readFile((await txtDownload.path()) ?? "", "utf8");
	expect(txt).toContain("หน้า 1\nข้อความแก้ไขก่อน TXT");
	expect(txt).toContain("หน้า 2\n(ไม่พบข้อความ)");
	expect(txt).toContain("หน้า 3\nหน้านี้ยังไม่เคยเปิดก่อนดาวน์โหลด");
	expect(txt).toContain("หน้า 4\n(ถอดข้อความไม่สำเร็จ:");
	await expect(page.getByText("ไม่มีการแก้ไขค้างดาวน์โหลด")).toBeVisible();

	const fixtureState = await request
		.get("http://127.0.0.1:4010/__fixture/state")
		.then((response) => response.json());
	expect(fixtureState.detailReads).toContain(3);

	await editor.fill("ข้อความแก้ไขหลัง TXT");
	await expect(page.getByText("มีการแก้ไขที่ยังไม่ได้ดาวน์โหลด")).toBeVisible();
	page.once("dialog", (dialog) => dialog.accept());
	const jsonDownloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "ดาวน์โหลด JSON" }).click();
	const jsonDownload = await jsonDownloadPromise;
	expect(jsonDownload.suggestedFilename()).toBe("export.json");
	const exported = JSON.parse(await readFile((await jsonDownload.path()) ?? "", "utf8"));
	expect(exported.pages[0].edited_text).toBe("ข้อความแก้ไขหลัง TXT");
	expect(exported.pages[0].original.text).toBe("ใบเสร็จรับเงิน\nยอดรวม 250 บาท");
	expect(exported.pages[0].original.lines[0].confidence).toBe(0.98);
	expect(exported.pages[1].edited_text).toBe("");
	expect(exported.pages[2].original.text).toBe("หน้านี้ยังไม่เคยเปิดก่อนดาวน์โหลด");
	expect(exported.pages[3].error.code).toBe("OCR_PAGE_FAILED");
	await expect(page.getByText("ไม่มีการแก้ไขค้างดาวน์โหลด")).toBeVisible();
});

test("does not create a partial file when a successful page cannot be fetched", async ({
	page,
}) => {
	await uploadDocument(page, "incomplete.pdf");
	page.once("dialog", (dialog) => dialog.accept());
	const pendingDownload = page.waitForEvent("download", { timeout: 2_500 }).catch(() => null);
	await page.getByRole("button", { name: "ดาวน์โหลด TXT" }).click();
	const download = await pendingDownload;
	expect(download).toBeNull();
	await expect(page.locator(".error-callout[role=alert]")).toContainText("จึงยังไม่มีไฟล์ถูกดาวน์โหลด");
});

test("keeps edits copyable and disables complete export when the job expires during export", async ({
	page,
}) => {
	await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
	await uploadDocument(page, "expires-during-export.pdf");
	const editor = page.getByLabel("ข้อความที่แก้ไข");
	await editor.fill("ข้อความที่ต้องเก็บไว้หลังงานหมดอายุ");

	page.once("dialog", (dialog) => dialog.accept());
	const pendingDownload = page.waitForEvent("download", { timeout: 2_500 }).catch(() => null);
	await page.getByRole("button", { name: "ดาวน์โหลด TXT" }).click();
	expect(await pendingDownload).toBeNull();
	await expect(page.locator(".warning-callout[role=alert]")).toContainText("งานหมดอายุหรือถูกลบแล้ว");
	await expect(page.getByRole("button", { name: "ดาวน์โหลด TXT" })).toHaveCount(0);
	await page.getByRole("button", { name: "คัดลอกหน้านี้" }).click();
	await expect(page.locator(".success-message")).toContainText("คัดลอกข้อความหน้านี้แล้ว");
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
		"ข้อความที่ต้องเก็บไว้หลังงานหมดอายุ",
	);
});

test("recovers all drafts when the page-list query returns 404 after reconnect", async ({
	page,
	request,
}) => {
	await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
	await uploadDocument(page, "expires-after-reconnect.pdf");
	const editor = page.getByLabel("ข้อความที่แก้ไข");
	await editor.fill("ฉบับแก้ไขหน้าแรก");
	await page.getByRole("button", { name: "หน้า 2 หน้าว่าง" }).click();
	await editor.fill("ฉบับแก้ไขหน้าสอง");

	const before = await request
		.get("http://127.0.0.1:4010/__fixture/state")
		.then((response) => response.json());
	await page.context().setOffline(true);
	await request.post("http://127.0.0.1:4010/__fixture/expire-page-list");
	await page.context().setOffline(false);

	await expect(page.getByRole("heading", { name: "กู้คืนข้อความที่แก้ไข" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "หน้า 1" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "หน้า 2" })).toBeVisible();
	await expect(page.getByRole("button", { name: "ดาวน์โหลด TXT" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "ดาวน์โหลด JSON" })).toHaveCount(0);
	await expect
		.poll(async () =>
			request
				.get("http://127.0.0.1:4010/__fixture/state")
				.then((response) => response.json())
				.then((state) => state.pageList404Reads),
		)
		.toBeGreaterThan(before.pageList404Reads);

	await page.getByRole("button", { name: "คัดลอก draft ทั้งหมด" }).click();
	await expect(page.locator(".success-message")).toContainText("คัดลอกข้อความ draft ทั้งหมดแล้ว");
	const copiedDrafts = await page.evaluate(() => navigator.clipboard.readText());
	expect(copiedDrafts.replace(/\r\n/g, "\n")).toBe("หน้า 1\nฉบับแก้ไขหน้าแรก\n\nหน้า 2\nฉบับแก้ไขหน้าสอง");
});

test("refresh starts a new session without keeping in-memory edits", async ({ page }) => {
	await uploadDocument(page, "refresh-session.pdf");
	await page.getByLabel("ข้อความที่แก้ไข").fill("มีเฉพาะใน session นี้");

	await page.reload();

	await expect(page.getByRole("heading", { name: "ตรวจเอกสารได้ทีละหน้า" })).toBeVisible();
	await expect(page.getByLabel("ข้อความที่แก้ไข")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "เริ่มถอดข้อความ" })).toBeDisabled();
});
