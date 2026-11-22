import { forwardOcrRequest } from "@/lib/server/ocr-backend";

type RouteContext = { params: Promise<{ segments: string[] }> };

async function handle(request: Request, context: RouteContext) {
	const { segments } = await context.params;
	return forwardOcrRequest(request, segments);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
