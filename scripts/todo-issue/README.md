# todo-issue

Scans code for `TODO` comments and automatically creates, closes, updates, and references GitHub Issues.

Runs as a GitHub Actions workflow via [Bun](https://bun.sh/) with a single dependency (`parse-diff`).

## How it works

When code is pushed to `develop`, the script diffs the changes and:

- **Creates** a new issue for each new `TODO` comment
- **Closes** the issue when a `TODO` is removed
- **Updates** the issue title when a `TODO` is edited (detected via similarity matching)
- **References** an existing issue when a duplicate `TODO` is added (adds a comment instead of creating a duplicate)

Every issue created by the script receives the `todo` label, which is also used to efficiently query only relevant issues.

## TODO syntax

Any comment style works (`//`, `#`, `--`, `/* */`, etc.) as long as only symbols and whitespace appear before the `TODO` keyword. The keyword is case-insensitive.

### Examples

**Minimal -- title only:**

```ts
// TODO: Fix the race condition in token refresh
```

Extracted data:

| Field  | Value                                     |
| ------ | ----------------------------------------- |
| Title  | `Fix the race condition in token refresh` |
| Body   | _(none)_                                  |
| Labels | `todo`                                    |

---

**With body -- continuation lines using the same comment prefix:**

```ts
// TODO: Refactor the auth flow
// The current token refresh logic has race conditions
// when multiple tabs are open simultaneously
```

Extracted data:

| Field  | Value                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Title  | `Refactor the auth flow`                                                                              |
| Body   | `The current token refresh logic has race conditions`<br>`when multiple tabs are open simultaneously` |
| Labels | `todo`                                                                                                |

The body stops at the first line that doesn't share the same comment prefix or is empty.

---

**With custom labels:**

```ts
// TODO: Make this button red [frontend] [ui]
```

Extracted data:

| Field  | Value                    |
| ------ | ------------------------ |
| Title  | `Make this button red`   |
| Body   | _(none)_                 |
| Labels | `todo`, `frontend`, `ui` |

Labels are extracted from `[square brackets]` at the end of the title. The `todo` label is always included.

---

**Full example -- body + labels in different languages:**

```python
# TODO: Add retry logic for S3 uploads [infra] [backend]
# Currently fails silently on timeout
# See https://github.com/org/repo/issues/42
```

Extracted data:

| Field  | Value                                                                                |
| ------ | ------------------------------------------------------------------------------------ |
| Title  | `Add retry logic for S3 uploads`                                                     |
| Body   | `Currently fails silently on timeout`<br>`See https://github.com/org/repo/issues/42` |
| Labels | `todo`, `infra`, `backend`                                                           |

---

**Block comments:**

```ts
/**
 * TODO: Should we reinvent the wheel here?
 * We already have a good one in @rocket.chat/core
 */
```

Extracted data:

| Field  | Value                                             |
| ------ | ------------------------------------------------- |
| Title  | `Should we reinvent the wheel here?`              |
| Body   | `We already have a good one in @rocket.chat/core` |
| Labels | `todo`                                            |

---

### Assignees

Mention GitHub usernames with `@` to automatically assign the issue:

```ts
// TODO: Fix flaky test @john-doe [testing]
```

Extracted data:

| Field     | Value             |
| --------- | ----------------- |
| Title     | `Fix flaky test`  |
| Body      | _(none)_          |
| Labels    | `todo`, `testing` |
| Assignees | `john-doe`        |

Mentions in the title are removed from the issue title. Mentions in the body are also collected as assignees but kept in the body text:

```ts
// TODO: Migrate to new payments API
// @alice should review the Stripe integration
// @bob handles the webhook setup
```

Extracted data:

| Field     | Value                                                                             |
| --------- | --------------------------------------------------------------------------------- |
| Title     | `Migrate to new payments API`                                                     |
| Body      | `@alice should review the Stripe integration`<br>`@bob handles the webhook setup` |
| Labels    | `todo`                                                                            |
| Assignees | `alice`, `bob`                                                                    |

---

### What is NOT captured

```ts
// This is not a TODO because the keyword is not at the start after the prefix
// See the TODO documentation for more info

const todo = 'strings containing TODO are ignored';

// TODONT -- partial keyword matches are ignored
```

## Trigger modes

The workflow supports four modes, configured via `workflow_dispatch` inputs or automatic push events.

### Push (automatic)

Triggers on every push to `develop`. Compares `BEFORE_SHA...GITHUB_SHA` to detect added/removed TODOs.

### SHA (manual)

Process a specific commit or range of commits.

| Input               | Behavior                                                |
| ------------------- | ------------------------------------------------------- |
| `a1b2c3d`           | Diffs commit against its parent (`a1b2c3d~1...a1b2c3d`) |
| `a1b2c3d...f4e5d6a` | Diffs the full range                                    |

### Path (manual)

Import all TODOs from a specific file or directory:

```
apps/meteor/client
packages/core-typings/src/IMessage.ts
```

Only creates issues (no close/update). Skips TODOs that already have a matching issue.

### Import all (manual)

Scans the entire codebase for TODOs. Only creates issues for TODOs that don't already have a matching issue. Use with caution on large codebases.

## Matching logic

The script compares found TODOs against existing issues using:

1. **Exact title match** -- identical titles are considered the same TODO
2. **Similarity match** -- titles within 80% Levenshtein similarity are considered the same TODO (catches typo fixes and small edits)

When a TODO is both added and deleted in the same diff:

- **Same title** -- treated as a move (no action)
- **Similar title** -- treated as an edit (updates the existing issue title)

When a new TODO matches an existing open issue, a reference comment is added to the issue instead of creating a duplicate.

## Rate limiting

The script reads `x-ratelimit-remaining` and `x-ratelimit-reset` from GitHub API response headers and automatically waits when approaching the limit.

## Project structure

```
scripts/todo-issue/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts        # Entry point, config loading, diff resolution, orchestration
    ├── types.ts        # Shared interfaces (Config, TodoItem, GitHubIssue, MatchResult)
    ├── diff.ts         # Diff parsing (parse-diff), TODO extraction, body/label parsing
    ├── matcher.ts      # Match found TODOs against existing issues
    ├── similarity.ts   # Levenshtein distance and similarity check
    └── github.ts       # GitHub API (REST + GraphQL), rate limiting, issue CRUD
```
