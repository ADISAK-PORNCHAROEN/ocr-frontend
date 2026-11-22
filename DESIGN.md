# OCR Playground design system

## Overview

**Selected direction: Paperflow (concept C)**, chosen by the owner on 2026-11-22. It balances a clear OCR workspace with a distinctive but quiet portfolio presentation. The [standalone concept](docs/design/concept-c.html) and its [desktop](docs/design/concept-c-desktop.png) and [mobile](docs/design/concept-c-mobile.png) captures are the visual reference; they are illustrative, not a functioning OCR application. No production UI exists yet.

The first screen starts the upload immediately. A three-step indicator makes upload, processing and review legible; the review workspace keeps the page image and editable OCR text together and shows page outcomes without relying on color alone.

## Colors

The chosen concept's starting tokens are below. Validate contrast and state usage in the implemented UI before finalizing them.

| Role | Value |
| --- | --- |
| Page ground | `#f1f2fa` |
| Surface / document paper | `#ffffff` / `#fffefb` |
| Primary text / secondary text | `#252f4b` / `#495675` |
| Primary / hover | `#385e98` / `#2c4e83` |
| Border | `#d8dceb` |
| Success / success ground | `#34644f` / `#e9f3ed` |
| Warning / warning ground | `#79501c` / `#fbf3e5` |
| Error / error ground | `#8b404c` / `#f8ecee` |

## Typography

Use a readable Thai/English sans-serif throughout. The mockup uses `Leelawadee UI`, `Tahoma`, `Noto Sans Thai`, `Segoe UI`, then sans-serif; production font availability and licensing remain to be decided. The reference uses a 15px body with 1.55 line height and a 29–39px main heading. Test Thai wrapping and real OCR content rather than treating the sample receipt as a type specimen.

## Layout

At desktop widths, use a centered shell up to 1440px with 40px side padding in the reference. The upload introduction and drop zone sit side by side; the completed workspace puts the document image and editable text in equal columns. Page thumbnails appear above the workspace, with selected, blank and failed states labeled.

### Mobile and accessibility

At 780px and below, stack upload content and the image/text panels; allow the page strip to scroll horizontally. At 520px and below, the reference uses 14px side padding. Captures at 1440px and 500px illustrate the direction; validate narrower viewports, text zoom, touch targets, focus, contrast and reduced motion during implementation. Use accessible labels, keyboard-operable controls and non-color status text.

## Elevation, shapes and components

White surfaces, soft lavender grounds and light borders establish hierarchy; reserve shadows for the document preview. The reference uses 14px panel radii, 10px button radii and small pill-shaped status markers. Build project-owned reusable primitives such as button, input, select, textarea, dialog and progress as needed; OCR-specific upload, page selector, viewer and editor compose them.

## States and acceptance

Design and implement upload, queued, processing, completed, partial failure, failed, successful blank page, expiry and recovery. A failed page must never appear as a successful blank page. Preserve in-memory edits across page changes; require confirmation before restore or discarding undownloaded edits; retain the ability to copy edits after expiry. See [product requirements](PRODUCT.md) and [frontend plan](docs/frontend-plan.md) for full behavior.

The mockup combines different workflow states in one page to show the design. In the actual app, show the correct state at the correct time. File limits, retention and backend responses are not confirmed by the mockup. Verify desktop and mobile against real implementation and accessible interaction states before treating this as production-ready.
