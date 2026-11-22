import type { Job, PageDetail } from "../api/schema";

export type ExportSnapshot = {
	job: Job;
	pages: PageDetail[];
	drafts: Readonly<Record<number, string>>;
	revision: number;
};

function exportedText(page: PageDetail, drafts: Readonly<Record<number, string>>) {
	return Object.hasOwn(drafts, page.number) ? drafts[page.number] : (page.originalText ?? "");
}

export function serializeTextExport(snapshot: ExportSnapshot) {
	return [...snapshot.pages]
		.sort((left, right) => left.number - right.number)
		.map((page) => {
			const text =
				page.status === "completed"
					? Object.hasOwn(snapshot.drafts, page.number)
						? exportedText(page, snapshot.drafts)
						: exportedText(page, snapshot.drafts) || "(ไม่พบข้อความ)"
					: page.status === "failed"
						? `(ถอดข้อความไม่สำเร็จ: ${page.error?.message ?? "ไม่ทราบสาเหตุ"})`
						: `(ยังไม่เสร็จ: ${page.status})`;
			return `หน้า ${page.number}\n${text}`;
		})
		.join("\n\n");
}

export function serializeJsonExport(snapshot: ExportSnapshot) {
	return JSON.stringify(
		{
			job: {
				id: snapshot.job.id,
				filename: snapshot.job.filename,
				media_type: snapshot.job.mediaType,
				created_at: snapshot.job.createdAt,
			},
			pages: [...snapshot.pages]
				.sort((left, right) => left.number - right.number)
				.map((page) => ({
					page_number: page.number,
					status: page.status,
					edited_text: page.status === "completed" ? exportedText(page, snapshot.drafts) : null,
					original:
						page.status === "completed"
							? {
									text: page.originalText,
									lines: page.lines,
									image_size: page.imageSize,
								}
							: null,
					error: page.error,
				})),
		},
		null,
		2,
	);
}

export function exportFilename(filename: string, extension: "txt" | "json") {
	const base = filename
		.replace(/\.[^.]+$/, "")
		.replace(/[<>:"/\\|?*]/g, "-")
		.split("")
		.map((character) => (character.charCodeAt(0) < 32 ? "-" : character))
		.join("")
		.trim();
	return `${base || "ocr-result"}.${extension}`;
}
