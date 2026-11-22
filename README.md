# OCR Playground

Next.js frontend for reviewing OCR results. Issue #3 is the product specification.

## Run the app

Use Node.js 20.9 or newer and pnpm 11.25.0.

1. Run `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `OCR_BACKEND_URL` to the local OCR service.
3. Run `pnpm dev` and open `http://127.0.0.1:3000`.

The frontend sends OCR requests through Next.js Route Handlers. Do not expose the backend URL to browser code.

## Check the app

- `pnpm lint` runs Biome checks.
- `pnpm typecheck` checks TypeScript.
- `pnpm test:unit` runs Vitest.
- `pnpm test:e2e` runs Playwright against the local HTTP fixture.
- `pnpm build` creates a production build.

The local HTTP fixture models the backend contract for frontend tests. It does not run OCR or verify the separate backend.
