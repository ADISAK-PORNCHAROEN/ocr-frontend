import Link from "next/link";
import { OcrWorkspace } from "@/features/ocr/components/OcrWorkspace";

export default function HomePage() {
	return (
		<div className="min-h-screen">
			<a className="skip-link" href="#main-content">
				ข้ามไปยังเนื้อหาหลัก
			</a>
			<div className="mx-auto max-w-[1440px] px-[14px] sm:px-6 lg:px-10">
				<header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-[var(--border)]">
					<Link
						className="flex min-h-11 items-center gap-3 font-semibold text-[var(--text-primary)]"
						href="/"
					>
						<span
							aria-hidden="true"
							className="grid size-10 place-items-center rounded-xl bg-[#dfe4f6] text-[var(--action)]"
						>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								className="size-5"
								stroke="currentColor"
								strokeWidth="1.7"
							>
								<path d="M7 3.75h7l4 4V20.25H7z" />
								<path d="M14 3.75v4h4M9.5 12h6M9.5 15.5h6" />
							</svg>
						</span>
						<span>OCR Playground</span>
					</Link>
					<p className="hidden rounded-full border border-[var(--border)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] sm:block">
						พื้นที่ทำงานชั่วคราว
					</p>
				</header>
				<OcrWorkspace />
			</div>
		</div>
	);
}
