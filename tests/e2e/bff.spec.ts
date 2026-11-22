import { expect, test } from "@playwright/test";

const jobId = "00000000-0000-4000-8000-000000000001";

test("BFF forwards multipart requests, JSON and binary responses to the HTTP fixture", async ({
	request,
}) => {
	const capabilities = await request.get("/api/ocr/capabilities");
	expect(capabilities.status()).toBe(200);
	expect((await capabilities.json()).supported_media_types).toContain("application/pdf");

	const upload = await request.post("/api/ocr/jobs", {
		multipart: {
			file: {
				name: "fixture.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(upload.status()).toBe(202);
	expect((await upload.json()).filename).toBe("fixture.pdf");

	const job = await request.get(`/api/ocr/jobs/${jobId}`);
	expect(job.status()).toBe(200);
	expect((await job.json()).id).toBe(jobId);

	const image = await request.get(`/api/ocr/jobs/${jobId}/pages/1/image`);
	expect(image.status()).toBe(200);
	expect(image.headers()["content-type"]).toContain("image/png");
	expect((await image.body()).byteLength).toBeGreaterThan(20);
});

test("BFF rejects arbitrary paths and preserves backend errors", async ({ request }) => {
	const unknown = await request.get("/api/ocr/admin/config");
	expect(unknown.status()).toBe(404);
	expect((await unknown.json()).error.code).toBe("NOT_FOUND");

	const malformedId = await request.get("/api/ocr/jobs/not-a-uuid");
	expect(malformedId.status()).toBe(404);

	const upload = await request.post("/api/ocr/jobs", {
		multipart: {
			file: {
				name: "fixture.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("fixture image bytes"),
			},
		},
	});
	expect(upload.status()).toBe(202);
	const failedDelete = await request.delete(`/api/ocr/jobs/${jobId}`);
	expect(failedDelete.status()).toBe(503);
	expect((await failedDelete.json()).error.code).toBe("FIXTURE_DELETE_FAILED");
});
