type WorkflowStage = "upload" | "review" | "export";

const steps: { id: WorkflowStage; label: string }[] = [
	{ id: "upload", label: "เลือกเอกสาร" },
	{ id: "review", label: "ตรวจข้อความ" },
	{ id: "export", label: "นำผลออก" },
];

export function WorkflowSteps({ active }: { active: WorkflowStage }) {
	const activeIndex = steps.findIndex((step) => step.id === active);
	return (
		<ol aria-label="ขั้นตอนการใช้งาน" className="grid grid-cols-3 gap-2 sm:gap-4">
			{steps.map((step, index) => {
				const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming";
				return (
					<li
						key={step.id}
						aria-current={state === "active" ? "step" : undefined}
						className={`flex min-h-[58px] items-center gap-2 border-t-2 px-1 pt-2 text-xs sm:gap-3 sm:text-sm ${
							state === "active"
								? "border-[var(--action)] font-bold text-[var(--text-primary)]"
								: state === "done"
									? "border-[var(--success)] font-semibold text-[var(--success)]"
									: "border-[#d8dceb] text-[var(--text-secondary)]"
						}`}
					>
						<span
							aria-hidden="true"
							className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${
								state === "active"
									? "bg-[var(--action)] text-white"
									: state === "done"
										? "bg-[var(--success-ground)] text-[var(--success)]"
										: "bg-[#e9ebf3] text-[var(--text-secondary)]"
							}`}
						>
							{state === "done" ? "✓" : index + 1}
						</span>
						{step.label}
					</li>
				);
			})}
		</ol>
	);
}
