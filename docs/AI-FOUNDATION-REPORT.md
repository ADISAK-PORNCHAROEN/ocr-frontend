# AI Foundation setup report

Status: **setup reviewed with limitations below**. Base `65de4da`. This report distinguishes planned architecture from observed implementation; the frontend has no application or native test suite yet.

## Scope and decisions

Normal project-local Foundation setup, preserving owner-approved OCR product direction and pstack model choices. User separately requested Graphify CLI and a repository Git `post-commit` update hook. User also requires small reviewable commits, a branch, and a PR for changes merged into main. See [delivery list](agents/document-delivery.md), [skill checklist](agents/skills-checklist.md), and [foundation manifest](agents/foundation.json).

## Deliverables and package evidence

The root guide routes product, architecture, UI, testing, security, Graphify and explicitly requested hook work; the Claude bridge contains only `@AGENTS.md`. Product, domain, design, architecture, testing and security documents describe current evidence and unresolved decisions. The previous guide is archived with a SHA-256 receipt in the history index and manifest.

Five standard project-local skill folders were copied from the Foundation bundle: test-engineering, security-review, graphify, hook-management and impeccable. Recursive source/destination inventory counts are respectively 2/2, 2/2, 12/12, 2/2 and 64/64; no missing or added entries. Testing and security reference contracts contain explicitly recorded project-specific adaptations; their installed fingerprints differ from the source snapshots. Full fingerprints are in the [checklist](agents/skills-checklist.md). The installed Impeccable package retains five upstream JavaScript support files and licenses. Inventory proves file identity, not runtime discovery or host invocation. A fresh reviewer session observed all five project-local entries in the host skill catalog; actual workflow invocation remains unverified.

## Review and verification

- Required document and skill delivery paths are listed individually in the [delivery list](agents/document-delivery.md). An independent agent reviewed documents, routes and package inventories against the accepted plan and Foundation contract; two generic review contracts were adapted and two inventory record inconsistencies corrected. The archived original guide's Git blob matches its recorded SHA-256.
- A recursive scan of relative Markdown links within installed skill packages found no missing candidates; declared skill names and required resource paths match the bundled manifest. Further behavioral invocation has not been observed.
- Graphify CLI 0.9.80 is installed in the repository's `.git` virtual environment. Git reports only post-commit installed; actual commits launched asynchronous rebuilds and produced a local graph. The graph covers code extraction, including bundled skill scripts, not semantic Markdown content. The hook and environment are local to this checkout and are not shared by the PR. Setup and verification instructions are in [Graphify hook](agents/graphify-hook.md).
- An independent manual security review of the local hook found and reproduced Python import shadowing from the repository root; isolated Python mode was added to the hook. The bundled Impeccable executable resources were inspected within a limited scope, not fully audited; the separate engine and localhost server were not exercised. No application security scan ran.
- No frontend application tests, build, coverage or visual checks ran: none are configured or applicable to the current documentation-only product state. Hook-specific checks are reported separately when available.
- No backend implementation or contract verification was observed. File/page limits, expiry and cleanup, OCR results and image alignment remain open.
- No GitHub issue was published in this setup; the existing spec and ticket drafts await owner approval of the test seam and breakdown.

## Trace and next actions

The agreed upload → status → edit → export → delete journey is recorded in `PRODUCT.md` and `docs/frontend-plan.md`; `docs/ARCHITECTURE.md` describes intended boundaries and `docs/TESTING.md` proposes behavioral verification. There is no implementation or actual run to trace yet. Next: open a PR containing small commits; obtain the pending approval before publishing tickets; design UX/UI and implement the frontend in later work.
