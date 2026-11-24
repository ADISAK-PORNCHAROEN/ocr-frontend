# OCR render profile

Measured 2026-11-23 with the local Next.js development server and headless
Chromium at a 1440 × 1000 viewport. The backend fixture generated a synthetic
128-page job. A temporary React `Profiler` recorded `actualDuration` for the
progress panel and page review. Each run used a fresh browser page; five runs
were recorded before and after the targeted change. The polling sample contains
four progress-panel updates per run (20 samples). The edit sample is the
`PageReview` update after changing the selected page's textarea.

| React render | Before: median (range), n | After: median (range), n | Result |
| --- | ---: | ---: | --- |
| Progress panel during polling | 0.6 ms (0.5–0.9), 20 | 0.6 ms (0.3–1.0), 20 | No change that justifies tuning polling |
| Page review first mount, 128 pages | 31.7 ms (24.6–33.5), 5 | 31.2 ms (29.6–40.8), 5 | One-time list creation remains similar |
| Page review after editing text | 19.1 ms (17.2–20.8), 5 | 1.5 ms (1.4–11.6), 5 | Median reduced by 92.1% |

Typing previously caused the page selector to reconcile all 128 buttons on each
edit commit. The selector now uses `React.memo`; its `pages`, `selectedPage` and
reducer `dispatch` inputs stay unchanged while the user edits the current page.
The edit remains controlled and immediate. No dependency was added. The polling
path was left unchanged because its measured React render stayed below 1 ms.

The 128-page selector mount remains around 31 ms in this stress fixture. It is a
single mount after processing. The React sample is below 50 ms, but the browser
task and paint were not measured, so this does not establish that the full task
avoids a long task. The profile did not show repeated stalls that justify
virtualization's effect on keyboard navigation and page discovery. This is a
measured limitation rather than a claim that arbitrary-size jobs have constant
render cost. If real documents cause repeated stalls or long tasks, measure an
accessible virtualized selector as a separate change.

React `actualDuration` measures React render work, not network wait, OCR time,
browser paint, or end-to-end interaction latency. These are local development
measurements, not a production performance guarantee. The feature does not show
`ocr_duration_ms`; that API value is retained as a nullable/optional inference
duration and must not be labeled as total processing time.
