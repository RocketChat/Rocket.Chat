# Organizing changes

Every change should be easy to review on its own and easy to revert on its own. A feature that takes long to validate should not hold fixes and refactors hostage, and it should not stall behind one huge review. With more code being generated, this matters more, not less. Splitting every small step into its own pull request is the opposite failure: more pull requests to review, rebase and keep green, each with less context.

## Start from a clear definition

Before writing code, and especially when an agent writes it, the draft pull request description says clearly what is wanted, why, what is out of scope, and how a reviewer can tell it works. It doesn't need to be formal. As the work goes on, it keeps two lists:

- **Decisions**: the choices a person made, why, and the alternatives dropped. A choice an agent made on its own is not a decision yet: it goes under gaps until a person confirms it.
- **Gaps**: behavior known to be missing or wrong, and open questions.

A pull request whose definition and decisions a reviewer cannot find is still a POC, however much code it has.

A feature that changes how something works also changes its notes in `docs/features/`, in the same pull request. When the work spans more than one pull request, its definition goes to `docs/proposals/<slug>.md`, and a decision that constrains future work becomes an ADR in `docs/adr/`.

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

Everything else stays in the feature pull request as its own commit. Squash merge folds those commits into the feature's, so they are reverted together with it; that is accepted for changes small enough to stay. Extracted pull requests target `develop`, never another feature branch, and are merged before the feature leaves draft.

The pull request is ready to leave draft when its definition and decisions are in it, the gaps left are ones a person accepted, the feature notes are updated, the extractions are merged and CI is green. Until then it is a POC.

Agents may iterate on their own in loops while the work is a POC, or once the definition settles the expected behavior. Opening a pull request, the feature's or an extraction's, and taking one out of draft are a person's decisions. An agent proposes the distribution table; it does not do either on its own. When an agent finds a fix users would notice while the feature is still a POC, it asks the developer whether to extract it right away, so it can ship or be backported without waiting for the feature. Claude Code asks for confirmation before `gh pr create` and `gh pr ready` in this repository (`.claude/settings.json`).

If the POC is dropped, the fixes and refactors that meet the criteria above are still extracted: that work isn't lost with the feature.

When a large mixed pull request already exists, propose the distribution before touching it.

## Rebasing after an extraction merges

Pull requests are squash-merged, so once an extraction lands, the feature branch still carries the extraction's original commits:

- Rebase the feature onto `develop` from the extraction's **old** tip: `git rebase --onto origin/develop <old-extraction-tip> <feature>`. Merging `develop` into a branch that still carries the original commits can produce conflicts (renames, moved files) that have nothing to do with the feature.
- After a rebase that resolved conflicts automatically, check the tree: the pull request's own files are unchanged, and every other file matches the new base. A replayed older commit can silently revert newer base content (dependency bumps, other teams' changes).
- If `develop` changed one of the pull request's files for an unrelated reason, merge that file three ways (`git merge-file`) instead of copying either side.
- Rebase before asking for review, not after approval: in this repository, branch protection dismisses existing approvals when new commits are pushed, and a rebase is a push.
- Changesets only for user-visible changes. Check `.changeset/` after every rebase: a rebase can bring back one that was deleted.
