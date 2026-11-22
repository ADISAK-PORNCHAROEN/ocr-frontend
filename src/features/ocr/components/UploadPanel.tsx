"use client";

import { useRef, useState } from "react";
import type { OcrRequestError } from "../api/client";
import type { Capabilities } from "../api/schema";

type Props = {
	capabilities: Capabilities | undefined;
	capabilitiesError: boolean;
	uploading: boolean;
	uploadError: OcrRequestError | null;
	onUpload: (file: File) => void;
};

const fileTypes = new Map([
	[".jpg", "image/jpeg"],
	[".jpeg", "image/jpeg"],
	[".png", "image/png"],
	[".pdf", "application/pdf"],
]);

function formatBytes(bytes: number) {
	return bytes >= 1_048_576
		? `${(bytes / 1_048_576).toLocaleString("th-TH", { maximumFractionDigits: 1 })} MB`
		: `${Math.ceil(bytes / 1024).toLocaleString("th-TH")} KB`;
}

function resolveMediaType(file: File) {
	const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	const extensionType = fileTypes.get(extension);
	const fileType = file.type === "image/jpg" ? "image/jpeg" : file.type;
	if (!extensionType || (fileType && fileType !== extensionType)) return null;
	return extensionType;
}

export function UploadPanel({
	capabilities,
	capabilitiesError,
	uploading,
	uploadError,
	onUpload,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);

	function chooseFile(candidate: File | undefined) {
		if (!candidate) return;
		const mediaType = resolveMediaType(candidate);
		if (!mediaType || (capabilities && !capabilities.supported_media_types.includes(mediaType))) {
			setFile(null);
			setValidationError("รองรับเฉพาะไฟล์ JPG, PNG หรือ PDF เท่านั้น");
			return;
		}
		if (capabilities && candidate.size > capabilities.max_upload_bytes) {
			setFile(null);
			setValidationError(
				`ไฟล์มีขนาด ${formatBytes(candidate.size)} เกินขีดจำกัด ${formatBytes(capabilities.max_upload_bytes)}`,
			);
			return;
		}
		setFile(candidate);
		setValidationError(null);
	}

	function submit() {
		if (file && !validationError && !uploading) onUpload(file);
	}

	const uncertainUpload =
		uploadError &&
		["NETWORK_ERROR", "UPSTREAM_TIMEOUT", "BACKEND_UNAVAILABLE"].includes(uploadError.code);

	return (
		<section className="upload-layout" aria-labelledby="upload-title">
			<div className="upload-intro">
				<h2 id="upload-title">เริ่มจากเอกสารหนึ่งไฟล์</h2>
				<p>อัปโหลดภาพหรือ PDF แล้วตรวจข้อความ OCR เทียบกับภาพต้นฉบับได้ทีละหน้า</p>
				<div className="privacy-note">
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.7"
					>
						<path d="M12 3.5 19 6v5.1c0 4.2-2.9 7.4-7 9.4-4.1-2-7-5.2-7-9.4V6z" />
						<path d="m9 12 2 2 4-4" />
					</svg>
					<span>ไฟล์เก็บชั่วคราวตามอายุงาน และเริ่มใหม่ได้โดยไม่เก็บประวัติ</span>
				</div>
			</div>

			<div className="upload-card">
				<label
					className={`drop-zone${dragging ? " is-dragging" : ""}`}
					onDragEnter={(event) => {
						event.preventDefault();
						setDragging(true);
					}}
					onDragOver={(event) => event.preventDefault()}
					onDragLeave={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget as Node | null))
							setDragging(false);
					}}
					onDrop={(event) => {
						event.preventDefault();
						setDragging(false);
						chooseFile(event.dataTransfer.files[0]);
					}}
				>
					<input
						ref={inputRef}
						className="visually-hidden"
						type="file"
						accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
						aria-label="เลือกไฟล์ JPG, PNG หรือ PDF"
						onChange={(event) => chooseFile(event.currentTarget.files?.[0])}
						disabled={uploading}
					/>
					<span className="upload-mark" aria-hidden="true">
						<svg
							aria-hidden="true"
							viewBox="0 0 32 32"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.6"
						>
							<path d="M16 21V7m0 0-5 5m5-5 5 5M7.5 19v5.5h17V19" />
						</svg>
					</span>
					<span className="drop-title">ลากไฟล์มาวางที่นี่</span>
					<span className="drop-hint">หรือเลือกไฟล์จากอุปกรณ์</span>
					<span className="file-format-list">JPG · PNG · PDF</span>
				</label>

				{file ? (
					<div className="selected-file" aria-live="polite">
						<div className="selected-file-copy">
							<strong>{file.name}</strong>
							<span>{formatBytes(file.size)}</span>
						</div>
						<button
							className="text-button"
							type="button"
							onClick={() => setFile(null)}
							disabled={uploading}
						>
							นำไฟล์ออก
						</button>
					</div>
				) : null}

				{validationError ? (
					<p className="error-message" role="alert">
						{validationError}
					</p>
				) : null}
				{uploadError ? (
					<div className="error-callout" role="alert">
						<strong>{uncertainUpload ? "ยังยืนยันผลการส่งไม่ได้" : "ส่งไฟล์ไม่สำเร็จ"}</strong>
						<p>{uploadError.message}</p>
						{uncertainUpload ? <p>หากต้องการลองอีกครั้ง ให้กดส่งไฟล์นี้ด้วยตนเอง</p> : null}
					</div>
				) : null}

				{capabilities ? (
					<p className="limit-note">
						ไม่เกิน {formatBytes(capabilities.max_upload_bytes)} · สูงสุด{" "}
						{capabilities.max_pages.toLocaleString("th-TH")} หน้า
					</p>
				) : capabilitiesError ? (
					<p className="limit-note">ยังอ่านขีดจำกัดจาก backend ไม่ได้ ระบบจะตรวจไฟล์อีกครั้งเมื่อส่ง</p>
				) : null}

				<button
					className="primary-button upload-button"
					type="button"
					onClick={submit}
					disabled={!file || uploading}
				>
					{uploading ? <span className="spinner" aria-hidden="true" /> : null}
					{uploading ? "กำลังส่งไฟล์…" : uncertainUpload ? "ลองส่งไฟล์นี้อีกครั้ง" : "เริ่มถอดข้อความ"}
				</button>
			</div>
		</section>
	);
}
