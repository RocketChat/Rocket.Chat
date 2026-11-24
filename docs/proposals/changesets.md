# Changesets

A changeset is a file in `.changeset/` that becomes a changelog entry and decides the version bump of each package it names. Create one with `yarn changeset`, or write the file by hand:

```md
---
'@rocket.chat/meteor': patch
---

Fixes the page reloading to apply an update while a modal, such as the two-factor authentication prompt, is still open
```

For the pull request's title and description, see [pull-request-style.md](pull-request-style.md).

## When to add one

Add one when the change is visible to someone outside the team: a user or admin of the workspace, an API or app developer, or a consumer of a package published to npm. That covers every `fix` and `feat`, and a `refactor` or `chore` that changes a published package's API.

Don't add one for:

- a `regression`, since the bug never reached a release;
- changes to private packages only;
- tests, CI, docs and dev tooling.

When a pull request has no changeset, say why in one line of its description.

Check `.changeset/` after every rebase: a rebase can bring back a changeset that was deleted.

## Packages

List the packages whose behavior changes for their consumers. A change in the app is `@rocket.chat/meteor`. Each published package you changed gets its own entry.

## Bump

| Bump | For |
|---|---|
| `patch` | a fix |
| `minor` | a feature |
| `major` | a breaking change; the pull request title carries `!` |

The Fuselage packages follow their own policy while they are migrated: see [fuselage-tamagui-components.md](../frontend/fuselage-tamagui-components.md).

## Text

One or two sentences for the person who runs or builds on Rocket.Chat, not for the reviewer.

- Start with a verb in the third person: "Fixes…", "Adds…", "Changes…", "Removes…".
- Describe the behavior, not the code. A fix names what was broken.
- Write one changeset per visible change. A pull request that fixes two things users would notice has two.
- When the change breaks an API, say what a consumer must do. For a published package, list it under a `### Breaking for npm consumers` heading.

| Instead of | Write |
|---|---|
| `Fixes bug` | `Fixes the user profile page crashing on load` |
| `Changes the deleteUser projection to { services: 0 }` | `Fixes apps not getting the complete user in the IPostUserDeleted event when an admin deletes a user` |

Give the file a descriptive name, such as `slash-command-forbidden-status.md`. It is easier to find after a rebase than a generated one.
