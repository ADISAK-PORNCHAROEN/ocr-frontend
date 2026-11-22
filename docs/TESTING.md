# Testing

Status: accepted testing strategy; the application and test harness are being
scaffolded on `develop`. No test run or coverage baseline exists yet.

## Selection and evidence

Prefer assertions on behavior visible to a user or caller, using the highest
practical boundary. Issue #3 and the user request accept the browser UI through
the Next.js BFF to a controllable HTTP backend fixture as the primary seam.
Use Vitest, React Testing Library and Playwright. Use focused tests for export
composition and boundary validation where they add meaningful coverage. Test
critical flows against the real backend only after its current source runs and
its response schema is verified.

Cover upload validation and uncertain submission, queued/processing/terminal states and polling termination, image and page selection, blank and failed pages, edits across pages including an intentional empty edit, copy/restore, partial and incomplete downloads, expiry, deletion failure, stale responses, and keyboard/mobile use. Verify multipart and binary image forwarding across the BFF.

Fixtures must use isolated temporary data with bounded setup and cleanup, never
real user documents or production resources. Coverage scope, thresholds,
target browsers and artifact retention are not configured. Record the actual
command, revision and dirty scope, outcome, report path and limitations for
each verification run. Test availability is not evidence of a passing run.
