# Pull request style

How to write a pull request's title and description. This page is about style only. For the rest, see:

- [change-organization.md](../change-organization.md): what goes in one pull request, drafts, decisions and gaps, extraction, rebasing.
- [changesets.md](changesets.md): when a pull request needs a changeset and how to write it.
- [Contributing guide](../../.github/CONTRIBUTING.md): the CLA and how to contribute.
- [getting-started.md](../getting-started.md): running lint, typecheck and tests.
- [Handbook: PR general instructions](https://handbook.rocket.chat/space/RnD/359891385): milestones, review and merge conditions.

## Title

`<type>(<optional scope>): <what changes>`

The title becomes the squash commit message and the changelog line. People read it without the code in front of them.

| Type | Use for |
|---|---|
| `feat` | a new feature |
| `fix` | a bug fix that affects the end user |
| `refactor` | a change in structure, not in behavior |
| `chore` | small tasks, tooling, dependencies |
| `docs`, `ci`, `test`, `i18n` | documentation, CI configuration, tests only, translations only |
| `regression` | a fix for a bug that never reached a release; left out of the changelog |
| `revert` | reverting a merged pull request |

A scope is optional and names the area: `fix(federation):`, `refactor(fuselage):`. A breaking change takes `!`: `feat!:`, `fix!:`, `chore!:`.

### Writing the part after the colon

Say **what** changes for the reader, not **how** the code does it. The diff already shows the how.

**`fix` and `regression`: describe the bug, as the person who hit it would.** Write the broken behavior in the present tense, as a sentence with a subject. The prefix already says it is fixed.

| Instead of | Write |
|---|---|
| `fix: create settings idempotently` | `fix: instances started at the same time hang on startup` |
| `fix: skip autoupdate reload when a modal is open` | `fix: update toast reloads the page while the two-factor prompt is open` |
| `fix: add fields to the channels.list.joined schema` | `fix: channels.list.joined rejects the fields query param` |

A quick test: read the title as a bug report. "Update toast reloads the page while the two-factor prompt is open" is one. "Skip autoupdate reload" is not.

**`feat`: name what someone can now do.** Don't start with "Add", "New" or "Feature": `feat: schedule a message to be sent later`, not `feat: add message scheduler service`.

**`refactor` and `chore`: name the area and the goal.** Here the how is the change: `refactor: move the Setup Wizard into its own package`, `chore: stop Meteor from bundling the client CSS`.

For every type:

- If the title needs "so", "by" or "to avoid" to explain itself, the part after that word is usually the real title.
- If it needs "and", the pull request probably carries two concerns.
- No trailing period, no issue number, no capital letter after the colon.

## Description

Fill in the sections of the [template](../../.github/PULL_REQUEST_TEMPLATE.md). The description is for reviewers. It does not go to the release notes or to the squash commit, so it can be as technical as needed.

- **Proposed changes**: what was wrong or missing, why, and what the pull request does about it. Say what does **not** change when a reviewer could wonder: "the DDP methods still throw the original error codes", "nothing changes visually".
- **Decisions and gaps**: see [change-organization.md](../change-organization.md#start-from-a-clear-definition).
- **Issue(s)**: the Jira task or GitHub issue. For a regression, also the pull request that introduced it.
- **Steps to test or reproduce**: numbered steps a reviewer can follow, with the result before and after.

Worth adding when it applies:

- **Screenshots or a short video** for any visible change, before and after.
- **The reason there is no changeset**, in one line: "dev tooling only", "regression from #1234, not in any release".
- **What was run**, as a small table of check and result, when CI alone doesn't show the proof.
- **A commit list**, one line per commit, when the pull request carries several commits on purpose.
- **"Stacked on #1234"** and why, when it does not target `develop`.
- **Breaking changes**: who is affected and what they must change.

Delete the template sections that stay empty instead of leaving bare headings.
