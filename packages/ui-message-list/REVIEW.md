# Reviewing changes to @rocket.chat/ui-message-list

For people and review agents alike. A review reports findings; it does not approve or block
on its own. A code owner approves, and the agent that wrote a change never does.

## Passes

Read the diff once per pass, in this order.

1. **Conformance**: the change against its spec, plan and ADRs.
   - Every behaviour change has a matching spec change in the same diff, and every spec
     change has the code that makes it true, or a `D` entry that says it is not true yet.
   - New and changed tests name the `R` they prove. A fixed defect's test runs, and its `D`
     entry is gone.
   - The code follows the committed plan, or the plan changed in the same commit.
   - Spec status, plan status and the spec's `code` and `tests` lists agree with the diff.
   - A choice someone could want to reverse has an ADR; no merged ADR was edited.
   - Spec diffs get the same care as code: a reworded `R` changes what the code is held to,
     and ids are never renumbered.
2. **Correctness**: bugs and logic errors, including cases a requirement names and the code
   misses.
3. **Security**: input from outside the package checked before use, permissions enforced
   where the spec says, no secrets or credentials in the diff.
4. **Repository rules**: the root `CLAUDE.md` and the docs it indexes: comments state intent,
   database access goes through model methods, one concern per pull request.

Package checks:

- Conformance: components reach the app only through context capabilities; nothing imports
  from `apps/meteor`.
- Correctness: scroll behavior goes through the row model and the scroller, never `scrollTop`
  writes or hand-computed row indexes; `keepMounted` holds no UI-state rows.
- Behavior that scrolls or measures is proven by a Storybook play test, not jsdom.

## Severity

- **Important**: wrong behaviour, a requirement without proof, a spec and code that disagree,
  a security issue, an edited ADR, a weakened pinned test. Resolved before merge.
- **Nit**: naming, wording, style no linter enforces. At most five per review; keep the five
  that matter most.

## Skip

- What the checks already enforce: types, lint, formatting, `sdlc:check`.
- Generated files and lockfiles.
- Summaries of what the diff does. Findings only.

## Keeping this checklist useful

When a defect gets past review, add the check that would have caught it here, and an eval to
`evals/`. When a check produces findings nobody acts on, remove it.
