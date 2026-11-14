# @rocket.chat/ui-message-list

Presentational React package that renders every conversation in Rocket.Chat (room, threads, search, pinned/starred/mentions lists, audit, moderation, contact history, modals); `apps/meteor` consumes it.
Spec-first: read [docs/README.md](docs/README.md) before changing behaviour. Repository-wide
rules are in [CLAUDE.md](../../CLAUDE.md) at the repository root; read it first if your
agent did not load it.

## Commands

```sh
yarn workspace @rocket.chat/ui-message-list typecheck       # tsc --noEmit
yarn workspace @rocket.chat/ui-message-list build           # emits dist, which apps/meteor reads
yarn workspace @rocket.chat/ui-message-list testunit        # jest in jsdom; CI runs it
yarn workspace @rocket.chat/ui-message-list lint            # oxlint
yarn workspace @rocket.chat/ui-message-list test-storybook  # Storybook play tests, real browser; scroll and measuring
yarn workspace @rocket.chat/ui-message-list sdlc:check   # specs, plans, ADRs and tests agree; prints "sdlc-check: ok"
```

## Conventions

- Every capability has a spec in `docs/specs/`. A behaviour change edits the spec in the same
  PR. A wanted capability with no spec starts as an intent (`sdlc-intent` skill), not as
  code or a spec.
- Nothing is implemented without a committed plan: `sdlc-plan` turns a `planned` spec into
  `docs/plans/<slug>.md` before any code. Work that departs from the plan updates it in the
  same commit.
- A new bug becomes a `D<n>` entry in the spec it violates plus a skipped test whose comment
  links the anchor. A fix removes `.skip` and deletes the entry; it never edits the test
  otherwise.
- Decisions that constrain later work go to `docs/adr/`. A merged ADR is never edited; a new
  one supersedes it.
- Tests name the requirement they prove (`R3`) or the defect they pin (`D1`).
- Comments state intent, not mechanism; reasoning goes to the spec or an ADR.
- Before saying a task is done, run the commands above and show their output. Reviews follow
  [REVIEW.md](REVIEW.md); an agent never approves its own change.

## Architecture

- Entry point: `src/index.ts`. The package has no meteor dependency; every app capability
  arrives through an intent-named React context.
- Rows are produced by the row model; scrolling goes through the reducer and the scroller.
- `apps/meteor` consumes the package through its props, contexts and exports.

## Things agents get wrong

- Writing `scrollTop` directly: the virtualizer reverts it.
- Computing row indexes by hand instead of going through the row model.
- Importing from `apps/meteor`, or calling endpoints, stores or the router from components,
  instead of using a context capability.
- Adding rows to `keepMounted` for UI state: only rows with a live browser resource (a player, an iframe) stay mounted, and the row the list itself holds in view while it holds it.
- Testing scroll behavior in jsdom; it belongs in Storybook play tests.

When an agent makes the same mistake twice in this package, the correction goes here and the
task becomes an eval in `evals/`.
