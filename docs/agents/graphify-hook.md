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
print(hooks._install_hook(
    Path(".git/hooks"), "post-commit", hook,
    hooks._HOOK_MARKER, hooks._HOOK_MARKER_END,
))
'@ | .git/graphify-venv/Scripts/python.exe -
```

Inspect the resulting hook and check status:

```powershell
Get-Content -LiteralPath .git/hooks/post-commit
.git/graphify-venv/Scripts/graphify.exe hook status
```

Expected for this setup: post-commit installed, post-checkout not installed, and merge driver not registered. Status confirms configuration, not execution. To remove this setup, inspect the hook first and remove only its Graphify block, preserving any other hook content. The isolated environment can be removed separately once no hook uses its interpreter. Recreate the hook after moving or reinstalling that environment because it pins the interpreter path.

## Behavior and verification

After a qualifying commit, the hook launches an asynchronous Graphify rebuild and writes its log to the user's `.cache/graphify-rebuild.log`. The commit can finish before the graph does; inspect the log and generated `graphify-out` after it completes. The upstream hook extracts **code only**; Markdown and other semantic content require a separate Graphify update using the project skill. It also skips certain Git operations and respects `GRAPHIFY_SKIP_HOOK=1`. Generated graph output is not automatically included in the commit that triggered it.

During setup, a separate temporary Git repository was given the same hook, then a real commit changed a Python file. The hook launched a rebuild and produced `graph.json`, `graph.html` and `GRAPH_REPORT.md` with 3 nodes and 2 edges. This establishes behavior for that test, not automatic installation or behavior in other checkouts. Confirm the log and graph after a qualifying commit in each checkout.
