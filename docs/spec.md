# OCR Playground frontend specification

## Problem Statement

ผู้ใช้ต้องการทดลอง OCR เอกสารภาษาไทยและอังกฤษบนเครื่อง ดูผลแต่ละหน้าคู่กับภาพ แก้ไขและนำผลออกได้ โดยเข้าใจความคืบหน้าและข้อผิดพลาด แม้บางหน้าประมวลผลไม่สำเร็จ

## Solution

เว็บภาษาไทยที่รองรับเดสก์ท็อปและมือถือ ให้ผู้ใช้อัปโหลดไฟล์หนึ่งไฟล์ รอผล OCR ตรวจและแก้ไขข้อความแต่ละหน้า แล้วคัดลอกหรือดาวน์โหลดผล ก่อนลบข้อมูลชั่วคราวเมื่อจบงาน

## User Stories

1. As a user, I want to understand the tool on its home page, so that I can start without navigating elsewhere.
2. As a user, I want to upload one JPG, PNG, or PDF, so that I can process my document.
3. As a user, I want unsupported files and backend validation errors explained, so that I can correct my input.
4. As a user, I want to see queued and processing status with page progress, so that I know the job is running.
5. As a user, I want upload uncertainty explained and manual retry, so that I can decide whether to submit again.
6. As a user, I want to see the completed job after processing ends, so that I can inspect results.
7. As a user, I want to select pages and see each original image with its OCR text, so that I can compare them.
8. As a user, I want to distinguish a successful blank page from a failed page, so that I understand the outcome.
9. As a user, I want to add text to a blank page, so that I can complete the document.
10. As a user, I want to edit text per page and keep edits while switching pages, so that I do not lose work.
11. As a user, I want to erase all text on a page, so that an intentionally empty edit is preserved.
12. As a user, I want to copy the current text, so that I can reuse it elsewhere.
13. As a user, I want to confirm before restoring original OCR text, so that I do not lose edits accidentally.
14. As a user, I want partial and complete failures explained, so that I can decide whether to upload again.
15. As a user, I want to download all pages as TXT, including page numbers and failed-page notices, so that I can read the complete outcome.
16. As a user, I want JSON with edited text and separate original OCR data, so that I can distinguish my changes from the model output.
17. As a user, I want a warning before downloading a partial result, so that I know it is incomplete.
18. As a user, I want downloads to stop if successful page results cannot all be fetched, so that I do not unknowingly receive missing data.
19. As a user, I want a warning when leaving with edits since my last download, so that I can avoid losing work.
20. As a user, I want to copy in-memory edits when a job expires, so that I can recover text before starting again.
21. As a user, I want to confirm before discarding undownloaded edits, so that I can return and download them.
22. As a user, I want to end or restart a job and delete temporary data, so that I can control my session.
23. As a user, I want retry and continue choices if deletion fails, so that I understand the remaining temporary data.
24. As a mobile or keyboard user, I want the complete flow accessible on my device, so that I can use the tool comfortably.
25. As a user, I want edits to exist only during my current session, so that refreshing or closing starts over.

## Implementation Decisions

- Use Next.js App Router, React, TypeScript and Tailwind CSS; use project-owned reusable accessible UI primitives, without shadcn/ui initially. The owner selected the Paperflow (concept C) visual direction for desktop and mobile.
- A thin Next.js BFF forwards browser requests to the separate OCR backend, preserving the backend contract and reporting connection errors. Test multipart and binary forwarding, timeouts and cancellation.
- TanStack Query owns backend data and polling; an OCR session owns current page and in-memory edits. Original OCR data remains unchanged. Ignore stale async results from older jobs.
- Validate external API responses at the boundary; use native fetch and Zod. Keep backend wire details behind the OCR API boundary.
- Wait for a terminal job status before editing. Poll while queued or processing and stop at completed, partially completed or failed.
- Keep successful blank pages distinct from failed pages; preserve intentional empty edits. Restore requires confirmation.
- Download fetches every successful page before composing TXT or JSON. JSON preserves original OCR lines, confidence and coordinates separately from edited text.
- Warn about undownloaded edits before restarting, ending or browser navigation where supported. Expiry retains the option to copy in-memory edits; it prevents a completeness-guaranteed export.
- Do not automatically retry an upload whose outcome is unknown. Backend expiry cleanup is necessary because closing a tab and failed DELETE cannot guarantee cleanup.
- Show and enforce file/page limits only once backend values and their source are agreed. Backend remains authoritative for file validation.

## Testing Decisions

- Prefer externally observable user behavior over component internals; use the browser UI and a controllable HTTP backend fixture as the primary seam. Test the BFF against that fixture, including multipart and image responses; repeat critical flows against the real backend once available.
- Exercise upload, polling termination, page navigation, edit/restore/copy, successful blank and failed pages, partial results, exports, expiry, deletion failure, stale responses, and keyboard/mobile behavior. Use focused tests for export data and boundary validation where useful.
- The frontend has no existing application or test suite; there is no local test prior art. Use Vitest, React Testing Library and Playwright as the proposed tools.

## Out of Scope

Accounts, persistent history or drafts, multiple-file upload, processing selected pages, page-specific retry/cancellation, OCR boxes or confidence on screen, password-protected PDF support, table-preserving OCR Markdown, and public deployment in the first version.

## Further Notes

The backend API is proposed and not implemented. Confirm limits, expiry, error/status shapes, OCR format, coordinate/image alignment, cleanup behavior and actual integration before treating the contract as final. Review the agreed frontend plan and domain glossary for context.
