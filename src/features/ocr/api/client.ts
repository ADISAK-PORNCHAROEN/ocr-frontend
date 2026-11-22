import {
	type Job,
	jobWireSchema,
	mapJob,
	mapPage,
	type PageDetail,
	type PageSummary,
	pageDetailWireSchema,
	pagesWireSchema,
} from "./schema";

type ApiErrorBody = {
	error?: { code?: unknown; message?: unknown; retryable?: unknown };
};

export class OcrRequestError extends Error {
	readonly code: string;
	readonly status: number | null;
	readonly retryable: boolean;

	constructor(
		message: string,
		options: { code: string; status?: number | null; retryable?: boolean },
	) {
		super(message);
		this.name = "OcrRequestError";
		this.code = options.code;
		this.status = options.status ?? null;
		this.retryable = options.retryable ?? false;
	}
}

async function jsonRequest<T>(
	path: string,
	options: RequestInit,
	parse: (body: unknown) => T,
): Promise<T> {
	let response: Response;
	try {
		response = await fetch(path, { ...options, cache: "no-store" });
	} catch {
		throw new OcrRequestError("เครือข่ายขัดข้อง ตรวจการเชื่อมต่อแล้วลองใหม่", {
			code: "NETWORK_ERROR",
			retryable: true,
		});
	}

	if (!response.ok) {
		let body: ApiErrorBody = {};
		try {
			body = (await response.json()) as ApiErrorBody;
		} catch {
			// Use a safe fallback when the backend response is not JSON.
		}
		const error = body.error;
		throw new OcrRequestError(
			typeof error?.message === "string" ? error.message : "บริการ OCR ตอบกลับด้วยข้อผิดพลาด",
			{
				code: typeof error?.code === "string" ? error.code : `HTTP_${response.status}`,
				status: response.status,
				retryable: error?.retryable === true,
			},
		);
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		throw new OcrRequestError("ข้อมูลที่ได้รับจากบริการ OCR อ่านไม่ได้", {
			code: "INVALID_RESPONSE",
			status: response.status,
		});
	}
	try {
		return parse(body);
	} catch {
		throw new OcrRequestError("รูปแบบข้อมูลจากบริการ OCR ไม่ตรงกับที่รองรับ", {
			code: "INVALID_RESPONSE",
			status: response.status,
		});
	}
}

export async function createJob(file: File, signal?: AbortSignal): Promise<Job> {
	const form = new FormData();
	form.append("file", file, file.name);
	const wire = await jsonRequest("/api/ocr/jobs", { method: "POST", body: form, signal }, (body) =>
		jobWireSchema.parse(body),
	);
	return mapJob(wire);
}

export async function getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
	const wire = await jsonRequest(`/api/ocr/jobs/${jobId}`, { method: "GET", signal }, (body) =>
		jobWireSchema.parse(body),
	);
	return mapJob(wire);
}

export async function getPages(jobId: string, signal?: AbortSignal): Promise<PageSummary[]> {
	const wire = await jsonRequest(
		`/api/ocr/jobs/${jobId}/pages`,
		{ method: "GET", signal },
		(body) => pagesWireSchema.parse(body),
	);
	return wire.pages.map((page) => ({
		number: page.page_number,
		status: page.status,
		hasText: page.has_text,
		error: page.error,
		imageUrl: `/api/ocr/jobs/${jobId}/pages/${page.page_number}/image`,
	}));
}

export async function getPage(
	jobId: string,
	pageNumber: number,
	signal?: AbortSignal,
): Promise<PageDetail> {
	const wire = await jsonRequest(
		`/api/ocr/jobs/${jobId}/pages/${pageNumber}`,
		{ method: "GET", signal },
		(body) => pageDetailWireSchema.parse(body),
	);
	return mapPage(wire, jobId);
}

export async function deleteJob(jobId: string, signal?: AbortSignal): Promise<void> {
	let response: Response;
	try {
		response = await fetch(`/api/ocr/jobs/${jobId}`, {
			method: "DELETE",
			signal,
			cache: "no-store",
		});
	} catch {
		throw new OcrRequestError("เครือข่ายขัดข้อง จึงยังยืนยันการลบงานไม่ได้", {
			code: "NETWORK_ERROR",
			retryable: true,
		});
	}
	if (!response.ok) {
		let body: ApiErrorBody = {};
		try {
			body = (await response.json()) as ApiErrorBody;
		} catch {
			// Keep a safe fallback message.
		}
		throw new OcrRequestError(
			typeof body.error?.message === "string" ? body.error.message : "ลบงานไม่สำเร็จ",
			{
				code: typeof body.error?.code === "string" ? body.error.code : `HTTP_${response.status}`,
				status: response.status,
				retryable: body.error?.retryable === true,
			},
		);
	}
}
