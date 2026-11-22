# Testing

Status: proposed testing strategy; there is no application manifest, test configuration, test command, suite or coverage baseline in this repository yet. Install and configure tools only as part of the relevant implementation work.

## Selection and evidence

Prefer assertions on behavior visible to a user or caller, using the highest practical boundary. The proposed primary seam is browser UI through the Next.js BFF to a controllable HTTP backend fixture; this seam remains subject to owner confirmation. Proposed tools are Vitest, React Testing Library and Playwright. Use focused tests for export composition and boundary validation where they add meaningful coverage, then exercise critical flows with the real backend once available.

Cover upload validation and uncertain submission, queued/processing/terminal states and polling termination, image and page selection, blank and failed pages, edits across pages including an intentional empty edit, copy/restore, partial and incomplete downloads, expiry, deletion failure, stale responses, and keyboard/mobile use. Verify multipart and binary image forwarding across the BFF.

Fixtures must use isolated temporary data with bounded setup and cleanup, never real user documents or production resources. The project owner must choose coverage scope, thresholds, target browsers and artifact retention once the implementation and tooling exist. Record actual command, revision/dirty scope, outcome, report path and limitations for each verification run; test availability is not evidence of a passing run.
