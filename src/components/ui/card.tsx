import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
	return (
		<section
			className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_5px_24px_rgba(37,47,75,0.045)] ${className}`}
			{...props}
		/>
	);
}
