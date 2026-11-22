import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 4010;
const jobId = "00000000-0000-4000-8000-000000000001";
const jobUrl = `/api/v1/ocr/jobs/${jobId}`;
const pagePng = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jW9sAAAAASUVORK5CYII=",
	"base64",
);

let filename = "document.pdf";
let statusReads = 0;
let deleteReads = 0;

function json(response, status, value) {
	response.writeHead(status, {
		"content-type": "application/json",
		"cache-control": "no-store",
	});
	response.end(JSON.stringify(value));
}

function basePage(pageNumber, status, values = {}) {
	return {
		page_number: pageNumber,
		status,
		has_text: status === "completed" ? Boolean(values.original_text?.trim()) : null,
		original_text: status === "completed" ? (values.original_text ?? "") : null,
		lines: status === "completed" ? (values.lines ?? []) : null,
		image_size: status === "completed" ? { width: 1, height: 1 } : null,
		error:
			status === "failed" ? { code: "OCR_PAGE_FAILED", message: "อ่านข้อความหน้านี้ไม่สำเร็จ" } : null,
		image_url: `${jobUrl}/pages/${pageNumber}/image`,
	};
}

function page(number) {
	if (number === 1) {
		return basePage(1, "completed", {
			original_text: "ใบเสร็จรับเงิน\nยอดรวม 250 บาท",
			lines: [
				{
					text: "ใบเสร็จรับเงิน",
					confidence: 0.98,
					box: { x1: 10, y1: 10, x2: 180, y2: 32 },
				},
			],
		});
	}
	if (number === 2) return basePage(2, "completed", { original_text: "" });
	return basePage(3, "failed");
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

const server = createServer(async (request, response) => {
	const path = new URL(request.url ?? "/", `http://${host}:${port}`).pathname;
	if (path === "/health" && request.method === "GET") {
		json(response, 200, { status: "ok" });
		return;
	}
	if (path === "/api/v1/ocr/capabilities" && request.method === "GET") {
		json(response, 200, {
			supported_media_types: ["image/jpeg", "image/png", "application/pdf"],
			max_upload_bytes: 5_000_000,
			max_pages: 20,
			pdf_dpi: 150,
			max_page_pixels: 20_000_000,
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
		const uploadedFilename = await readUpload(request);
		if (!uploadedFilename) {
			json(response, 400, {
				error: {
					code: "INVALID_MULTIPART",
					message: "ต้องส่งไฟล์ใน multipart field `file`",
					retryable: false,
				},
			});
			return;
		}
		filename = uploadedFilename;
		statusReads = 0;
		deleteReads = 0;
		json(response, 202, {
			id: jobId,
			filename,
			media_type: filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/png",
			status: "queued",
			progress: {
				total_pages: 0,
				completed_pages: 0,
				failed_pages: 0,
				processing_pages: 0,
				processed_pages: 0,
			},
			created_at: new Date().toISOString(),
			expires_at: new Date(Date.now() + 3600_000).toISOString(),
		});
		return;
	}
	if (path === jobUrl && request.method === "GET") {
		statusReads += 1;
		const status =
			statusReads === 1 ? "queued" : statusReads < 4 ? "processing" : "partially_completed";
		const completed = status === "queued" ? 0 : status === "processing" ? 2 : 2;
		const failed = status === "partially_completed" ? 1 : 0;
		const processing = status === "processing" ? 1 : 0;
		json(response, 200, {
			id: jobId,
			filename,
			media_type: filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/png",
			status,
			progress: {
				total_pages: status === "queued" ? 3 : 3,
				completed_pages: completed,
				failed_pages: failed,
				processing_pages: processing,
				processed_pages: completed + failed,
			},
			created_at: new Date().toISOString(),
			expires_at: new Date(Date.now() + 3600_000).toISOString(),
		});
		return;
	}
	if (path === jobUrl && request.method === "DELETE") {
		deleteReads += 1;
		if (deleteReads === 1) {
			json(response, 503, {
				error: { code: "FIXTURE_DELETE_FAILED", message: "ลบงานไม่สำเร็จชั่วคราว", retryable: true },
			});
			return;
		}
		response.writeHead(204, { "cache-control": "no-store" });
		response.end();
		return;
	}
	if (path === `${jobUrl}/pages` && request.method === "GET") {
		json(response, 200, { pages: [page(1), page(2), page(3)] });
		return;
	}
	const pageMatch = path.match(new RegExp(`^${jobUrl}/pages/(\\d+)$`));
	if (pageMatch && request.method === "GET") {
		const pageNumber = Number(pageMatch[1]);
		if (pageNumber < 1 || pageNumber > 3) {
			json(response, 404, {
				error: { code: "PAGE_NOT_FOUND", message: "ไม่พบหน้า", retryable: false },
			});
			return;
		}
		json(response, 200, page(pageNumber));
		return;
	}
	const imageMatch = path.match(new RegExp(`^${jobUrl}/pages/(\\d+)/image$`));
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
