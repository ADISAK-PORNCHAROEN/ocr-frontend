# Project skills checklist

Standard project skills: **5**; selected project skills: **5**; complete package installations: **5/5**; incomplete: **0/5**; runtime catalog discovery: **5/5**. Fresh-session catalog discovery was observed by an independent reviewer; invocation and actual workflows were not verified.

Source: pre-install snapshot of the Foundation bundled assets. SHA-256 fingerprints are computed over sorted UTF-8 records `file<TAB>relative/path<TAB>file-sha256` or `symlink<TAB>relative/path<TAB>target`, LF-delimited with a final LF. Source and installed bytes were compared recursively.

| Skill | Path | Source → installed entries | Source → installed SHA-256 | Missing / changed / added | Discovery |
| --- | --- | --- | --- | --- | --- |
| test-engineering | `.agents/skills/test-engineering` | 2 → 2 | `48ab7a5135418971cc6e79b2bdc61e35008cde8c4fe7d1b99d7f5a57c0dd4bb5` → `ee450cab84ec7806af050281ca9466f7dfd9ebbcc799aa5b3ec484617cdcfbae` | none / ['references/testing-contract.md'] / none | Fresh host catalog; invocation unverified |
| security-review | `.agents/skills/security-review` | 2 → 2 | `fd361917704ead6725794dea94fc08def2916ca5c8a561a9517192f7a4821d8a` → `3c99126b12da9ece1d8f8334c7968d010290110349e46ba5f941c1a3fad27c05` | none / ['references/review-contract.md'] / none | Fresh host catalog; invocation unverified |
| graphify | `.agents/skills/graphify` | 12 → 12 | `aab00021382bf9fa662577f3db7605d38269edc8aa9f690d80a47176cd34ccd7` → `aab00021382bf9fa662577f3db7605d38269edc8aa9f690d80a47176cd34ccd7` | none / none / none | Fresh host catalog; invocation unverified |
| hook-management | `.agents/skills/hook-management` | 2 → 2 | `01e66efa463c5fff70ccf3b1eee3cfc741b693de6de574d9c2dc2f91a18fd10b` → `01e66efa463c5fff70ccf3b1eee3cfc741b693de6de574d9c2dc2f91a18fd10b` | none / none / none | Fresh host catalog; invocation unverified |
| impeccable | `.agents/skills/impeccable` | 64 → 64 | `dc55eb3bcfc827aaa51f06bdda6bd88e21f6a75eaee261039095e98057c39cd0` → `dc55eb3bcfc827aaa51f06bdda6bd88e21f6a75eaee261039095e98057c39cd0` | none / none / none | Fresh host catalog; invocation unverified |

The two changed reference contracts map upstream principles to this project’s documented OCR journeys, intended boundaries and absent application/test configuration. These project-specific changes are recorded in `foundation.json`; no source files are missing. All skill entrypoints and required resources exist, names match, and AGENTS.md routes each workflow. A recursive scan of relative Markdown links found no missing candidates before these mappings; new links were verified against existing files. Impeccable metadata declares no extra invocation restrictions. The package includes upstream support files; its engine is separate. Graphify CLI and Git hook are separately requested work.

Testing source read: Google testing tiers; Google coverage source returned a blocked redirect. Security source reads: OWASP Top 10:2025 and Secure Code Review Cheat Sheet. Versioned ASVS/WSTG details remain to be read when selected for an actual change. Other linked sources were retained but not read in this setup.

Review base: `65de4da`; setup working tree. Date: 2026-11-22.
