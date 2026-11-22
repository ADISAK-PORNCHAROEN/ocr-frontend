# OCR Playground Agent Guide

OCR Playground is a local-first web interface for OCR jobs. The upload, progress, page review, editing, export, lifecycle and BFF flows are implemented on `develop`. The browser suite and a local integration through the companion backend have been run. Keep this a local-first demo unless the security model is revised.

## Working agreements

- Make small, coherent commits that each represent a reviewable change. Use a branch and open a pull request for every change merged into `main`.
- Preserve existing work, and keep secrets and user documents out of Git. Do not invent backend behavior or unapproved product decisions.
- For pstack roles in this project, override user-level settings. In Codex pass model and reasoning effort separately: `gpt-6-luna` with `xhigh` for feature, refactoring, bug-fix, perf-issue, hillclimb, reflect tooling, swarm workers, arena runners and architect runners; `gpt-6-luna` with `max` for hardest tasks; `gpt-6.1-sol` with `medium` for judgment and prose, how explorer, how explainer, why investigators, why synthesizer, reflect judgment, divergent, synthesizer, arena cross-judge pool and interrogate reviewers. Panel lists contain one entry each. Ask before substituting an unavailable model or effort.

## Find the source

- For relevant codebase or content discovery, use `.agents/skills/graphify/SKILL.md` when its CLI is available. Check graph freshness and confirm findings against source; if unavailable, report the gap and use targeted search.
- The accepted behavior is in `docs/frontend-plan.md` and `docs/spec.md`; the backend contract is owned by `ADISAK-PORNCHAROEN/ocr-backend` and documented in its `docs/frontend-api.md`.

## Read by task

| Task | Read first |
| --- | --- |
| Product behavior and terminology | `PRODUCT.md`, `CONTEXT.md`, `docs/spec.md` |
| UI design | `DESIGN.md` and `.agents/skills/impeccable/SKILL.md`; do not download its separate engine without an explicit request |
| Architecture or API | `docs/ARCHITECTURE.md` and the backend's current contract |
| Behavior or test changes | `docs/TESTING.md` and `.agents/skills/test-engineering/SKILL.md` |
| Code, dependency, executable configuration or CI changes | `.agents/skills/security-review/SKILL.md` and `docs/SECURITY-MODEL.md` |
| Hook changes explicitly requested by the user | `.agents/skills/hook-management/SKILL.md`; establish host, scope, event and behavior first |

## Completion

Run checks appropriate to the change and report actual results, remaining gaps and any unverified behavior. Follow the project testing and security review routes for application changes. Preserve unrelated changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
