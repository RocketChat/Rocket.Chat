---
name: sdlc-setup
description: >
  Set up a package in this monorepo for spec-first, AI-native development: intents, specs,
  plans and ADRs under docs/, a full process README adapted to the package, AGENTS.md (with a
  CLAUDE.md that imports it), a REVIEW.md checklist, checks that keep documents and tests in
  agreement, and agent evals, all inside the package. Use whenever someone creates a new
  package or app under packages/, ee/packages/, apps/ or ee/apps/ and wants it "spec-first",
  "like the XMPP package", "AI-native", "with intents and specs", "with an AGENTS.md", or asks
  to adopt the AI-native SDLC playbook in a package, even if they only say "set up the
  docs/process for this package". Also use it to check whether an existing spec-first package
  is still set up correctly.
---

# Set up a spec-first package

The AI-native SDLC turns each stage of work into a committed artifact that the next stage
reads: an intent (what is wanted), a spec (what must hold), a plan (how, and how it is
proven), then code whose tests cite the spec. Agents write most of it; people approve at the
gates. `ee/packages/xmpp-server` is the reference: read its `docs/README.md` once if you have
not, to see the end state.

This skill installs that apparatus in one package, and only there: every file it creates or
changes is inside the package. Nothing outside it (the root `CLAUDE.md`, `docs/features/`,
CI workflows, agent settings) is touched; those are decided for the whole repository later.
It writes only files any agent or person can read: Markdown, Node scripts with no
dependencies, and shell. Nothing here depends on which agent runs it.

Paths starting with `<pkg>/` are inside the package. `assets/` and `references/` are next to
this SKILL.md.

## 0. Find the package and what already exists

- The package is the one the request names, or the one the current directory is in. If
  neither is clear, ask.
- `<pkg>/docs/templates/spec.md` already exists: the package is set up. Run
  `node <pkg>/scripts/sdlc/sdlc-check.mjs <pkg>` (or, if the package predates the scripts,
  the copy in `assets/package/scripts/sdlc/`), report what it finds, and offer to fix it.
  Do not scaffold over it.
- The package has its own `CLAUDE.md`, `AGENTS.md` or `docs/`: keep their content. It moves
  into the new files in step 3; nothing is lost or overwritten blindly.

## 1. Read before asking

Learn as much as the code can tell you, so the interview only asks what it cannot:

- `<pkg>/package.json` (name, `private`, `files`, every script), `README.md`, the source tree
  and its entry points, the test files and their runners, and the configs the scripts need
  (`tsconfig*.json`, `jest.config.*`, lint config).
- Who consumes the package: search the repository for imports of its name.
- The repository's root `CLAUDE.md` and the docs it indexes that apply to this package
  (backend, frontend, database access, comments).

While reading, note every gap that would make a command fail, in CI or for the next agent.
The ones that bite most often:

- A script points at a config that does not exist (`build` naming a missing `tsconfig.json`).
- The CI test command finds no tests and fails: jest exits 1 on an empty package unless
  `passWithNoTests` is set, and the root `yarn testunit` runs every workspace.
- A suite that needs services CI does not start is matched by the CI command: jest's default
  `testMatch` picks up `tests/integration/**` too.
- The new workspace is not in `yarn.lock` yet, so CI's immutable install fails until someone
  runs `yarn` at the root.

Do not fix these during setup: they are changes to the package's build, not to its process,
and belong in their own commit or PR. List them in the report, each with the fix.

## 2. Interview in one turn

Ask everything at once, propose the answers you inferred so the engineer only corrects them,
then wait:

- Why is this package held to written specs? Who depends on its behaviour, and what decides
  whether it is right: a standard, an upstream API, a product requirement?
- What can a user of this package observe? (Propose the list from the code: return values
  and errors, rendered output, messages on the wire, documents stored, events.)
- Which test suites exist or will exist, which run in CI, and which need services CI does not
  start?
- Anything agents already get wrong here?
- One feature someone might plausibly ask for next that the package does not have: it seeds
  the first agent eval.

When the request already answers a question, do not ask it again. When nobody can answer
(a non-interactive run), use your inferences and list them as assumptions in the report.

## 3. Scaffold

Copy `assets/package/` into `<pkg>/`, keeping the layout:

```
<pkg>/AGENTS.md            agent instructions, about 50 lines
<pkg>/CLAUDE.md            "@AGENTS.md", so Claude Code reads the same file
<pkg>/REVIEW.md            review passes, severity, what to skip
<pkg>/docs/README.md       the full process, adapted to this package
<pkg>/docs/templates/      intent, spec, plan, adr
<pkg>/docs/{intents,specs,plans,adr}/README.md   one-line pointers
<pkg>/evals/README.md      how evals work here
<pkg>/evals/new-capability-starts-with-an-intent/{prompt.md,check.sh}
<pkg>/scripts/sdlc/        sdlc-check.mjs, run-evals.mjs, sdlc-guard.mjs, README.md
```

An existing `CLAUDE.md` moves into `AGENTS.md`: commands, conventions, architecture and
"things Claude gets wrong" go to the matching sections, worded for any agent, and
`CLAUDE.md` becomes the one-line import. An existing `docs/` keeps its files; the process
README and templates are added beside them.

Keep `check.sh` executable.

## 4. Fill the placeholders

Every `{{NAME}}` and every `<!-- sdlc-setup: ... -->` comment must be gone when you finish;
`sdlc-check` fails on any that remain.

| Placeholder | Value |
| --- | --- |
| `{{PACKAGE_NAME}}` | `name` from `package.json`, e.g. `@rocket.chat/xmpp-server` |
| `{{PACKAGE_PATH}}` | the package's path from the repository root, e.g. `ee/packages/xmpp-server` |
| `{{ROOT}}` | relative path from the package to the repository root, e.g. `../..` |

Each `sdlc-setup:` comment says what replaces it. Write those parts from what you read and
what the engineer said, in plain declarative sentences about this package, not about
packages in general. [references/adapting.md](references/adapting.md) shows what good
answers look like for a library, a UI package and a service; read it before writing them.

The parts that matter most:

- **AGENTS.md Commands**: the real scripts from `package.json`, run through
  `yarn workspace <name> <script>`. An agent will run exactly what is written, so a command
  that does not exist, or fails for a gap from step 1, costs every future session. Keep the
  whole file around 50 lines: it is read at the start of every session, and anything longer
  belongs in `docs/README.md`.
- **docs/README.md "Writing a spec"**: what counts as observable here. This is what keeps
  requirements testable.
- **docs/README.md "Testing"**: each suite, its command, whether CI runs it, and what it can
  observe, so plans pick the cheapest suite that proves each requirement.
- **The seed eval's prompt.md**: the feature from the interview, phrased as an engineer would
  ask for it to be built. The check proves an agent answers with an intent instead.

Leave the rest of the process README as written. It is the same process in every spec-first
package; a package that changes it on its own drifts from the shared skills.

## 5. Wire it in, inside the package

- Add to `package.json` scripts:
  `"sdlc:check": "node scripts/sdlc/sdlc-check.mjs ."` and
  `"sdlc:evals": "node scripts/sdlc/run-evals.mjs ."`.
- If the package is published (`private` is not `true`) and its `files` list does not
  already exclude them, keep `docs/`, `evals/`, `scripts/` and the agent files out of the
  tarball.
- If the package's lint covers `scripts/` and flags the new `.mjs` files, add the folder to
  the package's own lint ignore list.
- If the package has a `README.md`, add one sentence saying it is developed spec-first, with
  a link to `docs/README.md`.

The pre-edit guard (`scripts/sdlc/sdlc-guard.mjs`) needs a hook in the agent's settings. Do
not write that setting yourself: an agent changing its own configuration is refused in some
modes and should be a person's decision in all of them. `scripts/sdlc/README.md` has the
snippet; point the engineer at it in the report.

## 6. Verify

Run, from the package, and show the output:

```sh
node scripts/sdlc/sdlc-check.mjs .
sh -n evals/new-capability-starts-with-an-intent/check.sh
git status --short -- "$(git rev-parse --show-toplevel)" | grep -v " <pkg>/"   # must print nothing
```

`sdlc-check` must print `sdlc-check: ok`, and nothing outside the package may have changed.
Then reread `AGENTS.md`: around 50 lines, every command in it exists in `package.json`, and
nothing in it is specific to one agent apart from naming the skills.

## 7. Report

Say, briefly:

- the files created and changed;
- the assumptions you made in place of answers;
- the gaps from step 1, each with its fix, as separate work;
- that the pre-edit guard is off until a person adds the hook from `scripts/sdlc/README.md`;
- what comes next. For a new package: the first intent, with `sdlc-intent`. For a package
  with code already: the capabilities you found, each a candidate for an `implemented` or
  `partial` spec written with `sdlc-spec`, one per PR;
- the commit: `chore(<package short name>): develop <name> spec-first`.

## What not to do

- Do not write intents, specs, plans or ADRs during setup, even when the code makes some
  obvious. Each is a reviewed artifact of its own; list them as next steps instead.
- Do not create package-specific copies of the stage skills (`<pkg>-intent` and so on). The
  shared `sdlc-intent`, `sdlc-spec` and `sdlc-plan` read the package's own docs.
- Do not touch anything outside the package, including tests or build configs that need
  fixing; report them.
- Do not copy XMPP-specific content (standards, the compliance matrix, ejabberd) into
  another package. A package that needs an index like the compliance matrix adds it as the
  README's comment describes.
- Do not change the process README's rules for one package. If a rule is wrong, it is wrong
  for every package: change this skill's asset and the packages that copied it.

## How other agents use this

Everything the skill writes is read the same way by any agent: `AGENTS.md` is picked up by
most coding agents, and `CLAUDE.md` imports it for Claude Code. The checks are plain Node in
the package. The pre-edit guard needs a hook, which Claude Code and some other agents
support; without one, `sdlc:check --base origin/develop` catches the same edits before a PR.
[references/cross-agent.md](references/cross-agent.md) has the details.
