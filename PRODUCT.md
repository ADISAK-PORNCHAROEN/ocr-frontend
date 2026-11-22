# OCR Playground product

## Evidence and status

| Type | Evidence |
| --- | --- |
| Owner-approved direction | [Frontend plan](docs/frontend-plan.md) and the design conversation: local-first portfolio demo, Next.js, mobile support and Thai UI first. |
| Source observation | Upload, progress, page review/edit, copy/restore, export, delete/expiry and the BFF are implemented on `develop`. Local checks and a browser upload/export/delete run against the companion backend passed. |
| Pending confirmation | Public deployment, multiple users, persistence and production retention remain out of scope. The backend API and limits are owned by the [backend repository](https://github.com/ADISAK-PORNCHAROEN/ocr-backend); feature work is tracked in [frontend issues](https://github.com/ADISAK-PORNCHAROEN/ocr-frontend/issues). |

## Users and purpose

A person experimenting with Thai and English printed-document OCR on their own machine needs to inspect the source image, correct the extracted text and export the result.

## Critical journeys

| Journey | Trigger | Desired observable success | Failure and recovery |
| --- | --- | --- | --- |
| Submit | Select one JPG, PNG or PDF | The user sees the job status and page progress. | Explain file or connection errors; uncertain uploads require a user-initiated retry. |
| Review and edit | Processing reaches a terminal state | Show image and editable text by page, preserving edits while switching pages. | Distinguish a successful blank page from a failed page. |
| Export | Choose TXT or JSON | Export all pages, including failed-page indicators, after fetching all successful results. | Warn for partial results; do not export when a successful page result could not be fetched. |
| Finish | Start again or end | Warn before losing edits and request deletion of temporary job data. | Offer deletion retry or continue; local expiry cleanup is verified, while production retention is out of scope. |
| Expiry | Backend no longer has the job | The user can copy edits still held in browser memory before restarting. | Disable an export whose completeness cannot be established. |

## Scope and constraints

The first version supports one file at a time, multi-page PDF, in-memory edits, copy, per-page restore, and TXT/JSON export. Refreshing or closing starts a new session. OCR boxes, confidence display, accounts, persistent history, selected-page processing, page-only retry/cancellation, password-protected PDFs and table-preserving OCR Markdown are out of scope. Public deployment is not a first-version goal.

The local integration run confirmed the current backend file and page limits, OCR result format, deletion, and expiry behavior. It used synthetic documents and does not measure accuracy on real documents or establish production retention settings. See [the verification record](docs/TESTING.md).

## Acceptance examples

- A successful page with no OCR text remains editable and is not shown as a failed page.
- An edit intentionally reduced to an empty string survives switching pages during the session.
- After download, a new edit is treated as undownloaded and prompts before discarding.
- Before exporting, all successful pages are fetched, including pages not previously viewed; a fetch failure prevents an incomplete export.
