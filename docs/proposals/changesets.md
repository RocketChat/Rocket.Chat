# Changesets

A changeset is a file in `.changeset/` that becomes a changelog entry and decides the version bump of each package it names. Create one with `yarn changeset`:

```md
---
'@rocket.chat/meteor': patch
---

Fixes the page reloading to apply an update while a modal, such as the two-factor authentication prompt, is still open
```

For the pull request's title and description, see [pull-request-style.md](pull-request-style.md).

## When to add one

Every `fix` and `feat` needs one: the change is visible to a user or admin of the workspace, an API or app developer, or a consumer of a package published to npm.

For a `refactor` or `chore` it is optional, and the author decides. Most need none, since nothing changes for anyone outside the code that moved. Add one when the change reaches further than the diff, even with nothing to see in the interface:

- it changes an interface or signature other packages or apps depend on, such as a component's props or an exported type;
- it changes a rule others rely on, such as the status code an endpoint responds with.
- it improves performance noticeably

Don't add one for:

- a `regression`, since the bug never reached a release;
- tests, CI, docs and dev tooling.

When a pull request has no changeset, say why in one line of its description.

Check `.changeset/` after every rebase: a rebase can bring back a changeset that was deleted.

## Packages

List the packages whose behavior changes for their consumers. A change in the app is `@rocket.chat/meteor`: the package is private, but it is the one the Rocket.Chat release is versioned by.

A visible change made in a workspace package the app consumes, such as `@rocket.chat/ui-client` or `@rocket.chat/fuselage-ui-kit`, names **both** that package and `@rocket.chat/meteor`, whether the package is private or published, and even when no file under `apps/meteor/` changed:

```md
---
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---
```

The GitHub release notes are copied only from the `@rocket.chat/meteor` entry in `apps/meteor/CHANGELOG.md`. A changeset that names only the consumed package lands in that package's own changelog, and reaches the release notes as nothing more than a commit hash under "Updated dependencies".

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
