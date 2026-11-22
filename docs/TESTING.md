# Testing

## Latest verification

The frontend checks ran locally on `develop` after application commit `4c180a1`.
They include the page-list reconnect/404 recovery regression. A later commit
removes the frontend GitHub Actions workflow and does not change application
code. The companion backend source was not changed by the frontend
implementation. Its working tree already had local changes, so these results
describe that local source snapshot rather than a published backend revision.
All documents used for the integration run were synthetic, and backend data
used an isolated temporary directory.

| Command | Result |
| --- | --- |
| `pnpm exec next typegen` | Passed. Generated route types for the CI type check. |
| `pnpm lint` | Passed. Biome checked 32 files. |
| `pnpm typecheck` | Passed. |
| `pnpm test:unit` | Passed. 10 tests across 2 files. |
| `pnpm test:e2e` | Passed. 17 Playwright scenarios. |
| `pnpm build` | Passed. `/` is static and `/api/ocr/[...segments]` is dynamic. |
| `pnpm audit --prod` | No known production dependency vulnerabilities. |
| From the backend repository, `.venv\Scripts\python.exe -m pytest` | Passed. 36 tests passed and 3 were skipped. |

The Playwright suite runs the Next.js app against a local HTTP backend fixture.
It covers multipart and binary forwarding, upload uncertainty, status polling,
stale requests, page selection, blank and failed pages, editing, restore, copy,
complete and partial exports, expiry, delete recovery, keyboard use, and mobile
layout. One regression edits two pages, triggers a page-list 404 on reconnect,
then verifies both drafts can be copied together and no complete export is
offered. Playwright writes transient output under the ignored `test-results/`
directory.

## Real backend integration

A local FastAPI backend and the Next.js BFF ran on loopback with isolated
storage. The browser uploaded a synthetic two-page PDF and a synthetic PNG. The
PDF job completed with two pages and returned the expected Thai and English
fixture text. The PNG returned its expected OCR text. Both page-image routes
returned `200 image/png`. TXT and JSON exports included both pages; JSON kept
edited text separate from original OCR data and included line coordinates.
DELETE returned `204`, and a later job read returned `404`.

The backend capabilities response reported a 20 MiB upload limit and a 20-page
limit. The backend rejected malformed PDF bytes with `415`, an encrypted PDF
with `422`, a 21-page PDF with `422`, and a file one byte above the upload limit
with `413`. These are checks of the local backend snapshot, not a promise about
other environments.

The expiry run used a 60-second job TTL and a 5-second cleanup interval. After
expiry, the job returned `404` and its temporary storage directory was empty.
The browser kept the in-memory drafts available to copy and prevented a
complete export after expiry.

## Limits

The integration inputs were synthetic. They verify the current API contract
and exercise OCR output, but they do not measure recognition accuracy on real
documents. The run does not verify production deployment settings, multi-user
access, persistent storage, or production retention policy. Playwright reports
and backend temporary data stay local. The synthetic UI captures are stored in
`docs/design/implemented-desktop.png` and
`docs/design/implemented-mobile.png`.
