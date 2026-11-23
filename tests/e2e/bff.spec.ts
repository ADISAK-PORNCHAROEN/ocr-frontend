import { expect, test } from "@playwright/test";

test("BFF forwards multipart requests, JSON and binary responses to the HTTP fixture", async ({
	request,
}) => {
	const capabilities = await request.get("/api/ocr/capabilities");
	expect(capabilities.status()).toBe(200);
	expect((await capabilities.json()).supported_media_types).toContain("application/pdf");

	const upload = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "fixture.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(upload.status()).toBe(202);
	expect(upload.headers().location).toMatch(/^\/api\/ocr\/jobs\/[0-9a-f-]{36}$/i);
	const created = await upload.json();
	const jobId = created.id as string;
	expect(created.filename).toBe("fixture.pdf");

	const job = await request.get(`/api/ocr/jobs/${jobId}`);
	expect(job.status()).toBe(200);
	expect((await job.json()).id).toBe(jobId);
	const pageBeyondFormerCeiling = await request.get(`/api/ocr/jobs/${jobId}/pages/1000000`);
	expect(pageBeyondFormerCeiling.status()).toBe(404);
	expect((await pageBeyondFormerCeiling.json()).error.code).toBe("PAGE_NOT_FOUND");

	const image = await request.get(`/api/ocr/jobs/${jobId}/pages/1/image`);
	expect(image.status()).toBe(200);
	expect(image.headers()["content-type"]).toContain("image/png");
	expect((await image.body()).byteLength).toBeGreaterThan(20);
});

test("BFF preserves the backend retry hint and forwards new pixel-limit errors", async ({
	request,
}) => {
	const queueFull = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "queue-full.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(queueFull.status()).toBe(503);
	expect(queueFull.headers()["retry-after"]).toBe("3");
	expect((await queueFull.json()).error.code).toBe("JOB_QUEUE_FULL");

	const pixelLimit = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "pixel-exceeded.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(pixelLimit.status()).toBe(422);
	expect((await pixelLimit.json()).error.code).toBe("DOCUMENT_PIXEL_LIMIT_EXCEEDED");

	const unsafeLocation = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "unsafe-location.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(unsafeLocation.status()).toBe(202);
	expect(unsafeLocation.headers().location).toBeUndefined();
});

test("BFF rejects arbitrary paths and preserves backend errors", async ({ request }) => {
	const unknown = await request.get("/api/ocr/admin/config");
	expect(unknown.status()).toBe(404);
	expect((await unknown.json()).error.code).toBe("NOT_FOUND");

	const malformedId = await request.get("/api/ocr/jobs/not-a-uuid");
	expect(malformedId.status()).toBe(404);

	const upload = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "fixture.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(upload.status()).toBe(202);
	const created = await upload.json();
	const failedDelete = await request.delete(`/api/ocr/jobs/${created.id}`, {
		headers: { origin: "http://127.0.0.1:3001" },
	});
	expect(failedDelete.status()).toBe(503);
	expect((await failedDelete.json()).error.code).toBe("FIXTURE_DELETE_FAILED");
});

test("BFF reports an uncertain upload when the backend exceeds its timeout", async ({
	request,
}) => {
	const response = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "slow-timeout.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(response.status()).toBe(504);
	expect((await response.json()).error).toMatchObject({
		code: "UPSTREAM_TIMEOUT",
		retryable: false,
	});
});

test("BFF rejects cross-origin upload and delete requests before they reach the backend", async ({
	request,
}) => {
	const before = await request
		.get("http://127.0.0.1:4010/__fixture/state")
		.then((response) => response.json());
	const rejectedUpload = await request.post("/api/ocr/jobs", {
		headers: { origin: "https://untrusted.example" },
		multipart: {
			file: {
				name: "fixture.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(rejectedUpload.status()).toBe(403);
	expect((await rejectedUpload.json()).error.code).toBe("ORIGIN_NOT_ALLOWED");
	const missingOriginUpload = await request.post("/api/ocr/jobs", {
		multipart: {
			file: {
				name: "fixture.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(missingOriginUpload.status()).toBe(403);
	const afterRejectedUploads = await request
		.get("http://127.0.0.1:4010/__fixture/state")
		.then((response) => response.json());
	expect(afterRejectedUploads.activeJobId).toBe(before.activeJobId);
	const created = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "fixture.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	const job = await created.json();
	const rejectedDelete = await request.delete(`/api/ocr/jobs/${job.id}`, {
		headers: { origin: "https://untrusted.example" },
	});
	expect(rejectedDelete.status()).toBe(403);
	expect((await rejectedDelete.json()).error.code).toBe("ORIGIN_NOT_ALLOWED");
	const after = await request
		.get("http://127.0.0.1:4010/__fixture/state")
		.then((response) => response.json());
	expect(after.activeJobId).not.toBe(before.activeJobId);
	expect(after.deleteReads).toBe(0);
});

test("BFF cancels its upstream request when the browser aborts", async ({ page, request }) => {
	await page.goto("/");
	const upload = await request.post("/api/ocr/jobs", {
		headers: { origin: "http://127.0.0.1:3001" },
		multipart: {
			file: {
				name: "slow-cancel.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	const { id: jobId } = await upload.json();

	const outcome = await page.evaluate(async (id: string) => {
		const controller = new AbortController();
		window.setTimeout(() => controller.abort(), 100);
		try {
			await fetch(`/api/ocr/jobs/${id}`, { signal: controller.signal });
			return "completed";
		} catch {
			return "aborted";
		}
	}, jobId as string);
	expect(outcome).toBe("aborted");
	await expect
		.poll(
			async () => {
				const state = await request.get("http://127.0.0.1:4010/__fixture/state");
				return (await state.json()).abortedUpstreamResponses;
			},
			{ timeout: 500, intervals: [50] },
		)
		.toBeGreaterThan(0);
});
