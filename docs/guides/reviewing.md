# Reviewing a Pull Request

**Who this is for:** anyone reviewing a Rocket.Chat PR, especially code owners
acting as gatekeepers.

**After reading this you will have:** a checklist to run before approving — PR
hygiene, code, and server-specific concerns.

> Approvals are enforced against `.github/CODEOWNERS`. A reviewer who resolves a
> conversation they didn't open, or dismisses a review, is accountable for what
> happens next — see [PR review actions](./pull-requests.md#9-review-actions--accountability).

---

## PR-related checks

- Milestone and Project are correct.
- Related issues to be closed carry the correct Milestone and Project.
- Related issues are written correctly (one per line).
- The **title** is correct and will read well in the changelog (see the
  [title conventions](./pull-requests.md#3-the-title-matters)).
- **Documentation** is present — in the docs repo or the issue description — when
  applicable.
- The description is good enough to reuse in a blog post, when applicable.
- For **UI changes**: before/after images, in English, at good resolution.

## Code-related checks

- No irrelevant changes that make the review harder than it needs to be.
- Data-structure changes come with **migrations** to convert existing data — and
  the CTO is notified of structure changes.
- No performance issues, **especially in migrations** — when unsure, contact the
  performance team.
- No strings missing translations.
- No translated strings left without an entry in `en.i18n.json`.

## Server-specific checks

- `yarn.lock` was **not** changed without a corresponding change in a
  `package.json`.
- The changed `package.json` has no irrelevant changes.

---

See also: [Opening & handling Pull Requests](./pull-requests.md) ·
[Development workflow & standards](./development.md).
