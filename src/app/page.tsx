import Link from "next/link";

export default function HomePage() {
	return (
		<div className="min-h-screen">
			<a className="skip-link" href="#main-content">
				ข้ามไปยังเนื้อหาหลัก
			</a>
			<div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
				<header className="flex min-h-[72px] items-center justify-between border-b border-[var(--border)]">
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
				</header>
				<main id="main-content" className="py-12 sm:py-16">
					<h1 className="max-w-[14ch] text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
						เริ่มจากเอกสารหนึ่งไฟล์
					</h1>
					<p className="mt-3 max-w-[68ch] text-[var(--text-secondary)]">
						อัปโหลดภาพหรือ PDF แล้วตรวจข้อความ OCR เทียบกับภาพต้นฉบับได้ทีละหน้า
					</p>
				</main>
			</div>
		</div>
	);
}
