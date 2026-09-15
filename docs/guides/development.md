# Development workflow & standards

**Who this is for:** engineers writing code in the monorepo who want the shared
expectations before opening a PR.

**After reading this you will know:** the workstation baseline, and the checks to
run locally so CI (and reviewers) don't bounce your work.

---

## Workstation

- **8 GB RAM or more.** Building Rocket.Chat from source needs it.
- Exact Node, Yarn, and Meteor versions matter — they're pinned. Get set up via
  [Getting Started → Prerequisites](../getting-started.md#1-prerequisites); don't
  guess versions.

## The monorepo

Rocket.Chat is a single build assembled from many workspaces. Most of the code
lives in `apps/meteor`; shared code lives in `packages/` and enterprise code in
`ee/`. Run `yarn` and `yarn dev` from the **root** — see
[Monorepo layout](../architecture/monorepo-layout.md) and
[Getting Started](../getting-started.md).

## Run lint and tests before you push

CI runs these, and a red CI stalls your review. Run them locally first (in
`apps/meteor`):

```bash
yarn lint          # stylelint + meteor lint + eslint
yarn testunit      # unit tests
yarn testunit-watch  # unit tests, watch mode while developing
```

Full command list: [Getting Started → Run the tests](../getting-started.md#7-run-the-tests).

## Coding style

Follow the existing conventions rather than introducing your own — see
[Conventions](../README.md#conventions-how-we-write-code) (backend and frontend).
Keep the PR title short and put the detail in the description; it feeds the
changelog. See [the title conventions](./pull-requests.md#3-the-title-matters).

---

See also: [Opening & handling Pull Requests](./pull-requests.md) ·
[Reviewing a Pull Request](./reviewing.md).
