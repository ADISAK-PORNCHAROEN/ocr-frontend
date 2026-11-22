# Foundation document delivery

Scope: normal project-local setup; base revision `65de4da` plus uncommitted setup changes. Independent semantic review identified two generic contract mappings and two record inconsistencies; these were corrected. A fresh reviewer session observed all five project-local skills in the host catalog.

| Canonical path | Purpose and applicability | Evidence / content review | Checks and remaining work |
| --- | --- | --- | --- |
| `AGENTS.md` | Required shared rules and routing | Preserves agreed pstack choices, reviewable commits, PRs and task routes. | Archive receipt and staged bytes verified; cross-document review completed. |
| `CLAUDE.md` | Required host bridge | Contains `@AGENTS.md` only. | Bytes inspected; Claude host loading not observed. |
| `PRODUCT.md` | Required purpose and journeys | Distinguishes approved direction from unimplemented product and unconfirmed spec/test seam. | Implementation evidence pending. |
| `CONTEXT.md` | Required domain vocabulary | Agreed OCR terminology; references initial plan and owner decision. | Revisit if backend contract changes. |
| `DESIGN.md` | Required visual direction | Documents agreed desktop/mobile intent and explicitly absent implementation/tokens. | Impeccable design and rendered review pending. |
| `SECURITY.md` | Required reporting policy | No reporting or supported-version policy provided; points to proposed model. | Owner must establish policy. |
| `docs/ARCHITECTURE.md` | Applicable planned boundaries | Browser → Next.js BFF → proposed backend; no implementation claimed. | Verify against implementation and backend contract. |
| `docs/TESTING.md` | Applicable test strategy | Proposed browser/BFF/fixture seam and test tools, no native suite claimed. | Owner confirmation of seam and tool setup pending. |
| `docs/SECURITY-MODEL.md` | Applicable file and external-service boundaries | Proposed data lifetime, security invariants and scenarios distinguished from verified controls. | Reassess against implemented system. |
| `docs/frontend-plan.md` | Existing accepted product plan | Records workflow and limits as pending backend facts. | Keep as owner-approved plan. |
| `docs/spec.md` | Existing proposed issue spec | Captures journeys, constraints, planned seams and pending contract. | User confirmation before publication. |
| `docs/ticket-draft.md` | Existing tracker draft | Ticket breakdown and dependencies await user approval. | Publish only after approval. |
| `docs/agents/foundation.json` | Required setup inventory | Lists canonical paths, five skills, source snapshots and instruction archive receipt. | Paths and package inventories reconciled; fresh-session discovery observed. |
| `docs/agents/skills-checklist.md` | Required installation evidence | All five inventories are complete; two adapted contracts differ from their source snapshots as documented in the manifest. | Fresh-session discovery and package review observed; runtime workflow execution remains unverified. |
| `docs/AI-FOUNDATION-REPORT.md` | Required setup report | Captures evidence and unresolved verification. | Independent review and repository-local hook results recorded. |
| `docs/history/agent-instructions/README.md` | Required migration history | Names original guide archive and SHA-256. | Verify archive against receipt. |
| `docs/history/agent-instructions/AGENTS.2026-11-22-930a3ccfb6f8.md` | Required exact prior guide | Original pstack instructions preserved. | Verify archive hash. |
| `.agents/skills/test-engineering/SKILL.md` | Required behavior/test workflow | Entrypoint routes to testing contract and source-backed test selection. | Catalog discovery observed; invocation not verified. |
| `.agents/skills/test-engineering/references/testing-contract.md` | Required detailed testing criteria | Project-specific mapping added and recorded in the inventory. | Apply to actual changes when tests exist. |
| `.agents/skills/security-review/SKILL.md` | Required code/config security review | Entrypoint routes to security contract and scopes scans to changed artifact. | Catalog discovery observed; invocation not verified. |
| `.agents/skills/security-review/references/review-contract.md` | Required detailed review criteria | Project-specific mapping added and recorded in the inventory. | Apply to changed hook as applicable. |
| `.agents/skills/graphify/SKILL.md` | Required discovery workflow | Complete bundled entrypoint; CLI installation is separate. | CLI 0.9.80 and local post-commit execution observed; catalog discovery observed. |
| `.agents/skills/graphify/references/` and licenses | Required Graphify package | All 12 bundled entries match source fingerprint; eight references and licenses preserved. | CLI and graph behavior are separate checks. |
| `.agents/skills/hook-management/SKILL.md` | Required explicit hook workflow | Identifies host, scope, event and behavior before changes. | Catalog discovery observed; invocation not verified. |
| `.agents/skills/hook-management/references/hook-change-contract.md` | Required hook contract | Complete bundled file matches source snapshot. | Hook status and actual repository commits observed; code-only asynchronous refresh and local scope documented. |
| `.agents/skills/impeccable/SKILL.md` | Required UI workflow | Complete bundled entrypoint directs new design work; engine separate. | Catalog discovery observed; future visual workflow pending. |
| `.agents/skills/impeccable/agents/openai.yaml` | Required agent metadata | Declares interface metadata; no extra invocation restrictions. | Catalog discovery observed; invocation not verified. |
| `.agents/skills/impeccable/reference/hooks.md` | Required hook guidance | Complete bundled file matches source snapshot. | Impeccable hooks not requested. |
| Other Impeccable package files | Required complete upstream package | All 64 bundled entries match source fingerprint, including five upstream JavaScript resources and notices. | UI engine and rendering remain separate. |
| Native API schema | Applicable when backend implements one | Backend documentation remains a proposal; none in this frontend. | Backend owner must supply confirmed contract. |
| `docs/SCHEMA.md` | Not applicable | No frontend persistence or database exists or is selected. | Reassess if persistence is introduced. |
| `docs/adr/` | Conditional | No additional ADR has been accepted in this setup. | Add only for a consequential accepted trade-off. |

The Graphify CLI and Git post-commit hook are separately authorized requests, not automatic Foundation setup. Their installation and behavioral verification are recorded separately in the final report.
