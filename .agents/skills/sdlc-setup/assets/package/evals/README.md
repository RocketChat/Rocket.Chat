# Agent evals for {{PACKAGE_NAME}}

Each folder is one real task with an accepted outcome:

- `prompt.md` is what an engineer would type to an agent in this package, word for word.
- `check.sh` decides whether the outcome is right; exit 0 passes. It runs from the package
  directory of a fresh worktree after the agent finishes, with `SDLC_EVAL_BASE` (the commit
  the task started from), `SDLC_PACKAGE_DIR` and `SDLC_REPO_ROOT` set. Check the result, not
  the route the agent took: which files changed, whether the tests pass, whether
  `sdlc:check` passes.

The folder name says what is being tested, in lowercase with hyphens.

## Running

```sh
SDLC_AGENT_CMD='<agent in non-interactive mode>' yarn workspace {{PACKAGE_NAME}} sdlc:evals
SDLC_AGENT_CMD='...' yarn workspace {{PACKAGE_NAME}} sdlc:evals --case <folder>
```

The command receives the prompt as its last argument, or where it writes `{prompt}` (the
text) or `{prompt_file}` (a path). For example, checking each agent's documentation for
current flags:

| Agent | `SDLC_AGENT_CMD` |
| --- | --- |
| Claude Code | `claude -p --permission-mode acceptEdits` |
| Codex CLI | `codex exec --full-auto` |
| Gemini CLI | `gemini --yolo -p {prompt}` |

Cases run from `HEAD` in their own worktree, so commit the configuration you want to measure.
Logs, the diff each agent produced and `results.json` go to the folder printed at the end
(`--out <dir>` to choose it). `--min-pass-rate 0.9` lowers the bar the command exits on.

## When to add a case

- A defect got past review: the task whose correct outcome would have exposed it.
- An agent made the same mistake twice: the task where it did, once the correction is in
  `AGENTS.md`, so the correction stays proven.
- A production incident: the task that reproduces the decision that went wrong.

Aim for 20 to 50 cases over time, drawn from real work rather than invented. A case that every
agent always passes and that nobody would miss can go.

## Not in CI yet

Nothing runs these automatically. Run them after any change to `AGENTS.md`, `CLAUDE.md`,
`REVIEW.md`, the skills or the hooks; a change that lowers the pass rate does not merge until
the cause is understood.
