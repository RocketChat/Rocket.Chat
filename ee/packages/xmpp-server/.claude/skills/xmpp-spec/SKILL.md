---
name: xmpp-spec
description: >
  Write or review a capability spec for the XMPP server package. Given an accepted intent,
  writes docs/specs/<slug>.md with observable, numbered requirements and the compliance
  rows. Given a draft spec, reviews every requirement and open question against the
  package's rules and says whether it is ready to be planned. Use whenever someone in
  ee/packages/xmpp-server says "spec", "requirements", "R list", wants to turn an intent
  into something testable, or asks whether a spec is ready for a plan.
arguments: [source]
---

Run this with `/model opus`; use `fable` when the standard interacts with several others.
If the session is on a smaller model, say so in one line before starting: a requirement
that misreads the standard costs a whole plan round.

Read `docs/README.md` ("Writing a spec", "Lifecycles", "Statuses") and
`docs/templates/spec.md` first. The checklist each requirement must pass is in
`references/requirement-checklist.md`; read it before writing or judging an `R`.

## Which mode

`$source` is an intent (`docs/intents/<slug>.md`): **create** a spec.
`$source` is a spec with `status: draft`: **review** it.
Anything else (an implemented spec, a planned one): say that this skill does not apply and
point at "Changing the behaviour of an implemented capability" in the README or at
`/xmpp-plan`.

## Create

1. Read the intent, every spec and ADR it names, and the sections of the standards it
   proposes. Fetch the XEP or RFC text when you are not sure of a section; a wrong section
   number is worse than none.
2. Write `docs/specs/<slug>.md` from the template with `status: draft`, the same slug as
   the intent. Summary is one paragraph from the point of view of a user on either side.
   Motivation links the intent.
3. Behaviour is the spec. Number the requirements `R1`, `R2`, …, group them under bold
   headings by situation (lifecycle, joining, messages), and make each one pass the
   checklist: visible from outside the package, names the case, says MUST or SHOULD, cites
   the section it implements. Prefer several narrow `R`s over one broad one; the tests will
   cite them one by one.
4. Design says "decided in the plan". Out of scope lists every part of the standard left
   out, with the reason when it is not obvious; this list is what makes the status
   `partial` later. Known defects says "None; not implemented." Open questions holds what
   the intent left open and anything you found.
5. Frontmatter: `standards` lists every standard an `R` cites; `adrs` lists the ones the
   intent's Constraints named; `code` and `tests` stay empty.
6. In `docs/compliance.md`, add or update one row per standard with status `draft` and this
   spec as owner, in the same commit. A standard shared with another spec keeps both
   owners.
7. End with the requirements that you are least sure read the standard correctly, so the
   reviewer looks there first.

## Review

1. Read the spec, the ADRs it lists and the standard sections it cites.
2. Walk each open question. Where the answer is already in an ADR or another spec, say so
   and propose the `R` text that follows. Where it needs a human decision, leave it.
3. Walk each `R` against the checklist. Rewrite in place one that fails; never renumber,
   never delete. Say what you changed and why in your reply, not in the spec.
4. Check Out of scope covers every part of the standard the `R`s do not, and that
   `standards` in the frontmatter matches what the `R`s cite.
5. End with one of two verdicts: "ready for `planned`", or the list of open questions that
   block it. Do not change the status yourself: that edit is the reviewer's, in the PR.

## Boundaries

- Never write code or a plan here. If a requirement can only be stated by describing the
  implementation, it is a design decision: put it under Open questions for the plan.
- Never edit `docs/compliance.md` without the spec change that justifies it.
- A spec diff changes what the code is held to. Keep it reviewable: no reformatting, no
  moving sections.
