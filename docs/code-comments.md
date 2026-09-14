# Code comments

Comment the **intent** of a function: what a caller gets, what it guarantees.
Don't narrate the implementation — the code already says how it works.

Inside a function body a comment is the exception. Use one when the reason isn't
in the code:

- a workaround for an upstream bug, with a link to the issue
- a protocol, browser or vendor constraint
- an invariant a future edit would break silently

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
dead ends for contributors outside the company.

## Don't commit

- narration: `// Now we need to...`
- history: `// Changed from X to Y` — that's what git is for
- analysis: alternatives weighed, edge cases enumerated, "verified that..."
- the same explanation at four call sites — put it on the function they call
- commented-out code
- `*_SUMMARY.md` / `*_ANALYSIS.md` describing how a change was reached

## Length

Six lines is a lot for a comment. If you need more, either the reader needs a
feature doc or the code needs splitting.
