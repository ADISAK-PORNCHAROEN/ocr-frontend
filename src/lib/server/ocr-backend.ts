import "server-only";

const UPSTREAM_TIMEOUT_MS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_NUMBER = /^[1-9]\d{0,5}$/;

type Route = { path: string; methods: readonly string[] };

function resolveRoute(segments: string[]): Route | null {
	if (segments.length === 1 && segments[0] === "capabilities") {
		return { path: "/api/v1/ocr/capabilities", methods: ["GET"] };
	}
	if (segments.length === 1 && segments[0] === "jobs") {
		return { path: "/api/v1/ocr/jobs", methods: ["POST"] };
	}
	if (segments.length === 2 && segments[0] === "jobs" && UUID.test(segments[1])) {
		return {
			path: `/api/v1/ocr/jobs/${segments[1]}`,
			methods: ["GET", "DELETE"],
		};
	}
	if (
		segments.length === 3 &&
		segments[0] === "jobs" &&
		UUID.test(segments[1]) &&
		segments[2] === "pages"
	) {
		return {
			path: `/api/v1/ocr/jobs/${segments[1]}/pages`,
			methods: ["GET"],
		};
	}
	if (
		segments.length === 4 &&
		segments[0] === "jobs" &&
		UUID.test(segments[1]) &&
		PAGE_NUMBER.test(segments[3]) &&
		segments[2] === "pages"
	) {
		return {
			path: `/api/v1/ocr/jobs/${segments[1]}/pages/${segments[3]}`,
			methods: ["GET"],
		};
	}
	if (
		segments.length === 5 &&
		segments[0] === "jobs" &&
		UUID.test(segments[1]) &&
		PAGE_NUMBER.test(segments[3]) &&
		segments[2] === "pages" &&
		segments[4] === "image"
	) {
		return {
			path: `/api/v1/ocr/jobs/${segments[1]}/pages/${segments[3]}/image`,
			methods: ["GET"],
		};
	}
	return null;
}

function backendBaseUrl(): URL {
	const configured = process.env.OCR_BACKEND_URL;
	if (!configured) throw new Error("OCR_BACKEND_URL is not configured");

	const base = new URL(configured);
	if (
		(base.protocol !== "http:" && base.protocol !== "https:") ||
		base.username ||
		base.password ||
		base.search ||
		base.hash
	) {
		throw new Error("OCR_BACKEND_URL must be an HTTP(S) origin or path without credentials");
	}
	return base;
}

function errorResponse(status: number, code: string, message: string, retryable: boolean) {
	return Response.json(
		{ error: { code, message, retryable } },
		{ status, headers: { "cache-control": "no-store" } },
	);
}

export async function forwardOcrRequest(request: Request, segments: string[]) {
	const route = resolveRoute(segments);
	if (!route) {
		return errorResponse(404, "NOT_FOUND", "ไม่พบปลายทาง OCR ที่ร้องขอ", false);
	}
	if (!route.methods.includes(request.method)) {
		return errorResponse(405, "METHOD_NOT_ALLOWED", "ไม่รองรับวิธีส่งคำขอนี้", false);
	}

	let target: URL;
	try {
		target = new URL(route.path, backendBaseUrl());
	} catch {
		return errorResponse(
			503,
			"BACKEND_NOT_CONFIGURED",
			"ยังเชื่อมต่อบริการ OCR ไม่ได้ กรุณาลองใหม่ภายหลัง",
			true,
		);
	}

	const timeoutSignal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
	const signal = AbortSignal.any([request.signal, timeoutSignal]);
	const headers = new Headers({ accept: request.headers.get("accept") ?? "application/json" });
	const contentType = request.headers.get("content-type");
	if (request.method === "POST" && contentType) headers.set("content-type", contentType);

	try {
		const init: RequestInit & { duplex?: "half" } = {
			method: request.method,
			headers,
			signal,
			cache: "no-store",
			redirect: "manual",
		};
		if (request.method === "POST") {
			init.body = request.body;
			init.duplex = "half";
		}

		const upstream = await fetch(target, init);
		const responseHeaders = new Headers({ "cache-control": "no-store" });
		const upstreamType = upstream.headers.get("content-type");
		if (upstreamType) responseHeaders.set("content-type", upstreamType);
		return new Response(upstream.body, {
			status: upstream.status,
			headers: responseHeaders,
		});
	} catch {
		if (request.signal.aborted) return new Response(null, { status: 499 });
		if (timeoutSignal.aborted) {
			return errorResponse(
				504,
				"UPSTREAM_TIMEOUT",
				"บริการ OCR ใช้เวลาตอบกลับนานเกินไป ยังไม่ทราบว่ารับงานแล้วหรือไม่",
				false,
			);
		}
		return errorResponse(
			503,
			"BACKEND_UNAVAILABLE",
			"ติดต่อบริการ OCR ไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองใหม่",
			true,
		);
	}
}
