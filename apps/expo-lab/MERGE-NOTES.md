# Merge notes: feat/expo-lab-all

The branch is `origin/develop` (cfeded83a54) plus the open Fuselage to Tamagui conversion PRs, with the expo-lab commits of `feat/expo-lab` on top. Rebuilt on 2026-11-26 after the PR authors updated #43674, #43653, #43671, #43679 and #43706; the rebuild section at the end lists what changed.

## Order and method

The PR heads are not stacked in git: each is a set of commits on the same older develop (merge base 201234ee744), none contains another. The foundation (#43815, #43821) is already in develop. They were applied with `git cherry-pick` of each PR's own commits (a merge of each head would have carried the old base along), in this order, which follows the dependencies in the PR bodies:

1. #43668 `refactor/fuselage-l4-l6-prerequisites` (8 commits)
2. #43674 `feat/fuselage-tamagui-icon` (1)
3. #43653 L1 actions (10)
4. #43658 L2 indicators (11)
5. #43671 L3 forms and lists (8)
6. #43679 L4 structure (7)
7. #43693 L5 shell (6)
8. #43706 L6 messages (5)
9. Two integration commits (below).
10. The five expo-lab commits (`chore: add expo-lab app` to `feat(expo-lab): chat prototype with login and live messages`), then one commit refreshing `yarn.lock`, then the gallery commit.

`feat/expo-lab` was not touched. No PR was skipped.

## Conflicts and resolutions

Git's `rerere` cache replayed some resolutions from earlier work in this repository; each was inspected, none left markers.

| PR | File | Resolution |
| --- | --- | --- |
| L1 | `Chip/Chip.tsx`, `Chip.styles.scss` | The prerequisite PR moved Chip's margins; L1 rewrites Chip as a frame. Kept the PR content. |
| L1 | `Button/Button.styles.scss` | The prerequisite PR split the icon rules into `IconButton.styles.scss`; L1 rewrites both. Kept L1's file, and deleted `IconButton.styles.scss` and its `@use` in `components/index.scss`, since L1 removes the same rules and the frames own them. |
| L1, L4, L5, L6 | `scripts/verify/css-hacks.baseline.json` | Took the PR's file at each step, then regenerated it at the end (`node scripts/verify/css-hacks.mjs --write`); `verify:css-hacks:check` passes. |
| L2 | `docs/frontend/fuselage-tamagui-components.md` | Both Deviations rows kept. |
| L3 | `Label/*` | The prerequisite PR gave Label's mark and info their own styles; L3 renders Label as a frame. Kept L3. |
| L3 | `Item/Item.tsx`, `Item.styles.scss`, `ItemGroupHeader.tsx`, `Message/Message.tsx` | Develop gained `insetBlock`, `divided` and a sticky-header surface (#43274) after the PR was cut. Kept the PR's frames, then ported the behaviour (see below). `.oxlintrc.json`: union of both `safeCalls` lists. |
| L4 | `types/WebAttributes.ts` | Both sets of types kept. |
| L4 | `tamagui.config.ts` | L3 moved the media keys to `tamagui.media.ts`; L4 added `sm` and `md` inline. Kept the config on `media` and added `sm` and `md` to `tamagui.media.ts`. `tamagui.config.spec.ts` updated to expect them. |
| L4 | `Contextualbar/ContextualbarEmptyContent.tsx`, `ContextualbarSkeleton.tsx` | Develop gained `iconVariation` and a `ContextualbarSkeletonContent` (#43274). Kept L4's frames and re-added `iconVariation`; the skeleton frame now lives in `ContextualbarSkeletonContent.tsx` (generator target in `scripts/frame-values/Contextualbar.mts` moved with it). `ContextualbarSkeletonContentProps` narrowed to `{ className?: string }`: the frame cannot spread arbitrary element props. |
| L4 | `Table/Table.styles.scss`, `Contextualbar/Contextualbar.styles.scss` | `[class][class]` rule from L1 kept; `--rcx-surface` from develop kept. |
| L5 | `NavBar/NavBar.styles.scss` | Kept L5. |
| L5 | `Sidepanel/Sidepanel.styles.scss` | Kept L5's reduced file, with L3's interim `&--divider[class]` bump. |
| L5 | `Sidebar/Sidebar.styles.scss` | Union of L3's `[class]` bumps and L5's rewrite (replayed from the cache). |
| L6 | `Message/Message.tsx`, `MessageHeader.tsx`, `MessageMetrics.styles.scss`, `types/WebAttributes.ts` | Replayed from the cache; L6's frames kept over develop's `gap` change to the metrics. |
| expo-lab | `yarn.lock` | Took the base lock for each of the three commits that touch it, then ran `yarn install`; one commit records the result. `yarn install --immutable` passes. |

## Develop changes carried onto the frames

Commit `chore(fuselage): carry develop's Item insetBlock and divided, and Throbber x4, onto the Tamagui frames`:

- `Item`, `ItemGroupHeader` and `Message` take `insetBlock` (block padding variants in `scripts/frame-values/Item.mts`) and `divided` (a class and a rule in `Item.styles.scss`; the bottom rule is a pseudo-element). A sticky `ItemGroupHeader` paints `var(--rcx-surface)` through two rules in `Item.styles.scss`, and gets an `--interactive` class for its hover state. The legacy `theme('item-color-*')` overrides are not carried, as in L3.
- `Throbber` keeps the `x4` step: develop's `AudioPlayerControls` passes `size='x4'`, which L2's closed scale rejected (type error). Added to the contract and the generator.

## Known leftovers

- Stylelint reports `no-duplicate-selectors` for `&__panel--expanded` in `Sidebar.styles.scss`; the same duplicate is in the L5 head itself.
- `Table.styles.scss` still carries the `[class][class]` rule whose Deviation row says it goes when Table migrates (L4 migrates Table).
- The CSS-hack baseline was regenerated from the combined tree, so counts are the combined tree's, not any single PR's.

## Rebuild after the PR updates (2026-11-26)

`origin/develop` did not move (still cfeded83a54), all eight PRs are open on `develop`, none restacked. Heads before and after (the old ones are the previous `origin/<branch>` values from the reflog):

| PR | Before | After | Change |
| --- | --- | --- | --- |
| #43668 prerequisites | c742a5cc822 | c742a5cc822 | none |
| #43674 Icon | eac65af23a7 | 580d2ab6e33 | changeset only |
| #43653 L1 | 4a9e8ad63ab | 83714dde7fb | `Button.tsx` (+67): label colour and alignment on the `Text`; `Chip.tsx`: the `color: 'inherit'` replaced by an explicit `chipTextLooks` colour per state |
| #43658 L2 | c8135345c65 | c8135345c65 | none |
| #43671 L3 | c9bb3cf115d | b55ca11c534 | `Item*` frames: 31 lines (generator and frames) |
| #43679 L4 | a9c3480ba32 | e0de00fb102 | `className` in six `apps/meteor` row components and two e2e files; `ThreadChat.tsx` |
| #43693 L5 | 38076448cd0 | 38076448cd0 | none |
| #43706 L6 | 2ced9828ea4 | 093e20041ac | `Divider.styles.scss`: the labelled message divider rule moves there |

Same method as before (`git cherry-pick origin/develop..origin/<head>` per PR, in the same order, rerere on). New or changed resolutions:

| PR | File | Resolution |
| --- | --- | --- |
| L1 | `Chip/Chip.tsx`, `Chip.styles.scss` | The generated block changed on the head, so the cached resolution no longer applied; took the PR's files. |
| L3 | `Label/*`, `Item/*`, `Message/Message.tsx` | The cached resolution marked them conflicted again; took the PR's files (the develop behaviour is carried by the integration commit, which applied cleanly). |
| L4 | `tamagui.config.ts`, `tamagui.media.ts`, `tamagui.config.spec.ts` | Same as before (config on `media`, `sm` and `md` in `tamagui.media.ts`), restored from the previous tip. |
| L4 | `ThreadChat.tsx` | New. The head moved the drop-target props onto an inner `Box`; develop now has `ThreadChatSection`, so kept develop's file. |
| L4 | `Contextualbar/Contextualbar.styles.scss` | Modify/delete. The head deletes it; accepted the deletion. The previous tip had kept it, but nothing imports it, so it was dead. Consequence: the `--rcx-surface` custom property it declared (read by the sticky `ItemGroupHeader` rule, with a fallback) is declared nowhere, as it effectively was before. |
| L4 | `ContextualbarSkeletonContent.tsx`, generator `Contextualbar.mts` | Restored from the previous tip (frame moved out of `ContextualbarSkeleton.tsx`). |
| L6 | `Divider/Divider.styles.scss` | New. The head restores the whole legacy file; kept L2's reduced file (only the bar `::after`) and added the `.rcx-message-divider.rcx-divider--labelled` rule the head moves there. |
| L6 | `Message/MessageMetrics/MessageMetrics.styles.scss` | Modify/delete; accepted the deletion (was dead, as above). |
| baselines | `css-hacks.baseline.json`, `selector-inventory.baseline.json` | Both regenerated from the combined tree (`--write`); the selector baseline now lists the labelled message divider override. |

The develop-carried commit (Item `insetBlock` and `divided`, Throbber `x4`) applied unchanged and is still needed. `iconVariation` on `ContextualbarEmptyContent` is still missing on the L4 head and still ported.
