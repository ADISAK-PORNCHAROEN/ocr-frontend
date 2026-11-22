import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	workers: 1,
	reporter: "list",
	outputDir: "test-results",
	use: {
		baseURL: "http://127.0.0.1:3001",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	webServer: [
		{
			command: "pnpm fixture",
			url: "http://127.0.0.1:4010/health",
			reuseExistingServer: false,
			timeout: 30_000,
		},
		{
			command: "pnpm dev:e2e",
			url: "http://127.0.0.1:3001",
			reuseExistingServer: false,
			timeout: 120_000,
		},
	],
});
