import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
	title: "OCR Playground | Paperflow",
	description: "ทดลอง OCR เอกสารและตรวจแก้ข้อความทีละหน้า",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="th">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
