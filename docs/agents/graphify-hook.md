# Repository-local Graphify and post-commit hook

This setup is for a normal Windows checkout with Git, Python 3.13 and `uv` available. The CLI environment and Git hook live inside this checkout's `.git` directory; neither is included in commits, distributed through Git, or automatically enabled in another clone. Installing the project-local Graphify skill alone does not install the CLI.

## Install in this checkout

From the repository root in PowerShell, inspect the hook destination and existing configuration first:

```powershell
git --version
git config --show-origin --get core.hooksPath
git rev-parse --git-path hooks
Get-Item -LiteralPath .git/hooks/post-commit -ErrorAction SilentlyContinue
```

These instructions assume `core.hooksPath` is unset, `.git` is a directory, and no `post-commit` hook exists. If any assumption is false, inspect the actual path and existing hook through the hook-management skill before making changes; preserve existing behavior. Do not apply this procedure blindly to linked worktrees.

Create the environment and install the CLI version matching the bundled Graphify skill:

```powershell
uv venv .git/graphify-venv --python 3.13
uv pip install --python .git/graphify-venv/Scripts/python.exe graphifyy==0.9.80
.git/graphify-venv/Scripts/graphify.exe --help
```

The upstream `graphify hook install` also installs a post-checkout hook and registers a merge driver. Those changes were not requested here. The following uses the pinned package's internal hook generator to install **only** its post-commit hook; the internal API is version-specific and must be rechecked before changing the package version:

```powershell
@'
from pathlib import Path
from graphify import hooks

hook = hooks._HOOK_SCRIPT.replace("__PINNED_PYTHON__", hooks._pinned_python())
hook = hook.replace("__VIZ_LIMIT_EXPORT__", "")
hook = hook.replace(' -c "$_GFY_PROBE"', ' -I -c "$_GFY_PROBE"')
hook = hook.replace('"$GRAPHIFY_PYTHON" -c "import os, subprocess, sys',
                    '"$GRAPHIFY_PYTHON" -I -c "import os, subprocess, sys')
hook = hook.replace("_cmd = [sys.executable, '-c', _src]",
                    "_cmd = [sys.executable, '-I', '-c', _src]")
print(hooks._install_hook(
    Path(".git/hooks"), "post-commit", hook,
    hooks._HOOK_MARKER, hooks._HOOK_MARKER_END,
))
'@ | .git/graphify-venv/Scripts/python.exe -I -
```

The `-I` adaptations run Python probes, the launcher, and the detached worker in isolated mode so a repository-root `graphify.py` or `graphify` package cannot shadow the installed package. Run the installation command itself with `python.exe -I -` as well when working in an untrusted checkout. Isolated mode ignores Python environment variables, including `PYTHONHASHSEED`; do not assume the upstream hook's hash-seed setting takes effect.

Inspect the resulting hook and check status:

```powershell
Get-Content -LiteralPath .git/hooks/post-commit
.git/graphify-venv/Scripts/graphify.exe hook status
```

Expected for this setup: post-commit installed, post-checkout not installed, and merge driver not registered. Status may label post-commit “out of date” because the isolated-mode hardening differs from upstream; do not run the suggested installer blindly, since it can overwrite that hardening and install other integrations. Status confirms configuration, not execution. To remove this setup, inspect the hook first and remove only its Graphify block, preserving any other hook content. The isolated environment can be removed separately once no hook uses its interpreter. Recreate the hook after moving or reinstalling that environment because it pins the interpreter path.

## Behavior and verification

After a qualifying commit, the hook launches an asynchronous Graphify rebuild and writes its log to the user's `.cache/graphify-rebuild.log`. The commit can finish before the graph does; inspect the log and generated `graphify-out` after it completes. The upstream hook extracts **code only**; Markdown and other semantic content require a separate Graphify update using the project skill. It also skips certain Git operations and respects `GRAPHIFY_SKIP_HOOK=1`. Generated graph output is not automatically included in the commit that triggered it.

During setup, a separate temporary Git repository was given the same hook, then a real commit changed a Python file. The hook launched a rebuild and produced `graph.json`, `graph.html` and `GRAPH_REPORT.md` with 3 nodes and 2 edges. This establishes behavior for that test, not automatic installation or behavior in other checkouts. Confirm the log and graph after a qualifying commit in each checkout.

After adding isolated mode, another temporary repository contained a root-level `graphify.py` that would create a marker if imported. A real commit rebuilt the graph with 5 nodes and 3 edges; the marker was absent. This exercises the isolated hook against that shadowing case.
