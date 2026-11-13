---
name: sdlc-spec
description: >
  Write or review a capability spec in a spec-first package (one with docs/templates/spec.md):
  docs/specs/SLUG.md with observable, numbered requirements (R1, R2, …), Out of scope,
  known defects and open questions. Given an accepted intent, writes the spec; given a draft
  spec, reviews every requirement and says whether it is ready to be planned; given a
  capability that exists in code but has no spec, documents it. Use whenever someone in such
  a package says "spec", "requirements", "R list", wants to turn an intent into something
  testable, asks whether a spec is ready for a plan, or wants existing behaviour written down.
---

# Write or review a spec

The spec is the contract: what the package must do, in terms someone outside it can observe,
numbered so tests, plans and commits can cite each requirement. It is argued over before
code exists, because a misread requirement costs a whole plan round.

## Find the package

The package is the one the request names, or the nearest directory above the current one,
or above the file given, that contains `docs/templates/spec.md`. Paths below are relative to
it; the input may be given relative to the package or to the repository root.

- No such directory: the package is not spec-first. Say so and offer `sdlc-setup`.
- The package ships its own spec skill (`ee/packages/xmpp-server` has `xmpp-spec`): use that.

Read `docs/README.md` ("Writing a spec", "Lifecycles", "Statuses") and
`docs/templates/spec.md`. Before writing or judging any `R`, read
[references/requirement-checklist.md](references/requirement-checklist.md).

Use the most capable model available. On a smaller one, say so in one line before starting.

## Which mode

| Input | Mode |
| --- | --- |
| `docs/intents/<slug>.md` with `Status: accepted` | **Create** |
| an intent still `draft` | stop: its open questions are unanswered; point at them |
| `docs/specs/<slug>.md` with `status: draft` | **Review** |
| a capability in the code with no spec | **Document** |
| a `planned`, `implemented` or `partial` spec | not this skill: "Changing the behaviour of an implemented capability" in the README, or `sdlc-plan` |

## Create

1. Read the intent, every spec and ADR it names, and the sources it proposes. Fetch a
   standard's or an API's text when you are not sure of a section; a wrong section number is
   worse than none.
2. Write `docs/specs/<slug>.md` from the template, `status: draft`, with the intent's slug.
   Summary is one paragraph from the point of view of whoever uses the package. Motivation
   links the intent.
3. Behaviour is the spec. Number requirements `R1`, `R2`, …, group them under bold headings
   by situation, and make each pass the checklist. Prefer several narrow `R`s over one broad
   one; tests cite them one at a time.
4. Design says "decided in the plan". Out of scope lists everything the capability
   deliberately leaves out, with the reason when it is not obvious. Known defects says
   "None; not implemented." Open questions carries what the intent left open and anything
   you found, numbered `Q1`, `Q2`, ….
5. Frontmatter: `adrs` lists the ADRs the intent's Constraints named; `code` and `tests` stay
   empty. If the package keeps an index fed by spec frontmatter (the README says), update it
   in the same commit.
6. End with the requirements you are least sure of, so the reviewer looks there first.

## Review

1. Read the spec, the ADRs it lists and the sources it cites.
2. Walk each open question. Where the answer is already in an ADR or another spec, say so
   and propose the `R` that follows. Where it needs a person to decide, leave it.
3. Walk each `R` against the checklist. Rewrite in place one that fails; never renumber,
   never delete. Say what you changed and why in your reply, not in the spec.
4. Check that Out of scope covers what the `R`s leave out, and that the frontmatter matches.
5. End with one verdict: "ready for `planned`", or the open questions and requirements that
   block it. Do not change the status yourself; that edit is the reviewer's, in the PR.

## Document

For packages adopting the process with code already written. One capability per spec, one
spec per PR.

1. Read the code and the tests for the capability, and who consumes it.
2. Write the spec from the template. Requirements describe what the code does today that a
   user can observe and relies on, each passing the checklist. Where the code does something
   clearly unintended, write the `R` for the intended behaviour and record the gap as a
   `D<n>` with a skipped test that pins it, as "A bug found in the field" describes.
3. Status `implemented`, or `partial` with Out of scope listing what is deliberately absent.
   Fill `code` and `tests`. Design describes the code as it is, coarsely.
4. Append `(R<n>)` to the titles of existing tests that prove a requirement, in the same
   commit. Requirements no test proves are listed in your reply as missing proof.

## Boundaries

- Never write code or a plan here. A requirement that can only be stated by describing the
  implementation is a design decision: make it an open question for the plan.
- A spec diff changes what the code is held to. Keep it reviewable: no reformatting, no
  moving sections.
- Run `yarn workspace <package> sdlc:check` before finishing and show its output.
