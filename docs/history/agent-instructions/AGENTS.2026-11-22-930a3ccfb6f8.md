# pstack models

For pstack roles in this project, these choices override user-level pstack model settings. In Codex, pass `model` and `reasoning_effort` separately. Use only `gpt-6-luna` with `xhigh` or `max`, or `gpt-6.1-sol` with `medium`.

- `gpt-6-luna`, `xhigh`: feature, refactoring, bug-fix, reflect tooling, swarm workers.
- `gpt-6-luna`, `xhigh`: perf-issue, hillclimb, arena runners, architect runners.
- `gpt-6-luna`, `max`: hardest tasks.
- `gpt-6.1-sol`, `medium`: judgment and prose, how explorer, how explainer, why investigators, why synthesizer, reflect judgment, divergent, synthesizer, arena cross-judge pool, interrogate reviewers.

Panel lists contain one entry each. If a requested model or effort is unavailable, ask the user before choosing another.
