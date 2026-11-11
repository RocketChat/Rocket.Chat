---
status: draft
standards: []
adrs: []
code: []
tests: []
---

# Spec: <capability>

## Summary

One paragraph. What the capability does, from the point of view of a user on either side
of the federation.

## Motivation

Why it exists, or why it is wanted. For a `not-planned` spec, why it is absent. Link the
intent that produced the spec when there is one.

## Behaviour

Numbered requirements. Each is observable from outside the package: a stanza sent, a
document stored, an error answered, an event emitted. Use MUST for what the code is held
to and SHOULD for what it does when nothing prevents it.

- **R1** …
- **R2** …

## Design

How the code meets the requirements: the modules involved, who owns which state, the flow
for the main cases. Coarse enough to survive a rename. For a `planned` spec, write
"decided in the plan" and leave it at that.

## Out of scope

What this capability deliberately does not do, with the reason when it is not obvious.
Parts of a standard that are not implemented go here.

## Known defects

Gaps between the requirements above and the code. Each is a `### D<n> <heading>` so it can
be linked. Say what happens, what causes it when known, and which skipped test pins it.

### D1 <heading>

…

## Open questions

Decisions nobody has made yet, one per bullet, numbered `**Q1**`, `**Q2**`, … and never
renumbered.

## References

Standards with section numbers, ADRs, related specs.
