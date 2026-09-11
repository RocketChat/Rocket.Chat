# Code comments

Comments are code: they are reviewed, they are merged, and they rot. This document
defines when a comment earns its place in this repository, how long it may be, and
what must never be committed as a comment.

It exists because AI-assisted contributions changed the economics. Writing a
twenty-line explanation used to cost the author twenty lines of effort, which kept
volume honest. It now costs nothing, so the cost lands entirely on reviewers and on
everyone who reads the file later. The rules below restore the balance.

## The one rule

**A comment explains what the code cannot: why.** Everything else is noise.

If a reader can learn it by reading the line below, deleting the comment loses
nothing. If they would have to read a ticket, a spec, a vendor's docs, or a
post-mortem, the comment earns its place.

```ts
// Bad — restates the code
// Skip URL generation for embedded providers.
if (isEmbedded(provider)) {
    return '';
}

// Good — states the constraint that is not in the code
// Embedded providers render inline; the empty string is what tells the client
// there is nothing to open.
if (isEmbedded(provider)) {
    return '';
}
```

## Budget

These are review thresholds, not hard limits. Exceeding one is allowed — it just
has to be worth defending in review.

| Thing | Budget |
| --- | --- |
| A single comment block | **≤ 6 lines.** Longer needs a reason. |
| Comment lines in a PR's non-test production code | **≤ 10% of added lines.** |
| Consecutive `//` lines above one statement | **≤ 4.** More means the code needs a named function, not prose. |

For calibration, measured on this repository's `apps/meteor/server`,
`apps/meteor/lib` and `packages/*/src` TypeScript (tests excluded):

- comment lines are **4.3%** of all lines;
- the median JSDoc block is **5 lines**, the 90th percentile is **10**;
- a run of `//` lines is **1 line** at the median and **3** at the 95th percentile.

[PR #41934][pr] sat at **32.8%** on production code — roughly 7.6× the repository's
own norm — with 408 added comment lines in a single file. That ratio, not any
individual comment, is what reviewers reacted to.

## Register

Write like the rest of the file: technical, declarative, present tense. The comment
is a note to the next engineer, not an essay.

Avoid narrative and metaphor. They read as padding on the second encounter and they
do not survive translation for our non-native-English contributors.

```ts
// Bad — literary, and three times longer than the fact it carries
/**
 * How long one renewal is good for.
 *
 * Long enough to survive throttling (two missed ticks at a browser's throttled
 * rate) and a brief network drop, short enough that a ghost in the members list
 * is a curiosity rather than a lie. It doubles as the grace period a departing
 * member gets before their absence is written, which is why this is also what a
 * restart waits out.
 */

// Good — same facts, reviewable at a glance
/** Lease TTL. Covers two throttled heartbeats (~1/min in background tabs) plus
 *  network jitter, and doubles as the grace period before a departure is written. */
```

Both say the same thing. The second is four lines instead of nine, and a reviewer
can check it against the constant.

## Never commit

1. **Session narration.** `// Now we need to...`, `// Let's handle the case where...`,
   `// This was the tricky part.` The reader was not in your session.
2. **Change history.** `// Changed from X to Y`, `// Previously this used Z`,
   `// Added in the refactor.` Git owns this. A comment about the past goes in the
   commit message or the PR description.
3. **Analysis output.** Comparisons of approaches you rejected, enumerated edge
   cases you checked, confidence statements, "verified that…". That belongs in the
   PR description, where it is read once and then archived — not in a file that is
   read forever.
4. **Duplicated explanations.** If the same reason applies at four call sites, it
   belongs on the function they all call. In [PR #41934][pr] `// Auto-follow the
   thread for anyone who joined between call creation and message creation.`
   appears verbatim three times.
5. **Commented-out code.** Delete it.
6. **Restatements.** `// Loop over users`, `// Return the result`,
   `/** The user's id. */` on `userId: string`.

## Standalone analysis documents

Do not commit files such as `IMPLEMENTATION_SUMMARY.md`, `ANALYSIS.md`,
`FINDINGS.md` or `REVIEW_NOTES.md` describing how a change was arrived at.

Where reasoning belongs:

| Reasoning | Goes in |
| --- | --- |
| Why this change, what it does | PR description |
| Why this design over alternatives | [`docs/adr/`](adr/) — an ADR, reviewed as such |
| How a subsystem works, for future readers | [`docs/features/`](features/) |
| Why this specific line is odd | A comment on that line |
| What you tried and abandoned | Nowhere. The PR conversation, at most. |

`docs/` is a reference manual, not a session log. A doc is committed because
someone will need to read it later, not because it was produced.

## Where a long comment is right

Length is not the problem; unearned length is. A long block is correct when it
documents something a reader genuinely cannot reconstruct:

- a protocol or wire-format constraint;
- a workaround for an upstream bug, **with a link to the issue**;
- a non-obvious invariant a future edit would silently break;
- a security or performance constraint with a measurement behind it.

```ts
// Mongo supports the `x` (extended) regex flag and JS does not, so a stored
// pattern that uses it would throw on the client. Strip it rather than reject the
// setting — see RC-1234.
```

Note the shape: constraint, consequence, reference. No narration.

## JSDoc

Use JSDoc for exported functions, types and constants whose contract is not obvious
from the signature. Skip it when the signature already says everything — TypeScript
is the documentation.

```ts
// Bad — the type already says this
/**
 * Gets the user by id.
 * @param userId The id of the user.
 * @returns The user.
 */
export function getUser(userId: string): Promise<IUser> {}

// Good — no JSDoc needed
export function getUser(userId: string): Promise<IUser> {}
```

Omit `@param`/`@returns` when they only restate typed names. Add them when a
parameter has a constraint the type cannot express (a unit, a range, a required
ordering).

## For AI-assisted contributions

Agents follow instructions literally and have no sense of proportion about volume.
State the budget explicitly in your prompt, and review the diff for comments as a
separate pass before opening the PR.

A practical prompt addition:

> Comment only where the reason is not recoverable from the code. No comment block
> over 6 lines. No narration, no change history, no restating the code. Do not
> create summary or analysis markdown files.

The repository's agent definitions in [`.github/agents/`](../.github/agents/) carry
these rules already.

## Review checklist

- [ ] Every comment answers *why*, not *what*.
- [ ] No block over 6 lines without a reason that survives being asked about.
- [ ] No narration, no change history, no analysis dumps, no commented-out code.
- [ ] Repeated explanations moved to the shared function.
- [ ] Workarounds link to the issue they work around.
- [ ] No new `*_SUMMARY.md` / `*_ANALYSIS.md` files.

Reviewers: "this comment doesn't earn its place" is a complete and sufficient
review comment. Deleting a comment is not a nit.

[pr]: https://github.com/RocketChat/Rocket.Chat/pull/41934
