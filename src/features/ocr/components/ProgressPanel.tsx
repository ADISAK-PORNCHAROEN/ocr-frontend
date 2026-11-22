import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Job } from "../api/schema";

const labels: Record<Job["status"], string> = {
	queued: "อยู่ในคิว",
	processing: "กำลังอ่านข้อความ",
	completed: "อ่านข้อความครบแล้ว",
	partially_completed: "เสร็จบางหน้า",
	failed: "งานไม่สำเร็จ",
};

export function ProgressPanel({ job }: { job: Job }) {
	const total = job.progress.totalPages;
	const processed = job.progress.processedPages;
	const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
	const active = job.status === "queued" || job.status === "processing";

	return (
		<Card className="progress-panel" aria-label="ความคืบหน้าของงาน OCR" aria-live="polite">
			<div className="progress-heading">
				<div>
					<p className="file-name">{job.filename}</p>
					<p className="progress-status">{labels[job.status]}</p>
				</div>
				<span className={`status-pill status-${job.status}`}>
					{active ? <span className="status-dot" aria-hidden="true" /> : null}
					{labels[job.status]}
				</span>
			</div>
			<Progress value={percent} label="หน้าที่ประมวลผลแล้ว" />
			<div className="progress-details">
				<span>{total > 0 ? `${processed} จาก ${total} หน้า` : "กำลังตรวจเอกสาร"}</span>
				<span>
					{job.progress.completedPages} สำเร็จ · {job.progress.failedPages} ล้มเหลว
					{job.progress.processingPages > 0 ? ` · ${job.progress.processingPages} กำลังทำ` : ""}
				</span>
			</div>
		</Card>
	);
}
