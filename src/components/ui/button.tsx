import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary" | "ghost" | "danger";
	fullWidth?: boolean;
};

const variants = {
	primary: "bg-[var(--action)] text-white hover:bg-[var(--action-hover)] disabled:bg-[#96a5c2]",
	secondary: "border border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[#f7f8fc]",
	ghost: "text-[var(--text-secondary)] hover:bg-[#eef0f8]",
	danger: "bg-[var(--error)] text-white hover:bg-[#71333d]",
};

export function Button({
	variant = "primary",
	fullWidth = false,
	className = "",
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-75 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
			type={type}
			{...props}
		/>
	);
}
