import { describe, expect, it } from "vitest";
import {
	capabilitiesWireSchema,
	jobWireSchema,
	mapCapabilities,
	mapJob,
	mapPage,
	pageDetailWireSchema,
} from "@/features/ocr/api/schema";

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
	it("maps backend capabilities to frontend field names", () => {
		const mapped = mapCapabilities(
			capabilitiesWireSchema.parse({
				supported_media_types: ["application/pdf"],
				max_upload_bytes: 5_000_000,
				max_pages: null,
				pdf_dpi: 150,
				max_page_pixels: 25_000_000,
				max_total_pixels: 80_000_000,
				max_pending_jobs: 2,
				max_retained_jobs: 5,
				worker_count: 1,
				job_ttl_seconds: 3600,
				model_id: "fixture-ocr",
				model_revision: "fixture",
			}),
		);

		expect(mapped).toEqual({
			supportedMediaTypes: ["application/pdf"],
			maxUploadBytes: 5_000_000,
			maxPages: null,
			maxPagePixels: 25_000_000,
			maxTotalPixels: 80_000_000,
		});
		expect(mapped).not.toHaveProperty("max_upload_bytes");
	});

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
		expect(mapped.ocrDurationMs).toBeNull();
	});

	it("accepts nullable or omitted inference duration without treating it as total processing time", () => {
		const basePage = {
			page_number: 1,
			status: "completed",
			has_text: true,
			original_text: "ผล OCR",
			lines: [],
			image_size: { width: 1, height: 1 },
			error: null,
			image_url: "/api/v1/ocr/jobs/00000000-0000-4000-8000-000000000001/pages/1/image",
		};

		expect(mapPage(pageDetailWireSchema.parse({ ...basePage, ocr_duration_ms: 142.37 }), baseJob.id))
			.toMatchObject({ ocrDurationMs: 142.37 });
		expect(mapPage(pageDetailWireSchema.parse({ ...basePage, ocr_duration_ms: null }), baseJob.id))
			.toMatchObject({ ocrDurationMs: null });
		expect(mapPage(pageDetailWireSchema.parse(basePage), baseJob.id)).toMatchObject({
			ocrDurationMs: null,
		});
		expect(
			pageDetailWireSchema.safeParse({ ...basePage, ocr_duration_ms: -1 }).success,
		).toBe(false);
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
