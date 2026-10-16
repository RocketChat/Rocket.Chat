---
name: xmpp-intent
description: >
  Write an intent for a capability the XMPP server package lacks: an intents/<slug>.md
  that says what is wanted and why, never how. Use whenever someone describes something an
  XMPP user or a Rocket.Chat user cannot do over federation, names a XEP or RFC the
  compliance matrix lists as missing or not-planned, asks for a "new feature" in
  ee/packages/xmpp-server, or says "intent". Use it even when they jump straight to a
  design: the intent comes first.
arguments: [problem]
---

Run this with `/model sonnet`. If the session is on another model, say so in one line and
carry on; the work is an interview and a one-page document.

The process is in `docs/README.md` ("The loop", "A new capability"). The template is
`docs/templates/intent.md`. Read both before writing; this skill adds the procedure, not
the rules.

## Why an intent and not a spec

A spec is argued over requirement by requirement. That argument is only productive once
everyone agrees on the problem. The intent captures the problem in the author's words,
lists the open questions, and is accepted by a reviewer before anyone writes an `R`. It
stays in the repository as the record of why the capability exists.

## Procedure

1. **Check it is not already covered.** Read `docs/compliance.md` and the spec nearest to
   the problem. If a requirement already promises the behaviour, this is a defect, not an
   intent: say so and point at "A bug found in the field" in the README. If the standard is
   in the Not planned table, say what reason was given and ask whether it no longer holds.
2. **Interview in one turn.** Ask everything at once, then wait:
   - Who is missing what, and how does it show? (which side of the federation, which
     client, what they see)
   - Which standards could serve it? Offer the candidates you know, with section numbers.
   - What must not change? Check `docs/adr/` and name the ADRs that constrain this.
   - Which existing specs are touched, and how would their status change?
   - Is there a deadline or a product requirement behind it?
3. **Write `docs/intents/<slug>.md`** from the template, in the author's words, with
   `Status: draft`. The slug is the capability, not the standard (`room-history`, not
   `xep-0313`). Keep Problem to one paragraph. Proposed outcome is observable, not a design:
   if you catch yourself naming a module or a flow, move it to Open questions as a choice.
4. **Add the matrix row.** If the intent names a standard with no row in
   `docs/compliance.md`, add one with status `intent` and the intent as owner, in the same
   commit.
5. **End with the open questions**, one per bullet, and say that the intent is not accepted
   until they have answers. Suggest the commit message
   `docs(xmpp-server): intent for <slug>`.

## What not to do

- Do not propose a design or pick between standards. List the choice as an open question
  with what each option costs.
- Do not write a spec in the same session. Acceptance is a reviewer changing the status to
  `accepted` in a PR; the spec comes after that, with `/xmpp-spec`.
- Do not paraphrase the author's problem into product language. Their words are the record.

## Output

The file path, the open questions, and the commit message. Nothing else needs saying.
