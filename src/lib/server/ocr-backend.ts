import "server-only";

const DEFAULT_UPSTREAM_TIMEOUT_MS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_NUMBER = /^[1-9]\d*$/;

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
		isPageNumber(segments[3]) &&
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
		isPageNumber(segments[3]) &&
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

function isPageNumber(value: string) {
	return PAGE_NUMBER.test(value) && Number.isSafeInteger(Number(value));
}

function sameOriginJobLocation(value: string | null, target: URL) {
	if (!value) return null;
	try {
		const location = new URL(value, target);
		const match =
			/^\/api\/v1\/ocr\/jobs\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(
				location.pathname,
			);
		if (location.origin !== target.origin || location.search || location.hash || !match)
			return null;
		return `/api/ocr/jobs/${match[1]}`;
	} catch {
		return null;
	}
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

function hasAllowedMutationOrigin(request: Request) {
	const origin = request.headers.get("origin");
	if (!origin) return false;
	const configuredOrigins =
		process.env.OCR_APP_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000";
	const allowedOrigins = configuredOrigins.split(",").flatMap((value) => {
		const candidate = value.trim();
		try {
			return new URL(candidate).origin === candidate ? [candidate] : [];
		} catch {
			return [];
		}
	});
	return allowedOrigins.includes(origin);
}

export async function forwardOcrRequest(request: Request, segments: string[]) {
	const route = resolveRoute(segments);
	if (!route) {
		return errorResponse(404, "NOT_FOUND", "ไม่พบปลายทาง OCR ที่ร้องขอ", false);
	}
	if (!route.methods.includes(request.method)) {
		return errorResponse(405, "METHOD_NOT_ALLOWED", "ไม่รองรับวิธีส่งคำขอนี้", false);
	}
	if (
		(request.method === "POST" || request.method === "DELETE") &&
		!hasAllowedMutationOrigin(request)
	) {
		return errorResponse(403, "ORIGIN_NOT_ALLOWED", "ไม่อนุญาตให้ส่งคำขอจากเว็บไซต์นี้", false);
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

	const configuredTimeout = Number(process.env.OCR_BACKEND_TIMEOUT_MS);
	const timeoutMs =
		Number.isSafeInteger(configuredTimeout) &&
		configuredTimeout > 0 &&
		configuredTimeout <= 2_147_483_647
			? configuredTimeout
			: DEFAULT_UPSTREAM_TIMEOUT_MS;
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
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
		const retryAfter = upstream.headers.get("retry-after");
		if (retryAfter) responseHeaders.set("retry-after", retryAfter);
		const location = sameOriginJobLocation(upstream.headers.get("location"), target);
		if (location) responseHeaders.set("location", location);
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
