import { describe, expect, it } from "vitest";
import { jobWireSchema, mapJob, mapPage, pageDetailWireSchema } from "@/features/ocr/api/schema";

const baseJob = {
	id: "00000000-0000-4000-8000-000000000001",
	filename: "document.pdf",
	media_type: "application/pdf",
	status: "partially_completed",
	progress: {
		total_pages: 3,
		completed_pages: 2,
		failed_pages: 1,
		processing_pages: 0,
		processed_pages: 3,
	},
	created_at: "2026-11-22T17:25:18Z",
	expires_at: "2026-11-22T18:25:18Z",
};

describe("OCR API wire schemas", () => {
	it("maps backend job field names to the frontend model", () => {
		const job = mapJob(jobWireSchema.parse(baseJob));
		expect(job.id).toBe(baseJob.id);
		expect(job.mediaType).toBe("application/pdf");
		expect(job.progress.completedPages).toBe(2);
	});

	it("accepts an intentionally blank successful page and derives a same-origin image path", () => {
		const page = pageDetailWireSchema.parse({
			page_number: 2,
			status: "completed",
			has_text: false,
			original_text: "",
			lines: [],
			image_size: { width: 1, height: 1 },
			error: null,
			image_url: "/api/v1/ocr/jobs/00000000-0000-4000-8000-000000000001/pages/2/image",
		});
		const mapped = mapPage(page, baseJob.id);
		expect(mapped.status).toBe("completed");
		expect(mapped.originalText).toBe("");
		expect(mapped.imageUrl).toBe(`/api/ocr/jobs/${baseJob.id}/pages/2/image`);
	});

	it("requires a real error payload for failed pages", () => {
		const result = pageDetailWireSchema.safeParse({
			page_number: 3,
			status: "failed",
			has_text: null,
			original_text: null,
			lines: null,
			image_size: null,
			error: null,
			image_url: "/api/v1/ocr/jobs/00000000-0000-4000-8000-000000000001/pages/3/image",
		});
		expect(result.success).toBe(false);
	});

	it("rejects backend statuses outside the agreed wire contract", () => {
		expect(jobWireSchema.safeParse({ ...baseJob, status: "unknown" }).success).toBe(false);
	});
});
