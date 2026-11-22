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

test("a delayed response from an ended job cannot populate the next job session", async ({
	page,
	request,
}) => {
	await uploadDocument(page, "slow-page.pdf");
	await expect
		.poll(async () => {
			const state = await request.get("http://127.0.0.1:4010/__fixture/state");
			return (await state.json()).detailReads;
		})
		.toContain(1);

	await page.getByRole("button", { name: "เริ่มใหม่" }).click();
	await expect(page.locator(".error-callout[role=alert]")).toContainText("ยืนยันการลบงานไม่ได้");
	await page.getByRole("button", { name: "เริ่มใหม่ต่อ" }).click();
	await uploadDocument(page, "fresh.pdf");
	await expect(page.getByLabel("ข้อความที่แก้ไข")).toHaveValue("ใบเสร็จรับเงิน\nยอดรวม 250 บาท");
	await expect(page.getByLabel("ข้อความที่แก้ไข")).not.toHaveValue("ข้อมูลผลลัพธ์จากงานเก่า");
});
