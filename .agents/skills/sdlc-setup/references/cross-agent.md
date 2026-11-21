# How each agent finds the apparatus

Everything that steers agents in a spec-first package is a plain file. What differs between
agents is only which files they load on their own.

| Piece | Where | Read by |
| --- | --- | --- |
| Package instructions | `<pkg>/AGENTS.md` | Codex, Cursor, GitHub Copilot, Gemini CLI (when configured for `AGENTS.md`), and most agents that follow the AGENTS.md convention, when they work in the package |
| Claude Code instructions | `<pkg>/CLAUDE.md`, which contains `@AGENTS.md` | Claude Code, which expands the import |
| Repository rules | root `CLAUDE.md` | Claude Code always; other agents only when told. Each package's `AGENTS.md` links it for that reason |
| Shared skills | `.agents/skills/sdlc-*/SKILL.md`, or a copy in a user's own skills folder | agents that read the cross-agent skills folder (Codex, Copilot, and others following the Agent Skills format) |
| Claude Code skill links | `.claude/skills/sdlc-*` → `../../.agents/skills/sdlc-*`, or `~/.claude/skills/sdlc-*` | Claude Code |
| Process, templates, review | `<pkg>/docs/`, `<pkg>/REVIEW.md` | any agent, because `AGENTS.md` points at them |
| Document and test rules | `<pkg>/scripts/sdlc/sdlc-check.mjs` through `yarn workspace <pkg> sdlc:check` | every agent and person; this is the backstop |
| Pre-edit guard | `<pkg>/scripts/sdlc/sdlc-guard.mjs`, wired by a person in their agent's settings | Claude Code hooks; see below for others |
| Agent evals | `<pkg>/evals/`, run by `<pkg>/scripts/sdlc/run-evals.mjs` | any agent with a non-interactive mode, through `SDLC_AGENT_CMD` |

Skill folders differ between agents and change often. If an agent the team uses does not
find `.agents/skills/`, add a symlink from its own folder (for example `.github/skills/` or
`.cursor/skills/`) to the same skill, as `.claude/skills/` does. Do not copy the skill: two
copies drift.

## Skills without a skills loader

An agent that cannot load skills still works: `AGENTS.md` names the stages and
`docs/README.md` holds the full procedure. Telling it "follow
`.agents/skills/sdlc-intent/SKILL.md`" is enough, because each skill is self-contained
Markdown.

## The guard from another agent's hooks

`sdlc-guard.mjs` reads one JSON object on stdin:

```json
{ "tool_name": "Edit", "cwd": "/repo",
  "tool_input": { "file_path": "ee/packages/x/tests/a.spec.ts", "old_string": "...", "new_string": "..." } }
```

`tool_name` is `Edit` (one `old_string`/`new_string` pair), `MultiEdit` (an `edits` array of
pairs) or `Write` (the whole new `content`). It exits 2 with the reason on stderr to block,
0 to allow. An agent whose pre-edit hook can produce that shape can call it directly;
otherwise a small adapter translates its payload. Without any hook,
`sdlc:check --base origin/develop` catches the same edits before a PR.

## Writing for every agent

- Name skills and commands, not agent features: "a read-only planning mode" rather than one
  product's mode name, with that product named as an example.
- Name models by capability ("a fast model", "the most capable model"), then give one
  agent's names as an example.
- Ask questions in plain text, all at once. Not every agent has a question tool.
