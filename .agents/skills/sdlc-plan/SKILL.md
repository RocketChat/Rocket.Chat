---
name: sdlc-plan
description: >
  Produce the implementation plan for a planned spec in a spec-first package (one with
  docs/templates/spec.md): docs/plans/SLUG.md with the files that change, one-commit steps
  naming the requirements they satisfy, the risks, and a Proof table mapping every
  requirement to the test that proves it. Use whenever someone in such a package wants to
  start building a capability, says "plan", "how do we implement", "let's build the X spec", or
  enters plan mode with a spec. Use it before any code: nothing in a spec-first package is
  implemented without a committed plan.
---

# Plan the implementation of a spec

The plan is the most leveraged document in the loop: every implementation step, every review
and every proof traces back to it. It names the files, the order, the risks and, for each
requirement, the test that will prove it. Committing it is the approval; code comes after.

## Find the package

The package is the one the request names, or the nearest directory above the current one,
or above the spec given, that contains `docs/templates/spec.md`. Paths below are relative to
it.

- No such directory: the package is not spec-first. Say so and offer `sdlc-setup`.
- The package ships its own plan skill (`ee/packages/xmpp-server` has `xmpp-plan`): use that.

Read `docs/README.md` ("The loop", "A new capability", "Testing", "What must move together")
and `docs/templates/plan.md`.

Plan read-only: read and propose, edit nothing until the engineer approves the plan
(Claude Code's plan mode does this; in other agents, simply do not edit). Use the most
capable model available; on a smaller one, say so in one line first.

## Preconditions

The spec must have `status: planned`.

- `draft`: stop and point at `sdlc-spec`, which reviews it. The requirements are not agreed;
  a plan would be built on sand.
- `implemented` or `partial` and the engineer wants a change: the README's "Changing the
  behaviour of an implemented capability" says when a new round is needed. A second round is
  `docs/plans/<slug>-2.md`.
- An open question in the spec that a step depends on blocks the plan: say which, instead of
  deciding it silently.

## Read before planning

- The spec: every `R`, Out of scope, Known defects, Open questions.
- Every ADR in the spec's `adrs`, and any other ADR in `docs/adr/` that touches what will
  change. A plan that contradicts an ADR needs a superseding ADR as its first step.
- The files in the spec's `code` list and the package's `AGENTS.md`, including "Things agents
  get wrong", so steps name real modules.
- The README's "Testing": pick the cheapest suite that can observe each requirement.

## Write `docs/plans/<slug>.md`

From the template, `Status: approved.`, dated today.

- **Files that change**: every file, one line each, new files marked. The spec itself
  (Design, `code`, `tests`, status) is the last entry.
- **Order of work**: numbered steps, each one commit, each naming the `R`s it satisfies.
  Dependencies first: what other steps build on comes before them. A step that adds behaviour
  adds its test in the same step. Write each step so a fresh session could implement it from
  this file alone.
- **Risks**: which consumers could read a requirement differently and how the plan finds out;
  what is left half-done if work stops after step n; which existing requirement could regress.
- **Proof**: one row per `R` the plan touches: the test file and the test name, which ends in
  `(R<n>)`, or `(<slug> R<n>)` when it lives in another spec's test file. A requirement
  without a row will not be proven; if one cannot be tested, the row says why.

Run `yarn workspace <package> sdlc:check` and show its output: it checks that every Proof row
cites a requirement the spec has.

## Hand-over

Say that committing the plan by itself is the approval, and give that commit's message:
`docs(<package short name>): plan <slug>`. Give the first step's commit message too. Then
stop: implementation is one step per session or per commit, and any step that departs from
the plan updates the plan in the same commit.
