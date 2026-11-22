import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label: string;
	labelHint?: string;
};

export function Textarea({ label, labelHint, id, className = "", ...props }: TextareaProps) {
	const inputId = id ?? `textarea-${label.toLocaleLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-")}`;
	return (
		<div className="space-y-2">
			<div className="flex items-baseline justify-between gap-3">
				<label className="font-semibold text-[var(--text-primary)]" htmlFor={inputId}>
					{label}
				</label>
				{labelHint ? (
					<span className="text-xs text-[var(--text-secondary)]">{labelHint}</span>
				) : null}
			</div>
			<textarea
				id={inputId}
				className={`min-h-64 w-full resize-y rounded-[10px] border border-[var(--border)] bg-white p-4 leading-7 text-[var(--text-primary)] placeholder:text-[#687390] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6385bd] ${className}`}
				{...props}
			/>
		</div>
	);
}
