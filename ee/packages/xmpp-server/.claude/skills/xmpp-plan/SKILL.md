---
name: xmpp-plan
description: >
  Produce the implementation plan for a planned spec in the XMPP server package:
  docs/plans/<slug>.md with the files that change, one-commit steps naming the
  requirements they satisfy, the risks, and a Proof table mapping every requirement to the
  test that proves it. Use whenever someone in ee/packages/xmpp-server wants to start
  building a capability, says "plan", "how do we implement", or opens plan mode with a
  spec. Use it before any code: nothing in this package is implemented without a plan.
arguments: [spec]
---

Run this in plan mode with `/model opus`; use `fable` when the plan crosses into Meteor or
changes the data model. If the session is on a smaller model, say so in one line first:
the plan is the most leveraged document in the loop, and a wrong order is paid for in
every step.

Read `docs/README.md` ("The loop", "A new capability", "What must move together") and
`docs/templates/plan.md` first.

## Preconditions

`$spec` must have `status: planned`. If it is `draft`, stop and point at `/xmpp-spec`,
which reviews it; the requirements are not agreed yet and a plan would be built on sand.
If it is `implemented` or `partial` and the user wants a change, the README's "Changing the
behaviour of an implemented capability" says when a new plan round is needed; a second
round is `docs/plans/<slug>-2.md`.

## Read before planning

- The spec, every `R`, Out of scope and Open questions. An open question that blocks a step
  is a blocker for the plan: say so instead of deciding it silently.
- Every ADR in the spec's `adrs` list, and any other ADR that touches what you will change
  (`docs/adr/`). A plan that contradicts an ADR needs a superseding ADR as its first step.
- Every file in the spec's `code` list and `docs/architecture.md`, so the steps name real
  modules. The package's `CLAUDE.md` lists what Claude usually gets wrong here.
- The test suites: `src/**/*.spec.ts` and `tests/integration` run in CI with jest;
  `tests/end-to-end` runs only locally against ejabberd. Pick the cheapest suite that can
  observe each requirement.

## Write `docs/plans/<slug>.md`

From the template, `Status: approved`, dated today.

- **Files that change**: every file, one line each, new files marked. Include the spec
  itself (Design, `code`, `tests`, status) and `docs/compliance.md` as the last step.
- **Order of work**: numbered steps, each small enough to be one commit, each naming the
  `R`s it satisfies. Protocol core before service, service before Meteor hooks. A step
  that adds behaviour adds its test in the same step.
- **Risks**: which peers (Prosody, ejabberd, Openfire) might read the standard differently
  and how the plan finds out; what data is left half-migrated if work stops after step n;
  which existing requirement could regress.
- **Proof**: one row per `R` the plan touches, naming the test file and the test name,
  which ends in `(R<n>)` or `(<slug> R<n>)` when it lives in another spec's file. A
  requirement without a row will not be proven; say so if one cannot be tested and why.

## Hand-over

Say that committing the plan by itself is the approval, and give the first step's commit
message. Then stop; implementation is a separate session per step, with the model the
engineer chooses (`docs/examples.md` has the table).
