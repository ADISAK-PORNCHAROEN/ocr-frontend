import { z } from "zod";

export const jobStatusSchema = z.enum([
	"queued",
	"processing",
	"completed",
	"partially_completed",
	"failed",
]);

export const pageStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);

export const jobWireSchema = z.object({
	id: z.string().uuid(),
	filename: z.string().min(1),
	media_type: z.enum(["image/jpeg", "image/png", "application/pdf"]),
	status: jobStatusSchema,
	progress: z.object({
		total_pages: z.number().int().nonnegative(),
		completed_pages: z.number().int().nonnegative(),
		failed_pages: z.number().int().nonnegative(),
		processing_pages: z.number().int().nonnegative(),
		processed_pages: z.number().int().nonnegative(),
	}),
	created_at: z.string().datetime({ offset: true }),
	expires_at: z.string().datetime({ offset: true }),
});

export const capabilitiesWireSchema = z.object({
	supported_media_types: z.array(z.string()),
	max_upload_bytes: z.number().int().positive(),
	max_pages: z.number().int().positive(),
	pdf_dpi: z.number().int().positive(),
	max_page_pixels: z.number().int().positive(),
	max_total_pixels: z.number().int().positive(),
	max_pending_jobs: z.number().int().nonnegative(),
	max_retained_jobs: z.number().int().positive(),
	worker_count: z.number().int().positive(),
	job_ttl_seconds: z.number().int().positive(),
	model_id: z.string(),
	model_revision: z.string(),
});

const lineWireSchema = z.object({
	text: z.string(),
	confidence: z.number().min(0).max(1),
	box: z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() }),
});

const pageWireSchema = z
	.object({
		page_number: z.number().int().positive(),
		status: pageStatusSchema,
		has_text: z.boolean().nullable(),
		original_text: z.string().nullable(),
		lines: z.array(lineWireSchema).nullable(),
		image_size: z
			.object({ width: z.number().int().positive(), height: z.number().int().positive() })
			.nullable(),
		error: z.object({ code: z.string(), message: z.string() }).nullable(),
		image_url: z.string().startsWith("/api/v1/ocr/jobs/"),
	})
	.superRefine((page, context) => {
		if (
			page.status === "completed" &&
			(page.original_text === null || page.lines === null || page.image_size === null)
		) {
			context.addIssue({ code: "custom", message: "Completed page is missing OCR data" });
		}
		if (page.status === "failed" && page.error === null) {
			context.addIssue({ code: "custom", message: "Failed page is missing its error" });
		}
		if ((page.status === "pending" || page.status === "processing") && page.has_text !== null) {
			context.addIssue({ code: "custom", message: "Unfinished page cannot contain text status" });
		}
	});

export const pagesWireSchema = z.object({ pages: z.array(pageWireSchema) });
export const pageDetailWireSchema = pageWireSchema;

export type JobWire = z.infer<typeof jobWireSchema>;
export type PageWire = z.infer<typeof pageWireSchema>;
export type OcrLine = z.infer<typeof lineWireSchema>;

export type Job = {
	id: string;
	filename: string;
	mediaType: JobWire["media_type"];
	status: JobWire["status"];
	progress: {
		totalPages: number;
		completedPages: number;
		failedPages: number;
		processingPages: number;
		processedPages: number;
	};
	createdAt: string;
	expiresAt: string;
};

export type PageSummary = {
	number: number;
	status: PageWire["status"];
	hasText: boolean | null;
	error: PageWire["error"];
	imageUrl: string;
};

export type PageDetail = PageSummary & {
	originalText: string | null;
	lines: OcrLine[] | null;
	imageSize: PageWire["image_size"];
};

export function mapJob(wire: JobWire): Job {
	return {
		id: wire.id,
		filename: wire.filename,
		mediaType: wire.media_type,
		status: wire.status,
		progress: {
			totalPages: wire.progress.total_pages,
			completedPages: wire.progress.completed_pages,
			failedPages: wire.progress.failed_pages,
			processingPages: wire.progress.processing_pages,
			processedPages: wire.progress.processed_pages,
		},
		createdAt: wire.created_at,
		expiresAt: wire.expires_at,
	};
}

export function mapPage(wire: PageWire, jobId: string): PageDetail {
	return {
		number: wire.page_number,
		status: wire.status,
		hasText: wire.has_text,
		error: wire.error,
		imageUrl: `/api/ocr/jobs/${jobId}/pages/${wire.page_number}/image`,
		originalText: wire.original_text,
		lines: wire.lines,
		imageSize: wire.image_size,
	};
}
