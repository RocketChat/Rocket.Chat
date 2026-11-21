# {{PACKAGE_NAME}}

<!-- sdlc-setup: one sentence on what the package does and who uses it. -->
Spec-first: read [docs/README.md](docs/README.md) before changing behaviour. Repository-wide
rules are in [CLAUDE.md]({{ROOT}}/CLAUDE.md) at the repository root; read it first if your
agent did not load it.

## Commands

```sh
<!-- sdlc-setup: the package's real scripts, one per line, with a comment saying what each
proves and, when it is not obvious, what healthy output looks like. Keep sdlc:check. -->
yarn workspace {{PACKAGE_NAME}} sdlc:check   # specs, plans, ADRs and tests agree; prints "sdlc-check: ok"
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

<!-- sdlc-setup: three to six lines a new joiner needs on day one: the layers or modules,
what may import what, the entry points, and which packages or apps consume this one. -->

## Things agents get wrong

<!-- sdlc-setup: anything the engineer already knows agents get wrong here; otherwise delete
this comment and keep only the next line. -->
When an agent makes the same mistake twice in this package, the correction goes here and the
task becomes an eval in `evals/`.
