# Spec-first tooling for @rocket.chat/ui-message-list

Plain Node, no dependencies, so any agent, engineer or CI job can run them.

| Script           | Run with                                                                    | Does                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sdlc-check.mjs` | `yarn workspace @rocket.chat/ui-message-list sdlc:check`                    | checks that intents, specs, plans, ADRs and tests agree. Add `--base origin/develop` before opening a PR to also check what only shows in a diff: no merged ADR edited, no `R` or `Q` removed, a pinned test changed only by losing its skip. |
| `run-evals.mjs`  | `SDLC_AGENT_CMD='…' yarn workspace @rocket.chat/ui-message-list sdlc:evals` | runs the agent evals in `../../evals/`; see its README                                                                                                                                                                                        |
| `sdlc-guard.mjs` | a pre-edit hook in your agent                                               | stops an agent, while it works, from editing a merged ADR or weakening a pinned test                                                                                                                                                          |

None of them is wired into CI yet; run `sdlc:check` before every PR.

## Turning on the guard in Claude Code

An agent should not change its own configuration, so a person adds this to their
`.claude/settings.local.json` (just for them) or to the repository's `.claude/settings.json`
(for everyone, in its own PR):

```json
{
	"hooks": {
		"PreToolUse": [
			{
				"matcher": "Edit|MultiEdit|Write",
				"hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/packages/ui-message-list/scripts/sdlc/sdlc-guard.mjs\"" }]
			}
		]
	}
}
```

Other agents with pre-edit hooks can call the same script: it reads
`{ "tool_name": "Edit" | "MultiEdit" | "Write", "cwd", "tool_input": { "file_path", "old_string", "new_string", "edits", "content" } }`
on stdin and exits 2, with the reason on stderr, to block.
