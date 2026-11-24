import { createServer } from "node:http";

const host = "127.0.0.1";
const port = Number(process.env.OCR_FIXTURE_PORT ?? 4010);
const jobs = new Map();
const pagePng = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jW9sAAAAASUVORK5CYII=",
	"base64",
);

let nextJobNumber = 1;
let activeJobId = null;
let uncertainAttempts = 0;
let abortedUpstreamResponses = 0;

function json(response, status, value, extraHeaders = {}) {
	response.writeHead(status, {
		"content-type": "application/json",
		"cache-control": "no-store",
		...extraHeaders,
	});
	response.end(JSON.stringify(value));
}

function createJob(filename) {
	const suffix = nextJobNumber.toString(16).padStart(12, "0");
	const id = `00000000-0000-4000-8000-${suffix}`;
	nextJobNumber += 1;
	const pageCount = Number(filename.match(/^profile-(\d+)\.pdf$/i)?.[1] ?? 4);
	const job = {
		id,
		filename,
		pageCount,
		statusReads: 0,
		deleteReads: 0,
		detailReads: [],
		pageListReads: 0,
		pageList404Reads: 0,
		createdAt: new Date().toISOString(),
		expiresAt: new Date(Date.now() + 3600_000).toISOString(),
		expired: false,
		deleted: false,
	};
	jobs.set(id, job);
	activeJobId = id;
	return job;
}

function jobResponse(job, status = "queued") {
	const completed =
		status === "queued"
			? 0
			: status === "processing"
				? Math.floor(job.pageCount / 2)
				: status === "partially_completed"
					? job.pageCount - 1
					: job.pageCount;
	const failed = status === "partially_completed" ? 1 : 0;
	const processing = status === "processing" ? 1 : 0;
	return {
		id: job.id,
		filename: job.filename,
		media_type: job.filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/png",
		status,
		progress: {
			total_pages: job.pageCount,
			completed_pages: completed,
			failed_pages: failed,
			processing_pages: processing,
			processed_pages: completed + failed,
		},
		created_at: job.createdAt,
		expires_at: job.expiresAt,
	};
}

function page(job, pageNumber) {
	const imageUrl = `/api/v1/ocr/jobs/${job.id}/pages/${pageNumber}/image`;
	let values;
	if (pageNumber === 1 && job.filename === "slow-page.pdf") {
		values = {
			original_text: "ข้อมูลผลลัพธ์จากงานเก่า",
			lines: [
				{
					text: "ข้อมูลผลลัพธ์จากงานเก่า",
					confidence: 0.94,
					box: { x1: 10, y1: 10, x2: 180, y2: 32 },
				},
			],
		};
	} else if (pageNumber === 1) {
		values = {
			original_text: "ใบเสร็จรับเงิน\nยอดรวม 250 บาท",
			lines: [
				{
					text: "ใบเสร็จรับเงิน",
					confidence: 0.98,
					box: { x1: 10, y1: 10, x2: 180, y2: 32 },
				},
			],
		};
	} else if (pageNumber === 2) {
		values = { original_text: "", lines: [] };
	} else if (pageNumber === 3) {
		values = {
			original_text: "หน้านี้ยังไม่เคยเปิดก่อนดาวน์โหลด",
			lines: [
				{
					text: "หน้านี้ยังไม่เคยเปิดก่อนดาวน์โหลด",
					confidence: 0.91,
					box: { x1: 5, y1: 4, x2: 90, y2: 24 },
				},
			],
		};
	} else {
		values = {
			original_text: `ผล OCR ตัวอย่างหน้า ${pageNumber}`,
			lines: [
				{
					text: `ผล OCR ตัวอย่างหน้า ${pageNumber}`,
					confidence: 0.9,
					box: { x1: 5, y1: 4, x2: 90, y2: 24 },
				},
			],
		};
	}
	const status = pageNumber === job.pageCount ? "failed" : "completed";
	return {
		page_number: pageNumber,
		status,
		has_text: status === "completed" ? Boolean(values.original_text.trim()) : null,
		original_text: status === "completed" ? values.original_text : null,
		lines: status === "completed" ? values.lines : null,
		image_size: status === "completed" ? { width: 1, height: 1 } : null,
		ocr_duration_ms: status === "failed" ? 78.6 : pageNumber === 1 ? 142.37 : null,
		error:
			status === "failed" ? { code: "OCR_PAGE_FAILED", message: "อ่านข้อความหน้านี้ไม่สำเร็จ" } : null,
		image_url: imageUrl,
	};
}

async function readUpload(request) {
	const chunks = [];
	for await (const chunk of request) chunks.push(chunk);
	const body = Buffer.concat(chunks);
	const contentType = request.headers["content-type"] ?? "";
	if (!contentType.startsWith("multipart/form-data; boundary=")) return null;
	const raw = body.toString("latin1");
	const match = raw.match(/name="file"; filename="([^"]+)"/);
	if (!match || !raw.includes("fixture image bytes")) return null;
	return match[1];
}

function jobNotFound(response) {
	json(response, 404, {
		error: { code: "JOB_NOT_FOUND", message: "ไม่พบงานนี้ หรือข้อมูลหมดอายุแล้ว", retryable: false },
	});
}

const server = createServer(async (request, response) => {
	const path = new URL(request.url ?? "/", `http://${host}:${port}`).pathname;
	if (path === "/health" && request.method === "GET") {
		json(response, 200, { status: "ok" });
		return;
	}
	if (path === "/__fixture/state" && request.method === "GET") {
		const job = activeJobId ? jobs.get(activeJobId) : null;
		json(response, 200, {
			activeJobId,
			filename: job?.filename ?? null,
			statusReads: job?.statusReads ?? 0,
			deleteReads: job?.deleteReads ?? 0,
			detailReads: job?.detailReads ?? [],
			pageListReads: job?.pageListReads ?? 0,
			pageList404Reads: job?.pageList404Reads ?? 0,
			uncertainAttempts,
			abortedUpstreamResponses,
		});
		return;
	}
	if (path === "/__fixture/expire-page-list" && request.method === "POST") {
		const job = activeJobId ? jobs.get(activeJobId) : null;
		if (!job) {
			jobNotFound(response);
			return;
		}
		job.pageListExpired = true;
		json(response, 200, { pageListExpired: true });
		return;
	}
	if (path === "/api/v1/ocr/capabilities" && request.method === "GET") {
		json(response, 200, {
			supported_media_types: ["image/jpeg", "image/png", "application/pdf"],
			max_upload_bytes: 20_971_520,
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
		});
		return;
	}
	if (path === "/api/v1/ocr/jobs" && request.method === "POST") {
		const filename = await readUpload(request);
		if (!filename) {
			json(response, 400, {
				error: {
					code: "INVALID_MULTIPART",
					message: "ต้องส่งไฟล์ใน multipart field `file`",
					retryable: false,
				},
			});
			return;
		}
		if (filename === "rejected.pdf") {
			json(response, 413, {
				error: { code: "FILE_TOO_LARGE", message: "ไฟล์มีขนาดเกินขีดจำกัด", retryable: false },
			});
			return;
		}
		if (filename === "queue-full.pdf") {
			json(
				response,
				503,
				{
					error: {
						code: "JOB_QUEUE_FULL",
						message: "ระบบกำลังประมวลงานเต็ม โปรดลองอีกครั้งภายหลัง",
						retryable: true,
					},
				},
				{ "retry-after": "3" },
			);
			return;
		}
		if (filename === "pixel-exceeded.pdf") {
			json(response, 422, {
				error: {
					code: "DOCUMENT_PIXEL_LIMIT_EXCEEDED",
					message: "จำนวนพิกเซลรวมของเอกสารเกินขีดจำกัด",
					retryable: false,
				},
			});
			return;
		}
		const job = createJob(filename);
		if (filename === "slow-timeout.pdf") {
			await new Promise((resolve) => setTimeout(resolve, 2_500));
			if (response.destroyed) return;
		}
		if (filename === "uncertain.pdf" && uncertainAttempts === 0) {
			uncertainAttempts += 1;
			response.destroy();
			return;
		}
		const location =
			filename === "unsafe-location.pdf"
				? `https://untrusted.example/api/v1/ocr/jobs/${job.id}?token=private`
				: `/api/v1/ocr/jobs/${job.id}`;
		json(response, 202, jobResponse(job), { location });
		return;
	}

	const match = path.match(/^\/api\/v1\/ocr\/jobs\/([0-9a-f-]{36})(.*)$/i);
	const job = match ? jobs.get(match[1]) : undefined;
	const suffix = match?.[2] ?? "";
	if (!job || job.expired || job.deleted) {
		if (match) jobNotFound(response);
		else
			json(response, 404, {
				error: { code: "NOT_FOUND", message: "ไม่พบปลายทาง", retryable: false },
			});
		return;
	}

	if (suffix === "" && request.method === "GET") {
		job.statusReads += 1;
		if (job.filename === "slow-cancel.pdf" && job.statusReads === 1) {
			response.once("close", () => {
				if (!response.writableEnded) abortedUpstreamResponses += 1;
			});
			await new Promise((resolve) => setTimeout(resolve, 2_500));
			if (response.destroyed) return;
		}
		const status =
			job.statusReads === 1 ? "queued" : job.statusReads < 4 ? "processing" : "partially_completed";
		json(response, 200, jobResponse(job, status));
		return;
	}
	if (suffix === "" && request.method === "DELETE") {
		job.deleteReads += 1;
		if (job.deleteReads === 1) {
			json(response, 503, {
				error: { code: "FIXTURE_DELETE_FAILED", message: "ลบงานไม่สำเร็จชั่วคราว", retryable: true },
			});
			return;
		}
		job.deleted = true;
		response.writeHead(204, { "cache-control": "no-store" });
		response.end();
		return;
	}
	if (suffix === "/pages" && request.method === "GET") {
		job.pageListReads += 1;
		if (job.pageListExpired) {
			job.pageList404Reads += 1;
			jobNotFound(response);
			return;
		}
		json(response, 200, {
			pages: Array.from({ length: job.pageCount }, (_, index) => page(job, index + 1)),
		});
		return;
	}
	const pageMatch = suffix.match(/^\/pages\/(\d+)$/);
	if (pageMatch && request.method === "GET") {
		const pageNumber = Number(pageMatch[1]);
		if (pageNumber < 1 || pageNumber > job.pageCount) {
			json(response, 404, {
				error: { code: "PAGE_NOT_FOUND", message: "ไม่พบหน้า", retryable: false },
			});
			return;
		}
		job.detailReads.push(pageNumber);
		if (job.filename === "slow-page.pdf" && pageNumber === 1) {
			response.once("close", () => {
				if (!response.writableEnded) abortedUpstreamResponses += 1;
			});
			await new Promise((resolve) => setTimeout(resolve, 2_500));
			if (response.destroyed) return;
		}
		if (job.filename === "incomplete.pdf" && pageNumber === 3) {
			json(response, 503, {
				error: {
					code: "FIXTURE_PAGE_READ_FAILED",
					message: "โหลดผลหน้าที่ 2 ไม่สำเร็จ",
					retryable: false,
				},
			});
			return;
		}
		if (job.filename === "expires-during-export.pdf" && pageNumber === 3) {
			job.expired = true;
			jobNotFound(response);
			return;
		}
		json(response, 200, page(job, pageNumber));
		return;
	}
	const imageMatch = suffix.match(/^\/pages\/(\d+)\/image$/);
	if (imageMatch && request.method === "GET") {
		response.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
		response.end(pagePng);
		return;
	}
	json(response, 404, { error: { code: "NOT_FOUND", message: "ไม่พบปลายทาง", retryable: false } });
});

server.listen(port, host);
for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => server.close(() => process.exit(0)));
}
