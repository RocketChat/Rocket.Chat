# Code comments

Comment the **intent** of a function: what a caller gets, what it guarantees.
Don't narrate the implementation — the code already says how it works.

Inside a function body a comment is the exception. Use one when the reason isn't
in the code:

- a workaround for an upstream bug, with a link to the issue
- a protocol, browser or vendor constraint
- an invariant a future edit would break silently

## Let the declaration carry it

Before writing a docblock, cover it and read the signature — name, parameters,
return type. If you can write the comment back from that, delete it. If you
can't, but only because the declaration is vague, fix the declaration.

The fix is often a parameter name rather than the function's. `canRing(member,
now?)` needs no comment saying it means *now*.

An interface and its implementation are one function declared twice. Document
one of them.

## Better still, make the code say it

A comment explaining a value or a relationship is often a constant waiting to be
derived:

```ts
// three missed ticks at the rate a browser throttles a hidden tab to
const LEASE_MS = 180_000;
```

```ts
const THROTTLED_TICK_MS = 60_000;
const TICKS_TOLERATED = 3;
const LEASE_MS = THROTTLED_TICK_MS * TICKS_TOLERATED;
```

The second can't drift, because it isn't a description of the code — it is the
code. Reach for a named intermediate or a narrower type before reaching for a
comment.

## Don't explain code that lives in another file

A comment in `server/services/` describing how a React component renders can't be
kept true — nobody editing that component will ever see it. It's also feature
documentation in the wrong place: the story ends up split across a dozen files and
nobody can read it.

Put it in [`docs/features/`](features/) and keep it coarse. Document the model, not
the mechanism: if a sentence breaks because someone renamed a function or changed a
constant, it doesn't belong there.

## Where the reasoning goes

| | |
| --- | --- |
| How a subsystem works | [`docs/features/`](features/) |
| Why this design, not the alternatives | [`docs/adr/`](adr/) |
| Why this change; what you tried and dropped | PR description |
| Why *this line* is odd | a comment, right there |

Link to `docs/`, not to Confluence or Jira — this repo is public, and those are
dead ends for contributors outside the company. From code, link by path relative
to the file: it resolves on GitHub and in the editor.

## Don't commit

- narration: `// Now we need to...`
- history: `// Changed from X to Y` — that's what git is for
- analysis: alternatives weighed, edge cases enumerated, "verified that..."
- the same explanation at four call sites — put it on the function they call
  (the `TODO` directive is the exception, see below)
- commented-out code
- `*_SUMMARY.md` / `*_ANALYSIS.md` describing how a change was reached

## The `TODO` directive is not a comment

`scripts/todo-issue` turns it into an issue: the first line after the keyword
becomes the title, the comment lines under it become the body, and similar
titles collapse into one issue.

So repeating a `TODO` across call sites is fine — the repetition is what gives
the issue a body, and the duplicates are merged for you. Write the first line as
a title that stands on its own. Prose wrapped at 120 columns breaks mid-clause,
and the half that survives is the title.

## Tests

These rules are about production code. In a test the assertion already says
*what*, so a comment saying why the case is worth having earns its place, and
doesn't count against the length below.

## Length

Six lines is a lot for a comment. If you need more, either the reader needs a
feature doc or the code needs splitting.
