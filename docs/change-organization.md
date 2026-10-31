# Organizing changes

Every change should be easy to review on its own and easy to revert on its own. A feature that takes long to validate should not hold fixes and refactors hostage, and it should not stall behind one huge review. With more code being generated, this matters more, not less. Splitting every small step into its own pull request is the opposite failure: more pull requests to review, rebase and keep green, each with less context.

## Start from the intent

Before writing code, and especially when an agent writes it, state in the draft pull request description:

- **Intent**: what is wanted and why, and what is out of scope.
- **Spec**: the behavior that must hold once it's done, in terms a reviewer or a test can observe.

Keep two lists there as the work goes on:

- **Decisions**: each choice made, why, and the alternatives dropped.
- **Gaps**: behavior known to be missing or wrong, and open questions.

When the work spans more than one pull request or outlives it, the intent and spec go to `docs/proposals/<slug>.md` instead, and a decision that constrains future work becomes an ADR in `docs/adr/`. The XMPP server package runs the full version of this loop: [ee/packages/xmpp-server/docs](../ee/packages/xmpp-server/docs/README.md).

A pull request whose intent, decisions and gaps a reviewer cannot find is still a POC, however much code it has.

## Classify each change

- **fix**: corrects behavior. Ships with a test that fails without it.
- **refactor**: changes structure, not behavior. Existing tests stay green without being edited.
- **feature**: adds behavior.
- **test / chore / ci**: everything else.

A pull request carries one main concern. Fixes and refactors that only enable it may ride along as their own commits, below it. "While I'm here" edits, flags or conditionals for hypothetical cases, and changes a reviewer would call "not related" go elsewhere.

## Draft first, then distribute

While the pull request is a draft, commits accumulate in the order **fixes → refactors → feature**:

- Commit each fix or refactor the moment it's done, as its own commit. Never fold it into a feature commit.
- Keep fixes and refactors below the feature commits (reorder with `git rebase`; `git commit --fixup` with `git rebase --autosquash` keeps follow-ups attached to the right commit).
- Every commit builds and passes tests on its own, so it can be extracted as-is.

Before leaving draft, plan how the work reaches `develop`: a table in the description with each concern, its commits, its size, what it depends on, and whether it is extracted or stays. Extract a change only when it stands on its own in `develop`:

- a fix users would notice,
- a refactor other work needs,
- a change large or risky enough that reviewing it inside the feature would stall the feature.

Everything else stays in the feature pull request as its own commit. Extracted pull requests target `develop`, never another feature branch, and are merged before the feature leaves draft.

The pull request is ready to leave draft when the intent, spec, decisions and gaps are in it, the extractions are merged and CI is green. Until then it is a POC.

Agents may iterate on their own in loops while the work is a POC, or once the intent and spec define the expected behavior. Opening a pull request, the feature's or an extraction's, and taking one out of draft are a person's decisions. An agent proposes the distribution table; it does not do either on its own.

If the POC is dropped, the fixes and refactors that meet the criteria above are still extracted: that work isn't lost with the feature.

When a large mixed pull request already exists, propose the distribution before touching it.

## Rebasing after an extraction merges

Pull requests are squash-merged, so once an extraction lands, the feature branch still carries the extraction's original commits:

- Rebase the feature onto `develop` from the extraction's **old** tip: `git rebase --onto origin/develop <old-extraction-tip> <feature>`. Merging `develop` into a branch that still carries the original commits can produce conflicts (renames, moved files) that have nothing to do with the feature.
- After a rebase that resolved conflicts automatically, check the tree: the pull request's own files are unchanged, and every other file matches the new base. A replayed older commit can silently revert newer base content (dependency bumps, other teams' changes).
- If `develop` changed one of the pull request's files for an unrelated reason, merge that file three ways (`git merge-file`) instead of copying either side.
- Rebase before asking for review, not after approval: in this repository, branch protection dismisses existing approvals when new commits are pushed, and a rebase is a push.
- Changesets only for user-visible changes. Check `.changeset/` after every rebase: a rebase can bring back one that was deleted.
