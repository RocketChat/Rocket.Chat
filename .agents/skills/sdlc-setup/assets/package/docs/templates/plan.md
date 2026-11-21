# Plan: <title> (from specs/<slug>.md, <YYYY-MM-DD>)

Status: approved.

## Files that change

Every file, with one line on what changes in it. New files say so. The spec itself (Design,
`code`, `tests`, status) is the last entry.

## Order of work

Numbered steps, each small enough to be one commit, each naming the requirements it
satisfies. A step that adds behaviour adds its test in the same step. A fresh engineer, or a
fresh agent session, can implement any step from this file alone.

## Risks

What could break, which consumers could read the requirements differently, which data could
be left in a bad state if the work stops halfway, which existing requirement could regress.

## Proof

| Requirement | Proven by |
| --- | --- |
| R1 | `path/to/file.spec.ts`, "test name (R1)" |

Every `R` the plan touches has a row. A defect being fixed lists the test that is un-skipped.
A requirement that cannot be tested says why.
