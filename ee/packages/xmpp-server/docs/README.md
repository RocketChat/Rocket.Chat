# How this package is developed

`@rocket.chat/xmpp-server` is developed spec-first. Every capability the package offers, or
is meant to offer, has a written spec in this folder. Work starts by writing or changing a
spec, continues with a plan derived from it, and ends with code whose tests cite the spec.
Decisions that constrain future work are recorded as ADRs. Nothing in this folder is
generated; it is the source the code is held against.

This differs from the rest of the repository, where features are described after the fact in
`docs/features/`. The root-level [docs/features/xmpp-server.md](../../../../docs/features/xmpp-server.md)
only points here.

## The loop

| Stage | Input | Output | Who |
| --- | --- | --- | --- |
| Plan | an idea, a ticket, a defect found in production | `intents/<slug>.md` | whoever wants the change, approved by the package owner |
| Design | an accepted intent | `specs/<slug>.md`, status `planned` | author plus Claude, reviewed by the package owner |
| Build | a planned spec | `plans/<slug>.md`, then code and tests | the engineer, with Claude in plan mode |
| Test | the diff | proof for every requirement the plan lists | the engineer |
| Deploy | the PR | merged, spec status moved to `implemented` or `partial` | reviewers |
| Maintain | a defect report, a metric, a peer that misbehaves | a `D` entry in the spec, or a new intent | whoever finds it |

A defect is a gap between a spec and the code. It is written into the spec it violates as a
`D<n>` entry together with a skipped test that pins it. A fix un-skips the test and removes
the entry in the same PR.

A wanted capability that has no spec starts as an intent. An intent says what is wanted and
why; it does not say how. Once accepted, it becomes a spec, and the intent file stays as the
record of the motivation.

## Where things live

| Artifact | Path | Named by | Changes after it is written? |
| --- | --- | --- | --- |
| Intent | `intents/<slug>.md` | capability slug | status only |
| Spec | `specs/<slug>.md` | capability slug | yes, it is a living document |
| Plan | `plans/<slug>.md` | the spec it implements, suffixed `-2`, `-3` for later rounds | status only |
| ADR | `adr/NNNN-<slug>.md` | sequence number | never; a new ADR supersedes it |
| Compliance matrix | `compliance.md` | | whenever a spec's `standards` or `status` changes |
| Architecture | `architecture.md` | | whenever module boundaries move |
| Operations | `operations.md` | | whenever a setting, port or environment variable changes |
| Templates | `templates/` | | rarely |

A spec is one **capability**, not one standard. A capability may cover one XEP (ping) or
several (S2S connectivity covers RFC 6120, RFC 2782, XEP-0220 and XEP-0185), and a standard
may be split across capabilities (XEP-0045 is split between hosted and remote rooms). The
compliance matrix is the index from standard to spec.

## Statuses

Spec `status` in the frontmatter:

| Status | Meaning |
| --- | --- |
| `implemented` | every requirement holds; `D` entries may exist |
| `partial` | some requirements are knowingly unmet; each is listed under Out of scope or Known defects |
| `planned` | the spec is agreed and waits for a plan |
| `draft` | being written; not yet agreed |
| `not-planned` | the capability is deliberately absent; the reason is in Motivation |
| `deprecated` | superseded; the spec says by what |

Intent `Status`: `draft`, `accepted`, `rejected`. Plan `Status`: `approved`, `done`,
`abandoned`. ADR `Status`: `accepted`, or `superseded by NNNN`.

## Requirement and defect ids

Requirements are numbered `R1`, `R2`, … inside their spec and never renumbered. A removed
requirement keeps its number with the text struck through and a note. Defects are numbered
`D1`, `D2`, … the same way and are removed when fixed. Tests, plans, commits and PRs cite
them as `specs/hosted-muc.md R4` or `hosted-muc D1`.

Every `D` heading is an anchor. The skipped end-to-end test that pins the defect carries a
comment with the relative path and the anchor, for example
`// Known defect: ../../docs/specs/hosted-muc.md#d1-kicked-xmpp-users-are-not-told-they-were-removed`.

## What must move together

- Behaviour changes and the spec that describes it ship in the same PR.
- A standard added to or removed from a spec's `standards` list updates `compliance.md` in
  the same commit. The matrix is never edited on its own.
- A decision that a later reader could reasonably want to reverse gets an ADR. A decision
  that is just the obvious way to do it does not.
- A plan is committed before the code it describes, and marked `done` in the PR that ships it.

## Starting a piece of work

1. If there is no spec, write an intent from `templates/intent.md` and get it accepted.
2. Write or update the spec from `templates/spec.md`. Requirements must be observable from
   the outside: a stanza sent, a document stored, an error returned. Set status `planned`.
3. Open Claude Code in plan mode with the spec attached and produce `plans/<slug>.md` from
   `templates/plan.md`. The Proof section maps every `R` the plan touches to a test.
4. Commit the plan, then implement it. Tests name the requirement they prove.
5. In the PR: update the spec status, mark the plan `done`, and update `compliance.md` if a
   standard's status changed.

The package-level [CLAUDE.md](../CLAUDE.md) tells Claude the same rules in the form it
reads at the start of a session.
