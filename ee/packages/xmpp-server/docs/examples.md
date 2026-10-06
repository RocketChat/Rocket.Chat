# Worked examples

[README.md](README.md) states the rules. This file shows the process being used: for each
kind of change, the situation, the prompt to type into Claude Code, what comes back, and what
to check before committing. The material is real where the repository has it (the
`room-history` intent, the `hosted-muc` defects); where a stage has not happened yet, the
example shows the shape and says so.

## Which model to run each stage with

A skill cannot switch the model. Run `/model <alias>` first, then the slash command.

| Stage | Model | Why |
| --- | --- | --- |
| `/xmpp-intent` | `sonnet` | An interview and a one-page document in your own words from a template; the reading is one compliance table and one spec. Quick turns matter more than depth. `opus` when the problem spans several specs. |
| `/xmpp-spec`, create or review | `opus` | Requirements must be observable, cite the right section of the standard and not contradict an ADR; a wrong reading here costs a whole plan round. `fable` when the standard interacts with several others (archive queries with stanza ids, deduplication and history on join). |
| `/xmpp-plan` | `opus`, in plan mode | The plan is the most leveraged document: a wrong order or a missing Proof row is paid for in every step. `fable` when the plan crosses into Meteor or the data model. |
| Implementing a plan | `sonnet` for steps the plan calls routine; `opus` for steps the Risks section names, and for any step whose test fails for a reason the plan did not foresee | Each step already names the `R` it proves and the test that proves it. `opusplan` gives this split when you plan and build in one session. `/fast` pays off on long Opus runs against ejabberd. |
| Recording a defect | `sonnet` | A `D` entry and an `it.skip` from a reproduction you already have. |
| Fixing a defect | `opus` | The cause is rarely where the symptom is; hosted-muc D1 was a recipients list built after the delete. |
| Reviewing a PR | `opus` | Reads the spec diff as carefully as the code diff. |

These are starting points, not measurements. The process catches a model that falls short:
the Proof table names the test that proves each `R`, and the review checklist reads every
spec change.

## Recording a defect found in the field

Situation: testing against ejabberd showed that a topic changed in Rocket.Chat reaches only
whoever joins the hosted room next. Nobody had written it down.

```text
/model sonnet
A topic changed in Rocket.Chat never reaches the XMPP occupants already in the hosted
room; only the next newcomer sees it. Record it as a known defect in the hosted-muc
spec with a skipped end-to-end test, following docs/README.md.
```

Claude found the requirement it violates (`hosted-muc R2` only promises the subject to the
next newcomer, and XEP-0045 §8.1 says the room broadcasts a new subject), added the entry
under Known defects:

```markdown
### D3 A new topic does not reach occupants already in the room

XEP-0045 §8.1 has the room send every occupant a message carrying the new `<subject/>` when
it changes. A topic changed in Rocket.Chat becomes the subject only for whoever joins next
(R2); occupants already in the room keep the old one. Where: `MucRoom.setSubject` stores the
subject without broadcasting it. Test: `hosted-muc.spec.ts`, "tells occupants already in
the room about a new topic".
```

and the test that pins it, in `tests/end-to-end/hosted-muc.spec.ts`:

```ts
// Known defect: ../../docs/specs/hosted-muc.md#d3-a-new-topic-does-not-reach-occupants-already-in-the-room
it.skip('tells occupants already in the room about a new topic', async () => {
```

Check: the entry says what happens, where, and which test; the anchor in the comment is the
heading's slug; the test asserts the right behaviour, not the broken one. Commit both
together. The body cites the id, as in commit 697dc62899:

```text
docs(xmpp-server): record that hosted rooms miss topic changes and outlive deletion

hosted-muc D3: a topic changed in Rocket.Chat reaches only whoever joins next,
never the occupants already in the room. hosted-muc D4: ...
```

## Fixing a known defect

```text
/model opus
Fix hosted-muc D1.
```

Expected sequence: Claude reads the `D1` entry and the test it names, changes `it.skip` to
`it`, runs it against ejabberd (`yarn test:e2e`, see [operations.md](operations.md)) and
shows it failing, fixes `MucRoom.kick`, runs it green, then deletes the `D1` entry and the
`// Known defect:` comment. One commit, body `hosted-muc D1: ...`. No plan: the fix is local.

Check: the diff deletes the entry and un-skips the test in the same commit; no `R` text
changed, because the spec already required the behaviour; `D1` is not reused later.

## Writing an intent

Situation: remote occupants of hosted rooms see nothing that was said before they joined.
No spec covers history for hosted rooms.

```text
/model sonnet
/xmpp-intent remote occupants of hosted rooms get no history on join
```

The skill first checks [compliance.md](compliance.md) and the nearest spec. `hosted-muc`
lists history on join under Out of scope, so this is a missing capability, not a defect.
It then asks, in one turn:

- Who is missing what, and how does it show? (an XMPP user joins and sees an empty room;
  their client offers "load earlier messages" and nothing comes)
- Which standards could serve it? (XEP-0045 §7.2.14 discussion history, XEP-0313 MAM)
- What must not change? (ADR 0008: only hosted rooms are exposed; no new storage)
- Which other specs are touched? (`service-discovery` gains a feature;
  `message-deduplication R7` if stanza ids are stamped)

With the answers it writes [intents/room-history.md](intents/room-history.md) with
`Status: draft`, adds the XEP-0313 row to the matrix with status `intent`, and ends with the
open questions:

- Discussion history on join only, MAM only, or both?
- How much history on join: a fixed count, the client's `<history/>` request, or the room's
  retention?
- Does MAM on user JIDs belong to this intent or is it never wanted?
- Where do stanza ids come from for messages stored before this ships?

Check: the intent describes a problem and an observable outcome, never a design; every
constraint names the ADR or spec it comes from; the open questions are the ones a reviewer
would ask. It stays `draft` until they have answers. Acceptance is a reviewer changing the
status to `accepted` in a PR.

## Writing a spec from an accepted intent

This stage has not happened for `room-history` yet; what follows is the shape.

```text
/model opus
/xmpp-spec docs/intents/room-history.md
```

The skill reads the intent, the specs it names, the ADRs under Constraints and the cited
sections of XEP-0045 and XEP-0313, then writes `docs/specs/room-history.md` from the
template:

```yaml
---
status: draft
standards: [XEP-0313, XEP-0059]
adrs: [0008]
code: []
tests: []
---
```

Requirements are written so a peer could check them. Two in the style the README asks for:

```markdown
- **R1** A join presence carrying `<history maxstanzas='N'/>` is answered, after the
  occupant presences and before the subject, with the last N stored messages of the room
  as `groupchat` messages carrying `<delay/>` (XEP-0045 §7.2.15), oldest first.
- **R2** Messages the joining user could not see in Rocket.Chat, because they were not a
  member when the message was sent to a private group, MUST NOT be sent.
```

Design says "decided in the plan". Out of scope lists the parts of XEP-0313 left out and
why. The matrix rows for XEP-0313 and XEP-0059 move from `intent` to `draft` in the same
commit, and Motivation links the intent.

Check: every `R` is visible from outside the package, names the case, says MUST or SHOULD,
and cites a section. Review the `R` list as hard as code: it is what the tests will cite.
When the review agrees, change the status to `planned`.

## Reviewing a drafted spec

Situation: [specs/chat-states.md](specs/chat-states.md) was drafted from the XEP and has
three open questions.

```text
/model opus
/xmpp-spec docs/specs/chat-states.md
```

Given a `draft` spec instead of an intent, the skill reviews. It walks each open question
and each `R` against the rules in "Writing a spec", rewrites in place any `R` that cannot be
observed or that names no case, and ends with either "ready for `planned`" or the list of
what blocks it, for example the rooms question (`R7`) that needs a decision before a plan.

Check: the rewritten `R`s mean the same thing or the change is intended; nothing was
renumbered. The status change to `planned` is your edit, not the skill's.

## Planning

Situation: `chat-states` has been agreed and is `planned`.

```text
/model opus
```

Enter plan mode, then:

```text
/xmpp-plan docs/specs/chat-states.md
```

The skill reads the spec, ADR 0006, the files the spec's `code` list names, and
[architecture.md](architecture.md), and produces `docs/plans/chat-states.md`: files that
change, order of work as one-commit steps each naming the `R`s it satisfies, risks, and the
Proof table:

```markdown
| Requirement | Proven by |
| --- | --- |
| R1 | `tests/end-to-end/direct-messages.spec.ts`, "sends composing when a local user starts typing (chat-states R1)" |
| R2 | ... one row per R the plan touches |
```

Check: every `R` the plan touches has a Proof row with a real test name; the order puts the
parser and the outbound trigger before anything that depends on them; the Risks section says
what a peer could disagree with. Commit the plan by itself; that commit is the approval.
Then implement step by step (see the model table), and in the PR mark the plan `done`, fill
in the spec's Design, `code` and `tests`, move its status, and update the matrix rows.

## Changing the behaviour of an implemented capability

No skill; edit the requirement in the same PR as the code. Change the text of the `R` in
place when the meaning survives, or strike it through and add a new `R` at the end when an
old citation would mislead. If the change reverses an ADR, write a new one that supersedes
it. If the change needs design, set the spec back to `planned` and run `/xmpp-plan` for a
second round (`plans/<slug>-2.md`).
