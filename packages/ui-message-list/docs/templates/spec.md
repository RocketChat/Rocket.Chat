---
status: draft
adrs: []
code: []
tests: []
---

# Spec: <capability>

## Summary

One paragraph. What the capability does, from the point of view of whoever uses the
package.

## Motivation

Why it exists, or why it is wanted. For a `not-planned` spec, why it is absent. Link the
intent that produced the spec when there is one.

## Behaviour

Numbered requirements, grouped under bold headings by situation. Each is observable from
outside the package (see "Writing a spec" in [../README.md](../README.md)). Use MUST for what
the code is held to and SHOULD for what it does when nothing prevents it.

- **R1** …
- **R2** …

## Design

How the code meets the requirements: the modules involved, who owns which state, the flow
for the main cases. Coarse enough to survive a rename. For a `planned` spec, write
"decided in the plan" and leave it at that.

## Out of scope

What this capability deliberately does not do, with the reason when it is not obvious.

## Known defects

Gaps between the requirements above and the code. Each is a `### D<n> <heading>` so it can
be linked. Say what happens, what causes it when known, and which skipped test pins it.
Write "None." when there are none.

## Open questions

Decisions nobody has made yet, one per bullet, numbered `**Q1**`, `**Q2**`, … and never
renumbered. Write "None." when there are none.

## References

Standards with section numbers, upstream documentation, ADRs, related specs.
