---
name: sdlc-intent
description: >
  Write an intent for a spec-first package: docs/intents/SLUG.md, saying what is wanted and
  why, never how, with numbered open questions. Use whenever someone asks for a new feature,
  capability or behaviour in a package that has docs/templates/spec.md (a spec-first
  package), describes something its users cannot do, says "intent", or jumps straight to
  "build X" or "how should we implement X" for a capability no spec covers: the intent comes
  first. Not for bugs in behaviour a spec already promises; those are defects.
---

# Write an intent

An intent is the first stage of the spec-first loop: the problem in its author's words,
the outcome they want, and the questions that must be answered before anyone writes a
requirement. A spec is argued over requirement by requirement, and that argument is only
productive once everyone agrees on the problem. The intent is accepted by a reviewer before
a spec exists, and stays in the repository as the record of why the capability exists.

## Find the package

The package is the one the request names, or the nearest directory above the current one,
or above the files being discussed, that contains `docs/templates/spec.md`. Paths below are
relative to it.

- No such directory: the package is not spec-first. Say so and offer the `sdlc-setup` skill.
- The package ships its own intent skill (`ee/packages/xmpp-server` has `xmpp-intent`): use
  that one; it carries the package's specifics.

Read `docs/README.md` ("The loop", "A new capability") and `docs/templates/intent.md`. They
hold the rules; this skill adds the procedure.

A fast model is enough: the work is an interview and a one-page document.

## Procedure

1. **Check it is not already covered.** Read the list of specs in `docs/specs/` and the spec
   nearest to the request.
   - A requirement already promises the behaviour: this is a defect, not an intent. Say so
     and point at "A bug found in the field" in `docs/README.md`. Stop.
   - A spec lists it under Out of scope, or has status `not-planned`: quote the reason given
     and ask whether it still holds. An intent is how that reason gets overturned.
   - An intent for it already exists: work on that one instead.
2. **Interview in one turn.** Ask everything at once, then wait:
   - Who is missing what, and how does it show? (which users, what they try, what they see)
   - What external contract could serve it? A standard, an upstream API, a product
     requirement. Offer the candidates you know, with section numbers.
   - What must not change? Read `docs/adr/` and name the ADRs that constrain this.
   - Which existing specs are touched, and how would their status change?
   - Is there a deadline or a product requirement behind it?

   When the engineer cannot answer now, or nobody is there to answer, write the draft from
   what you have: every unanswered point becomes an open question. Reviewing the intent is
   where they get answered.
3. **Write `docs/intents/<slug>.md`** from the template, `Status: draft`, in the author's
   words. The slug names the capability (`room-history`), not a standard or a ticket. Keep
   Problem to one paragraph. Proposed outcome is observable, not a design: if you catch
   yourself naming a module, a function or a flow, move it to Open questions as a choice,
   with what each option costs.
4. **Update the package's index**, if `docs/README.md` says it keeps one that intents feed
   (XMPP's compliance matrix gets a row with status `intent`), in the same commit.
5. **End** with the file path, the open questions, and two facts: the intent is not accepted
   until its questions have answers, and acceptance is a reviewer changing `Status` to
   `accepted` in a PR. Suggest the commit message
   `docs(<package short name>): intent for <slug>`.

## What not to do

- Do not propose a design or choose between options. List the choice as an open question.
- Do not write the spec, a plan or code in the same session, however obvious the next step
  looks. The spec comes after acceptance, with `sdlc-spec`.
- Do not rewrite the author's problem into product language. Their words are the record.
