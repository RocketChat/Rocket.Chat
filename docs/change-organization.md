# Organizing changes

Every change should be easy to review on its own and easy to revert on its own. With more code being generated, this matters more, not less: a reviewer can follow one concern at a time, and a revert should never take unrelated work with it.

## One concern per pull request

Classify each change before writing it:

- **fix**: corrects behavior. Ships with a test that fails without it.
- **refactor**: changes structure, not behavior. Existing tests stay green without being edited.
- **feature**: adds behavior.
- **test / chore / ci**: everything else.

A pull request carries one classification and one concern. "While I'm here" edits, flags or conditionals for hypothetical cases, and changes a reviewer would call "not related" go to their own pull request.

## Order work as a stack

When a feature needs fixes or enabling refactors, order them: **fixes → refactors → feature**. Changes that don't depend on the feature go straight to `develop` instead of into the stack.

This holds for exploratory work too. A POC may live in a single pull request, but its history is already shaped like a stack:

- Commit each fix or refactor the moment it's done, as its own commit. Never fold it into a feature commit.
- Keep fixes and refactors below the feature commits (reorder with `git rebase`; `git commit --fixup` with `git rebase --autosquash` keeps follow-ups attached to the right commit).
- Every commit builds and passes tests on its own, so it can be extracted as-is.

Then extract them one by one into their own pull requests off `develop`, until the original pull request holds only the feature. If the POC is dropped, its fixes and enabling refactors are still extracted: that work isn't lost with the feature.

When a large mixed pull request already exists, propose the split before touching it: a table of each concern, its files, its size and what it depends on.

## Working with a stack

Pull requests are squash-merged, so a child's history no longer contains its parent's commits once the parent lands:

- When a parent merges, rebase the child onto `develop` from the parent's **old** tip: `git rebase --onto origin/develop <old-parent-tip> <child>`. Merging `develop` into a branch that still carries the parent's original commits can produce conflicts (renames, moved files) that have nothing to do with the child.
- When a parent is rewritten, retarget its children (or rebase them) so their diffs show only their own changes.
- After a rebase that resolved conflicts automatically, check the tree: the pull request's own files are unchanged, and every other file matches the new base. A replayed older commit can silently revert newer base content (dependency bumps, other teams' changes).
- If `develop` changed one of the pull request's files for an unrelated reason, merge that file three ways (`git merge-file`) instead of copying either side.
- Rebase before asking for review, not after approval: in this repository, branch protection dismisses existing approvals when new commits are pushed, and a rebase is a push.
- Changesets only for user-visible changes. Check `.changeset/` after every rebase: a rebase can bring back one that was deleted.
