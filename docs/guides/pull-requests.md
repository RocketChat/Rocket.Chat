# Opening & handling Pull Requests

**Who this is for:** engineers opening a PR against Rocket.Chat and responsible
for driving it to merge.

**After reading this you will:** know how our PR automation decides to merge, and
the conventions your PR must follow so it isn't stuck in a forgotten queue.

> Community contributors: the milestone and ownership rules below are internal;
> the rest applies to everyone.

---

## How a PR gets merged

PRs are merged **automatically** as soon as they meet all of:

- At least one approval — and **all** code owners have approved.
- No unresolved review conversations.
- All CI checks green.
- A QA label: `stat: QA skipped` or `stat: QA tested`.

So the rules below exist to get a PR into that state cleanly.

---

## 1. Start your work as a draft

Opening a PR as **Ready to review** notifies the team. If they open it and find
CI failures, a thin description, or missing changes, they read it as incomplete,
move on, and your PR loses momentum into a forgotten queue.

Open as **draft**, then before flipping to Ready to review:

- Write tests for the problem you're solving.
- Have a colleague sanity-check it looks minimally right.
- Have a colleague test that the solution does what it should.
- Get the title right (see rule 3).
- Make sure the description is good (rule 4).
- List all related issues in the description.
- Confirm all CI checks pass.

Only then move it from Draft to Ready to review.

## 2. Set the milestone

*(Internal — not community members.)* When you start a task you know which
release it targets — fix, improvement, or chore. Set the milestone so releasers
can track PRs still pending for a release.

## 3. The title matters

Our changelog is written for the person **running** Rocket.Chat, not the
developer. We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
with Rocket.Chat-specific semantics:

| Prefix | Meaning |
|--------|---------|
| `regression:` | A bug **introduced during this dev cycle** and fixed before release — never seen in production. Omitted from the changelog. |
| `chore:` | Things the end user doesn't care about: CI tweaks, behavior-preserving rewrites, tests. |
| `feat:` | New functionality. Ships in a **future** release — never backported. |
| `fix:` | A fix or small behavior change to an existing area. |
| `chore!:` / `feat!:` / `fix!:` | **Breaking change** — removed or changed functionality the customer must be told about. Waits for a **MAJOR** release, which can take a while. |

Make the title genuinely describe the change — it becomes a changelog line.

## 4. Write a real description

Every PR needs a description that names the areas of code, the feature, and the
expected behavior — enough for anyone (engineering, product, community) to
understand its purpose at a high level. The PR template has a section for this.

## 5. Add automated tests

You already test your change by hand — good. Turn that into **automated tests**
(unit and e2e). It's the difference between one review round and several. See
[Run the tests](../getting-started.md#7-run-the-tests).

## 6. Own your PR

*(Mostly internal.)* You are responsible for your PR: requested changes,
questions, conflicts, deadlines, and chasing reviews. No one is more invested in
your delivery than you — keep your PRs sharp and moving. Give reviewers and QA a
**comfortable deadline**; a 10,000-file PR dropped on them at the last minute
won't get a proper review.

## 7. Keep PRs small and self-contained

Small, focused PRs are easier to review. If your work spans multiple features or
areas, use the **feature-branch** approach — a shared branch that collects the
pieces as a reviewed bundle (example:
[#25570](https://github.com/RocketChat/Rocket.Chat/pull/25570)). It allows
multiple checks and tends to reduce bugs.

## 8. Comment your thinking in the code

We're open source: every PR can be read by the community and by engineers from
other areas. Inline comments that capture your line of thought — the "calculation
memory" behind a decision — help all of them.

## 9. Review actions & accountability

Review process is defined per chapter, with **code owners as gatekeepers**.
General rules:

- Code Owners approval is enforced on every PR.
- When a reviewer requests changes or comments, **only that reviewer** marks the
  conversation resolved. If someone else resolves it, they become accountable for
  what follows.
- Whoever **dismisses** a review is accountable for the steps taken on the PR
  afterward.

---

See also: [Reviewing a Pull Request](./reviewing.md) ·
[Development workflow & standards](./development.md).
