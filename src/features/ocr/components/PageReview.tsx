"use client";

import Image from "next/image";
import type { Dispatch } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OcrRequestError } from "../api/client";
import type { PageDetail, PageSummary } from "../api/schema";
import { type OcrSession, pageDraft, type SessionAction } from "../session/session";

type Props = {
	filename: string;
	pages: PageSummary[];
	selectedPage: number;
	session: OcrSession;
	page: PageDetail | undefined;
	loading: boolean;
	error: unknown;
	dispatch: Dispatch<SessionAction>;
	onExpire: () => void;
	onRetry: () => void;
};

function pageLabel(page: PageSummary) {
	if (page.status === "failed") return "ล้มเหลว";
	if (page.status === "pending") return "รอคิว";
	if (page.status === "processing") return "กำลังทำ";
	return page.hasText ? "สำเร็จ" : "หน้าว่าง";
}

function PageImage({
	imageUrl,
	filename,
	pageNumber,
}: {
	imageUrl: string;
	filename: string;
	pageNumber: number;
}) {
	const [unavailable, setUnavailable] = useState(false);
	if (unavailable) {
		return (
			<div className="image-unavailable" role="status">
				โหลดภาพหน้านี้ไม่ได้
			</div>
		);
	}
	return (
		<Image
			className="page-image"
			src={imageUrl}
			alt={`ภาพต้นฉบับ ${filename} หน้า ${pageNumber}`}
			fill
			sizes="(max-width: 780px) 100vw, 50vw"
			unoptimized
			loading="lazy"
			decoding="async"
			onError={() => setUnavailable(true)}
		/>
	);
}

export function PageReview({
	filename,
	pages,
	selectedPage,
	session,
	page,
	loading,
	error,
	dispatch,
	onExpire,
	onRetry,
}: Props) {
	const summary = pages.find((item) => item.number === selectedPage);
	const pageError = error instanceof OcrRequestError ? error : null;

	return (
		<section className="review-section" aria-labelledby="review-title">
			<div className="section-heading">
				<div>
					<h2 id="review-title">ตรวจผลทีละหน้า</h2>
					<p>เลือกหน้าเพื่อเทียบภาพต้นฉบับกับข้อความที่ถอดได้</p>
				</div>
				<span className="page-count">{pages.length} หน้า</span>
			</div>

			<nav className="page-strip" aria-label="เลือกหน้าเอกสาร">
				{pages.map((item) => (
					<button
						key={item.number}
						type="button"
						className={`page-tab${selectedPage === item.number ? " is-selected" : ""}`}
						aria-pressed={selectedPage === item.number}
						onClick={() => dispatch({ type: "select-page", pageNumber: item.number })}
					>
						<span>หน้า {item.number}</span>
						<span className={`page-state page-state-${item.status}`}>
							<span className="state-symbol" aria-hidden="true">
								{item.status === "failed" ? "!" : item.hasText === false ? "–" : "✓"}
							</span>
							{pageLabel(item)}
						</span>
					</button>
				))}
			</nav>

			{!summary ? (
				<div className="empty-state" role="status">
					ยังไม่มีข้อมูลหน้าสำหรับตรวจ
				</div>
			) : (
				<div className="review-grid">
					<section className="document-panel" aria-label={`ภาพต้นฉบับหน้า ${selectedPage}`}>
						<div className="panel-title-row">
							<h3>ภาพต้นฉบับ</h3>
							<span>หน้า {selectedPage}</span>
						</div>
						<div className="document-canvas">
							{summary.status === "pending" || summary.status === "processing" ? (
								<p className="panel-message">ภาพจะแสดงหลังประมวลผลหน้านี้</p>
							) : (
								<PageImage
									key={summary.imageUrl}
									imageUrl={summary.imageUrl}
									filename={filename}
									pageNumber={selectedPage}
								/>
							)}
						</div>
					</section>

					<section className="text-panel" aria-label={`ผล OCR หน้า ${selectedPage}`}>
						<div className="panel-title-row">
							<div>
								<h3>ข้อความ OCR</h3>
								<p>
									{summary.status === "completed" && !summary.hasText
										? "ไม่พบข้อความในหน้านี้"
										: "ตรวจและแก้ข้อความได้"}
								</p>
							</div>
							{page?.status === "completed" ? (
								<span className="confidence-note">ผลเดิม {page.lines?.length ?? 0} บรรทัด</span>
							) : null}
						</div>

						{summary.status === "failed" ? (
							<div className="failure-state" role="alert">
								<strong>หน้านี้ถอดข้อความไม่สำเร็จ</strong>
								<p>{summary.error?.message ?? "ไม่พบรายละเอียดข้อผิดพลาด"}</p>
							</div>
						) : summary.status === "pending" || summary.status === "processing" ? (
							<div className="panel-message" role="status">
								รอผลจากหน้านี้
							</div>
						) : loading ? (
							<div className="panel-message" role="status">
								กำลังโหลดผล OCR…
							</div>
						) : pageError?.status === 404 ? (
							<div className="failure-state" role="alert">
								<strong>งานหมดอายุหรือถูกลบแล้ว</strong>
								<p>คัดลอกข้อความที่ยังอยู่ในหน่วยความจำได้ก่อนเริ่มใหม่</p>
								<button className="text-button" type="button" onClick={onExpire}>
									แสดงตัวเลือกเริ่มใหม่
								</button>
							</div>
						) : pageError ? (
							<div className="failure-state" role="alert">
								<strong>โหลดผลหน้านี้ไม่ได้</strong>
								<p>{pageError.message}</p>
								<button className="text-button" type="button" onClick={onRetry}>
									ลองโหลดอีกครั้ง
								</button>
							</div>
						) : page?.status === "completed" ? (
							<>
								<Textarea
									id="ocr-text"
									label="ข้อความที่แก้ไข"
									className="ocr-editor"
									value={pageDraft(session, selectedPage, page.originalText ?? "")}
									onChange={(event) =>
										dispatch({
											type: "edit-page",
											pageNumber: selectedPage,
											text: event.currentTarget.value,
										})
									}
								/>
								<div className="editor-actions">
									<Button
										variant="secondary"
										className="secondary-button"
										type="button"
										disabled={!Object.hasOwn(session.drafts, selectedPage)}
										onClick={() => {
											if (window.confirm("คืนข้อความหน้านี้เป็นผล OCR เดิมหรือไม่?")) {
												dispatch({ type: "restore-page", pageNumber: selectedPage });
											}
										}}
									>
										คืนค่าผล OCR
									</Button>
									<span className="editor-hint">ผล OCR เดิมยังแยกเก็บจากข้อความนี้</span>
								</div>
							</>
						) : (
							<div className="panel-message" role="status">
								ยังไม่มีผลข้อความสำหรับหน้านี้
							</div>
						)}
					</section>
				</div>
			)}
		</section>
	);
}
