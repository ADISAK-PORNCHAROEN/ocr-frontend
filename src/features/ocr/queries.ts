import { getJob, getPage, getPages } from "./api/client";

export const ocrKeys = {
	all: ["ocr"] as const,
	job: (jobId: string) => ["ocr", "job", jobId] as const,
	pages: (jobId: string) => ["ocr", "pages", jobId] as const,
	page: (jobId: string, pageNumber: number) => ["ocr", "page", jobId, pageNumber] as const,
};

export const ocrQueries = {
	job: (jobId: string) => ({
		queryKey: ocrKeys.job(jobId),
		queryFn: ({ signal }: { signal: AbortSignal }) => getJob(jobId, signal),
	}),
	pages: (jobId: string) => ({
		queryKey: ocrKeys.pages(jobId),
		queryFn: ({ signal }: { signal: AbortSignal }) => getPages(jobId, signal),
	}),
	page: (jobId: string, pageNumber: number) => ({
		queryKey: ocrKeys.page(jobId, pageNumber),
		queryFn: ({ signal }: { signal: AbortSignal }) => getPage(jobId, pageNumber, signal),
	}),
};

export function shouldPollJob(status: string) {
	return status === "queued" || status === "processing";
}
