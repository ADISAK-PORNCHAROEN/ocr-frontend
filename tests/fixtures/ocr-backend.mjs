import { createServer } from "node:http";

const server = createServer((request, response) => {
	if (request.url === "/health" && request.method === "GET") {
		response.writeHead(200, { "content-type": "application/json" });
		response.end(JSON.stringify({ status: "ok" }));
		return;
	}

	response.writeHead(501, { "content-type": "application/json" });
	response.end(
		JSON.stringify({
			error: { code: "FIXTURE_NOT_IMPLEMENTED", message: "Fixture route not implemented" },
		}),
	);
});

server.listen(4010, "127.0.0.1");
