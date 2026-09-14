# Code comments

Comments are code: they are reviewed, they are merged, and they rot. This document
says when a comment earns its place, how long it may be, and where the reasoning
goes when it does not belong in a comment at all.

## The rule

**Comment the intent of a function. Do not narrate its implementation.**

"Why, not what" is the usual slogan, but it is ambiguous — different style guides
use "what" for opposite things — so this document uses three explicit terms:

| | Example | Comment it? |
| --- | --- | --- |
| **Intent** — what a caller gets, and what it guarantees | "Returns the members whose lease expired, and when they were last seen." | **Yes**, on exported symbols |
| **Mechanism** — the steps the code takes | "Loops over the members and compares timestamps." | **No.** The code already says this |
| **Reason** — a constraint that forced this shape | "Mongo supports the `x` regex flag and JS does not; strip it — see RC-1234." | **Yes**, where it applies |

A reader who can learn it from the line below loses nothing when the comment is
deleted. A reader who would have to open a ticket, a spec, a vendor's docs or a
post-mortem does.

## Where a comment goes

**On the head of a function, type or constant** — its intent. Default yes for
anything exported: the caller should not have to read the body to use it correctly.

**Inside a function body** — the exception, not the default. Only for information
that cannot be in the code:

- a workaround for an upstream bug, **with a link to the issue**;
- a protocol, browser or vendor constraint;
- an invariant a future edit would break silently;
- a security or performance constraint with a measurement behind it.

If a body needs several comments to be followable, the function wants splitting,
not annotating.

**Nowhere** — the mechanism. Restating the code in prose adds a second thing to
keep true and nothing to understand.

## A comment must not tell a story that lives in other files

This is the failure mode most worth naming.

A comment that explains what a symbol in *another* file does — how a component
renders, what a model writes, what a client does on receipt — is feature
documentation scattered across the codebase. It has three specific problems:

1. **Nobody can read the story.** Each fragment sits next to unrelated code. To
   reconstruct it you must open every file in the right order, which is the cost
   the comments were meant to save.
2. **It cannot co-evolve.** A comment stays true because it sits in the same file,
   the same diff and the same review as the code it describes. A comment in
   `server/services/` describing a React component has none of that: nobody editing
   the component will ever see it. It will go stale, and a stale comment is worse
   than no comment.
3. **It leaks the abstraction.** A comment in A that explains B's internals couples
   them in a way TypeScript cannot see and the compiler cannot check.

When you find yourself writing this, the content is right and the location is
wrong. It belongs in [`docs/features/`](features/).

## Where the reasoning goes instead

| Reasoning | Goes in | Why there |
| --- | --- | --- |
| How a subsystem works, the model it assumes | [`docs/features/`](features/) | One place to read; assembled instead of scattered |
| Why this design over the alternatives | [`docs/adr/`](adr/) | Reviewed as a decision, superseded rather than edited |
| Why this change, what was tried and dropped | PR description | Read once, then archived |
| Why *this line* is odd | A comment on that line | Local, and co-evolves with the code |

Three things worth knowing about that split:

**A feature doc should be coarse, and that is what makes it survive.** Document the
model and the invariants — not the mechanism, not the constants, not the function
names. *"Presence is a lease the client renews; when renewals stop, departure is
inferred; a restarted process waits out one full lease before evicting anyone"*
survives almost any refactor. The same text naming `PRESENCE_LEASE_MS` and walking
through the sweep loop is wrong after the next PR. **If a sentence would need
editing because someone renamed a function or changed a number, it does not belong
in the doc.**

**ADRs do not rot; feature docs do.** An ADR records what was decided and why, at a
point in time. It is never edited — a later decision supersedes it and the original
stays. A feature doc describes the present, so it goes wrong when the code moves.
That asymmetry is why a feature doc needs an owner and an ADR does not.

**Link from the subsystem's entry point, once.** A `see docs/features/x.md` in every
file is just the scatter again. And link to `docs/` in this repository, not to
Confluence or Jira: this is an open-source codebase, and a link a community
contributor cannot open is a dead end.

Not every feature needs a doc. Write one where there is real conceptual load — a
model a reader could not infer from the code. A CRUD endpoint does not qualify.

## Budget

Review thresholds, not hard limits. Going over is allowed; it just has to be worth
defending in review.

| | Budget |
| --- | --- |
| A single comment block | **≤ 6 lines** |
| Consecutive `//` lines above one statement | **≤ 4** |
| Comment lines in a PR's non-test production code | **≤ 10% of added lines** |

Measured on this repository's `apps/meteor/server`, `apps/meteor/lib` and
`packages/*/src` TypeScript, tests excluded:

- comment lines are **4.3%** of all lines;
- the median JSDoc block is **5 lines**, the 90th percentile **10**;
- a run of `//` lines is **1 line** at the median, **3** at the 95th percentile.

## Register

Write like the rest of the file: technical, declarative, present tense. The test:
**does this add precision, or intuition?** Narrative prose adds neither — it is not
more precise than the code, and the intuition was already in the first sentence.

```ts
// Bad — nine lines of narrative for one fact
/**
 * How long one renewal is good for.
 *
 * Long enough to survive throttling (two missed ticks at a browser's throttled
 * rate) and a brief network drop, short enough that a ghost in the members list
 * is a curiosity rather than a lie. It doubles as the grace period a departing
 * member gets before their absence is written, which is why this is also what a
 * restart waits out.
 */

// Good — same facts, checkable against the constant
/** Lease TTL. Covers two throttled heartbeats (~1/min in background tabs) plus
 *  network jitter, and doubles as the grace period before a departure is written. */
```

Metaphor reads as padding on the second encounter and does not survive translation
for contributors who do not read English natively.

## Never commit

1. **Narration.** `// Now we need to...`, `// Let's handle the case where...`
2. **Change history.** `// Changed from X to Y`, `// Previously this used Z`. Git
   owns this; a note about the past goes in the commit message.
3. **Analysis.** Alternatives weighed, edge cases enumerated, "verified that…".
   That is PR description material.
4. **The same explanation at several call sites.** It belongs on the function they
   all call, once.
5. **Commented-out code.** Delete it.
6. **Restatements.** `// Loop over users`, `/** The user's id. */` on `userId: string`.
7. **Standalone analysis files** — `IMPLEMENTATION_SUMMARY.md`, `ANALYSIS.md`,
   `FINDINGS.md` and friends. `docs/` is a reference manual, not a session log.

## JSDoc

Use it for exported symbols whose contract is not obvious from the signature. Skip
it when the types already say everything — TypeScript is the documentation.

```ts
// Bad — the signature already says all of this
/**
 * Gets the user by id.
 * @param userId The id of the user.
 * @returns The user.
 */
export function getUser(userId: string): Promise<IUser> {}

// Good
export function getUser(userId: string): Promise<IUser> {}
```

Add `@param`/`@returns` only for a constraint the type cannot express — a unit, a
range, a required ordering.

## Assisted contributions

Coding agents follow instructions literally and have no sense of proportion about
volume: the cost of writing twenty lines of explanation used to keep volume honest,
and it no longer does. State the budget in your prompt, and review the diff for
comments as a separate pass before opening the PR.

The agent definitions in [`.github/agents/`](../.github/agents/) carry these rules.

## Review checklist

- [ ] Comments state intent or a reason, never the mechanism.
- [ ] No block over 6 lines without a reason worth defending.
- [ ] No comment explains a symbol that lives in another file.
- [ ] Repeated explanations moved to the shared function.
- [ ] Workarounds link to the issue they work around.
- [ ] No narration, change history, analysis dumps or commented-out code.
- [ ] No new `*_SUMMARY.md` / `*_ANALYSIS.md` files.

"This comment doesn't earn its place" is a complete and sufficient review comment.
Deleting a comment is not a nit.
