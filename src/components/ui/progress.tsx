type ProgressProps = {
	value: number;
	label: string;
};

export function Progress({ value, label }: ProgressProps) {
	const safeValue = Math.max(0, Math.min(100, value));
	return (
		<div
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={safeValue}
			className="h-2.5 overflow-hidden rounded-full bg-[#e7e9f2]"
		>
			<div
				className="h-full rounded-full bg-[var(--action)] transition-[width] duration-300"
				style={{ width: `${safeValue}%` }}
			/>
		</div>
	);
}
