import { describe, expect, it } from "vitest";
import type { Job, PageDetail } from "@/features/ocr/api/schema";
import {
	exportFilename,
	serializeDraftRecovery,
	serializeJsonExport,
	serializeTextExport,
} from "@/features/ocr/export/serialize";
import {
	createInitialSession,
	hasUndownloadedEdits,
	pageDraft,
	sessionReducer,
} from "@/features/ocr/session/session";

const job: Job = {
	id: "00000000-0000-4000-8000-000000000001",
	filename: "receipt.pdf",
	mediaType: "application/pdf",
	status: "partially_completed",
	progress: {
		totalPages: 3,
		completedPages: 2,
		failedPages: 1,
		processingPages: 0,
		processedPages: 3,
	},
	createdAt: "2026-11-22T17:25:18Z",
	expiresAt: "2026-11-22T18:25:18Z",
};

const pages: PageDetail[] = [
	{
		number: 3,
		status: "failed",
		hasText: null,
		error: { code: "OCR_PAGE_FAILED", message: "อ่านไม่ได้" },
		imageUrl: "/api/ocr/jobs/id/pages/3/image",
		originalText: null,
		lines: null,
		imageSize: null,
	},
	{
		number: 2,
		status: "completed",
		hasText: false,
		error: null,
		imageUrl: "/api/ocr/jobs/id/pages/2/image",
		originalText: "",
		lines: [],
		imageSize: { width: 10, height: 20 },
	},
	{
		number: 1,
		status: "completed",
		hasText: true,
		error: null,
		imageUrl: "/api/ocr/jobs/id/pages/1/image",
		originalText: "ข้อความต้นฉบับ",
		lines: [{ text: "ข้อความต้นฉบับ", confidence: 0.97, box: { x1: 1, y1: 2, x2: 8, y2: 9 } }],
		imageSize: { width: 10, height: 20 },
	},
];

describe("memory-only OCR session", () => {
	it("keeps edits per page, including an intentionally empty draft", () => {
		let session = createInitialSession(job.id);
		session = sessionReducer(session, { type: "edit-page", pageNumber: 1, text: "แก้แล้ว" });
		session = sessionReducer(session, { type: "select-page", pageNumber: 2 });
		session = sessionReducer(session, { type: "edit-page", pageNumber: 2, text: "" });
		session = sessionReducer(session, { type: "select-page", pageNumber: 1 });

		expect(pageDraft(session, 1, "ต้นฉบับ")).toBe("แก้แล้ว");
		expect(Object.hasOwn(session.drafts, 2)).toBe(true);
		expect(pageDraft(session, 2, "ข้อความต้นฉบับ")).toBe("");
		expect(hasUndownloadedEdits(session)).toBe(true);
	});

	it("leaves edits made during export marked as not downloaded", () => {
		let session = sessionReducer(createInitialSession(job.id), {
			type: "edit-page",
			pageNumber: 1,
			text: "ฉบับแรก",
		});
		const capturedRevision = session.revision;
		session = sessionReducer(session, { type: "export-downloaded", revision: capturedRevision });
		expect(hasUndownloadedEdits(session)).toBe(false);
		session = sessionReducer(session, { type: "edit-page", pageNumber: 1, text: "ฉบับใหม่" });
		expect(hasUndownloadedEdits(session)).toBe(true);
		session = sessionReducer(session, { type: "restore-page", pageNumber: 1 });
		expect(Object.hasOwn(session.drafts, 1)).toBe(false);
		expect(hasUndownloadedEdits(session)).toBe(true);
	});
});

describe("export serializers", () => {
	it("serializes edited drafts in page order and keeps intentional blank drafts", () => {
		expect(serializeDraftRecovery({ 3: "หน้าสาม", 1: "หน้าแรก", 2: "" })).toBe(
			"หน้า 1\nหน้าแรก\n\nหน้า 2\n\n\nหน้า 3\nหน้าสาม",
		);
	});

	it("sorts all pages, preserves original OCR separately, and records failed pages", () => {
		const snapshot = {
			job,
			pages,
			drafts: { 1: "ข้อความที่แก้", 2: "" },
			revision: 2,
		};
		const text = serializeTextExport(snapshot);
		expect(text.indexOf("หน้า 1")).toBeLessThan(text.indexOf("หน้า 2"));
		expect(text).toContain("หน้า 1\nข้อความที่แก้");
		expect(text).toContain("หน้า 2\n");
		expect(text).toContain("ถอดข้อความไม่สำเร็จ");
		expect(text).not.toContain("หน้า 2\n(ไม่พบข้อความ)");

		const json = JSON.parse(serializeJsonExport(snapshot));
		expect(json.pages[0].edited_text).toBe("ข้อความที่แก้");
		expect(json.pages[0].original.text).toBe("ข้อความต้นฉบับ");
		expect(json.pages[0].original.lines[0].box.x2).toBe(8);
		expect(json.pages[1].edited_text).toBe("");
		expect(json.pages[2].error.code).toBe("OCR_PAGE_FAILED");
	});

	it("sanitizes filenames before creating a download name", () => {
		expect(exportFilename("../../my:document?.pdf", "json")).toBe("..-..-my-document-.json");
		expect(exportFilename(".pdf", "txt")).toBe("ocr-result.txt");
	});
});
