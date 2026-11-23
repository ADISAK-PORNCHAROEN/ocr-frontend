"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { createJob, deleteJob, OcrRequestError } from "../api/client";
import type { Job, PageDetail, PageSummary } from "../api/schema";
import {
	exportFilename,
	serializeDraftRecovery,
	serializeJsonExport,
	serializeTextExport,
} from "../export/serialize";
import { ocrKeys, ocrQueries, shouldPollJob } from "../queries";
import {
	createInitialSession,
	hasUndownloadedEdits,
	pageDraft,
	sessionReducer,
} from "../session/session";
import { PageReview } from "./PageReview";
import { ProgressPanel } from "./ProgressPanel";
import { UploadPanel } from "./UploadPanel";
import { WorkflowSteps } from "./WorkflowSteps";

const terminalStatuses = new Set<Job["status"]>(["completed", "partially_completed", "failed"]);

function isCompletePageIndex(totalPages: number, pages: PageSummary[]) {
	if (totalPages < 1 || pages.length !== totalPages) return false;
	const numbers = new Set(pages.map((page) => page.number));
	return (
		numbers.size === totalPages &&
		Array.from({ length: totalPages }, (_, index) => index + 1).every((number) =>
			numbers.has(number),
		)
	);
}

function triggerDownload(filename: string, contents: string, type: string) {
	const url = URL.createObjectURL(new Blob([contents], { type }));
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
}

function UploadError({ error, onRetry }: { error: OcrRequestError; onRetry: () => void }) {
	return (
		<div className="error-callout" role="alert">
			<strong>โหลดข้อกำหนดการใช้งานไม่ได้</strong>
			<p>{error.message}</p>
			<button className="text-button" type="button" onClick={onRetry}>
				ลองโหลดอีกครั้ง
			</button>
		</div>
	);
}

export function OcrWorkspace() {
	const queryClient = useQueryClient();
	const capabilities = useQuery(ocrQueries.capabilities());
	const upload = useMutation({ mutationFn: (file: File) => createJob(file), retry: false });
	const [job, setJob] = useState<Job | null>(null);
	const [uploadError, setUploadError] = useState<OcrRequestError | null>(null);

	function submit(file: File) {
		setUploadError(null);
		upload.mutate(file, {
			onSuccess: (created) => setJob(created),
			onError: (error) =>
				setUploadError(
					error instanceof OcrRequestError
						? error
						: new OcrRequestError(errorMessage(error), { code: "UPLOAD_FAILED" }),
				),
		});
	}

	function endSession(jobId: string) {
		queryClient.removeQueries({ queryKey: ocrKeys.job(jobId) });
		queryClient.removeQueries({ queryKey: ocrKeys.pages(jobId) });
		queryClient.removeQueries({ queryKey: ["ocr", "page", jobId] });
		setJob(null);
	}

	return (
		<main id="main-content" className="workspace-main">
			<div className="workspace-heading">
				<p>OCR PLAYGROUND</p>
				<h1>ตรวจเอกสารได้ทีละหน้า</h1>
				<span>เริ่มจากไฟล์เดียว ตรวจผลเทียบกับต้นฉบับ และแก้ไขข้อความก่อนนำออกไปใช้งาน</span>
			</div>
			<WorkflowSteps active={job ? "review" : "upload"} />
			{job ? (
				<ActiveJob key={job.id} initialJob={job} onEnd={() => endSession(job.id)} />
			) : (
				<>
					{capabilities.error instanceof OcrRequestError ? (
						<UploadError error={capabilities.error} onRetry={() => void capabilities.refetch()} />
					) : null}
					<UploadPanel
						capabilities={capabilities.data}
						capabilitiesError={Boolean(capabilities.error)}
						uploading={upload.isPending}
						uploadError={uploadError}
						onUpload={submit}
					/>
				</>
			)}
		</main>
	);
}

function ActiveJob({ initialJob, onEnd }: { initialJob: Job; onEnd: () => void }) {
	const queryClient = useQueryClient();
	const [session, dispatch] = useReducer(sessionReducer, initialJob.id, createInitialSession);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [operationError, setOperationError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [exporting, setExporting] = useState<"txt" | "json" | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [expiredByExport, setExpiredByExport] = useState(false);
	const dirty = hasUndownloadedEdits(session);

	const jobQuery = useQuery({
		...ocrQueries.job(initialJob.id),
		initialData: initialJob,
		initialDataUpdatedAt: 0,
		refetchInterval: (query) =>
			query.state.error
				? false
				: shouldPollJob(query.state.data?.status ?? initialJob.status)
					? 1_500
					: false,
	});
	const job = jobQuery.data ?? initialJob;
	const terminal = terminalStatuses.has(job.status);
	const jobExpired =
		expiredByExport || (jobQuery.error instanceof OcrRequestError && jobQuery.error.status === 404);
	const pagesQuery = useQuery({
		...ocrQueries.pages(job.id),
		enabled: terminal && !jobExpired,
	});
	const pages = pagesQuery.data ?? [];
	const pageIndexComplete = isCompletePageIndex(job.progress.totalPages, pages);
	const selectedSummary = pages.find((page) => page.number === session.selectedPage);
	const pageQuery = useQuery({
		...ocrQueries.page(job.id, session.selectedPage),
		enabled: pageIndexComplete && !jobExpired && selectedSummary?.status === "completed",
	});
	const activePageError = pagesQuery.error ?? pageQuery.error;
	const expired =
		jobExpired || (activePageError instanceof OcrRequestError && activePageError.status === 404);
	const allPagesFinished =
		pageIndexComplete &&
		pages.every((page) => page.status === "completed" || page.status === "failed");
	const failedPages = pages.filter((page) => page.status === "failed");
	const canExport = allPagesFinished && !expired && !pagesQuery.error;

	useEffect(() => {
		if (pages.length && !pages.some((page) => page.number === session.selectedPage)) {
			dispatch({ type: "select-page", pageNumber: pages[0].number });
		}
	}, [pages, session.selectedPage]);

	useEffect(() => {
		if (!dirty) return;
		const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", warnBeforeLeaving);
		return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
	}, [dirty]);

	async function finishSession() {
		if (dirty && !window.confirm("มีข้อความที่ยังไม่ได้ดาวน์โหลด ต้องการเริ่มใหม่และทิ้งข้อความเหล่านี้หรือไม่?"))
			return;
		setDeleteError(null);
		setOperationError(null);
		setDeleting(true);
		try {
			await deleteJob(job.id);
		} catch (error) {
			if (error instanceof OcrRequestError && error.status === 404) {
				onEnd();
				return;
			}
			setDeleteError(errorMessage(error));
			return;
		} finally {
			setDeleting(false);
		}
		onEnd();
	}

	function continueAfterDeleteFailure() {
		if (
			dirty &&
			!window.confirm(
				"ข้อความที่ยังไม่ได้ดาวน์โหลดจะหายไป และ backend จะลบงานตามอายุที่กำหนด ต้องการเริ่มใหม่หรือไม่?",
			)
		)
			return;
		onEnd();
	}

	async function copyCurrentPage() {
		const original = pageQuery.data?.originalText ?? "";
		const text = pageDraft(session, session.selectedPage, original);
		await copyText(text, "คัดลอกข้อความหน้านี้แล้ว");
	}

	async function copyText(text: string, successMessage: string) {
		try {
			await navigator.clipboard.writeText(text);
			setNotice(successMessage);
		} catch {
			setOperationError("คัดลอกไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกด้วยแป้นพิมพ์");
		}
	}

	async function copyAllDrafts() {
		const text = serializeDraftRecovery(session.drafts);
		if (text) await copyText(text, "คัดลอกข้อความ draft ทั้งหมดแล้ว");
	}

	async function download(format: "txt" | "json") {
		if (!canExport || exporting) return;
		if (
			failedPages.length &&
			!window.confirm(
				`มี ${failedPages.length} หน้าที่ถอดข้อความไม่สำเร็จ ไฟล์จะแสดงสถานะของหน้าดังกล่าว ต้องการดาวน์โหลดผลบางส่วนหรือไม่?`,
			)
		)
			return;
		setExporting(format);
		setOperationError(null);
		setNotice(null);
		const exportRevision = session.revision;
		const exportDrafts = { ...session.drafts };
		try {
			const completedPages = pages.filter((page) => page.status === "completed");
			const successfulDetails = await Promise.all(
				completedPages.map((page) =>
					queryClient.fetchQuery({
						...ocrQueries.page(job.id, page.number),
						retry: false,
						staleTime: 0,
					}),
				),
			);
			if (successfulDetails.some((page) => page.status !== "completed")) {
				throw new Error("ผลของหน้าที่สำเร็จเปลี่ยนแปลงระหว่างดาวน์โหลด กรุณาตรวจงานอีกครั้ง");
			}
			const detailsByNumber = new Map(successfulDetails.map((page) => [page.number, page]));
			const exportPages: PageDetail[] = [...pages]
				.sort((left, right) => left.number - right.number)
				.map(
					(summary) =>
						detailsByNumber.get(summary.number) ?? {
							...summary,
							originalText: null,
							lines: null,
							imageSize: null,
							ocrDurationMs: null,
						},
				);
			const snapshot = { job, pages: exportPages, drafts: exportDrafts, revision: exportRevision };
			const contents =
				format === "txt" ? serializeTextExport(snapshot) : serializeJsonExport(snapshot);
			triggerDownload(
				exportFilename(job.filename, format),
				contents,
				format === "txt" ? "text/plain;charset=utf-8" : "application/json;charset=utf-8",
			);
			dispatch({ type: "export-downloaded", revision: exportRevision });
			setNotice("สร้างไฟล์ครบทุกหน้าแล้ว หากแก้ข้อความต่อ ระบบจะแจ้งว่ายังมีการแก้ไขที่ไม่ได้ดาวน์โหลด");
		} catch (error) {
			if (error instanceof OcrRequestError && error.status === 404) {
				setExpiredByExport(true);
				setOperationError("งานหมดอายุหรือถูกลบแล้ว จึงดึงผลครบทุกหน้าไม่ได้ คัดลอก draft ที่ยังอยู่ก่อนเริ่มใหม่");
			} else {
				setOperationError(`สร้างไฟล์ไม่สำเร็จ จึงยังไม่มีไฟล์ถูกดาวน์โหลด: ${errorMessage(error)}`);
			}
		} finally {
			setExporting(null);
		}
	}

	const pageDetailError = pageQuery.error;
	const canCopy =
		Object.hasOwn(session.drafts, session.selectedPage) || pageQuery.data?.status === "completed";
	const expiryCopy = useMemo(
		() => (expired ? "งานหมดอายุหรือถูกลบแล้ว ข้อความ draft ยังอยู่ในหน่วยความจำจนกว่าจะเริ่มใหม่" : null),
		[expired],
	);

	return (
		<div className="job-workspace">
			<div className="workspace-topline">
				<div>
					<p className="workspace-title">ผลการถอดข้อความ</p>
					<p className="workspace-subtitle">ตรวจ แก้ไข และดาวน์โหลดได้จากหน้านี้</p>
				</div>
				<div className="workspace-actions">
					{canCopy ? (
						<Button
							variant="secondary"
							className="secondary-button"
							type="button"
							onClick={() => void copyCurrentPage()}
						>
							คัดลอกหน้านี้
						</Button>
					) : null}
					<Button
						variant="ghost"
						className="text-button"
						type="button"
						onClick={() => void finishSession()}
						disabled={deleting}
					>
						{deleting ? "กำลังลบงาน…" : "เริ่มใหม่"}
					</Button>
				</div>
			</div>

			<ProgressPanel job={job} />

			{jobQuery.error && !expired ? (
				<div className="warning-callout" role="alert">
					<strong>ตรวจสถานะงานไม่ได้</strong>
					<p>{errorMessage(jobQuery.error)}</p>
					<button className="text-button" type="button" onClick={() => void jobQuery.refetch()}>
						ลองตรวจอีกครั้ง
					</button>
				</div>
			) : null}
			{expired ? (
				<div className="warning-callout" role="alert">
					<strong>งานหมดอายุหรือถูกลบแล้ว</strong>
					<p>{expiryCopy}</p>
				</div>
			) : null}
			{deleteError ? (
				<div className="error-callout" role="alert">
					<strong>ยืนยันการลบงานไม่ได้</strong>
					<p>{deleteError} ระบบจะลบงานตกค้างตามอายุที่กำหนด</p>
					<div className="inline-actions">
						<Button
							variant="secondary"
							className="secondary-button"
							type="button"
							onClick={() => void finishSession()}
							disabled={deleting}
						>
							ลองลบอีกครั้ง
						</Button>
						<Button
							className="text-button"
							variant="ghost"
							type="button"
							onClick={continueAfterDeleteFailure}
						>
							เริ่มใหม่ต่อ
						</Button>
					</div>
				</div>
			) : null}
			{operationError ? (
				<div className="error-callout" role="alert">
					<strong>ทำรายการไม่สำเร็จ</strong>
					<p>{operationError}</p>
				</div>
			) : null}
			{notice ? (
				<p className="success-message" role="status">
					{notice}
				</p>
			) : null}

			{terminal ? (
				expired && Object.keys(session.drafts).length > 0 ? (
					<section className="draft-recovery" aria-labelledby="draft-recovery-title">
						<div className="section-heading">
							<div>
								<h2 id="draft-recovery-title">กู้คืนข้อความที่แก้ไข</h2>
								<p>รายการหน้าจาก backend ใช้งานไม่ได้ แต่ draft ที่แก้ไว้ยังอยู่ในหน่วยความจำ</p>
							</div>
							<Button
								variant="secondary"
								className="secondary-button"
								type="button"
								onClick={() => void copyAllDrafts()}
							>
								คัดลอก draft ทั้งหมด
							</Button>
						</div>
						<ul className="draft-recovery-list">
							{Object.entries(session.drafts)
								.sort(([left], [right]) => Number(left) - Number(right))
								.map(([pageNumber, text]) => (
									<li key={pageNumber}>
										<div>
											<h3>หน้า {pageNumber}</h3>
											<pre>{text || "(ข้อความว่าง)"}</pre>
										</div>
										<Button
											variant="ghost"
											className="text-button"
											type="button"
											onClick={() => void copyText(text, `คัดลอก draft หน้า ${pageNumber} แล้ว`)}
										>
											คัดลอก draft หน้านี้
										</Button>
									</li>
								))}
						</ul>
					</section>
				) : pagesQuery.isPending ? (
					<div className="panel-message">กำลังโหลดรายการหน้า…</div>
				) : pagesQuery.error ? (
					<div className="error-callout" role="alert">
						<strong>โหลดรายการหน้าไม่ได้</strong>
						<p>{errorMessage(pagesQuery.error)}</p>
						<button className="text-button" type="button" onClick={() => void pagesQuery.refetch()}>
							ลองโหลดอีกครั้ง
						</button>
					</div>
				) : !pageIndexComplete ? (
					<div className="warning-callout" role="alert">
						<strong>รายการหน้ายังไม่ครบ</strong>
						<p>ระบบจะไม่สร้างไฟล์จนกว่าจะยืนยันผลครบตามจำนวนหน้าของงาน</p>
					</div>
				) : (
					<>
						<PageReview
							filename={job.filename}
							pages={pages}
							selectedPage={session.selectedPage}
							session={session}
							page={pageQuery.data}
							loading={pageQuery.isPending}
							error={pageDetailError}
							dispatch={dispatch}
							onExpire={() => setExpiredByExport(true)}
							onRetry={() => void pageQuery.refetch()}
						/>
						<section className="export-bar" aria-labelledby="export-title">
							<div>
								<h2 id="export-title">ดาวน์โหลดผล</h2>
								<p>
									{failedPages.length
										? `มี ${failedPages.length} หน้าที่ล้มเหลว ไฟล์จะทำเครื่องหมายไว้ทุกหน้า`
										: "ดึงผล OCR ของทุกหน้าที่สำเร็จก่อนสร้างไฟล์"}
								</p>
							</div>
							<div className="export-buttons">
								<Button
									variant="secondary"
									className="secondary-button"
									type="button"
									onClick={() => void download("txt")}
									disabled={!canExport || exporting !== null}
								>
									{exporting === "txt" ? "กำลังเตรียม TXT…" : "ดาวน์โหลด TXT"}
								</Button>
								<Button
									variant="primary"
									className="primary-button"
									type="button"
									onClick={() => void download("json")}
									disabled={!canExport || exporting !== null}
								>
									{exporting === "json" ? "กำลังเตรียม JSON…" : "ดาวน์โหลด JSON"}
								</Button>
							</div>
							<p className={`download-state${dirty ? " is-dirty" : ""}`}>
								{dirty ? "มีการแก้ไขที่ยังไม่ได้ดาวน์โหลด" : "ไม่มีการแก้ไขค้างดาวน์โหลด"}
							</p>
						</section>
					</>
				)
			) : (
				<div className="processing-note" role="status">
					<span className="spinner" aria-hidden="true" />
					<span>ระบบกำลังประมวลผล ความคืบหน้าจะอัปเดตอัตโนมัติ</span>
				</div>
			)}
		</div>
	);
}
